import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { QuizSetup } from './components/QuizSetup';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizResults } from './components/QuizResults';
import { QuestionManager } from './components/QuestionManager';
import { SummariesViewer } from './components/SummariesViewer';
import { AuthModal } from './components/AuthModal';
import type { Question, SubjectKey, ExamRecord, CycleKey } from './types';
import { getQuestions } from './lib/supabase';
import { Loader2, ShieldAlert, LogIn } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// المحتوى الرئيسي للتطبيق (مُغلَّف بـ AuthProvider في الخارج)
// ─────────────────────────────────────────────────────────────
function AppContent() {
  const { user, isAdmin, answeredQuestionIds } = useAuth();

  // التبويب النشط
  const [activeTab, setActiveTab] = useState<'quiz' | 'manager' | 'summaries'>('quiz');

  // نافذة المصادقة
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // جميع الأسئلة
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // حالة جلسة الاختبار
  const [quizStatus, setQuizStatus] = useState<'setup' | 'running' | 'results'>('setup');
  const [examCycle, setExamCycle] = useState<CycleKey>('primary');
  const [examPhase, setExamPhase] = useState<'قبلي' | 'بعدي'>('قبلي');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<ExamRecord[]>([]);

  // ───── تحميل الأسئلة ─────
  const loadQuestionsData = async () => {
    setLoading(true);
    const qs = await getQuestions();
    setAllQuestions(qs);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestionsData();
  }, []);

  // ───── بدء الاختبار ─────
  const handleStartExam = (
    cycle: CycleKey,
    phase: 'قبلي' | 'بعدي',
    selectedSubject: SubjectKey | 'all',
    maxCount: number,
    onlyUnanswered?: boolean
  ) => {
    setExamCycle(cycle);

    // تصفية الأسئلة حسب السلك والمادة
    let pool = allQuestions.filter((q) => {
      const matchesCycle =
        q.subject === 'edu' ||
        (q.cycles && q.cycles.length > 0
          ? q.cycles.includes(cycle)
          : cycle === 'primary'
          ? !q.subject.startsWith('sec_')
          : q.subject.startsWith('sec_'));

      const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
      return matchesCycle && matchesSubject;
    });

    // تصفية الأسئلة غير المُجاب عنها إذا طُلب ذلك
    if (onlyUnanswered && user) {
      const unanswered = pool.filter((q) => !answeredQuestionIds.has(q.id));
      // إذا لم تبقَ أسئلة غير مُجاب عنها، أبقِ الكل
      if (unanswered.length > 0) {
        pool = unanswered;
      }
    }

    // خلط عشوائي
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const finalSelection = maxCount > 0 ? shuffled.slice(0, maxCount) : shuffled;

    if (finalSelection.length === 0) {
      alert('لا توجد أسئلة متوفرة لهذا التخصص حالياً.');
      return;
    }

    setExamPhase(phase);
    setExamQuestions(finalSelection);
    setCurrentIndex(0);
    setRecords([]);
    setQuizStatus('running');
  };

  // ───── الانتقال للسؤال التالي أو إنهاء الاختبار ─────
  const handleNextQuestion = (record: ExamRecord) => {
    const updatedRecords = [...records, record];
    setRecords(updatedRecords);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQuizStatus('results');
    }
  };

  // ───── إعادة التعيين والعودة للرئيسية ─────
  const handleRestart = () => {
    setQuizStatus('setup');
    setCurrentIndex(0);
    setRecords([]);
  };

  // ───── تغيير التبويب مع معالجة خاصة ─────
  const handleSetActiveTab = (tab: 'quiz' | 'manager' | 'summaries') => {
    setActiveTab(tab);
    if (tab === 'quiz' && quizStatus === 'results') {
      setQuizStatus('setup');
    }
  };

  // ───── محتوى التبويب النشط ─────
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">جارٍ تحميل بنك الأسئلة والاتصال بقاعدة البيانات...</p>
        </div>
      );
    }

    if (activeTab === 'summaries') {
      return <SummariesViewer />;
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
        <QuestionManager
          questions={allQuestions}
          onRefresh={loadQuestionsData}
        />
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
          <QuizResults
            cycle={examCycle}
            phase={examPhase}
            records={records}
            onRestart={handleRestart}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* شريط التنقل */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        questionsCount={allQuestions.length}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* نافذة المصادقة */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

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
