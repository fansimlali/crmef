/**
 * طبقة الاتصال الخادمية لبرنامج الإحالات.
 *
 * كل المنطق الحسّاس (الأهلية، المكافأة، الرفض/الاستعادة) يُنفَّذ في قاعدة
 * البيانات عبر دوال SECURITY DEFINER. هذه الطبقة تقرأ النتائج وتعرضها فقط.
 */

import { supabase } from './supabase';
import type {
  AdminReferral,
  MyReferral,
  PremiumSource,
  ReferralStatus,
  ReferralSummary,
  SubscriptionStatus,
} from '../types';

const REQUIRED_REFERRALS = 20;
const MAX_LIST = 1000;
const PROFILE_CHUNK = 100;

interface ReferralSummaryRow {
  referral_code?: unknown;
  qualified_count?: unknown;
  pending_count?: unknown;
  rejected_count?: unknown;
  required_count?: unknown;
  remaining_count?: unknown;
  reward_granted_at?: unknown;
  premium_until?: unknown;
  premium_source?: unknown;
  subscription_status?: unknown;
}

interface MyReferralRow {
  referred_email?: unknown;
  status?: unknown;
  created_at?: unknown;
  qualified_at?: unknown;
}

interface AdminReferralRow {
  referred_id?: unknown;
  referrer_id?: unknown;
  status?: unknown;
  qualified_at?: unknown;
  rejected_at?: unknown;
  rejection_reason?: unknown;
  risk_flags?: unknown;
  created_at?: unknown;
}

interface AdminProfileRow {
  id?: unknown;
  email?: unknown;
  full_name?: unknown;
  referral_code?: unknown;
  subscription_status?: unknown;
  premium_until?: unknown;
  referral_reward_granted_at?: unknown;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function normalizeStatus(value: unknown): ReferralStatus {
  return value === 'qualified' || value === 'rejected' ? value : 'pending';
}

function normalizePremiumSource(value: unknown): PremiumSource | null {
  return value === 'paid' || value === 'referral' || value === 'admin' ? value : null;
}

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  return value === 'premium' || value === 'suspended' ? value : 'trial';
}

function normalizeRiskFlags(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, boolean> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, flag]) => {
    if (flag === true) out[key] = true;
  });
  return out;
}

/** ترجمة أخطاء Supabase إلى رسائل عربية دون كشف تفاصيل داخلية. */
export function describeReferralError(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : String(error || '');
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const text = `${message} ${code}`.toLowerCase();

  if (
    text.includes('does not exist') ||
    text.includes('could not find') ||
    text.includes('pgrst202') ||
    text.includes('pgrst205')
  ) {
    return 'برنامج الإحالات غير مهيأ في قاعدة البيانات. نفّذ ملف supabase_referrals.sql أولاً.';
  }
  if (text.includes('permission denied') || text.includes('42501')) {
    return 'ليس لديك صلاحية للوصول إلى بيانات الإحالات.';
  }
  if (text.includes('admin_required')) {
    return 'هذه العملية مخصصة للمشرف العام فقط.';
  }
  if (text.includes('auth_required')) {
    return 'يجب تسجيل الدخول أولاً لعرض بيانات الإحالات.';
  }
  if (text.includes('referral_not_found')) {
    return 'لم يُعثر على الإحالة المطلوبة، أو أنها مرفوضة مسبقاً.';
  }
  if (text.includes('invalid_months') || text.includes('invalid_user')) {
    return 'بيانات التمديد غير صالحة.';
  }
  return 'تعذّر تحميل بيانات الإحالات. حاول مرة أخرى.';
}

function mapSummary(row: ReferralSummaryRow): ReferralSummary {
  const required = asCount(row.required_count) || REQUIRED_REFERRALS;
  const qualified = Math.min(asCount(row.qualified_count), required);
  return {
    referralCode: asString(row.referral_code).toUpperCase(),
    qualifiedCount: qualified,
    pendingCount: asCount(row.pending_count),
    rejectedCount: asCount(row.rejected_count),
    requiredCount: required,
    remainingCount:
      row.remaining_count === undefined
        ? Math.max(required - qualified, 0)
        : asCount(row.remaining_count),
    rewardGrantedAt: asNullableString(row.reward_granted_at),
    premiumUntil: asNullableString(row.premium_until),
    premiumSource: normalizePremiumSource(row.premium_source),
    subscriptionStatus:
      row.subscription_status === 'premium' ? 'premium' : 'trial',
  };
}

function mapMyReferral(row: MyReferralRow): MyReferral {
  return {
    referredEmail: asString(row.referred_email, 'مستخدم'),
    status: normalizeStatus(row.status),
    createdAt: asNullableString(row.created_at) || new Date().toISOString(),
    qualifiedAt: asNullableString(row.qualified_at),
  };
}

/** ملخص إحالات المستخدم الحالي: الكود، العداد، حالة المكافأة والاشتراك. */
export async function fetchMyReferralSummary(): Promise<{
  summary: ReferralSummary | null;
  error?: string;
}> {
  if (!supabase) {
    return { summary: null, error: 'خدمة الإحالات غير مهيأة (Supabase).' };
  }

  try {
    const { data, error } = await supabase.rpc('my_referral_summary');
    if (error) return { summary: null, error: describeReferralError(error) };

    const row = (Array.isArray(data) ? data[0] : data) as ReferralSummaryRow | null;
    if (!row) {
      return { summary: null, error: 'تعذّر العثور على ملفك الشخصي بعد. أعد تسجيل الدخول.' };
    }

    return { summary: mapSummary(row) };
  } catch (err) {
    return { summary: null, error: describeReferralError(err) };
  }
}

/** قائمة المدعوين كما يراها صاحب الرابط (بريد مُقنّع، بلا بصمة الجهاز). */
export async function fetchMyReferrals(): Promise<{
  referrals: MyReferral[];
  error?: string;
}> {
  if (!supabase) {
    return { referrals: [], error: 'خدمة الإحالات غير مهيأة (Supabase).' };
  }

  try {
    const { data, error } = await supabase.rpc('my_referrals');
    if (error) return { referrals: [], error: describeReferralError(error) };
    const rows = Array.isArray(data) ? (data as MyReferralRow[]) : [];
    return { referrals: rows.map(mapMyReferral) };
  } catch (err) {
    return { referrals: [], error: describeReferralError(err) };
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * كل الإحالات للمشرف: بيانات المُحيل والمُحال، حالة الأهلية، وأعلام الخطر.
 * يقرأ جدول referrals مباشرة (سياسة RLS للمشرف) ثم يثري الأسماء من profiles.
 */
export async function fetchAdminReferrals(): Promise<{
  referrals: AdminReferral[];
  error?: string;
}> {
  if (!supabase) {
    return { referrals: [], error: 'خدمة الإحالات غير مهيأة (Supabase).' };
  }

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(
        'referred_id, referrer_id, status, qualified_at, rejected_at, rejection_reason, risk_flags, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(MAX_LIST);

    if (error) return { referrals: [], error: describeReferralError(error) };

    const rows = (Array.isArray(data) ? data : []) as AdminReferralRow[];
    const ids = Array.from(
      new Set(
        rows.flatMap((row) => [asString(row.referred_id), asString(row.referrer_id)]).filter(Boolean)
      )
    );

    const profiles = new Map<string, AdminProfileRow>();
    for (const group of chunk(ids, PROFILE_CHUNK)) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, referral_code, subscription_status, premium_until, referral_reward_granted_at'
        )
        .in('id', group);

      if (profileError) {
        // لا نُفشل القائمة كلها إن تعذّر إثراء الأسماء؛ نعرض معرّفات مختصرة.
        console.warn('admin referrals profiles lookup:', profileError.message);
        break;
      }

      ((profileRows || []) as AdminProfileRow[]).forEach((profile) => {
        const id = asString(profile.id);
        if (id) profiles.set(id, profile);
      });
    }

    const mapped: AdminReferral[] = rows.map((row) => {
      const referredId = asString(row.referred_id);
      const referrerId = asString(row.referrer_id);
      const referred = profiles.get(referredId);
      const referrer = profiles.get(referrerId);
      const referredEmail = asString(referred?.email, `مستخدم ${referredId.slice(0, 8)}`);
      const referrerEmail = asString(referrer?.email, `مستخدم ${referrerId.slice(0, 8)}`);

      return {
        referredId,
        referrerId,
        referredEmail,
        referredName: asString(referred?.full_name, referredEmail),
        referrerEmail,
        referrerName: asString(referrer?.full_name, referrerEmail),
        referrerCode: asNullableString(referrer?.referral_code),
        referrerSubscriptionStatus: normalizeSubscriptionStatus(referrer?.subscription_status),
        referrerPremiumUntil: asNullableString(referrer?.premium_until),
        rewardGrantedAt: asNullableString(referrer?.referral_reward_granted_at),
        status: normalizeStatus(row.status),
        createdAt: asNullableString(row.created_at) || new Date().toISOString(),
        qualifiedAt: asNullableString(row.qualified_at),
        rejectedAt: asNullableString(row.rejected_at),
        rejectionReason: asNullableString(row.rejection_reason),
        riskFlags: normalizeRiskFlags(row.risk_flags),
      };
    });

    return { referrals: mapped };
  } catch (err) {
    return { referrals: [], error: describeReferralError(err) };
  }
}

/** رفض إحالة (يمنع احتسابها لاحقاً؛ لا يسحب مكافأة مُنحت سابقاً). */
export async function rejectReferral(
  referredId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'خدمة الإحالات غير مهيأة (Supabase).' };
  if (!referredId) return { success: false, error: 'معرّف الإحالة مطلوب.' };

  try {
    const { error } = await supabase.rpc('admin_reject_referral', {
      p_referred_id: referredId,
      p_reason: reason.trim().slice(0, 500),
    });
    if (error) return { success: false, error: describeReferralError(error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: describeReferralError(err) };
  }
}

/** استعادة إحالة مرفوضة وإعادة تقييم أهليتها فوراً. */
export async function restoreReferral(
  referredId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'خدمة الإحالات غير مهيأة (Supabase).' };
  if (!referredId) return { success: false, error: 'معرّف الإحالة مطلوب.' };

  try {
    const { error } = await supabase.rpc('admin_restore_referral', {
      p_referred_id: referredId,
    });
    if (error) return { success: false, error: describeReferralError(error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: describeReferralError(err) };
  }
}

/** رابط الدعوة العام: أصل الموقع + ?ref=CODE. */
export function buildReferralLink(code: string): string {
  const clean = code.trim().toUpperCase();
  if (typeof window === 'undefined') return `/?ref=${encodeURIComponent(clean)}`;
  return `${window.location.origin}/?ref=${encodeURIComponent(clean)}`;
}
