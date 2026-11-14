import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildReferralLink,
  fetchAdminReferrals,
  fetchMyReferralSummary,
  fetchMyReferrals,
  rejectReferral,
  restoreReferral,
} from '../lib/referralApi';
import type {
  AdminReferral,
  MyReferral,
  PremiumSource,
  ReferralStatus,
  ReferralSummary,
} from '../types';
import {
  AlertCircle,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Gift,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';

type View = 'dashboard' | 'admin';

const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending: 'قيد التحقق',
  qualified: 'مؤهلة',
  rejected: 'مرفوضة',
};

const STATUS_CLASS: Record<ReferralStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border border-amber-200',
  qualified: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const SOURCE_LABEL: Record<PremiumSource, string> = {
  paid: 'اشتراك مدفوع',
  referral: 'مكافأة إحالة',
  admin: 'منح إداري',
};

const DATE_FORMAT = new Intl.DateTimeFormat('ar-MA', {
  timeZone: 'Africa/Casablanca',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('ar-MA', {
  timeZone: 'Africa/Casablanca',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return (withTime ? DATETIME_FORMAT : DATE_FORMAT).format(date);
  } catch {
    return '—';
  }
}

function StatusBadge({ status }: { status: ReferralStatus }) {
  const Icon = status === 'qualified' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${STATUS_CLASS[status]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo';
  icon: React.ElementType;
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <span className="block text-xl font-black text-slate-900 leading-tight">{value}</span>
        <span className="text-[11px] text-slate-500 font-bold block truncate">{label}</span>
      </div>
    </div>
  );
}

export const ReferralsPage: React.FC = () => {
  const { user, isAdmin, refreshProfile } = useAuth();

  const [view, setView] = useState<View>(isAdmin ? 'admin' : 'dashboard');
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [invites, setInvites] = useState<MyReferral[]>([]);
  const [adminReferrals, setAdminReferrals] = useState<AdminReferral[]>([]);

  const [dashLoading, setDashLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminReferral | null>(null);
  const [rejectReason, setRejectReason] = useState('اشتباه في إحالة وهمية أو نشاط غير حقيقي');

  const [adminFilter, setAdminFilter] = useState<'all' | ReferralStatus>('all');
  const [adminSearch, setAdminSearch] = useState('');

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    const [summaryResult, listResult] = await Promise.all([
      fetchMyReferralSummary(),
      fetchMyReferrals(),
    ]);
    setSummary(summaryResult.summary);
    setInvites(listResult.referrals);
    setDashError(summaryResult.error || listResult.error || null);
    setDashLoading(false);
  }, []);

  const loadAdmin = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    setAdminError(null);
    const result = await fetchAdminReferrals();
    setAdminReferrals(result.referrals);
    setAdminError(result.error || null);
    setAdminLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (view === 'admin') void loadAdmin();
  }, [view, loadAdmin]);

  const shareUrl = summary?.referralCode ? buildReferralLink(summary.referralCode) : '';
  const required = summary?.requiredCount || 20;
  const qualified = summary?.qualifiedCount || 0;
  const progressPercent = Math.min(100, Math.round((qualified / Math.max(required, 1)) * 100));
  const remaining = summary?.remainingCount ?? Math.max(required - qualified, 0);

  const whatsappShareUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `انضم إلى منصة CRMEF Prep وتدرّب على مباراة التعليم معي. استعمل رابط الدعوة هذا:\n${shareUrl}`
      )}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const area = document.createElement('textarea');
      area.value = shareUrl;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
      } finally {
        area.remove();
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'CRMEF Prep — دعوة للانضمام',
          text: 'تدرّب على مباراة التعليم معي عبر منصة CRMEF Prep.',
          url: shareUrl,
        });
        return;
      } catch {
        /* المستخدم أغلق نافذة المشاركة */
      }
    }
    await handleCopy();
  };

  const handleRefresh = () => {
    setActionMessage(null);
    setActionError(null);
    if (view === 'admin') {
      void loadAdmin();
    } else {
      void loadDashboard();
    }
    void refreshProfile();
  };

  const adminStats = useMemo(() => {
    const rewardedReferrers = new Set(
      adminReferrals.filter((r) => r.rewardGrantedAt).map((r) => r.referrerId)
    );
    return {
      total: adminReferrals.length,
      pending: adminReferrals.filter((r) => r.status === 'pending').length,
      qualified: adminReferrals.filter((r) => r.status === 'qualified').length,
      rejected: adminReferrals.filter((r) => r.status === 'rejected').length,
      rewardedReferrers: rewardedReferrers.size,
      risky: adminReferrals.filter((r) => Object.keys(r.riskFlags).length > 0).length,
    };
  }, [adminReferrals]);

  const filteredAdminReferrals = useMemo(() => {
    const term = adminSearch.toLowerCase().trim();
    return adminReferrals.filter((r) => {
      if (adminFilter !== 'all' && r.status !== adminFilter) return false;
      if (!term) return true;
      return (
        r.referredEmail.toLowerCase().includes(term) ||
        r.referredName.toLowerCase().includes(term) ||
        r.referrerEmail.toLowerCase().includes(term) ||
        r.referrerName.toLowerCase().includes(term) ||
        (r.referrerCode || '').toLowerCase().includes(term)
      );
    });
  }, [adminReferrals, adminFilter, adminSearch]);

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionError(null);
    setActionMessage(null);
    setProcessingId(rejectTarget.referredId);
    const result = await rejectReferral(rejectTarget.referredId, rejectReason);
    setProcessingId(null);
    if (!result.success) {
      setActionError(result.error || 'تعذّر رفض الإحالة.');
      return;
    }
    setRejectTarget(null);
    setActionMessage('تم رفض الإحالة. لن تُحتسب ضمن إحالات صاحب الرابط.');
    await loadAdmin();
  };

  const handleRestore = async (referral: AdminReferral) => {
    setActionError(null);
    setActionMessage(null);
    setProcessingId(referral.referredId);
    const result = await restoreReferral(referral.referredId);
    setProcessingId(null);
    if (!result.success) {
      setActionError(result.error || 'تعذّر استعادة الإحالة.');
      return;
    }
    setActionMessage('تمت استعادة الإحالة وإعادة تقييم أهليتها.');
    await loadAdmin();
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-black text-slate-800">يلزم تسجيل الدخول</h2>
        <p className="text-sm text-slate-500">سجّل الدخول لعرض رابط الإحالة ومتابعة مكافآتك.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in pb-12">
      {/* الترويسة */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>برنامج الإحالات والمكافآت</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">
              ادعُ 20 صديقاً واحصل على 3 أشهر مجاناً
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              شارك رابطك الخاص. تُحتسب الإحالة بعد تأكيد بريد الصديق وإجابته عن 20 سؤالاً مختلفاً
              على الأقل خلال يومين. عند بلوغ 20 إحالة مؤهلة تُضاف 3 أشهر إلى نهاية اشتراكك.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-center">
            <div className="text-center px-3">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-400">
                {qualified}
              </span>
              <span className="text-[10px] text-slate-300 font-bold">إحالة مؤهلة</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <span className="block text-2xl sm:text-3xl font-black text-amber-400">
                {remaining}
              </span>
              <span className="text-[10px] text-slate-300 font-bold">متبقية للمكافأة</span>
            </div>
          </div>
        </div>
      </div>

      {/* تبديل العرض للمشرف */}
      {isAdmin && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-200">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                view === 'dashboard'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>لوحة الإحالة الخاصة بي</span>
            </button>
            <button
              type="button"
              onClick={() => setView('admin')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                view === 'admin'
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>إدارة إحالات المستخدمين</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
              حساب المشرف لا يشارك في مكافأة الإحالة
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={view === 'admin' ? adminLoading : dashLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  (view === 'admin' ? adminLoading : dashLoading) ? 'animate-spin' : ''
                }`}
              />
              <span>تحديث</span>
            </button>
          </div>
        </div>
      )}

      {(actionMessage || actionError) && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-start gap-2 border ${
            actionError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionError ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span>{actionError || actionMessage}</span>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setActionMessage(null);
            }}
            className="ms-auto text-current/60 hover:text-current cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {view === 'dashboard' ? (
        dashLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-bold">جارٍ تحميل رابط الإحالة وتقدّمك...</p>
          </div>
        ) : dashError && !summary ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-black text-slate-800">تعذّر تحميل لوحة الإحالة</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{dashError}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : summary ? (
          <>
            {/* رابط الدعوة */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                    <span>رابط الدعوة الخاص بك</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    كل شخص يسجّل عبر هذا الرابط يُربط بحسابك تلقائياً. لا تشاركه مع أشخاص لا تعرفهم.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono font-black text-slate-700 tracking-wider">
                  {summary.referralCode}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    readOnly
                    value={shareUrl}
                    dir="ltr"
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold text-slate-700 outline-none"
                    aria-label="رابط الدعوة"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-black flex items-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>مشاركة عبر واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>مشاركة الرابط</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>نسخ الكود فقط</span>
                </button>
              </div>
            </div>

            {/* التقدم */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>تقدّمك نحو المكافأة</span>
                </h3>
                <span className="text-sm font-black text-emerald-700">
                  {qualified} / {required}
                </span>
              </div>

              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                <span className="text-slate-500 font-bold">
                  {summary.rewardGrantedAt
                    ? 'تم منح مكافأة الإحالة مرة واحدة لهذا الحساب.'
                    : remaining > 0
                    ? `بقي ${remaining} إحالة مؤهلة للحصول على 3 أشهر مجاناً.`
                    : 'استوفيت شرط المكافأة، وسيتم تحديث اشتراكك تلقائياً.'}
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  {progressPercent}%
                </span>
              </div>

              {summary.rewardGrantedAt && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    مُنحت المكافأة بتاريخ {formatDate(summary.rewardGrantedAt, true)}. شكراً لمساهمتك
                    في نشر المنصة!
                  </span>
                </div>
              )}
            </div>

            {/* إحصاءات سريعة */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="إحالات مؤهلة"
                value={summary.qualifiedCount}
                tone="emerald"
                icon={CheckCircle2}
              />
              <StatCard
                label="قيد التحقق"
                value={summary.pendingCount}
                tone="amber"
                icon={Clock}
              />
              <StatCard
                label="مرفوضة"
                value={summary.rejectedCount}
                tone="rose"
                icon={XCircle}
              />
              <StatCard
                label="متبقية للمكافأة"
                value={summary.remainingCount}
                tone="sky"
                icon={Trophy}
              />
            </div>

            {/* حالة الاشتراك */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>حالة اشتراكك</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">الحالة</span>
                  <span className="font-black text-slate-900">
                    {isAdmin
                      ? 'مشرف عام — وصول كامل'
                      : summary.subscriptionStatus === 'premium'
                      ? 'مشترك كامل'
                      : 'حساب تجريبي'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">تاريخ الانتهاء</span>
                  <span className="font-black text-slate-900">
                    {isAdmin ? 'دائم' : formatDate(summary.premiumUntil)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">مصدر الاشتراك</span>
                  <span className="font-black text-slate-900">
                    {isAdmin
                      ? 'حساب إدارة'
                      : summary.premiumSource
                      ? SOURCE_LABEL[summary.premiumSource]
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* شروط الأهلية */}
            <div className="bg-emerald-50/60 rounded-3xl border border-emerald-200 p-5 sm:p-6 space-y-3">
              <h3 className="text-base font-black text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>كيف تُحتسب الإحالة المؤهلة؟</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-900 font-bold">
                <li className="flex items-start gap-2 bg-white/70 rounded-xl p-3 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تسجيل جديد عبر رابطك + تأكيد البريد الإلكتروني.</span>
                </li>
                <li className="flex items-start gap-2 bg-white/70 rounded-xl p-3 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>الإجابة عن 20 سؤالاً مختلفاً على الأقل.</span>
                </li>
                <li className="flex items-start gap-2 bg-white/70 rounded-xl p-3 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>نشاط في يومين مختلفين بتوقيت المغرب.</span>
                </li>
              </ul>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                المكافأة 3 أشهر تُمنح مرة واحدة فقط لكل حساب، وتُضاف إلى نهاية الاشتراك المتبقي إن
                كنت مشتركاً. الحسابات المشبوهة (نفس الجهاز أو نشاط آلي) تُراجع يدوياً وقد تُرفض.
              </p>
            </div>

            {/* قائمة المدعوين */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 flex items-center justify-between gap-3 flex-wrap border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>المدعوون ({invites.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold">
                  تظهر أجزاء من بريد كل مدعو حفاظاً على الخصوصية
                </span>
              </div>

              {invites.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <User className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-extrabold text-slate-700">لم يسجّل أحد عبر رابطك بعد</h4>
                  <p className="text-xs text-slate-400">
                    شارك رابطك الآن، وستظهر هنا كل إحالة وحالتها فور تسجيل الصديق.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {invites.map((invite, index) => (
                    <li
                      key={`${invite.referredEmail}-${invite.createdAt}-${index}`}
                      className="p-4 sm:px-6 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-black text-slate-800 block truncate">
                            {invite.referredEmail}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>سجّل في {formatDate(invite.createdAt)}</span>
                            {invite.qualifiedAt && (
                              <span className="text-emerald-600">
                                — تأهّل في {formatDate(invite.qualifiedAt)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={invite.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null
      ) : (
        /* ───────────────────────── لوحة المشرف ───────────────────────── */
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <StatCard label="كل الإحالات" value={adminStats.total} tone="indigo" icon={Users} />
            <StatCard label="قيد التحقق" value={adminStats.pending} tone="amber" icon={Clock} />
            <StatCard
              label="مؤهلة"
              value={adminStats.qualified}
              tone="emerald"
              icon={CheckCircle2}
            />
            <StatCard label="مرفوضة" value={adminStats.rejected} tone="rose" icon={XCircle} />
            <StatCard
              label="مُحيلون نالوا المكافأة"
              value={adminStats.rewardedReferrers}
              tone="sky"
              icon={Trophy}
            />
            <StatCard label="أعلام خطر" value={adminStats.risky} tone="rose" icon={ShieldCheck} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-bold flex-wrap">
              {(
                [
                  ['all', 'الكل'],
                  ['pending', 'قيد التحقق'],
                  ['qualified', 'مؤهلة'],
                  ['rejected', 'مرفوضة'],
                ] as Array<['all' | ReferralStatus, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAdminFilter(value)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    adminFilter === value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="بحث بالمُحال أو المُحيل أو الكود..."
                  className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
                {adminSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminSearch('')}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => void loadAdmin()}
                disabled={adminLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 cursor-pointer"
                title="تحديث"
              >
                <RefreshCw className={`w-4 h-4 ${adminLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {adminLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-bold">جارٍ تحميل إحالات المستخدمين...</p>
            </div>
          ) : adminError ? (
            <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-black text-slate-800">تعذّر تحميل الإحالات</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">{adminError}</p>
              <button
                type="button"
                onClick={() => void loadAdmin()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredAdminReferrals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <Gift className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-700">لا توجد إحالات مطابقة</h4>
              <p className="text-xs text-slate-400">
                تظهر هنا الإحالات المسجّلة عبر روابط المستخدمين، مع حالتها وأعلام الخطر.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAdminReferrals.map((referral) => (
                <div
                  key={referral.referredId}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <StatusBadge status={referral.status} />
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(referral.createdAt, true)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 min-w-0">
                      <span className="text-[10px] text-slate-500 font-black block">
                        المستخدم المُحال
                      </span>
                      <span className="font-black text-slate-900 block truncate">
                        {referral.referredName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 block truncate">
                        {referral.referredEmail}
                      </span>
                      {referral.qualifiedAt && (
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          تأهّل في {formatDate(referral.qualifiedAt)}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1 min-w-0">
                      <span className="text-[10px] text-emerald-700 font-black block">
                        صاحب رابط الدعوة
                      </span>
                      <span className="font-black text-emerald-950 block truncate">
                        {referral.referrerName}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-800/80 block truncate">
                        {referral.referrerEmail}
                      </span>
                      {referral.referrerCode && (
                        <span className="text-[10px] text-emerald-700 font-mono font-black block">
                          {referral.referrerCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    {referral.riskFlags.same_device && (
                      <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>نفس بصمة الجهاز</span>
                      </span>
                    )}
                    {referral.rewardGrantedAt && (
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>المكافأة مُنحت لصاحب الرابط</span>
                      </span>
                    )}
                    {referral.referrerPremiumUntil && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>اشتراكه ينتهي {formatDate(referral.referrerPremiumUntil)}</span>
                      </span>
                    )}
                    {referral.rejectionReason && (
                      <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 w-full">
                        سبب الرفض: {referral.rejectionReason}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {referral.status === 'rejected' ? (
                      <button
                        type="button"
                        onClick={() => void handleRestore(referral)}
                        disabled={processingId === referral.referredId}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {processingId === referral.referredId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>استعادة الإحالة</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectTarget(referral);
                          setActionError(null);
                          setActionMessage(null);
                        }}
                        disabled={processingId === referral.referredId}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-rose-200"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>رفض الإحالة</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* نافذة رفض الإحالة */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
              <Ban className="w-5 h-5" />
              <span>رفض الإحالة</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              سيتم رفض إحالة <strong>{rejectTarget.referredName}</strong> المربوطة برابط{' '}
              <strong>{rejectTarget.referrerName}</strong>. لن تُحتسب هذه الإحالة ضمن الـ20، ولن
              تُسحب أي مكافأة مُنحت سابقاً.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سبب الرفض (يظهر في السجل الإداري)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400 font-bold">
                {rejectReason.length}/500
              </span>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={processingId === rejectTarget.referredId}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {processingId === rejectTarget.referredId && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>تأكيد الرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
