import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Search, 
  Eye,
  Crown,
  LogIn
} from 'lucide-react';
import { SUMMARIES_DATA, type SummaryArticle } from '../data/summariesData';
import { useAuth } from '../context/AuthContext';
import { CYCLES, type CycleKey } from '../types';

interface SummariesViewerProps {
  onOpenAuth?: () => void;
}

export const SummariesViewer: React.FC<SummariesViewerProps> = ({ onOpenAuth }) => {
  const { user, isAdmin, isPremium, setUpgradeModalOpen } = useAuth();

  // سلك المستخدم المسجل
  const userCycle = user?.cycle || null;

  // تحديد الفلتر الافتراضي حسب سلك المستخدم إذا كان مشتركاً
  const defaultFilter: 'all' | CycleKey = (user && !isAdmin && userCycle) ? userCycle : 'all';

  const [selectedCycleFilter, setSelectedCycleFilter] = useState<'all' | CycleKey>(defaultFilter);
  const [selectedArticle, setSelectedArticle] = useState<SummaryArticle>(SUMMARIES_DATA[0]);
  const [search, setSearch] = useState('');
  const [fontSize, setFontSize] = useState<number>(16);

  // تحديث الفلتر عند تحميل المستخدم
  useEffect(() => {
    if (user && !isAdmin && userCycle) {
      setSelectedCycleFilter(userCycle);
    }
  }, [user, isAdmin, userCycle]);

  // تفعيل نظام حماية النسخ والطباعة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع Ctrl+C, Ctrl+P, Ctrl+S, Ctrl+U
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'p', 's', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        alert('تنبيه أمني: هذه الملخصات محمية بحقوق التأليف داخل المنصة وغير قابلة للنسخ أو الطباعة.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // تصفية المقالات حسب السلك والبحث
  const filtered = SUMMARIES_DATA.filter((a) => {
    // تصفية حسب السلك
    if (selectedCycleFilter === 'primary' && !a.cycle.includes('ابتدائي')) return false;
    if (selectedCycleFilter === 'secondary_prep' && !a.cycle.includes('إعدادي')) return false;
    if (selectedCycleFilter === 'secondary_qual' && !a.cycle.includes('تأهيلي')) return false;

    // بحث بالكلمة
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      a.category.toLowerCase().includes(term) ||
      a.sections.some((s) => s.heading.toLowerCase().includes(term) || s.paragraphs.some(p => p.toLowerCase().includes(term)))
    );
  });

  // مزامنة المقال المختار إذا أصبح خارج الفلتر
  useEffect(() => {
    if (filtered.length > 0 && !filtered.some(a => a.id === selectedArticle.id)) {
      setSelectedArticle(filtered[0]);
    }
  }, [selectedCycleFilter, filtered, selectedArticle.id]);

  // نص العلامة المائية الديناميكية (الميزة المعتمدة 4)
  const watermarkText = user 
    ? `${user.fullName || user.email} • ${user.email} • منصة CRMEF الحصرية`
    : 'منصة CRMEF – نسخة حصرية للقراءة فقط';

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* الترويسة وشريط الحماية */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Lock className="w-3.5 h-3.5" />
            <span>المكتبة التربوية المحمية (نسخة للمشتركين فقط)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            ملخصات ودلائل مراجعة مواد وتوصيفات المباراة
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            تم تجهيز هذه الملخصات البيداغوجية الشاملة بالدارجة المغربية الفصيحة والمبسطة لمساعدتك على ترسيخ المعارف الأساسية في علوم التربية والديداكتيك وتخصصك. 
            المحتوى محمي بعلامة مائية ديناميكية وتشفير يمنع النسخ والطباعة لحفظ الحقوق.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* القائمة الجانبية للملخصات */}
        <div className="space-y-3">
          {/* فلتر الأسلاك (يظهر فقط للمشرف أو إذا لم يكن هناك سلك مقيد) */}
          {(!user || isAdmin || !userCycle) ? (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setSelectedCycleFilter('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  selectedCycleFilter === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedCycleFilter('primary')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  selectedCycleFilter === 'primary' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                الابتدائي
              </button>
              <button
                onClick={() => setSelectedCycleFilter('secondary_prep')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  selectedCycleFilter === 'secondary_prep' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                الإعدادي
              </button>
              <button
                onClick={() => setSelectedCycleFilter('secondary_qual')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  selectedCycleFilter === 'secondary_qual' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                التأهيلي
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between">
              <span>ملخصات سلكك المعتمد:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black">
                {CYCLES.find(c => c.id === userCycle)?.name}
              </span>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="ابحث عن مادة أو مفهوم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filtered.map((item) => {
              const isSelected = selectedArticle?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedArticle(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1 opacity-80">
                    <span>{item.category}</span>
                    <span>{item.readTime}</span>
                  </div>
                  <h4 className="font-extrabold text-sm leading-snug">
                    {item.title}
                  </h4>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.cycle}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      {!isPremium ? <Lock className="w-3 h-3 text-amber-300" /> : <Eye className="w-3 h-3" />}
                      <span>{!isPremium ? 'معاينة' : 'قراءة'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* قارئ الملخص المحمي */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between">
          
          {/* محتوى القارئ */}
          <div>
            {/* شريط أدوات القارئ والتكبير */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                  {selectedArticle?.category}
                </span>
                <span>•</span>
                <span className="font-semibold">{selectedArticle?.readTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px]">حجم الخط:</span>
                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                  title="تصغير الخط"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                  title="تكبير الخط"
                >
                  A+
                </button>
              </div>
            </div>

            {/* حالة القفل إذا لم يكن المستخدم مشتركاً كاملاً */}
            {!isPremium ? (
              <div className="py-12 px-4 text-center space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    هذا الملخص متاح حصرياً للمشتركين الكاملين
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    يحتوي هذا الملف على ملخص ديداكتيكي وبيداغوجي مكثف بالدارجة المغربية يغطي جميع محاور المادة وتوصيفات المباراة.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-xs text-slate-700 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>مزايا الترقية للمشترك الكامل:</span>
                  </div>
                  <ul className="text-right space-y-1 list-disc list-inside text-slate-600">
                    <li>الاطلاع على جميع الملخصات الـ 19 كاملة</li>
                    <li>فتح بنك الأسئلة بالكامل (أكثر من 2,284 سؤالاً)</li>
                    <li>إلغاء سقف الـ 20 سؤالاً التجريبي</li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {!user ? (
                    <button
                      onClick={onOpenAuth}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول / إنشاء حساب</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setUpgradeModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>ترقية الحساب الآن (إرسال وصل الأداء)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* المحتوى المقروء للمشترك الكامل مع العلامة المائية الديناميكية */
              <div
                className="space-y-6 relative"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {/* ───── العلامة المائية الشفافة الديناميكية (الميزة المعتمدة 4) ───── */}
                <div 
                  className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 flex flex-wrap items-center justify-around opacity-[0.05] text-slate-900 font-black text-xs sm:text-sm rotate-[-20deg]"
                  style={{ gap: '60px 40px' }}
                >
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className="whitespace-nowrap">
                      {watermarkText}
                    </div>
                  ))}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {selectedArticle?.title}
                </h3>

                {selectedArticle?.sections.map((sec, i) => (
                  <div key={i} className="space-y-2 pt-2">
                    <h4 className="font-extrabold text-emerald-800 text-base sm:text-lg border-r-4 border-emerald-600 pr-3">
                      {sec.heading}
                    </h4>
                    <div className="space-y-2 text-slate-700 font-normal">
                      {sec.paragraphs.map((p, pi) => (
                        <p key={pi} className="leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* شريط الإشعار الأمني في الأسفل */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>المحتوى محمي ومشفر ضد النسخ والتحميل المباشر</span>
            </span>
            <span className="text-slate-400">منصة CRMEF 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
