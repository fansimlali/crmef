import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, CycleKey, SubscriptionRequest } from '../types';
import {
  generateSecureSessionId,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts
} from '../lib/security';
import { logReceiptUploadAttempt, recordUpgradeClick } from '../lib/receiptLogger';
import { getStoredReferralCode, getSignupFingerprint, clearStoredReferralCode } from '../lib/referral';

/** هل أكّد المستخدم بريده؟ (إلزامي للدخول — لا دخول ببريد غير مؤكَّد). */
function isEmailConfirmed(authUser: User): boolean {
  return !!authUser.email_confirmed_at;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    cycle: CycleKey,
    examId?: string
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  answeredQuestionIds: Set<string>;
  markQuestionAnswered: (
    questionId: string,
    chosenAnswer: string | null
  ) => Promise<{ success: boolean; isCorrect?: boolean; correctAnswer?: string; explanation?: string }>;
  // إدارة الاشتراكات
  subscriptionRequests: SubscriptionRequest[];
  currentRequest: SubscriptionRequest | null;
  submitSubscriptionRequest: (
    receipt: File,
    paymentMethod: string,
    plan: 'all' | 'single',
    examId?: string | null,
    trackCycle?: CycleKey | null
  ) => Promise<{ success: boolean; error?: string }>;
  approveSubscription: (requestId: string) => Promise<boolean>;
  rejectSubscription: (requestId: string, reason: string) => Promise<boolean>;
  suspendSubscription: (requestId: string) => Promise<boolean>;
  deleteSubscription: (requestId: string) => Promise<boolean>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  /** إعادة تحميل ملف المستخدم من الخادم (بعد تثبيت المسلك أو تغيّر الصلاحيات). */
  refreshProfile: () => Promise<void>;
  // نافذة الترقية
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
  // نافذة استعادة كلمة المرور
  passwordRecoveryOpen: boolean;
  setPasswordRecoveryOpen: (open: boolean) => void;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  subscription_status: string | null;
  cycle: string | null;
  premium_scope: string | null;
  /** المسلك/السلك المختار لكل مباراة: { exam_id: cycle_key } */
  exam_tracks: Record<string, string> | null;
  premium_until?: string | null;
  premium_source?: string | null;
  referral_reward_granted_at?: string | null;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  cycle: string | null;
  plan: string | null;
  premium_scope: string | null;
  amount_mad: number | null;
  receipt_url: string | null;
  receipt_path: string | null;
  payment_method: string | null;
  notes: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROGRESS_KEY_PREFIX = 'crmef_progress_';
const VALID_CYCLES: CycleKey[] = ['primary', 'secondary_prep', 'secondary_qual'];
const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/octet-stream',
];
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10MB (الضغط في المتصفح يقلصها إلى أقل من 1MB تلقائياً)

/** ترجمة رسائل Supabase إلى رسائل عربية واضحة دون كشف تفاصيل داخلية. */
function translateAuthError(message: string | undefined): string {
  const msg = (message || '').toLowerCase();
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى الضغط على رابط التفعيل المرسل إلى بريدك (أو مجلد SPAM).';
  }
  if (msg.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (msg.includes('already registered') || msg.includes('user already registered')) {
    return 'هذا البريد الإلكتروني مستخدم من قبل، جرب بريداً إلكترونياً آخر.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
  }
  if (msg.includes('password should be') || msg.includes('weak password')) {
    return 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.';
  }
  return 'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';
}

function normalizeCycle(value: unknown): CycleKey {
  return VALID_CYCLES.includes(value as CycleKey) ? (value as CycleKey) : 'primary';
}

/** لا نعرض إلا وصلات قديمة آمنة (data:image أو https)؛ أي شيء آخر يُستبعد. */
function safeLegacyReceiptUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(value)) return value;
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

function buildProfile(authUser: User, row?: ProfileRow | null): UserProfile {
  return {
    id: authUser.id,
    email: authUser.email || row?.email || '',
    fullName:
      row?.full_name ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      authUser.email?.split('@')[0] ||
      '',
    // الدور وحالة الاشتراك يُقرآن حصراً من جدول profiles المحمي بـ RLS.
    role: row?.role === 'admin' ? 'admin' : 'user',
    subscriptionStatus: row?.subscription_status === 'premium' ? 'premium' : 'trial',
    premiumScope: row?.premium_scope || 'all',
    premiumUntil: row?.premium_until ?? null,
    premiumSource: normalizePremiumSource(row?.premium_source),
    referralRewardGrantedAt: row?.referral_reward_granted_at ?? null,
    cycle: normalizeCycle(row?.cycle ?? authUser.user_metadata?.cycle),
    // المسلك/السلك المختار لكل مباراة (مباراة → سلك). يسقط إلى `cycle` عند غيابه.
    examTracks: normalizeExamTracks(row?.exam_tracks),
    sessionId: generateSecureSessionId(),
  };
}

/** مصدر الاشتراك المعروف فقط؛ أي قيمة أخرى تُهمَل. */
function normalizePremiumSource(value: unknown): UserProfile['premiumSource'] {
  return value === 'paid' || value === 'referral' || value === 'admin' ? value : null;
}

/** خريطة المسالك per exam: تُقبل القيم المعروفة فقط (وإلا تُهمَل). */
function normalizeExamTracks(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([examId, cycle]) => {
    if (VALID_CYCLES.includes(cycle as CycleKey)) out[examId] = cycle as string;
  });
  return out;
}

function mapSubscriptionRow(row: SubscriptionRow): SubscriptionRequest {
  const isSuspended = row.status === 'suspended' || 
    (row.status === 'rejected' && Boolean(row.rejection_reason?.includes('[SUSPENDED]') || row.rejection_reason?.includes('تعليق الاشتراك')));

  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name || row.user_email,
    cycle: normalizeCycle(row.cycle),
    plan: row.plan === 'single' ? 'single' : 'all',
    premiumScope: row.plan === 'single' && row.premium_scope ? row.premium_scope : undefined,
    amountMad: row.amount_mad != null ? Number(row.amount_mad) : undefined,
    // لا نخزّن وصلات عامة: الصورة خاصة ويتم توليد رابط موقّع مؤقت لها.
    // الصفوف القديمة قد تحتوي data URL أو رابط https فقط.
    receiptUrl: row.receipt_path ? '' : safeLegacyReceiptUrl(row.receipt_url),
    receiptPath: row.receipt_path || undefined,
    paymentMethod: row.payment_method || undefined,
    notes: row.notes || undefined,
    status: isSuspended 
      ? 'suspended' 
      : ((['approved', 'rejected'].includes(row.status) ? row.status : 'pending') as SubscriptionRequest['status']),
    rejectionReason: row.rejection_reason 
      ? row.rejection_reason.replace('[SUSPENDED]', '').trim() 
      : undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [passwordRecoveryOpen, setPasswordRecoveryOpen] = useState(false);

  // ───────────────────────────── تحميل الملف الشخصي ─────────────────────────────
  const loadProfile = useCallback(async (authUser: User): Promise<UserProfile> => {
    if (!supabase) return buildProfile(authUser);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, subscription_status, cycle, premium_scope, exam_tracks, premium_until, premium_source, referral_reward_granted_at')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        // الجدول غير مهيأ بعد: نعمل بحساب تجريبي آمن بدل تعطيل الدخول بالكامل.
        console.warn('profiles table unavailable:', error.message);
        return buildProfile(authUser);
      }

      if (data) return buildProfile(authUser, data as ProfileRow);

      // إن لم يُنشئ المشغّل (trigger) الملف، ننشئه بقيم آمنة لا يمكن للمستخدم تجاوزها.
      const seed: ProfileRow = {
        id: authUser.id,
        email: authUser.email || '',
        full_name:
          (authUser.user_metadata?.full_name as string | undefined) ||
          authUser.email?.split('@')[0] ||
          '',
        role: 'user',
        subscription_status: 'trial',
        premium_scope: 'all',
        cycle: normalizeCycle(authUser.user_metadata?.cycle),
        exam_tracks: normalizeExamTracks(
          authUser.user_metadata?.exam_id
            ? { [String(authUser.user_metadata.exam_id)]: normalizeCycle(authUser.user_metadata?.cycle) }
            : null
        ),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(seed)
        .select('id, email, full_name, role, subscription_status, cycle, premium_scope, exam_tracks')
        .maybeSingle();

      if (insertError) {
        console.warn('profiles auto-create failed:', insertError.message);
        return buildProfile(authUser, seed);
      }

      return buildProfile(authUser, (inserted as ProfileRow | null) ?? seed);
    } catch (err) {
      console.warn('loadProfile error:', err);
      return buildProfile(authUser);
    }
  }, []);

  // ───────────────────────────── مزامنة الاستحقاقات ─────────────────────────────
  // تُطبّق مهلة premium_until فور الدخول حتى لو لم تكن مهمة pg_cron مفعّلة،
  // وتعيد تقييم أهلية الإحالة (بعد تأكيد البريد مثلاً).
  const syncServerEntitlements = useCallback(async () => {
    if (!supabase) return;
    try {
      await Promise.all([
        supabase.rpc('refresh_my_subscription'),
        supabase.rpc('refresh_my_referral_status'),
      ]);
    } catch {
      /* قاعدة قديمة بلا الهجرة: نتجاهل بهدوء */
    }
  }, []);

  // ───────────────────────────── تحميل التقدم ─────────────────────────────
  const loadUserProgress = useCallback(async (userId: string) => {
    // ذاكرة محلية للعرض السريع، والمصدر الموثوق هو question_progress في Supabase.
    try {
      const cached = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${userId}`);
      if (cached) setAnsweredQuestionIds(new Set(JSON.parse(cached) as string[]));
    } catch {
      setAnsweredQuestionIds(new Set());
    }

    if (!supabase) return;

    try {
      const client = supabase;
      // تصفية حتى لا يُقصّ التقدم عند تجاوز 1000 سؤال.
      const PAGE = 1000;
      let offset = 0;
      const ids: string[] = [];
      for (;;) {
        const { data, error } = await client
          .from('question_progress')
          .select('question_id')
          .eq('user_id', userId)
          .range(offset, offset + PAGE - 1);
        if (error) {
          console.warn('question_progress unavailable:', error.message);
          return;
        }
        if (!data || data.length === 0) break;
        ids.push(...data.map((row) => row.question_id as string));
        if (data.length < PAGE) break;
        offset += PAGE;
      }
      setAnsweredQuestionIds(new Set(ids));
      try {
        localStorage.setItem(`${PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(ids));
      } catch {
        /* تجاهل امتلاء التخزين المحلي */
      }
    } catch (err) {
      console.warn('loadUserProgress error:', err);
    }
  }, []);

  // ───────────────────────────── تحميل طلبات الاشتراك ─────────────────────────────
  const refreshSubscriptions = useCallback(async (profile: UserProfile) => {
    if (!supabase) return;

    try {
      let query = supabase.from('subscription_requests').select('*');
      // المشرف يرى الجميع، والمستخدم يرى طلباته فقط (RLS تفرض ذلك أيضاً).
      if (profile.role !== 'admin') query = query.eq('user_id', profile.id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.warn('subscription_requests unavailable:', error.message);
        setSubscriptionRequests([]);
        return;
      }

      const mapped = await Promise.all(
        ((data || []) as SubscriptionRow[]).map(async (row) => {
          const request = mapSubscriptionRow(row);
          if (row.receipt_path) {
            const { data: signed } = await supabase!.storage
              .from('receipts')
              .createSignedUrl(row.receipt_path, 60 * 60);
            if (signed?.signedUrl) request.receiptUrl = signed.signedUrl;
          }
          return request;
        })
      );

      setSubscriptionRequests(mapped);
    } catch (err) {
      console.warn('refreshSubscriptions error:', err);
      setSubscriptionRequests([]);
    }
  }, []);

  // ───────────────────────────── مراقبة أحداث المصادقة ─────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryOpen(true);
        // تنظيف الهاش حتى لا يُعاد فتح نافذة الاستعادة عند تحديث الصفحة.
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
          /* تجاهل */
        }
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAnsweredQuestionIds(new Set());
        setSubscriptionRequests([]);
      }
    });

    if (window.location.hash.includes('type=recovery')) setPasswordRecoveryOpen(true);

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ───────────────────────────── استعادة الجلسة عند الإقلاع ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data?.session?.user) {
          // جلسة غير مؤكَّدة البريد لا تُمنح دخولاً.
          if (!isEmailConfirmed(data.session.user)) {
            try {
              await supabase.auth.signOut();
            } catch {
              /* تجاهل */
            }
            return;
          }
          await syncServerEntitlements();
          const profile = await loadProfile(data.session.user);
          if (cancelled) return;
          setUser(profile);
          await loadUserProgress(profile.id);
        }
      } catch (err) {
        console.warn('initAuth error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initAuth();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, loadUserProgress, syncServerEntitlements]);

  // تحديث الجلسة عند تأكيد البريد أو تجديد الرمز أو تغيير الحالة في تبويب آخر.
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          if (!isEmailConfirmed(session.user)) {
            await client.auth.signOut();
            return;
          }
          await syncServerEntitlements();
          const profile = await loadProfile(session.user);
          setUser(profile);
          await loadUserProgress(profile.id);
        } catch (err) {
          console.warn('auth state refresh error:', err);
        }
      }
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile, loadUserProgress, syncServerEntitlements]);

  // تحديث طلبات الاشتراك كلما تغيّر المستخدم أو دوره
  useEffect(() => {
    if (user) void refreshSubscriptions(user);
    else setSubscriptionRequests([]);
  }, [user, refreshSubscriptions]);

  /**
   * إعادة تحميل ملف المستخدم من الخادم (يُستخدم بعد تثبيت المسلك أو تغيّر الصلاحيات).
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data } = await supabase.auth.getSession();
      const sessUser = data?.session?.user;
      if (!sessUser) return;
      const fresh = await loadProfile(sessUser);
      if (fresh) setUser(fresh);
    } catch (err) {
      console.warn('refreshProfile error:', err);
    }
  }, [loadProfile]);

  // انعكاس الترقية فوراً: إعادة جلب الملف دورياً وعند عودة التركيز.
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const refetchProfile = async () => {
      if (!isSupabaseConfigured() || !supabase) return;
      try {
        const { data } = await supabase.auth.getSession();
        const sessUser = data?.session?.user;
        if (!sessUser || sessUser.id !== userId || !sessUser.email_confirmed_at) return;
        const fresh = await loadProfile(sessUser);
        if (!fresh) return;
        setUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          if (
            prev.role === fresh.role &&
            prev.subscriptionStatus === fresh.subscriptionStatus &&
            prev.cycle === fresh.cycle &&
            prev.premiumScope === fresh.premiumScope &&
            prev.premiumUntil === fresh.premiumUntil &&
            prev.premiumSource === fresh.premiumSource &&
            prev.referralRewardGrantedAt === fresh.referralRewardGrantedAt &&
            JSON.stringify(prev.examTracks || {}) === JSON.stringify(fresh.examTracks || {})
          ) {
            return prev;
          }
          // عند الترقية نُغلق نافذة الترقية حتى لا تبدو "عابرة" الغرض.
          if (prev.subscriptionStatus !== 'premium' && fresh.subscriptionStatus === 'premium') {
            setUpgradeModalOpen(false);
          }
          return { ...prev, ...fresh };
        });
        await refreshSubscriptions(fresh);
      } catch (err) {
        console.warn('profile refetch error:', err);
      }
    };

    const timer = window.setInterval(() => void refetchProfile(), 20000);
    const onFocus = () => void refetchProfile();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.id, loadProfile, refreshSubscriptions]);

  // ───────────────────────────── تسجيل الإجابات ─────────────────────────────
  // العميل يرسل خياره فقط؛ الخادم يتحقق منه ويعيد الصحيح والشرح.
  const markQuestionAnswered = async (
    questionId: string,
    chosenAnswer: string | null
  ): Promise<{ success: boolean; isCorrect?: boolean; correctAnswer?: string; explanation?: string }> => {
    const userId = user?.id;
    if (!userId || !supabase) {
      return { success: false };
    }
    const client = supabase;
    try {
      const { data, error } = await client.rpc('answer_question', {
        p_question_id: questionId,
        p_chosen_answer: chosenAnswer,
      });
      if (error) {
        console.warn('answer_question:', error.message);
        if (error.message.includes('TRIAL_QUOTA_EXCEEDED') || error.message.includes('TRIAL_QUESTION_LOCKED')) {
          setUpgradeModalOpen(true);
        }
        return { success: false };
      }
      // نجاح خادمي: نُحدّث التقدم المحلي.
      setAnsweredQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(questionId);
        try {
          localStorage.setItem(`${PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(Array.from(next)));
        } catch {
          /* تجاهل */
        }
        return next;
      });
      const payload = data as { is_correct?: boolean; correct_answer?: string; explanation?: string } | null;
      return {
        success: true,
        isCorrect: payload?.is_correct ?? false,
        correctAnswer: payload?.correct_answer,
        explanation: payload?.explanation,
      };
    } catch (err) {
      console.warn('answer_question network error:', err);
      return { success: false };
    }
  };

  // ───────────────────────────── تسجيل الدخول ─────────────────────────────
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const rateCheck = checkLoginRateLimit();
    if (rateCheck.locked) {
      return {
        success: false,
        error: `تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى الانتظار ${rateCheck.remainingSeconds} ثانية.`,
      };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'خدمة المصادقة غير مهيأة. يرجى ضبط إعدادات Supabase في متغيرات البيئة وإعادة النشر.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        recordFailedLogin();
        return { success: false, error: translateAuthError(error.message) };
      }

      if (!data.user) {
        recordFailedLogin();
        return { success: false, error: 'تعذر إنشاء الجلسة. يرجى المحاولة مجدداً.' };
      }

      // إلزام تأكيد البريد: لا دخول قبل الضغط على رابط التأكيد في الرسالة.
      if (!isEmailConfirmed(data.user)) {
        try {
          await supabase.auth.signOut();
        } catch {
          /* تجاهل */
        }
        recordFailedLogin();
        return {
          success: false,
          error: 'email_not_confirmed: لم يتم تأكيد بريدك الإلكتروني بعد. افتح رسالة التأكيد واضغط على الرابط أولاً.',
        };
      }

      resetLoginAttempts();
      const profile = await loadProfile(data.user);
      setUser(profile);
      await loadUserProgress(profile.id);
      return { success: true };
    } catch (err) {
      console.warn('login error:', err);
      recordFailedLogin();
      return { success: false, error: 'تعذر الاتصال بخدمة المصادقة. تحقق من اتصالك بالإنترنت.' };
    }
  };

  // ───────────────────────────── إنشاء حساب ─────────────────────────────
  const signup = async (
    email: string,
    password: string,
    fullName: string,
    cycle: CycleKey,
    examId?: string
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صالح' };
    }
    if (!fullName || fullName.trim().length < 3) {
      return { success: false, error: 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)' };
    }
    if (password.length < 6) {
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'خدمة التسجيل غير مهيأة. يرجى ضبط إعدادات Supabase في متغيرات البيئة وإعادة النشر.',
      };
    }

    try {
      // الإحالة تُقرأ من التخزين المحلي (التقطها main.tsx من ?ref=).
      // تُرسل داخل raw_user_meta_data ليقرأها trigger handle_new_user على الخادم.
      const referralCode = getStoredReferralCode();
      const signupFingerprint = getSignupFingerprint();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // لا نرسل role أو subscription_status: يُحدَّدان على الخادم فقط.
          // exam_id + cycle = «المباراة والمسلك» المختاران عند التسجيل (يكتبهما trigger).
          data: {
            full_name: fullName.trim(),
            cycle: normalizeCycle(cycle),
            ...(examId ? { exam_id: String(examId).trim().toLowerCase() } : {}),
            ...(referralCode ? { ref_code: referralCode } : {}),
            // بصمة جهاز اختيارية: تُستخدم علماً للمراجعة فقط، لا تمنع التسجيل.
            ...(signupFingerprint ? { signup_fingerprint: signupFingerprint } : {}),
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      // Supabase تعيد مستخدماً بدون identities عند تكرار البريد.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return { success: false, error: translateAuthError('user already registered') };
      }

      // تم إنشاء الحساب فعلاً؛ ننظّف الكود المحلي حتى لا يُنسب حساب لاحق
      // في نفس المتصفح إلى نفس الرابط بالخطأ.
      if (referralCode) clearStoredReferralCode();

      // إذا كان تأكيد البريد معطلاً في إعدادات Supabase، تُعاد جلسة مباشرة:
      // نُكمل تسجيل الدخول بدل إظهار رسالة "تفقد بريدك" بلا جدوى.
      if (data.session && data.user) {
        const profile = await loadProfile(data.user);
        setUser(profile);
        await loadUserProgress(profile.id);
        return { success: true };
      }

      // تأكيد البريد مفعّل: نُنهي أي جلسة ضمنية ونطلب من المستخدم تأكيد بريده.
      await supabase.auth.signOut();
      return { success: true, needsEmailConfirmation: true };
    } catch (err) {
      console.warn('signup error:', err);
      return { success: false, error: 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.' };
    }
  };

  // ───────────────────────────── استعادة كلمة المرور ─────────────────────────────
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صالح' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'خدمة استعادة كلمة المرور غير مهيأة. يرجى ضبط إعدادات Supabase أولاً.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      return { success: true };
    } catch (err) {
      console.warn('resetPassword error:', err);
      return { success: false, error: 'تعذر إرسال رابط إعادة التعيين. تحقق من اتصالك بالإنترنت.' };
    }
  };

  // ───────────────────────────── تسجيل الخروج ─────────────────────────────
  const logout = async () => {
    const userId = user?.id;
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('signOut error:', err);
      }
    }
    setUser(null);
    setAnsweredQuestionIds(new Set());
    setSubscriptionRequests([]);
    setUpgradeModalOpen(false);
    setPasswordRecoveryOpen(false);
    // مسح بقايا المستخدم على الجهاز المشترك.
    try {
      if (userId) localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${userId}`);
      sessionStorage.removeItem('crmef_login_attempts');
    } catch {
      /* تجاهل */
    }
  };

  // ───────────────────────────── فتح نافذة الترقية وتسجيل النقرة ─────────────────────────────
  const handleSetUpgradeModalOpen = useCallback((open: boolean) => {
    setUpgradeModalOpen(open);
    if (open) {
      recordUpgradeClick(user?.id, user?.email);
    }
  }, [user?.id, user?.email]);

  // أحدث طلب اشتراك للمستخدم الحالي
  const currentRequest = user
    ? subscriptionRequests.find((r) => r.userId === user.id) || null
    : null;

  // ───────────────────────────── تقديم طلب اشتراك ─────────────────────────────
  const submitSubscriptionRequest = async (
    receipt: File,
    paymentMethod: string,
    plan: 'all' | 'single',
    examId?: string | null,
    trackCycle?: CycleKey | null
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً لتقديم طلب الاشتراك' };
    }
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'خدمة الاشتراكات غير مهيأة. يرجى المحاولة لاحقاً.' };
    }
    if (currentRequest?.status === 'pending') {
      return { success: false, error: 'لديك طلب قيد المراجعة بالفعل. يرجى انتظار قرار المشرف.' };
    }
    if (plan === 'single' && !examId) {
      return { success: false, error: 'اختر المباراة التي تريد الاشتراك بها أولاً.' };
    }
    // الخطة الفردية تُحدد النطاق بمعرّف المباراة؛ الشامل يفتح كل المباريات.
    const requestedScope = plan === 'single' ? String(examId) : 'all';
    const requestedAmount = plan === 'single' ? 50 : 100;

    const isImageFile = receipt.type.startsWith('image/') || 
      ALLOWED_RECEIPT_TYPES.includes(receipt.type) || 
      /\.(jpe?g|png|webp|heic|heif)$/i.test(receipt.name);

    if (!isImageFile) {
      const err = 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.';
      await logReceiptUploadAttempt({
        userId: user.id,
        userEmail: user.email,
        fileName: receipt.name,
        fileSize: receipt.size,
        fileType: receipt.type,
        status: 'failed',
        errorMessage: err,
      });
      return { success: false, error: err };
    }

    if (receipt.size > MAX_RECEIPT_BYTES) {
      const err = 'حجم الصورة كبير جداً (الحد الأقصى 10 ميغابايت).';
      await logReceiptUploadAttempt({
        userId: user.id,
        userEmail: user.email,
        fileName: receipt.name,
        fileSize: receipt.size,
        fileType: receipt.type,
        status: 'failed',
        errorMessage: err,
      });
      return { success: false, error: err };
    }

    const extension = (receipt.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const receiptPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(receiptPath, receipt, {
          cacheControl: '3600',
          upsert: false,
          contentType: receipt.type || 'image/jpeg',
        });

      if (uploadError) {
        console.warn('receipt upload error:', uploadError.message);
        await logReceiptUploadAttempt({
          userId: user.id,
          userEmail: user.email,
          fileName: receipt.name,
          fileSize: receipt.size,
          fileType: receipt.type,
          status: 'failed',
          errorMessage: uploadError.message,
        });
        return {
          success: false,
          error: 'تعذر رفع صورة الوصل إلى المخزن الآمن. تأكد من تهيئة مخزن receipts في Supabase.',
        };
      }

      const { data, error } = await supabase
        .from('subscription_requests')
        .insert({
          id: `req_${crypto.randomUUID()}`,
          user_id: user.id,
          user_email: user.email,
          user_name: user.fullName,
          // المسلك المطلوب للاشتراك الفردي (يُخزَّن ويكتبه المشرف عند الاعتماد).
          cycle: plan === 'single' && trackCycle ? trackCycle : user.cycle || 'primary',
          plan,
          premium_scope: requestedScope,
          amount_mad: requestedAmount,
          receipt_url: null,
          receipt_path: receiptPath,
          payment_method: paymentMethod,
          notes: null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle();

      if (error) {
        // تنظيف الملف المرفوع حتى لا يبقى يتيماً في المخزن.
        await supabase.storage.from('receipts').remove([receiptPath]);
        console.warn('subscription insert error:', error.message);
        await logReceiptUploadAttempt({
          userId: user.id,
          userEmail: user.email,
          fileName: receipt.name,
          fileSize: receipt.size,
          fileType: receipt.type,
          status: 'failed',
          errorMessage: error.message,
        });
        return { success: false, error: 'تعذر حفظ طلب الاشتراك. يرجى المحاولة مرة أخرى.' };
      }

      // تسجيل المحاولة الناجحة في جدول logs
      await logReceiptUploadAttempt({
        userId: user.id,
        userEmail: user.email,
        fileName: receipt.name,
        fileSize: receipt.size,
        fileType: receipt.type,
        status: 'success',
      });

      if (data) {
        const mapped = mapSubscriptionRow(data as SubscriptionRow);
        setSubscriptionRequests((prev) => [mapped, ...prev]);
      } else {
        await refreshSubscriptions(user);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('submitSubscriptionRequest error:', err);
      await logReceiptUploadAttempt({
        userId: user.id,
        userEmail: user.email,
        fileName: receipt.name,
        fileSize: receipt.size,
        fileType: receipt.type,
        status: 'failed',
        errorMessage: err?.message || 'unknown error',
      });
      return { success: false, error: 'حدث خطأ غير متوقع أثناء إرسال الطلب.' };
    }
  };

  // ───────────────────────────── موافقة المشرف ─────────────────────────────
  const approveSubscription = async (requestId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin' || !supabase) return false;

    const request = subscriptionRequests.find((r) => r.id === requestId);
    if (!request) return false;

    try {
      const reviewedAt = new Date().toISOString();

      // نطاق الاشتراك حسب خطة الطلب: شامل → 'all'، فردي → مباراة الطلب.
      // الطلبات القديمة (قبل الخطتين) تبقى شاملة ('all').
      const approvedScope =
        request.plan === 'single' && request.premiumScope ? request.premiumScope : 'all';

      const { error: requestError } = await supabase
        .from('subscription_requests')
        .update({
          status: 'approved',
          rejection_reason: null,
          reviewed_at: reviewedAt,
          reviewed_by: user.id,
        })
        .eq('id', requestId);

      if (requestError) {
        console.warn('approve request error:', requestError.message);
        return false;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'premium',
          premium_scope: approvedScope,
          updated_at: reviewedAt,
        })
        .eq('id', request.userId);

      if (profileError) {
        console.warn('approve profile error:', profileError.message);
        return false;
      }

      // للاشتراك الفردي: نثبّت المسلك المطلوب في خريطة المسالك (profiles.exam_tracks)
      // حتى يقصر المشترك على مسلك واحد داخل مباراته. يُكتب عبر RPC آمن
      // (تحديث profiles محمي للمشرف فقط) — وإن لم يكن الـ RPC متاحاً نتجاهله
      // (يبقى السلك العام profiles.cycle سارياً).
      if (approvedScope !== 'all') {
        try {
          await supabase.rpc('apply_subscription_scope', {
            p_user_id: request.userId,
            p_exam_id: approvedScope,
            p_cycle: request.cycle || 'primary',
          });
        } catch (rpcErr) {
          console.warn('apply_subscription_scope failed (non-blocking):', rpcErr);
        }
      }

      await refreshSubscriptions(user);
      if (user.id === request.userId) {
        setUser({ ...user, subscriptionStatus: 'premium', premiumScope: approvedScope });
      }
      return true;
    } catch (err) {
      console.warn('approveSubscription error:', err);
      return false;
    }
  };

  // ───────────────────────────── رفض الاشتراك ─────────────────────────────
  const rejectSubscription = async (requestId: string, reason: string): Promise<boolean> => {
    if (!user || user.role !== 'admin' || !supabase) return false;

    try {
      const { error } = await supabase
        .from('subscription_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', requestId);

      if (error) {
        console.warn('reject request error:', error.message);
        return false;
      }

      await refreshSubscriptions(user);
      return true;
    } catch (err) {
      console.warn('rejectSubscription error:', err);
      return false;
    }
  };

  // ───────────────────────────── تعليق الاشتراك مؤقتاً ─────────────────────────────
  const suspendSubscription = async (requestId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin' || !supabase) return false;

    // ابحث عن الطلب في المصفوفة المحلية أو جلبه مباشرة من قاعدة البيانات
    let request = subscriptionRequests.find((r) => r.id === requestId);
    if (!request) {
      // جلب الطلب مباشرة إذا لم يكن في المصفوفة المحلية
      try {
        const { data: freshReq } = await supabase
          .from('subscription_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (freshReq) {
          request = {
            id: freshReq.id,
            userId: freshReq.user_id,
            userEmail: freshReq.user_email || '',
            userName: freshReq.user_name || freshReq.user_email || '',
            cycle: normalizeCycle(freshReq.cycle),
            plan: freshReq.plan === 'single' ? 'single' : 'all',
            premiumScope: freshReq.plan === 'single' && freshReq.premium_scope ? freshReq.premium_scope : undefined,
            status: (freshReq.status === 'approved' || freshReq.status === 'rejected' || freshReq.status === 'suspended') 
              ? freshReq.status 
              : 'pending' as SubscriptionRequest['status'],
            createdAt: freshReq.created_at,
            receiptUrl: '',
            rejectionReason: freshReq.rejection_reason || undefined,
          };
        }
      } catch {
        // تجاهل خطأ الجلب المباشر
      }
    }

    try {
      const reviewedAt = new Date().toISOString();
      const suspensionReason = '[SUSPENDED] تم تعليق الاشتراك مؤقتاً من قِبل المشرف العام.';

      // 1. محاولة تحديث حالة الطلب إلى suspended أولاً
      let { error: requestError } = await supabase
        .from('subscription_requests')
        .update({
          status: 'suspended',
          rejection_reason: suspensionReason,
          reviewed_at: reviewedAt,
          reviewed_by: user.id,
        })
        .eq('id', requestId);

      // إذا كانت قاعدة البيانات تفرض قيد (pending, approved, rejected)، نستخدم status: 'rejected' مع وسم [SUSPENDED] كبديل متوافق 100%
      if (requestError) {
        console.info('suspend using fallback rejected + [SUSPENDED] tag due to DB check constraint');
        const fallback = await supabase
          .from('subscription_requests')
          .update({
            status: 'rejected',
            rejection_reason: suspensionReason,
            reviewed_at: reviewedAt,
            reviewed_by: user.id,
          })
          .eq('id', requestId);
        requestError = fallback.error;
      }

      // 2. إلغاء صلاحية المشترك الكامل في جدول profiles فوراً
      // نحدّث profiles سواء وجدنا الطلب أم لا — نبحث عن user_id من الطلب
      if (request?.userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'trial', premium_scope: 'all', updated_at: reviewedAt })
          .eq('id', request.userId);

        if (profileError) {
          console.warn('suspend profile warning (non-fatal):', profileError.message);
        }

        if (user.id === request.userId) {
          setUser({ ...user, subscriptionStatus: 'trial', premiumScope: 'all' });
        }
      } else if (requestError) {
        // لم نجد الطلب ولم ننجح في تحديث subscription_requests
        console.warn('suspend request error:', requestError.message);
        return false;
      }

      await refreshSubscriptions(user);
      return true;
    } catch (err) {
      console.warn('suspendSubscription error:', err);
      return false;
    }
  };

  // ───────────────────────────── حذف مشترك أو طلب نهائياً ─────────────────────────────
  const deleteSubscription = async (requestId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin' || !supabase) return false;

    const request = subscriptionRequests.find((r) => r.id === requestId);
    if (!request) return false;

    try {
      // 1. حذف صورة الوصل من التخزين السحابي إذا وُجدت
      if (request.receiptPath) {
        try {
          await supabase.storage.from('receipts').remove([request.receiptPath]);
        } catch (storageErr) {
          console.warn('delete receipt storage warning:', storageErr);
        }
      }

      // 2. إذا كان المشترك مفعلاً سابقاً، نعيده إلى الوضع التجريبي
      if (request.status === 'approved') {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'trial', updated_at: new Date().toISOString() })
          .eq('id', request.userId);
      }

      // 3. حذف السجل نهائياً من قاعدة البيانات
      const { error: deleteError } = await supabase
        .from('subscription_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.warn('delete subscription error:', deleteError.message);
        return false;
      }

      await refreshSubscriptions(user);
      return true;
    } catch (err) {
      console.warn('deleteSubscription error:', err);
      return false;
    }
  };

  // ───────────────────────────── حذف حساب مستخدم نهائياً من قاعدة البيانات ─────────────────────────────
  const deleteUserAccount = async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'admin' || !supabase) {
      return { success: false, error: 'غير مصرح: هذه العملية مخصصة للمشرف العام فقط.' };
    }
    if (targetUserId === user.id) {
      return { success: false, error: 'لا يمكنك حذف حساب المشرف العام الحالي.' };
    }

    try {
      // 1. محاولة استدعاء الدالة البرمجية الخادمة الشاملة RPC
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        target_user_id: targetUserId,
      });

      if (!rpcError) {
        await refreshSubscriptions(user);
        return { success: true };
      }

      console.info('admin_delete_user RPC fallback, performing cascade delete:', rpcError.message);

      // 2. التنظيف المتسلسل للجداول التابعة إن لم تكن RPC مفعلة
      try {
        await supabase.from('activity_log').delete().eq('action_by', targetUserId);
      } catch {}

      try {
        await supabase.from('question_progress').delete().eq('user_id', targetUserId);
      } catch {}

      try {
        await supabase.from('subscription_requests').delete().eq('user_id', targetUserId);
      } catch {}

      try {
        await supabase.from('upgrade_clicks').delete().eq('user_id', targetUserId);
      } catch {}

      try {
        await supabase.from('receipt_upload_attempts').delete().eq('user_id', targetUserId);
      } catch {}

      try {
        await supabase.from('upgrade_reminders').delete().eq('user_id', targetUserId);
      } catch {}

      // 3. حذف الحساب من جدول profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (profileError) {
        console.warn('delete profile error:', profileError.message);
        return { success: false, error: profileError.message };
      }

      await refreshSubscriptions(user);
      return { success: true };
    } catch (err: any) {
      console.error('deleteUserAccount error:', err);
      return { success: false, error: err?.message || 'حدث خطأ أثناء حذف الحساب' };
    }
  };

  // ───────────────────────────── تتبع مدة مكوث المستخدم بالدقائق ─────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return;
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const storedKey = `crmef_time_${user.id}`;
        const currentMins = parseInt(localStorage.getItem(storedKey) || '0', 10) + 1;
        localStorage.setItem(storedKey, currentMins.toString());

        if (currentMins % 5 === 0 && supabase) {
          await supabase
            .from('profiles')
            .update({ 
              time_spent_minutes: currentMins,
              last_seen_at: new Date().toISOString() 
            })
            .eq('id', user.id);
        }
      } catch {
        /* تجاهل */
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        isPremium:
          user?.role === 'admin' ||
          (user?.subscriptionStatus === 'premium' &&
            (!user.premiumUntil || new Date(user.premiumUntil).getTime() > Date.now())),
        login,
        signup,
        logout,
        resetPassword,
        answeredQuestionIds,
        markQuestionAnswered,
        subscriptionRequests,
        currentRequest,
        submitSubscriptionRequest,
        approveSubscription,
        rejectSubscription,
        suspendSubscription,
        deleteSubscription,
        deleteUserAccount,
        refreshProfile,
        upgradeModalOpen,
        setUpgradeModalOpen: handleSetUpgradeModalOpen,
        passwordRecoveryOpen,
        setPasswordRecoveryOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
