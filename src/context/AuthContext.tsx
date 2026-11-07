import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/authErrors';

export type UserRole = 'admin' | 'user';
// زائر: غير مسجل | مجاني: حساب بلا اشتراك (التجربة المجانية) | مشترك: اشتراك ساري | مشرف
export type AccessLevel = 'visitor' | 'free' | 'subscriber' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  needsConfirmation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  accessLevel: AccessLevel;
  subscriptionExpiresAt: string | null;
  authAvailable: boolean;
  recoveryMode: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  answeredQuestionIds: Set<string>;
  markQuestionAnswered: (questionId: string, isCorrect: boolean) => void;
  resetProgress: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROGRESS_KEY_PREFIX = 'crmef_progress_';
// مفتاح تخزين محلي قديم يُحذف عند التشغيل
const LEGACY_USER_KEY = 'crmef_current_user_v1';

const UNAVAILABLE = 'الحسابات غير متاحة حاليا: الخادم غير مهيأ.';

function readProgress(userId: string | null): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${userId}`);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeProgress(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(Array.from(ids)));
  } catch {
    // التخزين المحلي ممتلئ أو معطل: نتجاهل
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(!supabase);
  // الدور والاشتراك يأتيان من الخادم (دالة my_access) ولا يُقرآن من المتصفح أبدا
  const [access, setAccess] = useState<{ role: UserRole; expiresAt: string | null } | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const userId = authUser?.id ?? null;

  // حذف أي بيانات جلسة محلية قديمة
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // تجاهل
    }
  }, []);

  // متابعة جلسة Supabase
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthUser(data.session?.user ?? null);
      setSessionChecked(true);
    });

    // لا نستدعي الخادم داخل هذا الاستدعاء (تفاديا لتعطل المكتبة): نكتفي بتحديث الحالة
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // جلب الدور والاشتراك من الخادم عند تغير المستخدم
  useEffect(() => {
    if (!supabase || !userId) {
      setAccess(null);
      return;
    }
    let active = true;
    supabase.rpc('my_access').then(({ data, error }) => {
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        // فشل مغلق: عند أي خلل لا يُمنح أي امتياز
        setAccess({ role: 'user', expiresAt: null });
        return;
      }
      setAccess({
        role: row.role === 'admin' ? 'admin' : 'user',
        expiresAt: row.expires_at ?? null,
      });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // تقدم المستخدم (محلي على هذا الجهاز)
  useEffect(() => {
    setAnsweredQuestionIds(readProgress(userId));
  }, [userId]);

  const user = useMemo<UserProfile | null>(() => {
    if (!authUser) return null;
    const metaName = authUser.user_metadata?.full_name;
    return {
      id: authUser.id,
      email: authUser.email ?? '',
      fullName:
        (typeof metaName === 'string' && metaName.trim()) ||
        (authUser.email ? authUser.email.split('@')[0] : undefined),
      role: access?.role ?? 'user',
    };
  }, [authUser, access]);

  const isAdmin = user?.role === 'admin';
  const subscriptionActive =
    !!access?.expiresAt && new Date(access.expiresAt).getTime() > Date.now();
  const accessLevel: AccessLevel = !user
    ? 'visitor'
    : isAdmin
    ? 'admin'
    : subscriptionActive
    ? 'subscriber'
    : 'free';

  const markQuestionAnswered = (questionId: string, _isCorrect: boolean) => {
    setAnsweredQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      if (userId) writeProgress(userId, next);
      return next;
    });
  };

  const resetProgress = () => {
    setAnsweredQuestionIds(new Set());
    if (userId) {
      try {
        localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${userId}`);
      } catch {
        // تجاهل
      }
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: UNAVAILABLE };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { success: false, error: translateAuthError(error), code: error.code };
    return { success: true };
  };

  const signup = async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: UNAVAILABLE };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // الدور لا يُرسل أبدا من المتصفح: يُمنح من الخادم فقط
        data: { full_name: (fullName ?? '').trim().slice(0, 100) },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: translateAuthError(error), code: error.code };
    // عند تفعيل تأكيد البريد لا تُنشأ جلسة حتى يؤكد المستخدم بريده
    if (!data.session) return { success: true, needsConfirmation: true };
    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // تجاهل: نكمل التنظيف المحلي
      }
    }
    setAuthUser(null);
    setRecoveryMode(false);
    setAnsweredQuestionIds(new Set());
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: UNAVAILABLE };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    // رسالة عامة: لا نكشف هل البريد مسجل أم لا. نُظهر فقط خطأ تقييد الطلبات.
    if (error && (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')) {
      return { success: false, error: translateAuthError(error), code: error.code };
    }
    return { success: true };
  };

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: UNAVAILABLE };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: translateAuthError(error), code: error.code };
    setRecoveryMode(false);
    return { success: true };
  };

  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: UNAVAILABLE };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { success: false, error: translateAuthError(error), code: error.code };
    return { success: true };
  };

  const value: AuthContextType = {
    user,
    loading: !sessionChecked,
    isAdmin,
    accessLevel,
    subscriptionExpiresAt: subscriptionActive ? access?.expiresAt ?? null : null,
    authAvailable: !!supabase,
    recoveryMode,
    login,
    signup,
    logout,
    requestPasswordReset,
    updatePassword,
    resendConfirmation,
    answeredQuestionIds,
    markQuestionAnswered,
    resetProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
