import React, { useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  CheckCircle2,
  Save,
  X,
  RefreshCw,
  Trash2,
  CircleDashed,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { ExamRowFull, ExamPatch } from '../lib/supabase';
import {
  getExamsAdmin,
  updateExam,
  deleteExam,
  setExamDraft,
} from '../lib/supabase';

const COLOR_OPTIONS = ['emerald', 'purple', 'blue', 'orange', 'teal', 'rose'];
const ICON_OPTIONS = [
  { id: 'book', label: '📚 كتاب' },
  { id: 'graduation', label: '🎓 تخرّج' },
  { id: 'stethoscope', label: '🩺 تجهيزات' },
  { id: 'scale', label: '⚖️ قياس' },
  { id: 'building', label: '🏢 إدارة' },
];

export const ExamDataManager: React.FC = () => {
  const [exams, setExams] = useState<ExamRowFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [editExamId, setEditExamId] = useState<string | null>(null);
  const [busyExamId, setBusyExamId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // حقول التحرير للمباراة المفتوحة
  const [eName, setEName] = useState('');
  const [eShort, setEShort] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eIcon, setEIcon] = useState('book');
  const [eColor, setEColor] = useState('purple');
  const [eActive, setEActive] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { exams: rows, error } = await getExamsAdmin();
    setExams(rows);
    if (error) setMsg({ type: 'err', text: `تعذر جلب المباريات: ${error}` });
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, reloadKey]);

  const openEdit = (ex: ExamRowFull) => {
    setEditExamId(ex.id);
    setEName(ex.name);
    setEShort(ex.shortName || '');
    setEDesc(ex.description || '');
    setEIcon(ex.icon);
    setEColor(ex.color);
    setEActive(ex.isActive);
    setMsg(null);
  };

  const handleSaveExam = async (examId: string) => {
    if (!eName.trim()) {
      setMsg({ type: 'err', text: 'عنوان المباراة مطلوب.' });
      return;
    }
    setBusyExamId(examId);
    const patch: ExamPatch = {
      name: eName,
      shortName: eShort.trim() || null,
      description: eDesc.trim() || null,
      icon: eIcon,
      color: eColor,
      isActive: eActive,
    };
    const res = await updateExam(examId, patch);
    setBusyExamId(null);
    if (res.success) {
      setMsg({ type: 'ok', text: 'تم حفظ بيانات المباراة.' });
      setEditExamId(null);
      await reload();
    } else {
      setMsg({ type: 'err', text: `تعذر الحفظ: ${res.error}` });
    }
  };

  const handleToggleActive = async (ex: ExamRowFull) => {
    setBusyExamId(ex.id);
    const res = await updateExam(ex.id, { isActive: !ex.isActive });
    setBusyExamId(null);
    if (res.success) {
      setMsg({ type: 'ok', text: ex.isActive ? 'البطاقة عادت إلى «قريباً» (مخفية عن المترشحين).' : 'المباراة صارت نشطة وتظهر للمترشحين.' });
      await reload();
    } else {
      setMsg({ type: 'err', text: `تعذر التغيير: ${res.error}` });
    }
  };

  const handleOfficialApprove = async (ex: ExamRowFull, isDraft: boolean) => {
    const label = isDraft
      ? `اعتماد ${ex.draftCount} سؤالاً رسمياً في «${ex.name}» وإظهارها للمترشحين فوراً؟`
      : `إرجاع كل الأسئلة المعتمدة في «${ex.name}» إلى الوضع التجريبي الداخلي؟`;
    if (!window.confirm(label)) return;
    setBusyExamId(ex.id);
    const res = await setExamDraft(ex.id, isDraft);
    setBusyExamId(null);
    if (res.success) {
      setMsg({ type: 'ok', text: isDraft ? 'تم الاعتماد الرسمي للأسئلة التجريبية.' : 'أُرجعت الأسئلة إلى الوضع التجريبي.' });
      await reload();
    } else {
      setMsg({ type: 'err', text: `تعذر العملية: ${res.error}` });
    }
  };

  const handleDelete = async (ex: ExamRowFull) => {
    if (!window.confirm(`حذف نهائي لمباراة «${ex.name}» بكل أسئلتها (${ex.questionCount}) وإجاباتها وملخصاتها وموادها؟ لا يمكن التراجع.`)) return;
    if (!window.confirm('تأكيد أخير: الحذف لا رجعة فيه. اضغط موافق للمتابعة.')) return;
    setBusyExamId(ex.id);
    const res = await deleteExam(ex.id);
    setBusyExamId(null);
    if (res.success) {
      setMsg({ type: 'ok', text: 'حُذفت المباراة بنعناتها بالكامل.' });
      await reload();
    } else {
      setMsg({ type: 'err', text: `تعذر الحذف: ${res.error}` });
    }
  };

  return (
    <div className="space-y-5">
      {/* شريط الأدوات */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500 font-bold max-w-2xl leading-relaxed">
          تحرير يدوي مباشر: عنوان المباراة، وصفها، أيقونتها، تفعيل/إخفاء البطاقة،
          واعتماد الأسئلة التجريبية رسمياً. الاعتماد يُلغي المهلة التجريبية فوراً ويُظهر البنك للمترشحين.
        </p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث القائمة
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          msg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin" /> جارٍ جلب المباريات...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exams.map((ex) => {
            const editing = editExamId === ex.id;
            return (
              <div
                key={ex.id}
                className={`bg-white rounded-3xl border p-5 space-y-4 shadow-xs transition-all ${
                  editing ? 'border-emerald-400 ring-2 ring-emerald-100' : ex.isActive ? 'border-slate-200' : 'border-slate-200 opacity-80'
                }`}
              >
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 truncate">{ex.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono font-bold">{ex.id}</span>
                      {ex.isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black">نشطة</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-white font-black">قريباً</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      {ex.questionCount} سؤالاً · {ex.draftCount} منها تجريبي (مخفي عن الجمهور) · ترتيب {ex.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!editing && (
                      <button
                        onClick={() => openEdit(ex)}
                        title="تحرير البيانات"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* نموذج التحرير */}
                {editing ? (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">العنوان الرسمي</label>
                        <input
                          value={eName}
                          onChange={(e) => setEName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">الاختصار (شارة البطاقة)</label>
                        <input
                          value={eShort}
                          onChange={(e) => setEShort(e.target.value)}
                          placeholder="مثال: الأطر المختصين"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">وصف البطاقة</label>
                      <textarea
                        value={eDesc}
                        onChange={(e) => setEDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">الأيقونة</label>
                        <select
                          value={eIcon}
                          onChange={(e) => setEIcon(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white cursor-pointer"
                        >
                          {ICON_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">اللون</label>
                        <select
                          value={eColor}
                          onChange={(e) => setEColor(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white cursor-pointer"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                      المباراة نشطة (تظهر كبطاقة قابلة للفتح)
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => void handleSaveExam(ex.id)}
                        disabled={busyExamId === ex.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        حفظ التعديلات
                      </button>
                      <button
                        onClick={() => setEditExamId(null)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 flex-wrap border-t border-slate-100 pt-3">
                    <button
                      onClick={() => void handleToggleActive(ex)}
                      disabled={busyExamId === ex.id}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {ex.isActive ? 'إخفاء البطاقة (قريباً)' : 'إظهار كنشطة'}
                    </button>
                    <button
                      onClick={() => void handleOfficialApprove(ex, true)}
                      disabled={busyExamId === ex.id || ex.draftCount === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black cursor-pointer disabled:opacity-40 ${
                        ex.draftCount > 0 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <CircleDashed className="w-3.5 h-3.5" />
                      اعتماد رسمي ({ex.draftCount})
                    </button>
                    <button
                      onClick={() => void handleDelete(ex)}
                      disabled={busyExamId === ex.id}
                      title="حذف نهائي للمباراة بنعنتها"
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ملاحظة ترتيب الصفوف */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-bold leading-relaxed">
        ملاحظة: المواد (التخصصات) وعددها تدار ضمن الحزمة المستوردة (رفع حزمة مباراة)،
        ويراكب جدول subjects ترتيبها بالمعامل weight. لنقل مادة أو تظليل جزء منها زر
        «اعتماد المادة» يوجد في شاشة استعراض الأسئلة أسفل كل مجموعة.
      </div>
    </div>
  );
};
