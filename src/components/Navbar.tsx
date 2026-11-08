import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  LogOut, 
  ShieldCheck,
  LogIn,
  Crown,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'quiz' | 'manager' | 'summaries' | 'subscriptions';
  setActiveTab: (tab: 'quiz' | 'manager' | 'summaries' | 'subscriptions') => void;
  questionsCount: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  questionsCount,
  onOpenAuth,
}) => {
  const { user, isAdmin, isPremium, logout, subscriptionRequests, setUpgradeModalOpen } = useAuth();

  const pendingRequestsCount = subscriptionRequests.filter(r => r.status === 'pending').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* الشعار واسم المنصة */}
        <div 
          className="flex items-center gap-3 cursor-pointer self-start md:self-auto" 
          onClick={() => setActiveTab('quiz')}
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight flex items-center gap-2">
              منصة الاختبار التجريبي
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                CRMEF
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              مباراة التعليم – الابتدائي والثانوي (إعدادي وتأهيلي)
            </p>
          </div>
        </div>

        {/* أزرار التبويبات والمصادقة */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* تبويبات المنصة */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>اجتياز الاختبار</span>
            </button>

            <button
              onClick={() => setActiveTab('summaries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'summaries'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>الملخصات {isPremium ? '(متاحة ⭐)' : '(محمية)'}</span>
            </button>

            {/* بنك الأسئلة / إدارة الأسئلة (للمشرف فقط) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('manager')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'manager'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>إدارة الأسئلة</span>
                <span className="bg-slate-200 text-slate-700 text-[11px] px-1.5 py-0.2 rounded-full">
                  {questionsCount}
                </span>
              </button>
            )}

            {/* تبويب طلبات المشتركين (خاص بالمشرف العام فقط) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'subscriptions'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>الاشتراكات</span>
                {pendingRequestsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* حساب المستخدم / المشرف */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              {/* زر ترقية الحساب إذا كان حساباً تجريبياً */}
              {!isAdmin && !isPremium && (
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer animate-pulse"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>ترقية الحساب</span>
                </button>
              )}

              {/* شارة حالة الحساب */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                    مشرف عام
                  </span>
                ) : isPremium ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>مشترك كامل</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                    حساب تجريبي (20 سؤالاً/مادة)
                  </span>
                )}

                <span className="font-bold text-slate-700 max-w-[100px] truncate" title={user.fullName || user.email}>
                  {user.fullName || user.email}
                </span>
              </div>

              <button
                onClick={logout}
                title="تسجيل الخروج"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>دخول / تسجيل</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
