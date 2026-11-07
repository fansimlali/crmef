import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Crown, 
  CheckCircle2, 
  Upload, 
  CreditCard, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  Sparkles
} from 'lucide-react';
import { CYCLES } from '../types';

export const UpgradeModal: React.FC = () => {
  const { 
    user, 
    upgradeModalOpen, 
    setUpgradeModalOpen, 
    submitSubscriptionRequest, 
    currentRequest,
    isPremium 
  } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('CIH Bank');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!upgradeModalOpen) return null;

  const cycleName = CYCLES.find(c => c.id === user?.cycle)?.name || 'السلك المختار';

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

    const res = await submitSubscriptionRequest(receiptImage, paymentMethod, notes);
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
            <span>الترقية إلى حساب مشترك كامل</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              VIP
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
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>فتح بنك الـ 100 سؤال لكل مادة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>المحاكاة الشاملة الكاملة بلا حدود</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>فتح جميع الملخصات المحمية لسلكك</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>حفظ نتائجك ومتابعة تقدمك دائماً</span>
                  </div>
                </div>
              </div>

              {/* بيانات الحساب البنكي للدفع */}
              <div className="border border-amber-200 bg-amber-50/60 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>معلومات الحساب البنكي للتحويل:</span>
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900">
                    واجب الاشتراك: 100 درهم
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono text-slate-800 bg-white p-3 rounded-xl border border-amber-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">البنك:</span>
                    <span className="font-bold">التجاري وفا بنك / CIH Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">المستفيد:</span>
                    <span className="font-bold">منصة CRMEF للتكوين</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">رقم الحساب (RIB):</span>
                    <span className="font-bold select-all text-emerald-700">011 780 0000 1234567890 12</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  * يمكنك أيضاً الدفع عبر وكالات كاش بلوس (Cash Plus) أو بريد بنك وإرفاق وصل الدفع.
                </p>
              </div>

              {/* نموذج رفع الوصل */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وسيلة الدفع المستعملة</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="CIH Bank">تطبيق CIH Bank (تحويل فوري)</option>
                      <option value="Attijariwafa Bank">التجاري وفا بنك</option>
                      <option value="Al Barid Bank">بريد بنك</option>
                      <option value="Cash Plus">وكالة كاش بلوس (Cash Plus)</option>
                      <option value="Bank Transfer">بنك مغربي آخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظة أو رقم الحوالة (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: تحويل باسم عادل"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

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
                      <span className="text-xs font-bold text-slate-700">اضغط هنا لرفع صورة الوصل</span>
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
