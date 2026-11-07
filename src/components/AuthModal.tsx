import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, Lock, Mail, User, ShieldCheck, ArrowRight, 
  AlertCircle, GraduationCap, AlertTriangle, CheckCircle2,
  RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import type { CycleKey } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>( defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cycle, setCycle] = useState<CycleKey>('primary');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'forgot') {
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تفقد صندوق الوارد (وأحياناً مجلد SPAM).');
      } else {
        setErrorMsg(res.error || 'تعذر إرسال رابط إعادة التعيين. تحقق من البريد الإلكتروني.');
      }
      return;
    }

    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        // رسائل خطأ واضحة ومفصّلة
        if (res.error?.includes('email_not_confirmed') || res.error?.includes('لم يتم تأكيد')) {
          setErrorMsg('لم يتم تأكيد بريدك الإلكتروني بعد. تفقد رسالة التأكيد في صندوق الوارد.');
        } else {
          setErrorMsg(res.error || 'خطأ في البريد الإلكتروني أو كلمة المرور');
        }
      }
    } else {
      const res = await signup(email, password, fullName, cycle);
      setLoading(false);
      if (res.success) {
        // في حالة Supabase يوجد تأكيد بريد إلكتروني إلزامي
        if (res.needsEmailConfirmation) {
          setSuccessMsg(`تم إنشاء حسابك بنجاح! 🎉\n\nتم إرسال رسالة تأكيد إلى "${email}". يرجى فتح رسالة التأكيد والضغط على الرابط لتفعيل حسابك قبل تسجيل الدخول.\n\nتحقق من مجلد SPAM إذا لم تجد الرسالة.`);
        } else {
          onClose();
        }
      } else {
        // رسائل خطأ واضحة
        if (res.error?.includes('already registered') || res.error?.includes('مسجل بالفعل') || res.error?.includes('already exists')) {
          setErrorMsg('هذا البريد الإلكتروني مستخدم من قبل، جرب بريداً إلكترونياً آخر أو سجّل الدخول بحسابك الموجود.');
        } else {
          setErrorMsg(res.error || 'تعذر إنشاء الحساب');
        }
      }
    }
  };

  const handleFillAdminDemo = () => {
    setEmail('admin@crmef.ma');
    setPassword('admin123456');
    switchMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-4">
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* الترويسة */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            {mode === 'forgot' ? <RefreshCw className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {mode === 'login' && 'تسجيل الدخول إلى المنصة'}
            {mode === 'signup' && 'إنشاء حساب مترشح جديد'}
            {mode === 'forgot' && 'استرجاع كلمة المرور'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {mode === 'login' && 'سجل دخولك لحفظ تقدمك ومتابعة الأسئلة وتظليل ما تم إنجازه'}
            {mode === 'signup' && 'أنشئ حسابك لمتابعة تدريبك واجتياز الامتحانات التجريبية'}
            {mode === 'forgot' && 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'}
          </p>
        </div>

        {/* رسائل الخطأ */}
        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* رسائل النجاح */}
        {successMsg && (
          <div className="space-y-4 mb-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed whitespace-pre-line">{successMsg}</div>
            </div>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>الانتقال لتسجيل الدخول</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* نموذج الإدخال */}
        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* حقول التسجيل الإضافية */}
            {mode === 'signup' && (
              <>
                {/* الاسم الكامل */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="مثال: يوسف الإدريسي"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                      required
                      minLength={3}
                    />
                  </div>
                </div>

                {/* اختيار السلك الدراسي */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    السلك الدراسي المستهدف <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <select
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value as CycleKey)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="primary">سلك التعليم الابتدائي – التخصص المزدوج</option>
                      <option value="secondary_prep">سلك التعليم الثانوي الإعدادي</option>
                      <option value="secondary_qual">سلك التعليم الثانوي التأهيلي</option>
                    </select>
                  </div>
                </div>

                {/* صندوق التحذير الإلزامي */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs font-bold leading-relaxed flex items-start gap-2.5 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-amber-900 block mb-0.5">⚠️ تنبيه هام وإلزامي:</span>
                    السلك الذي تختاره الآن هو الذي سيتم تفعيل حسابك فيه بشكل دائم، ولن يكون بإمكانك الاطلاع على أسئلة أو ملخصات باقي الأسلاك بعد التسجيل.
                  </div>
                </div>
              </>
            )}

            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* كلمة المرور (تُخفى في وضع "نسيت") */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                    minLength={6}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* رابط "نسيت كلمة المرور" */}
                {mode === 'login' && (
                  <div className="mt-1.5 text-left">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}
                {mode === 'signup' && (
                  <p className="mt-1 text-[11px] text-slate-400 font-medium">6 أحرف على الأقل</p>
                )}
              </div>
            )}

            {/* ملاحظة تأكيد البريد عند التسجيل */}
            {mode === 'signup' && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>ستصلك رسالة بريدية لتأكيد حسابك فور إنشائه. يرجى التحقق من صندوق الوارد قبل تسجيل الدخول.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <span>
                {loading 
                  ? 'جارٍ المعالجة...' 
                  : mode === 'login' 
                  ? 'دخول' 
                  : mode === 'signup' 
                  ? 'إنشاء الحساب'
                  : 'إرسال رابط إعادة التعيين'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* روابط التنقل بين الأوضاع */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-1">
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-emerald-700 font-bold hover:underline cursor-pointer text-right"
              >
                لديك حساب بالفعل؟ سجل دخولك
              </button>
            )}
            {mode !== 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-emerald-700 font-bold hover:underline cursor-pointer text-right"
              >
                ليس لديك حساب؟ أنشئ حساباً مجانياً
              </button>
            )}
          </div>

          {/* تجربة سريعة لدخول المشرف */}
          <button
            type="button"
            onClick={handleFillAdminDemo}
            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
            title="تجربة الدخول كمسؤول للمنصة"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>حساب المشرف</span>
          </button>
        </div>
      </div>
    </div>
  );
};
