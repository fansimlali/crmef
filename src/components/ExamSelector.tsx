import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Scale, Stethoscope, Building2, ChevronLeft, Lock, Sparkles } from 'lucide-react';
import type { ExamConfig } from '../types';
import { getExamConfigs } from '../lib/supabase';

interface ExamSelectorProps {
  onSelectExam: (examId: string) => void;
}

const EXAMS: ExamConfig[] = [
  {
    id: 'crmef',
    name: 'مباراة التعليم',
    shortName: 'CRMEF',
    description: 'سلك تأهيل أطر التدريس بالمراكز الجهوية — ابتدائي، إعدادي، تأهيلي',
    icon: 'graduation',
    color: 'emerald',
    isActive: true,
    badge: '+2,284 سؤال',
  },
  {
    id: 'medicine',
    name: 'مباراة ولوج كليات الطب',
    shortName: 'Médecine',
    description: 'تخصصات الطب والصيدلة وطب الأسنان وعلوم التمريض',
    icon: 'stethoscope',
    color: 'blue',
    isActive: false,
    comingSoon: true,
  },
  {
    id: 'law',
    name: 'مباراة المحاماة',
    shortName: 'Barreau',
    description: 'مباراة ولوج هيئة المحامين — قانون مدني وجنائي وتجاري',
    icon: 'scale',
    color: 'purple',
    isActive: false,
    comingSoon: true,
  },
  {
    id: 'admin',
    name: 'المباريات الإدارية',
    shortName: 'Concours Adm.',
    description: 'مباريات التوظيف في الوزارات والمؤسسات العمومية',
    icon: 'building',
    color: 'orange',
    isActive: false,
    comingSoon: true,
  },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; btn: string; icon: string; ring: string }> = {
  emerald: {
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
    ring: 'ring-emerald-300',
  },
  blue: {
    bg: 'from-blue-50 to-sky-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    btn: 'bg-blue-100 text-blue-500',
    icon: 'bg-blue-100 text-blue-500',
    ring: 'ring-blue-200',
  },
  purple: {
    bg: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    btn: 'bg-purple-100 text-purple-500',
    icon: 'bg-purple-100 text-purple-500',
    ring: 'ring-purple-200',
  },
  orange: {
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    btn: 'bg-orange-100 text-orange-500',
    icon: 'bg-orange-100 text-orange-500',
    ring: 'ring-orange-200',
  },
};

const ExamIcon: React.FC<{ icon: string; className: string }> = ({ icon, className }) => {
  if (icon === 'graduation') return <GraduationCap className={className} />;
  if (icon === 'stethoscope') return <Stethoscope className={className} />;
  if (icon === 'scale') return <Scale className={className} />;
  if (icon === 'building') return <Building2 className={className} />;
  return <BookOpen className={className} />;
};

export const ExamSelector: React.FC<ExamSelectorProps> = ({ onSelectExam }) => {
  // المرحلة 2 — البطاقات من قاعدة البيانات (بأسمائها وعددها الحقيقي).
  // الثابت أعلاه فاضي آمن: يبقى ظاهراً حتى تنجح القراءة أو في بيئة غير مهيأة.
  const [dynamicExams, setDynamicExams] = useState<ExamConfig[] | null>(null);

  useEffect(() => {
    let alive = true;
    getExamConfigs()
      .then(({ exams, fromDb }) => {
        if (!alive || !fromDb || exams.length === 0) return; // يبقى الثابت
        const dbList: ExamConfig[] = exams.map((e) => ({
          id: e.id,
          name: e.name,
          shortName: e.shortName || e.id.toUpperCase(),
          description: e.description || '',
          icon: e.icon,
          color: e.color,
          isActive: e.isActive,
          comingSoon: !e.isActive && e.questionCount === 0,
          badge: e.questionCount > 0 ? `+${e.questionCount.toLocaleString('en-US')} سؤال` : undefined,
        }));
        setDynamicExams(dbList);
      })
      .catch(() => { /* يبقى الثابت */ });
    return () => { alive = false; };
  }, []);

  // الدمج: صفوف قاعدة البيانات أولاً (نفس المعرف يستبدل الثابت)،
  // ثم البدائل الثابتة التي لم يدخلها الرفع بعد (مثل مباريات comingSoon).
  const exams: ExamConfig[] = dynamicExams
    ? [...dynamicExams, ...EXAMS.filter((s) => !dynamicExams.some((d) => d.id === s.id))]
    : EXAMS;
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* الترويسة */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>منصة متعددة المباريات</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          اختر المباراة التي تريد التحضير لها
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          حساب واحد يمنحك الوصول لجميع المباريات — سجّل مرة واحدة واشترك مرة واحدة.
        </p>
      </div>

      {/* بطاقات المباريات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {exams.map((exam) => {
          const colors = colorMap[exam.color] || colorMap.emerald;
          const isLocked = !exam.isActive;

          return (
            <div
              key={exam.id}
              className={`
                relative bg-gradient-to-br ${colors.bg} rounded-3xl border-2 ${colors.border}
                p-6 transition-all duration-200
                ${isLocked ? 'opacity-70' : 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer hover:ring-4 ' + colors.ring}
              `}
              onClick={() => !isLocked && onSelectExam(exam.id)}
              role={isLocked ? undefined : 'button'}
              tabIndex={isLocked ? undefined : 0}
              onKeyDown={(e) => !isLocked && e.key === 'Enter' && onSelectExam(exam.id)}
            >
              {/* شارة "قريباً" */}
              {exam.comingSoon && (
                <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-white text-[10px] font-black">
                  <Lock className="w-2.5 h-2.5" />
                  <span>قريباً</span>
                </div>
              )}

              <div className="space-y-4">
                {/* الأيقونة والاسم */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${colors.icon} flex items-center justify-center shrink-0 shadow-sm`}>
                    <ExamIcon icon={exam.icon} className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg text-slate-900 leading-tight">
                        {exam.name}
                      </h3>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-lg border text-[11px] font-bold ${colors.badge}`}>
                      {exam.shortName}
                    </span>
                  </div>
                </div>

                {/* الوصف */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {exam.description}
                </p>

                {/* الزر */}
                <div className="flex items-center justify-between pt-1">
                  {'badge' in exam && exam.badge && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colors.badge}`}>
                      {exam.badge as string}
                    </span>
                  )}
                  {!('badge' in exam) || !exam.badge ? <span /> : null}

                  <button
                    disabled={isLocked}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all ${colors.btn} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}`}
                    onClick={(e) => { e.stopPropagation(); if (!isLocked) onSelectExam(exam.id); }}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>قريباً</span>
                      </>
                    ) : (
                      <>
                        <span>ابدأ التحضير</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ملاحظة الاشتراك الشامل */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl p-5 flex items-center gap-4 shadow-lg shadow-emerald-200">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-black text-sm">اشتراك واحد، جميع المباريات</p>
          <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
            اشتراكك الحالي (أو القادم) يفتح كل المباريات المتاحة والقادمة — لا حاجة لاشتراك منفصل لكل مباراة.
          </p>
        </div>
      </div>
    </div>
  );
};

