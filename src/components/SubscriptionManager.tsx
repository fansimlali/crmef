import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, getExamConfigs } from '../lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  X, 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  GraduationCap,
  AlertCircle,
  PauseCircle,
  Trash2
} from 'lucide-react';
import { CYCLES, type SubscriptionRequest } from '../types';

export const SubscriptionManager: React.FC = () => {
  const { 
    subscriptionRequests, 
    approveSubscription, 
    rejectSubscription,
    suspendSubscription,
    deleteSubscription
  } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended' | 'rejected'>('all');

  // فلتر المباريات — القائمة من جدول exams (آلية)، وربط كل طلب مستخدم بمباراته عبر profiles.exam_id
  const [examFilter, setExamFilter] = useState<string>('all');
  const [examOptions, setExamOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [userExamMap, setUserExamMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    getExamConfigs()
      .then(({ exams }) => {
        if (alive) setExamOptions(exams.filter((e) => e.isActive).map((e) => ({ id: e.id, name: e.name || e.shortName || e.id })));
      })
      .catch(() => { /* يبقى الافتراضي */ });
    void (async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('profiles').select('id, exam_id');
        if (!alive || error || !data) return;
        const map: Record<string, string> = {};
        data.forEach((p: { id: string; exam_id?: string }) => { map[p.id] = p.exam_id || 'crmef'; });
        setUserExamMap(map);
      } catch {
        /* يبقى الافتراضي */
      }
    })();
    return () => { alive = false; };
  }, []);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [deletingReqId, setDeletingReqId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('صورة الوصل غير واضحة أو المبلغ غير مطابق');
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRequests = subscriptionRequests.filter(r => {
    // تصفية المباراة: الطرف من profiles.exam_id (الافتراضي crmef للمحتوى القديم)
    if (examFilter !== 'all') {
      const ex = userExamMap[r.userId] || 'crmef';
      if (ex !== examFilter) return false;
    }
    if (filter === 'all') return true;
    return r.status === filter;
  });

  // خريطة أسماء المباريات لعرض خطط الطلبات (شامل / مباراة واحدة)
  const examNameById = useMemo(
    () => Object.fromEntries(examOptions.map((e) => [e.id, e.name])),
    [examOptions]
  );

  /** وصف خطة الطلب: شامل (100) أو مباراة واحدة (50) باسمها. */
  const planTextOf = (r: SubscriptionRequest): string =>
    r.plan === 'single'
      ? `مباراة واحدة: ${examNameById[r.premiumScope || ''] || r.premiumScope || '؟'} — 50 درهم`
      : 'شامل لكل المباريات — 100 درهم';

  // الشارة الملونة للخطة في أعلى كل بطاقة
  const planBadgeOf = (r: SubscriptionRequest) =>
    r.plan === 'single' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
        <span>خطة مباراة واحدة</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
        <span>خطة شاملة</span>
      </span>
    );

  const pendingCount = subscriptionRequests.filter(r => r.status === 'pending').length;
  const approvedCount = subscriptionRequests.filter(r => r.status === 'approved').length;
  const suspendedCount = subscriptionRequests.filter(r => r.status === 'suspended').length;
  const rejectedCount = subscriptionRequests.filter(r => r.status === 'rejected').length;

  const handleApprove = async (id: string) => {
    const req = subscriptionRequests.find(r => r.id === id);
    const confirmText = req?.plan === 'single'
      ? `هل أنت متأكد من تفعيل هذا المشترك باستهلاكه خطة «مباراة واحدة (50 درهم)»؟ سيُحصر وصوله في مباراة: ${examNameById[req?.premiumScope || ''] || req?.premiumScope || '؟'}`
      : 'هل أنت متأكد من تفعيل هذا المشترك بالخطة الشاملة لكل المباريات الحالية والمقبلة (100 درهم)؟';
    if (confirm(confirmText)) {
      setActionError(null);
      setProcessingId(id);
      const ok = await approveSubscription(id);
      setProcessingId(null);
      if (!ok) {
        setActionError('تعذر تفعيل الاشتراك. تحقق من صلاحيات المشرف ومن وجود جدول profiles ثم أعد المحاولة.');
      }
    }
  };

  const handleSuspend = async (id: string) => {
    if (confirm('هل أنت متأكد من تعليق هذا المشترك مؤقتاً؟ سيعود حسابه تجريبياً وتُحجب عنه الملخصات وبنك الأسئلة الكامل.')) {
      setActionError(null);
      setProcessingId(id);
      const ok = await suspendSubscription(id);
      setProcessingId(null);
      if (!ok) {
        setActionError('تعذر تعليق الاشتراك. تحقق من الصلاحيات.');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReqId) return;
    setActionError(null);
    setProcessingId(deletingReqId);
    const ok = await deleteSubscription(deletingReqId);
    setProcessingId(null);
    if (!ok) {
      setActionError('تعذر حذف المشترك. تحقق من صلاحيات المشرف.');
    }
    setDeletingReqId(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingReqId) return;
    setActionError(null);
    setProcessingId(rejectingReqId);
    const ok = await rejectSubscription(rejectingReqId, rejectionReason);
    setProcessingId(null);
    if (!ok) {
      setActionError('تعذر رفض الطلب. تحقق من صلاحيات المشرف ثم أعد المحاولة.');
    }
    setRejectingReqId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* الترويسة الإدارية */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>لوحة تحكم المشرف العام</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">إدارة طلبات الاشتراكات وإثباتات الدفع</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              راجع وصولات التحويل، فعّل الحسابات، علّق أو احذف الاشتراكات التجريبية بضغطة زر واحدة.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-center flex-wrap">
            <div className="text-center px-2">
              <span className="block text-xl font-black text-amber-400">{pendingCount}</span>
              <span className="text-[10px] text-slate-300 font-bold">طلبات جديدة</span>
            </div>
            <div className="w-px h-7 bg-white/20" />
            <div className="text-center px-2">
              <span className="block text-xl font-black text-emerald-400">{approvedCount}</span>
              <span className="text-[10px] text-slate-300 font-bold">مشتركون مفعلون</span>
            </div>
            <div className="w-px h-7 bg-white/20" />
            <div className="text-center px-2">
              <span className="block text-xl font-black text-amber-300">{suspendedCount}</span>
              <span className="text-[10px] text-slate-300 font-bold">معلقون مؤقتاً</span>
            </div>
          </div>
        </div>
      </div>

      {/* رسالة خطأ عند فشل إجراء إداري */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* أزرار الفلترة */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* فلتر المباراة — يُغذّى آلياً من قاعدة البيانات */}
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 cursor-pointer"
          >
            <option value="all">جميع المباريات</option>
            {examOptions.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({subscriptionRequests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span>قيد المراجعة</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-amber-900 text-[10px] flex items-center justify-center font-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            المقبولة ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'suspended' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            المعلقة ({suspendedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            المرفوضة ({rejectedCount})
          </button>
        </div>
      </div>

      {/* قائمة الطلبات */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-slate-700 text-base">لا توجد طلبات اشتراك في هذا القسم حالياً</h4>
          <p className="text-xs text-slate-400">ستظهر هنا أي وصولات دفع يرفعها المترشحون لطلب التفعيل.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const cycleDef = CYCLES.find(c => c.id === req.cycle);
            return (
              <div 
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative"
              >
                {/* شريط الحالة بالأعلى */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                    req.status === 'approved' 
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'suspended'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : req.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {req.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {req.status === 'suspended' && <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
                    {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                    <span>
                      {req.status === 'approved' 
                        ? 'مفعل ومشترك' 
                        : req.status === 'suspended'
                        ? 'معلق مؤقتاً'
                        : req.status === 'rejected' 
                        ? 'مرفوض' 
                        : 'قيد المراجعة'}
                    </span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(req.createdAt).toLocaleDateString('ar-MA')}</span>
                  </span>
                </div>

                {/* بيانات المترشح */}
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-black text-sm text-slate-900">{req.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-mono">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{req.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-bold text-indigo-700">{cycleDef?.name || req.cycle}</span>
                  </div>
                  {/* خطة الاشتراك: شاملة (100) أو تستهدف مباراة واحدة (50) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {planBadgeOf(req)}
                    <span className="text-[11px] text-slate-500 font-bold">{planTextOf(req)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>وسيلة الدفع: <strong>{req.paymentMethod || 'تحويل بنكي'}</strong></span>
                  </div>
                  {req.notes && (
                    <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 font-medium">
                      ملاحظة المترشح: {req.notes}
                    </div>
                  )}
                  {req.rejectionReason && (
                    <div className={`p-2 rounded-xl text-[11px] font-medium ${
                      req.status === 'suspended' ? 'bg-amber-50 text-amber-900' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {req.status === 'suspended' ? 'سبب التعليق: ' : 'سبب الرفض: '}
                      {req.rejectionReason}
                    </div>
                  )}
                </div>

                {/* مصغرة الوصل مع زر المعاينة */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  {req.receiptUrl ? (
                    <div 
                      onClick={() => setPreviewImage(req.receiptUrl)}
                      className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                    >
                      <img 
                        src={req.receiptUrl} 
                        alt="وصل الدفع" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-300 group-hover:opacity-90"
                      />
                      <div className="text-[11px] text-right">
                        <span className="font-bold text-slate-800 block group-hover:text-emerald-700 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>معاينة صورة الوصل</span>
                        </span>
                        <span className="text-slate-400">انقر للتكبير</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-500">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>لا يوجد وصل أو تم حذفه</span>
                    </div>
                  )}

                  {/* أزرار الإجراء للمشرف */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* زر التفعيل / إعادة التفعيل */}
                    {req.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        title={req.status === 'suspended' ? 'إلغاء التعليق وتفعيل الحساب' : 'تفعيل الحساب كمشترك كامل'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{req.status === 'suspended' ? 'إلغاء التعليق' : 'تفعيل'}</span>
                      </button>
                    )}

                    {/* زر التعليق المؤقت للمشتركين المفعلين */}
                    {req.status === 'approved' && (
                      <button
                        onClick={() => handleSuspend(req.id)}
                        disabled={processingId === req.id}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 border border-amber-300"
                        title="تعليق اشتراك هذا المستخدم مؤقتاً"
                      >
                        <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>تعليق مؤقت</span>
                      </button>
                    )}

                    {/* زر الرفض للطلبات الجديدة */}
                    {req.status === 'pending' && (
                      <button
                        onClick={() => setRejectingReqId(req.id)}
                        disabled={processingId === req.id}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        رفض
                      </button>
                    )}

                    {/* زر الحذف النهائي للحسابات التجريبية أو الوهمية */}
                    <button
                      onClick={() => setDeletingReqId(req.id)}
                      disabled={processingId === req.id}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer disabled:opacity-50 border border-transparent hover:border-rose-200"
                      title="حذف هذا المشترك وسجله نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      {deletingReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
              <Trash2 className="w-5 h-5" />
              <span>تأكيد حذف المشترك نهائياً</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف هذا السجل نهائياً؟ سيتم مسح بيانات الطلب وصورة الوصل من السحابة تماماً (مفيد جداً لتنظيف الحسابات التجريبية أو الوهمية).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingReqId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                نعم، حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تحديد سبب الرفض */}
      {rejectingReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
              <AlertCircle className="w-5 h-5" />
              <span>تأكيد رفض طلب الاشتراك</span>
            </div>
            <p className="text-xs text-slate-600">
              يرجى تحديد سبب الرفض ليظهر في حساب المترشح حتى يتمكن من تعديله:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingReqId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
