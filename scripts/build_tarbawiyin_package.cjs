/**
 * بناء حزمة مباراة «أطر المختصين» (tarbawiyin) من بنوك المطوّر الثلاثة.
 * - يطبّع الصفوف وفق SKILL_EXAM_CONTENT.md (§1.1) ويصحح المشاكل المكتشفة:
 *     1) cycles غير صالحة ('iqtisad'/'tarbawi') → الأسلاك الثلاثة القياسية
 *        (المباراة لا تعتمد الأسلاك؛ العزل عبر exam_id و RLS يحتاج قيماً قياسية).
 *     2) توزيع الجواب الصحيح 100% في الموضع الأول → تدوير حتمي للخيارات
 *        (عامل التدوير = رقم السؤال mod 4 → توزيع متساوٍ 25/25/25/25).
 *     3) حذف الملف المكرر («2.json» متطابق عن طريقته، يُستخدم ملف واحد فقط).
 * - التصنيف الخبير (قرار المالك): tarbawi_1 (تحضير المختبرات/الحراسة/التوثيق)
 *   أساس اختبار «تخصص خاصية — مسلك مكون المختصين التربويين». للقلب:
 *   غيّر INCLUDE_TARBAWI_1 إلى false وأعد التشغيل.
 * المحتوى مدفوع — المخرجات exam_package.json و supabase_tarbawiyin_seed.sql
 * في .gitignore ولا تُرفع أبداً.
 * الاستعمال: node scripts/build_tarbawiyin_package.cjs
 */
const fs = require('fs');
const path = require('path');

// ───────────────────────── التضبيطات ─────────────────────────
const INCLUDE_TARBAWI_1 = true; // false = استبعاد بنك المختبرات/الحراسة/التوثيق من الحزمة
const TRIAL_PER_SUBJECT = 20;   // العيّنة المجانية: أول N/مادة بترتيب المعرّف

const ROOT = path.join(__dirname, '..');
const BANK_DIR = path.join(ROOT, 'tarbawiyin mokhtabarat');

const EXAM = {
  name: 'مسابقة أطر المختصين',
  short_name: 'الأطر المختصين',
  slug: 'tarbawiyin',
  description:
    'مسابقة إدماج أطر المختصين بقطاع التربية الوطنية — مسالك: مكونو المختصين التربويين، مختصو الاقتصاد والإدارة، المختصون الاجتماعيون. ' +
    'اختبار شفوي مشترك: مقابلة حول مهام وتخصصات الإطار الموظَّف فيه. المصدر الرسمي: بوابة ولوج wolouj.men.gov.ma',
  icon: 'book',   // أيقونة معروفة في ExamSelector (BookOpen)
  color: 'purple',
  is_active: true,
  sort_order: 20,
};

// أسلاك قياسية (الواجهة و RLS يعتمدانهما؛ المباراة تتجاهل السلك عملياً لأن كل الأصنوفة متاحة)
const CYCLES = ['primary', 'secondary_prep', 'secondary_qual'];
const EXAM_CYCLES = [
  { id: 'primary', name: 'ابتدائي مزدوج' },
  { id: 'secondary_prep', name: 'ثانوي إعدادي' },
  { id: 'secondary_qual', name: 'ثانوي تأهيلي' },
];

// إعادة تسمية مفاتيح المواد (اسم المادة في الواجهة رسمي مع ذكر المسلك)
const SUBJECTS = [
  { key: 'tadbir_idari_tarbawi',   name: 'التدبير الإداري والتربوي لمؤسسات التربية والتعليم العمومي', weight: 2 },
  { key: 'khas_tarbawi',           name: 'تخصص خاصية — مسلك مكون المختصين التربويين',                  weight: 2 },
  { key: 'tadbir_mali_mohasabati', name: 'التدبير المالي والمحاسباتي — مسلك أطر مختصي الاقتصاد والإدارة', weight: 2 },
  { key: 'tahlil_nafsia_ijtimaiya',name: 'تحليل الظاهرة النفسية والاجتماعية — مسلك أطر المختصين الاجتماعيين', weight: 1 },
  { key: 'khas_iqtisad',           name: 'تخصص خاصية — مسلك أطر مختصي الاقتصاد والإدارة',              weight: 1 },
  { key: 'khas_ijtimai',           name: 'تخصص خاصية — مسلك أطر المختصين الاجتماعيين',                 weight: 1 },
];

// بنك ← مادة جديد (المصدر → key بعد التطبيع) وإصلاح تسمية المحور حسب الإعلان
const BANKS = [
  {
    file: 'questions_tarbawiyin_tadbir_idari_tarbawi.json',
    oldSubject: 'tarbawi_2', newSubject: 'tadbir_idari_tarbawi',
    topicRewrite: { 'التدبير الإداري والتربوي': 'التدبير الإداري والتربوي' },
  },
  {
    file: 'questions_tarbawiyin_mokhtabarat_horasa_tawthiq.json',
    oldSubject: 'tarbawi_1', newSubject: 'khas_tarbawi',
    topicRewrite: {}, // مواضيعه الثلاثة مهام الإطار التربوي — تبقى كما هي
  },
  {
    file: 'questions_iqtisad_tadbir_mali_mohasabati.json',
    oldSubject: 'iqtisad_1', newSubject: 'tadbir_mali_mohasabati',
    topicRewrite: { 'التدبير المادي والمالي والمحاسباتي': 'التدبير المالي والمحاسباتي' }, // التسمية الرسمية في الإعلان
  },
];

// ───────────────────────── التحميل والتطبيع ─────────────────────────
if (!INCLUDE_TARBAWI_1) {
  const idx = BANKS.findIndex((b) => b.oldSubject === 'tarbawi_1');
  if (idx >= 0) {
    BANKS.splice(idx, 1);
    console.log('⚠ INCLUDE_TARBAWI_1=false — تم استبعاد بنك المختبرات/الحراسة/التوثيق من الحزمة.');
  }
}
const subjectKeys = new Set(SUBJECTS.map((s) => s.key));

const questions = [];
const seenIds = new Set();
const problems = [];

for (const bank of BANKS) {
  const raw = JSON.parse(fs.readFileSync(path.join(BANK_DIR, bank.file), 'utf8'));
  if (!Array.isArray(raw)) throw new Error(`الملف ليس مصفوفة: ${bank.file}`);
  for (const q of raw) {
    if (!q || typeof q !== 'object') { problems.push('صف غير صالح في ' + bank.file); continue; }
    if (seenIds.has(q.id)) { problems.push(`معرف مكرر: ${q.id}`); continue; }
    if (!Array.isArray(q.options) || q.options.length !== 4) { problems.push(`خيارات بغير 4: ${q.id}`); continue; }
    if (!q.options.includes(q.correct_answer)) { problems.push(`الجواب غير ضمن الخيارات: ${q.id}`); continue; }
    seenIds.add(q.id);

    // تدوير حتمي للخيارات (رقم السؤال mod 4) لكسر انحياز «الجواب دائماً أول».
    const n = parseInt(String(q.id).replace(/\D+/g, ''), 10) || 0;
    const off = n % 4;
    const options = q.options.slice(off).concat(q.options.slice(0, off));

    const rewrittenTopic = bank.topicRewrite[q.topic] || q.topic;
    questions.push({
      id: String(q.id),
      cycles: CYCLES.slice(),
      subject: bank.newSubject,
      topic: String(rewrittenTopic),
      question: String(q.question),
      options,
      correct_answer: String(q.correct_answer),
      explanation: String(q.explanation || ''),
    });
  }
}

// ليست كل مواد الحزمة لها بنك بعد — تُعلن بالأسماء الرسمية وتظهر «قيد التحضير».
const subjectsForPackage = SUBJECTS
  .filter((s) => INCLUDE_TARBAWI_1 || s.key !== 'khas_tarbawi')
  .map((s) => ({ key: s.key, name: s.name, cycles: CYCLES.slice(), weight: s.weight }));

const badSubject = questions.filter((q) => !subjectKeys.has(q.subject));
if (badSubject.length) problems.push(`أسئلة بمادة غير معلنة: ${badSubject.map((q) => q.id).join(',')}`);

// ───────────────────────── الحزمة (مواصفة §1.1) ─────────────────────────
const pkg = {
  package_version: '1.0',
  exam: {
    name: EXAM.name,
    slug: EXAM.slug,
    description: EXAM.description,
    cycles: EXAM_CYCLES,
    // امتدادات v2.0 (يستقبلها زر الرفع القادم لضبط البطاقة):
    short_name: EXAM.short_name,
    icon: EXAM.icon,
    color: EXAM.color,
    is_active: EXAM.is_active,
    sort_order: EXAM.sort_order,
  },
  subjects: subjectsForPackage,
  questions,
  summaries: [], // ملخصات هذه المباراة: قيد التجهيز (دفعة قادمة من المطوّر)
};

const pkgPath = path.join(ROOT, 'exam_package.json');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

// ───────────────────────── SQL البذر (مسار الاحتياط §4) ─────────────────────────
const esc = (s) => String(s).replace(/'/g, "''").replace(/\u0000/g, '');
const cyclesLit = `ARRAY[${CYCLES.map((c) => `'${c}'`).join(',')}]::text[]`;

// is_trial: أول N لكل مادة بترتيب معرف صاعد
const bySubject = new Map();
for (const q of questions) {
  if (!bySubject.has(q.subject)) bySubject.set(q.subject, []);
  bySubject.get(q.subject).push(q);
}
const trialIds = new Set();
for (const [, list] of bySubject) {
  list.sort((a, b) => a.id.localeCompare(b.id));
  list.slice(0, TRIAL_PER_SUBJECT).forEach((q) => trialIds.add(q.id));
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

const sql = [];
sql.push('-- ============================================================================');
sql.push('-- بذر مباراة «أطر المختصين» (tarbawiyin): بطاقة + مواد + أسئلة + إجابات محمية.');
sql.push('-- شرط التنفيذ: تدريل supabase_multiexam_phase1.sql أولاً (جداول exams/subjects).');
sql.push('-- التنفيذ متكرر آمن (ON CONFLICT DO UPDATE). المحتوى مدفوع — لا يُرفع للمستودع.');
sql.push('-- ============================================================================');
sql.push('');
sql.push(`INSERT INTO public.exams (id, slug, name, short_name, description, icon, color, is_active, sort_order)`);
sql.push(`VALUES ('${EXAM.slug}', '${EXAM.slug}', '${esc(EXAM.name)}', '${esc(EXAM.short_name)}',`);
sql.push(`        '${esc(EXAM.description)}', '${EXAM.icon}', '${EXAM.color}', ${EXAM.is_active}, ${EXAM.sort_order})`);
sql.push(`ON CONFLICT (id) DO UPDATE SET`);
sql.push(`  slug = EXCLUDED.slug, name = EXCLUDED.name, short_name = EXCLUDED.short_name,`);
sql.push(`  description = EXCLUDED.description, icon = EXCLUDED.icon, color = EXCLUDED.color,`);
sql.push(`  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;`);
sql.push('');
sql.push(`INSERT INTO public.subjects (exam_id, key, name, cycles, weight) VALUES`);
const subjRows = subjectsForPackage.map((s, i) => {
  const tail = (i < subjectsForPackage.length - 1 ? ',' : ';');
  return `('${EXAM.slug}', '${s.key}', '${esc(s.name)}', ${cyclesLit}, ${s.weight})${tail}`;
});
sql.push(...subjRows);
sql.push(`ON CONFLICT (exam_id, key) DO UPDATE SET`);
sql.push(`  name = EXCLUDED.name, cycles = EXCLUDED.cycles, weight = EXCLUDED.weight;`);
sql.push('');
sql.push(`-- الأسئلة: النصوص والخيارات فقط (الإجابات في question_answers). دفعات من 20.`);
sql.push(`-- is_trial = أول ${TRIAL_PER_SUBJECT} سؤالاً لكل مادة (العيّنة المجانية).`);
for (const part of chunk(questions, 20)) {
  sql.push(`INSERT INTO public.questions (id, cycles, subject, topic, question, options, is_trial, exam_id) VALUES`);
  const rows = part.map((q, i) => {
    const optsJson = JSON.stringify(q.options); // مصفوفة JSON صالحة داخل نص SQL
    const tail = (i < part.length - 1 ? ',' : '');
    return `('${q.id}', ${cyclesLit}, '${esc(q.subject)}', '${esc(q.topic)}', '${esc(q.question)}', '${esc(optsJson)}'::jsonb, ${trialIds.has(q.id)}, '${EXAM.slug}')${tail}`;
  });
  sql.push(...rows);
  sql.push(`ON CONFLICT (id) DO UPDATE SET`);
  sql.push(`  cycles = EXCLUDED.cycles, subject = EXCLUDED.subject, topic = EXCLUDED.topic,`);
  sql.push(`  question = EXCLUDED.question, options = EXCLUDED.options, is_trial = EXCLUDED.is_trial,`);
  sql.push(`  exam_id = EXCLUDED.exam_id;`);
  sql.push('');
}
sql.push('-- الإجابات والشروح (جدول محمي — المشترك الكامل/المشرف أو عبر answer_question).');
for (const part of chunk(questions, 20)) {
  sql.push(`INSERT INTO public.question_answers (question_id, correct_answer, explanation) VALUES`);
  const rows = part.map((q, i) => {
    const tail = (i < part.length - 1 ? ',' : ';');
    return `('${q.id}', '${esc(q.correct_answer)}', '${esc(q.explanation)}')${tail}`;
  });
  sql.push(...rows);
  sql.push(`ON CONFLICT (question_id) DO UPDATE SET`);
  sql.push(`  correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation;`);
  sql.push('');
}
sql.push('-- ─── الاستعلامات للتحقق بعد التنفيذ ───');
sql.push(`-- SELECT subject, count(*) AS q, count(*) FILTER (WHERE is_trial) AS trial`);
sql.push(`--   FROM public.questions WHERE exam_id = '${EXAM.slug}' GROUP BY subject ORDER BY subject;`);
sql.push(`-- SELECT count(*) FROM public.question_answers qa`);
sql.push(`--   JOIN public.questions q ON q.id = qa.question_id WHERE q.exam_id = '${EXAM.slug}';`);
sql.push(`-- SELECT * FROM public.exams WHERE id = '${EXAM.slug}';`);

const sqlPath = path.join(ROOT, 'supabase_tarbawiyin_seed.sql');
fs.writeFileSync(sqlPath, sql.join('\n'), 'utf8');

// ───────────────────────── التقرير ─────────────────────────
const pos = [0, 0, 0, 0];
questions.forEach((q) => pos[q.options.indexOf(q.correct_answer)]++);
const perSubject = {};
bySubject.forEach((list, key) => { perSubject[key] = { total: list.length, trial: list.filter((q) => trialIds.has(q.id)).length }; });

console.log('═══ تقرير البناء ═══');
console.log('grade-total:', questions.length, '| subjects:', subjectsForPackage.length, '| problems:', problems.length);
problems.slice(0, 10).forEach((p) => console.log('  ✗', p));
console.log('perSubject:', JSON.stringify(perSubject, null, 2));
console.log('answer-position (0-based):', pos);
console.log('package:', pkgPath, `(${(fs.statSync(pkgPath).size / 1024).toFixed(0)} KB)`);
console.log('seed sql:', sqlPath, `(${(fs.statSync(sqlPath).size / 1024).toFixed(0)} KB)`);
if (problems.length > 0) process.exit(2);
