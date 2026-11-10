import React, { useState } from 'react';
import { BookOpen, Sparkles, GraduationCap, Shield, Users, ChevronLeft } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-emerald-500 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-teal-600 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-emerald-400 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-10">
        {/* الشعار والترويسة */}
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center backdrop-blur-xs">
              <BookOpen className="w-8 h-8 text-emerald-300" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>المنصة الرسمية للتحضير لمباريات التعليم</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            منصة الاختبار التجريبي
            <span className="block text-emerald-400 mt-1">CRMEF</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            استعد لمباراة ولوج المراكز الجهوية لمهن التربية والتكوين بأكثر من <strong className="text-white">2,284 سؤالاً</strong> بالمعايير الرسمية — شاملاً الابتدائي والإعدادي والتأهيلي.
          </p>
        </div>

        {/* بطاقات المميزات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: GraduationCap, title: 'ثلاثة أسلاك', desc: 'ابتدائي، إعدادي، تأهيلي — تخصصات متعددة' },
            { icon: Shield, title: 'ملخصات حصرية', desc: 'بالدارجة المغربية، محمية للمشتركين' },
            { icon: Users, title: 'أسئلة رسمية', desc: 'وفق توصيفات الوزارة المُحيَّنة' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="font-extrabold text-sm">{title}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          ))}
        </div>

        {/* أزرار الدخول والتسجيل */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => onOpenAuth('signup')}
            onMouseEnter={() => setHovered('signup')}
            onMouseLeave={() => setHovered(null)}
            className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 font-black text-base transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            <span>إنشاء حساب مجاني</span>
            {hovered === 'signup' && <ChevronLeft className="w-4 h-4 mr-1 animate-pulse" />}
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="flex-1 py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-base transition-all backdrop-blur-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>تسجيل الدخول</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* معلومات الاشتراك */}
        <div className="text-center space-y-1 text-xs text-slate-500">
          <p>🔓 استمتع بـ 20 سؤالاً مجانياً لكل مادة | الاشتراك من <strong className="text-slate-400">50 درهم (مباراة واحدة) أو 100 درهم شامل لكل المباريات</strong></p>
          <p>يستخدم التطبيق نظام تأكيد البريد الإلكتروني لضمان أمان حسابك</p>
        </div>
      </div>
    </div>
  );
};

