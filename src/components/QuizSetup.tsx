import React, { useState, useEffect } from 'react';
import type { SubjectKey, Question, CycleKey, ExamTitle } from '../types';
import { SUBJECT_NAMES, getSubjectWeight, getCyclesForExam, isTrackExam } from '../types';
import { getSubjectConfigs } from '../lib/supabase';
import type { SubjectRowConfig } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Sparkles, 
  Target, 
  Scale, 
  GraduationCap, 
  CheckCircle2,
  HelpCircle,
  Crown,
  Lock,
  AlertTriangle,
  ChevronRight
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
  selectedExam?: string | null;
  examInfo?: ExamTitle | null;
  onChangeExam?: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ questions, onStart, selectedExam, examInfo, onChangeExam }) => {
  const { 
    user, 
    isAdmin, 
    isPremium, 
    answeredQuestionIds, 
    setUpgradeModalOpen 
  } = useAuth();

  // مباراة منظمة بمسالك (بدل الأسلاك التعليمية)؟ — مثل مباراة أطر المختصين.
  const trackMode = isTrackExam(selectedExam, examInfo?.full);
  const cycleDefs = getCyclesForExam(selectedExam, examInfo?.full);
  const levelWord = trackMode ? 'المسلك' : 'السلك';
  const subjectWord = trackMode ? 'الموضوع' : 'المادة';

  // ─── نموذج الصلاحيات: مباراة + مسلك ───
  // مشترك شامل (100 د.م): كل المباريات وكل المسالك.
  // مشترك مباراة واحدة (50 د.م): مباراته فقط، وفيها مسلك واحد (ما اختاره).
  // مجاني: مسلك واحد (ما اختاره عند التسجيل) وبنفس الكوطة.
  const premiumScope = user?.premiumScope || 'all';
  const isFullPremium = isAdmin || (isPremium && premiumScope === 'all');
  // المسلك الفعّال للمستخدم في هذه المباراة: من خريطة المسالك per exam، وإلا سلكه العام.
  const userCycle = (user?.examTracks?.[selectedExam || ''] as CycleKey | undefined) || user?.cycle || null;

  // هل يقصر خطته/اشتراكه على مسلك واحد في هذه المباراة؟
  const trackLocked = !isFullPremium && Boolean(userCycle);

  // المسالك المتاحة لهذا المستخدم في هذه المباراة.
  const visibleCycles = trackLocked
    ? cycleDefs.filter((c) => c.id === userCycle)
    : cycleDefs;

  // إذا كان المستخدم مسجلاً وله سلك محدد، نقفل السلك تلقائياً على سلكه
  // (في المباريات ذات المسالك: المشترك الشامل وحده يختار بحرية).
  const effectiveCycles = trackLocked
    ? visibleCycles
    : user && !isAdmin && userCycle && !trackMode
    ? visibleCycles.filter((c) => c.id === userCycle)
    : visibleCycles;

  // المراحل التدريجية (Stepper) — المسلك المقفل يُختار تلقائياً، والمشترك الشامل يختار بحرية.
  const [selectedCycle, setSelectedCycle] = useState<CycleKey | null>(trackLocked ? userCycle : null);
  const [phase, setPhase] = useState<'قبلي' | 'بعدي' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [onlyUnanswered, setOnlyUnanswered] = useState<boolean>(false);

  // مزامنة السلك عند تسجيل دخول المستخدم (وللمسلك المقفل تلقائياً)
  useEffect(() => {
    if (userCycle && !isFullPremium) {
      setSelectedCycle(userCycle);
    }
  }, [userCycle, isFullPremium]);

  // المرحلة 2 — مواد المباراة من جدول subjects (بديل آمن: القوائم الثابتة أدناه)
  const [dbSubjects, setDbSubjects] = useState<SubjectRowConfig[]>([]);

  useEffect(() => {
    let alive = true;
    getSubjectConfigs(selectedExam || 'crmef')
      .then(({ subjects, fromDb }) => {
        if (alive && fromDb && subjects.length > 0) setDbSubjects(subjects);
      })
      .catch(() => { /* يبقى الاحتياط الثابت */ });
    return () => { alive = false; };
  }, [selectedExam]);

  // اسم المادة المعروض: من قاعدة البيانات أولاً ثم الثابت ثم المفتاح نفسه
  const subjectDisplayName = (key: string): string =>
    dbSubjects.find((s) => s.key === key)?.name ?? SUBJECT_NAMES[key as SubjectKey] ?? key;

  // معامل المادة: من قاعدة البيانات أولاً ثم الحساب الثابت
  const subjectWeightOf = (key: string, cycle: CycleKey): number => {
    const row = dbSubjects.find((s) => s.key === key);
    if (row && row.weight > 0) return row.weight;
    return getSubjectWeight(cycle, key as SubjectKey);
  };

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

  // المواد المناسبة لكل سلك — من قاعدة البيانات أولاً (sorted بالمعامل)، والثابت احتياطاً
  const getSubjectsForCycle = (): string[] => {
    if (!selectedCycle) return [];
    if (dbSubjects.length > 0) {
      const inCycle = dbSubjects.filter((s) => s.isActive && s.cycles.includes(selectedCycle));
      if (inCycle.length > 0) {
        return inCycle
          .slice()
          .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
          .map((s) => s.key);
      }
    }
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

  const getSubjectCount = (sub: string) =>
    cycleQuestions.filter((q) => q.subject === sub).length;

  const availableSubjects = getSubjectsForCycle().filter((sub) => getSubjectCount(sub) > 0);
  const unavailableSubjects = getSubjectsForCycle().filter((sub) => getSubjectCount(sub) === 0);

  // حساب عدد الأسئلة المجتازة في مادة معينة
  const getAnsweredCountForSubject = (sub: string) =>
    cycleQuestions.filter((q) => q.subject === sub && answeredQuestionIds.has(q.id)).length;

  // فحص الكوطة التجريبية (20 سؤالاً كحد أقصى لكل مادة)
  const TRIAL_LIMIT = 20;
  const currentSubjectAnswered = selectedSubject !== 'all' 
    ? getAnsweredCountForSubject(selectedSubject) 
    : 0;
  const isSubjectQuotaExhausted = !isPremium && selectedSubject !== 'all' && currentSubjectAnswered >= TRIAL_LIMIT;

  // الكوطة الإجمالية للمحاكاة الشاملة: مجموع ما تبقّى في المواد المتاحة فقط دون تجاوز 20 لكل مادة.
  const remainingTrialTotal = availableSubjects.reduce(
    (total, sub) => total + Math.max(0, TRIAL_LIMIT - getAnsweredCountForSubject(sub)),
    0
  );
  const isAllQuotaExhausted =
    !isPremium && selectedSubject === 'all' && remainingTrialTotal === 0;

  const availableQuestionsCount = selectedSubject === 'all'
    ? cycleQuestions.length
    : getSubjectCount(selectedSubject as SubjectKey);

  const handleStartExam = () => {
    if (!selectedCycle || !phase) return;
    if (isSubjectQuotaExhausted || isAllQuotaExhausted) {
      setUpgradeModalOpen(true);
      return;
    }

    // إذا كان المستخدم تجريبياً واختار كل المواد أو عدداً يفوق 20، نقيد الحد الأقصى بالكوطة المتبقية
    let effectiveMax = questionCount;
    if (!isPremium) {
      if (selectedSubject !== 'all') {
        const remainingForSub = Math.max(0, TRIAL_LIMIT - currentSubjectAnswered);
        effectiveMax = effectiveMax === 0 ? remainingForSub : Math.min(effectiveMax, remainingForSub);
      } else {
        effectiveMax = effectiveMax === 0
          ? remainingTrialTotal
          : Math.min(effectiveMax, remainingTrialTotal);
      }

      if (effectiveMax <= 0) {
        setUpgradeModalOpen(true);
        return;
      }
    }

    onStart(selectedCycle, phase, selectedSubject, effectiveMax, onlyUnanswered);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* بطاقة الترحيب */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          {/* شريط المباراة المختارة + زر التغيير */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedExam === 'crmef' || !selectedExam
                  ? 'مباراة التعليم — CRMEF'
                  : examInfo?.full || `مباراة: ${selectedExam}`}
              </span>
            </div>
            {onChangeExam && (
              <button
                onClick={onChangeExam}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 text-[11px] font-bold border border-white/10 transition-all cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
                <span>تغيير المباراة</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ابدأ اختبارك التجريبي بخطوات بسيطة
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            {trackMode
              ? 'اختر المسلك، حدد مرحلة التقويم، ثم اختر الموضوع المستهدف لبدء الاختبار فوراً بمعايير المباراة الرسمية.'
              : 'اختر السلك، حدد مرحلة التقويم، ثم اختر مادتك المستهدفة لبدء الاختبار فوراً بالمعايير الرسمية المعتمدة.'}
          </p>
        </div>
      </div>

      {/* شريط المتابعة الشخصية للمستخدم */}
      {user && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>مرحباً بك {user.fullName || user.email}</span>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                    مشترك كامل ⭐
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    حساب تجريبي (كوطة 20 سؤالاً/مادة)
                  </span>
                )}
              </div>
              <div className="text-xs text-emerald-700">
                لقد اختبرت نفسك مسبقاً في <strong className="font-bold">{answeredQuestionIds.size}</strong> سؤالاً (محفوظة في حسابك){selectedCycle ? `، منها ${answeredInCycle} سؤالاً في هذا ${levelWord}.` : '.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {answeredQuestionIds.size > 0 && (
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
                {onlyUnanswered ? '✓ الأسئلة غير المنجزة فقط' : 'استثناء الأسئلة المجتازة'}
              </button>
            )}
            {!isPremium && !isAdmin && (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>ترقية</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* لوحة الإعدادات المتسلسلة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* ========================================================= */}
        {/* الخطوة 1: اختيار السلك / المسلك */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>{trackMode ? 'اختر المسلك المطلوب' : 'اختر السلك التعليمي المطلوب'}</span>
            </label>
            {selectedCycle && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> تم الاختيار
              </span>
            )}
          </div>

          {/* تنبيه القفل: مجاني = مسلك واحد + كوطة، مشترك مباراة واحدة = مسلك واحد */}
          {trackLocked && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {isPremium && premiumScope !== 'all' ? (
                  <>اشتراكك لمباراة <strong>{examInfo?.full || selectedExam}</strong> — يشمل <strong>{levelWord} واحداً</strong>: <strong>{cycleDefs.find(c => c.id === userCycle)?.name}</strong>. للاطلاع على بقية {levelWord === 'المسلك' ? 'المسالك' : 'الأسلاك'} أو بقية المباريات، رقِّ حسابك إلى الاشتراك الشامل.</>
                ) : (
                  <>حسابك المجاني مقيَّد في <strong>{levelWord}</strong>: <strong>{cycleDefs.find(c => c.id === userCycle)?.name}</strong> — مع الكوطة المجانية (20 سؤالاً لكل {subjectWord}). {trackMode ? 'اشترك (50 درهماً لمباراة واحدة، أو 100 درهم شامل) لتوسيع الوصول.' : ''}</>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {effectiveCycles.map((c) => {
              const isSelected = selectedCycle === c.id;
              const isLockedByAccount = user && !isAdmin && userCycle && userCycle !== c.id && !isFullPremium;
              const isAvailable = c.available && !isLockedByAccount;

              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedCycle(c.id);
                      setSelectedSubject('all');
                    }
                  }}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-label={c.name}
                  className={`text-right p-4 rounded-2xl border-2 transition-all relative ${
                    isLockedByAccount
                      ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed hidden'
                      : !c.available
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs cursor-pointer ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <span>{c.name}</span>
                    </span>
                    {!c.available ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                        {c.unavailableReason || 'غير متاحة'}
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
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* الخطوة 2: مرحلة التقويم (تظهر بعد اختيار السلك/المسلك) */}
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
              {selectedCycle && (
                <span className="text-xs font-bold text-slate-500 max-w-[16rem] truncate" title={cycleDefs.find((c) => c.id === selectedCycle)?.name}>
                  {levelWord}: {cycleDefs.find((c) => c.id === selectedCycle)?.name}
                </span>
              )}
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
        {/* الخطوة 3: المواد/الموضوعات (تظهر بعد اختيار مرحلة التقويم) */}
        {/* ========================================================= */}
        {selectedCycle && phase && (
          <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <Scale className="w-5 h-5 text-emerald-600" />
                <span>{trackMode ? 'حدد الموضوع المستهدف' : 'حدد التخصص أو المادة المستهدفة'}</span>
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
                {trackMode ? 'جميع موضوعات هذا المسلك' : 'جميع مواد وتخصصات هذا السلك'} ({cycleQuestions.length} سؤالاً) – محاكاة شاملة
              </option>
              {availableSubjects.map((key) => {
                const count = getSubjectCount(key);
                const answeredCount = getAnsweredCountForSubject(key);
                const weight = subjectWeightOf(key, selectedCycle);
                const isExhausted = !isPremium && answeredCount >= TRIAL_LIMIT;

                return (
                  <option key={key} value={key} disabled={count === 0}>
                    {subjectDisplayName(key)} (المعامل: {weight}) — {count} سؤال 
                    {!isPremium ? ` [المجتاز: ${answeredCount}/${TRIAL_LIMIT}${isExhausted ? ' 🔒 مكتمل' : ''}]` : ''}
                  </option>
                );
              })}
            </select>

            {unavailableSubjects.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold leading-relaxed">
                ⚠️ {subjectWord === 'الموضوع' ? 'مواضيع' : 'مواد/تخصصات'} بدون أسئلة في بنك الأسئلة الحالي: {unavailableSubjects.map((key) => subjectDisplayName(key)).join('، ')}. تم إخفاؤها من الاختيار بدل عرضها فارغة.
              </div>
            )}

            {/* ───── شريط العداد البصري للكوطة المجانية (الميزة المعتمدة 1) ───── */}
            {!isPremium && selectedSubject !== 'all' && (
              <div className="p-4 rounded-2xl border bg-slate-50/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>عداد الكوطة التجريبية لـ{subjectWord}:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black">
                      {subjectDisplayName(selectedSubject)}
                    </span>
                  </span>
                  <span className="font-bold text-slate-600">
                    {currentSubjectAnswered} / {TRIAL_LIMIT} سؤالاً مجانياً
                  </span>
                </div>

                {/* شريط التقدم البصري */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentSubjectAnswered >= TRIAL_LIMIT
                        ? 'bg-rose-500'
                        : currentSubjectAnswered >= 15
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (currentSubjectAnswered / TRIAL_LIMIT) * 100)}%`
                    }}
                  />
                </div>

                {/* نص الحالة أو تحذير استنفاد الكوطة */}
                {isSubjectQuotaExhausted ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        انتهت الكوطة المجانية لهذه {subjectWord} (20/20 سؤالاً). بقية أسئلة ال{subjectWord} محجوبة حتى الترقية.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>ترقية الحساب الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>متبقي لك: {TRIAL_LIMIT - currentSubjectAnswered} سؤالاً مجانياً في هذه {subjectWord}</span>
                    <span>بعد انتهاء الـ 20 سؤالاً يلزم الترقية لفتح البنك كاملاً</span>
                  </div>
                )}
              </div>
            )}

            {/* عداد الكوطة الإجمالية عند اختيار المحاكاة الشاملة */}
            {!isPremium && selectedSubject === 'all' && (
              <div className="p-4 rounded-2xl border bg-slate-50/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">الكوطة المجانية المتبقية للمحاكاة الشاملة:</span>
                  <span className={`font-black ${isAllQuotaExhausted ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {remainingTrialTotal} سؤالاً
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يُحتسب الحد الأقصى 20 سؤالاً مجانياً لكل {subjectWord} على حدة. لا يمكن تجاوز الكوطة المتبقية حتى مع اختيار «جميع {subjectWord === 'الموضوع' ? 'الموضوعات' : 'المواد'}».
                </p>
                {isAllQuotaExhausted && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>انتهت كوطة جميع المواد المتاحة. يلزم الترقية لفتح البنك كاملاً.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>ترقية الحساب الآن</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* عدد الأسئلة المراد اجتيازها */}
            {!isSubjectQuotaExhausted && !isAllQuotaExhausted && (
              <div className="pt-2">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>حجم الاختبار:</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    {questionCount === 0 
                      ? (!isPremium
                          ? `حسب الكوطة المتبقية (${selectedSubject === 'all' ? remainingTrialTotal : Math.max(0, TRIAL_LIMIT - currentSubjectAnswered)})`
                          : `كامل الرصيد (${availableQuestionsCount})`) 
                      : `${questionCount} سؤالاً`}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 10, 20, 30].map((cnt) => {
                    // إذا كان الحساب تجريبياً، لا نسمح باختيار أكثر من 20
                    if (!isPremium && cnt > 20) return null;

                    const label = cnt === 0 
                      ? (!isPremium ? 'الأقصى المتاح (20)' : `الكل (${availableQuestionsCount})`) 
                      : `${cnt} سؤالاً`;
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
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* زر بدء الاختبار (مثلث أخضر) */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleStartExam}
            // عند استنفاد الكوطة يبقى الزر قابلاً للنقر لفتح نافذة الترقية (aria-disabled للتقنية المساعدة).
            disabled={!selectedCycle || !phase || availableQuestionsCount === 0}
            aria-disabled={isSubjectQuotaExhausted || isAllQuotaExhausted}
            className={`w-full py-4 px-8 rounded-2xl font-black text-lg sm:text-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg ${
              selectedCycle && phase && availableQuestionsCount > 0 && !isSubjectQuotaExhausted && !isAllQuotaExhausted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.99]'
                : isSubjectQuotaExhausted || isAllQuotaExhausted
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubjectQuotaExhausted || isAllQuotaExhausted ? (
              <>
                <Crown className="w-5 h-5 text-white" />
                <span>انتهت الكوطة المجانية – انقر للترقية وفتح البنك كاملاً</span>
              </>
            ) : (
              <>
                {/* المثلث الأخضر المميز */}
                <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Play className="w-4 h-4 fill-emerald-600 text-emerald-600 translate-x-[-1px]" />
                </div>
                <span>
                  {!selectedCycle
                    ? `الرجاء اختيار ${levelWord} للبدء`
                    : !phase
                    ? 'الرجاء اختيار مرحلة التقويم'
                    : 'ابدأ الاختبار التجريبي الآن'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
