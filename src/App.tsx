import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { QuizSetup } from './components/QuizSetup';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizResults } from './components/QuizResults';
import { QuestionManager } from './components/QuestionManager';
import type { Question, SubjectKey, ExamRecord, CycleKey } from './types';
import { getQuestions } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'manager'>('quiz');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // حالة جلسة الاختبار
  const [quizStatus, setQuizStatus] = useState<'setup' | 'running' | 'results'>('setup');
  const [examCycle, setExamCycle] = useState<CycleKey>('primary');
  const [examPhase, setExamPhase] = useState<'قبلي' | 'بعدي'>('قبلي');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<ExamRecord[]>([]);

  // تحميل الأسئلة عند بدء التشغيل
  const loadQuestionsData = async () => {
    setLoading(true);
    const qs = await getQuestions();
    setAllQuestions(qs);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestionsData();
  }, []);

  // بدء الاختبار
  const handleStartExam = (
    cycle: CycleKey,
    phase: 'قبلي' | 'بعدي',
    selectedSubject: SubjectKey | 'all',
    maxCount: number
  ) => {
    setExamCycle(cycle);

    const pool = allQuestions.filter((q) => {
      // علوم التربية edu مشتركة لجميع الأسلاك
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

    // خلط عشوائي لترتيب الأسئلة
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

  // الانتقال للسؤال التالي أو إنهاء الاختبار
  const handleNextQuestion = (record: ExamRecord) => {
    const updatedRecords = [...records, record];
    setRecords(updatedRecords);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQuizStatus('results');
    }
  };

  // إعادة التعيين والعودة للرئيسية
  const handleRestart = () => {
    setQuizStatus('setup');
    setCurrentIndex(0);
    setRecords([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'quiz' && quizStatus === 'results') {
            setQuizStatus('setup');
          }
        }}
        questionsCount={allQuestions.length}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">جارٍ تحميل بنك الأسئلة والاتصال بقاعدة البيانات...</p>
          </div>
        ) : activeTab === 'manager' ? (
          <QuestionManager
            questions={allQuestions}
            onRefresh={loadQuestionsData}
          />
        ) : (
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
        )}
      </main>

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

export default App;
