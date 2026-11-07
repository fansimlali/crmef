import React from 'react';
import { 
  BookOpen, 
  Database, 
  Sparkles, 
  FileText, 
  User, 
  LogOut, 
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'quiz' | 'manager' | 'summaries';
  setActiveTab: (tab: 'quiz' | 'manager' | 'summaries') => void;
  questionsCount: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  questionsCount,
  onOpenAuth,
}) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* الشعار واسم المنصة */}
        <div className="flex items-center gap-3 cursor-pointer self-start md:self-auto" onClick={() => setActiveTab('quiz')}>
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
              <span>الملخصات (محمية)</span>
            </button>

            {/* بنك الأسئلة (مخصص للمشرف العام أو الاطلاع) */}
            <button
              onClick={() => {
                if (!isAdmin && !user) {
                  onOpenAuth();
                } else {
                  setActiveTab('manager');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'manager'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Database className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isAdmin ? 'إدارة الأسئلة (مشرف)' : 'بنك الأسئلة'}</span>
              <span className="bg-slate-200 text-slate-700 text-[11px] px-1.5 py-0.2 rounded-full">
                {questionsCount}
              </span>
            </button>
          </div>

          {/* حساب المستخدم / المشرف */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                    مشرف عام
                  </span>
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="font-bold text-slate-700 max-w-[100px] truncate">
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
