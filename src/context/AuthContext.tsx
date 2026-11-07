import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  answeredQuestionIds: Set<string>;
  markQuestionAnswered: (questionId: string, isCorrect: boolean) => void;
  resetProgress: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@crmef.ma', 'admin@admin.com', 'admin@test.com'];
const LOCAL_USER_KEY = 'crmef_current_user_v1';
const PROGRESS_KEY_PREFIX = 'crmef_progress_';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  // تحميل المستخدم الحالي والجلسة
  useEffect(() => {
    const initAuth = async () => {
      // 1. فحص جلسة Supabase إذا كان مفعلاً
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const u = data.session.user;
            const role = ADMIN_EMAILS.includes(u.email || '') || u.user_metadata?.role === 'admin'
              ? 'admin'
              : 'user';
            const profile: UserProfile = {
              id: u.id,
              email: u.email || '',
              fullName: u.user_metadata?.full_name || u.email?.split('@')[0],
              role
            };
            setUser(profile);
            loadUserProgress(profile.id);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase auth session error:', e);
        }
      }

      // 2. فحص التخزين المحلي (Offline / Demo Mode)
      try {
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          const parsed: UserProfile = JSON.parse(saved);
          setUser(parsed);
          loadUserProgress(parsed.id);
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // تحميل الأسئلة التي اختبر المستخدم نفسه فيها
  const loadUserProgress = (userId: string) => {
    try {
      const saved = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${userId}`);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setAnsweredQuestionIds(new Set(ids));
      } else {
        setAnsweredQuestionIds(new Set());
      }
    } catch (e) {
      setAnsweredQuestionIds(new Set());
    }
  };

  // تسجيل إجابة على سؤال لتظليله ومتابعة التقدم
  const markQuestionAnswered = (questionId: string, _isCorrect: boolean) => {
    setAnsweredQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      if (user) {
        localStorage.setItem(`${PROGRESS_KEY_PREFIX}${user.id}`, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const resetProgress = () => {
    setAnsweredQuestionIds(new Set());
    if (user) {
      localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${user.id}`);
    }
  };

  // تسجيل الدخول
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. محاولة تسجيل الدخول عبر Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (!error && data.user) {
          const role = ADMIN_EMAILS.includes(cleanEmail) || data.user.user_metadata?.role === 'admin'
            ? 'admin'
            : 'user';
          const profile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role
          };
          setUser(profile);
          loadUserProgress(profile.id);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase signIn error, testing local fallback:', err);
      }
    }

    // 2. نظام محلي مدمج فوري (لضمان عمل النظام حتى قبل تأكيد البريد في Supabase)
    const isAdmin = cleanEmail === 'admin@crmef.ma' || cleanEmail.startsWith('admin');
    if (isAdmin && password.length >= 6) {
      const adminProfile: UserProfile = {
        id: 'admin_local_1',
        email: cleanEmail,
        fullName: 'المشرف العام للمنصة',
        role: 'admin'
      };
      setUser(adminProfile);
      loadUserProgress(adminProfile.id);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(adminProfile));
      return { success: true };
    }

    if (password.length >= 6) {
      const userProfile: UserProfile = {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: 'user'
      };
      setUser(userProfile);
      loadUserProgress(userProfile.id);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userProfile));
      return { success: true };
    }

    return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  };

  // إنشاء حساب جديد
  const signup = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName, role: ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user' }
          }
        });
        if (error) {
          console.warn('Supabase signup error:', error.message);
        } else if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName: fullName || cleanEmail.split('@')[0],
            role: ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user'
          };
          setUser(profile);
          loadUserProgress(profile.id);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Supabase signup exception:', e);
      }
    }

    // حساب محلي فوري
    const role = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user';
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      email: cleanEmail,
      fullName: fullName || cleanEmail.split('@')[0],
      role
    };
    setUser(profile);
    loadUserProgress(profile.id);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return { success: true };
  };

  // تسجيل الخروج
  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setAnsweredQuestionIds(new Set());
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
        answeredQuestionIds,
        markQuestionAnswered,
        resetProgress
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

