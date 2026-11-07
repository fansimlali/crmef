import React, { useState } from 'react';
import type { SubjectKey, Question } from '../types';
import { SUBJECT_NAMES, SUBJECT_WEIGHTS } from '../types';
import { Play, Sparkles, Target, Scale, HelpCircle } from 'lucide-react';

interface QuizSetupProps {
  questions: Question[];
  onStart: (phase: 'قبلي' | 'بعدي', selectedSubject: SubjectKey | 'all', maxCount: number) => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ questions, onStart }) => {
  const [phase, setPhase] = useState<'قبلي' | 'بعدي'>('قبلي');
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(0); // 0 means all

  // حساب عدد الأسئلة في كل مادة
  const getSubjectCount = (sub: SubjectKey) => questions.filter((q) => q.subject === sub).length;
  const availableQuestionsCount = selectedSubject === 'all' 
    ? questions.length 
    : getSubjectCount(selectedSubject as SubjectKey);

  const handleStart = () => {
    onStart(phase, selectedSubject, questionCount);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* بطاقة الترحيب والتعريف */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام المحاكاة الرسمية لمباريات التعليم</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            امتحان تجريبي تفاعلي – ابتدائي مزدوج
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl leading-relaxed">
            اختبر جاهزيتك لمباراة التعليم بالمعاملات الرسمية للمواد مع تحليل ميتامعرفي لدرجة الثقة، وكشف مواطن القوة والضعف بدقة علمية وبيداغوجية.
          </p>
        </div>
      </div>

      {/* لوحة الإعدادات */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        {/* اختيار المرحلة: قبلي أم بعدي */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>مرحلة التقويم</span>
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
                  لقياس مكتسباتك القبلية قبل بدء المراجعة وتحديد الثغرات
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
                  لقياس مدى التمكن النهائي ومحاكاة ظروف الامتحان الحقيقي
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* اختيار المادة */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>المادة أو التخصص المستهدف</span>
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
              جميع المواد ({questions.length} سؤالاً متاحاً) – محاكاة شاملة
            </option>
            {(Object.keys(SUBJECT_NAMES) as SubjectKey[]).map((key) => {
              const count = getSubjectCount(key);
              const weight = SUBJECT_WEIGHTS[key];
              return (
                <option key={key} value={key} disabled={count === 0}>
                  {SUBJECT_NAMES[key]} (المعامل: {weight}) — {count} سؤال
                </option>
              );
            })}
          </select>
        </div>

        {/* عدد الأسئلة المراد اجتيازها */}
        {availableQuestionsCount > 0 && (
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>حجم الاختبار</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {questionCount === 0 ? `كامل الرصيد المتاح (${availableQuestionsCount})` : `${questionCount} سؤالاً`}
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
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
