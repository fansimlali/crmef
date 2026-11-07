// ترجمة أخطاء Supabase Auth إلى رسائل عربية واضحة دون كشف تفاصيل تقنية أو تسهيل تخمين الحسابات.
interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  email_not_confirmed: 'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد في بريدك الإلكتروني.',
  user_already_exists: 'يوجد حساب بهذا البريد. سجّل الدخول أو استعمل «نسيت كلمة المرور».',
  weak_password: 'كلمة المرور ضعيفة. اختر كلمة أطول وأقل شيوعا.',
  same_password: 'اختر كلمة مرور مختلفة عن السابقة.',
  over_request_rate_limit: 'محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.',
  over_email_send_rate_limit: 'أُرسلت رسائل كثيرة. انتظر قليلا ثم أعد المحاولة.',
  email_address_invalid: 'صيغة البريد الإلكتروني غير صحيحة.',
  signup_disabled: 'إنشاء الحسابات متوقف مؤقتا.',
  validation_failed: 'البيانات المدخلة غير صالحة.',
  session_expired: 'انتهت الجلسة. أعد تسجيل الدخول.',
  captcha_failed: 'تعذر التحقق الأمني. أعد المحاولة.',
};

export const GENERIC_AUTH_ERROR = 'تعذر إتمام العملية. تحقق من الاتصال وأعد المحاولة.';

export function translateAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return BY_CODE.over_request_rate_limit;

  const m = (error.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return BY_CODE.invalid_credentials;
  if (m.includes('email not confirmed')) return BY_CODE.email_not_confirmed;
  if (m.includes('already registered')) return BY_CODE.user_already_exists;
  if (m.includes('password should be')) return BY_CODE.weak_password;
  if (m.includes('rate limit') || m.includes('too many')) return BY_CODE.over_request_rate_limit;
  if (m.includes('invalid email') || m.includes('unable to validate email')) return BY_CODE.email_address_invalid;
  return GENERIC_AUTH_ERROR;
}
