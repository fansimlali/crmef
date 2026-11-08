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
    cycle: CycleKey
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
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  approveSubscription: (requestId: string) => Promise<boolean>;
  rejectSubscription: (requestId: string, reason: string) => Promise<boolean>;
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
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  cycle: string | null;
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
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

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
    cycle: normalizeCycle(row?.cycle ?? authUser.user_metadata?.cycle),
    sessionId: generateSecureSessionId(),
  };
}

function mapSubscriptionRow(row: SubscriptionRow): SubscriptionRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name || row.user_email,
    cycle: normalizeCycle(row.cycle),
    // لا نخزّن وصلات عامة: الصورة خاصة ويتم توليد رابط موقّع مؤقت لها.
    // الصفوف القديمة قد تحتوي data URL أو رابط https فقط.
    receiptUrl: row.receipt_path ? '' : safeLegacyReceiptUrl(row.receipt_url),
    receiptPath: row.receipt_path || undefined,
    paymentMethod: row.payment_method || undefined,
    notes: row.notes || undefined,
    status: (['approved', 'rejected'].includes(row.status) ? row.status : 'pending') as SubscriptionRequest['status'],
    rejectionReason: row.rejection_reason || undefined,
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
        .select('id, email, full_name, role, subscription_status, cycle')
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
        cycle: normalizeCycle(authUser.user_metadata?.cycle),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(seed)
        .select('id, email, full_name, role, subscription_status, cycle')
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
  }, [loadProfile, loadUserProgress]);

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
  }, [loadProfile, loadUserProgress]);

  // تحديث طلبات الاشتراك كلما تغيّر المستخدم أو دوره
  useEffect(() => {
    if (user) void refreshSubscriptions(user);
    else setSubscriptionRequests([]);
  }, [user, refreshSubscriptions]);

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
            prev.cycle === fresh.cycle
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
    cycle: CycleKey
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
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // لا نرسل role أو subscription_status: يُحدَّدان على الخادم فقط.
          data: { full_name: fullName.trim(), cycle: normalizeCycle(cycle) },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      // Supabase تعيد مستخدماً بدون identities عند تكرار البريد.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return { success: false, error: translateAuthError('user already registered') };
      }

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

  // أحدث طلب اشتراك للمستخدم الحالي
  const currentRequest = user
    ? subscriptionRequests.find((r) => r.userId === user.id) || null
    : null;

  // ───────────────────────────── تقديم طلب اشتراك ─────────────────────────────
  const submitSubscriptionRequest = async (
    receipt: File,
    paymentMethod: string,
    notes?: string
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
    if (!ALLOWED_RECEIPT_TYPES.includes(receipt.type)) {
      return { success: false, error: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.' };
    }
    if (receipt.size > MAX_RECEIPT_BYTES) {
      return { success: false, error: 'حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت).' };
    }

    const extension = (receipt.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const receiptPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(receiptPath, receipt, {
          cacheControl: '3600',
          upsert: false,
          contentType: receipt.type,
        });

      if (uploadError) {
        console.warn('receipt upload error:', uploadError.message);
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
          cycle: user.cycle || 'primary',
          receipt_url: null,
          receipt_path: receiptPath,
          payment_method: paymentMethod,
          notes: notes || null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle();

      if (error) {
        // تنظيف الملف المرفوع حتى لا يبقى يتيماً في المخزن.
        await supabase.storage.from('receipts').remove([receiptPath]);
        console.warn('subscription insert error:', error.message);
        return { success: false, error: 'تعذر حفظ طلب الاشتراك. يرجى المحاولة مرة أخرى.' };
      }

      if (data) {
        const mapped = mapSubscriptionRow(data as SubscriptionRow);
        setSubscriptionRequests((prev) => [mapped, ...prev]);
      } else {
        await refreshSubscriptions(user);
      }

      return { success: true };
    } catch (err) {
      console.warn('submitSubscriptionRequest error:', err);
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
        .update({ subscription_status: 'premium', updated_at: reviewedAt })
        .eq('id', request.userId);

      if (profileError) {
        console.warn('approve profile error:', profileError.message);
        return false;
      }

      await refreshSubscriptions(user);
      if (user.id === request.userId) {
        setUser({ ...user, subscriptionStatus: 'premium' });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        isPremium: user?.role === 'admin' || user?.subscriptionStatus === 'premium',
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
        upgradeModalOpen,
        setUpgradeModalOpen,
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
