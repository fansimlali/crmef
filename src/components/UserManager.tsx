import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Crown, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  Eye, 
  Trash2, 
  RefreshCw, 
  MessageCircle, 
  MousePointerClick, 
  GraduationCap, 
  AlertCircle, 
  X,
  Printer,
  Timer
} from 'lucide-react';
import { CYCLES, type CycleKey } from '../types';

interface ExtendedUserRow {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  subscriptionStatus: 'trial' | 'premium' | 'suspended';
  cycle: CycleKey;
  createdAt: string;
  questionsViewedCount: number;
  upgradeClicksCount: number;
  lastUpgradeClickAt: string | null;
  receiptStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  receiptUrl?: string | null;
  receiptId?: string | null;
  rejectionReason?: string | null;
  timeSpentMinutes: number;
  lastSeenAt: string | null;
}

export const UserManager: React.FC = () => {
  const { 
    user: currentAdmin, 
    subscriptionRequests, 
    approveSubscription, 
    suspendSubscription, 
    deleteUserAccount
  } = useAuth();

  const [usersList, setUsersList] = useState<ExtendedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trial' | 'paid'>('trial');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [remindersSent, setRemindersSent] = useState<Set<string>>(new Set());

  // تنسيق التاريخ والوقت بتوقيت الدار البيضاء (Africa/Casablanca)
  const formatCasablancaTime = useCallback((isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('ar-MA', {
        timeZone: 'Africa/Casablanca',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(d);
    } catch {
      return isoString;
    }
  }, []);

  // جلب كافة بيانات المستخدمين من Supabase ودمج الإحصائيات الحقيقية
  const loadUsersData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. جلب جميع الملفات الشخصية من جدول profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profErr) {
        throw new Error(`تعذر جلب المستخدمين: ${profErr.message}`);
      }

      // 2. جلب جميع نقرات الترقية upgrade_clicks
      let clicksMap: Record<string, { count: number; lastClick: string }> = {};
      try {
        const { data: clicks } = await supabase
          .from('upgrade_clicks')
          .select('user_id, user_email, clicked_at')
          .order('clicked_at', { ascending: false });

        if (clicks) {
          clicks.forEach((c) => {
            const key = c.user_id || c.user_email;
            if (!key) return;
            if (!clicksMap[key]) {
              clicksMap[key] = { count: 0, lastClick: c.clicked_at };
            }
            clicksMap[key].count += 1;
          });
        }
      } catch {
        // إذا كان الجدول غير موجود بعد
      }

      // 3. جلب عدد الأسئلة المجتازة من question_progress
      let progressMap: Record<string, number> = {};
      try {
        const { data: prog } = await supabase
          .from('question_progress')
          .select('user_id, question_id');

        if (prog) {
          prog.forEach((p) => {
            if (p.user_id) {
              progressMap[p.user_id] = (progressMap[p.user_id] || 0) + 1;
            }
          });
        }
      } catch {
        // تجاهل
      }

      // 4. خريطة طلبات الاشتراك والوصولات
      const reqByUserId: Record<string, typeof subscriptionRequests[0]> = {};
      subscriptionRequests.forEach((r) => {
        // نحفظ آخر طلب لكل مستخدم
        if (!reqByUserId[r.userId] || new Date(r.createdAt) > new Date(reqByUserId[r.userId].createdAt)) {
          reqByUserId[r.userId] = r;
        }
      });

      // 5. دمج البيانات لكل مستخدم
      const merged: ExtendedUserRow[] = (profiles || []).map((p: any) => {
        const userReq = reqByUserId[p.id];
        const userClicks = clicksMap[p.id] || (p.email ? clicksMap[p.email] : undefined);
        const qCount = progressMap[p.id] || 0;

        let rStatus: ExtendedUserRow['receiptStatus'] = 'none';
        if (userReq) {
          rStatus = userReq.status;
        } else if (p.subscription_status === 'premium') {
          rStatus = 'approved';
        }

        return {
          id: p.id,
          email: p.email || '—',
          fullName: p.full_name || p.email?.split('@')[0] || 'مترشح',
          role: p.role || 'user',
          subscriptionStatus: p.subscription_status || 'trial',
          cycle: p.cycle || 'primary',
          createdAt: p.created_at || new Date().toISOString(),
          questionsViewedCount: qCount,
          upgradeClicksCount: userClicks?.count || 0,
          lastUpgradeClickAt: userClicks?.lastClick || null,
          receiptStatus: rStatus,
          receiptUrl: userReq?.receiptUrl || null,
          receiptId: userReq?.id || null,
          rejectionReason: userReq?.rejectionReason || null,
          timeSpentMinutes: p.time_spent_minutes || 0,
          lastSeenAt: p.last_seen_at || null,
        };
      });

      setUsersList(merged);
    } catch (err: any) {
      console.error('Error loading admin users:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [subscriptionRequests]);

  useEffect(() => {
    loadUsersData();
  }, [loadUsersData]);

  // إحصائيات العدادات العلوية
  const stats = useMemo(() => {
    const totalRegistered = usersList.length;
    const totalSubscribed = usersList.filter(u => u.subscriptionStatus === 'premium').length;
    const totalFree = totalRegistered - totalSubscribed;
    const totalUpgradeClicks = usersList.reduce((acc, u) => acc + u.upgradeClicksCount, 0);
    return {
      totalRegistered,
      totalFree,
      totalSubscribed,
      totalUpgradeClicks
    };
  }, [usersList]);

  // تصفية المستخدمين للتبويب والبحث
  const filteredUsers = useMemo(() => {
    return usersList
      .filter((u) => {
        // تبويب مجاني أم مشترك
        if (activeTab === 'paid') {
          if (u.subscriptionStatus !== 'premium') return false;
        } else {
          if (u.subscriptionStatus === 'premium') return false;
        }

        // تصفية السلك
        if (selectedCycle !== 'all' && u.cycle !== selectedCycle) {
          return false;
        }

        // تصفية البحث بالاسم أو الإيميل
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesEmail = u.email.toLowerCase().includes(q);
          const matchesName = u.fullName.toLowerCase().includes(q);
          if (!matchesEmail && !matchesName) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [usersList, activeTab, selectedCycle, searchTerm]);

  // المستخدمون الذين نقروا على الترقية قبل أكثر من 30 دقيقة ولم يرفعوا وصلاً (Task 4)
  const abandonedUpgradeUsers = useMemo(() => {
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    return usersList.filter((u) => {
      if (u.subscriptionStatus === 'premium') return false;
      if (u.receiptStatus === 'approved' || u.receiptStatus === 'pending') return false;
      if (!u.lastUpgradeClickAt || u.upgradeClicksCount === 0) return false;

      const clickTime = new Date(u.lastUpgradeClickAt).getTime();
      return now - clickTime >= THIRTY_MINUTES_MS;
    });
  }, [usersList]);

  // إجراءات الإدارة
  const handleApproveUser = async (u: ExtendedUserRow) => {
    if (!confirm(`هل أنت متأكد من تفعيل اشتراك الكامل للمترشح: ${u.fullName} (${u.email})؟`)) return;
    setActionInProgress(u.id);
    if (u.receiptId) {
      await approveSubscription(u.receiptId);
    } else {
      // تفعيل مباشر للحساب حتى بدون طلب مسبق
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'premium', updated_at: new Date().toISOString() })
          .eq('id', u.id);
      }
    }
    await loadUsersData();
    setActionInProgress(null);
  };

  const handleSuspendUser = async (u: ExtendedUserRow) => {
    if (!confirm(`هل أنت متأكد من تعليق اشتراك: ${u.fullName} مؤقتاً؟`)) return;
    setActionInProgress(u.id);
    if (u.receiptId) {
      await suspendSubscription(u.receiptId);
    } else {
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'trial', updated_at: new Date().toISOString() })
          .eq('id', u.id);
      }
    }
    await loadUsersData();
    setActionInProgress(null);
  };

  const handleDeleteUser = async (u: ExtendedUserRow) => {
    setActionInProgress(u.id);
    try {
      // حذف نهائي شامل: auth.users + profiles + جميع البيانات المرتبطة
      const result = await deleteUserAccount(u.id);
      if (!result.success) {
        setErrorMsg(result.error || 'تعذر حذف الحساب. تأكد من تشغيل سكريبت SQL في Supabase SQL Editor أولاً لإنشاء دالة admin_delete_user.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ غير متوقع أثناء الحذف');
    }
    setDeletingId(null);
    await loadUsersData();
    setActionInProgress(null);
  };

  // إرسال تذكير عبر واتساب مع نص جاهز (Task 4)
  const handleSendWhatsAppReminder = (email: string) => {
    const text = `Salam, شفنا بلي بغيتي تدوز للاشتراك الكامل بـ 50 درهم فـ CRMEF Prep و ما كملتيش. إلا بغيتي تكمل، رفع الوصل من هنا أو صيفطو فـ WhatsApp: https://wa.me/212767471061 - المباراة 28 نونبر، باقي 18 يوم. (حسابك: ${email})`;
    const url = `https://wa.me/212767471061?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setRemindersSent((prev) => new Set(prev).add(email));
  };

  const handlePrintReport = () => {
    const now = new Intl.DateTimeFormat('ar-MA', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date());

    const rows = usersList
      .filter(u => u.role !== 'admin')
      .map(u => `
        <tr>
          <td>${u.fullName}</td>
          <td>${u.email}</td>
          <td>${u.subscriptionStatus === 'premium' ? '✅ مشترك مفعل' : '🆓 تجريبي'}</td>
          <td>${getCycleTitle(u.cycle)}</td>
          <td>${formatCasablancaTime(u.createdAt)}</td>
          <td style="text-align:center">${u.questionsViewedCount}</td>
          <td style="text-align:center">${u.upgradeClicksCount}</td>
          <td style="text-align:center">${u.timeSpentMinutes > 0 ? u.timeSpentMinutes + ' دق' : '—'}</td>
        </tr>
      `).join('');

    const totalFreeUsers = usersList.filter(u => u.role !== 'admin' && u.subscriptionStatus !== 'premium').length;
    const totalPaidUsers = usersList.filter(u => u.role !== 'admin' && u.subscriptionStatus === 'premium').length;
    const totalClicks = usersList.reduce((acc, u) => acc + u.upgradeClicksCount, 0);
    const totalRegistered = usersList.filter(u => u.role !== 'admin').length;

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>تقرير إحصائيات CRMEF Prep - ${now}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; padding: 24px; font-size: 12px; color: #1e293b; background: #f8fafc; }
      h1 { font-size: 20px; color: #0f172a; margin: 0 0 4px; }
      .subtitle { color: #64748b; font-size: 11px; margin-bottom: 20px; }
      .summary { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
      .card { padding: 12px 20px; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; min-width: 120px; }
      .card strong { display: block; font-size: 26px; font-weight: 900; color: #0f172a; }
      .card span { font-size: 10px; color: #64748b; font-weight: 600; }
      .card.free strong { color: #d97706; }
      .card.paid strong { color: #059669; }
      .card.clicks strong { color: #2563eb; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
      th { background: #0f172a; color: #fff; padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; white-space: nowrap; }
      td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
      tr:nth-child(even) td { background: #f8fafc; }
      tr:last-child td { border-bottom: none; }
      .footer { margin-top: 20px; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      @media print { body { background: #fff; padding: 10px; } .card { border: 1px solid #ccc; } }
    </style></head>
    <body>
    <h1>📊 تقرير إحصائيات المترشحين - منصة CRMEF Prep</h1>
    <p class="subtitle">تاريخ ووقت الطباعة: ${now} (توقيت الدار البيضاء)</p>
    <div class="summary">
      <div class="card"><strong>${totalRegistered}</strong><span>إجمالي المسجلين</span></div>
      <div class="card free"><strong>${totalFreeUsers}</strong><span>حسابات تجريبية</span></div>
      <div class="card paid"><strong>${totalPaidUsers}</strong><span>مشتركون مفعلون</span></div>
      <div class="card clicks"><strong>${totalClicks}</strong><span>نقرات الترقية</span></div>
    </div>
    <table>
      <thead><tr>
        <th>الاسم الكامل</th>
        <th>البريد الإلكتروني</th>
        <th>الحالة</th>
        <th>السلك التعليمي</th>
        <th>تاريخ التسجيل</th>
        <th>الأسئلة المنجزة</th>
        <th>نقرات الترقية</th>
        <th>مدة المكوث (دق)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      📋 تقرير تلقائي من منصة CRMEF Prep | ${now} | المشرف: ${currentAdmin?.email || '—'}
    </div>
    <script>window.onload = () => { window.print(); };<\/script>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const getCycleTitle = (cycleKey: CycleKey) => {
    return CYCLES.find(c => c.id === cycleKey)?.name || cycleKey;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* الترويسة الرئيسية والعدادات العلوية من قاعدة البيانات الحقيقية */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>لوحة متابعة المترشحين والمشتركين الحقيقيين</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">سجل المستخدمين وتتبع نقرات الترقية</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                بيانات حية مباشرة من قاعدة البيانات: عدد المسجلين، نقرات الترقية، الأسئلة المنجزة، وحالة وصولات الدفع.
              </p>
            </div>

            <button
              onClick={loadUsersData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات الحية</span>
            </button>

            <button
              onClick={handlePrintReport}
              disabled={loading || usersList.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/50 text-white text-xs font-bold border border-indigo-400/30 transition-all cursor-pointer disabled:opacity-50"
              title="طباعة تقرير إحصائي شامل بجميع البيانات"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة تقرير</span>
            </button>
          </div>

          {/* العدادات العلوية الأربعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-white">{stats.totalRegistered}</span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-bold">إجمالي المسجلين</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-amber-400">{stats.totalFree}</span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-bold">حسابات تجريبية (مجانية)</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-400">{stats.totalSubscribed}</span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-bold">مشتركون مفعلون (مدفوع)</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-sky-400">{stats.totalUpgradeClicks}</span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-bold">إجمالي نقرات الترقية</span>
            </div>
          </div>
        </div>
      </div>

      {/* تنبيه التذكير الآلي للمستخدمين العالقين (Task 4: Auto Reminder after 30 mins) */}
      {abandonedUpgradeUsers.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                {abandonedUpgradeUsers.length}
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-amber-900">
                  مترشحون ضغطوا على الترقية ولم يكملوا رفع الوصل (مضى أكثر من 30 دقيقة)
                </h4>
                <p className="text-xs text-amber-800">
                  أبدو اهتماماً بالاشتراك الكامل بـ 50 درهم. يمكنك مراسلتهم بنقرة واحدة عبر واتساب أو تتبعهم:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {abandonedUpgradeUsers.map((u) => {
              const alreadySent = remindersSent.has(u.email);
              return (
                <div key={u.id} className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 text-xs">
                    <span className="font-bold text-slate-800 block truncate">{u.fullName}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{u.email}</span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      آخر نقرة: {formatCasablancaTime(u.lastUpgradeClickAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSendWhatsAppReminder(u.email)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      alreadySent 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs'
                    }`}
                    title="فتح محادثة واتساب مع رسالة التذكير الرسمية"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{alreadySent ? 'تم التذكير' : 'تذكير واتساب'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* رسالة الخطأ إن وجدت */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* تبويبات التحكم والفلاتر والبحث */}
      <div className="space-y-4">
        {/* التبويبان الرئيسيان: الحسابات المجانية vs المشتركون المفعلون */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('trial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'trial'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>الحسابات التجريبية (مجانية)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'trial' ? 'bg-white text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {stats.totalFree}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>المشتركون المفعلون (مدفوع)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'paid' ? 'bg-white text-emerald-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {stats.totalSubscribed}
              </span>
            </button>
          </div>

          {/* فلاتر البحث والسلك */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* حقل البحث بالاسم أو الإيميل */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الإيميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* فلتر السلك */}
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 cursor-pointer"
            >
              <option value="all">جميع الأسلاك</option>
              <option value="primary">التعليم الابتدائي (مزدوج)</option>
              <option value="secondary_prep">الثانوي الإعدادي</option>
              <option value="secondary_qual">الثانوي التأهيلي</option>
            </select>
          </div>
        </div>

        {/* جدول عرض المستخدمين */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-bold">جارٍ جلب وتجميع سجلات المستخدمين الحقيقية...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-extrabold text-slate-700">لا يوجد مستخدمون يطابقون شروط البحث الحالية</p>
              <p className="text-xs text-slate-400">جرّب تغيير كلمات البحث أو السلك المحدد أعلاه.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-extrabold text-[11px] border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">المترشح (الاسم والإيميل)</th>
                    <th className="py-3.5 px-4">السلك المختار</th>
                    <th className="py-3.5 px-4">تاريخ التسجيل (الدار البيضاء)</th>
                    <th className="py-3.5 px-4 text-center">الأسئلة المنجزة</th>
                    <th className="py-3.5 px-4 text-center">نقرات الترقية</th>
                    <th className="py-3.5 px-4 text-center">مدة المكوث</th>
                    <th className="py-3.5 px-4 text-center">حالة الوصل</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isCurrentUserAdmin = u.email === currentAdmin?.email;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* الاسم والإيميل */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-sm">{u.fullName}</span>
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-black text-[9px]">
                                  مشرف
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono text-[11px] block">{u.email}</span>
                          </div>
                        </td>

                        {/* السلك */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{getCycleTitle(u.cycle)}</span>
                          </span>
                        </td>

                        {/* تاريخ التسجيل بتوقيت الدار البيضاء */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">
                          {formatCasablancaTime(u.createdAt)}
                        </td>

                        {/* الأسئلة المجتازة من progress */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {u.questionsViewedCount}
                          </span>
                        </td>

                        {/* نقرات الترقية وآخر نقرة */}
                        <td className="py-3.5 px-4 text-center">
                          {u.upgradeClicksCount > 0 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[11px]">
                                <MousePointerClick className="w-3 h-3 text-amber-600" />
                                <span>{u.upgradeClicksCount} نقرات</span>
                              </span>
                              {u.lastUpgradeClickAt && (
                                <span className="text-[10px] text-slate-400 block font-medium" title={formatCasablancaTime(u.lastUpgradeClickAt)}>
                                  {formatCasablancaTime(u.lastUpgradeClickAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>

                        {/* مدة المكوث بالدقائق */}
                        <td className="py-3.5 px-4 text-center">
                          {u.timeSpentMinutes > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold text-[11px] border border-sky-200">
                              <Timer className="w-3 h-3 text-sky-500" />
                              <span>{u.timeSpentMinutes} دق</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* حالة الوصل */}
                        <td className="py-3.5 px-4 text-center">
                          {u.receiptStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>مفعل ومقبول</span>
                            </span>
                          ) : u.receiptStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>وصل قيد المراجعة</span>
                            </span>
                          ) : u.receiptStatus === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] border border-amber-300">
                              <PauseCircle className="w-3 h-3 text-amber-600" />
                              <span>معلق مؤقتاً</span>
                            </span>
                          ) : u.receiptStatus === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">لا يوجد وصل</span>
                          )}
                        </td>

                        {/* الإجراءات */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* معاينة صورة الوصل إن وجدت */}
                            {u.receiptUrl && (
                              <button
                                onClick={() => setPreviewImage(u.receiptUrl || null)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                title="معاينة صورة الوصل"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}

                            {/* زر التفعيل كمشترك كامل */}
                            {u.subscriptionStatus !== 'premium' && !isCurrentUserAdmin && (
                              <button
                                onClick={() => handleApproveUser(u)}
                                disabled={actionInProgress === u.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                title="تفعيل حسابه كمشترك كامل"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تفعيل</span>
                              </button>
                            )}

                            {/* زر التعليق المؤقت */}
                            {u.subscriptionStatus === 'premium' && !isCurrentUserAdmin && (
                              <button
                                onClick={() => handleSuspendUser(u)}
                                disabled={actionInProgress === u.id}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 border border-amber-300"
                                title="تعليق حسابه مؤقتاً"
                              >
                                <PauseCircle className="w-3 h-3 text-amber-700" />
                                <span>تعليق</span>
                              </button>
                            )}

                            {/* زر المراسلة السريعة عبر واتساب */}
                            <button
                              onClick={() => {
                                const text = `Salam ${u.fullName}, بخصوص حسابك في منصة CRMEF Prep (${u.email}):`;
                                window.open(`https://wa.me/212767471061?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                              title="مراسلة المترشح عبر واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                            </button>

                            {/* زر الحذف النهائي (للتجارب والحسابات الوهمية) */}
                            {!isCurrentUserAdmin && (
                              <button
                                onClick={() => setDeletingId(u.id)}
                                disabled={actionInProgress === u.id}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer disabled:opacity-50"
                                title="حذف هذا المشترك وسجله نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* نافذة معاينة صورة الوصل المكبرة */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="صورة الوصل المكبرة" 
              className="max-h-[85vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* نافذة تأكيد حذف المشترك نهائياً */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
              <Trash2 className="w-5 h-5" />
              <span>تأكيد حذف المشترك نهائياً</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف هذا المستخدم وسجله؟ (مفيد لحذف الحسابات التجريبية أو الوهمية).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const target = usersList.find(u => u.id === deletingId);
                  if (target) handleDeleteUser(target);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                نعم، حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
