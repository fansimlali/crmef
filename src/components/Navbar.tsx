import React from 'react';
import { BookOpen, Database, Sparkles, CheckCircle2, HardDrive } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: 'quiz' | 'manager';
  setActiveTab: (tab: 'quiz' | 'manager') => void;
  questionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  questionsCount,
}) => {
  const isOnline = isSupabaseConfigured();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('quiz')}>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-slate-800 leading-tight flex items-center gap-2">
              منصة الاختبار التجريبي
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                CRMEF
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              مباراة التعليم – سلك الابتدائي (مزدوج)
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Status */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Indicator */}
          <div 
            title={isOnline ? 'متصل بقاعدة بيانات Supabase السحابية' : 'يعمل بنظام التخزين المحلي (Offline / Local Storage)'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>سحابي Supabase</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span>تخزين محلي</span>
              </>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-sm font-semibold">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'quiz'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>اجتياز الاختبار</span>
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'manager'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>بنك الأسئلة</span>
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {questionsCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
