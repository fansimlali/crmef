import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  AlertCircle
} from 'lucide-react';
import { CYCLES } from '../types';

export const SubscriptionManager: React.FC = () => {
  const { subscriptionRequests, approveSubscription, rejectSubscription } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('صورة الوصل غير واضحة أو المبلغ غير مطابق');

  const filteredRequests = subscriptionRequests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = subscriptionRequests.filter(r => r.status === 'pending').length;

  const handleApprove = async (id: string) => {
    if (confirm('هل أنت متأكد من تفعيل هذا المشترك كمشترك كامل في المنصة؟')) {
      await approveSubscription(id);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReqId) return;
    await rejectSubscription(rejectingReqId, rejectionReason);
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
              راجع وصولات التحويل البنكي وفعّل حسابات المشتركين الجدد بضغطة زر لفتح كامل بنك الأسئلة والملخصات.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-center">
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-amber-400">{pendingCount}</span>
              <span className="text-[11px] text-slate-300 font-bold">طلبات جديدة</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-emerald-400">
                {subscriptionRequests.filter(r => r.status === 'approved').length}
              </span>
              <span className="text-[11px] text-slate-300 font-bold">مشتركون مفعلون</span>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار الفلترة */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 text-xs font-bold">
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
            المقبولة ({subscriptionRequests.filter(r => r.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            المرفوضة ({subscriptionRequests.filter(r => r.status === 'rejected').length})
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
                      : req.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{req.status === 'approved' ? 'مفعل ومشترك' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</span>
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
                    <div className="p-2 rounded-xl bg-rose-50 text-[11px] text-rose-700 font-medium">
                      سبب الرفض المسجل: {req.rejectionReason}
                    </div>
                  )}
                </div>

                {/* مصغرة الوصل مع زر المعاينة */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
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

                  {/* أزرار الإجراء للمشرف */}
                  <div className="flex items-center gap-1.5">
                    {req.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تفعيل الحساب</span>
                      </button>
                    )}

                    {req.status === 'pending' && (
                      <button
                        onClick={() => setRejectingReqId(req.id)}
                        className="px-2.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        رفض
                      </button>
                    )}
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
