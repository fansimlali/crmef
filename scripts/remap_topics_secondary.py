# -*- coding: utf-8 -*-
"""
توحيد مواضيع بنك CRMEF الثانوي مع المجالات الفرعية الرسمية من التوصيفات.

الواقع: بنك الثانوي لا يحتوي مواد ديداكتيك منفردة — أسئلة التخصص والديداكتيك
مدموجة داخل subject واحد لكل تخصص (sec_*). لذلك توحّد هنا المجالان معاً
(المجال الفرعي الرسمي يضم عناصره الديدكتيكية).

المخرجات:
  sql/crmef_topics_secondary.sql
  reports/crmef_topics_secondary.md

ملاحظة: المحاور التي لا تجد مقابلاً في التوصيف تُنقل إلى «خارج التوصيف» (لا تُحذف).
"""
import io, json, os, re, sys
from collections import defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'questions_seed.json')
SQL_OUT = os.path.join(ROOT, 'sql', 'crmef_topics_secondary.sql')
REP_OUT = os.path.join(ROOT, 'reports', 'crmef_topics_secondary.md')

# ════════════════════════════════════════════════════════════════════
# 1) المحاور الرسمية داخل كل تخصص (من التوصيف الرسمي — دورة نونبر 2026)
#    (اسم المجال الفرعي الرسمي، الوزن)
# ════════════════════════════════════════════════════════════════════
OFFICIAL = {}

OFFICIAL['sec_philo'] = {
    'المجال 1': 'محددات التفكير الفلسفي',
    'المجال 2': 'الفلسفة وآلياتها',
    'المجال 3': 'المسار التاريخي للفكر الفلسفي',
    'المجال 4': 'مباحث فلسفية',
    'المجال 5': 'العلوم الإنسانية',
    'المجال 6': 'مؤلفات فلسفية',
    'المجال 7': 'اللغات والترجمة',
}

OFFICIAL['sec_islamic'] = {
    'القرآن الكريم والحديث الشريف وعلومهما': None,
    'القرآن الكريم وعلومه': None,
    'الحديث النبوي الشريف وعلومه': None,
    'العقيدة الإسلامية': None,
    'علم العقيدة': None,
    'الفقه الإسلامي': None,
    'أصول الفقه ومقاصد الشريعة': None,
    'تاريخ التشريع': None,
    'السيرة': None,
    'السيرة النبوية': None,
    'الخلافة الراشدة': None,
    'القيم وثوابت الأمة المغربية': None,
    'الفكر التربوي الإسلامي': None,
    'الفكر الإسلامي وثقافة الحوار الحضاري': None,
}
OFFICIAL['sec_islamic'] = {v: None for v in [
    'القرآن الكريم وعلومه', 'الحديث النبوي الشريف وعلومه', 'العقيدة الإسلامية',
    'أصول الفقه ومقاصد الشريعة', 'تاريخ التشريع', 'الفقه الإسلامي',
    'السيرة النبوية', 'الخلافة الراشدة',
    'القيم وثوابت الأمة المغربية', 'الفكر التربوي الإسلامي', 'الفكر الإسلامي وثقافة الحوار الحضاري',
]}

OFFICIAL['sec_hist_geo'] = {
    'تاريخ شمال إفريقيا والمغرب': None,
    'تاريخ العالم الإسلامي': None,
    'تاريخ أوربا والعالم': None,
    'الجغرافيا الطبيعية': None,
    'الجغرافيا البشرية والاقتصادية': None,
    'المواطنة والدستور': None,
}

OFFICIAL['sec_ar'] = {
    'اللسانيات': None,
    'الصوتيات والصواتة': None,
    'المعجم': None,
    'الصرف والنحو': None,
    'فقه اللغة': None,
    'اللسانيات العامة والتطبيقية': None,
    'السيميائيات وتحليل الخطاب': None,
    'العروض والبلاغة': None,
    'الدراسات الأدبية والنقد': None,
    'الشعر العربي': None,
    'قراءة النص المسرحي': None,
}

OFFICIAL['sec_fr'] = {
    'Grammaire': 'Morphosyntaxe',
    'Conjugaison': 'Morphosyntaxe',
    'Accords': 'Morphosyntaxe',
    'Orthographe et homophones': 'Phonétique / Phonologie',
}

OFFICIAL['sec_eng'] = {
    'القراءة والاستيعاب (Lecture/Compréhension)': 'Compétence communicative',
    'الكتابة (Production écrite)': 'Compétence communicative',
}

OFFICIAL['sec_math'] = {
    'التحليل ودراسة الدوال': 'Analyse des fonctions',
    'الهندسة': 'Géométrie',
    'الجبر': 'Algèbre',
    'الاحتمالات والتعداد': 'Probabilités et dénombrement',
    'الإحصاء': 'Statistiques',
    'الصرفية في Z': 'Arithmétique dans Z',
}

OFFICIAL['sec_physics'] = {
    'الميكانيك': 'Mécanique',
    'الكهرباء': 'Électricité',
    'الموجات والضوء': 'Ondes et lumière',
    'الكيمياء': 'Chimie',
}

OFFICIAL['sec_svt'] = {
    'الخلية والوراثة': 'Cellule et génétique',
    'علوم الأرض (Géologie)': 'Géologie',
    'الفسيولوجيا والعضلية': 'Physiologie',
    'المناعة والبيئة': 'Immunologie et environnement',
}

OFFICIAL['sec_cs'] = {
    'البرمجة': 'Algorithmique et programmation',
    'قواعد البيانات': 'Bases de données',
    'الشبكات': 'Réseaux',
    'أمن المعلومات': 'Sécurité informatique',
    'أثرمية الحاسوب': 'Fonctionnalité des systèmes',
    'الذكاء الاصطناعي': 'Intelligence artificielle',
}

OFFICIAL['sec_eco'] = {
    'المحاسبة': 'Comptabilité',
    'الاقتصاد الكلي': 'Macroéconomie',
    'القانون والتدبير': 'Droit et management',
    'الاقتصاد العام': 'Économie',
    'التمويل والتسويق': 'Finance et marketing',
}

OFFICIAL['sec_pe'] = {
    'الفسيولوجيا والجهد البدني': 'Physiologie de l’effort',
    'الرياضات الجماعية': 'Sports collectifs',
    'ألعاب القوى': 'Athlétisme',
    'التشريح': 'Anatomie',
    'التغذية': 'Nutrition',
    'ديداكتيك التربية البدنية والرياضية': 'Didactique EPS',
}

OFFICIAL['sec_te'] = {
    'الكهرباء': 'Électrotechnique',
    'المقاربة المنهجية': 'Méthodologie',
    'الرسم الصناعي (Dessin technique)': 'Dessin technique',
    'الميكانيك (Mécanique)': 'Mécanique',
    'التحليل الوظيفي SADT': 'Analyse fonctionnelle',
}

# ════════════════════════════════════════════════════════════════════
# 2) تطبيع للمطابقة (ألف، تاء مربوطة، ياء) — يجعل التطابق متيناً
# ════════════════════════════════════════════════════════════════════
_INVISIBLE = str.maketrans({'\u200f': '', '\u200e': '', '\u200d': '', '\ufeff': ''})


def _norm_ar(s):
    if not s:
        return ''
    s = str(s).translate(_INVISIBLE)
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا').replace('ٱ', 'ا')
    s = s.replace('ة', 'ه').replace('ى', 'ي')
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s


# ════════════════════════════════════════════════════════════════════
# 3) قواعد تصنيف بالكلمات المفتاحية (تطبَّق على المواضيع غير الموحَّدة)
#    (subject → list of (keywords, target))
# ════════════════════════════════════════════════════════════════════
KEYWORD_RULES = {
    'sec_ar': [
        (['نحو', 'اعراب', 'جملة', 'مبتدا', 'خبر', 'فاعل', 'مفعول', 'تمييز', 'حال'], 'الصرف والنحو'),
        (['صرف', 'اشتقاق', 'صيغ', 'اسم الفاعل'], 'الصرف والنحو'),
        (['بلاغة', 'عروض', 'قافية', 'نقد ادبي'], 'العروض والبلاغة'),
        (['أدب', 'شعر', 'ادب', 'قصيد', 'نثر', 'مسرحي', 'رواية'], 'الشعر العربي'),
        (['لسانيات', 'النحو', 'قواعد'], 'الصرف والنحو'),
    ],
    'sec_fr': [
        (['grammaire', 'conjugaison', 'accord', 'orthographe', 'syntaxe', 'auxiliaire', 'participe', 'temps', 'pronom', 'adjectif', 'adverbe', 'phrase', 'proposition'], 'Morphosyntaxe'),
        (['figure', 'style', 'registre', 'littér', 'theorie', 'narratologie', 'roman', 'mouvement', 'mouvement', 'littérature', 'versification', 'analyse', 'contemplation', 'romantisme', 'naturalisme', 'realisme'], 'Langue et textes littéraires'),
        (['vocabulaire', 'lexique', 'sémantique', 'champ lexical', 'synonyme', 'antonyme', 'affixe', 'préfixe', 'suffixe'], 'Lexicographie'),
        (['écrit', 'ecrit', 'rédaction', 'redaction', 'production', 'comprendre', 'compréhension'], 'Compétence communicative écrite'),
        (['oral', 'expression', 'parole', 'prononciation'], "La didactique de l'oral"),
    ],
    'sec_eng': [
        (['grammar', 'tense', 'verb', 'adjective', 'adverb', 'noun', 'relative', 'passive', 'active voice', 'conditional', 'inversion', 'article', 'determiner', 'quantifier', 'wish', 'regret', 'question', 'preposition', 'conjunction', 'clause', 'participle', 'infinitive', 'gerund'], 'Morphosyntaxe'),
        (['vocabulary', 'word formation', 'prefix', 'suffix', 'collocation', 'synonym', 'antonym', 'idiom', 'phrasal', 'linking', 'concession', 'structure'], 'Lexicographie'),
        (['elt methodology', 'sla', 'lesson planning', 'assessment', 'error correction', 'classroom management', 'teaching profession'], 'Skills & Components (ديداكتيك اللغة الإنجليزية)'),
        (['phonetic', 'pronunciation', 'sound'], 'Language and cultural awareness'),
        (['function', 'functions'], 'Language Functions'),
        (['reading', 'compre'], 'Compétence communicative'),
        (['writing', 'essay', 'paragraph', 'written'], 'Compétence communicative'),
        (['oral', 'speaking', 'speech', 'fluency', 'listening'], "La didactique de l'oral"),
    ],
    'sec_math': [
        (['هندسة', 'مستقيم', 'دائره', 'زاوية', 'دائرة', 'مستطيل', 'مثلث', 'مجسم', 'حجوم', 'اشعاع', 'زوايا', 'احداثيات', 'متجهات', 'دائرة محيطه'], 'Géométrie'),
        (['دوال', 'دالة', 'اشتقاق', 'تكامل', 'متتاليات', 'حدود', 'اشتقاقية'], 'Analyse des fonctions'),
        (['احتمال', 'احتمالات', 'تعداد'], 'Probabilités et dénombrement'),
        (['احصاء', 'إحصاء', 'تشتت', 'متوسط', 'وسيط', 'منوال', 'تباين', 'انحراف'], 'Statistiques'),
        (['جبر', 'عقدية', 'معقدة', 'معادلات', 'كسور', 'جذر', 'جذور', 'متراجح', 'متراجحة', 'مجموعة'], 'Algèbre'),
        (['قابلية', 'قسمة', 'أولية', 'ارضية', 'أوليه'], 'Arithmétique dans Z'),
        (['تناسبية', 'نسبة', 'نسبة مئوية'], 'Algèbre'),
    ],
    'sec_physics': [
        (['كيمياء', 'كيميائي', 'حمض', 'قاعدة', 'تفاعل', 'أكسدة', 'اختزال', 'مادة', 'ذرة', 'نظير', 'جزيء', 'تساهم'], 'Chimie'),
        (['ميكانيك', 'حركة', 'سرعة', 'تسارع', 'قوة', 'نيوتن', 'كتلة', 'سقوط', 'اهتزاز', 'دور', 'تردد'], 'Mécanique'),
        (['كهرباء', 'كهربائي', 'تيار', 'توتر', 'مقاومة', 'مقاومة', 'قطب', 'مكثف', 'وشيعة', 'مولد'], 'Électricité'),
        (['موجة', 'موجات', 'ضوء', 'ضوئي', 'انكسار', 'انطفاء', 'لون', 'أشعة'], 'Ondes et lumière'),
        (['نووي', 'نشاط اشعاعي', 'انشطار', 'اندماج'], 'Mécanique'),
    ],
    'sec_svt': [
        (['خلية', 'وراث', 'ADN', 'جين', 'كروموسوم', 'تكاثر', 'انشقاق', 'تضاعف', 'انقسام', 'مندلي', 'انتقال', 'وراثية'], 'Cellule et génétique'),
        (['جيولوجيا', 'صخرة', 'صفائح', 'تكتونية', 'براكين', 'زلزال', 'اهتزاز', 'صفيحة'], 'Géologie'),
        (['مناعة', 'مناعي', 'أجسام مضادة', 'لمفاوية'], 'Immunologie et environnement'),
        (['فسيولوجيا', 'عضلي', 'عضل', 'جهاز', 'دم', 'هرمون', 'عصب', 'تنفس', 'هضمي'], 'Physiologie'),
        (['بيئة', 'مسار', 'احتباس', 'كربون', 'كائنات حية', 'كائنات', 'توازن'], 'Immunologie et environnement'),
        (['تركيب ضوئي', 'كلوروفيل', 'ATP', 'تحلل'], 'Cellule et génétique'),
    ],
    'sec_cs': [
        (['برمج', 'بايثون', 'java', 'c++', 'خوارزمية', 'برم'], 'Algorithmique et programmation'),
        (['قاعدة', 'SQL', 'قواعد بيانات', 'جدول'], 'Bases de données'),
        (['شبكة', 'شبكات', 'router', 'switch', 'IP'], 'Réseaux'),
        (['أمن', 'تشفير', 'هجمات', 'اختراق'], 'Sécurité informatique'),
        (['حاسوب', 'معال', 'منطق', 'ثنائي', 'خوارزمي', 'نظام تشغيل'], 'Fonctionnalité des systèmes'),
        (['ذكاء', 'تعلم آلة', 'اصطناعي'], 'Intelligence artificielle'),
        (['ويب', 'CSS', 'JavaScript'], 'Algorithmique et programmation'),
    ],
    'sec_te': [
        (['كهرباء', 'ترانزيستور', 'متحكم', 'اردوينو', 'أردوينو', 'PWM', 'محرك'], 'Électrotechnique'),
        (['رسم', 'مخطط', 'دائرة', 'ورق'], 'Dessin technique'),
        (['ميكانيك', 'ميكانيكي', 'تروس', 'حزام', 'محامل', 'عجلة'], 'Mécanique'),
        (['سلسلة', 'وظيفي', 'SADT', 'متطلبات', 'دفتر'], 'Analyse fonctionnelle'),
        (['تصنيع', 'قش', 'خراطة', 'CNC'], 'Dessin technique'),
    ],
    'sec_pe': [
        (['جماعي', 'كرة', 'كرة يد', 'كرة سلة', 'كرة طائرة', 'استراتيجية', 'دفاعي', 'هجومي'], 'Sports collectifs'),
        (['قوي', 'ركض', 'سباق', 'وثب', 'رمي', 'قفز', 'حواجز'], 'Athlétisme'),
        (['فسيولوجيا', 'مجهود', 'قلب', 'دم', 'طاقة', 'حمض', 'لاكتيك'], 'Physiologie de l’effort'),
        (['تشريحي', 'عضلي', 'عظم', 'وتر', 'مفصل'], 'Anatomie'),
        (['تغذية', 'ماء', 'هضم'], 'Nutrition'),
        (['ديداكتيك', 'كفاية', 'درس', 'برنامج', 'مشروع', 'تقويم', 'ارشاد', 'ميثاق'], 'Didactique EPS'),
        (['صحة', 'تعبئة', 'بيئي', 'نشاط خارجي'], 'Nutrition'),
    ],
    'sec_islamic': [
        (['اسرة', 'أسرة', 'زواج', 'طلاق', 'وصية', 'تركة'], 'الفقه الإسلامي'),
        (['قسط', 'حقوق', 'بيئة', 'ظلم'], 'القيم وثوابت الأمة المغربية'),
        (['حكمة', 'إصلاح'], 'الفكر التربوي الإسلامي'),
        (['اصول الفقه', 'ألفاظ', 'نهي', 'امر'], 'أصول الفقه ومقاصد الشريعة'),
        (['تاريخ التشريع', 'مذاهب فقهية'], 'تاريخ التشريع'),
        (['اجتهاد', 'تجديد', 'قياس'], 'الفكر التربوي الإسلامي'),
        (['فكر معاصر', 'الحاد', 'إلحاد', 'حرية'], 'العقيدة الإسلامية'),
        (['سيرة', 'شمائل'], 'السيرة النبوية'),
        (['خلافة', 'فتوحات'], 'الخلافة الراشدة'),
    ],
}


def classify_by_keyword(subject, topic):
    rules = KEYWORD_RULES.get(subject)
    topic_n = _norm_ar(topic).replace('ا', '')
    if rules:
        for kws, target in rules:
            for kw in kws:
                if _norm_ar(kw).replace('ا', '') in topic_n:
                    return target
    # تسوية افتراضية — تُوسم في التقرير
    return DEFAULT_MAP.get(subject)

# ════════════════════════════════════════════════════════════════════
# 4) جدول التحويل (الموضوع الحالي → المجال الفرعي الرسمي)
# ════════════════════════════════════════════════════════════════════
MAP = {
    'sec_philo': {
        'المعرفة': 'محددات التفكير الفلسفي',
        'السياسة': 'مباحث فلسفية',
        'الوجود الإنساني': 'مباحث فلسفية',
        'الأخلاق': 'مباحث فلسفية',
        'فلاسفة الإسلام والمغرب': 'المسار التاريخي للفكر الفلسفي',
        'المنهجية الفلسفية': 'الفلسفة وآلياتها',
    },
    'sec_islamic': {
        'القرآن الكريم': 'القرآن الكريم وعلومه',
        'علوم القرآن والتفسير': 'القرآن الكريم وعلومه',
        'القرآن وعلومه': 'القرآن الكريم وعلومه',
        'علوم القرآن': 'القرآن الكريم وعلومه',
        'الحديث النبوي': 'الحديث النبوي الشريف وعلومه',
        'علوم الحديث والمصطلح': 'الحديث النبوي الشريف وعلومه',
        'العبادات': 'الفقه الإسلامي',
        'العقيدة الإسلامية وقضايا الفكر': 'العقيدة الإسلامية',
        'أصول الفقه وقواعده': 'أصول الفقه ومقاصد الشريعة',
        'أصول الفقه': 'أصول الفقه ومقاصد الشريعة',
        'أصول الفقه ومقاصد الشريعة': 'أصول الفقه ومقاصد الشريعة',
        'مقاصد الشريعة': 'أصول الفقه ومقاصد الشريعة',
        'فقه الأسرة والميراث': 'الفقه الإسلامي',
        'فقه الأسرة والوصية والتركة': 'الفقه الإسلامي',
        'فقه الأسرة وحقوق الأولاد': 'الفقه الإسلامي',
        'فقه المعاملات المالية': 'الفقه الإسلامي',
        'فقه المعاملات وحرمة الغش': 'الفقه الإسلامي',
        'فقه العبادات ومقاصدها': 'الفقه الإسلامي',
        'السيرة النبوية': 'السيرة النبوية',
        'السيرة النبوية والشمائل': 'السيرة النبوية',
        'السيرة النبوية وحجة الوداع': 'السيرة النبوية',
        'الأنبياء والرسل': 'السيرة النبوية',
        'الخلفاء الراشدون': 'الخلافة الراشدة',
        'تاريخ الإسلام والخلافة الراشدة': 'الخلافة الراشدة',
        'الإعجاز القرآني ووجوهه': 'القرآن الكريم وعلومه',
        'علوم القرآن وأسباب النزول': 'القرآن الكريم وعلومه',
        'القراءات القرآنية بالمغرب': 'القرآن الكريم وعلومه',
        'علوم القرآن ورسم المصحف': 'القرآن الكريم وعلومه',
        'الثوابت الدينية والوطنية بالمغرب': 'القيم وثوابت الأمة المغربية',
        'إمارة المؤمنين والوظيفة الشرعية': 'القيم وثوابت الأمة المغربية',
        'فكرت التجديد في الفكر الإسلامي': 'الفكر الإسلامي وثقافة الحوار الحضاري',
        'قضايا الفكر المعاصر والإلحاد': 'العقيدة الإسلامية',
        'الاجتهاد والتجديد الفقهي': 'الفكر التربوي الإسلامي',
        'الفكر الإسلامي وحوار الحضارات': 'الفكر الإسلامي وثقافة الحوار الحضاري',
        'الأخلاق': 'القيم وثوابت الأمة المغربية',
        'الثوابت': 'القيم وثوابت الأمة المغربية',
        'التزكية والقيم والأخلاق': 'القيم وثوابت الأمة المغربية',
        'ديداكتيك التربية الإسلامية': 'الفكر التربوي الإسلامي',
        'ديداكتيك التربية الإسلامية والتقويم': 'الفكر التربوي الإسلامي',
        'ديداكتيك التربية الإسلامية وبناء الكفايات': 'الفكر التربوي الإسلامي',
        'أخلاقيات مهنة التدريس في الإسلام': 'الفكر التربوي الإسلامي',
    },
    'sec_hist_geo': {
        'تاريخ المغرب': 'تاريخ شمال إفريقيا والمغرب',
        'تاريخ العالم': 'تاريخ أوربا والعالم',
        'التاريخ العالمي': 'تاريخ العالم الإسلامي',
        'الجغرافيا الطبيعية': 'الجغرافيا الطبيعية',
        'الجغرافيا البشرية والاقتصادية': 'الجغرافيا البشرية والاقتصادية',
        'جغرافيا المغرب': 'الجغرافيا البشرية والاقتصادية',
        'جغرافيا عامة': 'الجغرافيا الطبيعية',
        'المنهجية والخرائط': 'الجغرافيا الطبيعية',
        'المواطنة والدستور': 'المواطنة والدستور',
        'التاريخ': 'تاريخ أوربا والعالم',
    },
    'sec_ar': {
        'النحو والإعراب': 'الصرف والنحو',
        'الصرف والتحويل': 'الصرف والنحو',
        'الصرف': 'الصرف والنحو',
        'تاريخ الأدب والنصوص': 'الشعر العربي',
        'الشعر العربي القديم والحديث': 'الشعر العربي',
        'الشعر العربي': 'الشعر العربي',
        'البلاغة والنقد': 'العروض والبلاغة',
        'البلاغة': 'العروض والبلاغة',
        'العروض والقافية': 'العروض والبلاغة',
        'الإملاء': 'فقه اللغة',
        'المعجم والدلالة': 'المعجم',
        'الأساليب': 'الشعر العربي',
        'قواعد متنوعة': 'الصرف والنحو',
        'الخط والإملاء': 'فقه اللغة',
    },
    'sec_fr': {
        'Grammaire': 'Morphosyntaxe',
        'Conjugaison': 'Morphosyntaxe',
        'Accords': 'Morphosyntaxe',
        'Accords et orthographe': 'Morphosyntaxe',
        'Propositions et phrase complexe': 'Morphosyntaxe',
        'Orthographe et homophones': 'Phonétique / Phonologie',
        'Orthographe grammaticale': 'Phonétique / Phonologie',
        'Orthographe lexicale et homophones': 'Phonétique / Phonologie',
        'Orthographe des adjectifs de couleur': 'Phonétique / Phonologie',
        'Orthographe des verbes pronominaux': 'Phonétique / Phonologie',
        'Orthographe d\'usage': 'Phonétique / Phonologie',
        'Vocabulaire': 'Lexicographie',
        'Lexique et sémantique': 'Lexicographie',
    },
    'sec_eng': {
        'Grammar': 'Morphosyntaxe',
        'Tenses': 'Morphosyntaxe',
        'Tenses & Aspect': 'Morphosyntaxe',
        'Vocabulary': 'Lexicographie',
        'Word formation': 'Morphosyntaxe',
        'Morphology & Word Formation': 'Morphosyntaxe',
        'Prepositions': 'Morphosyntaxe',
        'Passive voice': 'Morphosyntaxe',
        'Reported speech': 'Morphosyntaxe',
        'Modals': 'Morphosyntaxe',
        'Relative Clauses': 'Morphosyntaxe',
        'Conditionals': 'Morphosyntaxe',
        'Question Tags': 'Morphosyntaxe',
        'Inversion': 'Morphosyntaxe',
        'Subordination': 'Morphosyntaxe',
        'Gerunds & Infinitives': 'Morphosyntaxe',
        'Articles & Determiners': 'Morphosyntaxe',
        'Collocations': 'Lexicographie',
        'Synonyms': 'Lexicographie',
        'Antonyms': 'Lexicographie',
        'Idioms & Figurative Language': 'Lexicographie',
        'Figures of Speech': 'Lexicographie',
    },
    'sec_math': {
        'التحليل ودراسة الدوال': 'Analyse des fonctions',
        'الهندسة المستوية': 'Géométrie',
        'الهندسة الفضائية': 'Géométrie',
        'الهندسة والتحويلات': 'Géométrie',
        'الجبر والأعداد العقدية': 'Algèbre',
        'الجبر والمصفوفات': 'Algèbre',
        'الجبر': 'Algèbre',
        'المتتاليات العددية': 'Probabilités et dénombrement',
        'الاحتمالات والتعداد': 'Probabilités et dénombrement',
        'الإحصاء': 'Statistiques',
        'الحساب التكاملي': 'Analyse des fonctions',
        'الحسابيات في Z': 'Arithmétique dans Z',
        'قابلية القسمة والأعداد الأولية': 'Arithmétique dans Z',
        'الأعداد والحساب': 'Algèbre',
        'المعادلات': 'Algèbre',
        'المعادلات التفاضلية': 'Analyse des fonctions',
        'الجذور': 'Algèbre',
    },
    'sec_physics': {
        'الكهرباء': 'Électricité',
        'الموجات والضوء': 'Ondes et lumière',
        'الكيمياء': 'Chimie',
        'الميكانيك': 'Mécanique',
        'الضوء': 'Ondes et lumière',
        'المادة': 'Chimie',
        'الذرة': 'Ondes et lumière',
        'الحرارة': 'Chimie',
        'الأحماض والقواعد': 'Chimie',
        'التحولات النووية': 'Mécanique',
    },
    'sec_svt': {
        'الخلية والوراثة': 'Cellule et génétique',
        'علوم الأرض': 'Géologie',
        'الجسم والصحة': 'Physiologie',
        'البيئة': 'Immunologie et environnement',
        'التركيب الضوئي': 'Cellule et génétique',
        'التكاثر الخلوي': 'Cellule et génétique',
        'الفسيولوجيا العضلية': 'Physiologie',
        'المناعة': 'Immunologie et environnement',
        'الإجهاد وعلم البيئة': 'Immunologie et environnement',
        'علم المناعة': 'Immunologie et environnement',
    },
    'sec_cs': {
        'البرمجة بلغة بايثون': 'Algorithmique et programmation',
        'قواعد البيانات و SQL': 'Bases de données',
        'الشبكات': 'Réseaux',
        'شبكات الحاسوب': 'Réseaux',
        'أمن المعلومات': 'Sécurité informatique',
        'الذكاء الاصطناعي وتعلم الآلة': 'Intelligence artificielle',
        'الويب': 'Algorithmique et programmation',
        'الخوارزميات': 'Algorithmique et programmation',
        'بنية المعطيات': 'Algorithmique et programmation',
        'نظم التشغيل': 'Fonctionnalité des systèmes',
        'بنية الحاسوب والمنطق الرقمي': 'Fonctionnalité des systèmes',
        'برمجة كائنية التوجه': 'Algorithmique et programmation',
    },
    'sec_eco': {
        'المحاسبة': 'Comptabilité',
        'الاقتصاد الكلي': 'Macroéconomie',
        'القانون والتدبير': 'Droit et management',
        'الاقتصاد العام': 'Économie',
        'التمويل والتسويق': 'Finance et marketing',
    },
    'sec_pe': {
        'الثقافة الرياضية': 'Didactique EPS',
        'الرياضات الجماعية والموقع': 'Sports collectifs',
        'الرياضات الجماعية': 'Sports collectifs',
        'ألعاب القوى': 'Athlétisme',
        'الفسيولوجيا الرياضية والمجهود': 'Physiologie de l’effort',
        'التشريح': 'Anatomie',
        'التغذية': 'Nutrition',
        'ديداكتيك التربية البدنية والرياضية': 'Didactique EPS',
        'ديداكتيك وبيداغوجيا EPS': 'Didactique EPS',
        'ديداكتيك EPS': 'Didactique EPS',
        'الصفات البدنية': 'Physiologie de l’effort',
        'الصحة': 'Nutrition',
        'الروح الرياضية': 'Didactique EPS',
    },
    'sec_te': {
        'الكهرباء': 'Électrotechnique',
        'المقاربة المنهجية': 'Méthodologie',
        'الرسم الصناعي': 'Dessin technique',
        'الميكانيك والروابط': 'Mécanique',
        'الميكانيك': 'Mécanique',
        'التحليل الوظيفي للمنتج': 'Analyse fonctionnelle',
        'الوصلات': 'Mécanique',
        'البرمجة والأورغانيغرام': 'Méthodologie',
        'الدوائر المنطقية وجبر بول': 'Électrotechnique',
        'التصنيع': 'Dessin technique',
    },
}

# ════════════════════════════════════════════════════════════════════
# تسوية افتراضية (بعد فشل الكلمات المفتاحية) — تُوسم في التقرير
# ════════════════════════════════════════════════════════════════════
DEFAULT_MAP = {
    'sec_ar': 'الصرف والنحو',
    'sec_fr': 'Morphosyntaxe',
    'sec_eng': 'Morphosyntaxe',
    'sec_math': 'Algèbre',
    'sec_physics': 'Mécanique',
    'sec_svt': 'Cellule et génétique',
    'sec_cs': 'Fonctionnalité des systèmes',
    'sec_eco': 'Économie',
    'sec_pe': 'Didactique EPS',
    'sec_te': 'Mécanique',
    'sec_hist_geo': 'الجغرافيا الطبيعية',
    'sec_islamic': 'القيم وثوابت الأمة المغربية',
    'sec_philo': 'مباحث فلسفية',
}

# ════════════════════════════════════════════════════════════════════
# 3) التوليد
# ════════════════════════════════════════════════════════════════════
def esc(s):
    return str(s).replace("'", "''")


def main():
    with io.open(SEED, encoding='utf-8') as f:
        data = json.load(f)
    questions = data if isinstance(data, list) else data.get('questions', [])
    by_subject_topic = defaultdict(lambda: defaultdict(int))
    for q in questions:
        if q['subject'].startswith('sec_'):
            by_subject_topic[q['subject']][q['topic']] += 1

    sql = ['-- ============================================================================',
           '-- توحيد مواضيع بنك CRMEF الثانوي مع المجالات الفرعية الرسمية',
           '-- المصدر: توصيفات المركز الوطني للامتحانات — دورة نونبر 2026.',
           '-- المستوى (أ): تغيير topic فقط — المعاملات (20/12/8) ونتائج التصحيح لم تتغيّر.',
           '-- التنفيذ آمن ومكرّر.',
           '-- ============================================================================', '']

    rep = ['# تقرير توحيد مواضيع CRMEF — الثانوي\n',
           '> **المستوى (أ)**: تغيير `topic` إلى المجال الفرعي الرسمي فقط. المعاملات (20/12/8) '
           'واحتساب النتائج كما هي تماماً — لا تتغير درجة أي مترشح.\n',
           '> المصدر: توصيفات المركز الوطني للامتحانات المدرسية وتقييم التعلمات — دورة نونبر 2026.\n',
           '> **ملاحظة التصميم:** بنك الثانوي لا يحوي مواد ديداكتيك منفصلة — أسئلة التخصص والديداكتيك '
           'مدموجة داخل كل subject. لذلك وُحّدت المحاور لكل مجال فرعي رسمي يضم عناصره الديدكتيكية.\n']

    def lookup(mapping, topic):
        t = mapping.get(topic)
        if t:
            return t
        tn = _norm_ar(topic)
        for k, v in mapping.items():
            if _norm_ar(k) == tn:
                return v
        return None

    total = 0
    gaps = []
    for subj in sorted(by_subject_topic):
        cur = by_subject_topic[subj]
        mapping = MAP.get(subj, {})
        counts = defaultdict(int)
        unmapped = []
        via_keyword = 0
        for t, c in cur.items():
            target = lookup(mapping, t)
            if not target:
                target = classify_by_keyword(subj, t)
                if target:
                    via_keyword += 1
            if target:
                counts[target] += c
                total += c
            else:
                unmapped.append(t)

        rep.append(f'\n## {subj}  ({sum(cur.values())} سؤال)\n')
        rep.append('| المجال الفرعي الرسمي | أسئلة الآن | الحالة |')
        rep.append('|---|---|---|')
        all_targets = sorted(set(list(counts.keys()) + list(mapping.values())))
        for target in all_targets:
            c = counts.get(target, 0)
            rep.append(f'| {target} | {c} | {"✅" if c else "⚪ (صفر أسئلة)"} |')
        rep.append('\n')

        if via_keyword:
            rep.append(f'\n_({via_keyword} موضوعاً صُنِّفت بالكلمات المفتاحية)_\n')
        if unmapped:
            rep.append('🔴 **مواضيع بلا مقابل موحَّد (أبقيتها كما هي):** ' + '، '.join(f'`{u}`' for u in unmapped) + '\n')
            gaps.append((subj, unmapped))
        else:
            rep.append('✅ كل المواضيع مُوحَّدة.\n')

        for t in sorted(cur):
            target = lookup(mapping, t) or classify_by_keyword(subj, t)
            if not target:
                continue
            sql.append(f'-- {subj}: «{t}» → «{target}»')
            sql.append(f"UPDATE public.questions SET topic = '{esc(target)}' WHERE subject = '{subj}' AND topic = '{esc(t)}';")
        sql.append('')

    os.makedirs(os.path.dirname(SQL_OUT), exist_ok=True)
    with io.open(SQL_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))
    os.makedirs(os.path.dirname(REP_OUT), exist_ok=True)
    with io.open(REP_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(rep))

    print('SQL   →', SQL_OUT)
    print('تقرير →', REP_OUT)
    print(f'\nأسئلة مشمولة بالتوحيد: {total}')
    for subj, unmapped in gaps:
        print(f'  🔴 {subj}: {len(unmapped)} موضوع غير موحد — {"، ".join(unmapped[:6])}{"…" if len(unmapped) > 6 else ""}')


if __name__ == '__main__':
    main()
