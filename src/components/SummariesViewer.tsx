import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Search, 
  Eye
} from 'lucide-react';

interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  cycle: string;
  readTime: string;
  sections: { heading: string; paragraphs: string[] }[];
}

const SAMPLE_SUMMARIES: SummaryArticle[] = [
  {
    id: 'sum_edu_1',
    title: 'ملخص شامل في نظريات التعلم الكبرى وتطبيقاتها الصفية',
    category: 'علوم التربية',
    cycle: 'مشترك لجميع الأسلاك',
    readTime: '6 دقائق قراءة',
    sections: [
      {
        heading: '1. النظرية البنائية (جان بياجي)',
        paragraphs: [
          'يرى بياجي أن المعرفة لا تنقل جاهزة إلى ذهن المتعلم بل يبنيها بنفسه عبر التفاعل النشط مع محيطه.',
          'الآليات المركزية للتعلم: التمثل (Assimilation) وهو إدماج المعارف الجديدة في البنيات المعرفية القائمة، والملاءمة (Accommodation) وهي تعديل البنيات الذهنية عند مواجهة وضعيات جديدة، وصولاً إلى التوازن (Équilibration).',
          'التطبيق الصفي: الانطلاق من الوضعيات-المشكلات وإعطاء المتعلم فرصة للاستكشاف وبناء المفاهيم الذاتي.'
        ]
      },
      {
        heading: '2. النظرية السوسيو-بنائية (فيجوتسكي)',
        paragraphs: [
          'يؤكد فيجوتسكي أن التعلم يحدث أولاً في المستوى الاجتماعي التواصلي بين الأفراد، ثم يتحول إلى المستوى الفردي الداخلي.',
          'المفهوم المركزي: «منطقة النمو القريبة» (ZPD)، وهي الفارق بين ما يستطيع المتعلم إنجازه بمفرده وما ينجزه بدعم المدرس أو بتعاون الأقران (السقالات البيداغوجية - Échafaudage).',
          'التطبيق الصفي: تشجيع العمل في مجموعات تفاعلية، وتوظيف استراتيجيات التدريس بالقرين والنقاش البناء.'
        ]
      },
      {
        heading: '3. النظرية الجشطالتية (كوهلر وفيرتهايمر)',
        paragraphs: [
          'تقوم على مبدأ أن «الكل أكبر من مجموع الأجزاء». التعلم الحقيقي يحدث عبر «الاستبصار» (Insight) أي الإدراك المفاجئ والشامل للعلاقات المنطقية بين عناصر الموقف التعليمي.',
          'التطبيق الصفي: تقديم الموضوع التعليمي في كليته المنطقية قبل تفكيكه إلى عناصر تفصيلية.'
        ]
      }
    ]
  },
  {
    id: 'sum_didactics_1',
    title: 'ملخص المفاهيم المركزية في الديداكتيك والبيداغوجيا',
    category: 'الديداكتيك العام',
    cycle: 'مشترك لجميع الأسلاك',
    readTime: '5 دقائق قراءة',
    sections: [
      {
        heading: '1. النقل الديداكتيكي (Transposition Didactique)',
        paragraphs: [
          'مفهوم بلوره الباحث إيف شيفالار (Yves Chevallard)، ويعني المسار والتحولات البيداغوجية التي تخضع لها «المعرفة العالمة» (Savoir savant) لتتحول إلى «معرفة معدة للتدريس» (Savoir à enseigner) في المناهج، ثم إلى «معرفة مدرسة فعلياً» داخل القسم (Savoir enseigné).',
          'الهدف: تكييف المفاهيم المعقدة مع المستوى العمري والذهني للمتعلمين دون الإخلال بالأمانة العلمية.'
        ]
      },
      {
        heading: '2. المثلث الديداكتيكي (Triangle Didactique)',
        paragraphs: [
          'يربط بين ثلاثة أقطاب رئيسية غير قابلة للاختزال: المدرس، المتعلم، والمعرفة.',
          'التمفصل بين الأقطاب: العلاقة بين المدرس والمتعلم تمثل المحور البيداغوجي، العلاقة بين المدرس والمعرفة تمثل المحور الإبستيمولوجي، والعلاقة بين المتعلم والمعرفة تمثل المحور السيكولوجي/الديداكتيكي.'
        ]
      },
      {
        heading: '3. التعاقد الديداكتيكي (Contrat Didactique)',
        paragraphs: [
          'صاغه الباحث غي بروسو (Guy Brousseau)، وهو مجموع الالتزامات والتوقعات الضمنية والصريحة المتبادلة بين المدرس والمتعلمين حول ما يُنتظر من كل طرف إنجازه في إطار التعلم.'
        ]
      }
    ]
  },
  {
    id: 'sum_reforms_1',
    title: 'مستجدات خارطة الطريق 2022-2026 ومؤسسات الريادة',
    category: 'مستجدات الإصلاح التربوي',
    cycle: 'ابتدائي وثانوي',
    readTime: '7 دقائق قراءة',
    sections: [
      {
        heading: '1. المرتكزات الثلاثة لخارطة الطريق',
        paragraphs: [
          'تنتظم خارطة الطريق حول ثلاثة محاور استراتيجية متكاملة: التلميذ (تحقيق التحكم في التعلمات الأساس والحد من الهدر المدرسي)، الأستاذ (تكوين أساس ومستمر ذو جودة وتثمين مهنة التدريس)، والمؤسسة (توفير بيئة تربوية ملائمة ومنفتحة ومحفزة).',
          'الهدف الاستراتيجي: تمكين أكثر من 70% من المتعلمين من التحكم في التعلمات الأساسية بحلول سنة 2026.'
        ]
      },
      {
        heading: '2. مقاربة التدريس وفق المستوى المناسب (TaRL)',
        paragraphs: [
          'تعتمد على تقويم تشخيصي فردي دقيق وتفييء المتعلمين وفق مستواهم الفعلي في التعلم بدلاً من مستواهم الدراسي العمري، بهدف سد التعثرات المتراكمة في القراءة والحساب في وقت وجيز.'
        ]
      },
      {
        heading: '3. التعليم الصريح (Explicit Teaching)',
        paragraphs: [
          'طريقة تدريس مهيكلة ومباشرة تمر بمراحل محددة: النمذجة (Je fais)، الممارسة الموجهة (Nous faisons)، ثم الممارسة المستقلة (Tu fais)، مع التحقق المستمر من الفهم لضمان عدم ترك أي متعلم في حالة التباس.'
        ]
      }
    ]
  }
];

export const SummariesViewer: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<SummaryArticle>(SAMPLE_SUMMARIES[0]);
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

  const filtered = SAMPLE_SUMMARIES.filter(
    (a) =>
      a.title.includes(search) ||
      a.category.includes(search) ||
      a.sections.some((s) => s.heading.includes(search))
  );

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
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="ابحث في عناوين ومحاور الملخصات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
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

