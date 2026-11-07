import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, GraduationCap, AlertTriangle } from 'lucide-react';
import type { CycleKey } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cycle, setCycle] = useState<CycleKey>('primary');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'خطأ في البريد الإلكتروني أو كلمة المرور');
      }
    } else {
      const res = await signup(email, password, fullName, cycle);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'تعذر إنشاء الحساب');
      }
    }
  };

  const handleFillAdminDemo = () => {
    setEmail('admin@crmef.ma');
    setPassword('admin123456');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
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
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {mode === 'login' ? 'تسجيل الدخول إلى المنصة' : 'إنشاء حساب مترشح جديد'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {mode === 'login'
              ? 'سجل دخولك لحفظ تقدمك ومتابعة الأسئلة وتظليل ما تم إنجازه'
              : 'أنشئ حسابك لمتابعة تدريبك واجتياز الامتحانات التجريبية'}
          </p>
        </div>

        {/* رسائل التنبيه والخطأ */}
        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* نموذج الإدخال */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
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

              {/* صندوق التحذير الإلزامي باللون الكهرماني */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs font-bold leading-relaxed flex items-start gap-2.5 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-amber-900 block mb-0.5">⚠️ تنبيه هام وإلزامي للمشتركين:</span>
                  السلك الذي تختاره الآن هو الذي سيتم تفعيل حسابك فيه بشكل دائم، ولن يكون بإمكانك الاطلاع على أسئلة أو ملخصات باقي الأسلاك بعد التسجيل.
                </div>
              </div>
            </>
          )}

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
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <span>{loading ? 'جارٍ التحقق...' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* التبديل بين الدخول والإنشاء */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setErrorMsg(null);
            }}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>

          {/* تجربة سريعة لدخول المشرف */}
          <button
            type="button"
            onClick={handleFillAdminDemo}
            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
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

