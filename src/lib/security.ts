/**
 * أدوات الأمان والتشفير (Defensive Security Utilities)
 */

// تشفير كلمة المرور باستخدام SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_crmef_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// التحقق من صحة رابط أو صورة الوصل لمنع حقن روابط خبيثة
export function isValidReceiptUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  // يسمح بصور Base64 الصالحة
  if (url.startsWith('data:image/png;base64,') ||
      url.startsWith('data:image/jpeg;base64,') ||
      url.startsWith('data:image/jpg;base64,') ||
      url.startsWith('data:image/webp;base64,')) {
    return true;
  }
  // أو روابط HTTPS الآمنة فقط
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// توليد معرف جلسة آمن تشفيرياً
export function generateSecureSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID()}`;
  }
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

// إدارة محاولات الدخول الخاطئة (Rate Limiting)
const RATE_LIMIT_KEY = 'crmef_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 ثانية

export function recordFailedLogin(): { locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  let state = { count: 0, lockedUntil: 0 };
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}

  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MS;
  }
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));

  const remainingSeconds = Math.max(0, Math.ceil((state.lockedUntil - now) / 1000));
  return { locked: remainingSeconds > 0, remainingSeconds };
}

export function checkLoginRateLimit(): { locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (state.lockedUntil && state.lockedUntil > now) {
        return { locked: true, remainingSeconds: Math.ceil((state.lockedUntil - now) / 1000) };
      }
    }
  } catch {}
  return { locked: false, remainingSeconds: 0 };
}

export function resetLoginAttempts(): void {
  try {
    sessionStorage.removeItem(RATE_LIMIT_KEY);
  } catch {}
}
