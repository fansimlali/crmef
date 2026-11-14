-- ============================================================================
-- توحيد مواضيع بنك CRMEF الثانوي مع المجالات الفرعية الرسمية
-- المصدر: توصيفات المركز الوطني للامتحانات — دورة نونبر 2026.
-- المستوى (أ): تغيير topic فقط — المعاملات (20/12/8) ونتائج التصحيح لم تتغيّر.
-- التنفيذ آمن ومكرّر.
-- ============================================================================

-- sec_ar: «الأساليب» → «الشعر العربي»
UPDATE public.questions SET topic = 'الشعر العربي' WHERE subject = 'sec_ar' AND topic = 'الأساليب';
-- sec_ar: «الإملاء» → «فقه اللغة»
UPDATE public.questions SET topic = 'فقه اللغة' WHERE subject = 'sec_ar' AND topic = 'الإملاء';
-- sec_ar: «البلاغة» → «العروض والبلاغة»
UPDATE public.questions SET topic = 'العروض والبلاغة' WHERE subject = 'sec_ar' AND topic = 'البلاغة';
-- sec_ar: «البلاغة والنقد» → «العروض والبلاغة»
UPDATE public.questions SET topic = 'العروض والبلاغة' WHERE subject = 'sec_ar' AND topic = 'البلاغة والنقد';
-- sec_ar: «الصرف» → «الصرف والنحو»
UPDATE public.questions SET topic = 'الصرف والنحو' WHERE subject = 'sec_ar' AND topic = 'الصرف';
-- sec_ar: «الصرف والتحويل» → «الصرف والنحو»
UPDATE public.questions SET topic = 'الصرف والنحو' WHERE subject = 'sec_ar' AND topic = 'الصرف والتحويل';
-- sec_ar: «العروض والقافية» → «العروض والبلاغة»
UPDATE public.questions SET topic = 'العروض والبلاغة' WHERE subject = 'sec_ar' AND topic = 'العروض والقافية';
-- sec_ar: «المعجم والدلالة» → «المعجم»
UPDATE public.questions SET topic = 'المعجم' WHERE subject = 'sec_ar' AND topic = 'المعجم والدلالة';
-- sec_ar: «النحو والإعراب» → «الصرف والنحو»
UPDATE public.questions SET topic = 'الصرف والنحو' WHERE subject = 'sec_ar' AND topic = 'النحو والإعراب';
-- sec_ar: «النقد الأدبي والمناهج النقدية» → «الشعر العربي»
UPDATE public.questions SET topic = 'الشعر العربي' WHERE subject = 'sec_ar' AND topic = 'النقد الأدبي والمناهج النقدية';
-- sec_ar: «تاريخ الأدب والنصوص» → «الشعر العربي»
UPDATE public.questions SET topic = 'الشعر العربي' WHERE subject = 'sec_ar' AND topic = 'تاريخ الأدب والنصوص';

-- sec_cs: «أخلاقيات المعلوميات والملكية الفكرية» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'أخلاقيات المعلوميات والملكية الفكرية';
-- sec_cs: «أمن المعلومات» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'أمن المعلومات';
-- sec_cs: «أمن المعلومات والهجمات السيبرانية» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'أمن المعلومات والهجمات السيبرانية';
-- sec_cs: «أمن المعلومات والهندسة الاجتماعية» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'أمن المعلومات والهندسة الاجتماعية';
-- sec_cs: «أمن المعلومات وجدران الحماية» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'أمن المعلومات وجدران الحماية';
-- sec_cs: «إدارة الذاكرة في لغة C» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'إدارة الذاكرة في لغة C';
-- sec_cs: «إدارة الذاكرة وتفادي التسرب» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'إدارة الذاكرة وتفادي التسرب';
-- sec_cs: «اختبار البرمجيات (Software Testing)» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'اختبار البرمجيات (Software Testing)';
-- sec_cs: «الأرقام والترميز النصي» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'الأرقام والترميز النصي';
-- sec_cs: «الأمن المعلوماتي» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'الأمن المعلوماتي';
-- sec_cs: «الأنظمة المدمجة وإنترنت الأشياء (IoT)» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'الأنظمة المدمجة وإنترنت الأشياء (IoT)';
-- sec_cs: «البرمجة التزامنية والمتوازية» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجة التزامنية والمتوازية';
-- sec_cs: «البرمجة الوظيفية والتوابع المجهولة» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجة الوظيفية والتوابع المجهولة';
-- sec_cs: «البرمجة بلغة C/C++» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجة بلغة C/C++';
-- sec_cs: «البرمجة بلغة بايثون» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجة بلغة بايثون';
-- sec_cs: «البرمجة كائنية التوجه (OOP)» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجة كائنية التوجه (OOP)';
-- sec_cs: «البرمجيات الحرة والمصادر المفتوحة» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجيات الحرة والمصادر المفتوحة';
-- sec_cs: «البرمجيات المكتبية» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'البرمجيات المكتبية';
-- sec_cs: «التمثيل الثنائي» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'التمثيل الثنائي';
-- sec_cs: «الحاسوب» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'الحاسوب';
-- sec_cs: «الحوسبة السحابية (Cloud Computing)» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'الحوسبة السحابية (Cloud Computing)';
-- sec_cs: «الخوارزميات» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'الخوارزميات';
-- sec_cs: «الخوارزميات والبرمجة» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'الخوارزميات والبرمجة';
-- sec_cs: «الخوارزميات والبرمجة التراجعية» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'الخوارزميات والبرمجة التراجعية';
-- sec_cs: «الذكاء الاصطناعي وتعلم الآلة» → «Intelligence artificielle»
UPDATE public.questions SET topic = 'Intelligence artificielle' WHERE subject = 'sec_cs' AND topic = 'الذكاء الاصطناعي وتعلم الآلة';
-- sec_cs: «الشبكات» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'الشبكات';
-- sec_cs: «الشبكات والطبقة الثانية» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'الشبكات والطبقة الثانية';
-- sec_cs: «الشبكات والنموذج المعماري» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'الشبكات والنموذج المعماري';
-- sec_cs: «الشبكات وبروتوكول التوجيه» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'الشبكات وبروتوكول التوجيه';
-- sec_cs: «الملفات» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'الملفات';
-- sec_cs: «المنطق والعمليات الثنائية» → «Sécurité informatique»
UPDATE public.questions SET topic = 'Sécurité informatique' WHERE subject = 'sec_cs' AND topic = 'المنطق والعمليات الثنائية';
-- sec_cs: «النمذجة بلغة UML» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'النمذجة بلغة UML';
-- sec_cs: «الويب» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'الويب';
-- sec_cs: «بنية الحاسوب والمنطق الرقمي» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'بنية الحاسوب والمنطق الرقمي';
-- sec_cs: «بنية المعطيات» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'بنية المعطيات';
-- sec_cs: «بنية المعطيات والأشجار» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'بنية المعطيات والأشجار';
-- sec_cs: «بنية المعطيات والجداول المجزأة» → «Bases de données»
UPDATE public.questions SET topic = 'Bases de données' WHERE subject = 'sec_cs' AND topic = 'بنية المعطيات والجداول المجزأة';
-- sec_cs: «بنية المعطيات والرسوم البيانية (Graphs)» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'بنية المعطيات والرسوم البيانية (Graphs)';
-- sec_cs: «تطوير البرمجيات وهندسة النظم» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تطوير البرمجيات وهندسة النظم';
-- sec_cs: «تطوير الويب» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تطوير الويب';
-- sec_cs: «تطوير الويب وتقنيات الواجهة» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تطوير الويب وتقنيات الواجهة';
-- sec_cs: «تطوير الويب وواجهات البرمجة» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تطوير الويب وواجهات البرمجة';
-- sec_cs: «تنسيق الويب CSS» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تنسيق الويب CSS';
-- sec_cs: «تنسيق الويب والتجاوب» → «Algorithmique et programmation»
UPDATE public.questions SET topic = 'Algorithmique et programmation' WHERE subject = 'sec_cs' AND topic = 'تنسيق الويب والتجاوب';
-- sec_cs: «خوارزميات الترتيب والفرز» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'خوارزميات الترتيب والفرز';
-- sec_cs: «ديداكتيك المعلوميات» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'ديداكتيك المعلوميات';
-- sec_cs: «ديداكتيك المعلوميات والمشاريع» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'ديداكتيك المعلوميات والمشاريع';
-- sec_cs: «ديداكتيك المعلوميات ومحاكاة الروبوتات» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'ديداكتيك المعلوميات ومحاكاة الروبوتات';
-- sec_cs: «ديداكتيك المعلوميات ومفهوم التحويل الرقمي» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'ديداكتيك المعلوميات ومفهوم التحويل الرقمي';
-- sec_cs: «شبكات الحاسوب» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'شبكات الحاسوب';
-- sec_cs: «شبكات الحاسوب وبروتوكول DHCP» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'شبكات الحاسوب وبروتوكول DHCP';
-- sec_cs: «شبكات الحاسوب وبروتوكول DNS» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'شبكات الحاسوب وبروتوكول DNS';
-- sec_cs: «شبكات الحاسوب وعناوين IP» → «Réseaux»
UPDATE public.questions SET topic = 'Réseaux' WHERE subject = 'sec_cs' AND topic = 'شبكات الحاسوب وعناوين IP';
-- sec_cs: «قواعد البيانات و SQL» → «Bases de données»
UPDATE public.questions SET topic = 'Bases de données' WHERE subject = 'sec_cs' AND topic = 'قواعد البيانات و SQL';
-- sec_cs: «قواعد البيانات والمعاملات ACID» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'قواعد البيانات والمعاملات ACID';
-- sec_cs: «نظم إدارة النسخ (Git)» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'نظم إدارة النسخ (Git)';
-- sec_cs: «نظم التشغيل» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'نظم التشغيل';
-- sec_cs: «نظم التشغيل والذاكرة المخبأة» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'نظم التشغيل والذاكرة المخبأة';
-- sec_cs: «نظم التشغيل وجدولة المعالج» → «Bases de données»
UPDATE public.questions SET topic = 'Bases de données' WHERE subject = 'sec_cs' AND topic = 'نظم التشغيل وجدولة المعالج';
-- sec_cs: «وحدات القياس» → «Fonctionnalité des systèmes»
UPDATE public.questions SET topic = 'Fonctionnalité des systèmes' WHERE subject = 'sec_cs' AND topic = 'وحدات القياس';

-- sec_eco: «الاقتصاد العام» → «Économie»
UPDATE public.questions SET topic = 'Économie' WHERE subject = 'sec_eco' AND topic = 'الاقتصاد العام';
-- sec_eco: «الاقتصاد الكلي» → «Macroéconomie»
UPDATE public.questions SET topic = 'Macroéconomie' WHERE subject = 'sec_eco' AND topic = 'الاقتصاد الكلي';
-- sec_eco: «التمويل والتسويق» → «Finance et marketing»
UPDATE public.questions SET topic = 'Finance et marketing' WHERE subject = 'sec_eco' AND topic = 'التمويل والتسويق';
-- sec_eco: «القانون والتدبير» → «Droit et management»
UPDATE public.questions SET topic = 'Droit et management' WHERE subject = 'sec_eco' AND topic = 'القانون والتدبير';
-- sec_eco: «المحاسبة» → «Comptabilité»
UPDATE public.questions SET topic = 'Comptabilité' WHERE subject = 'sec_eco' AND topic = 'المحاسبة';

-- sec_eng: «Articles & Determiners» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Articles & Determiners';
-- sec_eng: «Assessment in ELT» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'Assessment in ELT';
-- sec_eng: «Conditionals» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Conditionals';
-- sec_eng: «Discourse & Cohesion» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Discourse & Cohesion';
-- sec_eng: «Discourse Markers» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Discourse Markers';
-- sec_eng: «ELT & Classroom Management» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT & Classroom Management';
-- sec_eng: «ELT & Error Correction» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT & Error Correction';
-- sec_eng: «ELT Methodology & Lesson Planning» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT Methodology & Lesson Planning';
-- sec_eng: «ELT Methodology & PPP Framework» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT Methodology & PPP Framework';
-- sec_eng: «ELT Methodology & SLA» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT Methodology & SLA';
-- sec_eng: «ELT Methodology & Skills» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'ELT Methodology & Skills';
-- sec_eng: «Figures of Speech» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Figures of Speech';
-- sec_eng: «Gerunds & Infinitives» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Gerunds & Infinitives';
-- sec_eng: «Grammar» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar';
-- sec_eng: «Grammar & Causative Verbs» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Causative Verbs';
-- sec_eng: «Grammar & Cleft Sentences» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Cleft Sentences';
-- sec_eng: «Grammar & Conditionals» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Conditionals';
-- sec_eng: «Grammar & Inversion» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Inversion';
-- sec_eng: «Grammar & Modals» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Modals';
-- sec_eng: «Grammar & Participle Clauses» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Participle Clauses';
-- sec_eng: «Grammar & Passive Voice» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Passive Voice';
-- sec_eng: «Grammar & Prepositions» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Prepositions';
-- sec_eng: «Grammar & Quantifiers» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Quantifiers';
-- sec_eng: «Grammar & Question Tags» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Question Tags';
-- sec_eng: «Grammar & Subjunctive» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Subjunctive';
-- sec_eng: «Grammar & Subordination» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Subordination';
-- sec_eng: «Grammar & Unless» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Unless';
-- sec_eng: «Grammar & Used to» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Grammar & Used to';
-- sec_eng: «Idioms & Figurative Language» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Idioms & Figurative Language';
-- sec_eng: «Language Functions» → «Language Functions»
UPDATE public.questions SET topic = 'Language Functions' WHERE subject = 'sec_eng' AND topic = 'Language Functions';
-- sec_eng: «Linguistics & Phonology» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Linguistics & Phonology';
-- sec_eng: «Linguistics & Pragmatics» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Linguistics & Pragmatics';
-- sec_eng: «Linking Words & Concession» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Linking Words & Concession';
-- sec_eng: «Literature in English» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Literature in English';
-- sec_eng: «Modal Verbs» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Modal Verbs';
-- sec_eng: «Modals» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Modals';
-- sec_eng: «Morphology & Word Formation» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Morphology & Word Formation';
-- sec_eng: «Passive voice» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Passive voice';
-- sec_eng: «Phonetics & Pronunciation» → «Language and cultural awareness»
UPDATE public.questions SET topic = 'Language and cultural awareness' WHERE subject = 'sec_eng' AND topic = 'Phonetics & Pronunciation';
-- sec_eng: «Phrasal Verbs» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Phrasal Verbs';
-- sec_eng: «Phrasal verbs» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Phrasal verbs';
-- sec_eng: «Prepositions» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Prepositions';
-- sec_eng: «Questions» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Questions';
-- sec_eng: «Relative Clauses» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Relative Clauses';
-- sec_eng: «Relative clauses» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Relative clauses';
-- sec_eng: «Reported Speech» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Reported Speech';
-- sec_eng: «Reported speech» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Reported speech';
-- sec_eng: «SLA & Affective Filter» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'SLA & Affective Filter';
-- sec_eng: «SLA & Second Language Acquisition» → «Skills & Components (ديداكتيك اللغة الإنجليزية)»
UPDATE public.questions SET topic = 'Skills & Components (ديداكتيك اللغة الإنجليزية)' WHERE subject = 'sec_eng' AND topic = 'SLA & Second Language Acquisition';
-- sec_eng: «Tenses» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Tenses';
-- sec_eng: «Tenses & Aspect» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Tenses & Aspect';
-- sec_eng: «Vocabulary» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary';
-- sec_eng: «Vocabulary & Antonyms» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Antonyms';
-- sec_eng: «Vocabulary & Collocations» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Collocations';
-- sec_eng: «Vocabulary & False Friends» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & False Friends';
-- sec_eng: «Vocabulary & Idioms» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Idioms';
-- sec_eng: «Vocabulary & Prefixes» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Prefixes';
-- sec_eng: «Vocabulary & Suffixes» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Suffixes';
-- sec_eng: «Vocabulary & Synonyms» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Synonyms';
-- sec_eng: «Vocabulary & Word Choice» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_eng' AND topic = 'Vocabulary & Word Choice';
-- sec_eng: «Wishes & Regrets» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Wishes & Regrets';
-- sec_eng: «Word formation» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_eng' AND topic = 'Word formation';

-- sec_fr: «Accords» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Accords';
-- sec_fr: «Concordance des temps» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Concordance des temps';
-- sec_fr: «Conjugaison» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Conjugaison';
-- sec_fr: «Conjugaison et futur antérieur» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Conjugaison et futur antérieur';
-- sec_fr: «Conjugaison et passé simple» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Conjugaison et passé simple';
-- sec_fr: «Conjugaison et plus-que-parfait» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Conjugaison et plus-que-parfait';
-- sec_fr: «Conjugaison et subjonctif» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Conjugaison et subjonctif';
-- sec_fr: «Discours rapporté» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Discours rapporté';
-- sec_fr: «Enonciation et déixis» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Enonciation et déixis';
-- sec_fr: «Enonciation et modalisation» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Enonciation et modalisation';
-- sec_fr: «Figures de style» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Figures de style';
-- sec_fr: «Genres littéraires» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Genres littéraires';
-- sec_fr: «Grammaire» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire';
-- sec_fr: «Grammaire et conditionnelles» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et conditionnelles';
-- sec_fr: «Grammaire et infinitif» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et infinitif';
-- sec_fr: «Grammaire et négation» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et négation';
-- sec_fr: «Grammaire et pronoms» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et pronoms';
-- sec_fr: «Grammaire et propositions» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et propositions';
-- sec_fr: «Grammaire et syntaxe» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et syntaxe';
-- sec_fr: «Grammaire et types de phrases» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et types de phrases';
-- sec_fr: «Grammaire et voix passive» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et voix passive';
-- sec_fr: «Grammaire et voix pronominale» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Grammaire et voix pronominale';
-- sec_fr: «Lexique et sémantique» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_fr' AND topic = 'Lexique et sémantique';
-- sec_fr: «Littérature du Moyen Âge» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature du Moyen Âge';
-- sec_fr: «Littérature du XIXe siècle» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature du XIXe siècle';
-- sec_fr: «Littérature du XVIIe siècle» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature du XVIIe siècle';
-- sec_fr: «Littérature du XXe siècle» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature du XXe siècle';
-- sec_fr: «Littérature et mouvements» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature et mouvements';
-- sec_fr: «Littérature française» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature française';
-- sec_fr: «Littérature maghrébine» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature maghrébine';
-- sec_fr: «Littérature maghrébine d'expression française» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature maghrébine d''expression française';
-- sec_fr: «Littérature théâtrale» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Littérature théâtrale';
-- sec_fr: «Méthodologie de l'analyse littéraire» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Méthodologie de l''analyse littéraire';
-- sec_fr: «Orthographe d'usage» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe d''usage';
-- sec_fr: «Orthographe des adjectifs de couleur» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe des adjectifs de couleur';
-- sec_fr: «Orthographe des verbes pronominaux» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe des verbes pronominaux';
-- sec_fr: «Orthographe et homophones» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe et homophones';
-- sec_fr: «Orthographe et pluriel des noms composés» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Orthographe et pluriel des noms composés';
-- sec_fr: «Orthographe grammaticale» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe grammaticale';
-- sec_fr: «Orthographe lexicale et homophones» → «Phonétique / Phonologie»
UPDATE public.questions SET topic = 'Phonétique / Phonologie' WHERE subject = 'sec_fr' AND topic = 'Orthographe lexicale et homophones';
-- sec_fr: «Ponctuation» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Ponctuation';
-- sec_fr: «Poésie française de la Renaissance» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Poésie française de la Renaissance';
-- sec_fr: «Production écrite» → «Compétence communicative écrite»
UPDATE public.questions SET topic = 'Compétence communicative écrite' WHERE subject = 'sec_fr' AND topic = 'Production écrite';
-- sec_fr: «Propositions et phrase complexe» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Propositions et phrase complexe';
-- sec_fr: «Registres littéraires» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Registres littéraires';
-- sec_fr: «Stylistique et niveaux de langue» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'sec_fr' AND topic = 'Stylistique et niveaux de langue';
-- sec_fr: «Théorie littéraire et narratologie» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Théorie littéraire et narratologie';
-- sec_fr: «Versification française» → «Langue et textes littéraires»
UPDATE public.questions SET topic = 'Langue et textes littéraires' WHERE subject = 'sec_fr' AND topic = 'Versification française';
-- sec_fr: «Vocabulaire» → «Lexicographie»
UPDATE public.questions SET topic = 'Lexicographie' WHERE subject = 'sec_fr' AND topic = 'Vocabulaire';

-- sec_hist_geo: «التاريخ» → «تاريخ أوربا والعالم»
UPDATE public.questions SET topic = 'تاريخ أوربا والعالم' WHERE subject = 'sec_hist_geo' AND topic = 'التاريخ';
-- sec_hist_geo: «التاريخ العالمي» → «تاريخ العالم الإسلامي»
UPDATE public.questions SET topic = 'تاريخ العالم الإسلامي' WHERE subject = 'sec_hist_geo' AND topic = 'التاريخ العالمي';
-- sec_hist_geo: «الجغرافيا البشرية والاقتصادية» → «الجغرافيا البشرية والاقتصادية»
UPDATE public.questions SET topic = 'الجغرافيا البشرية والاقتصادية' WHERE subject = 'sec_hist_geo' AND topic = 'الجغرافيا البشرية والاقتصادية';
-- sec_hist_geo: «الجغرافيا الطبيعية» → «الجغرافيا الطبيعية»
UPDATE public.questions SET topic = 'الجغرافيا الطبيعية' WHERE subject = 'sec_hist_geo' AND topic = 'الجغرافيا الطبيعية';
-- sec_hist_geo: «المنهجية والخرائط» → «الجغرافيا الطبيعية»
UPDATE public.questions SET topic = 'الجغرافيا الطبيعية' WHERE subject = 'sec_hist_geo' AND topic = 'المنهجية والخرائط';
-- sec_hist_geo: «المواطنة والدستور» → «المواطنة والدستور»
UPDATE public.questions SET topic = 'المواطنة والدستور' WHERE subject = 'sec_hist_geo' AND topic = 'المواطنة والدستور';
-- sec_hist_geo: «تاريخ المغرب» → «تاريخ شمال إفريقيا والمغرب»
UPDATE public.questions SET topic = 'تاريخ شمال إفريقيا والمغرب' WHERE subject = 'sec_hist_geo' AND topic = 'تاريخ المغرب';
-- sec_hist_geo: «جغرافيا المغرب» → «الجغرافيا البشرية والاقتصادية»
UPDATE public.questions SET topic = 'الجغرافيا البشرية والاقتصادية' WHERE subject = 'sec_hist_geo' AND topic = 'جغرافيا المغرب';
-- sec_hist_geo: «جغرافيا عامة» → «الجغرافيا الطبيعية»
UPDATE public.questions SET topic = 'الجغرافيا الطبيعية' WHERE subject = 'sec_hist_geo' AND topic = 'جغرافيا عامة';

-- sec_islamic: «أخلاقيات مهنة التدريس في الإسلام» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'أخلاقيات مهنة التدريس في الإسلام';
-- sec_islamic: «أصول الفقه» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه';
-- sec_islamic: «أصول الفقه والنهي» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه والنهي';
-- sec_islamic: «أصول الفقه وتعارض الأدلة» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه وتعارض الأدلة';
-- sec_islamic: «أصول الفقه ودلالات الألفاظ» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه ودلالات الألفاظ';
-- sec_islamic: «أصول الفقه وقواعده» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه وقواعده';
-- sec_islamic: «أصول الفقه ومفهوم المخالفة» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه ومفهوم المخالفة';
-- sec_islamic: «أصول الفقه ومقاصد الشريعة» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'أصول الفقه ومقاصد الشريعة';
-- sec_islamic: «إمارة المؤمنين والوظيفة الشرعية» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'إمارة المؤمنين والوظيفة الشرعية';
-- sec_islamic: «الأخلاق» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'الأخلاق';
-- sec_islamic: «الأنبياء والرسل» → «السيرة النبوية»
UPDATE public.questions SET topic = 'السيرة النبوية' WHERE subject = 'sec_islamic' AND topic = 'الأنبياء والرسل';
-- sec_islamic: «الإعجاز القرآني ووجوهه» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'الإعجاز القرآني ووجوهه';
-- sec_islamic: «الاجتهاد والتجديد الفقهي» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'الاجتهاد والتجديد الفقهي';
-- sec_islamic: «التزكية والقيم والأخلاق» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'التزكية والقيم والأخلاق';
-- sec_islamic: «الثوابت الدينية والوطنية بالمغرب» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'الثوابت الدينية والوطنية بالمغرب';
-- sec_islamic: «الخلفاء الراشدون» → «الخلافة الراشدة»
UPDATE public.questions SET topic = 'الخلافة الراشدة' WHERE subject = 'sec_islamic' AND topic = 'الخلفاء الراشدون';
-- sec_islamic: «السيرة النبوية» → «السيرة النبوية»
UPDATE public.questions SET topic = 'السيرة النبوية' WHERE subject = 'sec_islamic' AND topic = 'السيرة النبوية';
-- sec_islamic: «السيرة النبوية والشمائل» → «السيرة النبوية»
UPDATE public.questions SET topic = 'السيرة النبوية' WHERE subject = 'sec_islamic' AND topic = 'السيرة النبوية والشمائل';
-- sec_islamic: «السيرة النبوية وحجة الوداع» → «السيرة النبوية»
UPDATE public.questions SET topic = 'السيرة النبوية' WHERE subject = 'sec_islamic' AND topic = 'السيرة النبوية وحجة الوداع';
-- sec_islamic: «العبادات» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'العبادات';
-- sec_islamic: «العقيدة الإسلامية وقضايا الفكر» → «العقيدة الإسلامية»
UPDATE public.questions SET topic = 'العقيدة الإسلامية' WHERE subject = 'sec_islamic' AND topic = 'العقيدة الإسلامية وقضايا الفكر';
-- sec_islamic: «الفكر الإسلامي وحوار الحضارات» → «الفكر الإسلامي وثقافة الحوار الحضاري»
UPDATE public.questions SET topic = 'الفكر الإسلامي وثقافة الحوار الحضاري' WHERE subject = 'sec_islamic' AND topic = 'الفكر الإسلامي وحوار الحضارات';
-- sec_islamic: «القرآن الكريم» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'القرآن الكريم';
-- sec_islamic: «القراءات القرآنية بالمغرب» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'القراءات القرآنية بالمغرب';
-- sec_islamic: «تاريخ الإسلام والخلافة الراشدة» → «الخلافة الراشدة»
UPDATE public.questions SET topic = 'الخلافة الراشدة' WHERE subject = 'sec_islamic' AND topic = 'تاريخ الإسلام والخلافة الراشدة';
-- sec_islamic: «تاريخ التشريع والمذاهب الفقهية» → «تاريخ التشريع»
UPDATE public.questions SET topic = 'تاريخ التشريع' WHERE subject = 'sec_islamic' AND topic = 'تاريخ التشريع والمذاهب الفقهية';
-- sec_islamic: «تاريخ التشريع وعمل أهل المدينة» → «تاريخ التشريع»
UPDATE public.questions SET topic = 'تاريخ التشريع' WHERE subject = 'sec_islamic' AND topic = 'تاريخ التشريع وعمل أهل المدينة';
-- sec_islamic: «حقوق الوالدين وصلة الرحم» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'حقوق الوالدين وصلة الرحم';
-- sec_islamic: «ديداكتيك التربية الإسلامية» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'ديداكتيك التربية الإسلامية';
-- sec_islamic: «ديداكتيك التربية الإسلامية والتقويم» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'ديداكتيك التربية الإسلامية والتقويم';
-- sec_islamic: «ديداكتيك التربية الإسلامية وبناء الكفايات» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'ديداكتيك التربية الإسلامية وبناء الكفايات';
-- sec_islamic: «علوم الحديث والمصطلح» → «الحديث النبوي الشريف وعلومه»
UPDATE public.questions SET topic = 'الحديث النبوي الشريف وعلومه' WHERE subject = 'sec_islamic' AND topic = 'علوم الحديث والمصطلح';
-- sec_islamic: «علوم القرآن وأسباب النزول» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'علوم القرآن وأسباب النزول';
-- sec_islamic: «علوم القرآن والتفسير» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'علوم القرآن والتفسير';
-- sec_islamic: «علوم القرآن ورسم المصحف» → «القرآن الكريم وعلومه»
UPDATE public.questions SET topic = 'القرآن الكريم وعلومه' WHERE subject = 'sec_islamic' AND topic = 'علوم القرآن ورسم المصحف';
-- sec_islamic: «فقه الأسرة والميراث» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه الأسرة والميراث';
-- sec_islamic: «فقه الأسرة والوصية والتركة» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه الأسرة والوصية والتركة';
-- sec_islamic: «فقه الأسرة وحقوق الأولاد» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه الأسرة وحقوق الأولاد';
-- sec_islamic: «فقه الأسرة وقضايا المجتمع» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه الأسرة وقضايا المجتمع';
-- sec_islamic: «فقه العبادات ومقاصدها» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه العبادات ومقاصدها';
-- sec_islamic: «فقه المعاملات المالية» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه المعاملات المالية';
-- sec_islamic: «فقه المعاملات وحرمة الغش» → «الفقه الإسلامي»
UPDATE public.questions SET topic = 'الفقه الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'فقه المعاملات وحرمة الغش';
-- sec_islamic: «قضايا الحرية والمسؤولية في الإسلام» → «العقيدة الإسلامية»
UPDATE public.questions SET topic = 'العقيدة الإسلامية' WHERE subject = 'sec_islamic' AND topic = 'قضايا الحرية والمسؤولية في الإسلام';
-- sec_islamic: «قضايا الفكر المعاصر والإلحاد» → «العقيدة الإسلامية»
UPDATE public.questions SET topic = 'العقيدة الإسلامية' WHERE subject = 'sec_islamic' AND topic = 'قضايا الفكر المعاصر والإلحاد';
-- sec_islamic: «مدخل الحكمة والإصلاح» → «الفكر التربوي الإسلامي»
UPDATE public.questions SET topic = 'الفكر التربوي الإسلامي' WHERE subject = 'sec_islamic' AND topic = 'مدخل الحكمة والإصلاح';
-- sec_islamic: «مدخل القسط والحقوق» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'مدخل القسط والحقوق';
-- sec_islamic: «مدخل القسط وحق البيئة» → «القيم وثوابت الأمة المغربية»
UPDATE public.questions SET topic = 'القيم وثوابت الأمة المغربية' WHERE subject = 'sec_islamic' AND topic = 'مدخل القسط وحق البيئة';
-- sec_islamic: «مقاصد الشريعة» → «أصول الفقه ومقاصد الشريعة»
UPDATE public.questions SET topic = 'أصول الفقه ومقاصد الشريعة' WHERE subject = 'sec_islamic' AND topic = 'مقاصد الشريعة';

-- sec_math: «الأعداد والحساب» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الأعداد والحساب';
-- sec_math: «الإحصاء» → «Statistiques»
UPDATE public.questions SET topic = 'Statistiques' WHERE subject = 'sec_math' AND topic = 'الإحصاء';
-- sec_math: «الاحتمال» → «Probabilités et dénombrement»
UPDATE public.questions SET topic = 'Probabilités et dénombrement' WHERE subject = 'sec_math' AND topic = 'الاحتمال';
-- sec_math: «الاحتمالات والتعداد» → «Probabilités et dénombrement»
UPDATE public.questions SET topic = 'Probabilités et dénombrement' WHERE subject = 'sec_math' AND topic = 'الاحتمالات والتعداد';
-- sec_math: «التحليل ودراسة الدوال» → «Analyse des fonctions»
UPDATE public.questions SET topic = 'Analyse des fonctions' WHERE subject = 'sec_math' AND topic = 'التحليل ودراسة الدوال';
-- sec_math: «التناسبية والنسبة المئوية» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'التناسبية والنسبة المئوية';
-- sec_math: «الجبر» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الجبر';
-- sec_math: «الجبر والأعداد العقدية» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الجبر والأعداد العقدية';
-- sec_math: «الجبر والمصفوفات» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الجبر والمصفوفات';
-- sec_math: «الجذور» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الجذور';
-- sec_math: «الحساب التكاملي» → «Analyse des fonctions»
UPDATE public.questions SET topic = 'Analyse des fonctions' WHERE subject = 'sec_math' AND topic = 'الحساب التكاملي';
-- sec_math: «الحسابيات في Z» → «Arithmétique dans Z»
UPDATE public.questions SET topic = 'Arithmétique dans Z' WHERE subject = 'sec_math' AND topic = 'الحسابيات في Z';
-- sec_math: «الدوال» → «Analyse des fonctions»
UPDATE public.questions SET topic = 'Analyse des fonctions' WHERE subject = 'sec_math' AND topic = 'الدوال';
-- sec_math: «الكسور» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'الكسور';
-- sec_math: «المتتاليات العددية» → «Probabilités et dénombrement»
UPDATE public.questions SET topic = 'Probabilités et dénombrement' WHERE subject = 'sec_math' AND topic = 'المتتاليات العددية';
-- sec_math: «المتراجحات» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'المتراجحات';
-- sec_math: «المجسمات والحجوم» → «Géométrie»
UPDATE public.questions SET topic = 'Géométrie' WHERE subject = 'sec_math' AND topic = 'المجسمات والحجوم';
-- sec_math: «المعادلات» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'المعادلات';
-- sec_math: «المعادلات التفاضلية» → «Analyse des fonctions»
UPDATE public.questions SET topic = 'Analyse des fonctions' WHERE subject = 'sec_math' AND topic = 'المعادلات التفاضلية';
-- sec_math: «المعادلات والمتراجحات» → «Algèbre»
UPDATE public.questions SET topic = 'Algèbre' WHERE subject = 'sec_math' AND topic = 'المعادلات والمتراجحات';
-- sec_math: «الهندسة الفضائية» → «Géométrie»
UPDATE public.questions SET topic = 'Géométrie' WHERE subject = 'sec_math' AND topic = 'الهندسة الفضائية';
-- sec_math: «الهندسة المستوية» → «Géométrie»
UPDATE public.questions SET topic = 'Géométrie' WHERE subject = 'sec_math' AND topic = 'الهندسة المستوية';
-- sec_math: «الهندسة والتحويلات» → «Géométrie»
UPDATE public.questions SET topic = 'Géométrie' WHERE subject = 'sec_math' AND topic = 'الهندسة والتحويلات';
-- sec_math: «قابلية القسمة والأعداد الأولية» → «Arithmétique dans Z»
UPDATE public.questions SET topic = 'Arithmétique dans Z' WHERE subject = 'sec_math' AND topic = 'قابلية القسمة والأعداد الأولية';

-- sec_pe: «ألعاب القوى» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى';
-- sec_pe: «ألعاب القوى والتدريب الفتري» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والتدريب الفتري';
-- sec_pe: «ألعاب القوى والرمي» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والرمي';
-- sec_pe: «ألعاب القوى والسباقات» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والسباقات';
-- sec_pe: «ألعاب القوى والوثب» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والوثب';
-- sec_pe: «ألعاب القوى والوثب الثلاثي» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والوثب الثلاثي';
-- sec_pe: «ألعاب القوى والوثب الطولي» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى والوثب الطولي';
-- sec_pe: «ألعاب القوى وتدريب التحمل» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى وتدريب التحمل';
-- sec_pe: «ألعاب القوى وسباقات التناوب» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى وسباقات التناوب';
-- sec_pe: «ألعاب القوى وسباقات الحواجز» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'ألعاب القوى وسباقات الحواجز';
-- sec_pe: «الأمن والسلامة في حصة الرياضة» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الأمن والسلامة في حصة الرياضة';
-- sec_pe: «الأنشطة البدنية في الهواء الطلق» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الأنشطة البدنية في الهواء الطلق';
-- sec_pe: «الإسعاف» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الإسعاف';
-- sec_pe: «الإصابات الرياضية والإسعاف الأولي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الإصابات الرياضية والإسعاف الأولي';
-- sec_pe: «التدريب البدني ومفهوم التدرج» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'التدريب البدني ومفهوم التدرج';
-- sec_pe: «التربية البدنية الدامجة» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'التربية البدنية الدامجة';
-- sec_pe: «التربية على الصحة والحياة المتوازنة» → «Nutrition»
UPDATE public.questions SET topic = 'Nutrition' WHERE subject = 'sec_pe' AND topic = 'التربية على الصحة والحياة المتوازنة';
-- sec_pe: «التشريح» → «Anatomie»
UPDATE public.questions SET topic = 'Anatomie' WHERE subject = 'sec_pe' AND topic = 'التشريح';
-- sec_pe: «التشريح الميكانيكي والمفاصل» → «Anatomie»
UPDATE public.questions SET topic = 'Anatomie' WHERE subject = 'sec_pe' AND topic = 'التشريح الميكانيكي والمفاصل';
-- sec_pe: «التغذية» → «Nutrition»
UPDATE public.questions SET topic = 'Nutrition' WHERE subject = 'sec_pe' AND topic = 'التغذية';
-- sec_pe: «التقويم في مادة التربية البدنية» → «Athlétisme»
UPDATE public.questions SET topic = 'Athlétisme' WHERE subject = 'sec_pe' AND topic = 'التقويم في مادة التربية البدنية';
-- sec_pe: «الثقافة الرياضية» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الثقافة الرياضية';
-- sec_pe: «الجمباز الرياضي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الجمباز الرياضي';
-- sec_pe: «الجمباز والإسناد والمساعدة» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الجمباز والإسناد والمساعدة';
-- sec_pe: «الجمباز والاتزان الحركي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الجمباز والاتزان الحركي';
-- sec_pe: «الجمباز والتنظيم الحركي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الجمباز والتنظيم الحركي';
-- sec_pe: «الجمباز والحركات الإيقاعية» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الجمباز والحركات الإيقاعية';
-- sec_pe: «الروح الرياضية والتحكيم» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الروح الرياضية والتحكيم';
-- sec_pe: «الرياضات الجماعية» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية';
-- sec_pe: «الرياضات الجماعية (كرة السلة)» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية (كرة السلة)';
-- sec_pe: «الرياضات الجماعية (كرة الطائرة)» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية (كرة الطائرة)';
-- sec_pe: «الرياضات الجماعية (كرة اليد)» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية (كرة اليد)';
-- sec_pe: «الرياضات الجماعية والتحول الهجومي السريع» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية والتحول الهجومي السريع';
-- sec_pe: «الرياضات الجماعية والدفاع المشترك» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية والدفاع المشترك';
-- sec_pe: «الرياضات الجماعية والدفاع المنطقي» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية والدفاع المنطقي';
-- sec_pe: «الرياضات الجماعية والمفاهيم التكتيكية» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية والمفاهيم التكتيكية';
-- sec_pe: «الرياضات الجماعية والموقع في الملعب» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضات الجماعية والموقع في الملعب';
-- sec_pe: «الرياضة المدرسية والجمعية الرياضية» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'الرياضة المدرسية والجمعية الرياضية';
-- sec_pe: «السباحة» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'السباحة';
-- sec_pe: «الصحة» → «Nutrition»
UPDATE public.questions SET topic = 'Nutrition' WHERE subject = 'sec_pe' AND topic = 'الصحة';
-- sec_pe: «الصفات البدنية» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الصفات البدنية';
-- sec_pe: «الفسيولوجيا الرياضية والمجهود» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا الرياضية والمجهود';
-- sec_pe: «الفسيولوجيا والألياف السريعة» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والألياف السريعة';
-- sec_pe: «الفسيولوجيا والتردد القلبي» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والتردد القلبي';
-- sec_pe: «الفسيولوجيا والترطيب» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والترطيب';
-- sec_pe: «الفسيولوجيا والتقلص العضلي» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والتقلص العضلي';
-- sec_pe: «الفسيولوجيا والتكيف مع التداريب» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والتكيف مع التداريب';
-- sec_pe: «الفسيولوجيا والسرعة الهوائية القصوى» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والسرعة الهوائية القصوى';
-- sec_pe: «الفسيولوجيا والصفات البدنية» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والصفات البدنية';
-- sec_pe: «الفسيولوجيا والعضلات الهيكلية» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا والعضلات الهيكلية';
-- sec_pe: «الفسيولوجيا وحمض اللاكتيك» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا وحمض اللاكتيك';
-- sec_pe: «الفسيولوجيا ومعدل الأيض الأساسي» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا ومعدل الأيض الأساسي';
-- sec_pe: «الفسيولوجيا ونظام الطاقة الهوائي» → «Physiologie de l’effort»
UPDATE public.questions SET topic = 'Physiologie de l’effort' WHERE subject = 'sec_pe' AND topic = 'الفسيولوجيا ونظام الطاقة الهوائي';
-- sec_pe: «الفيزيولوجيا» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'الفيزيولوجيا';
-- sec_pe: «القانون والتحكيم» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'القانون والتحكيم';
-- sec_pe: «القيم» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'القيم';
-- sec_pe: «القيم الأولمبية والتربية الرياضية» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'القيم الأولمبية والتربية الرياضية';
-- sec_pe: «بنية الحصة» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'بنية الحصة';
-- sec_pe: «ديداكتيك EPS والتغذية الراجعة» → «Nutrition»
UPDATE public.questions SET topic = 'Nutrition' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك EPS والتغذية الراجعة';
-- sec_pe: «ديداكتيك EPS وصياغة المعايير» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك EPS وصياغة المعايير';
-- sec_pe: «ديداكتيك التربية البدنية والتعلم الحركي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية والتعلم الحركي';
-- sec_pe: «ديداكتيك التربية البدنية والرياضية» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية والرياضية';
-- sec_pe: «ديداكتيك التربية البدنية والمراقبة المستمرة» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية والمراقبة المستمرة';
-- sec_pe: «ديداكتيك التربية البدنية والمشروع البيداغوجي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية والمشروع البيداغوجي';
-- sec_pe: «ديداكتيك التربية البدنية والميثاق الصفي» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية والميثاق الصفي';
-- sec_pe: «ديداكتيك التربية البدنية وتدبير الفضاء» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية وتدبير الفضاء';
-- sec_pe: «ديداكتيك التربية البدنية وتدبير الوقت» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية وتدبير الوقت';
-- sec_pe: «ديداكتيك التربية البدنية وعقد الدرس» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية وعقد الدرس';
-- sec_pe: «ديداكتيك التربية البدنية ومفهوم الكفاية» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك التربية البدنية ومفهوم الكفاية';
-- sec_pe: «ديداكتيك وبيداغوجيا الفارقية في EPS» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'ديداكتيك وبيداغوجيا الفارقية في EPS';
-- sec_pe: «كرة القدم وقانون اللعبة» → «Sports collectifs»
UPDATE public.questions SET topic = 'Sports collectifs' WHERE subject = 'sec_pe' AND topic = 'كرة القدم وقانون اللعبة';
-- sec_pe: «مبادئ التدريب» → «Didactique EPS»
UPDATE public.questions SET topic = 'Didactique EPS' WHERE subject = 'sec_pe' AND topic = 'مبادئ التدريب';

-- sec_philo: «الأخلاق» → «مباحث فلسفية»
UPDATE public.questions SET topic = 'مباحث فلسفية' WHERE subject = 'sec_philo' AND topic = 'الأخلاق';
-- sec_philo: «السياسة» → «مباحث فلسفية»
UPDATE public.questions SET topic = 'مباحث فلسفية' WHERE subject = 'sec_philo' AND topic = 'السياسة';
-- sec_philo: «المعرفة» → «محددات التفكير الفلسفي»
UPDATE public.questions SET topic = 'محددات التفكير الفلسفي' WHERE subject = 'sec_philo' AND topic = 'المعرفة';
-- sec_philo: «المنهجية الفلسفية» → «الفلسفة وآلياتها»
UPDATE public.questions SET topic = 'الفلسفة وآلياتها' WHERE subject = 'sec_philo' AND topic = 'المنهجية الفلسفية';
-- sec_philo: «الوجود الإنساني» → «مباحث فلسفية»
UPDATE public.questions SET topic = 'مباحث فلسفية' WHERE subject = 'sec_philo' AND topic = 'الوجود الإنساني';
-- sec_philo: «فلاسفة الإسلام والمغرب» → «المسار التاريخي للفكر الفلسفي»
UPDATE public.questions SET topic = 'المسار التاريخي للفكر الفلسفي' WHERE subject = 'sec_philo' AND topic = 'فلاسفة الإسلام والمغرب';

-- sec_physics: «الأحماض والقواعد» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الأحماض والقواعد';
-- sec_physics: «التحولات النووية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'التحولات النووية';
-- sec_physics: «التحولات النووية والاندماج» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'التحولات النووية والاندماج';
-- sec_physics: «التحولات النووية والانشطار» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'التحولات النووية والانشطار';
-- sec_physics: «التحولات النووية ومخطط سيغري» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'التحولات النووية ومخطط سيغري';
-- sec_physics: «التفاعلات الكيميائية» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'التفاعلات الكيميائية';
-- sec_physics: «الحرارة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الحرارة';
-- sec_physics: «الذرة» → «Ondes et lumière»
UPDATE public.questions SET topic = 'Ondes et lumière' WHERE subject = 'sec_physics' AND topic = 'الذرة';
-- sec_physics: «الضوء» → «Ondes et lumière»
UPDATE public.questions SET topic = 'Ondes et lumière' WHERE subject = 'sec_physics' AND topic = 'الضوء';
-- sec_physics: «الفيزياء الذرية والميكانيك الكمي» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الفيزياء الذرية والميكانيك الكمي';
-- sec_physics: «الكشف الكيميائي» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكشف الكيميائي';
-- sec_physics: «الكهرباء» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء';
-- sec_physics: «الكهرباء والأعمدة الكهروكيميائية» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والأعمدة الكهروكيميائية';
-- sec_physics: «الكهرباء والتحريض الكهرومغناطيسي» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والتحريض الكهرومغناطيسي';
-- sec_physics: «الكهرباء والتذبذبات القسرية والرنين» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والتذبذبات القسرية والرنين';
-- sec_physics: «الكهرباء والتضمين» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والتضمين';
-- sec_physics: «الكهرباء والدارة RLC» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والدارة RLC';
-- sec_physics: «الكهرباء والطاقة في الوشيعة» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء والطاقة في الوشيعة';
-- sec_physics: «الكهرباء وتضمين التردد» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الكهرباء وتضمين التردد';
-- sec_physics: «الكهرباء وثنائي القطب RC» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء وثنائي القطب RC';
-- sec_physics: «الكهرباء وثنائي القطب RL» → «Électricité»
UPDATE public.questions SET topic = 'Électricité' WHERE subject = 'sec_physics' AND topic = 'الكهرباء وثنائي القطب RL';
-- sec_physics: «الكيمياء والأكسدة-اختزال» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والأكسدة-اختزال';
-- sec_physics: «الكيمياء والتحليل الكهربائي» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والتحليل الكهربائي';
-- sec_physics: «الكيمياء والتحولات السريعة والبطيئة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والتحولات السريعة والبطيئة';
-- sec_physics: «الكيمياء والتوازن الكيميائي» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والتوازن الكيميائي';
-- sec_physics: «الكيمياء والحفز» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والحفز';
-- sec_physics: «الكيمياء والكواشف الملونة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والكواشف الملونة';
-- sec_physics: «الكيمياء والمحاليل المنظمة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والمحاليل المنظمة';
-- sec_physics: «الكيمياء والمعايرة المباشرة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والمعايرة المباشرة';
-- sec_physics: «الكيمياء والموصلية والمواصلة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء والموصلية والمواصلة';
-- sec_physics: «الكيمياء وتصبن الإستر» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وتصبن الإستر';
-- sec_physics: «الكيمياء وتفاعلات الأسترة والحلمأة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وتفاعلات الأسترة والحلمأة';
-- sec_physics: «الكيمياء وتفاعلات حمض-قاعدة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وتفاعلات حمض-قاعدة';
-- sec_physics: «الكيمياء وثابتة التوازن» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وثابتة التوازن';
-- sec_physics: «الكيمياء وثابتة الحمضية pKa» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وثابتة الحمضية pKa';
-- sec_physics: «الكيمياء وحمض كربوكسيلي ومشتقاته» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وحمض كربوكسيلي ومشتقاته';
-- sec_physics: «الكيمياء وزمن نصف التفاعل» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء وزمن نصف التفاعل';
-- sec_physics: «الكيمياء ومخطط الهيمنة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء ومخطط الهيمنة';
-- sec_physics: «الكيمياء ومعيار التطور التلقائي» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'الكيمياء ومعيار التطور التلقائي';
-- sec_physics: «المادة» → «Chimie»
UPDATE public.questions SET topic = 'Chimie' WHERE subject = 'sec_physics' AND topic = 'المادة';
-- sec_physics: «الموجات الميكانيكية والضوئية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الموجات الميكانيكية والضوئية';
-- sec_physics: «الموجات والضوء» → «Ondes et lumière»
UPDATE public.questions SET topic = 'Ondes et lumière' WHERE subject = 'sec_physics' AND topic = 'الموجات والضوء';
-- sec_physics: «الموجات والموجات فوق الصوتية» → «Ondes et lumière»
UPDATE public.questions SET topic = 'Ondes et lumière' WHERE subject = 'sec_physics' AND topic = 'الموجات والموجات فوق الصوتية';
-- sec_physics: «الموجات وتأثير دوبلر» → «Ondes et lumière»
UPDATE public.questions SET topic = 'Ondes et lumière' WHERE subject = 'sec_physics' AND topic = 'الموجات وتأثير دوبلر';
-- sec_physics: «الميكانيك» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك';
-- sec_physics: «الميكانيك والاحتكاك المائع» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك والاحتكاك المائع';
-- sec_physics: «الميكانيك والتذبذبات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك والتذبذبات';
-- sec_physics: «الميكانيك والسرعة والتسارع» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك والسرعة والتسارع';
-- sec_physics: «الميكانيك والطاقة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك والطاقة';
-- sec_physics: «الميكانيك وحركة الكواكب» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وحركة الكواكب';
-- sec_physics: «الميكانيك وحركة شحنة في مجال مغناطيسي» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وحركة شحنة في مجال مغناطيسي';
-- sec_physics: «الميكانيك وحركة قذيفة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وحركة قذيفة';
-- sec_physics: «الميكانيك ودوران جسم صلب» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك ودوران جسم صلب';
-- sec_physics: «الميكانيك وقوانين نيوتن» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وقوانين نيوتن';
-- sec_physics: «الميكانيك وقوة الثقالة الكونية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وقوة الثقالة الكونية';
-- sec_physics: «الميكانيك وقوة لورنتز» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وقوة لورنتز';
-- sec_physics: «الميكانيك وكمية الحركة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_physics' AND topic = 'الميكانيك وكمية الحركة';

-- sec_svt: «الانقسام الاختزالي والتوالد الجنسي» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الانقسام الاختزالي والتوالد الجنسي';
-- sec_svt: «الانقسام الاختزالي والشذوذات الصبغية» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الانقسام الاختزالي والشذوذات الصبغية';
-- sec_svt: «الانقسام الخلوي غير المباشر» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الانقسام الخلوي غير المباشر';
-- sec_svt: «البيئة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة';
-- sec_svt: «البيئة والتنوع البيولوجي» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة والتنوع البيولوجي';
-- sec_svt: «البيئة وتلوث الأوساط المائية» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة وتلوث الأوساط المائية';
-- sec_svt: «البيئة ودورة المادة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة ودورة المادة';
-- sec_svt: «البيئة وظاهرة الاحتباس الحراري» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة وظاهرة الاحتباس الحراري';
-- sec_svt: «البيئة وعلم البيئة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'البيئة وعلم البيئة';
-- sec_svt: «البيولوجيا الخلوية وإنتاج البروتينات» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'البيولوجيا الخلوية وإنتاج البروتينات';
-- sec_svt: «البيولوجيا الخلوية والوراثة» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'البيولوجيا الخلوية والوراثة';
-- sec_svt: «التدبير المستدام للنفايات» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التدبير المستدام للنفايات';
-- sec_svt: «التركيب الضوئي والإنتاجية النباتية» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'التركيب الضوئي والإنتاجية النباتية';
-- sec_svt: «التركيب الضوئي ودورة كالفين» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'التركيب الضوئي ودورة كالفين';
-- sec_svt: «التنفس الخلوي والتخمر» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التنفس الخلوي والتخمر';
-- sec_svt: «التنفس الخلوي ودورة كريبس» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التنفس الخلوي ودورة كريبس';
-- sec_svt: «التنفس الخلوي وطرق تجديد ATP السريعة» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التنفس الخلوي وطرق تجديد ATP السريعة';
-- sec_svt: «التنفس والتخمر الكحولي» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التنفس والتخمر الكحولي';
-- sec_svt: «التنفس والتخمر اللبني والكحولي» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التنفس والتخمر اللبني والكحولي';
-- sec_svt: «التواصل العصبي والسيالة العصبية» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التواصل العصبي والسيالة العصبية';
-- sec_svt: «التواصل العصبي والمشبك» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التواصل العصبي والمشبك';
-- sec_svt: «التواصل الهرموني وتحلون الدم» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'التواصل الهرموني وتحلون الدم';
-- sec_svt: «التوالد والتكاثر البشري» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'التوالد والتكاثر البشري';
-- sec_svt: «الجسم والصحة» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'الجسم والصحة';
-- sec_svt: «الجيولوجيا والتأريخ المطلق» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'الجيولوجيا والتأريخ المطلق';
-- sec_svt: «الخلية والوراثة» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الخلية والوراثة';
-- sec_svt: «السلسلة التنفسية والتفوسفر التأكسدي» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'السلسلة التنفسية والتفوسفر التأكسدي';
-- sec_svt: «الفسيولوجيا العصبية والانعكاس الشوكي» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'الفسيولوجيا العصبية والانعكاس الشوكي';
-- sec_svt: «الفسيولوجيا العضلية والتقلص» → «Physiologie»
UPDATE public.questions SET topic = 'Physiologie' WHERE subject = 'sec_svt' AND topic = 'الفسيولوجيا العضلية والتقلص';
-- sec_svt: «القوانين الإحصائية لماندل» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'القوانين الإحصائية لماندل';
-- sec_svt: «الكائنات الحية» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'الكائنات الحية';
-- sec_svt: «الهندسة الوراثية وتطبيقاتها» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الهندسة الوراثية وتطبيقاتها';
-- sec_svt: «الوراثة البشرية» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الوراثة البشرية';
-- sec_svt: «الوراثة البشرية والصيغة الصبغية» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الوراثة البشرية والصيغة الصبغية';
-- sec_svt: «الوراثة البشرية ووراثة الساكنة» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الوراثة البشرية ووراثة الساكنة';
-- sec_svt: «الوراثة اللاجينية» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'الوراثة اللاجينية';
-- sec_svt: «تطور الكائنات الحية والانتخاب الطبيعي» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'تطور الكائنات الحية والانتخاب الطبيعي';
-- sec_svt: «تعبير الخبر الوراثي» → «Cellule et génétique»
UPDATE public.questions SET topic = 'Cellule et génétique' WHERE subject = 'sec_svt' AND topic = 'تعبير الخبر الوراثي';
-- sec_svt: «جيولوجيا السلاسل الجبلية» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا السلاسل الجبلية';
-- sec_svt: «جيولوجيا والتحول التكتوني» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا والتحول التكتوني';
-- sec_svt: «جيولوجيا والطبقات والرسوبيات» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا والطبقات والرسوبيات';
-- sec_svt: «جيولوجيا والغرانيتية» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا والغرانيتية';
-- sec_svt: «جيولوجيا والمستحثات المرشدة» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا والمستحثات المرشدة';
-- sec_svt: «جيولوجيا وتكتونية الصفائح» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'جيولوجيا وتكتونية الصفائح';
-- sec_svt: «علم المناعة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة';
-- sec_svt: «علم المناعة واضطراباته» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة واضطراباته';
-- sec_svt: «علم المناعة والحساسية المفرطة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة والحساسية المفرطة';
-- sec_svt: «علم المناعة والذاكرة المناعية» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة والذاكرة المناعية';
-- sec_svt: «علم المناعة واللقاحات والمصول» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة واللقاحات والمصول';
-- sec_svt: «علم المناعة والمعقد الرئيسي للتلاؤم النسيجي» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة والمعقد الرئيسي للتلاؤم النسيجي';
-- sec_svt: «علم المناعة وعامل التكملة» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة وعامل التكملة';
-- sec_svt: «علم المناعة ومضادات الأجسام» → «Immunologie et environnement»
UPDATE public.questions SET topic = 'Immunologie et environnement' WHERE subject = 'sec_svt' AND topic = 'علم المناعة ومضادات الأجسام';
-- sec_svt: «علوم الأرض» → «Géologie»
UPDATE public.questions SET topic = 'Géologie' WHERE subject = 'sec_svt' AND topic = 'علوم الأرض';

-- sec_te: «أدوات القياس الدقيقة في التكنولوجيا» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'أدوات القياس الدقيقة في التكنولوجيا';
-- sec_te: «أدوات القياس الميكرومترية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'أدوات القياس الميكرومترية';
-- sec_te: «الأمان» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الأمان';
-- sec_te: «الأمن والسلامة في ورشة التكنولوجيا» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الأمن والسلامة في ورشة التكنولوجيا';
-- sec_te: «البرمجة بلغة الغرافسيت والمراحل» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'البرمجة بلغة الغرافسيت والمراحل';
-- sec_te: «البرمجة بلغة المخططات التتابعية (Grafcet)» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'البرمجة بلغة المخططات التتابعية (Grafcet)';
-- sec_te: «البرمجة والأورغانيغرام (Algorigramme)» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'البرمجة والأورغانيغرام (Algorigramme)';
-- sec_te: «التحكم في المحركات بتقنية PWM» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'التحكم في المحركات بتقنية PWM';
-- sec_te: «التحليل الوظيفي الهيكلي SADT» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'التحليل الوظيفي الهيكلي SADT';
-- sec_te: «التحليل الوظيفي للمنتج» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'التحليل الوظيفي للمنتج';
-- sec_te: «التحليل الوظيفي والتقني» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'التحليل الوظيفي والتقني';
-- sec_te: «التحليل الوظيفي ودفتر التحملات» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'التحليل الوظيفي ودفتر التحملات';
-- sec_te: «التصميم والتصنيع المدعم بالحاسوب (CFAO)» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'التصميم والتصنيع المدعم بالحاسوب (CFAO)';
-- sec_te: «التصنيع» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'التصنيع';
-- sec_te: «التنمية المستدامة ودورة حياة المنتج» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'التنمية المستدامة ودورة حياة المنتج';
-- sec_te: «الدوائر الإلكترونية والمقاومات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الدوائر الإلكترونية والمقاومات';
-- sec_te: «الدوائر الكهربائية والترانزيستور» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'الدوائر الكهربائية والترانزيستور';
-- sec_te: «الدوائر الكهربائية وقانون الحلقات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الدوائر الكهربائية وقانون الحلقات';
-- sec_te: «الدوائر الكهربائية وقانون العقد» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الدوائر الكهربائية وقانون العقد';
-- sec_te: «الدوائر المنطقية وجبر بول» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'الدوائر المنطقية وجبر بول';
-- sec_te: «الرسم التقني والمقاطع والتهشيرات» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم التقني والمقاطع والتهشيرات';
-- sec_te: «الرسم التقني والمقاييس» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم التقني والمقاييس';
-- sec_te: «الرسم التقني وخطوط الرسم» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم التقني وخطوط الرسم';
-- sec_te: «الرسم التقني ورمز الخشونة السطحية» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم التقني ورمز الخشونة السطحية';
-- sec_te: «الرسم الصناعي» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم الصناعي';
-- sec_te: «الرسم الصناعي والتصميم المدعم بالحاسوب» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'الرسم الصناعي والتصميم المدعم بالحاسوب';
-- sec_te: «الكهرباء» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'الكهرباء';
-- sec_te: «الكهرباء والإلكترونيات» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'الكهرباء والإلكترونيات';
-- sec_te: «الكهرباء والمتحكمات» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'الكهرباء والمتحكمات';
-- sec_te: «المتحكمات وبطاقة أردوينو» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'المتحكمات وبطاقة أردوينو';
-- sec_te: «المقاربة المنهجية» → «Méthodologie»
UPDATE public.questions SET topic = 'Méthodologie' WHERE subject = 'sec_te' AND topic = 'المقاربة المنهجية';
-- sec_te: «المواد» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'المواد';
-- sec_te: «الميكانيزمات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيزمات';
-- sec_te: «الميكانيك والتروس المخروطية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والتروس المخروطية';
-- sec_te: «الميكانيك والتروس المسننة المخفضة والمضاعفة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والتروس المسننة المخفضة والمضاعفة';
-- sec_te: «الميكانيك والروابط الميكانيكية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والروابط الميكانيكية';
-- sec_te: «الميكانيك والسلاسل الحركية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والسلاسل الحركية';
-- sec_te: «الميكانيك والعجلات الحرة والفرامل» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والعجلات الحرة والفرامل';
-- sec_te: «الميكانيك والمحامل الكروية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك والمحامل الكروية';
-- sec_te: «الميكانيك وتحويل الحركة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك وتحويل الحركة';
-- sec_te: «الميكانيك ونقل الحركة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك ونقل الحركة';
-- sec_te: «الميكانيك ونقل الحركة بالتخفيض» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الميكانيك ونقل الحركة بالتخفيض';
-- sec_te: «الوصلات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'الوصلات';
-- sec_te: «تقنيات التصنيع والإنتاج» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'تقنيات التصنيع والإنتاج';
-- sec_te: «تقنيات التصنيع والتفريز» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'تقنيات التصنيع والتفريز';
-- sec_te: «تقنيات التصنيع والقطع» → «Dessin technique»
UPDATE public.questions SET topic = 'Dessin technique' WHERE subject = 'sec_te' AND topic = 'تقنيات التصنيع والقطع';
-- sec_te: «ديداكتيك التكنولوجيا الصناعية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'ديداكتيك التكنولوجيا الصناعية';
-- sec_te: «ديداكتيك التكنولوجيا والتعليم الرقمي» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'ديداكتيك التكنولوجيا والتعليم الرقمي';
-- sec_te: «ديداكتيك التكنولوجيا وبناء الكفايات» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'ديداكتيك التكنولوجيا وبناء الكفايات';
-- sec_te: «ديداكتيك التكنولوجيا وروح الابتكار» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'ديداكتيك التكنولوجيا وروح الابتكار';
-- sec_te: «سلسلة الطاقة (Chaîne d'énergie)» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة (Chaîne d''énergie)';
-- sec_te: «سلسلة الطاقة والبطاريات القابلة للشحن» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والبطاريات القابلة للشحن';
-- sec_te: «سلسلة الطاقة والتحكم بالسرعة» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والتحكم بالسرعة';
-- sec_te: «سلسلة الطاقة والمحرك السيرفو» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والمحرك السيرفو';
-- sec_te: «سلسلة الطاقة والمحركات خطوة بخطوة» → «Électrotechnique»
UPDATE public.questions SET topic = 'Électrotechnique' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والمحركات خطوة بخطوة';
-- sec_te: «سلسلة الطاقة والمنفذات» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والمنفذات';
-- sec_te: «سلسلة الطاقة والموزعات» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة الطاقة والموزعات';
-- sec_te: «سلسلة المعلومات (Chaîne d'information)» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة المعلومات (Chaîne d''information)';
-- sec_te: «سلسلة المعلومات والملتقطات» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة المعلومات والملتقطات';
-- sec_te: «سلسلة المعلومات والملتقطات الضوئية» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة المعلومات والملتقطات الضوئية';
-- sec_te: «سلسلة المعلومات ومستشعرات الموجات فوق الصوتية» → «Analyse fonctionnelle»
UPDATE public.questions SET topic = 'Analyse fonctionnelle' WHERE subject = 'sec_te' AND topic = 'سلسلة المعلومات ومستشعرات الموجات فوق الصوتية';
-- sec_te: «علم المواد والتآكل والصدأ» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'علم المواد والتآكل والصدأ';
-- sec_te: «علم المواد والمعادن الحديدية» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'علم المواد والمعادن الحديدية';
-- sec_te: «علم المواد والمواد المركبة» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'علم المواد والمواد المركبة';
-- sec_te: «علم المواد وتصنيفها» → «Mécanique»
UPDATE public.questions SET topic = 'Mécanique' WHERE subject = 'sec_te' AND topic = 'علم المواد وتصنيفها';
