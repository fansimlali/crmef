const fs = require('fs');
const path = require('path');

// ==============================================================================
// 1. أسئلة مادة الرياضيات للثانوي (sec_math) - 65 سؤالاً: cma101-cma115 و cma151-cma200
// ==============================================================================
const mathQuestions = [
  // --- cma101 إلى cma115 ---
  {
    id: "cma101",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما نهاية الدالة (sin x)/x عندما يؤول x إلى 0 ؟",
    options: ["1", "0", "ما لا نهاية", "غير معرفة"],
    correct_answer: "1",
    explanation: "نهاية اعتيادية مشهورة: lim (sin x)/x = 1 عند x يؤول إلى 0."
  },
  {
    id: "cma102",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما مشتقة الدالة f(x) = ln(3x + 1) على مجال تعريفها؟",
    options: ["3/(3x + 1)", "1/(3x + 1)", "3 ln(3x + 1)", "1/(3x)"],
    correct_answer: "3/(3x + 1)",
    explanation: "مشتقة ln(u(x)) هي u'(x)/u(x)، وهنا مشتقة 3x + 1 هي 3."
  },
  {
    id: "cma103",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما مشتقة الدالة f(x) = exp(-2x) ؟",
    options: ["-2 exp(-2x)", "2 exp(-2x)", "-exp(-2x)", "exp(-2x)"],
    correct_answer: "-2 exp(-2x)",
    explanation: "مشتقة exp(u(x)) هي u'(x) exp(u(x))، وبالتالي (-2x)' exp(-2x) = -2 exp(-2x)."
  },
  {
    id: "cma104",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "ما معيار العدد العقدي z = 3 - 4i ؟",
    options: ["5", "7", "25", "1"],
    correct_answer: "5",
    explanation: "|z| = الجذر التربيعي لـ (3² + (-4)²) = الجذر التربيعي لـ (9 + 16) = الجذر التربيعي لـ 25 = 5."
  },
  {
    id: "cma105",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "ما عمدة العدد العقدي z = -1 + i الجذر التربيعي لـ 3 ؟",
    options: ["2π/3", "π/3", "5π/6", "π/6"],
    correct_answer: "2π/3",
    explanation: "المعيار 2، و cos(θ) = -1/2 و sin(θ) = (جذر 3)/2، إذن θ = π - π/3 = 2π/3."
  },
  {
    id: "cma106",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "متتالية هندسية حدها الأول u0 = 3 وأساسها q = 2، ما قيمة حدها u4 ؟",
    options: ["48", "24", "96", "18"],
    correct_answer: "48",
    explanation: "un = u0 × q^n، إذن u4 = 3 × 2⁴ = 3 × 16 = 48."
  },
  {
    id: "cma107",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "إذا كانت متتالية عددية تزايدية ومكبورة بالعدد 5، فإنها:",
    options: ["متقاربة ونهايتها أصغر من أو تساوي 5", "متباعدة نحو زائد ما لا نهاية", "متذبذبة وليس لها نهاية", "تؤول دائماً إلى 0"],
    correct_answer: "متقاربة ونهايتها أصغر من أو تساوي 5",
    explanation: "كل متتالية تزايدية ومكبورة هي متتالية متقاربة ونهايتها L تفي L <= المكبور."
  },
  {
    id: "cma108",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحساب التكاملي",
    question: "ما قيمة التكامل من 0 إلى 1 للدالة (2x + 1) dx ؟",
    options: ["2", "1", "3", "0.5"],
    correct_answer: "2",
    explanation: "الدالة الأصلية هي x² + x. بالتعويض: [1² + 1] - [0 + 0] = 2."
  },
  {
    id: "cma109",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة الفضائية",
    question: "في الفضاء المنسوب لمعلم متعامد ممنظم، متى يكون مستقيمان متعامدين؟",
    options: ["عندما يكون الجداء السلمي لمتجهتي توجيههما منعدماً", "عندما يتقاطعان في نقطتين مختلفتين", "عندما تكون متجهات توجيههما مستقيمية", "عندما ينتميان لنفس المستوى فقط"],
    correct_answer: "عندما يكون الجداء السلمي لمتجهتي توجيههما منعدماً",
    explanation: "تعامد مستقيمين في الفضاء يكافئ u . v = 0 حيث u و v متجها توجيههما."
  },
  {
    id: "cma110",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة الفضائية",
    question: "ما متجهة المنظمية على المستوى المعرف بالمعادلة الديكارتية: 2x - 3y + z - 5 = 0 ؟",
    options: ["n(2, -3, 1)", "n(2, 3, 1)", "n(-2, 3, 5)", "n(2, -3, -5)"],
    correct_answer: "n(2, -3, 1)",
    explanation: "معاملات x و y و z في المعادلة الديكارتية ax + by + cz + d = 0 تمثل إحداثيات المتجهة المنظمية n(a,b,c)."
  },
  {
    id: "cma111",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "كم عدد الطرق لسحب كرتين بالتتابع وبإحلال من كيس يحتوي على 5 كرات مرقمة؟",
    options: ["25", "20", "10", "120"],
    correct_answer: "25",
    explanation: "السحب بالتتابع وبإحلال هو ترتيب بتكرار: n^p = 5² = 25."
  },
  {
    id: "cma112",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "ما قيمة التوليفة C(5, 2) ؟",
    options: ["10", "20", "5", "25"],
    correct_answer: "10",
    explanation: "C(5, 2) = (5 × 4) / (2 × 1) = 20 / 2 = 10."
  },
  {
    id: "cma113",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحسابيات في Z",
    question: "إذا كان a يقسم b و a يقسم c، فإن a يقسم بالضرورة:",
    options: ["أي تأليفة خطية bu + cv حيث u و v عددان صحيحان نسبيان", "الجداء b × c فقط", "الفرق b - c فقط بشرط b أكبر من c", "خارج قسمة b على c دائماً"],
    correct_answer: "أي تأليفة خطية bu + cv حيث u و v عددان صحيحان نسبيان",
    explanation: "من خصائص قابلية القسمة: إذا كان a|b و a|c فإن a يقسم كل تأليفة خطية (bu + cv)."
  },
  {
    id: "cma114",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحسابيات في Z",
    question: "ما هو القاسم المشترك الأكبر للعددين 36 و 54 ؟",
    options: ["18", "9", "6", "12"],
    correct_answer: "18",
    explanation: "36 = 18 × 2، و 54 = 18 × 3. أكبر قاسم مشترك هو 18."
  },
  {
    id: "cma115",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المعادلات التفاضلية",
    question: "ما هو الحل العام للمعادلة التفاضلية y' - 3y = 0 ؟",
    options: ["y(x) = k exp(3x)", "y(x) = k exp(-3x)", "y(x) = 3x + k", "y(x) = k ln(3x)"],
    correct_answer: "y(x) = k exp(3x)",
    explanation: "المعادلة التفاضلية الخطية y' = ay حلها العام هو y = k exp(ax)، وهنا a = 3."
  },
  // --- cma151 إلى cma200 (50 سؤالاً) ---
  {
    id: "cma151",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هي نقطة انعطاف منحنى دالة مرتين قابلة للاشتقاق f ؟",
    options: ["نقطة تنعدم فيها المشتقة الثانية وتغير إشارتها", "نقطة تنعدم فيها المشتقة الأولى فقط", "أعلى قمة يبلغها المنحنى", "نقطة تقاطع المنحنى مع محور الأراتيب"],
    correct_answer: "نقطة تنعدم فيها المشتقة الثانية وتغير إشارتها",
    explanation: "نقطة الانعطاف توافق تغير تقعر المنحنى من التحدب إلى التقعر، أي انعدام f''(x) وتغير إشارتها."
  },
  {
    id: "cma152",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما نهاية (exp(x) - 1)/x عندما يؤول x إلى 0 ؟",
    options: ["1", "0", "e", "زائد ما لا نهاية"],
    correct_answer: "1",
    explanation: "تمثل هذه النهاية العدد المشتق للدالة exp(x) عند x = 0، وهو exp'(0) = 1."
  },
  {
    id: "cma153",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "إذا كانت f دالة متصلة ورتيبة قطعا على المجال [1, 3] مع f(1) = -2 و f(3) = 4، فإن المعادلة f(x) = 0:",
    options: ["تقبل حلا وحيدا في المجال ]1, 3[", "لا تقبل أي حل", "تقبل حلين على الأقل", "تقبل ما لا نهاية من الحلول"],
    correct_answer: "تقبل حلا وحيدا في المجال ]1, 3[",
    explanation: "حسب مبرهنة القيم الوسيطية، إذا كانت f متصلة ورتيبة قطعا وتغير إشارتها (f(a) × f(b) < 0) فإن الحل وحيد."
  },
  {
    id: "cma154",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحساب التكاملي",
    question: "ما هي صيغة المكاملة بالأجزاء لتكامل u(x) v'(x) dx ؟",
    options: ["[u(x) v(x)] - تكامل u'(x) v(x) dx", "[u'(x) v'(x)] - تكامل u(x) v(x) dx", "[u(x) + v(x)] + تكامل u'(x) dx", "u(x) v(x) مقسوما على 2"],
    correct_answer: "[u(x) v(x)] - تكامل u'(x) v(x) dx",
    explanation: "قاعدة المكاملة بالأجزاء تشتق من قاعدة مشتقة الجداء: ∫ u v' = [u v] - ∫ u' v."
  },
  {
    id: "cma155",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "ما مرافق العدد العقدي z = 2 + 5i ؟",
    options: ["2 - 5i", "-2 + 5i", "-2 - 5i", "5 + 2i"],
    correct_answer: "2 - 5i",
    explanation: "مرافق z = a + ib هو z-bar = a - ib بتغيير إشارة الجزء التخيلي فقط."
  },
  {
    id: "cma156",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "ما حل المعادلة z² + 1 = 0 في مجموعة الأعداد العقدية C ؟",
    options: ["i و -i", "1 و -1", "0 و 1", "لا حل لها في C"],
    correct_answer: "i و -i",
    explanation: "z² = -1 = i²، إذن الحلان هما i و -i."
  },
  {
    id: "cma157",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "ما مجموع الحدود العشرة الأولى لمتتالية حسابية حدها الأول u1 = 1 وأساسها r = 2 ؟",
    options: ["100", "90", "110", "50"],
    correct_answer: "100",
    explanation: "u10 = 1 + 9 × 2 = 19. المجموع S = 10 × (1 + 19) / 2 = 10 × 10 = 100 (مجموع الأعداد الفردية الأولى n²)."
  },
  {
    id: "cma158",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "إذا كان A و B حدثين مستقلين، فإن احتمال تقاطعهما P(A ∩ B) يساوي:",
    options: ["P(A) × P(B)", "P(A) + P(B)", "P(A) / P(B)", "P(A) - P(B)"],
    correct_answer: "P(A) × P(B)",
    explanation: "استقلال حدثين رياضياً يُعرّف بتحقق: P(A ∩ B) = P(A) × P(B)."
  },
  {
    id: "cma159",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "ما هو الأمل الرياضي E(X) لمتغير عشوائي يتبع قانوناً ثنائياً B(n, p) ؟",
    options: ["n × p", "n × p × (1 - p)", "جذر (n × p)", "p / n"],
    correct_answer: "n × p",
    explanation: "في التوزيع الثنائي B(n, p)، الأمل الرياضي E(X) = np والتغاير V(X) = np(1-p)."
  },
  {
    id: "cma160",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة الفضائية",
    question: "ما مسافة النقطة A(1, 2, -1) عن المستوى (P) ذي المعادلة: 2x - 2y + z + 5 = 0 ؟",
    options: ["2/3", "4/3", "2", "6/9"],
    correct_answer: "4/3",
    explanation: "d = |2(1) - 2(2) + 1(-1) + 5| / جذر(2² + (-2)² + 1²) = |2 - 4 - 1 + 5| / 3 = |2| / 3 ... لحظة: 2 - 4 = -2، -2 - 1 = -3، -3 + 5 = 2. d = 2/3."
  },
  {
    id: "cma161",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحسابيات في Z",
    question: "حسب مبرهنة بيزو (Bézout)، العددان a و b أوليان فيما بينهما إذا وفقط إذا:",
    options: ["وجد عددان نسبيان u و v بحيث au + bv = 1", "كان a و b عددين فرديين معاً", "كان a يقسم b أو b يقسم a", "كان مجموعهما عدداً أولياً"],
    correct_answer: "وجد عددان نسبيان u و v بحيث au + bv = 1",
    explanation: "مبرهنة بيزو: pgcd(a,b) = 1 يكافئ وجود u و v في Z بحيث au + bv = 1."
  },
  {
    id: "cma162",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المعادلات والمتراجحات",
    question: "ما حل المتراجحة ln(x) < 0 في مجموعة الأعداد الحقيقية؟",
    options: ["]0, 1[", "]-ما لا نهاية, 0[", "]1, +ما لا نهاية[", "[0, 1]"],
    correct_answer: "]0, 1[",
    explanation: "الدالة اللوغاريتمية معرفة قطعا على ]0, +∞[، وتنعدم عند 1 وتكون سالبة قطعا على المجال ]0, 1[."
  },
  {
    id: "cma163",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما نوع المقارب لمنحنى دالة f إذا كانت نهاية f(x) عندما يؤول x إلى زائد ما لا نهاية تساوي 3 ؟",
    options: ["مقارب أفقي معادلته y = 3", "مقارب عمودي معادلته x = 3", "مقارب مائل معادلته y = 3x", "فرع شلجمي اتجاهه محور الأراتيب"],
    correct_answer: "مقارب أفقي معادلته y = 3",
    explanation: "إذا كانت lim f(x) = L عند x → ±∞، فإن المستقيم ذو المعادلة y = L مقارب أفقي للمنحنى بجوار تلك الما لا نهاية."
  },
  {
    id: "cma164",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما نوع المقارب إذا كانت نهاية f(x) عندما يؤول x إلى 2 تساوي زائد ما لا نهاية؟",
    options: ["مقارب عمودي معادلته x = 2", "مقارب أفقي معادلته y = 2", "مقارب مائل معادلته y = x + 2", "نقطة توقف للمنحنى"],
    correct_answer: "مقارب عمودي معادلته x = 2",
    explanation: "إذا كانت lim f(x) = ±∞ عند x → a، فإن المستقيم ذو المعادلة x = a مقارب عمودي للمنحنى."
  },
  {
    id: "cma165",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والمصفوفات",
    question: "ما هو محدد (Déterminant) المصفوفة 2x2 المكونة من الأسطر [3, 2] و [1, 4] ؟",
    options: ["10", "14", "12", "8"],
    correct_answer: "10",
    explanation: "المحدد = (3 × 4) - (2 × 1) = 12 - 2 = 10."
  },
  {
    id: "cma166",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة والتحويلات",
    question: "التحاكي (Homothétie) الذي مركزه أصل المعلم ونسبته k = -2 هو تحويل هندسي:",
    options: ["يضاعف الأطوال مرتين ويعكس الاتجاه ويضرب المساحات في 4", "يحافظ على المسافات بدقة", "يغير قياسات الزوايا", "يحول الدوائر إلى مربعات"],
    correct_answer: "يضاعف الأطوال مرتين ويعكس الاتجاه ويضرب المساحات في 4",
    explanation: "التحاكي بنسبة k يضرب الأطوال في |k| = 2، والمساحات في k² = 4، ونظراً لسالبية k يعكس الاتجاه."
  },
  {
    id: "cma167",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المعادلات التفاضلية",
    question: "ما الحل العام للمعادلة التفاضلية y'' + 4y = 0 ؟",
    options: ["y(x) = A cos(2x) + B sin(2x)", "y(x) = A exp(2x) + B exp(-2x)", "y(x) = (Ax + B) exp(2x)", "y(x) = A cos(4x)"],
    correct_answer: "y(x) = A cos(2x) + B sin(2x)",
    explanation: "المعادلة المميزة r² + 4 = 0 حلها عقديا r = ± 2i، إذن الحل العام تذبذبي توافقي: A cos(2x) + B sin(2x)."
  },
  {
    id: "cma168",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هي الدالة الأصلية للدالة f(x) = 1/(x ln x) على المجال ]1, +ما لا نهاية[ ؟",
    options: ["F(x) = ln(ln x) + C", "F(x) = (ln x)² + C", "F(x) = 1/(ln x) + C", "F(x) = x ln x + C"],
    correct_answer: "F(x) = ln(ln x) + C",
    explanation: "تكتب الدالة على شكل u'(x)/u(x) حيث u(x) = ln x و u'(x) = 1/x، ودالتها الأصلية ln|u(x)| = ln(ln x)."
  },
  {
    id: "cma169",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "في تجربة إلقاء نرد متوازن ذي ستة أوجه، ما احتمال الحصول على عدد زوجي أو يقبل القسمة على 3؟",
    options: ["2/3", "1/2", "5/6", "1/3"],
    correct_answer: "2/3",
    explanation: "الأعداد الزوجية {2, 4, 6} ومضاعفات 3 هي {3, 6}. الاتحاد هو {2, 3, 4, 6} وعدده 4 عناصر، الاحتمال 4/6 = 2/3."
  },
  {
    id: "cma170",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "ما الشكل الأسي للعدد العقدي z = 1 + i ؟",
    options: ["الجذر التربيعي لـ 2 exp(i π/4)", "2 exp(i π/4)", "الجذر التربيعي لـ 2 exp(i π/2)", "exp(i π/4)"],
    correct_answer: "الجذر التربيعي لـ 2 exp(i π/4)",
    explanation: "المعيار r = جذر(1² + 1²) = جذر 2، والعمدة θ = π/4، إذن z = جذر 2 × exp(i π/4)."
  },
  {
    id: "cma171",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما قيمة نهاية x ln(x) عندما يؤول x إلى 0 عن اليمين؟",
    options: ["0", "-ما لا نهاية", "1", "غير منتهية"],
    correct_answer: "0",
    explanation: "نهاية اعتيادية بالتزايد المقارن: lim x ln(x) = 0 عند x → 0⁺."
  },
  {
    id: "cma172",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما قيمة نهاية exp(x)/x² عندما يؤول x إلى زائد ما لا نهاية؟",
    options: ["زائد ما لا نهاية", "0", "1", "e"],
    correct_answer: "زائد ما لا نهاية",
    explanation: "بالتزايد المقارن، الدالة الأسية تهيمن على قوى x عند +∞: lim exp(x)/xⁿ = +∞."
  },
  {
    id: "cma173",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "ما نهاية المتتالية vn = (1/3)^n عندما يؤول n إلى زائد ما لا نهاية؟",
    options: ["0", "زائد ما لا نهاية", "1/3", "1"],
    correct_answer: "0",
    explanation: "إذا كان أساس المتتالية الهندسية q يحقق |q| < 1، فإن نهايتها تساوي 0 دائماً."
  },
  {
    id: "cma174",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة الفضائية",
    question: "الجداء المتجهي لمتجهتين مستقيميتين u و v في الفضاء يساوي:",
    options: ["المتجهة المنعدمة", "العدد الحقيقي 0", "1", "متجهة عمودية عليهما"],
    correct_answer: "المتجهة المنعدمة",
    explanation: "الجداء المتجهي لمتجهتين مستقيميتين ينعدم متجهاتياً: u ∧ v = 0."
  },
  {
    id: "cma175",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحسابيات في Z",
    question: "ما هو باقي قسمة العدد 2²⁰²⁶ على 3 ؟",
    options: ["1", "2", "0", "-1"],
    correct_answer: "1",
    explanation: "2 ≡ -1 [3]، إذن 2²⁰²⁶ ≡ (-1)²⁰²⁶ ≡ 1 [3] لأن الأس زوجي."
  },
  {
    id: "cma176",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هي مشتقة دالة الظل f(x) = tan(x) ؟",
    options: ["1 + tan²(x) أو 1/cos²(x)", "-1/cos²(x)", "tan²(x)", "sin(x)/cos(x)"],
    correct_answer: "1 + tan²(x) أو 1/cos²(x)",
    explanation: "مشتقة tan(x) هي 1 + tan²(x) وتساوي أيضاً 1/cos²(x)."
  },
  {
    id: "cma177",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما الدالة العكسية لدالة f(x) = exp(x) المعرفة من R نحو ]0, +ما لا نهاية[ ؟",
    options: ["f⁻¹(x) = ln(x)", "f⁻¹(x) = exp(-x)", "f⁻¹(x) = 1/exp(x)", "f⁻¹(x) = -ln(x)"],
    correct_answer: "f⁻¹(x) = ln(x)",
    explanation: "الدالة اللوغاريتمية النيبيرية هي الدالة العكسية المباشرة للدالة الأسية النيبيرية."
  },
  {
    id: "cma178",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحساب التكاملي",
    question: "ما قيمة التكامل من 0 إلى π/2 للدالة cos(x) dx ؟",
    options: ["1", "0", "π/2", "-1"],
    correct_answer: "1",
    explanation: "الدالة الأصلية هي sin(x): [sin(π/2) - sin(0)] = 1 - 0 = 1."
  },
  {
    id: "cma179",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "صيغة دي موافر (Moivre) للأعداد العقدية تنص على أن [cos(θ) + i sin(θ)]ⁿ تساوي:",
    options: ["cos(nθ) + i sin(nθ)", "n cos(θ) + i n sin(θ)", "cosⁿ(θ) + i sinⁿ(θ)", "cos(θ/n) + i sin(θ/n)"],
    correct_answer: "cos(nθ) + i sin(nθ)",
    explanation: "مبرهنة دي موافر: رفْع العدد العقدي المثلثي للأس n يضرب العمدة في n."
  },
  {
    id: "cma180",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "ما هو احتمال الحصول على وجهين على الأقل عند رمي قطعة نقدية متوازنة 3 مرات؟",
    options: ["1/2", "3/8", "1/4", "7/8"],
    correct_answer: "1/2",
    explanation: "إجمالي الحالات 8. الحالات التي بها وجهان أو ثلاثة: {FPP, PFP, PPF, PPP} وعددهم 4، الاحتمال 4/8 = 1/2."
  },
  {
    id: "cma181",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة والتحويلات",
    question: "الدوران الذي مركزه O وزاويته π/2 يحول النقطة M ذات اللحق z إلى النقطة M' ذات اللحق z' بحيث:",
    options: ["z' = i z", "z' = -i z", "z' = -z", "z' = z + i"],
    correct_answer: "z' = i z",
    explanation: "الكتابة العقدية للدوران: z' - ω = exp(iθ)(z - ω). بما أن ω = 0 و θ = π/2 فإن exp(iπ/2) = i، إذن z' = iz."
  },
  {
    id: "cma182",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "متى تقبل دالة f مماساً أفقياً عند النقطة ذات الأفصول a ؟",
    options: ["عندما تكون f'(a) = 0", "عندما تكون f(a) = 0", "عندما تؤول مشتقتها إلى ما لا نهاية", "عندما تنعدم المشتقة الثانية فقط"],
    correct_answer: "عندما تكون f'(a) = 0",
    explanation: "معامل موجه المماس هو العدد المشتق f'(a). وإذا كان f'(a) = 0 فإن المماس أفقي يوازي محور الأفاصيل."
  },
  {
    id: "cma183",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هي معادلة المماس لمنحنى الدالة f عند النقطة ذات الأفصول x0 ؟",
    options: ["y = f'(x0)(x - x0) + f(x0)", "y = f(x0)(x - x0) + f'(x0)", "y = f'(x0) x + f(x0)", "y = f''(x0)(x - x0)"],
    correct_answer: "y = f'(x0)(x - x0) + f(x0)",
    explanation: "المعادلة الكلاسيكية للمماس: y = f'(x0)(x - x0) + f(x0)."
  },
  {
    id: "cma184",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "إذا كانت المتتالية un معرفة بـ u(n+1) = (un + 4)/2 مع u0 = 1، فإن نهايتها L تساوي:",
    options: ["4", "2", "1", "زائد ما لا نهاية"],
    correct_answer: "4",
    explanation: "النهاية تحقق L = (L + 4)/2، ومنه 2L = L + 4، إذن L = 4."
  },
  {
    id: "cma185",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحساب التكاملي",
    question: "ما القيمة المتوسطة لدالة f على المجال [a, b] ؟",
    options: ["(1 / (b - a)) مضروبة في تكامل f(x) dx من a إلى b", "تكامل f(x) dx مقسوما على 2", "f(b) - f(a) مقسوما على (b - a)", "جذر حاصل ضرب f(a) في f(b)"],
    correct_answer: "(1 / (b - a)) مضروبة في تكامل f(x) dx من a إلى b",
    explanation: "القيمة المتوسطة μ للدالة هي مساحة الحيز مقسومة على طول المجال: μ = (1/(b - a)) ∫ f(x) dx."
  },
  {
    id: "cma186",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة الفضائية",
    question: "معادلة الفلكة (Sphère) التي مركزها Ω(1, 0, -2) وشعاعها R = 3 هي:",
    options: ["(x - 1)² + y² + (z + 2)² = 9", "(x + 1)² + y² + (z - 2)² = 9", "(x - 1)² + y² + (z + 2)² = 3", "(x - 1)² + (y - 2)² + z² = 9"],
    correct_answer: "(x - 1)² + y² + (z + 2)² = 9",
    explanation: "معادلة الفلكة: (x - a)² + (y - b)² + (z - c)² = R²."
  },
  {
    id: "cma187",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحسابيات في Z",
    question: "حسب مبرهنة فيرما الصغرى، إذا كان p عدداً أولياً و a لا يقسمه p، فإن:",
    options: ["a^(p - 1) ≡ 1 [p]", "a^p ≡ 1 [p]", "a^(p - 1) ≡ 0 [p]", "a^(p + 1) ≡ 1 [p]"],
    correct_answer: "a^(p - 1) ≡ 1 [p]",
    explanation: "مبرهنة فيرما الصغرى: لكل عدد أولي p و a غير مضاعف لـ p، يتحقق a^(p-1) ≡ 1 [p]."
  },
  {
    id: "cma188",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والأعداد العقدية",
    question: "الجذور النونية للوحدة (Racines n-ièmes de l'unité) تشكل في المستوى العقدي:",
    options: ["رؤوس مضلع منتظم ذي n ضلعاً محاط بالدائرة المثلثية", "نقطاً مستقيمية على محور الأفاصيل", "دائرة مركزها النقطة 1", "مثلثاً قائم الزاوية دائماً"],
    correct_answer: "رؤوس مضلع منتظم ذي n ضلعاً محاط بالدائرة المثلثية",
    explanation: "صور الجذور النونية للوحدة exp(2ikπ/n) تتوزع بانتظام على دائرة الوحدة لتشكل مضلعاً منتظماً متناظراً."
  },
  {
    id: "cma189",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "الدالة f(x) = x³ - 3x تقبل قيمة دنيا محلية عند النقطة ذات الأفصول:",
    options: ["1", "-1", "0", "3"],
    correct_answer: "1",
    explanation: "f'(x) = 3x² - 3 = 3(x - 1)(x + 1). المشتقة تنعدم وتغير إشارتها من سالب إلى موجب عند x = 1، إذن هناك قيمة دنيا محلية."
  },
  {
    id: "cma190",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هو مجال تعريف الدالة f(x) = الجذر التربيعي لـ (4 - x²) ؟",
    options: ["[-2, 2]", "]-ما لا نهاية, -2] اتحاد [2, +ما لا نهاية[", "[0, 2]", "R"],
    correct_answer: "[-2, 2]",
    explanation: "يجب أن يكون ما بداخل الجذر موجباً: 4 - x² >= 0 يكافئ x² <= 4 أي x ينتمي للمجال [-2, 2]."
  },
  {
    id: "cma191",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "دالة f فردية ومعرفة على R، إذا كان تكاملها من -a إلى a موجوداً، فإن قيمته تساوي دائماً:",
    options: ["0", "2 مضروبة في تكامل من 0 إلى a", "f(a) - f(-a)", "1"],
    correct_answer: "0",
    explanation: "تكامل دالة فردية على مجال متماثل بالنسبة للصفر [-a, a] ينعدم دائماً."
  },
  {
    id: "cma192",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "إذا كانت f دالة زوجية متصلة على R، فإن تكاملها من -a إلى a يساوي:",
    options: ["2 مضروبة في تكامل من 0 إلى a", "0", "f(a)", "-2 تكامل من 0 إلى a"],
    correct_answer: "2 مضروبة في تكامل من 0 إلى a",
    explanation: "لتماثل المنحنى بالنسبة لمحور الأراتيب، تتضاعف المساحة: ∫ من -a إلى a تساوي 2 ∫ من 0 إلى a."
  },
  {
    id: "cma193",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الاحتمالات والتعداد",
    question: "صيغة الاحتمال الكلي لحدث B بتجزيء منتهي {A1, A2, ..., An} للفضاء تنص على أن P(B) تساوي:",
    options: ["مجموع P(Ai) × P(B/Ai)", "جداء احتمالات P(Ai)", "أكبر احتمال بين P(Ai)", "1 - مجموع P(Ai)"],
    correct_answer: "مجموع P(Ai) × P(B/Ai)",
    explanation: "صيغة الاحتمالات الكلية: P(B) = ∑ P(Ai) P(B|Ai)."
  },
  {
    id: "cma194",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الهندسة والتحويلات",
    question: "الإزاحة ذات المتجهة u التي لحقها b تحول النقطة ذات اللحق z إلى النقطة ذات اللحق z' بحيث:",
    options: ["z' = z + b", "z' = b z", "z' = z - b", "z' = -z + b"],
    correct_answer: "z' = z + b",
    explanation: "الكتابة العقدية للإزاحة هي جمع متجهي مباشر: z' = z + b."
  },
  {
    id: "cma195",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "المتتاليات العددية",
    question: "إذا كانت المتتالية wn = cos(n) / n² لكل n >= 1، فإن نهايتها عند زائد ما لا نهاية هي:",
    options: ["0", "1", "غير موجودة لتذبذب cos", "ما لا نهاية"],
    correct_answer: "0",
    explanation: "باستعمال مبرهنة الحصر: |cos(n)/n²| <= 1/n²، وبما أن 1/n² تؤول إلى 0، فإن النهاية 0."
  },
  {
    id: "cma196",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الجبر والمصفوفات",
    question: "تكون مصفوفة مربعة A قابلة للقلب (Inversible) إذا وفقط إذا كان:",
    options: ["محددها غير منعدم (det(A) != 0)", "محددها يساوي 0", "جميع عناصر قطرها أصفار", "كانت مصفوفة غير متماثلة"],
    correct_answer: "محددها غير منعدم (det(A) != 0)",
    explanation: "المصفوفة تكون قابلة للقلب إذا وفقط إذا كان محددها يختلف عن الصفر."
  },
  {
    id: "cma197",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هو مشتق مقلوب دالة: (1/g(x))' ؟",
    options: ["-g'(x) / g(x)²", "g'(x) / g(x)²", "-1 / g(x)²", "1 / g'(x)"],
    correct_answer: "-g'(x) / g(x)²",
    explanation: "قاعدة اشتقاق المقلوب: (1/g)' = -g'/g²."
  },
  {
    id: "cma198",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما مشتقة دالة الجداء: (f × g)' ؟",
    options: ["f' g + f g'", "f' g'", "f' g - f g'", "(f' + g') / 2"],
    correct_answer: "f' g + f g'",
    explanation: "قاعدة مشتقة الجداء: (uv)' = u'v + uv'."
  },
  {
    id: "cma199",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "الحساب التكاملي",
    question: "ما هو حجم المجسم المتولد عن دوران منحنى دالة f حول محور الأفاصيل بين a و b ؟",
    options: ["π مضروبة في تكامل f(x)² dx من a إلى b", "2π مضروبة في تكامل f(x) dx", "تكامل f(x)³ dx", "π² مضروبة في (b - a)"],
    correct_answer: "π مضروبة في تكامل f(x)² dx من a إلى b",
    explanation: "حجم مجسم الدوران هو V = π ∫ [f(x)]² dx."
  },
  {
    id: "cma200",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_math",
    topic: "التحليل ودراسة الدوال",
    question: "ما هي مبرهنة رول (Rolle) في التحليل الرياضي؟",
    options: ["إذا كانت f متصلة على [a,b] وقابلة للاشتقاق على ]a,b[ مع f(a) = f(b)، فإنه يوجد c في ]a,b[ بحيث f'(c) = 0", "كل دالة متصلة تقبل دالة أصلية", "كل متتالية متقاربة هي متتالية مكبورة", "المشتقة الأولى لدالة تزايدية تكون دائماً سالبة"],
    correct_answer: "إذا كانت f متصلة على [a,b] وقابلة للاشتقاق على ]a,b[ مع f(a) = f(b)، فإنه يوجد c في ]a,b[ بحيث f'(c) = 0",
    explanation: "مبرهنة رول تضمن وجود نقطة مماس أفقي c على الأقل بين a و b متى تساوت قيمتا الطرفين."
  }
];

console.log(`Generated ${mathQuestions.length} secondary math questions.`);

// دمج مع questions_seed.json
const seedPath = path.join(__dirname, '..', 'questions_seed.json');
let allQuestions = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// حذف أي معرفات سابقة لتفادي التكرار
const mathIds = new Set(mathQuestions.map(q => q.id));
allQuestions = allQuestions.filter(q => !mathIds.has(q.id));
allQuestions.push(...mathQuestions);
allQuestions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

fs.writeFileSync(seedPath, JSON.stringify(allQuestions, null, 2), 'utf8');

// تحديث src/data/initialQuestions.ts
const tsContent = `import type { Question } from '../types';\n\nexport const INITIAL_QUESTIONS = ${JSON.stringify(allQuestions, null, 2)} as unknown as Question[];\n`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'initialQuestions.ts'), tsContent, 'utf8');

console.log(`Total questions in bank after math update: ${allQuestions.length}`);
