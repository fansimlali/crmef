import type { Question } from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  // ==========================================
  // أسئلة الابتدائي الأساسية
  // ==========================================
  {
    id: "ma1",
    cycles: ["primary"],
    subject: "ma",
    topic: "قابلية القسمة",
    question: "أي الأعداد التالية يقبل القسمة على 9؟",
    options: ["7 218", "4 728", "3 612", "2 543"],
    correct_answer: "7 218",
    explanation: "7+2+1+8 = 18 وهو من مضاعفات 9."
  },
  {
    id: "ma2",
    cycles: ["primary"],
    subject: "ma",
    topic: "الكسور",
    question: "ما ناتج 2/3 + 1/4 ؟",
    options: ["11/12", "3/7", "3/12", "9/12"],
    correct_answer: "11/12",
    explanation: "نوحد المقامات: 8/12 + 3/12 = 11/12."
  },
  {
    id: "ma3",
    cycles: ["primary"],
    subject: "ma",
    topic: "الهندسة",
    question: "مثلث قائم طولا ضلعيه القائمين 6 سم و8 سم. ما طول وتره؟",
    options: ["10 سم", "14 سم", "12 سم", "100 سم"],
    correct_answer: "10 سم",
    explanation: "فيثاغورس: 36 + 64 = 100، والجذر التربيعي 10."
  },
  {
    id: "ma4",
    cycles: ["primary"],
    subject: "ma",
    topic: "التناسبية",
    question: "ثمن 5 كراسات 35 درهما. ما ثمن 8 كراسات بالسعر نفسه؟",
    options: ["56 درهما", "48 درهما", "60 درهما", "40 درهما"],
    correct_answer: "56 درهما",
    explanation: "ثمن الكراس 7 دراهم، و7 × 8 = 56."
  },
  {
    id: "fr1",
    cycles: ["primary"],
    subject: "fr",
    topic: "Conjugaison",
    question: "Hier, nous ____ au marché. (aller, passé composé)",
    options: ["sommes allés", "avons allé", "allions", "irons"],
    correct_answer: "sommes allés",
    explanation: "Aller se conjugue avec l’auxiliaire être : nous sommes allés."
  },
  {
    id: "fr2",
    cycles: ["primary"],
    subject: "fr",
    topic: "Orthographe",
    question: "Il ____ lavé les mains.",
    options: ["s’est", "c’est", "ces", "ses"],
    correct_answer: "s’est",
    explanation: "Verbe pronominal au passé composé : il s’est lavé."
  },
  {
    id: "fr3",
    cycles: ["primary"],
    subject: "fr",
    topic: "Grammaire",
    question: "Dans « Le chat mange la souris », « la souris » est :",
    options: ["COD", "sujet", "COI", "attribut du sujet"],
    correct_answer: "COD",
    explanation: "On pose la question : le chat mange quoi ? → la souris (COD)."
  },
  {
    id: "ar1",
    cycles: ["primary"],
    subject: "ar",
    topic: "النحو",
    question: "في جملة «إنَّ العلمَ نورٌ» إعراب كلمة «العلمَ»:",
    options: ["اسم إنّ منصوب", "خبر إنّ مرفوع", "مبتدأ مرفوع", "فاعل مرفوع"],
    correct_answer: "اسم إنّ منصوب",
    explanation: "إنّ تنصب المبتدأ ويسمى اسمها."
  },
  {
    id: "ar2",
    cycles: ["primary"],
    subject: "ar",
    topic: "الصرف",
    question: "اسم الفاعل من الفعل «كتب» هو:",
    options: ["كاتب", "مكتوب", "كتّاب", "مكتبة"],
    correct_answer: "كاتب",
    explanation: "اسم الفاعل من الثلاثي على وزن فاعل."
  },
  {
    id: "ar3",
    cycles: ["primary"],
    subject: "ar",
    topic: "الإملاء",
    question: "أي كلمة كتبت همزتها كتابة صحيحة؟",
    options: ["سؤال", "سوأل", "سئال", "سُأال"],
    correct_answer: "سؤال",
    explanation: "الهمزة المضمومة بعد فتحة تكتب على الواو."
  },
  {
    id: "sc1",
    cycles: ["primary"],
    subject: "sc",
    topic: "الأرض والكون",
    question: "سبب تعاقب الليل والنهار هو:",
    options: ["دوران الأرض حول نفسها", "دوران الأرض حول الشمس", "ميلان محور الأرض فقط", "دوران القمر حول الأرض"],
    correct_answer: "دوران الأرض حول نفسها",
    explanation: "الأرض تدور حول محورها دورة كل 24 ساعة."
  },
  {
    id: "sc2",
    cycles: ["primary"],
    subject: "sc",
    topic: "جسم الإنسان",
    question: "أين يتم امتصاص معظم الغذاء المهضوم؟",
    options: ["الأمعاء الدقيقة", "المعدة", "الأمعاء الغليظة", "المريء"],
    correct_answer: "الأمعاء الدقيقة",
    explanation: "جدار الأمعاء الدقيقة غني بالزغابات الماصة."
  },
  {
    id: "sc3",
    cycles: ["primary"],
    subject: "sc",
    topic: "الكهرباء",
    question: "مصباحان مركبان على التوازي، احترق أحدهما. ماذا يحدث للآخر؟",
    options: ["يستمر في الإضاءة", "ينطفئ", "ينفجر", "تنقطع الدارة كلها"],
    correct_answer: "يستمر في الإضاءة",
    explanation: "في التركيب على التوازي لكل مصباح فرع مستقل."
  },
  {
    id: "dma1",
    cycles: ["primary"],
    subject: "dma",
    topic: "بناء المفهوم",
    question: "ما ترتيب بناء المفهوم الرياضي عند متعلم الابتدائي؟",
    options: ["محسوس ثم شبه محسوس ثم مجرد", "مجرد ثم محسوس", "رموز ثم أشياء", "قاعدة ثم أمثلة"],
    correct_answer: "محسوس ثم شبه محسوس ثم مجرد",
    explanation: "يمر المتعلم من المانيبولاسيون إلى الرسم ثم الرموز."
  },
  {
    id: "dma2",
    cycles: ["primary"],
    subject: "dma",
    topic: "تحليل الأخطاء",
    question: "كتب متعلم 0,5 < 0,12 «لأن 12 أكبر من 5». ما مصدر خطئه؟",
    options: ["معاملة الجزء العشري كعدد صحيح", "خطأ في الحساب الذهني", "سهو عابر", "نسيان الجدول"],
    correct_answer: "معاملة الجزء العشري كعدد صحيح",
    explanation: "العلاج: جدول القيمة الموضعية والمستقيم المدرج."
  },
  {
    id: "dfr1",
    cycles: ["primary"],
    subject: "dfr",
    topic: "Grammaire",
    question: "La démarche inductive en grammaire consiste à :",
    options: ["partir d’exemples pour dégager la règle", "donner la règle puis les exercices", "faire copier la règle", "interroger sur la règle apprise"],
    correct_answer: "partir d’exemples pour dégager la règle",
    explanation: "Observation d’un corpus, manipulation, règle, application."
  },
  {
    id: "dfr2",
    cycles: ["primary"],
    subject: "dfr",
    topic: "Remédiation",
    question: "Pour traiter la confusion « ces / ses », l’activité la plus adaptée est :",
    options: ["la substitution (ses → mes ; ces → ceux-ci)", "recopier la règle 50 fois", "une dictée sans correction", "apprendre les deux mots par cœur"],
    correct_answer: "la substitution (ses → mes ; ces → ceux-ci)",
    explanation: "La manipulation par substitution donne un critère de choix."
  },
  {
    id: "dar1",
    cycles: ["primary"],
    subject: "dar",
    topic: "القواعد",
    question: "المقاربة المعتمدة في درس القواعد بالابتدائي:",
    options: ["استقرائية: من الأمثلة إلى القاعدة", "إملاء القاعدة ثم التطبيق", "حفظ القاعدة قبل الأمثلة", "الشرح النظري فقط"],
    correct_answer: "استقرائية: من الأمثلة إلى القاعدة",
    explanation: "ينطلق من نص أو أمثلة ثم يستخرج المتعلمون القاعدة."
  },
  {
    id: "dar2",
    cycles: ["primary"],
    subject: "dar",
    topic: "القراءة",
    question: "تأتي القراءة الجهرية في درس القراءة:",
    options: ["بعد القراءة الصامتة والفهم", "قبل أي ملاحظة للنص", "بدلا من الفهم", "في نهاية الأسبوع فقط"],
    correct_answer: "بعد القراءة الصامتة والفهم",
    explanation: "تسبقها الملاحظة والقراءة الصامتة وأسئلة الفهم."
  },
  {
    id: "dsc1",
    cycles: ["primary"],
    subject: "dsc",
    topic: "الاستقصاء",
    question: "ما ترتيب مراحل مقاربة الاستقصاء؟",
    options: ["وضعية وتساؤل، فرضيات، تجريب، استنتاج", "استنتاج، تجريب، فرضيات", "درس نظري ثم تطبيق", "حفظ ثم اختبار"],
    correct_answer: "وضعية وتساؤل، فرضيات، تجريب، استنتاج",
    explanation: "تنطلق من تساؤل وتنتهي بخلاصة وتعميم."
  },
  {
    id: "dsc2",
    cycles: ["primary"],
    subject: "dsc",
    topic: "التمثلات",
    question: "أي مما يلي تمثل خاطئ شائع لدى المتعلمين؟",
    options: ["الفصول تنتج عن قرب الأرض من الشمس", "الأرض تدور حول الشمس", "للقمر أطوار", "الأرض كروية"],
    correct_answer: "الفصول تنتج عن قرب الأرض من الشمس",
    explanation: "سبب الفصول هو ميلان محور الأرض."
  },

  // ==========================================
  // علوم التربية (مشتركة لجميع الأسلاك)
  // ==========================================
  {
    id: "edu1",
    cycles: ["primary", "secondary_prep", "secondary_qual"],
    subject: "edu",
    topic: "نظريات التعلم",
    question: "من صاحب مفهوم «منطقة النمو القريبة» (Zone Proximale de Développement)؟",
    options: ["فيجوتسكي", "بياجي", "سكينر", "بلوم"],
    correct_answer: "فيجوتسكي",
    explanation: "فيجوتسكي: الفارق بين ما ينجزه المتعلم بمفرده وما ينجزه بتوجيه ودعم الراشد أو الأقران."
  },
  {
    id: "edu2",
    cycles: ["primary", "secondary_prep", "secondary_qual"],
    subject: "edu",
    topic: "التقويم التربوي",
    question: "التقويم الذي يُنجز قبل انطلاق التعلم الجديد لكشف المكتسبات والتمثلات وتشخيص الصعوبات يسمى:",
    options: ["التقويم التشخيصي", "التقويم التكويني", "التقويم الإجمالي", "التقويم الإشهادي"],
    correct_answer: "التقويم التشخيصي",
    explanation: "التشخيصي في البداية لتحديد المنطلق، التكويني لمواكبة التعلمات، والإجمالي لقياس الحصيلة النهائية."
  },
  {
    id: "edu3",
    cycles: ["primary", "secondary_prep", "secondary_qual"],
    subject: "edu",
    topic: "الصنافات التربوية",
    question: "يتدرج التصنيف المعرفي الأصلي لبلوم (Bloom Taxonomy) من المستويات الدنيا إلى العليا كالتالي:",
    options: ["المعرفة، الفهم، التطبيق، التحليل، التركيب، التقويم", "التقويم، التركيب، التحليل، التطبيق، الفهم، المعرفة", "الفهم، التذكر، التحليل، التقويم فقط", "المعرفة، التحليل، التطبيق فقط"],
    correct_answer: "المعرفة، الفهم، التطبيق، التحليل، التركيب، التقويم",
    explanation: "التدرج الهرمي ينطلق من استرجاع المعرفة البسيطة وصولاً إلى أعلى درجات التفكير النقدي والتقويم."
  },
  {
    id: "edu4",
    cycles: ["primary", "secondary_prep", "secondary_qual"],
    subject: "edu",
    topic: "مستجدات المنظومة وإصلاح التربية",
    question: "يقوم نموذج «مؤسسات الريادة» بالمغرب أساساً على مقاربتين بيداغوجيتين مركزيتين هما:",
    options: ["التعليم الصريح (Explicit Teaching) والتدريس وفق المستوى المناسب (TaRL)", "التعلم الذاتي غير الموجه والبيداغوجيا الفارقية فقط", "بيداغوجيا المشروع والتقويم الإشهادي السنوي", "التعلم عن بعد والبرمجة الرقمية فقط"],
    correct_answer: "التعليم الصريح (Explicit Teaching) والتدريس وفق المستوى المناسب (TaRL)",
    explanation: "يرتكز النموذج الوطني لمؤسسات الريادة على التدريس الصريح لتفادي الهدر المعرفي ودعم TaRL لمعالجة التعثرات الأساسية."
  },
  {
    id: "edu5",
    cycles: ["primary", "secondary_prep", "secondary_qual"],
    subject: "edu",
    topic: "الديداكتيك والبيداغوجيا",
    question: "المثلث الديداكتيكي يربط بين ثلاثة أقطاب رئيسية هي:",
    options: ["المدرس، والمتعلم، والمعرفة", "المدرس، والإدارة، والأسرة", "المنهاج، والكتاب المدرسي، والامتحان", "القسم، والسبورة، والزمن المدرسي"],
    correct_answer: "المدرس، والمتعلم، والمعرفة",
    explanation: "الأقطاب الثلاثة للمثلث الديداكتيكي هي: القطب البيداغوجي (المدرس-المتعلم)، القطب الإبستيمولوجي (المدرس-المعرفة)، والقطب السيكولوجي (المتعلم-المعرفة)."
  },

  // ==========================================
  // أسئلة الثانوي التأهيلي والإعدادي (نماذج تخصص وديداكتيك)
  // ==========================================
  {
    id: "sec_philo_1",
    cycles: ["secondary_qual"],
    subject: "sec_philo",
    topic: "مجزوءة الوضع البشري",
    question: "يرى ديكارت أن أساس هوية الشخص وثباتها يقوم على:",
    options: ["الفكر والوعي المقترن بالشك (الكوجيطو)", "الذاكرة والشعور الحسي المقترن بالزمن", "الإرادة ورغبة الحياة المستمرة", "التفاعل الاجتماعي والمظهر الخارجي"],
    correct_answer: "الفكر والوعي المقترن بالشك (الكوجيطو)",
    explanation: "يقيم ديكارت هوية الشخص على جوهر التفكير (أنا أفكر إذن أنا موجود)، بينما أسسها جون لوك على الذاكرة وشوبنهاور على الإرادة."
  },
  {
    id: "sec_d_philo_1",
    cycles: ["secondary_qual"],
    subject: "sec_d_philo",
    topic: "الكفايات الفلسفية",
    question: "الكفايات الثلاث الموجهة لتدريس الفلسفة بالتعليم الثانوي التأهيلي وفق التوجيهات التربوية الرسمية هي:",
    options: ["الأشكلة، المفهمة، والمحاجة", "الحفظ، الشرح، والتلخيص", "القراءة، الترجمة، والكتابة", "السرد، الوصف، والتحليل اللغوي"],
    correct_answer: "الأشكلة، المفهمة، والمحاجة",
    explanation: "الديداكتيك الفلسفي في المنهاج المغربي يقوم على تفكيك الإشكال (الأشكلة)، بناء المفهوم (المفهمة)، وبناء الاستدلال والدفاع عن الأطروحة (المحاجة)."
  },
  {
    id: "sec_math_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل الرياضي (Analyse)",
    question: "ما هي نهاية الدالة f(x) = (sin x) / x عندما يؤول x إلى 0؟",
    options: ["1", "0", "غير معرفة", "+∞"],
    correct_answer: "1",
    explanation: "lim (sin x / x) عندما x -> 0 تساوي 1، وهي نهاية اعتيادية مشهورة ومبرهنة باستخدام تعريف العدد المشتق لدالة الجيب عند الصفر."
  },
  {
    id: "sec_d_math_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_d_math",
    topic: "النقل الديداكتيكي (Transposition Didactique)",
    question: "يُقصد بـ «النقل الديداكتيكي» عند إيف شيفالار (Yves Chevallard):",
    options: ["تحويل المعرفة العالمة (Savoir savant) إلى معرفة قابلة للتدريس (Savoir à enseigner)", "نقل التلميذ من مستوى دراسي إلى آخر", "تبسيط المفاهيم بحذف القواعد المعقدة", "استعمال الوسائل الرقمية في تدريس الرياضيات"],
    correct_answer: "تحويل المعرفة العالمة (Savoir savant) إلى معرفة قابلة للتدريس (Savoir à enseigner)",
    explanation: "النقل الديداكتيكي هو المسار الذي تقطعه المعرفة العالمة لتتحول إلى معرفة مدرسة تتناسب مع الخصوصيات السيكولوجية للمتعلمين والمستوى الدراسي."
  },
  {
    id: "sec_physics_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_physics",
    topic: "الميكانيك وقوانين نيوتن",
    question: "وفق القانون الثاني لنيوتن، في معلم غاليلي، يتناسب التسارع الذي يكتسبه جسم صلب طرداً مع:",
    options: ["مجموع القوى الخارجية المطبقة عليه وعكساً مع كتلته", "كتلته فقط بغض النظر عن القوى", "سرعته البدئية مقسومة على الزمن", "طاقته الحركية فقط"],
    correct_answer: "مجموع القوى الخارجية المطبقة عليه وعكساً مع كتلته",
    explanation: "العلاقة الأساسية للتحريك: Σ F_ext = m * a، وبالتالي المتجهة a = (Σ F_ext) / m."
  },
  {
    id: "sec_svt_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_svt",
    topic: "علم الوراثة والتعبير الجيني",
    question: "تتم عملية الترجمة (Traduction) في الخلية حقيقية النواة على مستوى:",
    options: ["السيتوبلازم (الهيولى) بواسطة الريبوزومات", "النواة داخل النوية", "الغشاء السيتوبلازمي مباشرة", "داخل الميتوكندري فقط"],
    correct_answer: "السيتوبلازم (الهيولى) بواسطة الريبوزومات",
    explanation: "عملية النسخ (Transcription) تجري في النواة لإنتاج ARNm، بينما تتم الترجمة في السيتوبلازم عبر الريبوزومات لتركيب البروتين."
  },
  {
    id: "sec_ar_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_ar",
    topic: "البلاغة والنقد",
    question: "في علم البلاغة، الفرق الجوهري بين الاستعارة والتشبيه البليغ هو:",
    options: ["حذف أحد طرفي التشبيه الأساسيين (المشبه أو المشبه به)", "وجود أداة التشبيه دائماً في الاستعارة", "حذف وجه الشبه فقط دون المشبه به", "عدم وجود علاقة المشابهة بين اللفظين"],
    correct_answer: "حذف أحد طرفي التشبيه الأساسيين (المشبه أو المشبه به)",
    explanation: "الاستعارة هي في الأصل تشبيه حُذف أحد طرفيه (المشبه في الاستعارة التصريحية، أو المشبه به مع ترك قرينة تدل عليه في المكنية)."
  },
  {
    id: "sec_fr_1",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature et Narratologie",
    question: "La focalisation interne dans un récit signifie que :",
    options: ["Les événements sont perçus et racontés à travers le regard et la conscience d’un personnage précis", "Le narrateur en sait plus que tous les personnages (narrateur omniscient)", "Le narrateur est un témoin neutre extérieur qui en sait moins que les personnages", "L'histoire est racontée uniquement sous forme de dialogues"],
    correct_answer: "Les événements sont perçus et racontés à travers le regard et la conscience d’un personnage précis",
    explanation: "Focalisation interne = Narrateur = Personnage (vision avec). La focalisation zéro correspond au narrateur omniscient, et la focalisation externe correspond à une vision du dehors."
  }
];
