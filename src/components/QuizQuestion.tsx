import React, { useState, useEffect, useRef } from 'react';
import type { Question, ConfidenceLevel, ExamRecord } from '../types';
import { CONFIDENCE_OPTIONS, SUBJECT_NAMES } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowLeft, HelpCircle, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuizQuestionProps {
  phase: 'قبلي' | 'بعدي';
  currentIndex: number;
  totalQuestions: number;
  question: Question;
  onNext: (record: ExamRecord) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  phase,
  currentIndex,
  totalQuestions,
  question,
  onNext,
}) => {
  const { answeredQuestionIds, markQuestionAnswered } = useAuth();
  const wasPreviouslyAnswered = answeredQuestionIds.has(question.id);

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [changesCount, setChangesCount] = useState<number>(0);
  const [secondsSpent, setSecondsSpent] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // خلط الخيارات عند ظهور السؤال
  useEffect(() => {
    const opts = [...question.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    setShuffledOptions(opts);
    setSelectedOption(null);
    setConfidence(null);
    setChangesCount(0);
    setSecondsSpent(0);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsSpent(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.id]);

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null && selectedOption !== option) {
      setChangesCount((c) => c + 1);
    }
    setSelectedOption(option);
    // إذا كان قد اختار سابقا "لا أعرف" ثم اختار إجابة، نزيل "لا أعرف"
    if (confidence === 'لا أعرف') {
      setConfidence(null);
    }
  };

  const handleSelectConfidence = (conf: ConfidenceLevel) => {
    setConfidence(conf);
    // إذا اختار "لا أعرف"، يتم تفريغ الخيار المختار
    if (conf === 'لا أعرف') {
      setSelectedOption(null);
    }
  };

  // التحقق من إمكانية الانتقال: يجب اختيار درجة الثقة و(إما اختيار جواب أو اختيار "لا أعرف")
  const canProceed = confidence !== null && (selectedOption !== null || confidence === 'لا أعرف');

  const handleProceed = () => {
    if (!canProceed) return;

    const isCorrect = selectedOption !== null && selectedOption === question.correct_answer;
    markQuestionAnswered(question.id, isCorrect);

    const finalRecord: ExamRecord = {
      id: question.id,
      subject: question.subject,
      topic: question.topic,
      question: question.question,
      chosen: selectedOption,
      correct: question.correct_answer,
      isCorrect,
      confidence: confidence!,
      timeSpentSeconds: secondsSpent,
      changeCount: changesCount,
      explanation: question.explanation,
    };

    onNext(finalRecord);
  };

  // الكشف عما إذا كان السؤال بالفرنسية
  const isFrench = question.subject === 'fr' || question.subject === 'dfr';

  // تنسيق الوقت (دقائق:ثوانٍ)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* شريط التقدم والمعلومات العلوية */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              اختبار {phase}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-800 font-bold">
              سؤال {currentIndex + 1} من {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* المحور والمادة */}
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
              {SUBJECT_NAMES[question.subject]} : {question.topic}
            </span>

            {/* العداد الزمني */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-mono font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{formatTime(secondsSpent)}</span>
            </div>
          </div>
        </div>

        {/* شريط التقدم المئوي */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* بطاقة السؤال والخيارات (مع تظليل للأسئلة المجتازة سابقاً) */}
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-xs space-y-6 transition-all ${
        wasPreviouslyAnswered
          ? 'bg-emerald-50/20 border-emerald-300 ring-2 ring-emerald-500/10'
          : 'bg-white border-slate-200'
      }`}>
        {/* نص السؤال والشارة */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              نص السؤال
            </span>
            {wasPreviouslyAnswered && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم اختباره مسبقاً في حسابك (مظلل)</span>
              </span>
            )}
          </div>
          <h3
            dir={isFrench ? 'ltr' : 'rtl'}
            className={`text-lg sm:text-xl font-bold text-slate-900 leading-relaxed ${
              isFrench ? 'font-sans' : ''
            }`}
          >
            {question.question}
          </h3>
        </div>

        {/* قائمة الخيارات */}
        <div className="space-y-3">
          {shuffledOptions.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
            const latinLetters = ['A', 'B', 'C', 'D', 'E'];

            return (
              <button
                key={idx}
                type="button"
                dir={isFrench ? 'ltr' : 'rtl'}
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-4 rounded-xl border-2 text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isFrench ? latinLetters[idx] || idx + 1 : letters[idx] || idx + 1}
                  </span>
                  <span className="text-base sm:text-lg">{opt}</span>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* البعد الميتامعرفي: درجة الثقة */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>ما درجة ثقتك بإجابتك؟</span>
            </label>
            <span className="text-xs text-slate-400">
              (مطلوب لتحليل دقة التفكير البيداغوجي)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CONFIDENCE_OPTIONS.map((conf) => {
              const isSelected = confidence === conf;
              return (
                <button
                  key={conf}
                  type="button"
                  onClick={() => handleSelectConfidence(conf)}
                  className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {conf}
                </button>
              );
            })}
          </div>

          {confidence === null && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              يرجى تحديد درجة الثقة لتفعيل زر المتابعة.
            </p>
          )}
        </div>

        {/* زر السؤال التالي أو إنهاء الاختبار */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {changesCount > 0 && `ترددت وغيرت خيارك ${changesCount} مرة`}
          </span>

          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-base py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{currentIndex + 1 < totalQuestions ? 'السؤال التالي' : 'إنهاء الاختبار وعرض النتيجة'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
