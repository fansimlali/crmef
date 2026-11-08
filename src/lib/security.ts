/**
 * أدوات الأمان المساعدة في الواجهة.
 *
 * ملاحظة معمارية: المصادقة والتفويض يتمّان بالكامل عبر Supabase Auth وRLS،
 * وأي حماية في المتصفح (مثل هذا الحدّ من المحاولات) هي تحسين تجربة فقط
 * وليست حدّاً أمنياً موثوقاً. الحدّ الفعلي يفرضه خادم Supabase.
 */

// توليد معرف جلسة آمن تشفيرياً (للعرض فقط، الجلسة الحقيقية يديرها Supabase)
export function generateSecureSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID()}`;
  }
  // احتياطي نادر جداً للمتصفحات القديمة
  const random = new Uint32Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(random);
  } else {
    for (let i = 0; i < random.length; i++) random[i] = Math.floor(Math.random() * 2 ** 32);
  }
  return `sess_${Array.from(random, (n) => n.toString(16)).join('')}`;
}

// إدارة محاولات الدخول الخاطئة في الواجهة (تحسين تجربة فقط)
const RATE_LIMIT_KEY = 'crmef_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 ثانية

export function recordFailedLogin(): { locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  let state = { count: 0, lockedUntil: 0 };
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    /* التخزين غير متاح */
  }

  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MS;
  }
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    /* التخزين غير متاح */
  }

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
  } catch {
    /* التخزين غير متاح */
  }
  return { locked: false, remainingSeconds: 0 };
}

export function resetLoginAttempts(): void {
  try {
    sessionStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    /* التخزين غير متاح */
  }
}
