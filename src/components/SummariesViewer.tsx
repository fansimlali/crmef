import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Search, 
  Eye
} from 'lucide-react';
import { SUMMARIES_DATA, type SummaryArticle } from '../data/summariesData';

export const SummariesViewer: React.FC = () => {
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<'all' | 'primary' | 'secondary_prep' | 'secondary_qual'>('all');
  const [selectedArticle, setSelectedArticle] = useState<SummaryArticle>(SUMMARIES_DATA[0]);
  const [search, setSearch] = useState('');
  const [fontSize, setFontSize] = useState<number>(16);

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

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* الترويسة وشريط الحماية */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Lock className="w-3.5 h-3.5" />
            <span>المكتبة التربوية المحمية (نسخة للعرض والمراجعة الحصرية)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            ملخصات ودلائل مراجعة مواد وتوصيفات المباراة
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            تم تجهيز هذه الملخصات البيداغوجية لمساعدتك على ترسيخ المعارف الأساسية في علوم التربية والديداكتيك والمواد. 
            المحتوى محمي بنظام أمني يمنع التحميل المباشر أو النسخ واللصق لحفظ الجهد الأكاديمي.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* القائمة الجانبية للملخصات */}
        <div className="space-y-3">
          {/* فلتر الأسلاك */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setSelectedCycleFilter('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                selectedCycleFilter === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              الكل ({SUMMARIES_DATA.length})
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
              const isSelected = selectedArticle.id === item.id;
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
                      <Eye className="w-3 h-3" />
                      <span>قراءة</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* قارئ الملخص المحمي */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative">
          {/* شريط أدوات القارئ والتكبير */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                {selectedArticle.category}
              </span>
              <span>•</span>
              <span className="font-semibold">{selectedArticle.readTime}</span>
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

          {/* محتوى المقال مع الحماية التامة */}
          <div
            className="space-y-6 relative"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.8',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {/* علامة مائية باهتة لحماية الملكية */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-slate-900 font-black text-4xl rotate-[-25deg]">
              منصة CRMEF – نسخة حصرية للقراءة فقط
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {selectedArticle.title}
            </h3>

            {selectedArticle.sections.map((sec, i) => (
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

          {/* شريط الإشعار الأمني في الأسفل */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>المحتوى محمي ومشفر ضد النسخ والتحميل المباشر</span>
            </span>
            <span className="text-slate-400">CRMEF Portal 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

