/**
 * التقاط رابط الإحالة (?ref=CODE) وحفظه حتى إنشاء الحساب.
 *
 * الكود يُرسل في raw_user_meta_data عند signUp، ويقرأه trigger
 * public.handle_new_user على الخادم. الواجهة لا تمنح أي مكافأة بنفسها.
 */

const REFERRAL_STORAGE_KEY = 'crmef_referral_code_v1';
const DEVICE_KEY = 'crmef_device_fingerprint_v1';
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 يوماً

/** نفس الصيغة التي يفرضها الخادم: 16 حرفاً hex. */
export const REFERRAL_CODE_PATTERN = /^[A-F0-9]{16}$/;

export interface StoredReferral {
  code: string;
  savedAt: number;
}

export function normalizeReferralCode(value: string | null | undefined): string | null {
  const code = (value || '').trim().toUpperCase();
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}

/**
 * يقرأ ?ref= أو ?ref_code= من الرابط، يحفظه محلياً لمدة 30 يوماً،
 * ثم يزيل المعامل من شريط العنوان حتى لا يُنسخ بالخطأ مع روابط أخرى.
 * يعيد الكود الصالح إن وُجد (الجديد أو المحفوظ سابقاً).
 */
export function captureReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const code = normalizeReferralCode(params.get('ref') || params.get('ref_code'));

    if (code) {
      localStorage.setItem(
        REFERRAL_STORAGE_KEY,
        JSON.stringify({ code, savedAt: Date.now() } satisfies StoredReferral)
      );

      params.delete('ref');
      params.delete('ref_code');
      const query = params.toString();
      const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);
      return code;
    }
  } catch {
    /* التخزين أو history غير متاح: نكمل دون إحالة */
  }

  return getStoredReferralCode();
}

/** الكود المحفوظ إن كان صالحاً وغير منتهي المدة. */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredReferral>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > REFERRAL_TTL_MS) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    return normalizeReferralCode(parsed.code);
  } catch {
    return null;
  }
}

/** يُستدعى بعد إنشاء الحساب فعلاً (لا قبل ذلك حتى لا يضيع الكود عند فشل التسجيل). */
export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    /* التخزين غير متاح */
  }
}

/**
 * بصمة جهاز محلية عشوائية — ليست بصمة متصفح حقيقية.
 * تُستخدم كعلم خطر للمراجعة فقط (تكرار نفس الجهاز)، وليست حاجزاً أمنياً.
 */
export function getSignupFingerprint(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `fp_${generateLocalId()}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return /^[A-Za-z0-9_-]{8,128}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
