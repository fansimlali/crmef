/**
 * المرحلة 3 — زر «رفع حزمة مباراة» في لوحة المشرف.
 * التدفق (عقد SKILL_EXAM_CONTENT.md §1.1):
 *  1) اختيار exam_package.json → تحليل + فحص كامل في الواجهة (قواعد §1.1/§2/§3)
 *     — الرفع ممنوع عند أي خطأ قاطع، ويظهر التقرير.
 *  2) تنفيذ الرفع عبر RPC خادمي import_exam_package (المشرف فقط، ذرّي —
 *     كل شيء ينجح أو لا شيء) يفصل الإجابات إلى question_answers ويعلّم
 *     أول 20 سؤالاً/مادة is_triangle تلقائياً.
 *  3) بطاقة المباراة (باسمها وتخصصاتها كما في الملف) تظهر فوراً — بلا SQL ولا نشر كود.
 */
import React, { useRef, useState } from 'react';
import { FileJson, Upload, Loader2, CheckCircle2, XCircle, Database, AlertTriangle } from 'lucide-react';
import { validateExamPackage } from '../lib/examPackage';
import type { PackageValidationResult } from '../lib/examPackage';
import { importExamPackage } from '../lib/supabase';
import type { ExamImportSummary } from '../lib/supabase';

export const ExamPackageUploader: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<unknown | null>(null);
  const [validation, setValidation] = useState<PackageValidationResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; summary?: ExamImportSummary; error?: string } | null>(null);
  /** الوضع التجريبي (المهلة): الأسئلة/الملخصات مخفية عن الجمهور حتى الاعتماد من «بيانات المباريات». */
  const [stagingMode, setStagingMode] = useState<boolean>(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    setFileName('');
    setParsed(null);
    setValidation(null);
    setParseError('');
    setUploadResult(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      setParsed(json);
      setValidation(validateExamPackage(json));
    } catch (err: unknown) {
      setParseError(err instanceof Error ? `JSON غير صالح: ${err.message}` : 'JSON غير صالح.');
    }
  };

  const reset = () => {
    setFileName('');
    setParsed(null);
    setValidation(null);
    setParseError('');
    setUploadResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!parsed || !validation?.ok || uploading) return;
    setUploading(true);
    setUploadResult(null);
    // وضع المهلة التجريبية يُحقن في الحزمة قبل الرفع (exam.staging).
    const pkg = parsed as { exam?: Record<string, unknown> };
    const withStaging = {
      ...pkg,
      exam: { ...(pkg.exam || {}), staging: stagingMode },
    };
    setParsed(withStaging);
    const res = await importExamPackage(withStaging);
    setUploadResult(res);
    setUploading(false);
    if (res.success) reset();
  };

  const canUpload = Boolean(parsed && validation?.ok && fileName);

  return (
    <div className="space-y-5">
      {/* تعليمات مختصرة */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 leading-relaxed">
        <div className="flex items-start gap-2">
          <FileJson className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p>ارفع ملف <span className="font-black">exam_package.json</span> المستلَم من مطوّر المحتوى (حزمة واحدة: مباراة + مواد + أسئلة + إجابات + ملخصات).</p>
            <p className="mt-1 text-slate-500">الرفع <b>ذرّي</b>: إما الحزمة كلها أو لا شيء. لا يحتاج SQL ولا نشر كود، وتظهر بطاقة المباراة للمستخدمين فوراً. الإجابات تُفصل تلقائياً إلى جدول محمي، وتُعلَّم أول 20 سؤالاً/مادة عيّنة مجانية.</p>
            <p className="mt-1 text-slate-500">رفع نفس الحزمة مرة أخرى = تحديث وإضافة على نفس المباراة (لا نسخ مكررة).</p>
          </div>
        </div>
      </div>

      {/* الوضع التجريبي (المهلة): مخفي عن الجمهور حتى الاعتماد من الإدارة */}
      <label className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 cursor-pointer">
        <input
          type="checkbox"
          checked={stagingMode}
          onChange={(e) => setStagingMode(e.target.checked)}
          className="w-4 h-4 accent-amber-600 mt-0.5 shrink-0"
        />
        <div className="text-xs font-bold text-amber-900 leading-relaxed">
          <span className="block">
            وضع المهلة التجريبية (مُفعّل افتراضياً): تُرفع الأسئلة والملخصات <b>خفية عن الجمهور</b>،
            وتراها أنت وحدها في شاشة الإدارة لحين اعتمادها رسمياً من تبويب «بيانات المباريات»
            أو من زر الاعتماد في «استعراض الأسئلة».
          </span>
          <span className="block mt-1 text-amber-700">
            إلغاء التعليم = اعتماد رسمي فوري عند الرفع (تظهر للمترشحين مباشرة).
          </span>
        </div>
      </label>

      {/* اختيار الملف */}
      <label className="block cursor-pointer group">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] || null)}
        />
        <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-3xl border-2 border-dashed border-slate-300 group-hover:border-emerald-400 group-hover:bg-emerald-50/40 transition-all text-center px-4">
          <Upload className="w-9 h-9 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          {fileName ? (
            <>
              <span className="text-sm font-black text-slate-800">{fileName}</span>
              <span className="text-xs text-slate-500 font-semibold">اضغط لتغيير الملف</span>
            </>
          ) : (
            <>
              <span className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-colors">اختر ملف الحزمة هنا</span>
              <span className="text-xs text-slate-500 font-semibold">exam_package.json — الحزمة تبقى على جهازك ولا تُرفع لأي مكان علني</span>
            </>
          )}
        </div>
      </label>

      {/* خطأ تحليل ملف */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-2">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm font-bold text-rose-800">{parseError}</div>
        </div>
      )}

      {/* تقرير الفحص المسبق */}
      {validation && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              {validation.ok
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                : <XCircle className="w-5 h-5 text-rose-600" />}
              <h4 className="text-sm font-black text-slate-900">
                {validation.ok ? 'الحزمة سليمة — جاهزة للرفع' : `الحزمة مرفوضة: ${validation.errors.length === 40 ? '40+' : validation.errors.length} خطأ قاطع`}
              </h4>
              {validation.ok && validation.examName && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black">
                  {validation.examName}
                </span>
              )}
            </div>

            {/* إحصائيات */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-slate-900">{validation.stats.subjects}</div>
                <div className="text-[11px] font-bold text-slate-500">مادة</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-emerald-700">{validation.stats.questions}</div>
                <div className="text-[11px] font-bold text-slate-500">سؤالاً</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-amber-600">{validation.stats.trial}</div>
                <div className="text-[11px] font-bold text-slate-500">عيّنة مجانية (20/مادة)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-slate-900">{validation.stats.summaries}</div>
                <div className="text-[11px] font-bold text-slate-500">ملخص</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <div className="text-sm font-black text-slate-900">{validation.stats.positions.join(' • ')}</div>
                <div className="text-[11px] font-bold text-slate-500">توزيع مواضع الجواب الصحيح (منع التخمين)</div>
              </div>
            </div>

            {/* تفصيل المواد */}
            {validation.stats.perSubject.length > 0 && (
              <div className="mt-3 text-xs font-bold text-slate-600 space-y-1">
                {validation.stats.perSubject.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="truncate">{s.name || s.key}</span>
                    <span className="shrink-0 text-slate-500">
                      {s.count > 0 ? `${s.count} سؤالاً (${s.trial} مجاني)` : 'قيد التحضير (بلا أسئلة)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* قائمة الأخطاء القاطعة */}
          {validation.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-black text-rose-800">الأخطاء التي تمنع الرفع (أول 40):</span>
              </div>
              <ul className="text-xs font-bold text-rose-700 space-y-1 list-disc list-inside leading-relaxed">
                {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* زر التنفيذ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={!canUpload || uploading}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black text-white transition-all cursor-pointer ${
                canUpload && !uploading
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {uploading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Database className="w-5 h-5" />}
              {uploading ? 'جارٍ تنفيذ الرفع الذرّي...' : 'رفع الحزمة إلى قاعدة البيانات'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              إلغاء / ملف آخر
            </button>
          </div>
        </div>
      )}

      {/* نتيجة الرفع */}
      {uploadResult && (
        <div className={`p-4 rounded-2xl border-2 ${uploadResult.success ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
          {uploadResult.success ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-black text-emerald-800">تم رفع الحزمة نجاحاً — بطاقة المباراة عاشت فوراً!</span>
              </div>
              {uploadResult.summary && (
                <div className="text-xs font-bold text-emerald-700 space-y-1">
                  <div>المباراة: {uploadResult.summary.name} (id: {uploadResult.summary.exam_id})</div>
                  <div>مواد: {uploadResult.summary.subjects} • أسئلة: {uploadResult.summary.questions} • عيّنة مجانية: {uploadResult.summary.trial} • إجابات محمية: {uploadResult.summary.answers} • ملخصات: {uploadResult.summary.summaries}</div>
                  <div className="text-emerald-600">استعد شاشة المباريات لرؤية البطاقة الجديدة بعدد أسئلتها الحقيقي.</div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-rose-800 leading-relaxed whitespace-pre-wrap break-all">
                رفض الخادم الحزمة: {uploadResult.error}
                <div className="mt-1 text-rose-600">لا شيء نصَّب — الحزمة كلها أُلغيت. صحح الملف وأعد الرفع.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
