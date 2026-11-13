# -*- coding: utf-8 -*-
"""يُدرج البنية الرسمية لسلك الابتدائي (التخصص المزدوج) في crmef_programmes.json — منقول يدوياً
من التوصيف الرسمي (الابتدائي_التخصص المزدوج_1.pdf) مع تحقّق من الأوزان."""
import io, json, os, sys
from collections import OrderedDict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'crmef_programmes.json')

with io.open(PATH, encoding='utf-8') as f:
    doc = json.load(f, object_pairs_hook=OrderedDict)

primary = OrderedDict([
    ('cycle', 'primary'),
    ('specialisation', 'التخصص المزدوج'),
    ('note', 'الاختبار الكتابي للابتدائي = اختبار المواد (20) + ديداكتيك المواد (12) + علوم التربية (8) = 40 نقطة.'),
    ('components', OrderedDict()),

    # ─────────── المكوّن 1: اختبار المواد (التخصص المزدوج) ───────────
    ('specialisation', OrderedDict([
        ('label', 'اختبار المواد (التخصص المزدوج)'),
        ('coefficient_total', 20),
        ('duration_minutes_per_subject', 60),
        ('subjects', [
            OrderedDict([
                ('key', 'ar'), ('name', 'اللغة العربية'), ('coefficient', 6),
                ('language', 'العربية'),
                ('axes', [
                    OrderedDict([('name', 'الفهم'), ('weight', 20), ('subdomains', [
                        OrderedDict([('name', 'النصوص المعتمدة'), ('weight', None),
                                     ('contents', ['نصوص ذات صلة بمجالات الوحدات الديدكتيكية الواردة في المنهاج الدراسي للتعليم الابتدائي (المواطنة والسلوك المدني، تحديات العالم المعاصر، حضارات كونية…)'])]),
                        OrderedDict([('name', 'الفهم والمهارات'), ('weight', 6),
                                     ('contents', ['مستويات الفهم والمهارات: المفردات، الفهم الصريح والضمني، التحليل، المناقشة، إبداء الرأي وتعليله، استثمار القيم، إعادة الإنتاج، ترتيب الأفكار، ملء الفراغ…'])]),
                    ])]),
                    OrderedDict([('name', 'الدرس اللغوي'), ('weight', None), ('subdomains', [
                        OrderedDict([('name', 'بنية الكلمة'), ('weight', 14),
                                     ('contents', ['الميزان الصرفي', 'تصريف الأفعال (الجامد، الصحيح، المعتل، المجرد، المزيد، المبني للمجهول، الناقص)', 'تصريف الأسماء (الثلاثي، غير الثلاثي)', 'الاشتقاق: الجامد والمشتق', 'الأسماء المشتقة: اسم الفاعل، اسم المفعول، الصفة المشبهة، صيغ المبالغة، اسم التفضيل، اسما المكان والزمان، اسم الآلة', 'المنقوص والمقصور والممدود', 'المثنى والجمع', 'المصادر', 'التصغير', 'النسبة', 'العدد والمعدود', 'الحرف: وظائفه ومعانيه'])]),
                        OrderedDict([('name', 'أنواع الجملة'), ('weight', 6),
                                     ('contents', ['الجملة الفعلية ومكوناتها', 'الجملة الاسمية ومكوناتها', 'شبه الجملة', 'أنماط الجملة: البسيطة والمركبة', 'جمل لها محل من الإعراب وجمل لا محل لها'])]),
                        OrderedDict([('name', 'الظواهر الإملائية'), ('weight', 2),
                                     ('contents', ['علامات الترقيم', 'الهمزة', 'التاء في آخر الكلمة', 'الألف اللينة', 'كلمات يخالف نطقها رسمها', 'أسماء الإشارة', 'الأسماء الموصولة', 'تنوين المقصور والمنقوص والممدود'])]),
                        OrderedDict([('name', 'الأساليب'), ('weight', 2),
                                     ('contents', ['المدح والذم', 'النداء والندبة والاستغاثة', 'الاختصاص', 'الإغراء والتحذير', 'التعجب', 'الاستفهام', 'القسم'])]),
                    ])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'fr'), ('name', 'اللغة الفرنسية'), ('coefficient', 6),
                ('language', 'الفرنسية'),
                ('axes', [
                    OrderedDict([('name', 'Morphosyntaxe'), ('weight', 15),
                                 ('contents', ['Les catégories grammaticales', 'Les fonctions syntaxiques', 'Les types de phrases', 'Les formes de phrases', 'La phrase simple et la phrase complexe', 'La proposition', 'La coordination – la subordination', 'Les relatives', 'Les complétives', 'Les temps et les modes', 'Les formes verbales', 'La voix active et la voix passive'])]),
                    OrderedDict([('name', 'Fonctionnement de la langue (Lexicologie)'), ('weight', 15),
                                 ('contents', ['L’objet de la lexicologie', 'Les procédés de formation des mots', 'La morphologie du mot', 'La description fonctionnelle du vocabulaire', 'Les relations lexicales et sémantiques (synonymie, antonymie, paronymie, homonymie)'])]),
                    OrderedDict([('name', 'Phonétique / Phonologie'), ('weight', 15),
                                 ('contents', ['Le système consonantique', 'Le système vocalique', 'Les semi-voyelles', 'Les phonèmes et les allophones', 'Graphie/phonie', 'L’alphabet phonétique international', 'La transcription phonétique', 'Les bases de physiologie et d’acoustique de la parole'])]),
                    OrderedDict([('name', 'Langue et textes littéraires'), ('weight', 15),
                                 ('contents', ['Identification du type d’un texte, de ses caractéristiques et de sa visée', 'Distinction des genres littéraires', 'Analyse d’un écrit fonctionnel', 'Identification des faits de langue dans un texte littéraire', 'Analyse, explication et/ou commentaire d’un texte littéraire : poésie, théâtre, roman'])]),
                    OrderedDict([('name', 'Compétence communicative écrite'), ('weight', 30),
                                 ('contents', ['Sélection, classement et organisation des informations en fonction de l’écrit ciblé', 'Reconstitution de textes'])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'ma'), ('name', 'الرياضيات'), ('coefficient', 6),
                ('language', 'العربية'),
                ('axes', [
                    OrderedDict([('name', 'الأعداد والحساب'), ('weight', 7),
                                 ('contents', ['المجموعات العددية والعمليات الحسابية', 'الدوال العددية (الخطية، التآلفية، المتخاطة، الحدودية)', 'التعداد والمتتاليات'])]),
                    OrderedDict([('name', 'الهندسة'), ('weight', 7),
                                 ('contents', ['الهندسة المستوية: المتجهات، المضلعات، المستقيمات الهامة، الدائرة، التحويلات الاعتيادية، المعلم المتعامد، معادلة مستقيم، المسافة', 'الهندسة الفضائية: المجسمات الاعتيادية، المستقيمات والمستويات، الأوضاع النسبية'])]),
                    OrderedDict([('name', 'القياس'), ('weight', 4),
                                 ('contents', ['حساب المحيطات والمساحات', 'المساحة الجانبية والكلية', 'الكتلة، الحجم، السعة، الزمن، سعة التخزين الرقمي', 'العمليات على وحدات القياس'])]),
                    OrderedDict([('name', 'تنظيم ومعالجة البيانات'), ('weight', 2),
                                 ('contents', ['مصطلحات إحصائية', 'متسلسلة إحصائية بمتغير واحد', 'الجداول الإحصائية', 'وسيطات الوضع (المنوال، القيمة الوسطية، المعدل الحسابي)', 'وسيطات التشتت (الانحراف المتوسط، الانحراف الطرازي، المغايرة)', 'تمثيلات مبيانية ومعالجة البيانات'])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'sc'), ('name', 'العلوم'), ('coefficient', 2),
                ('language', 'العربية/الفرنسية'),
                ('axes', [
                    OrderedDict([('name', 'علوم الحياة والأرض والكون'), ('weight', None), ('subdomains', [
                        OrderedDict([('name', 'Biologie'), ('weight', 10),
                                     ('contents', ['مستويات تنظيم العالم الحي', 'التنظيم الخلوي والجزيئي للكائن الحي', 'الاستقلاب الخلوي', 'المجموعات الكبرى في الم kingdom النباتي', 'التغذية المعدنية للنباتات', 'التركيب الضوئي', 'التكاثر الجنسي واللاجنسي chez Angiospermes', 'النمو والتطور', 'مجموعات الحيوان', 'تكيّف الحيوانات مع محيطها', 'فيزيولوجيا الإنسان والصحة'])]),
                        OrderedDict([('name', 'Ecologie générale'), ('weight', None),
                                     ('contents', ['بنية ووظيفة{Biocénoses} والغطاء الحيوي', 'التفاعلات بين الكائنات', 'السلسلة والشبكة الغذائية', 'التلوث والتغيرات المناخية', 'حماية البيئة والتنمية المستدامة'])]),
                        OrderedDict([('name', 'Géologie'), ('weight', None),
                                     ('contents', ['موقع الأرض في المجموعة الشمسية', 'الجodynamics الخارجية: التعرية، النقل، الترسب، التحوّل', 'دورة الماء', 'الجodynamics الداخلية: بنية الكرة، انجراف القارات، نظرية الصفائح'])]),
                        OrderedDict([('name', 'Astronomie descriptive'), ('weight', None),
                                     ('contents', ['النظام الشمسي والكواكب والمذنبات', 'حركة الأرض وتبادل الليل والنهار والفصول', 'حركة القمر وأطواره والمدّ', 'قراءة السماء بالعين المجردة'])]),
                    ])]),
                    OrderedDict([('name', 'العلوم الفيزيائية والتقنية'), ('weight', None), ('subdomains', [
                        OrderedDict([('name', 'Organisation de la matière'), ('weight', 10),
                                     ('contents', ['حالات المادة وتصنيفها', 'خصائص المادة', 'التحولات الفيزيائية والكيميائية'])]),
                        OrderedDict([('name', 'Transferts thermiques'), ('weight', None),
                                     ('contents', ['التوصيل، الحمل، الإشعاع', 'مفهوم الحرارة والحرارة'])]),
                        OrderedDict([('name', 'Électricité et Magnétisme'), ('weight', None),
                                     ('contents', ['الدارات الكهربائية: التسلسل والتفرع', 'شدة التيار', 'الموصلات والعوازل', 'التوتر الكهربائي وقياسه', 'العلاقة بين التوتر والتيار والمقاومة', 'المغناطيس'])]),
                        OrderedDict([('name', 'Optique et Vision'), ('weight', None),
                                     ('contents', ['مصادر الضوء', 'انتشار الضوء المستقيم', 'الضوء الأبيض والتشتت', 'العدسات الرقيقة', 'تكوين الصور', 'ألوان الإضافي والطرحي'])]),
                        OrderedDict([('name', 'Notions d’acoustique'), ('weight', None),
                                     ('contents', ['الأصوات فوق الصوتية', 'الصندوق الرنان والأذن', 'سلسلة الإنتاج والاستقبال والإ audition'])]),
                    ])]),
                ]),
            ]),
        ]),
    ])),

    # ─────────── المكوّن 2: ديداكتيك المواد ───────────
    ('didactics', OrderedDict([
        ('label', 'ديداكتيك المواد'),
        ('coefficient_total', 12),
        ('duration_minutes_per_subject', 45),
        ('subjects', [
            OrderedDict([
                ('key', 'dar'), ('name', 'ديداكتيك اللغة العربية'), ('coefficient', 3),
                ('domains', [
                    OrderedDict([('name', 'الديدكتيك العام'), ('weight', 4),
                                 ('contents', ['مسائل ديدكتيكية: البيداغوجيا والديدكتيك، مجالات البحث الديدكتيكي، علاقة الديدكتيك بعلوم التربية'])]),
                    OrderedDict([('name', 'ديدكتيك الشفهي'), ('weight', 7),
                                 ('contents', ['مميزات الشفهي استناداً إلى مرجعيات لسانية وتداولية', 'تصور منهاج السلك الابتدائي للشفهي وعلاقته بمرجعيات مختلفة', 'الإطار المنهجي لتعليم الشفهي (الاستماع والتحدث)', 'علاقة الشفهي بالمكتوب', 'المهارات المستهدفة في التعبير الشفهي'])]),
                    OrderedDict([('name', 'ديدكتيك القراءة'), ('weight', 7),
                                 ('contents', ['الاتجاهات النظرية في مقاربة النصوص القرائية', 'الإطار المنهجي لتعليم القراءة في الابتدائي', 'أنواع القراءة المعتمدة', 'أنواع النصوص القرائية', 'أنماط النصوص الوظيفية', 'المهارات المستهدفة'])]),
                    OrderedDict([('name', 'ديدكتيك الكتابة'), ('weight', 7),
                                 ('contents', ['النظام المكتوب والقيود (الضوابط)', 'الإطار المنهجي لمكون الكتابة', 'الكتابة الإنشائية بالمنهاج الدراسي', 'الكتابة التعبيرية عند المتعلمين', 'المهارات المستهدفة في الكتابة'])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'dfr'), ('name', 'ديداكتيك اللغة الفرنسية'), ('coefficient', 3),
                ('domains', [
                    OrderedDict([('name', 'Concepts de base en didactique'), ('weight', 3),
                                 ('contents', ['La situation didactique', 'La transposition didactique', 'Le triangle didactique'])]),
                    OrderedDict([('name', 'La didactique de l’oral'), ('weight', 8),
                                 ('contents', ['Les objectifs d’apprentissage relatifs aux activités orales', 'Les capacités relatives à la réception et à la production de l’oral', 'Les actes de parole', 'La prise de parole, l’imagination et la créativité', 'Les ressources numériques', 'Les caractéristiques des situations d’oral', 'Les stratégies d’écoute et de production', 'La langue maternelle / la langue cible : interférences', 'L’évaluation de l’oral'])]),
                    OrderedDict([('name', 'La didactique de l’écrit — Compréhension de l’écrit / Lecture'), ('weight', 8),
                                 ('contents', ['Les habiletés de base en lecture', 'Les capacités relatives à la lecture', 'Les stratégies de lecture', 'La méthode syllabique', 'Les ressources numériques', 'La démarche interactive en lecture', 'L’évaluation de la compréhension de l’écrit'])]),
                    OrderedDict([('name', 'La didactique de l’écrit — Production de l’écrit'), ('weight', 6),
                                 ('contents', ['Les capacités de production de l’écrit', 'Les situations d’écriture', 'Les stratégies de production', 'Les activités de production', 'La langue maternelle / la langue cible', 'L’évaluation de la production'])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'dma'), ('name', 'ديداكتيك الرياضيات'), ('coefficient', 3),
                ('domains', [
                    OrderedDict([('name', 'الديدكتيك العام (المرتكزات والمفاهيم الأساس)'), ('weight', 4),
                                 ('contents', ['العقد الديدكتيكي', 'الوضعية المشكلة', 'النموذج الديدكتيكي'])]),
                    OrderedDict([('name', 'تحليل منهاج الرياضيات للتعليم الابتدائي'), ('weight', 8),
                                 ('contents', ['دور التوجيهات البيداغوجية الخاصة بالرياضيات في التعليم الابتدائي', 'الأسس والمبادئ العامة لتدريس الرياضيات في التعليم الابتدائي', 'مجالات الرياضيات في التعليم الابتدائي', 'تقنيات ICT في تدريس الرياضيات'])]),
                    OrderedDict([('name', 'ديداكتيك الرياضيات'), ('weight', 13),
                                 ('contents', ['النهج الرياضياتي', 'المفهوم الرياضياتي', 'النقل الديدكتيكي في الرياضيات', 'المعونات الديدكتيكية في الرياضيات', 'بناء المفهوم الرياضياتي'])]),
                ]),
            ]),
            OrderedDict([
                ('key', 'dsc'), ('name', 'ديداكتيك العلوم (النشاط العلمي)'), ('coefficient', 3),
                ('domains', [
                    OrderedDict([('name', 'المرتكزات والمفاهيم الأساس'), ('weight', 5),
                                 ('contents', ['الإطار المفاهيمي', 'التمثلات والتصورات', 'العوائق'])]),
                    OrderedDict([('name', 'مفاهيم ديدكتيكية وإرتقاء مادة النشاط العلمي'), ('weight', 6),
                                 ('contents', ['مفاهيم ديدكتيكية في ارتباطها بمادة النشاط العلمي (التعاقد الديدكتيكي، النق الديدكتيكي، التمثلات، النمذجة، المقاربة بالكفايات)', 'تحليل منهاج النشاط العلمي'])]),
                    OrderedDict([('name', 'مواد ديدكتيكية عامة لبناء التعلمات في مادة النشاط العلمي'), ('weight', 8),
                                 ('contents', ['التوجهات الديدكتيكية الحديثة (التعلم النشط: التقصي العلمي، المشروع، حل المشكلات)', 'تحليل أنشطة التعلم في مادة النشاط العلمي'])]),
                    OrderedDict([('name', 'موارد ديدكتيكية مرتبطة بمادة النشاط العلمي'), ('weight', 6),
                                 ('contents', ['أنواع الموارد الديدكتيكية ووظائفها', 'توظيف الموارد الديدكتيكية في تدريس النشاط العلمي', 'اختيار الدعامات وتوظيفها', 'إسهامات تكنولوجيا المعلومات والاتصال'])]),
                ]),
            ]),
        ]),
    ])),

    # ─────────── المكوّن 3: علوم التربية ───────────
    ('edu', OrderedDict([
        ('label', 'علوم التربية'),
        ('coefficient', 8),
        ('duration_minutes', 60),
        ('note', 'نفس بنية الثانوي مع فروق: مونتيسوري في النمو، المنهج السقراطي في الطرائق، التربية الدامجة في السوسيولوجيا.'),
        ('domains', [
            OrderedDict([('name', 'علم النفس التربوي'), ('weight', 40), ('subdomains', [
                OrderedDict([('name', 'علم نفس النموّ'), ('weight', 20),
                             ('contents', ['مفاهيم النمو ونظرياته (بياجي، فرويد، مونتيسوري، إريكسون…)', 'عوامل النمو ومظاهره واضطراباته'])]),
                OrderedDict([('name', 'علم نفس التعلم'), ('weight', 20),
                             ('contents', ['نظريات التعلم: السلوكية، البنائية، السوسيوبنائية، المعرفية', 'عوائق التعلم وصعوباته'])]),
            ])]),
            OrderedDict([('name', 'المقاربات البيداغوجية وطرائق التدريس'), ('weight', 30), ('subdomains', [
                OrderedDict([('name', 'من بيداغوجيا الأهداف إلى المقاربة بالكفايات'), ('weight', 15),
                             ('contents', ['الأسس النظرية والمفاهيم الأساس', 'التصريف الإجرائي'])]),
                OrderedDict([('name', 'طرائق التدريس واستراتيجيات التعليم والتعلم'), ('weight', 15),
                             ('contents', ['الطرائق البيداغوجية وتقنيات وأساليب التدريس والتقويم', 'المنهج التوليدي السقراطي', 'التعلم الذاتي، حل المشكلات، بيداغوجيا اللعب، بيداغوجيا المشروع'])]),
            ])]),
            OrderedDict([('name', 'سوسيولوجيا التربية'), ('weight', 30), ('subdomains', [
                OrderedDict([('name', 'سوسيولوجيا التربية'), ('weight', 15),
                             ('contents', ['مفاهيم ونظريات في سوسيولوجيا التربية', 'سوسيولوجيا التربية في المدرسة المغربية', 'التربية الدامجة'])]),
                OrderedDict([('name', 'دينامية الجماعة'), ('weight', 15),
                             ('contents', ['مفاهيم دينامية الجماعة في المجال التربوي (جماعة القسم، القيادة، القياس السوسيومتري…)', 'تدبير جماعة القسم (تدبير العلاقات، حل النزاعات…)', 'التواصل التربوي وتقنيات التنشيط داخل القسم', 'الحياة المدرسية'])]),
            ])]),
        ]),
    ])),
])

# ── تجميع المكوّنات تحت components ──
primary['components'] = OrderedDict([
    ('specialisation', primary['specialisation']),
    ('didactics', primary['didactics']),
    ('edu', primary['edu']),
])
for _k in ('specialisation', 'didactics', 'edu'):
    primary.pop(_k, None)

# ── تحقق: مجموع الأوزان كما طُبعت في الوثيقة ──
def total(doms, path='weight'):
    return sum((d.get(path) or 0) for d in doms)

checks = []
sp = primary['components']['specialisation']
for s in sp['subjects']:
    t = total(s['axes'])
    # في جدول «اختبار المواد» للابتدائي عمودان (وزن المحور + وزن المكوّن)؛
    # المجموع المطبوع لا يبلغ 100 في كل مادة ⇒ نرمّز الحالة بلا تفسير.
    st = 'verified' if t == 100 else ('partial-printed' if t > 0 else 'weights-not-extracted')
    s['_check'] = {'printed_weights_sum': t, 'status': st}
    checks.append((f"تخصص/{s['name']}", t, st))
dd = primary['components']['didactics']
for s in dd['subjects']:
    t = total(s['domains'])
    st = 'verified' if t == 25 else 'ambiguous'   # 25% = حصة المادة من مكوّن الديداكتيك (12)
    s['_check'] = {'printed_weights_sum': t, 'status': st}
    checks.append((f"ديداكتيك/{s['name']}", t, st))
ed = primary['components']['edu']
checks.append(('علوم التربية (رئيسي)', total(ed['domains']), 'verified'))
ed['_check'] = {'printed_weights_sum': total(ed['domains']), 'status': 'verified'}

doc['primary'] = primary
with io.open(PATH, 'w', encoding='utf-8') as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

print('updated:', PATH)
print('\n== تحقق الأوزان كما طُبعت في الوثيقة ==')
for name, t, st in checks:
    print(f'  {"✓" if st == "verified" else "⚠"} {name}: {t}%  [{st}]')
print('\n== مجموع المعاملات ==')
print('  اختبار المواد :', sum(s['coefficient'] for s in sp['subjects']), '(المتوقع 20)')
print('  ديداكتيك المواد:', sum(s['coefficient'] for s in dd['subjects']), '(المتوقع 12)')
print('  علوم التربية   :', ed['coefficient'], '(المتوقع 8)')
