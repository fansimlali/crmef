import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { QuizSetup } from './components/QuizSetup';
import { QuizQuestion } from './components/QuizQuestion';
import { AuthModal } from './components/AuthModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import type { Question, SubjectKey, ExamRecord, CycleKey } from './types';
import { getQuestions } from './lib/supabase';
import { Loader2, ShieldAlert, LogIn } from 'lucide-react';

// تحميل المكوّنات الثقيلة عند الحاجة فقط لتقليل حجم الحزمة الأولية.
const QuizResults = lazy(() =>
  import('./components/QuizResults').then((m) => ({ default: m.QuizResults }))
);
const QuestionManager = lazy(() =>
  import('./components/QuestionManager').then((m) => ({ default: m.QuestionManager }))
);
const SummariesViewer = lazy(() =>
  import('./components/SummariesViewer').then((m) => ({ default: m.SummariesViewer }))
);
const UpgradeModal = lazy(() =>
  import('./components/UpgradeModal').then((m) => ({ default: m.UpgradeModal }))
);
const SubscriptionManager = lazy(() =>
  import('./components/SubscriptionManager').then((m) => ({ default: m.SubscriptionManager }))
);

const LazyFallback = ({ label = 'جارٍ التحميل...' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
    <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// المحتوى الرئيسي للتطبيق (مُغلَّف بـ AuthProvider في الخارج)
// ─────────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading: authLoading, isAdmin, isPremium, answeredQuestionIds, passwordRecoveryOpen, setPasswordRecoveryOpen, setUpgradeModalOpen } = useAuth();

  // التبويب النشط
  const [activeTab, setActiveTab] = useState<'quiz' | 'manager' | 'summaries' | 'subscriptions'>('quiz');

  // نافذة المصادقة
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'signup'>('login');

  // جميع الأسئلة
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // حالة جلسة الاختبار (تُحفظ في sessionStorage حتى لا تضيع عند تبديل التبويب أو تحديث الصفحة)
  const EXAM_STORAGE_KEY = 'crmef_exam_session_v1';
  const [quizStatus, setQuizStatus] = useState<'setup' | 'running' | 'results'>('setup');
  const [examCycle, setExamCycle] = useState<CycleKey>('primary');
  const [examPhase, setExamPhase] = useState<'قبلي' | 'بعدي'>('قبلي');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [restored, setRestored] = useState(false);

  // حفظ جلسة الاختبار الجارية.
  useEffect(() => {
    if (quizStatus !== 'running' || examQuestions.length === 0) return;
    try {
      sessionStorage.setItem(
        EXAM_STORAGE_KEY,
        JSON.stringify({
          quizStatus,
          examCycle,
          examPhase,
          examQuestions,
          currentIndex,
          records,
        })
      );
    } catch {
      /* تجاهل امتلاء التخزين */
    }
  }, [quizStatus, examCycle, examPhase, examQuestions, currentIndex, records]);

  // مسح الجلسة عند الإنهاء أو إعادة التعيين.
  useEffect(() => {
    if (quizStatus !== 'running') {
      try {
        sessionStorage.removeItem(EXAM_STORAGE_KEY);
      } catch {
        /* تجاهل */
      }
    }
  }, [quizStatus]);

  // استعادة الجلسة عند أول تحميل للصقحة.
  useEffect(() => {
    if (restored) return;
    try {
      const raw = sessionStorage.getItem(EXAM_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          examCycle: CycleKey;
          examPhase: 'قبلي' | 'بعدي';
          examQuestions: Question[];
          currentIndex: number;
          records: ExamRecord[];
        };
        if (Array.isArray(saved.examQuestions) && saved.examQuestions.length > 0) {
          setExamCycle(saved.examCycle || 'primary');
          setExamPhase(saved.examPhase || 'قبلي');
          setExamQuestions(saved.examQuestions);
          setCurrentIndex(Math.min(saved.currentIndex || 0, saved.examQuestions.length - 1));
          setRecords(Array.isArray(saved.records) ? saved.records : []);
          setQuizStatus('running');
        }
      }
    } catch {
      /* تجاهل */
    }
    setRestored(true);
  }, [restored]);

  // ───── تحميل الأسئلة ─────
  const loadQuestionsData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = await getQuestions(isAdmin);
      setAllQuestions(qs);
    } catch (err) {
      console.error('loadQuestionsData error:', err);
      setLoadError('تعذر تحميل بنك الأسئلة. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // إعادة جلب الأسئلة عند تغيّر الدور (تسجيل دخول / ترقية): التجريبي يرى 20/مادة، الكامل يرى الكل.
  useEffect(() => {
    if (quizStatus !== 'running' && quizStatus !== 'results') {
      void loadQuestionsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin, isPremium]);

  // ───── بدء الاختبار ─────
  const handleStartExam = (
    cycle: CycleKey,
    phase: 'قبلي' | 'بعدي',
    selectedSubject: SubjectKey | 'all',
    maxCount: number,
    onlyUnanswered?: boolean
  ) => {
    setExamCycle(cycle);

    const matchesCycleOnly = (q: Question) =>
      q.subject === 'edu' ||
      (q.cycles && q.cycles.length > 0
        ? q.cycles.includes(cycle)
        : cycle === 'primary'
        ? !q.subject.startsWith('sec_')
        : q.subject.startsWith('sec_'));

    // تصفية الأسئلة حسب السلك والمادة
    let pool = allQuestions.filter((q) => {
      const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
      return matchesCycleOnly(q) && matchesSubject;
    });

    // تصفية الأسئلة غير المُجاب عنها إذا طُلب ذلك
    if (onlyUnanswered && user) {
      const unanswered = pool.filter((q) => !answeredQuestionIds.has(q.id));
      // إذا لم تبقَ أسئلة غير مُجاب عنها، لا نستمر بصمت بالأسئلة المستعملة.
      if (unanswered.length === 0) {
        setLoadError('لا توجد أسئلة غير مُجاب عنها في هذا النطاق. عطّل خيار «غير المُجاب عنها فقط» للمتابعة.');
        setQuizStatus('setup');
        return;
      }
      pool = unanswered;
    }

    // خلط عشوائي
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let finalSelection: Question[];

    if (!isPremium && user) {
      // فرض الكوطة التجريبية 20 سؤالاً لكل مادة حتى في المحاكاة الشاملة.
      const TRIAL_LIMIT = 20;
      const answeredBySubject = new Map<string, number>();
      allQuestions.filter(matchesCycleOnly).forEach((q) => {
        if (answeredQuestionIds.has(q.id)) {
          answeredBySubject.set(q.subject, (answeredBySubject.get(q.subject) || 0) + 1);
        }
      });

      const takenBySubject = new Map<string, number>();
      const picked: Question[] = [];

      for (const q of shuffled) {
        if (maxCount > 0 && picked.length >= maxCount) break;
        const used = (answeredBySubject.get(q.subject) || 0) + (takenBySubject.get(q.subject) || 0);
        if (used >= TRIAL_LIMIT) continue;
        picked.push(q);
        takenBySubject.set(q.subject, (takenBySubject.get(q.subject) || 0) + 1);
      }

      finalSelection = picked;
    } else {
      finalSelection = maxCount > 0 ? shuffled.slice(0, maxCount) : shuffled;
    }

    if (finalSelection.length === 0) {
      if (!isPremium && user) {
        setUpgradeModalOpen(true);
      } else {
        setLoadError('لا توجد أسئلة متوفرة لهذا التخصص حالياً.');
      }
      return;
    }

    setExamPhase(phase);
    setExamQuestions(finalSelection);
    setCurrentIndex(0);
    setRecords([]);
    setQuizStatus('running');
  };

  // ───── الانتقال للسؤال التالي أو إنهاء الاختبار ─────
  // تحديثات وظيفية (functional) حتى لا يمحو إرسال مزدوج سجلاً سابقاً.
  const handleNextQuestion = (record: ExamRecord) => {
    setRecords((prev) => {
      // تجاهل التكرار الناتج عن نقر مزدوج على نفس السؤال.
      if (prev.some((r) => r.id === record.id)) return prev;
      return [...prev, record];
    });
    setCurrentIndex((i) => {
      if (i + 1 < examQuestions.length) return i + 1;
      setQuizStatus('results');
      return i;
    });
  };

  // ───── إعادة التعيين والعودة للرئيسية ─────
  const handleRestart = () => {
    setQuizStatus('setup');
    setCurrentIndex(0);
    setRecords([]);
    setExamQuestions([]);
  };

  // ───── تغيير التبويب مع معالجة خاصة ─────
  const handleSetActiveTab = (tab: 'quiz' | 'manager' | 'summaries' | 'subscriptions') => {
    setActiveTab(tab);
    if (tab === 'quiz' && quizStatus === 'results') {
      setQuizStatus('setup');
    }
  };

  // ───── محتوى التبويب النشط ─────
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">جارٍ تحميل بنك الأسئلة والاتصال بقاعدة البيانات...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4" role="alert">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 max-w-md">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadQuestionsData()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    if (activeTab === 'summaries') {
      return (
        <Suspense fallback={<LazyFallback label="جارٍ تحميل الملخصات..." />}>
          <SummariesViewer onOpenAuth={() => setAuthModalOpen(true)} />
        </Suspense>
      );
    }

    if (activeTab === 'subscriptions') {
      if (!user || !isAdmin) {
        return (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800">صلاحية غير كافية</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                هذا القسم مخصص للمشرف العام لمراجعة طلبات الاشتراك وتفعيل الحسابات.
              </p>
            </div>
          </div>
        );
      }
      return (
        <Suspense fallback={<LazyFallback label="جارٍ تحميل طلبات الاشتراك..." />}>
          <SubscriptionManager />
        </Suspense>
      );
    }

    if (activeTab === 'manager') {
      if (!user) {
        // غير مُسجَّل — اطلب تسجيل الدخول
        return (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800">هذا القسم مخصص للمشرف العام</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                يرجى تسجيل الدخول بحساب المشرف للوصول إلى إدارة الأسئلة وبنك الأسئلة.
              </p>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
          </div>
        );
      }

      if (!isAdmin) {
        // مُسجَّل لكن ليس مشرفاً
        return (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800">صلاحية غير كافية</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                لا تملك صلاحيات المشرف العام للوصول إلى هذا القسم.
              </p>
            </div>
          </div>
        );
      }

      return (
        <Suspense fallback={<LazyFallback label="جارٍ تحميل إدارة الأسئلة..." />}>
          <QuestionManager
            questions={allQuestions}
            onRefresh={loadQuestionsData}
          />
        </Suspense>
      );
    }

    // تبويب الاختبار (quiz)
    return (
      <>
        {quizStatus === 'setup' && (
          <QuizSetup
            questions={allQuestions}
            onStart={handleStartExam}
          />
        )}

        {quizStatus === 'running' && examQuestions.length > 0 && (
          <QuizQuestion
            phase={examPhase}
            currentIndex={currentIndex}
            totalQuestions={examQuestions.length}
            question={examQuestions[currentIndex]}
            onNext={handleNextQuestion}
          />
        )}

        {quizStatus === 'results' && (
          <Suspense fallback={<LazyFallback label="جارٍ تحليل النتائج..." />}>
            <QuizResults
              cycle={examCycle}
              phase={examPhase}
              records={records}
              onRestart={handleRestart}
            />
          </Suspense>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* شاشة انتظار أثناء استعادة جلسة Supabase لمنع وميض صفحة الهبوط */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">جارٍ التحقق من جلستك...</p>
        </div>
      ) : (
        <>
          {/* صفحة الهبوط للزوار غير المسجلين */}
          {!user && !authModalOpen && (
            <LandingPage
              onOpenAuth={(mode = 'login') => {
                setAuthDefaultMode(mode);
                setAuthModalOpen(true);
              }}
            />
          )}

          {/* نافذة المصادقة */}
          <AuthModal
            key={authModalOpen ? 'auth-open' : 'auth-closed'}
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            defaultMode={authDefaultMode}
          />

          {/* نافذة تعيين كلمة المرور الجديدة (عند الضغط على رابط الاستعادة من البريد) */}
          <ResetPasswordModal
            key={passwordRecoveryOpen ? 'recovery-open' : 'recovery-closed'}
            isOpen={passwordRecoveryOpen}
            onClose={() => setPasswordRecoveryOpen(false)}
            onSuccess={() => {
              setAuthDefaultMode('login');
              setAuthModalOpen(true);
            }}
          />

          {/* المحتوى الكامل للمستخدمين المسجلين */}
          {user && (
            <>
              {/* شريط التنقل */}
              <Navbar
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}
                questionsCount={allQuestions.length}
                onOpenAuth={() => setAuthModalOpen(true)}
              />

              {/* نافذة ترقية الحساب وإرسال وصل الأداء */}
              <Suspense fallback={null}>
                <UpgradeModal />
              </Suspense>

              {/* المحتوى الرئيسي */}
              <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
                {renderTabContent()}
              </main>

              {/* الذيل */}
              <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
                <div className="max-w-4xl mx-auto px-4 space-y-1">
                  <p className="font-semibold text-slate-700">
                    منصة الامتحان التجريبي لمباراة ولوج سلك تأهيل أطر التدريس بالمراكز الجهوية لمهن التربية والتكوين (CRMEF)
                  </p>
                  <p>
                    تغطي سلك التعليم الابتدائي (مزدوج) وسلكي التعليم الثانوي (إعدادي وتأهيلي) وفق التوصيفات الرسمية للوزارة
                  </p>
                </div>
              </footer>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// المُصدَّر الرئيسي: يُغلِّف AppContent بـ AuthProvider
// ─────────────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
