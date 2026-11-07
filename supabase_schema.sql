-- ========================================================
-- مخطط قاعدة بيانات Supabase لمنصة الاختبار التجريبي CRMEF
-- (الابتدائي المزدوج + الثانوي الإعدادي والتأهيلي)
-- ========================================================

-- 1. جدول الأسئلة
create table if not exists public.questions (
    id text primary key,
    cycles jsonb default '["primary"]'::jsonb, -- الأسلاك: primary, secondary_prep, secondary_qual
    subject text not null,          -- رمز المادة: ar, fr, ma, sc, sec_math, sec_philo, edu...
    topic text not null,            -- المحور / الباب
    question text not null,         -- نص السؤال
    options jsonb not null,         -- مصفوفة الخيارات
    correct_answer text not null,   -- الجواب الصحيح
    explanation text default '',    -- التعليل والتوضيح البيداغوجي
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. تفعيل سياسة الأمان RLS
alter table public.questions enable row level security;

-- 3. سياسات الوصول (Policies)
create policy "الجميع يمكنهم قراءة الأسئلة" 
on public.questions for select 
using (true);

create policy "السماح بإضافة الأسئلة" 
on public.questions for insert 
with check (true);

create policy "السماح بتعديل الأسئلة" 
on public.questions for update 
using (true);

create policy "السماح بحذف الأسئلة" 
on public.questions for delete 
using (true);

-- 4. إدراج وتحديث الأسئلة التأسيسية
insert into public.questions (id, cycles, subject, topic, question, options, correct_answer, explanation)
values
-- أسئلة الابتدائي
('ma1', '["primary"]'::jsonb, 'ma', 'قابلية القسمة', 'أي الأعداد التالية يقبل القسمة على 9؟', '["7 218", "4 728", "3 612", "2 543"]'::jsonb, '7 218', '7+2+1+8 = 18 وهو من مضاعفات 9.'),
('ma2', '["primary"]'::jsonb, 'ma', 'الكسور', 'ما ناتج 2/3 + 1/4 ؟', '["11/12", "3/7", "3/12", "9/12"]'::jsonb, '11/12', 'نوحد المقامات: 8/12 + 3/12 = 11/12.'),
('ma3', '["primary"]'::jsonb, 'ma', 'الهندسة', 'مثلث قائم طولا ضلعيه القائمين 6 سم و8 سم. ما طول وتره؟', '["10 سم", "14 سم", "12 سم", "100 سم"]'::jsonb, '10 سم', 'فيثاغورس: 36 + 64 = 100، والجذر التربيعي 10.'),
('ma4', '["primary"]'::jsonb, 'ma', 'التناسبية', 'ثمن 5 كراسات 35 درهما. ما ثمن 8 كراسات بالسعر نفسه؟', '["56 درهما", "48 درهما", "60 درهما", "40 درهما"]'::jsonb, '56 درهما', 'ثمن الكراس 7 دراهم، و7 × 8 = 56.'),

('fr1', '["primary"]'::jsonb, 'fr', 'Conjugaison', 'Hier, nous ____ au marché. (aller, passé composé)', '["sommes allés", "avons allé", "allions", "irons"]'::jsonb, 'sommes allés', 'Aller se conjugue avec l’auxiliaire être : nous sommes allés.'),
('fr2', '["primary"]'::jsonb, 'fr', 'Orthographe', 'Il ____ lavé les mains.', '["s’est", "c’est", "ces", "ses"]'::jsonb, 's’est', 'Verbe pronominal au passé composé : il s’est lavé.'),
('fr3', '["primary"]'::jsonb, 'fr', 'Grammaire', 'Dans « Le chat mange la souris », « la souris » est :', '["COD", "sujet", "COI", "attribut du sujet"]'::jsonb, 'COD', 'On pose la question : le chat mange quoi ? → la souris (COD).'),

('ar1', '["primary"]'::jsonb, 'ar', 'النحو', 'في جملة «إنَّ العلمَ نورٌ» إعراب كلمة «العلمَ»:', '["اسم إنّ منصوب", "خبر إنّ مرفوع", "مبتدأ مرفوع", "فاعل مرفوع"]'::jsonb, 'اسم إنّ منصوب', 'إنّ تنصب المبتدأ ويسمى اسمها.'),
('ar2', '["primary"]'::jsonb, 'ar', 'الصرف', 'اسم الفاعل من الفعل «كتب» هو:', '["كاتب", "مكتوب", "كتّاب", "مكتبة"]'::jsonb, 'كاتب', 'اسم الفاعل من الثلاثي على وزن فاعل.'),
('ar3', '["primary"]'::jsonb, 'ar', 'الإملاء', 'أي كلمة كتبت همزتها كتابة صحيحة؟', '["سؤال", "سوأل", "سئال", "سُأال"]'::jsonb, 'سؤال', 'الهمزة المضمومة بعد فتحة تكتب على الواو.'),

('sc1', '["primary"]'::jsonb, 'sc', 'الأرض والكون', 'سبب تعاقب الليل والنهار هو:', '["دوران الأرض حول نفسها", "دوران الأرض حول الشمس", "ميلان محور الأرض فقط", "دوران القمر حول الأرض"]'::jsonb, 'دوران الأرض حول نفسها', 'الأرض تدور حول محورها دورة كل 24 ساعة.'),
('sc2', '["primary"]'::jsonb, 'sc', 'جسم الإنسان', 'أين يتم امتصاص معظم الغذاء المهضوم؟', '["الأمعاء الدقيقة", "المعدة", "الأمعاء الغليظة", "المريء"]'::jsonb, 'الأمعاء الدقيقة', 'جدار الأمعاء الدقيقة غني بالزغابات الماصة.'),
('sc3', '["primary"]'::jsonb, 'sc', 'الكهرباء', 'مصباحان مركبان على التوازي، احترق أحدهما. ماذا يحدث للآخر؟', '["يستمر في الإضاءة", "ينطفئ", "ينفجر", "تنقطع الدارة كلها"]'::jsonb, 'يستمر في الإضاءة', 'في التركيب على التوازي لكل مصباح فرع مستقل.'),

('dma1', '["primary"]'::jsonb, 'dma', 'بناء المفهوم', 'ما ترتيب بناء المفهوم الرياضي عند متعلم الابتدائي؟', '["محسوس ثم شبه محسوس ثم مجرد", "مجرد ثم محسوس", "رموز ثم أشياء", "قاعدة ثم أمثلة"]'::jsonb, 'محسوس ثم شبه محسوس ثم مجرد', 'يمر المتعلم من المانيبولاسيون إلى الرسم ثم الرموز.'),
('dma2', '["primary"]'::jsonb, 'dma', 'تحليل الأخطاء', 'كتب متعلم 0,5 < 0,12 «لأن 12 أكبر من 5». ما مصدر خطئه؟', '["معاملة الجزء العشري كعدد صحيح", "خطأ في الحساب الذهني", "سهو عابر", "نسيان الجدول"]'::jsonb, 'معاملة الجزء العشري كعدد صحيح', 'العلاج: جدول القيمة الموضعية والمستقيم المدرج.'),

('dfr1', '["primary"]'::jsonb, 'dfr', 'Grammaire', 'La démarche inductive en grammaire consiste à :', '["partir d’exemples pour dégager la règle", "donner la règle puis les exercices", "faire copier la règle", "interroger sur la règle apprise"]'::jsonb, 'partir d’exemples pour dégager la règle', 'Observation d’un corpus, manipulation, règle, application.'),
('dfr2', '["primary"]'::jsonb, 'dfr', 'Remédiation', 'Pour traiter la confusion « ces / ses », l’activité la plus adaptée est :', '["la substitution (ses → mes ; ces → ceux-ci)", "recopier la règle 50 fois", "une dictée sans correction", "apprendre les deux mots par cœur"]'::jsonb, 'la substitution (ses → mes ; ces → ceux-ci)', 'La manipulation par substitution donne un critère de choix.'),

('dar1', '["primary"]'::jsonb, 'dar', 'القواعد', 'المقاربة المعتمدة في درس القواعد بالابتدائي:', '["استقرائية: من الأمثلة إلى القاعدة", "إملاء القاعدة ثم التطبيق", "حفظ القاعدة قبل الأمثلة", "الشرح النظري فقط"]'::jsonb, 'استقرائية: من الأمثلة إلى القاعدة', 'ينطلق من نص أو أمثلة ثم يستخرج المتعلمون القاعدة.'),
('dar2', '["primary"]'::jsonb, 'dar', 'القراءة', 'تأتي القراءة الجهرية في درس القراءة:', '["بعد القراءة الصامتة والفهم", "قبل أي ملاحظة للنص", "بدلا من الفهم", "في نهاية الأسبوع فقط"]'::jsonb, 'بعد القراءة الصامتة والفهم', 'تسبقها الملاحظة والقراءة الصامتة وأسئلة الفهم.'),

('dsc1', '["primary"]'::jsonb, 'dsc', 'الاستقصاء', 'ما ترتيب مراحل مقاربة الاستقصاء؟', '["وضعية وتساؤل، فرضيات، تجريب، استنتاج", "استنتاج، تجريب، فرضيات", "درس نظري ثم تطبيق", "حفظ ثم اختبار"]'::jsonb, 'وضعية وتساؤل، فرضيات، تجريب، استنتاج', 'تنطلق من تساؤل وتنتهي بخلاصة وتعميم.'),
('dsc2', '["primary"]'::jsonb, 'dsc', 'التمثلات', 'أي مما يلي تمثل خاطئ شائع لدى المتعلمين؟', '["الفصول تنتج عن قرب الأرض من الشمس", "الأرض تدور حول الشمس", "للقمر أطوار", "الأرض كروية"]'::jsonb, 'الفصول تنتج عن قرب الأرض من الشمس', 'سبب الفصول هو ميلان محور الأرض.'),

-- أسئلة علوم التربية (مشتركة للجميع)
('edu1', '["primary", "secondary_prep", "secondary_qual"]'::jsonb, 'edu', 'نظريات التعلم', 'من صاحب مفهوم «منطقة النمو القريبة»؟', '["فيجوتسكي", "بياجي", "سكينر", "بلوم"]'::jsonb, 'فيجوتسكي', 'فيجوتسكي: الفرق بين ما يفعله المتعلم وحده وبمساعدة.'),
('edu2', '["primary", "secondary_prep", "secondary_qual"]'::jsonb, 'edu', 'التقويم', 'التقويم الذي يُنجز قبل التعلم الجديد لكشف المكتسبات والتمثلات:', '["التشخيصي", "التكويني", "الإجمالي", "الإشهادي"]'::jsonb, 'التشخيصي', 'التشخيصي قبل، والتكويني أثناء، والإجمالي بعد.'),
('edu3', '["primary", "secondary_prep", "secondary_qual"]'::jsonb, 'edu', 'تصنيف بلوم', 'يتدرج التصنيف المعرفي الأصلي لبلوم من:', '["المعرفة إلى التقويم", "التقويم إلى المعرفة", "الفهم إلى التذكر", "التطبيق إلى التحليل فقط"]'::jsonb, 'المعرفة إلى التقويم', 'معرفة، فهم، تطبيق، تحليل، تركيب، تقويم.'),
('edu4', '["primary", "secondary_prep", "secondary_qual"]'::jsonb, 'edu', 'الإصلاح التربوي', 'ركيزتا مدرسة الريادة:', '["التعلم وفق المستوى الملائم والتدريس الصريح", "الاستقصاء والمشروع", "التعلم الذاتي والتقويم الإشهادي", "اللغات والرقمنة"]'::jsonb, 'التعلم وفق المستوى الملائم والتدريس الصريح', 'TaRL والتدريس الصريح.'),
('edu5', '["primary", "secondary_prep", "secondary_qual"]'::jsonb, 'edu', 'الديداكتيك والبيداغوجيا', 'المثلث الديداكتيكي يربط بين ثلاثة أقطاب رئيسية هي:', '["المدرس، والمتعلم، والمعرفة", "المدرس، والإدارة، والأسرة", "المنهاج، والكتاب المدرسي، والامتحان", "القسم، والسبورة، والزمن المدرسي"]'::jsonb, 'المدرس، والمتعلم، والمعرفة', 'الأقطاب الثلاثة للمثلث الديداكتيكي هي: المدرس، المتعلم، والمعرفة.'),

-- أسئلة الثانوي
('sec_philo_1', '["secondary_qual"]'::jsonb, 'sec_philo', 'مجزوءة الوضع البشري', 'يرى ديكارت أن أساس هوية الشخص وثباتها يقوم على:', '["الفكر والوعي المقترن بالشك (الكوجيطو)", "الذاكرة والشعور الحسي المقترن بالزمن", "الإرادة ورغبة الحياة المستمرة", "التفاعل الاجتماعي والمظهر الخارجي"]'::jsonb, 'الفكر والوعي المقترن بالشك (الكوجيطو)', 'يقيم ديكارت هوية الشخص على جوهر التفكير (الكوجيطو).'),
('sec_d_philo_1', '["secondary_qual"]'::jsonb, 'sec_d_philo', 'الكفايات الفلسفية', 'الكفايات الثلاث الموجهة لتدريس الفلسفة بالتعليم الثانوي التأهيلي وفق التوجيهات الرسمية هي:', '["الأشكلة، المفهمة، والمحاجة", "الحفظ، الشرح، والتلخيص", "القراءة، الترجمة، والكتابة", "السرد، الوصف، والتحليل اللغوي"]'::jsonb, 'الأشكلة، المفهمة، والمحاجة', 'الديداكتيك الفلسفي في المنهاج المغربي يقوم على الأشكلة، المفهمة، والمحاجة.'),
('sec_math_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_math', 'التحليل الرياضي', 'ما هي نهاية الدالة f(x) = (sin x) / x عندما يؤول x إلى 0؟', '["1", "0", "غير معرفة", "+∞"]'::jsonb, '1', 'نهاية اعتيادية مشهورة ومبرهنة باستخدام تعريف العدد المشتق لدالة الجيب عند الصفر.'),
('sec_d_math_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_d_math', 'النقل الديداكتيكي', 'يُقصد بـ «النقل الديداكتيكي» عند إيف شيفالار (Yves Chevallard):', '["تحويل المعرفة العالمة إلى معرفة قابلة للتدريس", "نقل التلميذ من مستوى دراسي إلى آخر", "تبسيط المفاهيم بحذف القواعد المعقدة", "استعمال الوسائل الرقمية في تدريس الرياضيات"]'::jsonb, 'تحويل المعرفة العالمة إلى معرفة قابلة للتدريس', 'النقل الديداكتيكي هو تحويل المعرفة العالمة إلى معرفة مدرسة تتناسب مع المتعلم.'),
('sec_physics_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_physics', 'الميكانيك وقوانين نيوتن', 'وفق القانون الثاني لنيوتن، في معلم غاليلي، يتناسب التسارع الذي يكتسبه جسم صلب طرداً مع:', '["مجموع القوى الخارجية المطبقة عليه وعكساً مع كتلته", "كتلته فقط بغض النظر عن القوى", "سرعته البدئية مقسومة على الزمن", "طاقته الحركية فقط"]'::jsonb, 'مجموع القوى الخارجية المطبقة عليه وعكساً مع كتلته', 'العلاقة الأساسية للتحريك: Σ F_ext = m * a.'),
('sec_svt_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_svt', 'علم الوراثة والتعبير الجيني', 'تتم عملية الترجمة (Traduction) في الخلية حقيقية النواة على مستوى:', '["السيتوبلازم (الهيولى) بواسطة الريبوزومات", "النواة داخل النوية", "الغشاء السيتوبلازمي مباشرة", "داخل الميتوكندري فقط"]'::jsonb, 'السيتوبلازم (الهيولى) بواسطة الريبوزومات', 'تتم الترجمة في السيتوبلازم عبر الريبوزومات لتركيب البروتين.'),
('sec_ar_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_ar', 'البلاغة والنقد', 'في علم البلاغة، الفرق الجوهري بين الاستعارة والتشبيه البليغ هو:', '["حذف أحد طرفي التشبيه الأساسيين (المشبه أو المشبه به)", "وجود أداة التشبيه دائماً في الاستعارة", "حذف وجه الشبه فقط دون المشبه به", "عدم وجود علاقة المشابهة بين اللفظين"]'::jsonb, 'حذف أحد طرفي التشبيه الأساسيين (المشبه أو المشبه به)', 'الاستعارة هي في الأصل تشبيه حُذف أحد طرفيه.'),
('sec_fr_1', '["secondary_prep", "secondary_qual"]'::jsonb, 'sec_fr', 'Littérature et Narratologie', 'La focalisation interne dans un récit signifie que :', '["Les événements sont perçus et racontés à travers le regard et la conscience d’un personnage précis", "Le narrateur en sait plus que tous les personnages (narrateur omniscient)", "Le narrateur est un témoin neutre extérieur qui en sait moins que les personnages", "L''histoire est racontée uniquement sous forme de dialogues"]'::jsonb, 'Les événements sont perçus et racontés à travers le regard et la conscience d’un personnage précis', 'Focalisation interne = Narrateur = Personnage (vision avec).')
on conflict (id) do update set
    cycles = excluded.cycles,
    subject = excluded.subject,
    topic = excluded.topic,
    question = excluded.question,
    options = excluded.options,
    correct_answer = excluded.correct_answer,
    explanation = excluded.explanation;
