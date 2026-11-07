import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkPassword } from '../lib/password';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

type Mode = 'login' | 'signup' | 'forgot' | 'recovery' | 'confirm' | 'done';

const TITLES: Record<Mode, string> = {
  login: 'تسجيل الدخول إلى المنصة',
  signup: 'إنشاء حساب مترشح جديد',
  forgot: 'استعادة كلمة المرور',
  recovery: 'تعيين كلمة مرور جديدة',
  confirm: 'تأكيد البريد الإلكتروني',
  done: 'تم تحديث كلمة المرور',
};

const SUBTITLES: Record<Mode, string> = {
  login: 'سجّل دخولك لحفظ تقدمك ومتابعة الأسئلة التي أنجزتها',
  signup: 'أنشئ حسابك لمتابعة تدريبك واجتياز الامتحانات التجريبية',
  forgot: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين',
  recovery: 'اختر كلمة مرور جديدة لحسابك',
  confirm: 'خطوة أخيرة لتفعيل حسابك',
  done: 'يمكنك الآن متابعة استعمال المنصة',
};

const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500';

// عدّاد تنازلي بالثواني حتى لحظة معينة
function useSecondsLeft(until: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (until <= Date.now()) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= until) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

function StrengthMeter({ password, email }: { password: string; email: string }) {
  if (!password) return null;
  const c = checkPassword(password, email);
  const colors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'];
  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < c.score ? colors[c.score] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        قوة كلمة المرور: <strong>{c.label}</strong>
        {c.issues.length > 0 && ` — ${c.issues.join('، ')}`}
      </p>
    </div>
  );
}

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) => {
  const {
    login,
    signup,
    requestPasswordReset,
    updatePassword,
    resendConfirmation,
    recoveryMode,
    authAvailable,
  } = useAuth();

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failedLogins, setFailedLogins] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [resendAt, setResendAt] = useState(0);

  const lockLeft = useSecondsLeft(lockUntil);
  const resendLeft = useSecondsLeft(resendAt);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);

  // عند الرجوع من رابط استعادة كلمة المرور نعرض شاشة التعيين مهما كانت الحالة
  const view: Mode = recoveryMode ? 'recovery' : mode;

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) firstFieldRef.current?.focus();
  }, [isOpen, view]);

  if (!isOpen) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setConfirm('');
    setShowPw(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);

    // فخ للروبوتات: حقل مخفي لا يملؤه البشر
    if (trap) {
      setNotice('تمت العملية.');
      return;
    }

    if (view === 'login') {
      if (lockLeft > 0) return;
      setBusy(true);
      const res = await login(email, password);
      setBusy(false);
      if (res.success) {
        setFailedLogins(0);
        setPassword('');
        onClose();
        return;
      }
      if (res.code === 'email_not_confirmed') {
        setMode('confirm');
        setPassword('');
        setNotice('لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد أو أعد إرسالها.');
        return;
      }
      const n = failedLogins + 1;
      if (n >= 5) {
        setFailedLogins(0);
        setLockUntil(Date.now() + 30_000);
        setError('محاولات فاشلة كثيرة. انتظر 30 ثانية ثم أعد المحاولة.');
      } else {
        setFailedLogins(n);
        setError(res.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
      return;
    }

    if (view === 'signup') {
      const name = fullName.trim();
      if (name.length < 2) {
        setError('أدخل اسمك الكامل.');
        return;
      }
      const check = checkPassword(password, email);
      if (!check.ok) {
        setError(`كلمة المرور غير مقبولة: ${check.issues.join('، ')}.`);
        return;
      }
      if (password !== confirm) {
        setError('تأكيد كلمة المرور غير مطابق.');
        return;
      }
      if (!accepted) {
        setError('يجب الموافقة على معالجة بياناتك لإنشاء الحساب.');
        return;
      }
      setBusy(true);
      const res = await signup(email, password, name);
      setBusy(false);
      if (!res.success) {
        setError(res.error || 'تعذر إنشاء الحساب.');
        return;
      }
      setPassword('');
      setConfirm('');
      if (res.needsConfirmation) {
        setMode('confirm');
        setResendAt(Date.now() + 60_000);
        return;
      }
      onClose();
      return;
    }

    if (view === 'forgot') {
      setBusy(true);
      const res = await requestPasswordReset(email);
      setBusy(false);
      if (!res.success) {
        setError(res.error || 'تعذر إرسال الرابط.');
        return;
      }
      // رسالة عامة: لا نكشف هل البريد مسجل أم لا
      setNotice('إن كان هذا البريد مسجلا لدينا فستصله رسالة لإعادة تعيين كلمة المرور خلال دقائق.');
      return;
    }

    if (view === 'recovery') {
      const check = checkPassword(password);
      if (!check.ok) {
        setError(`كلمة المرور غير مقبولة: ${check.issues.join('، ')}.`);
        return;
      }
      if (password !== confirm) {
        setError('تأكيد كلمة المرور غير مطابق.');
        return;
      }
      setBusy(true);
      const res = await updatePassword(password);
      setBusy(false);
      if (!res.success) {
        setError(res.error || 'تعذر تحديث كلمة المرور.');
        return;
      }
      setPassword('');
      setConfirm('');
      setMode('done');
    }
  };

  const handleResend = async () => {
    if (busy || resendLeft > 0) return;
    setBusy(true);
    setError(null);
    const res = await resendConfirmation(email);
    setBusy(false);
    if (!res.success) {
      setError(res.error || 'تعذر إعادة الإرسال.');
      return;
    }
    setNotice('أُعيد إرسال رسالة التأكيد. تفقد صندوق الوارد والرسائل غير المرغوبة.');
    setResendAt(Date.now() + 60_000);
  };

  const showEmail = view === 'login' || view === 'signup' || view === 'forgot';
  const showPassword = view === 'login' || view === 'signup' || view === 'recovery';
  const showConfirm = view === 'signup' || view === 'recovery';
  const isSubmitView = view !== 'confirm' && view !== 'done';

  const submitLabel = busy
    ? 'جارٍ التحقق...'
    : view === 'login'
    ? lockLeft > 0
      ? `انتظر ${lockLeft} ثانية`
      : 'دخول'
    : view === 'signup'
    ? 'إنشاء الحساب'
    : view === 'forgot'
    ? 'إرسال رابط الاستعادة'
    : 'حفظ كلمة المرور';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={() => {
        if (!recoveryMode) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            {view === 'done' ? (
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            ) : view === 'confirm' ? (
              <Mail className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Lock className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <h3 id="auth-title" className="text-2xl font-black text-slate-900">
            {TITLES[view]}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">{SUBTITLES[view]}</p>
        </div>

        {!authAvailable && (
          <div role="alert" className="p-3.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            الحسابات غير متاحة حاليا لأن الخادم غير مهيأ. يمكنك متابعة الاختبارات بدون حساب.
          </div>
        )}

        {error && (
          <div role="alert" className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            {notice}
          </div>
        )}

        {view === 'confirm' && (
          <div className="space-y-4 text-sm text-slate-700">
            <p>
              أرسلنا رسالة تأكيد إلى <strong dir="ltr">{email || 'بريدك'}</strong>. افتحها واضغط على الرابط
              لتفعيل حسابك، ثم سجّل الدخول.
            </p>
            <p className="text-xs text-slate-500">
              إن لم تجدها فتفقد الرسائل غير المرغوبة (Spam)، ثم أعد الإرسال.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={busy || resendLeft > 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                {resendLeft > 0 ? `إعادة الإرسال بعد ${resendLeft} ث` : 'إعادة إرسال رسالة التأكيد'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {view === 'done' && (
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl cursor-pointer"
          >
            متابعة
          </button>
        )}

        {isSubmitView && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* حقل فخ للروبوتات */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {view === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="auth-name"
                    ref={firstFieldRef}
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    placeholder="مثال: يوسف الإدريسي"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
              </div>
            )}

            {showEmail && (
              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="auth-email"
                    ref={view === 'signup' ? undefined : firstFieldRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="ltr"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${INPUT_CLASS} text-left`}
                    required
                  />
                </div>
              </div>
            )}

            {showPassword && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {view === 'login' ? 'كلمة المرور' : 'كلمة المرور الجديدة'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="auth-password"
                    ref={view === 'recovery' ? firstFieldRef : undefined}
                    type={showPw ? 'text' : 'password'}
                    autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                    dir="ltr"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT_CLASS} text-left pl-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    aria-pressed={showPw}
                    className="absolute left-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {view !== 'login' && <StrengthMeter password={password} email={email} />}
              </div>
            )}

            {showConfirm && (
              <div>
                <label htmlFor="auth-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" aria-hidden="true" />
                  <input
                    id="auth-confirm"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    dir="ltr"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`${INPUT_CLASS} text-left`}
                    required
                  />
                </div>
              </div>
            )}

            {view === 'signup' && (
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />
                <span>أوافق على استعمال بريدي ونتائجي لإدارة حسابي وتحليل تقدمي داخل المنصة.</span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy || (view === 'login' && lockLeft > 0) || !authAvailable}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{submitLabel}</span>
            </button>

            {view === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="block mx-auto text-xs font-bold text-slate-500 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            )}
          </form>
        )}

        {(view === 'login' || view === 'signup' || view === 'forgot') && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => switchMode(view === 'signup' ? 'login' : view === 'forgot' ? 'login' : 'signup')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              {view === 'login'
                ? 'ليس لديك حساب؟ أنشئ حساباً جديداً'
                : view === 'signup'
                ? 'لديك حساب بالفعل؟ سجل دخولك'
                : 'العودة لتسجيل الدخول'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
