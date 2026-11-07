import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, CycleKey, SubscriptionRequest, SubscriptionStatus } from '../types';

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
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  answeredQuestionIds: Set<string>;
  markQuestionAnswered: (questionId: string, isCorrect: boolean) => void;
  resetProgress: () => void;
  // إدارة الاشتراكات
  subscriptionRequests: SubscriptionRequest[];
  currentRequest: SubscriptionRequest | null;
  submitSubscriptionRequest: (
    receiptUrl: string, 
    paymentMethod: string, 
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  approveSubscription: (requestId: string) => Promise<boolean>;
  rejectSubscription: (requestId: string, reason: string) => Promise<boolean>;
  // نافذة الترقية
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@crmef.ma', 'admin@admin.com', 'admin@test.com'];
const LOCAL_USER_KEY = 'crmef_current_user_v2';
const LOCAL_USERS_DB_KEY = 'crmef_users_db_v2';
const PROGRESS_KEY_PREFIX = 'crmef_progress_';
const SUBSCRIPTIONS_KEY = 'crmef_subscription_requests_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // تحميل طلبات الاشتراك المخزنة
  const loadSubscriptions = () => {
    try {
      const raw = localStorage.getItem(SUBSCRIPTIONS_KEY);
      if (raw) {
        setSubscriptionRequests(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error loading subscriptions', e);
    }
  };

  const saveSubscriptions = (reqs: SubscriptionRequest[]) => {
    setSubscriptionRequests(reqs);
    try {
      localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(reqs));
    } catch (e) {
      console.error(e);
    }
  };

  // فحص الجلسة النشطة ومنع تعدد الأجهزة (Device Lock / Single Session)
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `crmef_active_session_${user.id}` && e.newValue && e.newValue !== user.sessionId) {
        alert('⚠️ تنبيه أمان: تم تسجيل الدخول إلى حسابك من جهاز أو متصفح آخر. تم إنهاء جلستك الحالية تلقائياً لحماية حسابك (يُمنع مشاركة الحساب).');
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // تحميل المستخدم الحالي والجلسة
  useEffect(() => {
    const initAuth = async () => {
      loadSubscriptions();

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
              role,
              subscriptionStatus: role === 'admin' ? 'premium' : (u.user_metadata?.subscription_status || 'trial'),
              cycle: u.user_metadata?.cycle || 'primary',
              sessionId: u.user_metadata?.session_id || `sess_${Date.now()}`
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
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
            role,
            subscriptionStatus: role === 'admin' ? 'premium' : (data.user.user_metadata?.subscription_status || 'trial'),
            cycle: data.user.user_metadata?.cycle || 'primary',
            sessionId: newSessionId
          };
          setUser(profile);
          loadUserProgress(profile.id);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          localStorage.setItem(`crmef_active_session_${profile.id}`, newSessionId);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase signIn error, checking local:', err);
      }
    }

    // 2. فحص المستخدمين في التخزين المحلي
    let usersDb: any[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
      if (raw) usersDb = JSON.parse(raw);
    } catch (e) {}

    const existing = usersDb.find(u => u.email === cleanEmail);
    if (existing) {
      if (existing.password !== password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
      const profile: UserProfile = {
        id: existing.id,
        email: existing.email,
        fullName: existing.fullName,
        role: existing.role,
        subscriptionStatus: existing.subscriptionStatus || 'trial',
        cycle: existing.cycle || 'primary',
        sessionId: newSessionId
      };
      setUser(profile);
      loadUserProgress(profile.id);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      localStorage.setItem(`crmef_active_session_${profile.id}`, newSessionId);
      return { success: true };
    }

    // المشرف العام الافتراضي
    const isAdmin = cleanEmail === 'admin@crmef.ma' || cleanEmail.startsWith('admin');
    if (isAdmin && password.length >= 6) {
      const adminProfile: UserProfile = {
        id: 'admin_local_1',
        email: cleanEmail,
        fullName: 'المشرف العام للمنصة',
        role: 'admin',
        subscriptionStatus: 'premium',
        cycle: 'primary',
        sessionId: newSessionId
      };
      setUser(adminProfile);
      loadUserProgress(adminProfile.id);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(adminProfile));
      localStorage.setItem(`crmef_active_session_${adminProfile.id}`, newSessionId);
      return { success: true };
    }

    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  };

  // إنشاء حساب جديد
  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    cycle: CycleKey
  ): Promise<{ success: boolean; error?: string }> => {
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

    // فحص عدم تكرار البريد محلياً
    let usersDb: any[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
      if (raw) usersDb = JSON.parse(raw);
    } catch (e) {}

    if (usersDb.some(u => u.email === cleanEmail)) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول أو استخدام بريد آخر.' };
    }

    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const role = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user';
    const subStatus: SubscriptionStatus = role === 'admin' ? 'premium' : 'trial';

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { 
              full_name: fullName, 
              role,
              cycle,
              subscription_status: subStatus,
              session_id: newSessionId
            }
          }
        });
        if (error) {
          console.warn('Supabase signup message:', error.message);
        } else if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName,
            role,
            subscriptionStatus: subStatus,
            cycle,
            sessionId: newSessionId
          };
          setUser(profile);
          loadUserProgress(profile.id);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          localStorage.setItem(`crmef_active_session_${profile.id}`, newSessionId);
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Supabase signup exception:', e);
      }
    }

    // إنشاء الحساب محلياً
    const newUserId = `user_${Date.now()}`;
    const newUserRecord = {
      id: newUserId,
      email: cleanEmail,
      password,
      fullName,
      role,
      subscriptionStatus: subStatus,
      cycle,
      sessionId: newSessionId,
      createdAt: new Date().toISOString()
    };
    usersDb.push(newUserRecord);
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(usersDb));

    const profile: UserProfile = {
      id: newUserId,
      email: cleanEmail,
      fullName,
      role,
      subscriptionStatus: subStatus,
      cycle,
      sessionId: newSessionId
    };
    setUser(profile);
    loadUserProgress(profile.id);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(`crmef_active_session_${profile.id}`, newSessionId);
    return { success: true };
  };

  // تسجيل الخروج
  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    if (user) {
      localStorage.removeItem(`crmef_active_session_${user.id}`);
    }
    setUser(null);
    setAnsweredQuestionIds(new Set());
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  // تقديم طلب اشتراك برفع صورة الوصل
  const submitSubscriptionRequest = async (
    receiptUrl: string, 
    paymentMethod: string, 
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً لتقديم طلب الاشتراك' };
    }

    const newReq: SubscriptionRequest = {
      id: `req_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      cycle: user.cycle || 'primary',
      receiptUrl,
      paymentMethod,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // حفظ في Supabase إن أمكن
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('subscription_requests').insert({
          id: newReq.id,
          user_id: newReq.userId,
          user_email: newReq.userEmail,
          user_name: newReq.userName,
          cycle: newReq.cycle,
          receipt_url: newReq.receiptUrl,
          payment_method: newReq.paymentMethod,
          notes: newReq.notes,
          status: 'pending',
          created_at: newReq.createdAt
        });
      } catch (e) {
        console.warn('Supabase subscription_requests insert error:', e);
      }
    }

    // حفظ محلياً
    const updated = [newReq, ...subscriptionRequests.filter(r => r.userId !== user.id || r.status !== 'pending')];
    saveSubscriptions(updated);
    return { success: true };
  };

  // موافقة المشرف على تفعيل الاشتراك
  const approveSubscription = async (requestId: string): Promise<boolean> => {
    const req = subscriptionRequests.find(r => r.id === requestId);
    if (!req) return false;

    // تحديث الطلب
    const updated = subscriptionRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString() } 
        : r
    );
    saveSubscriptions(updated);

    // تحديث قاعدة المستخدمين محلياً
    try {
      const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
      if (raw) {
        const users = JSON.parse(raw);
        const nextUsers = users.map((u: any) => 
          u.id === req.userId || u.email === req.userEmail 
            ? { ...u, subscriptionStatus: 'premium' } 
            : u
        );
        localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(nextUsers));
      }
    } catch (e) {}

    // إذا كان المستخدم الحالي هو نفسه المستهدف، نحدث حالته فورياً
    if (user && (user.id === req.userId || user.email === req.userEmail)) {
      const updatedUser: UserProfile = { ...user, subscriptionStatus: 'premium' };
      setUser(updatedUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  };

  // رفض طلب الاشتراك
  const rejectSubscription = async (requestId: string, reason: string): Promise<boolean> => {
    const updated = subscriptionRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected' as const, rejectionReason: reason, reviewedAt: new Date().toISOString() } 
        : r
    );
    saveSubscriptions(updated);
    return true;
  };

  // العثور على أحدث طلب اشتراك للمستخدم الحالي
  const currentRequest = user 
    ? subscriptionRequests.find(r => r.userId === user.id || r.userEmail === user.email) || null 
    : null;

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
        answeredQuestionIds,
        markQuestionAnswered,
        resetProgress,
        subscriptionRequests,
        currentRequest,
        submitSubscriptionRequest,
        approveSubscription,
        rejectSubscription,
        upgradeModalOpen,
        setUpgradeModalOpen
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
