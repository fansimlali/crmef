import React, { useState } from 'react';
import type { Question, SubjectKey } from '../types';
import { SUBJECT_NAMES, SUBJECT_WEIGHTS } from '../types';
import { 
  Upload, 
  PlusCircle, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  FileJson, 
  HelpCircle,
  HardDrive,
  Copy,
  ExternalLink
} from 'lucide-react';
import { isSupabaseConfigured, addQuestion, bulkAddQuestions, removeQuestion } from '../lib/supabase';

interface QuestionManagerProps {
  questions: Question[];
  onRefresh: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({ questions, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'bulk' | 'supabase'>('list');
  const isOnline = isSupabaseConfigured();

  // نموذج إضافة سؤال فردي
  const [formSubject, setFormSubject] = useState<SubjectKey>('ma');
  const [formTopic, setFormTopic] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOpt1, setFormOpt1] = useState(''); // الجواب الصحيح
  const [formOpt2, setFormOpt2] = useState('');
  const [formOpt3, setFormOpt3] = useState('');
  const [formOpt4, setFormOpt4] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // نموذج الرفع الجماعي (Bulk)
  const [bulkJson, setBulkJson] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // فلترة وبحث الأسئلة
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const filteredQuestions = questions.filter((q) => {
    const matchSub = filterSubject === 'all' || q.subject === filterSubject;
    const matchSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSub && matchSearch;
  });

  // معالجة إضافة سؤال فردي
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim() || !formQuestion.trim() || !formOpt1.trim() || !formOpt2.trim()) {
      setFormMsg({ type: 'err', text: 'يرجى ملء جميع الحقول الإلزامية وخيارين على الأقل' });
      return;
    }

    setFormLoading(true);
    setFormMsg(null);

    const options = [formOpt1.trim(), formOpt2.trim()];
    if (formOpt3.trim()) options.push(formOpt3.trim());
    if (formOpt4.trim()) options.push(formOpt4.trim());

    const newQ: Question = {
      id: `${formSubject}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: formSubject,
      topic: formTopic.trim(),
      question: formQuestion.trim(),
      options,
      correct_answer: formOpt1.trim(),
      explanation: formExplanation.trim() || undefined,
    };

    const res = await addQuestion(newQ);
    setFormLoading(false);

    if (res.success) {
      setFormMsg({ type: 'ok', text: 'تمت إضافة السؤال بنجاح إلى المنصة!' });
      setFormTopic('');
      setFormQuestion('');
      setFormOpt1('');
      setFormOpt2('');
      setFormOpt3('');
      setFormOpt4('');
      setFormExplanation('');
      onRefresh();
    } else {
      setFormMsg({ type: 'err', text: res.error || 'فشلت إضافة السؤال' });
    }
  };

  // معالجة الرفع الجماعي JSON
  const handleBulkSubmit = async () => {
    if (!bulkJson.trim()) {
      setBulkMsg({ type: 'err', text: 'يرجى لصق بيانات JSON أو رفع ملف' });
      return;
    }

    setBulkLoading(true);
    setBulkMsg(null);

    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        throw new Error('يجب أن تكون البيانات عبارة عن مصفوفة أسئلة [...]');
      }

      // التحقق من صحة العناصر
      const validated: Question[] = parsed.map((item, index) => {
        if (!item.subject || !item.topic || !item.question || !Array.isArray(item.options)) {
          throw new Error(`السؤال رقم ${index + 1} يفتقد لأحد الحقول الأساسية (subject, topic, question, options)`);
        }
        return {
          id: item.id || `q_${Date.now()}_${index}`,
          subject: item.subject,
          topic: item.topic,
          question: item.question,
          options: item.options,
          correct_answer: item.correct_answer || item.options[0],
          explanation: item.explanation || '',
        };
      });

      const res = await bulkAddQuestions(validated);
      setBulkLoading(false);
      setBulkMsg({ type: 'ok', text: `تم رفع ${res.count} سؤالاً بنجاح إلى المنصة!` });
      setBulkJson('');
      onRefresh();
    } catch (err: any) {
      setBulkLoading(false);
      setBulkMsg({ type: 'err', text: `خطأ في صيغة البيانات: ${err.message}` });
    }
  };

  // قراءة ملف JSON محلي
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkJson(content);
    };
    reader.readAsText(file);
  };

  // حذف سؤال
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال من المنصة؟')) {
      await removeQuestion(id);
      onRefresh();
    }
  };

  // نموذج قالب جاهز للصق
  const sampleJsonTemplate = `[
  {
    "id": "ar_q1",
    "subject": "ar",
    "topic": "النحو",
    "question": "ما إعراب كلمة 'العلم' في: إن العلم نور؟",
    "options": ["اسم إن منصوب", "خبر إن مرفوع", "مبتدأ مرفوع", "فاعل"],
    "correct_answer": "اسم إن منصوب",
    "explanation": "إن وأخواتها تنصب المبتدأ ويسمى اسمها وترفع الخبر."
  }
]`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* البطاقة العلوية وشريط التبويبات الداخلية */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              <span>إدارة وبنك الأسئلة السحابي</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              أضف الأسئلة فردياً أو بالرفع الجماعي لتغذية المنصة وتوفيرها لجميع المترشحين.
            </p>
          </div>

          {/* حالة الاتصال بقاعدة البيانات */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>متصل بـ Supabase (سحابي مباشر)</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-amber-600" />
                <span>وضع محلي (Offline/LocalStorage)</span>
              </>
            )}
          </div>
        </div>

        {/* أزرار التبويبات */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3 text-sm font-bold">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            استعراض الأسئلة ({questions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة سؤال فردي</span>
          </button>
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'bulk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع دفعة أسئلة (JSON)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('supabase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>إعداد Supabase & Vercel</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* تبويب 1: استعراض وبحث الأسئلة */}
        {/* ======================================================== */}
        {activeSubTab === 'list' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* شريط البحث */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  placeholder="ابحث في الأسئلة، المحاور، أو التفسيرات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* فلتر المادة */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل المواد ({questions.length})</option>
                {(Object.keys(SUBJECT_NAMES) as SubjectKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECT_NAMES[key]} ({questions.filter((q) => q.subject === key).length})
                  </option>
                ))}
              </select>
            </div>

            {/* قائمة الأسئلة */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>لا توجد أسئلة تطابق معايير البحث.</p>
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {SUBJECT_NAMES[q.subject]}
                        </span>
                        <span>{q.topic}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title="حذف السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-bold text-slate-800 text-sm sm:text-base" dir="auto">
                      {q.question}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {q.options.map((opt, oi) => {
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div
                            key={oi}
                            className={`p-2 rounded-lg border font-medium ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt} {isCorrect && '✓'}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100">
                        <strong>التعليل:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* تبويب 2: إضافة سؤال فردي */}
        {/* ======================================================== */}
        {activeSubTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formMsg && (
              <div
                className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  formMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {formMsg.type === 'ok' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{formMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {(Object.keys(SUBJECT_NAMES) as SubjectKey[]).map((key) => (
                    <option key={key} value={key}>
                      {SUBJECT_NAMES[key]} (معامل {SUBJECT_WEIGHTS[key]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المحور / الباب</label>
                <input
                  type="text"
                  placeholder="مثال: قابلية القسمة، النحو، نظريات التعلم..."
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص السؤال</label>
              <textarea
                rows={2}
                placeholder="اكتب نص السؤال بدقة..."
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">خيارات الإجابة</label>
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block mb-1">
                  الخيار الأول (الجواب الصحيح دائماً):
                </span>
                <input
                  type="text"
                  placeholder="اكتب الجواب الصحيح هنا..."
                  value={formOpt1}
                  onChange={(e) => setFormOpt1(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="الخيار الثاني (مموه 1)"
                  value={formOpt2}
                  onChange={(e) => setFormOpt2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="الخيار الثالث (مموه 2)"
                  value={formOpt3}
                  onChange={(e) => setFormOpt3(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="الخيار الرابع (مموه 3)"
                  value={formOpt4}
                  onChange={(e) => setFormOpt4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التعليل والتفسير البيداغوجي (اختياري، يظهر للمترشح عند التصحيح)
              </label>
              <textarea
                rows={2}
                placeholder="اكتب تعليلاً تربوياً أو علمياً يوضح سبب صحة الجواب..."
                value={formExplanation}
                onChange={(e) => setFormExplanation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{formLoading ? 'جارٍ الحفظ...' : 'حفظ ونشر السؤال'}</span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* تبويب 3: الرفع الجماعي (Bulk Upload) */}
        {/* ======================================================== */}
        {activeSubTab === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-600" />
                <span>رفع دفعة أسئلة بصيغة JSON</span>
              </div>
              <p>
                يمكنك رفع مصفوفة كاملة من الأسئلة في ثوانٍ. كل عنصر يحتاج للحقول التالية:
                <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded mx-1 font-mono">
                  id, subject, topic, question, options, correct_answer, explanation
                </code>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkJson(sampleJsonTemplate)}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>تحميل نموذج للتجربة</span>
                </button>

                <label className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد ملف .json من جهازك</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {bulkMsg && (
              <div
                className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  bulkMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {bulkMsg.type === 'ok' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{bulkMsg.text}</span>
              </div>
            )}

            <div>
              <textarea
                rows={10}
                dir="ltr"
                placeholder="ألصق مصفوفة JSON هنا..."
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkLoading || !bulkJson.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{bulkLoading ? 'جارٍ الرفع والمعالجة...' : 'بدء رفع الأسئلة للمنصة'}</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* تبويب 4: دليل الربط بـ Supabase و Vercel */}
        {/* ======================================================== */}
        {activeSubTab === 'supabase' && (
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-2">
              <h3 className="font-bold text-emerald-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>كيف تربط التطبيق بمشروعك في Supabase؟</span>
              </h3>
              <p>
                تم بالفعل تجهيز ملفات المخطط والاستيراد في مجلد مشروعك:
                <code className="mx-1 bg-white px-2 py-0.5 rounded font-mono text-emerald-800 font-bold">
                  supabase_schema.sql
                </code>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong className="block text-slate-900">إنشاء مشروع جديد في Supabase</strong>
                  <p className="text-slate-600 text-xs mt-0.5">
                    توجه إلى <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a> وأنشئ مشروعاً مجانياً جديداً.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong className="block text-slate-900">تنفيذ مخطط الجدول (SQL Editor)</strong>
                  <p className="text-slate-600 text-xs mt-0.5">
                    انسخ محتوى الملف <code className="bg-slate-100 px-1 py-0.5 rounded">supabase_schema.sql</code> والصقه في قسم <strong>SQL Editor</strong> في Supabase واضغط على <strong>Run</strong>. سيقوم بإنشاء الجدول وإدراج الأسئلة التأسيسية تلقائياً.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong className="block text-slate-900">إضافة المتغيرات البيئية (Environment Variables)</strong>
                  <p className="text-slate-600 text-xs mt-0.5">
                    احصل على رابط المشروع والمفتاح العام من <strong>Project Settings &gt; API</strong> وأضفهما في ملف <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code> محلياً، أو في لوحة تحكم <strong>Vercel</strong> عند النشر:
                  </p>
                  <pre dir="ltr" className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono mt-2 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
