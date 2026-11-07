import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { ExamRecord, SubjectKey, CycleKey } from '../types';
import { SUBJECT_NAMES, CYCLES, getSubjectWeight } from '../types';
import { 
  Trophy, 
  RotateCcw, 
  Download, 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Award,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface QuizResultsProps {
  cycle: CycleKey;
  phase: 'قبلي' | 'بعدي';
  records: ExamRecord[];
  onRestart: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  cycle,
  phase,
  records,
  onRestart,
}) => {
  const cycleInfo = CYCLES.find((c) => c.id === cycle);

  // تجميع السجلات حسب المادة وحساب النسب
  const subjectGroups: Record<string, ExamRecord[]> = {};
  records.forEach((r) => {
    if (!subjectGroups[r.subject]) subjectGroups[r.subject] = [];
    subjectGroups[r.subject].push(r);
  });

  // حساب المعدل المرجح بالمعاملات من 20 حسب السلك
  let weightedSum = 0;
  let totalWeights = 0;
  const eliminatorySubjects: string[] = [];

  Object.keys(subjectGroups).forEach((subKey) => {
    const list = subjectGroups[subKey];
    const correctCount = list.filter((r) => r.isCorrect).length;
    const accuracy = (correctCount / list.length) * 100;
    const weight = getSubjectWeight(cycle, subKey as SubjectKey);

    weightedSum += weight * accuracy;
    totalWeights += weight;

    // فحص النقطة الموجبة للرسوب (أقل من 5 من 20 أي أقل من 25%)
    const scoreOutOf20ForSubject = (accuracy * 20) / 100;
    if (scoreOutOf20ForSubject < 5 && list.length >= 2) {
      eliminatorySubjects.push(`${SUBJECT_NAMES[subKey as SubjectKey] || subKey} (${scoreOutOf20ForSubject.toFixed(1)}/20)`);
    }
  });

  const finalScore = totalWeights > 0 ? parseFloat((weightedSum / totalWeights / 5).toFixed(2)) : 0;
  const hasEliminatory = eliminatorySubjects.length > 0;
  const isPassed = finalScore >= 10 && !hasEliminatory;

  // إحصائيات الميتامعرفة (درجات الثقة)
  const sureAndWrong = records.filter((r) => r.confidence === 'متأكد' && !r.isCorrect).length;
  const guessAndRight = records.filter((r) => r.confidence === 'تخمين' && r.isCorrect).length;
  const unknownCount = records.filter((r) => r.chosen === null || r.confidence === 'لا أعرف').length;
  const totalCorrect = records.filter((r) => r.isCorrect).length;

  // تجميع السجلات حسب المحور
  const topicGroups: Record<string, ExamRecord[]> = {};
  records.forEach((r) => {
    const label = `${SUBJECT_NAMES[r.subject] || r.subject} : ${r.topic}`;
    if (!topicGroups[label]) topicGroups[label] = [];
    topicGroups[label].push(r);
  });

  // إطلاق الاحتفال إذا كانت النتيجة جيدة وبدون رسوب إقصائي
  useEffect(() => {
    if (isPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isPassed]);

  // تصدير النتيجة كملف JSON
  const handleDownload = () => {
    const data = {
      platform: 'CRMEF Exam Simulator',
      cycle: cycleInfo?.name || cycle,
      phase,
      date: new Date().toISOString(),
      scoreOutOf20: finalScore,
      hasEliminatoryScore: hasEliminatory,
      eliminatoryDetails: eliminatorySubjects,
      totalQuestions: records.length,
      correctAnswers: totalCorrect,
      sureAndWrong,
      guessAndRight,
      unknownCount,
      records,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crmef_${cycle}_${phase === 'قبلي' ? 'pre' : 'post'}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 print:p-0">
      {/* بطاقة النتيجة الرئيسية */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm text-center relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>{cycleInfo?.name || cycle}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>اختبار {phase === 'قبلي' ? 'قبلي (تشخيصي)' : 'بعدي (إجمالي)'}</span>
          </span>
        </div>

        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative">
            <div className={`text-6xl sm:text-7xl font-black ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {finalScore}
              <span className="text-2xl sm:text-3xl font-bold text-slate-400 mr-2">/ 20</span>
            </div>
          </div>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-md">
            معدل مرجح بنظام معاملات مباراة التعليم الرسمي. أجبت صواباً عن{' '}
            <strong className="text-slate-900">{totalCorrect}</strong> من أصل{' '}
            <strong className="text-slate-900">{records.length}</strong> سؤالاً.
          </p>

          {/* تنبيه النقطة الموجبة للرسوب أو التأهيل للشفوي */}
          {hasEliminatory ? (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 max-w-lg text-start">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span>تنبيه بيداغوجي (نقطة موجبة للرسوب): </span>
                <span className="font-normal">
                  وفق القرار الوزاري، الحصول على أقل من 5 من 20 في أي مادة يمنع التأهل للاختبار الشفوي: {eliminatorySubjects.join('، ')}.
                </span>
              </div>
            </div>
          ) : isPassed ? (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>معدل ممتاز! مؤهل من حيث النتيجة لاجتياز الاختبارات الشفوية والعملية.</span>
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>المعدل أقل من عتبة النجاح (10/20). راجع الأخطاء أسفله لتعزيز مكتسباتك.</span>
            </div>
          )}
        </div>

        {/* تحليل الميتامعرفة وسلوك الإجابة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-100 text-start">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>وهم المعرفة (ثقة خاطئة)</span>
            </div>
            <div className="text-2xl font-black text-rose-900">{sureAndWrong}</div>
            <div className="text-xs text-rose-700 mt-1">
              إجابات كنت متأكداً منها لكنها خاطئة (أهم مؤشر للثغرات المفاهيمية)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>تخمين أصاب الحظ</span>
            </div>
            <div className="text-2xl font-black text-amber-900">{guessAndRight}</div>
            <div className="text-xs text-amber-700 mt-1">
              إجابات صحيحة ولكن بالتخمين (تحتاج لتثبيت بيداغوجي للمفهوم)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>اعتراف بعدم المعرفة</span>
            </div>
            <div className="text-2xl font-black text-blue-900">{unknownCount}</div>
            <div className="text-xs text-blue-700 mt-1">
              أسئلة اخترت فيها "لا أعرف" (صراحة تشخيصية إيجابية)
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 print:hidden">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة الاختبار أو اختيار تخصص آخر</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>حفظ النتيجة في ملف JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* تفصيل النتائج حسب المواد والمعاملات */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" />
          <span>النتائج التفصيلية حسب المكونات والمعاملات الرسمية</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs">
                <th className="py-3 px-4 text-start font-bold">المادة / المكون</th>
                <th className="py-3 px-4 text-start font-bold">المعامل الرسمي</th>
                <th className="py-3 px-4 text-start font-bold">الإجابات الصحيحة</th>
                <th className="py-3 px-4 text-start font-bold">النسبة المئوية</th>
                <th className="py-3 px-4 text-start font-bold">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(subjectGroups).map((subKey) => {
                const list = subjectGroups[subKey];
                const correct = list.filter((r) => r.isCorrect).length;
                const pct = Math.round((correct / list.length) * 100);
                const weight = getSubjectWeight(cycle, subKey as SubjectKey);

                return (
                  <tr key={subKey} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {SUBJECT_NAMES[subKey as SubjectKey] || subKey}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {weight}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {correct} من {list.length}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          pct >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : pct >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {pct >= 75 ? 'متحكم فيه' : pct >= 50 ? 'في طور التحكم' : 'يحتاج مراجعة'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* تفصيل النتائج حسب المحاور والدروس */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900">
          التحكم المعرفي حسب المحاور والمجالات
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(topicGroups).map((topicName) => {
            const list = topicGroups[topicName];
            const correct = list.filter((r) => r.isCorrect).length;
            const pct = Math.round((correct / list.length) * 100);

            return (
              <div key={topicName} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800">{topicName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{correct} من {list.length} صواباً</div>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                  pct >= 75 ? 'bg-emerald-100 text-emerald-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* مراجعة الأخطاء مع التعليل البيداغوجي */}
      {records.some((r) => !r.isCorrect) && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>مراجعة الأخطاء والتعليل البيداغوجي</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
              {records.filter((r) => !r.isCorrect).length} أخطاء تحتاج لتصويب
            </span>
          </div>

          <div className="space-y-4">
            {records
              .filter((r) => !r.isCorrect)
              .map((r, i) => (
                <div key={i} className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{SUBJECT_NAMES[r.subject] || r.subject} – {r.topic}</span>
                    <span className="text-rose-600">درجة الثقة: {r.confidence}</span>
                  </div>

                  <p className="font-bold text-slate-900 text-base" dir="auto">
                    {r.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2">
                    <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-900 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-rose-600">إجابتك:</div>
                        <div className="font-semibold">{r.chosen === null ? 'لم تجب (لا أعرف)' : r.chosen}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-900 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-emerald-600">الجواب الصحيح:</div>
                        <div className="font-semibold">{r.correct}</div>
                      </div>
                    </div>
                  </div>

                  {r.explanation && (
                    <div className="text-xs sm:text-sm bg-white/80 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                      <strong className="text-emerald-700 block mb-0.5 font-bold">التفسير والتعليل التربوي:</strong>
                      {r.explanation}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
