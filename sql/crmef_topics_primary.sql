-- ============================================================================
-- توحيد مواضيع بنك CRMEF (primary) مع المجالات الفرعية الرسمية
-- المصدر: توصيفات المركز الوطني للامتحانات — دورة نونبر 2026.
-- المستوى (أ): تغيير topic فقط — المعاملات (20/12/8) ونتائج التصحيح لم تتغيّر.
-- التنفيذ آمن ومكرّر.
-- ============================================================================

-- اللغة العربية (تخصص): «الأساليب» → «الأساليب»
UPDATE public.questions SET topic = 'الأساليب' WHERE subject = 'ar' AND topic = 'الأساليب';
-- اللغة العربية (تخصص): «الإملاء» → «الظواهر الإملائية»
UPDATE public.questions SET topic = 'الظواهر الإملائية' WHERE subject = 'ar' AND topic = 'الإملاء';
-- اللغة العربية (تخصص): «البلاغة» → «خارج التوصيف»
UPDATE public.questions SET topic = 'خارج التوصيف' WHERE subject = 'ar' AND topic = 'البلاغة';
-- اللغة العربية (تخصص): «الترقيم والتعبير» → «الظواهر الإملائية»
UPDATE public.questions SET topic = 'الظواهر الإملائية' WHERE subject = 'ar' AND topic = 'الترقيم والتعبير';
-- اللغة العربية (تخصص): «الصرف» → «بنية الكلمة»
UPDATE public.questions SET topic = 'بنية الكلمة' WHERE subject = 'ar' AND topic = 'الصرف';
-- اللغة العربية (تخصص): «المعجم والدلالة» → «الفهم والمهارات»
UPDATE public.questions SET topic = 'الفهم والمهارات' WHERE subject = 'ar' AND topic = 'المعجم والدلالة';
-- اللغة العربية (تخصص): «النحو والإعراب» → «أنواع الجملة»
UPDATE public.questions SET topic = 'أنواع الجملة' WHERE subject = 'ar' AND topic = 'النحو والإعراب';
-- اللغة العربية (تخصص): «فهم النص» → «الفهم والمهارات»
UPDATE public.questions SET topic = 'الفهم والمهارات' WHERE subject = 'ar' AND topic = 'فهم النص';
-- اللغة العربية (تخصص): «قواعد متنوعة» → «بنية الكلمة»
UPDATE public.questions SET topic = 'بنية الكلمة' WHERE subject = 'ar' AND topic = 'قواعد متنوعة';

-- اللغة الفرنسية (تخصص): «Accords» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'fr' AND topic = 'Accords';
-- اللغة الفرنسية (تخصص): «Accords et orthographe» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'fr' AND topic = 'Accords et orthographe';
-- اللغة الفرنسية (تخصص): «Compréhension de l’écrit» → «Compétence communicative écrite»
UPDATE public.questions SET topic = 'Compétence communicative écrite' WHERE subject = 'fr' AND topic = 'Compréhension de l’écrit';
-- اللغة الفرنسية (تخصص): «Conjugaison» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'fr' AND topic = 'Conjugaison';
-- اللغة الفرنسية (تخصص): «Grammaire» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'fr' AND topic = 'Grammaire';
-- اللغة الفرنسية (تخصص): «Orthographe et homophones» → «Compétence communicative écrite»
UPDATE public.questions SET topic = 'Compétence communicative écrite' WHERE subject = 'fr' AND topic = 'Orthographe et homophones';
-- اللغة الفرنسية (تخصص): «Ponctuation» → «Compétence communicative écrite»
UPDATE public.questions SET topic = 'Compétence communicative écrite' WHERE subject = 'fr' AND topic = 'Ponctuation';
-- اللغة الفرنسية (تخصص): «Production écrite» → «Compétence communicative écrite»
UPDATE public.questions SET topic = 'Compétence communicative écrite' WHERE subject = 'fr' AND topic = 'Production écrite';
-- اللغة الفرنسية (تخصص): «Propositions et phrase complexe» → «Morphosyntaxe»
UPDATE public.questions SET topic = 'Morphosyntaxe' WHERE subject = 'fr' AND topic = 'Propositions et phrase complexe';
-- اللغة الفرنسية (تخصص): «Vocabulaire» → «Fonctionnement de la langue — Lexicologie»
UPDATE public.questions SET topic = 'Fonctionnement de la langue — Lexicologie' WHERE subject = 'fr' AND topic = 'Vocabulaire';

-- الرياضيات (تخصص): «الأعداد العشرية» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'الأعداد العشرية';
-- الرياضيات (تخصص): «الإحصاء» → «تنظيم ومعالجة البيانات»
UPDATE public.questions SET topic = 'تنظيم ومعالجة البيانات' WHERE subject = 'ma' AND topic = 'الإحصاء';
-- الرياضيات (تخصص): «الاحتمال والمنطق» → «تنظيم ومعالجة البيانات»
UPDATE public.questions SET topic = 'تنظيم ومعالجة البيانات' WHERE subject = 'ma' AND topic = 'الاحتمال والمنطق';
-- الرياضيات (تخصص): «الترقيم والعمليات» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'الترقيم والعمليات';
-- الرياضيات (تخصص): «التناسبية والنسبة المئوية» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'التناسبية والنسبة المئوية';
-- الرياضيات (تخصص): «القياس والتحويلات» → «القياس»
UPDATE public.questions SET topic = 'القياس' WHERE subject = 'ma' AND topic = 'القياس والتحويلات';
-- الرياضيات (تخصص): «الكسور» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'الكسور';
-- الرياضيات (تخصص): «المجسمات والحجوم» → «القياس»
UPDATE public.questions SET topic = 'القياس' WHERE subject = 'ma' AND topic = 'المجسمات والحجوم';
-- الرياضيات (تخصص): «الهندسة المستوية» → «الهندسة»
UPDATE public.questions SET topic = 'الهندسة' WHERE subject = 'ma' AND topic = 'الهندسة المستوية';
-- الرياضيات (تخصص): «ق.م.أ و م.م.أ» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'ق.م.أ و م.م.أ';
-- الرياضيات (تخصص): «قابلية القسمة والأعداد الأولية» → «الأعداد والحساب»
UPDATE public.questions SET topic = 'الأعداد والحساب' WHERE subject = 'ma' AND topic = 'قابلية القسمة والأعداد الأولية';

-- العلوم (تخصص): «الأرض والكون» → «Astronomie descriptive»
UPDATE public.questions SET topic = 'Astronomie descriptive' WHERE subject = 'sc' AND topic = 'الأرض والكون';
-- العلوم (تخصص): «البيئة والتنمية المستدامة» → «Ecologie générale»
UPDATE public.questions SET topic = 'Ecologie générale' WHERE subject = 'sc' AND topic = 'البيئة والتنمية المستدامة';
-- العلوم (تخصص): «الحركة والقوة والطاقة» → «خارج التوصيف»
UPDATE public.questions SET topic = 'خارج التوصيف' WHERE subject = 'sc' AND topic = 'الحركة والقوة والطاقة';
-- العلوم (تخصص): «الكائنات الحية» → «Biologie»
UPDATE public.questions SET topic = 'Biologie' WHERE subject = 'sc' AND topic = 'الكائنات الحية';
-- العلوم (تخصص): «الكهرباء والضوء» → «Électricité et Magnétisme»
UPDATE public.questions SET topic = 'Électricité et Magnétisme' WHERE subject = 'sc' AND topic = 'الكهرباء والضوء';
-- العلوم (تخصص): «المادة وتحولاتها» → «Organisation de la matière»
UPDATE public.questions SET topic = 'Organisation de la matière' WHERE subject = 'sc' AND topic = 'المادة وتحولاتها';
-- العلوم (تخصص): «جسم الإنسان والصحة» → «Biologie»
UPDATE public.questions SET topic = 'Biologie' WHERE subject = 'sc' AND topic = 'جسم الإنسان والصحة';

-- ديداكتيك اللغة العربية: «التخطيط التربوي» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'التخطيط التربوي';
-- ديداكتيك اللغة العربية: «التدبير الديداكتيكي» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'التدبير الديداكتيكي';
-- ديداكتيك اللغة العربية: «التدبير الزمني للوحدة» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'التدبير الزمني للوحدة';
-- ديداكتيك اللغة العربية: «التقويم والدعم» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'التقويم والدعم';
-- ديداكتيك اللغة العربية: «بناء المفهوم والدرس» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'بناء المفهوم والدرس';
-- ديداكتيك اللغة العربية: «تحليل الأخطاء وعلاجها» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'تحليل الأخطاء وعلاجها';
-- ديداكتيك اللغة العربية: «تخطيط الحصة» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'تخطيط الحصة';
-- ديداكتيك اللغة العربية: «تدريس القراءة والكتابة» → «ديدكتيك القراءة»
UPDATE public.questions SET topic = 'ديدكتيك القراءة' WHERE subject = 'dar' AND topic = 'تدريس القراءة والكتابة';
-- ديداكتيك اللغة العربية: «تقويم ودعم اللغة العربية» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'تقويم ودعم اللغة العربية';
-- ديداكتيك اللغة العربية: «ديداكتيك الظواهر اللغوية» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'ديداكتيك الظواهر اللغوية';
-- ديداكتيك اللغة العربية: «ديداكتيك القراءة» → «ديدكتيك القراءة»
UPDATE public.questions SET topic = 'ديدكتيك القراءة' WHERE subject = 'dar' AND topic = 'ديداكتيك القراءة';
-- ديداكتيك اللغة العربية: «ديداكتيك الكتابة» → «ديدكتيك الكتابة»
UPDATE public.questions SET topic = 'ديدكتيك الكتابة' WHERE subject = 'dar' AND topic = 'ديداكتيك الكتابة';
-- ديداكتيك اللغة العربية: «ديداكتيك اللغة العربية» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'ديداكتيك اللغة العربية';
-- ديداكتيك اللغة العربية: «مشروع الوحدة» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'مشروع الوحدة';
-- ديداكتيك اللغة العربية: «مكون الاستماع والتحدث» → «ديدكتيك الشفهي»
UPDATE public.questions SET topic = 'ديدكتيك الشفهي' WHERE subject = 'dar' AND topic = 'مكون الاستماع والتحدث';
-- ديداكتيك اللغة العربية: «وضعيات تطبيقية» → «الديدكتيك العام»
UPDATE public.questions SET topic = 'الديدكتيك العام' WHERE subject = 'dar' AND topic = 'وضعيات تطبيقية';

-- ديداكتيك اللغة الفرنسية: «Activités de langue» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Activités de langue';
-- ديداكتيك اللغة الفرنسية: «Activités orales» → «La didactique de l'oral»
UPDATE public.questions SET topic = 'La didactique de l''oral' WHERE subject = 'dfr' AND topic = 'Activités orales';
-- ديداكتيك اللغة الفرنسية: «Compréhension de l’écrit» → «Compréhension de l’écrit / Lecture»
UPDATE public.questions SET topic = 'Compréhension de l’écrit / Lecture' WHERE subject = 'dfr' AND topic = 'Compréhension de l’écrit';
-- ديداكتيك اللغة الفرنسية: «Didactique de l'orthographe» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Didactique de l''orthographe';
-- ديداكتيك اللغة الفرنسية: «Didactique de l'écriture» → «Production de l'écrit»
UPDATE public.questions SET topic = 'Production de l''écrit' WHERE subject = 'dfr' AND topic = 'Didactique de l''écriture';
-- ديداكتيك اللغة الفرنسية: «Didactique de la conjugaison» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Didactique de la conjugaison';
-- ديداكتيك اللغة الفرنسية: «Didactique de la lecture» → «Compréhension de l’écrit / Lecture»
UPDATE public.questions SET topic = 'Compréhension de l’écrit / Lecture' WHERE subject = 'dfr' AND topic = 'Didactique de la lecture';
-- ديداكتيك اللغة الفرنسية: «Didactique de la poésie» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Didactique de la poésie';
-- ديداكتيك اللغة الفرنسية: «Didactique du FLE» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Didactique du FLE';
-- ديداكتيك اللغة الفرنسية: «Didactique du lexique» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Didactique du lexique';
-- ديداكتيك اللغة الفرنسية: «Finalités de l'enseignement du français» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Finalités de l''enseignement du français';
-- ديداكتيك اللغة الفرنسية: «Gestion de classe en FLE» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Gestion de classe en FLE';
-- ديداكتيك اللغة الفرنسية: «Production de l'écrit» → «Production de l'écrit»
UPDATE public.questions SET topic = 'Production de l''écrit' WHERE subject = 'dfr' AND topic = 'Production de l''écrit';
-- ديداكتيك اللغة الفرنسية: «Projet de classe» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Projet de classe';
-- ديداكتيك اللغة الفرنسية: «Évaluation en FLE» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Évaluation en FLE';
-- ديداكتيك اللغة الفرنسية: «Évaluation et remédiation» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'Évaluation et remédiation';
-- ديداكتيك اللغة الفرنسية: «التقويم والدعم» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'التقويم والدعم';
-- ديداكتيك اللغة الفرنسية: «بناء المفهوم والدرس» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'بناء المفهوم والدرس';
-- ديداكتيك اللغة الفرنسية: «تحليل الأخطاء وعلاجها» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'تحليل الأخطاء وعلاجها';
-- ديداكتيك اللغة الفرنسية: «تخطيط الحصة» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'تخطيط الحصة';
-- ديداكتيك اللغة الفرنسية: «تدريس القراءة والكتابة» → «Compréhension de l’écrit / Lecture»
UPDATE public.questions SET topic = 'Compréhension de l’écrit / Lecture' WHERE subject = 'dfr' AND topic = 'تدريس القراءة والكتابة';
-- ديداكتيك اللغة الفرنسية: «وضعيات تطبيقية» → «Concepts de base en didactique»
UPDATE public.questions SET topic = 'Concepts de base en didactique' WHERE subject = 'dfr' AND topic = 'وضعيات تطبيقية';

-- ديداكتيك الرياضيات: «التخطيط والتدبير» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'التخطيط والتدبير';
-- ديداكتيك الرياضيات: «التقويم والدعم» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'التقويم والدعم';
-- ديداكتيك الرياضيات: «التناسبية ومعالجة البيانات» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'التناسبية ومعالجة البيانات';
-- ديداكتيك الرياضيات: «الحساب الذهني» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'الحساب الذهني';
-- ديداكتيك الرياضيات: «المتغيرات الديداكتيكية» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'المتغيرات الديداكتيكية';
-- ديداكتيك الرياضيات: «المعينات والوسائل الديداكتيكية» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'المعينات والوسائل الديداكتيكية';
-- ديداكتيك الرياضيات: «النقل الديداكتيكي والتعاقد» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'النقل الديداكتيكي والتعاقد';
-- ديداكتيك الرياضيات: «بناء المفهوم والدرس» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'بناء المفهوم والدرس';
-- ديداكتيك الرياضيات: «تحليل الأخطاء والعوائق» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'تحليل الأخطاء والعوائق';
-- ديداكتيك الرياضيات: «تدريس الهندسة والقياس» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'تدريس الهندسة والقياس';
-- ديداكتيك الرياضيات: «تنظيم ومعالجة المعطيات» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'تنظيم ومعالجة المعطيات';
-- ديداكتيك الرياضيات: «حل المسائل الرياضية» → «الديدكتيك العام (المرتكزات والمفاهيم الأساس)»
UPDATE public.questions SET topic = 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)' WHERE subject = 'dma' AND topic = 'حل المسائل الرياضية';
-- ديداكتيك الرياضيات: «ديداكتيك الأعداد والحساب» → «ديداكتيك الرياضيات»
UPDATE public.questions SET topic = 'ديداكتيك الرياضيات' WHERE subject = 'dma' AND topic = 'ديداكتيك الأعداد والحساب';
-- ديداكتيك الرياضيات: «ديداكتيك التناسبية» → «ديداكتيك الرياضيات»
UPDATE public.questions SET topic = 'ديداكتيك الرياضيات' WHERE subject = 'dma' AND topic = 'ديداكتيك التناسبية';
-- ديداكتيك الرياضيات: «ديداكتيك الرياضيات» → «ديداكتيك الرياضيات»
UPDATE public.questions SET topic = 'ديداكتيك الرياضيات' WHERE subject = 'dma' AND topic = 'ديداكتيك الرياضيات';
-- ديداكتيك الرياضيات: «ديداكتيك القياس» → «ديداكتيك الرياضيات»
UPDATE public.questions SET topic = 'ديداكتيك الرياضيات' WHERE subject = 'dma' AND topic = 'ديداكتيك القياس';
-- ديداكتيك الرياضيات: «ديداكتيك الهندسة والفضاء» → «ديداكتيك الرياضيات»
UPDATE public.questions SET topic = 'ديداكتيك الرياضيات' WHERE subject = 'dma' AND topic = 'ديداكتيك الهندسة والفضاء';

-- ديداكتيك العلوم: «التدبير الديداكتيكي للنشاط العلمي» → «مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'التدبير الديداكتيكي للنشاط العلمي';
-- ديداكتيك العلوم: «التربية الصحية والبيئية» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'التربية الصحية والبيئية';
-- ديداكتيك العلوم: «التقويم والدعم» → «موارد ديدكتيكية مرتبطة بمادة النشاط العلمي»
UPDATE public.questions SET topic = 'موارد ديدكتيكية مرتبطة بمادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'التقويم والدعم';
-- ديداكتيك العلوم: «التكنولوجيا والتصميم» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'التكنولوجيا والتصميم';
-- ديداكتيك العلوم: «العلوم الفيزيائية» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'العلوم الفيزيائية';
-- ديداكتيك العلوم: «بناء المفهوم والدرس» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'بناء المفهوم والدرس';
-- ديداكتيك العلوم: «تحليل الأخطاء وعلاجها» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'تحليل الأخطاء وعلاجها';
-- ديداكتيك العلوم: «تخطيط الحصة» → «مفاهيم ديدكتيكية وإرتقاء مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مفاهيم ديدكتيكية وإرتقاء مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'تخطيط الحصة';
-- ديداكتيك العلوم: «ديداكتيك النشاط العلمي» → «مفاهيم ديدكتيكية وإرتقاء مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مفاهيم ديدكتيكية وإرتقاء مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'ديداكتيك النشاط العلمي';
-- ديداكتيك العلوم: «علوم الأرض والفضاء» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'علوم الأرض والفضاء';
-- ديداكتيك العلوم: «علوم الحياة» → «المرتكزات والمفاهيم الأساس»
UPDATE public.questions SET topic = 'المرتكزات والمفاهيم الأساس' WHERE subject = 'dsc' AND topic = 'علوم الحياة';
-- ديداكتيك العلوم: «كراسة التقصي العلمي» → «مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'كراسة التقصي العلمي';
-- ديداكتيك العلوم: «نهج التقصي العلمي» → «مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'نهج التقصي العلمي';
-- ديداكتيك العلوم: «وضعيات تطبيقية» → «مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي»
UPDATE public.questions SET topic = 'مواد ديداكتيكية عامة لبناء التعلمات في مادة النشاط العلمي' WHERE subject = 'dsc' AND topic = 'وضعيات تطبيقية';

-- علوم التربية: «أخلاقيات المهنة والحياة المدرسية» → «دينامية الجماعة»
UPDATE public.questions SET topic = 'دينامية الجماعة' WHERE subject = 'edu' AND topic = 'أخلاقيات المهنة والحياة المدرسية';
-- علوم التربية: «الأهداف والتخطيط» → «من بيداغوجيا الأهداف إلى المقاربة بالكفايات»
UPDATE public.questions SET topic = 'من بيداغوجيا الأهداف إلى المقاربة بالكفايات' WHERE subject = 'edu' AND topic = 'الأهداف والتخطيط';
-- علوم التربية: «الأهداف وبلوم والتخطيط» → «من بيداغوجيا الأهداف إلى المقاربة بالكفايات»
UPDATE public.questions SET topic = 'من بيداغوجيا الأهداف إلى المقاربة بالكفايات' WHERE subject = 'edu' AND topic = 'الأهداف وبلوم والتخطيط';
-- علوم التربية: «الإصلاح التربوي المغربي» → «سوسيولوجيا التربية»
UPDATE public.questions SET topic = 'سوسيولوجيا التربية' WHERE subject = 'edu' AND topic = 'الإصلاح التربوي المغربي';
-- علوم التربية: «التربية الدامجة وحقوق الطفل» → «سوسيولوجيا التربية»
UPDATE public.questions SET topic = 'سوسيولوجيا التربية' WHERE subject = 'edu' AND topic = 'التربية الدامجة وحقوق الطفل';
-- علوم التربية: «التقويم والدعم» → «طرائق التدريس واستراتيجيات التعليم والتعلم»
UPDATE public.questions SET topic = 'طرائق التدريس واستراتيجيات التعليم والتعلم' WHERE subject = 'edu' AND topic = 'التقويم والدعم';
-- علوم التربية: «التكنولوجيا في التعليم» → «خارج التوصيف»
UPDATE public.questions SET topic = 'خارج التوصيف' WHERE subject = 'edu' AND topic = 'التكنولوجيا في التعليم';
-- علوم التربية: «المقاربات والمفاهيم البيداغوجية» → «من بيداغوجيا الأهداف إلى المقاربة بالكفايات»
UPDATE public.questions SET topic = 'من بيداغوجيا الأهداف إلى المقاربة بالكفايات' WHERE subject = 'edu' AND topic = 'المقاربات والمفاهيم البيداغوجية';
-- علوم التربية: «تدبير القسم» → «دينامية الجماعة»
UPDATE public.questions SET topic = 'دينامية الجماعة' WHERE subject = 'edu' AND topic = 'تدبير القسم';
-- علوم التربية: «نظريات التعلم» → «علم نفس التعلم»
UPDATE public.questions SET topic = 'علم نفس التعلم' WHERE subject = 'edu' AND topic = 'نظريات التعلم';
-- علوم التربية: «وضعيات تطبيقية» → «طرائق التدريس واستراتيجيات التعليم والتعلم»
UPDATE public.questions SET topic = 'طرائق التدريس واستراتيجيات التعليم والتعلم' WHERE subject = 'edu' AND topic = 'وضعيات تطبيقية';

-- ─── التحقق بعد التنفيذ ───
-- التوزيع النهائي لكل مادة (عدد الأسئلة لكل مجال فرعي رسمي):
--   SELECT subject, topic, count(*) FROM public.questions
--   WHERE subject IN ('ar','fr','ma','sc','dar','dfr','dma','dsc','edu')
--   GROUP BY subject, topic ORDER BY subject, count(*) DESC;
-- المواضيع القديمة المتبقية (يجب أن تكون صفراً):
--   SELECT subject, topic, count(*) FROM public.questions
--   WHERE subject IN ('ar','fr','ma','sc','dar','dfr','dma','dsc','edu')
--     AND topic IN ('النحو والإعراب','الإملاء','الصرف','فهم النص','Grammaire',
--                   'Conjugaison','بناء المفهوم والدرس','تخطيط الحصة','وضعيات تطبيقية')
--   GROUP BY subject, topic;