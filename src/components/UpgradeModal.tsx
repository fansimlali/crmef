import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Crown, 
  CheckCircle2, 
  Upload, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  Sparkles,
  Building2,
  Smartphone,
  Copy,
  Check,
  PauseCircle,
  MessageCircle,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { getExamConfigs } from '../lib/supabase';
import QRCode from 'qrcode';
import { trackInitiateCheckout, trackPurchase } from '../lib/pixel';
import { compressAndNormalizeReceiptImage } from '../lib/imageCompressor';

// الخطتان السعريةان: شامل لكل المباريات (100 درهم) أو مباراة واحدة (50 درهم)
const PLAN_ALL_PRICE_MAD = 100;
const PLAN_SINGLE_PRICE_MAD = 50;
const BENEFICIARY_NAME = 'FADEL SIMLALI';

export const UpgradeModal: React.FC = () => {
  const { 
    user, 
    upgradeModalOpen, 
    setUpgradeModalOpen, 
    submitSubscriptionRequest, 
    currentRequest,
    isPremium 
  } = useAuth();

  const [paymentTab, setPaymentTab] = useState<'bank' | 'agency'>('bank');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nameQrUrl, setNameQrUrl] = useState<string>('/name_qr.png');
  const [copiedName, setCopiedName] = useState(false);

  // اختيار الخطة: شامل (100 درهم لكل المباريات) أو مباراة واحدة (50 درهم)
  const [plan, setPlan] = useState<'all' | 'single'>('all');
  const [scopeExamId, setScopeExamId] = useState('crmef');

  // قائمة المباريات النشطة تلقائياً من جدول exams (أي مباراة جديدة تظهر هنا)
  const [examOptions, setExamOptions] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    let alive = true;
    getExamConfigs()
      .then(({ exams }) => {
        if (alive) {
          setExamOptions(
            exams
              .filter((e) => e.isActive)
              .map((e) => ({ id: e.id, name: e.name || e.shortName || e.id }))
          );
        }
      })
      .catch(() => { /* يبقى الافتراضي crmef */ });
    return () => { alive = false; };
  }, []);

  const planPrice = plan === 'single' ? PLAN_SINGLE_PRICE_MAD : PLAN_ALL_PRICE_MAD;
  const scopeExamName =
    examOptions.find((e) => e.id === scopeExamId)?.name || scopeExamId.toUpperCase();

  // رابط واتساب الرسمي والمباشر مع التعبئة التلقائية لبريد المستخدم (Task 2)
  const userEmail = user?.email || '';
  const whatsappUrl = `https://wa.me/212767471061?text=Bonjour%2C%20je%20veux%20envoyer%20mon%20re%C3%A7u%20CRMEF%20Prep.%20Mon%20email%20est%20%3A%20${encodeURIComponent(userEmail)}`;

  // توليد QR Code للاسم fadel simlali تلقائياً
  useEffect(() => {
    QRCode.toDataURL(BENEFICIARY_NAME, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setNameQrUrl(url))
      .catch(() => setNameQrUrl('/name_qr.png'));
  }, []);

  // بعد التفعيل لا معنى لفتح نافذة الترقية: نُغلقها
  useEffect(() => {
    if (isPremium && upgradeModalOpen) {
      setUpgradeModalOpen(false);
    }
  }, [isPremium, upgradeModalOpen, setUpgradeModalOpen]);

  // تتبع حدث بدء إجراء الدفع عند فتح نافذة الترقية
  useEffect(() => {
    if (upgradeModalOpen) {
      trackInitiateCheckout();
    }
  }, [upgradeModalOpen]);

  if (!upgradeModalOpen) return null;

  const handleCopyName = () => {
    navigator.clipboard.writeText(BENEFICIARY_NAME).then(() => {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    });
  };

  // معالجة وضغط الصورة فور اختيارها لحل مشاكل آيفون (HEIC) والصور الضخمة (>5MB)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setCompressing(true);

    try {
      const { file: normalizedFile, previewUrl } = await compressAndNormalizeReceiptImage(file);
      setReceiptFile(normalizedFile);
      setReceiptPreview(previewUrl);
    } catch (err: any) {
      console.warn('Image compression fallback:', err);
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const resetReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setErrorMsg('يرجى إرفاق صورة واضحة لوصل التحويل أو الدفع');
      return;
    }
    if (plan === 'single' && !scopeExamId) {
      setErrorMsg('اختر المباراة التي تريد الاشتراك بها أولاً');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitSubscriptionRequest(
      receiptFile,
      paymentTab === 'bank' ? 'CIH Bank / Application' : 'Cash Plus / Wafacash',
      plan,
      plan === 'single' ? scopeExamId : null
    );
    setSubmitting(false);

    if (res.success) {
      trackPurchase(paymentTab === 'bank' ? 'CIH Bank' : 'Cash Agency');
      setSuccessMsg(true);
      resetReceipt();
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء إرسال الطلب');
    }
  };

  // زر واتساب الإلزامي الاحتياطي (رسائل فقط)
  const renderWhatsAppButton = () => (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer no-underline text-center"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
        <span>أرسل الوصل عبر واتساب (رسائل فقط)</span>
      </div>
      <span className="text-[10px] sm:text-[11px] text-emerald-50 font-semibold opacity-95">
        Messages only, no calls - رسائل فقط، المرجو عدم الاتصال
      </span>
    </a>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        {/* زر الإغلاق */}
        <button
          onClick={() => {
            setUpgradeModalOpen(false);
            setSuccessMsg(false);
            setErrorMsg(null);
            resetReceipt();
          }}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* الترويسة الذهبية */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
            <span>الترقية إلى مشترك كامل</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              من {PLAN_SINGLE_PRICE_MAD} درهم
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            اختر خطتك: <strong className="text-amber-700 font-bold">شامل {PLAN_ALL_PRICE_MAD} درهم</strong> لكل المباريات
            الحالية والمقبلة، أو <strong className="text-emerald-700 font-bold">{PLAN_SINGLE_PRICE_MAD} درهم</strong> لمباراة واحدة.
          </p>
        </div>

        {/* تنبيه الزائر غير المسجل */}
        {!user && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold text-center space-y-2 mb-6">
            <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
            <p>يرجى تسجيل الدخول أو إنشاء حساب أولاً لربط الاشتراك بحسابك فور التحقق.</p>
          </div>
        )}

        {/* إذا كان المستخدم مفعلاً بالفعل */}
        {isPremium && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold text-center space-y-2 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>أنت بالفعل مشترك كامل في المنصة! جميع ميزات سلكك مفتوحة بالكامل.</p>
          </div>
        )}

        {/* حالة الطلب الحالي إذا كان قيد المراجعة */}
        {currentRequest?.status === 'pending' && !successMsg && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm mb-1">طلبك قيد المراجعة حالياً من قِبل المشرف العام</p>
                <p className="font-medium text-amber-800 leading-relaxed">
                  لقد تم إرسال صورة الوصل بنجاح بتاريخ {new Date(currentRequest.createdAt).toLocaleDateString('ar-MA')}. 
                  يقوم المشرف بمراجعة الوصل وتفعيل حسابك في أقرب وقت.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <p className="text-[11px] text-amber-800 font-semibold mb-2">
                هل تريد تسريع تفعيل حسابك؟ يمكنك إرسال الوصل للمشرف العام عبر واتساب مباشرة:
              </p>
              {renderWhatsAppButton()}
            </div>
          </div>
        )}

        {/* إذا تم رفض الطلب مع ذكر السبب */}
        {currentRequest?.status === 'rejected' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-bold flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm mb-1">تنبيه: تم رفض إثبات الدفع السابق</p>
              <p className="font-medium text-rose-800 leading-relaxed mb-2">
                سبب الرفض: <strong>{currentRequest.rejectionReason || 'صورة الوصل غير واضحة أو المبلغ ناقص'}</strong>
              </p>
              <p className="text-[11px] text-rose-700">يرجى إعادة رفع وصل سليم ومطابق عبر النموذج أسفله، أو مراسلتنا في واتساب.</p>
            </div>
          </div>
        )}

        {/* إذا كان الحساب معلقاً مؤقتاً */}
        {currentRequest?.status === 'suspended' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-bold space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm mb-1">حسابك معلّق مؤقتاً</p>
                <p className="font-medium text-amber-800 leading-relaxed">
                  {currentRequest.rejectionReason || 'تم تعليق هذا الحساب مؤقتاً من قِبل إدارة المنصة.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <p className="text-[11px] text-amber-800 font-semibold mb-2">
                تواصل مع الإدارة لطلب رفع التعليق وإعادة التفعيل:
              </p>
              {renderWhatsAppButton()}
            </div>
          </div>
        )}

        {/* رسالة نجاح الإرسال الفوري */}
        {successMsg ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-black text-slate-900">تم إرسال إثبات الدفع بنجاح!</h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              سيتولى المشرف العام مراجعة وصل التحويل وتفعيل حسابك كمشترك كامل في أقرب وقت. شكراً لثقتك بالمنصة!
            </p>

            <div className="pt-2 max-w-sm mx-auto space-y-2">
              <span className="text-xs text-slate-500 font-bold block">لتسريع المعالجة الفورية:</span>
              {renderWhatsAppButton()}
            </div>

            <button
              onClick={() => {
                setUpgradeModalOpen(false);
                setSuccessMsg(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer mt-4"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          !isPremium && (
            <div className="space-y-6">
              {/* اختيار الخطة: شامل أم مباراة واحدة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlan('all')}
                  className={`text-start p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    plan === 'all'
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                      : 'border-slate-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      اشتراك شامل
                    </span>
                    <span className="text-lg font-black text-amber-600">{PLAN_ALL_PRICE_MAD} درهم</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    كل المباريات الحالية + كل مباراة تنزل مستقبلاً بلا أي مبلغ إضافي.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('single')}
                  className={`text-start p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    plan === 'single'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                      <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                      اشتراك مباراة واحدة
                    </span>
                    <span className="text-lg font-black text-emerald-600">{PLAN_SINGLE_PRICE_MAD} درهم</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    بنك الأسئلة والملخصات لمباراة واحدة تختارها من القائمة.
                  </p>
                </button>
              </div>

              {/* قائمة اختيار المباراة للخطة الفردية */}
              {plan === 'single' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    المباراة التي تريد الاشتراك بها <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={scopeExamId}
                    onChange={(e) => setScopeExamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-800 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                  >
                    {examOptions.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                    {examOptions.length === 0 && <option value="crmef">مباراة التعليم (CRMEF)</option>}
                  </select>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">
                    المبلغ المطلوب إرساله: 50 درهم — يقتصر الوصول على هذه المباراة فقط.
                  </p>
                </div>
              )}

              {/* مميزات الاشتراك */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-black text-slate-700 block mb-1">
                  {plan === 'single'
                    ? `ماذا ستحصل عند التفعيل (اشتراك ${scopeExamName}):`
                    : 'ماذا ستحصل عند التفعيل (اشتراك شامل):'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                  {(plan === 'single'
                    ? [
                        `بنك الأسئلة الكامل لمباراة ${scopeExamName}`,
                        `المحاكاة الشاملة لمباراة ${scopeExamName}`,
                        `الملخصات المحمية لمباراة ${scopeExamName}`,
                        'حفظ نتائجك ومتابعة تقدمك دائماً',
                      ]
                    : [
                        'كل المباريات الحالية (CRMEF + أطر المختصين)',
                        'كل مباراة جديدة تنزل مستقبلاً بلا زيادة',
                        'فتح جميع الملخصات المحمية لسلكك',
                        'حفظ نتائجك ومتابعة تقدمك دائماً',
                      ]
                  ).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* بطاقة معلومات الدفع مع التبديل بين الحساب البنكي والوكالات */}
              <div className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl overflow-hidden shadow-xs">
                {/* رأس البطاقة ومبلغ الاشتراك */}
                <div className="bg-amber-500 px-4 py-3 flex items-center justify-between text-white">
                  <span className="font-extrabold text-sm flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>طريقة الدفع ومسح الرمز (QR)</span>
                  </span>
                  <span className="bg-white text-amber-700 font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-xs">
                    واجب الاشتراك: {planPrice} درهم
                  </span>
                </div>

                {/* أزرار التبديل بين الخيارين */}
                <div className="p-3 bg-amber-100/60 border-b border-amber-200/80 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentTab('bank')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentTab === 'bank'
                        ? 'bg-white text-emerald-900 shadow-xs border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>تطبيق البنك (CIH Bank)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTab('agency')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentTab === 'agency'
                        ? 'bg-white text-emerald-900 shadow-xs border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>وكالات كاش بلوس / وفاكاش</span>
                  </button>
                </div>

                {/* محتوى التبويب 1: التحويل البنكي الفوري عبر CIH QR */}
                {paymentTab === 'bank' && (
                  <div className="p-5 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in">
                    {/* صورة QR Code البنكي الحقيقي */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="bg-white p-2.5 rounded-2xl border-2 border-amber-200 shadow-md">
                        <img
                          src="/payment_qr.png"
                          alt="QR Code الحساب البنكي"
                          className="w-44 h-44 object-contain rounded-xl"
                        />
                      </div>
                      <span className="text-[11px] text-amber-900 font-extrabold text-center">
                        امسح الرمز عبر تطبيق CIH Bank للتحويل الفوري
                      </span>
                    </div>

                    {/* تفاصيل الحساب البنكي */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">البنك:</span>
                          <span className="font-extrabold text-slate-800">CIH Bank</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Code SWIFT:</span>
                          <span className="font-mono font-black text-sky-600 tracking-wider">CIHMMAMC</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">المبلغ المطلوب:</span>
                          <span className="font-black text-emerald-700 text-sm">{planPrice} درهم</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-950 bg-amber-100/80 rounded-xl p-3 leading-relaxed font-semibold border border-amber-200">
                        📱 افتح تطبيق <strong>CIH Mobile</strong>، اختر خدمة التحويل عبر <strong>QR Code</strong>، وامسح الرمز أعلاه لتحويل <strong>{planPrice} درهم</strong> ({plan === 'single' ? `اشتراك مباراة واحدة: ${scopeExamName}` : 'اشتراك شامل'}) فورياً، ثم ارفع صورة الوصل أسفله.
                      </div>
                    </div>
                  </div>
                )}

                {/* محتوى التبويب 2: التحويل عبر الوكالات مع QR Code للاسم الصحيح */}
                {paymentTab === 'agency' && (
                  <div className="p-5 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in">
                    {/* رمز QR للاسم fadel simlali */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="bg-white p-2.5 rounded-2xl border-2 border-amber-200 shadow-md">
                        <img
                          src={nameQrUrl}
                          alt="QR Code الاسم الصحيح للتحويل"
                          className="w-44 h-44 object-contain rounded-xl"
                        />
                      </div>
                      <span className="text-[11px] text-amber-900 font-extrabold text-center">
                        امسح الرمز لقراءة الاسم الصحيح للتحويل
                      </span>
                    </div>

                    {/* تفاصيل الاسم للوكالة */}
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <div className="text-[11px] text-slate-600 font-bold mb-1">
                          اسم المستفيد للتحويل (Cash Plus / Wafacash / Barid Cash):
                        </div>
                        <div className="bg-white border-2 border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                          <div>
                            <span className="font-mono font-black text-base text-slate-900 tracking-wider select-all block">
                              {BENEFICIARY_NAME}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              الحروف اللاتينية الصحيحة لموظف الوكالة
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyName}
                            title="نسخ الاسم"
                            className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all cursor-pointer shrink-0 flex items-center gap-1 font-bold text-xs"
                          >
                            {copiedName ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-950 bg-amber-100/80 rounded-xl p-3 leading-relaxed font-semibold border border-amber-200">
                        🏢 توجه إلى أقرب وكالة (كاش بلوس، وفاكاش، بريد كاش...)، وأرسل حوالة مالية بمبلغ <strong>{planPrice} درهم</strong> ({plan === 'single' ? `اشتراك مباراة واحدة: ${scopeExamName}` : 'اشتراك شامل'}) إلى المستفيد: <strong>{BENEFICIARY_NAME}</strong> (يمكن للوكيل مسح الرمز أعلاه للتأكد من كتابة الاسم بدقة). بعد استلام الوصل ارفعه أسفله لتفعيل حسابك مباشرة.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* نموذج رفع الوصل وزر واتساب الفوري */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* منطقة رفع الصورة */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    صورة وصل التحويل أو الدفع <span className="text-rose-500">*</span>
                  </label>
                  
                  {compressing ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 flex flex-col items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>جارٍ معالجة وضغط صورة الوصل تلقائياً لسرعة الرفع...</span>
                    </div>
                  ) : receiptPreview ? (
                    <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/40 p-3 flex items-center gap-3">
                      <img 
                        src={receiptPreview} 
                        alt="إثبات الدفع" 
                        className="w-16 h-16 object-cover rounded-xl border border-emerald-200"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-bold text-emerald-800 block truncate">تم اختيار صورة الوصل بنجاح</span>
                        <span className="text-slate-500 text-[11px]">جاهزة للإرسال والمراجعة الفورية</span>
                      </div>
                      <button
                        type="button"
                        onClick={resetReceipt}
                        className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 cursor-pointer"
                      >
                        تغيير
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700 text-center">اضغط هنا لاختيار صورة الوصل (من الهاتف أو الكاميرا أو الحاسوب)</span>
                      <span className="text-[11px] text-slate-400 mt-1">يدعم جميع صيغ الصور (PNG, JPG, HEIC, WEBP)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* أزرار الإجراء: رفع على المنصة + زر واتساب الإلزامي */}
                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting || compressing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{submitting ? 'جارٍ إرسال الوصل...' : 'إرسال إثبات الدفع لطلب التفعيل'}</span>
                  </button>

                  {/* فاصل مرئي "أو" */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">أو أرسله فورياً عبر</span>
                  </div>

                  {/* زر الواتساب الإلزامي (Task 2: Messages Only, No Calls) */}
                  {renderWhatsAppButton()}
                </div>

                {/* رابط التواصل المباشر عبر صفحة فيسبوك */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <a
                    href="https://web.facebook.com/profile.php?id=61596296884826"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>لديك أي استفسار حول الدفع أو التفعيل؟ تواصل معنا عبر صفحة فيسبوك</span>
                  </a>
                </div>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
};
