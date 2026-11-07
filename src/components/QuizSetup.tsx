import React, { useState } from 'react';
import type { SubjectKey, Question, CycleKey } from '../types';
import { CYCLES, SUBJECT_NAMES, getSubjectWeight } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Sparkles, 
  Target, 
  Scale, 
  GraduationCap, 
  CheckCircle2, 
  RotateCcw,
  HelpCircle
} from 'lucide-react';

interface QuizSetupProps {
  questions: Question[];
  onStart: (
    cycle: CycleKey,
    phase: 'قبلي' | 'بعدي',
    selectedSubject: SubjectKey | 'all',
    maxCount: number,
    onlyUnanswered?: boolean
  ) => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ questions, onStart }) => {
  const { user, answeredQuestionIds, resetProgress } = useAuth();

  // المراحل التدريجية (Stepper)
  const [selectedCycle, setSelectedCycle] = useState<CycleKey | null>(null);
  const [phase, setPhase] = useState<'قبلي' | 'بعدي' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [onlyUnanswered, setOnlyUnanswered] = useState<boolean>(false);

  // تصفية الأسئلة حسب السلك المختار
  const cycleQuestions = questions.filter((q) => {
    if (!selectedCycle) return false;
    if (q.subject === 'edu') return true;
    if (q.cycles && q.cycles.length > 0) {
      return q.cycles.includes(selectedCycle);
    }
    if (q.subject.startsWith('sec_')) {
      return selectedCycle === 'secondary_prep' || selectedCycle === 'secondary_qual';
    }
    return selectedCycle === 'primary';
  });

  // حساب الأسئلة المجتازة من قبل المستخدم في هذا السلك
  const answeredInCycle = cycleQuestions.filter((q) => answeredQuestionIds.has(q.id)).length;

  // المواد المناسبة لكل سلك
  const getSubjectsForCycle = (): SubjectKey[] => {
    if (!selectedCycle) return [];
    if (selectedCycle === 'primary') {
      return ['ar', 'fr', 'ma', 'sc', 'dar', 'dfr', 'dma', 'dsc', 'edu'];
    }
    if (selectedCycle === 'secondary_prep') {
      return [
        'sec_math',
        'sec_physics',
        'sec_svt',
        'sec_ar',
        'sec_fr',
        'sec_eng',
        'sec_islamic',
        'sec_hist_geo',
        'sec_cs',
        'sec_pe',
        'sec_te',
        'edu'
      ];
    }
    if (selectedCycle === 'secondary_qual') {
      return [
        'sec_philo',
        'sec_math',
        'sec_physics',
        'sec_svt',
        'sec_ar',
        'sec_fr',
        'sec_eng',
        'sec_islamic',
        'sec_hist_geo',
        'sec_cs',
        'sec_eco',
        'sec_pe',
        'edu'
      ];
    }
    return [];
  };

  const getSubjectCount = (sub: SubjectKey) =>
    cycleQuestions.filter((q) => q.subject === sub).length;

  const availableQuestionsCount = selectedSubject === 'all'
    ? cycleQuestions.length
    : getSubjectCount(selectedSubject as SubjectKey);

  const handleStartExam = () => {
    if (!selectedCycle || !phase) return;
    onStart(selectedCycle, phase, selectedSubject, questionCount, onlyUnanswered);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* بطاقة الترحيب */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منصة المحاكاة الرسمية لمباريات التعليم</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ابدأ اختبارك التجريبي بخطوات بسيطة
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            اختر السلك، حدد مرحلة التقويم، ثم اختر مادتك المستهدفة لبدء الاختبار فوراً بالمعايير الرسمية المعتمدة.
          </p>
        </div>
      </div>

      {/* شريط المتابعة الشخصية للمستخدم */}
      {user && answeredQuestionIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-emerald-950">
                مرحباً بك {user.fullName || user.email}
              </div>
              <div className="text-xs text-emerald-700">
                لقد اختبرت نفسك مسبقاً في <strong className="font-bold">{answeredQuestionIds.size}</strong> سؤالاً (مظللة ومحفوظة في حسابك){selectedCycle ? `، منها ${answeredInCycle} سؤالاً في هذا السلك.` : '.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOnlyUnanswered(!onlyUnanswered);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                onlyUnanswered
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {onlyUnanswered ? '✓ التركيز على الأسئلة الجديدة فقط' : 'المتابعة من حيث انتهيت (استثناء المجتاز)'}
            </button>
            <button
              onClick={resetProgress}
              title="تصفير سجل الأسئلة المجتازة والبدء من الصفر"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* لوحة الإعدادات المتسلسلة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* ========================================================= */}
        {/* الخطوة 1: اختيار السلك */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>اختر السلك التعليمي المطلوب</span>
            </label>
            {selectedCycle && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> تم الاختيار
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CYCLES.map((c) => {
              const isSelected = selectedCycle === c.id;
              const isAvailable = c.available;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedCycle(c.id);
                      setSelectedSubject('all');
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all relative ${
                    !isAvailable
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs cursor-pointer ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {c.name}
                    </span>
                    {!isAvailable ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                        {c.unavailableReason || 'غير متاحة في التطبيق'}
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
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

        {/* ========================================================= */}
        {/* الخطوة 2: مرحلة التقويم (تظهر بعد اختيار السلك) */}
        {/* ========================================================= */}
        {selectedCycle && (
          <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <Target className="w-5 h-5 text-emerald-600" />
                <span>اختر مرحلة التقويم</span>
              </label>
              {phase && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> تم الاختيار
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  phase === 'قبلي'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="quiz_phase"
                  value="قبلي"
                  checked={phase === 'قبلي'}
                  onChange={() => setPhase('قبلي')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-slate-900">اختبار قبلي (تشخيصي)</div>
                  <div className="text-xs text-slate-500 font-normal mt-0.5">
                    لقياس مكتسباتك القبلية وتحديد مكامن الثغرات قبل بدء المراجعة
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  phase === 'بعدي'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="quiz_phase"
                  value="بعدي"
                  checked={phase === 'بعدي'}
                  onChange={() => setPhase('بعدي')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-slate-900">اختبار بعدي (إجمالي)</div>
                  <div className="text-xs text-slate-500 font-normal mt-0.5">
                    لقياس مدى التمكن النهائي ومحاكاة شروط الامتحان الحقيقي
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* الخطوة 3: التخصصات والمواد (تظهر بعد اختيار مرحلة التقويم) */}
        {/* ========================================================= */}
        {selectedCycle && phase && (
          <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <Scale className="w-5 h-5 text-emerald-600" />
                <span>حدد التخصص أو المادة المستهدفة</span>
              </label>
              <span className="text-xs text-slate-500 font-bold">
                {availableQuestionsCount} سؤالاً متوفراً
              </span>
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value as SubjectKey | 'all');
                setQuestionCount(0);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 font-bold text-sm sm:text-base focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">
                جميع مواد وتخصصات هذا السلك ({cycleQuestions.length} سؤالاً) – محاكاة شاملة
              </option>
              {getSubjectsForCycle().map((key) => {
                const count = getSubjectCount(key);
                const weight = getSubjectWeight(selectedCycle, key);
                return (
                  <option key={key} value={key} disabled={count === 0}>
                    {SUBJECT_NAMES[key] || key} (المعامل الرسمي: {weight}) — {count} سؤال
                  </option>
                );
              })}
            </select>

            {/* عدد الأسئلة المراد اجتيازها */}
            <div className="pt-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>حجم الاختبار:</span>
                </span>
                <span className="text-slate-500 font-normal">
                  {questionCount === 0 ? `كامل الرصيد (${availableQuestionsCount})` : `${questionCount} سؤالاً`}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 10, 20, 30].map((cnt) => {
                  const label = cnt === 0 ? `الكل (${availableQuestionsCount})` : `${cnt} سؤالاً`;
                  const isDisabled = cnt !== 0 && cnt > availableQuestionsCount;
                  if (isDisabled && cnt !== 0) return null;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* زر بدء الاختبار (مثلث أخضر) */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleStartExam}
            disabled={!selectedCycle || !phase || availableQuestionsCount === 0}
            className={`w-full py-4 px-8 rounded-2xl font-black text-lg sm:text-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg ${
              selectedCycle && phase && availableQuestionsCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {/* المثلث الأخضر المميز */}
            <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
              <Play className="w-4 h-4 fill-emerald-600 text-emerald-600 translate-x-[-1px]" />
            </div>
            <span>
              {!selectedCycle
                ? 'الرجاء اختيار السلك للبدء'
                : !phase
                ? 'الرجاء اختيار مرحلة التقويم'
                : 'ابدأ الاختبار التجريبي الآن'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
