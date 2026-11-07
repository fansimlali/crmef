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
  Check
} from 'lucide-react';
import { CYCLES } from '../types';
import QRCode from 'qrcode';

const SUBSCRIPTION_AMOUNT = 50;
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
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nameQrUrl, setNameQrUrl] = useState<string>('/name_qr.png');
  const [copiedName, setCopiedName] = useState(false);

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

  if (!upgradeModalOpen) return null;

  const cycleName = CYCLES.find(c => c.id === user?.cycle)?.name || 'السلك المختار';

  const handleCopyName = () => {
    navigator.clipboard.writeText(BENEFICIARY_NAME).then(() => {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPG أو PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً (يجب ألا يتعدى 5 ميغابايت)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      setErrorMsg('يرجى إرفاق صورة واضحة لوصل التحويل أو الدفع');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitSubscriptionRequest(
      receiptImage, 
      paymentTab === 'bank' ? 'CIH Bank / Application' : 'Cash Plus / Wafacash', 
      ''
    );
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(true);
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء إرسال الطلب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        {/* زر الإغلاق */}
        <button
          onClick={() => {
            setUpgradeModalOpen(false);
            setSuccessMsg(false);
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
              {SUBSCRIPTION_AMOUNT} درهم
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            افتح كامل بنك الأسئلة والمحاكاة الشاملة ومكتبة الملخصات المحمية في <strong className="text-emerald-700 font-bold">{cycleName}</strong>.
          </p>
        </div>

        {/* إذا كان المستخدم مفعلاً بالفعل */}
        {isPremium && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold text-center space-y-2 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>أنت بالفعل مشترك كامل في المنصة! جميع ميزات سلكك مفتوحة بالكامل.</p>
          </div>
        )}

        {/* حالة الطلب الحالي إذا كان قيد المراجعة */}
        {currentRequest?.status === 'pending' && !successMsg && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-3 mb-6">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm mb-1">طلبك قيد المراجعة حالياً من قِبل المشرف العام</p>
              <p className="font-medium text-amber-800 leading-relaxed">
                لقد تم إرسال صورة الوصل بنجاح بتاريخ {new Date(currentRequest.createdAt).toLocaleDateString('ar-MA')}. 
                يقوم المشرف بمراجعة الوصل وتفعيل حسابك في أقرب وقت.
              </p>
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
              <p className="text-[11px] text-rose-700">يرجى إعادة رفع وصل سليم ومطابق عبر النموذج أسفله.</p>
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
            <button
              onClick={() => {
                setUpgradeModalOpen(false);
                setSuccessMsg(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        ) : (
          !isPremium && (
            <div className="space-y-6">
              {/* مميزات الاشتراك */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-black text-slate-700 block mb-1">ماذا ستحصل عند التفعيل:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                  {[
                    'فتح بنك الـ 100 سؤال لكل مادة',
                    'المحاكاة الشاملة الكاملة بلا حدود',
                    'فتح جميع الملخصات المحمية لسلكك',
                    'حفظ نتائجك ومتابعة تقدمك دائماً',
                  ].map((f, i) => (
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
                    واجب الاشتراك: {SUBSCRIPTION_AMOUNT} درهم
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
                          <span className="font-black text-emerald-700 text-sm">{SUBSCRIPTION_AMOUNT} درهم</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-950 bg-amber-100/80 rounded-xl p-3 leading-relaxed font-semibold border border-amber-200">
                        📱 افتح تطبيق <strong>CIH Mobile</strong>، اختر خدمة التحويل عبر <strong>QR Code</strong>، وامسح الرمز أعلاه لتحويل <strong>{SUBSCRIPTION_AMOUNT} درهم</strong> فورياً، ثم ارفع صورة الوصل أسفله.
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
                        🏢 توجه إلى أقرب وكالة (كاش بلوس، وفاكاش، بريد كاش...)، وأرسل حوالة مالية بمبلغ <strong>{SUBSCRIPTION_AMOUNT} درهم</strong> إلى المستفيد: <strong>{BENEFICIARY_NAME}</strong> (يمكن للوكيل مسح الرمز أعلاه للتأكد من كتابة الاسم بدقة). بعد استلام الوصل ارفعه أسفله لتفعيل حسابك مباشرة.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* نموذج رفع الوصل فقط */}
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
                  
                  {receiptImage ? (
                    <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/40 p-3 flex items-center gap-3">
                      <img 
                        src={receiptImage} 
                        alt="إثبات الدفع" 
                        className="w-16 h-16 object-cover rounded-xl border border-emerald-200"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-bold text-emerald-800 block truncate">تم اختيار صورة الوصل</span>
                        <span className="text-slate-500 text-[11px]">جاهزة للإرسال والمراجعة</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 cursor-pointer"
                      >
                        تغيير
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">اضغط هنا لرفع صورة الوصل (وصل البنك أو وصل الوكالة)</span>
                      <span className="text-[11px] text-slate-400 mt-1">PNG أو JPG حتى 5 ميغابايت</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* زر الإرسال */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ إرسال الوصل...' : 'إرسال إثبات الدفع لطلب التفعيل'}</span>
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
};
