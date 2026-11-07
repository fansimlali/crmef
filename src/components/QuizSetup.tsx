import React, { useState } from 'react';
import type { SubjectKey, Question, CycleKey } from '../types';
import { CYCLES, SUBJECT_NAMES, getSubjectWeight } from '../types';
import { Play, Sparkles, Target, Scale, HelpCircle, GraduationCap, AlertCircle } from 'lucide-react';

interface QuizSetupProps {
  questions: Question[];
  onStart: (
    cycle: CycleKey,
    phase: 'قبلي' | 'بعدي',
    selectedSubject: SubjectKey | 'all',
    maxCount: number
  ) => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ questions, onStart }) => {
  const [selectedCycle, setSelectedCycle] = useState<CycleKey>('primary');
  const [phase, setPhase] = useState<'قبلي' | 'بعدي'>('قبلي');
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(0); // 0 means all

  // فلترة الأسئلة التي تنتمي إلى السلك المختار
  // ملاحظة: أسئلة علوم التربية (edu) مشتركة لجميع الأسلاك التعليمية
  const cycleQuestions = questions.filter((q) => {
    if (q.subject === 'edu') return true;
    if (q.cycles && q.cycles.length > 0) {
      return q.cycles.includes(selectedCycle);
    }
    // التوافق القديم: المواد البادئة بـ sec_ تخص الثانوي، والباقي ابتدائي
    if (q.subject.startsWith('sec_')) {
      return selectedCycle === 'secondary_prep' || selectedCycle === 'secondary_qual';
    }
    return selectedCycle === 'primary';
  });

  // حساب عدد الأسئلة المتاحة للمادة
  const getSubjectCount = (sub: SubjectKey) =>
    cycleQuestions.filter((q) => q.subject === sub).length;

  const availableQuestionsCount = selectedSubject === 'all'
    ? cycleQuestions.length
    : getSubjectCount(selectedSubject as SubjectKey);

  // قائمة المواد المناسبة لكل سلك
  const getSubjectsForCycle = (): SubjectKey[] => {
    if (selectedCycle === 'primary') {
      return ['ar', 'fr', 'ma', 'sc', 'dar', 'dfr', 'dma', 'dsc', 'edu'];
    }
    if (selectedCycle === 'secondary_prep') {
      return [
        'sec_math', 'sec_d_math',
        'sec_physics', 'sec_d_physics',
        'sec_svt', 'sec_d_svt',
        'sec_ar', 'sec_d_ar',
        'sec_fr', 'sec_d_fr',
        'sec_eng', 'sec_d_eng',
        'sec_islamic', 'sec_d_islamic',
        'sec_hist_geo', 'sec_d_hist_geo',
        'sec_cs', 'sec_d_cs',
        'sec_pe',
        'sec_te',
        'edu'
      ];
    }
    if (selectedCycle === 'secondary_qual') {
      return [
        'sec_philo', 'sec_d_philo',
        'sec_math', 'sec_d_math',
        'sec_physics', 'sec_d_physics',
        'sec_svt', 'sec_d_svt',
        'sec_ar', 'sec_d_ar',
        'sec_fr', 'sec_d_fr',
        'sec_eng', 'sec_d_eng',
        'sec_hist_geo', 'sec_d_hist_geo',
        'sec_eco', 'sec_d_eco',
        'sec_islamic', 'sec_d_islamic',
        'sec_cs', 'sec_d_cs',
        'sec_pe',
        'sec_te',
        'edu'
      ];
    }
    return [];
  };

  const handleCycleChange = (cKey: CycleKey) => {
    setSelectedCycle(cKey);
    setSelectedSubject('all');
    setQuestionCount(0);
  };

  const handleStart = () => {
    onStart(selectedCycle, phase, selectedSubject, questionCount);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* بطاقة الترحيب والتعريف */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام المحاكاة الرسمية لمباريات التعليم (دورة 2026)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            منصة الامتحان التجريبي – الابتدائي والثانوي (إعدادي وتأهيلي)
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl leading-relaxed">
            اختبر جاهزيتك للمباراة بالمعاملات المعتمدة في القرار الوزاري، مع رصد درجات الثقة وتحليل مواطن القوة والضعف بدقة علمية وبيداغوجية.
          </p>
        </div>
      </div>

      {/* لوحة الإعدادات */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* اختيار السلك التعليمي المستهدف */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>1. اختر سلك التأهيل المستهدف</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CYCLES.map((c) => {
              const isSelected = selectedCycle === c.id;
              const isAvailable = c.available;

              return (
                <div
                  key={c.id}
                  onClick={() => isAvailable && handleCycleChange(c.id)}
                  className={`p-4 rounded-xl border-2 transition-all relative ${
                    !isAvailable
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {c.name}
                    </span>
                    {!isAvailable ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                        {c.unavailableReason || 'غير متاحة في التطبيق'}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* اختيار المرحلة: قبلي أم بعدي */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>2. مرحلة التقويم</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                phase === 'قبلي'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="phase"
                value="قبلي"
                checked={phase === 'قبلي'}
                onChange={() => setPhase('قبلي')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold">اختبار قبلي (تشخيصي)</div>
                <div className="text-xs text-slate-500 font-normal">
                  لقياس مكتسباتك القبلية وتحديد مكامن الثغرات قبل بدء المراجعة
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                phase === 'بعدي'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="phase"
                value="بعدي"
                checked={phase === 'بعدي'}
                onChange={() => setPhase('بعدي')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold">اختبار بعدي (إجمالي)</div>
                <div className="text-xs text-slate-500 font-normal">
                  لقياس مدى التمكن النهائي ومحاكاة شروط الامتحان الحقيقي
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* اختيار المادة والتخصص */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>3. المادة أو التخصص المستهدف</span>
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value as SubjectKey | 'all');
              setQuestionCount(0);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">
              جميع مواد وتخصصات السلك ({cycleQuestions.length} سؤالاً متاحاً) – محاكاة شاملة
            </option>
            {getSubjectsForCycle().map((key) => {
              const count = getSubjectCount(key);
              const weight = getSubjectWeight(selectedCycle, key);
              return (
                <option key={key} value={key} disabled={count === 0}>
                  {SUBJECT_NAMES[key] || key} (المعامل: {weight}) — {count} سؤال
                </option>
              );
            })}
          </select>
        </div>

        {/* عدد الأسئلة المراد اجتيازها */}
        {availableQuestionsCount > 0 ? (
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>4. حجم الاختبار</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {questionCount === 0 ? `كامل الرصيد المتاح (${availableQuestionsCount})` : `${questionCount} سؤالاً`}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 5, 10, 20].map((cnt) => {
                const label = cnt === 0 ? `الكل (${availableQuestionsCount})` : `${cnt} أسئلة`;
                const isDisabled = cnt !== 0 && cnt > availableQuestionsCount;
                if (isDisabled && cnt !== 0) return null;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>لا توجد أسئلة مسجلة حالياً لهذا التخصص بعينه. يمكنك إضافة أسئلة من تبويب "بنك الأسئلة" أو اختيار "جميع مواد وتخصصات السلك".</span>
          </div>
        )}

        {/* زر الانطلاق */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleStart}
            disabled={availableQuestionsCount === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-lg py-3.5 px-6 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>ابدأ الاختبار الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
