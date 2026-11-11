/**
 * أداة التحقق العام من حزمة مباراة (exam_package.json) — تعمل مع أي مباراة.
 *
 * تعكس قواعد الواجهة (src/lib/examPackage.ts) وقواعد الخادم (import_exam_package)
 * في جداول قاعدة البيانات:
 *   exams  ← exam
 *   subjects ← subjects
 *   questions ← questions
 *   question_answers ← correct_answer + explanation
 *   summaries ← summaries
 *
 * الاستعمال:
 *   node scripts/verify_package.cjs exam_package.json [العدد الأدنى لكل مادة]
 * مثال:
 *   node scripts/verify_package.cjs "tarbawiyin mokhtabarat/exam_package.json" 100
 *
 * المخرج: تقرير مفصّل + رمز خروج 0 (سليم) أو 1 (أخطاء).
 */
const fs = require('fs');
const path = require('path');

const CYCLE_IDS = ['primary', 'secondary_prep', 'secondary_qual'];
const MAX_ERRORS = 60;

const file = process.argv[2];
const MIN_PER_SUBJECT = Number(process.argv[3] || 0);

if (!file) {
  console.error('الاستعمال: node scripts/verify_package.cjs <exam_package.json> [الحد الأدنى لكل مادة]');
  process.exit(2);
}

const abs = path.resolve(file);
console.log('══════════════════════════════════════════════════════');
console.log('فحص حزمة المباراة:', file);
console.log('══════════════════════════════════════════════════════');

if (!fs.existsSync(abs)) {
  console.error('✗ الملف غير موجود:', abs);
  process.exit(1);
}

const raw = fs.readFileSync(abs, 'utf8');
if (raw.includes('\uFFFD')) {
  console.error('✗ الملف يحتوي محارف تالفة (ترميز ليس UTF-8 صحيحاً).');
}

let pkg;
try {
  pkg = JSON.parse(raw);
} catch (e) {
  console.error('✗ JSON غير صالح:', e.message);
  process.exit(1);
}

const errors = [];
const warnings = [];
const push = (m) => { if (errors.length < MAX_ERRORS) errors.push(m); };
const warn = (m) => warnings.push(m);
const str = (v) => typeof v === 'string' && v.trim() !== '';

/* ── 1) رأس الحزمة والمباراة ───────────────────────────────── */
if (pkg.package_version !== '1.0') push(`package_version يجب أن يكون "1.0" (وجد: ${JSON.stringify(pkg.package_version)}).`);
const ex = pkg.exam || {};
const slug = (ex.slug || '').toLowerCase();
if (!/^[a-z0-9_]{3,40}$/.test(slug)) push('exam.slug: 3-40 حرفاً من [a-z0-9_] فقط (مثال: tarbawiyin).');
if (!str(ex.name) || ex.name.length > 160) push('exam.name: نص مطلوب بحد 160 حرفاً.');
if (ex.staging !== undefined && typeof ex.staging !== 'boolean') push('exam.staging: قيمة منطقية true/false.');

/* ── 2) المسالك/الأسلاك المعلنة ────────────────────────────── */
const cycleIds = new Set();
const cycleNames = new Set();
if (!Array.isArray(ex.cycles) || ex.cycles.length === 0) {
  push('exam.cycles: مصفوفة بسلك واحد على الأقل مطلوبة.');
} else {
  if (ex.cycles.length > CYCLE_IDS.length) {
    warn(`exam.cycles: ${ex.cycles.length} مسالك — النظام الحالي يدعم ${CYCLE_IDS.length} كحد أقصى (${CYCLE_IDS.join('، ')}).`);
  }
  ex.cycles.forEach((c, i) => {
    const id = (c?.id || '').toLowerCase();
    if (!CYCLE_IDS.includes(id)) push(`exam.cycles[${i}].id خارج المعيار (${CYCLE_IDS.join(' / ')}).`);
    else if (!str(c?.name) || c.name.length > 60) push(`exam.cycles[${i}].name: نص معروض مطلوب بحد 60.`);
    else { cycleIds.add(id); cycleNames.add(c.name.trim()); }
  });
}

/* ── 3) المواد ──────────────────────────────────────────────── */
const subjectKeys = new Set();
const subjectNames = new Map();
const subjectCycles = new Map();
if (!Array.isArray(pkg.subjects) || pkg.subjects.length === 0) {
  push('subjects: مصفوفة بمادة واحدة على الأقل مطلوبة.');
} else {
  pkg.subjects.forEach((s, i) => {
    const key = (s?.key || '').toLowerCase();
    if (!/^[a-z0-9_]{3,50}$/.test(key)) push(`subjects[${i}].key: 3-50 حرفاً لاتينياً صغيراً من [a-z0-9_].`);
    else if (subjectKeys.has(key)) push(`subjects[${i}]: المفتاح مكرر (${key}).`);
    else subjectKeys.add(key);
    if (!str(s?.name) || s.name.length > 160) push(`subjects[${i}].name: نص مطلوب بحد 160 حرفاً.`);
    else subjectNames.set(key, s.name.trim());
    if (!Array.isArray(s?.cycles) || s.cycles.length === 0) push(`subjects[${i}].cycles: مصفوفة معرفات مطلوبة.`);
    else {
      s.cycles.forEach((c) => { if (!cycleIds.has(c)) push(`subjects[${i}]: cycle غير معلن (${c}).`); });
      subjectCycles.set(key, s.cycles.slice());
    }
    if (typeof s?.weight !== 'number' || !Number.isFinite(s.weight) || s.weight <= 0 || s.weight > 9999) {
      push(`subjects[${i}].weight: عدد موجب ≤ 9999.`);
    }
  });
}

/* ── 4) الأسئلة ─────────────────────────────────────────────── */
const qIds = new Set();
const perSubject = new Map();
const perSubjectPositions = new Map();
const positions = [0, 0, 0, 0];
let total = 0;

if (!Array.isArray(pkg.questions) || pkg.questions.length === 0) {
  push('questions: مصفوفة بسؤال واحد على الأقل مطلوبة.');
} else {
  total = pkg.questions.length;
  pkg.questions.forEach((q, i) => {
    const id = (q?.id || '').toLowerCase();
    if (!/^[a-z0-9_]{2,30}[0-9]{3}$/.test(id)) push(`questions[${i}].id: بادئة + 3 أرقام مكمّلة (${id || 'فارغ'}).`);
    else if (qIds.has(id)) push(`questions[${i}]: معرف مكرر (${id}).`);
    else qIds.add(id);

    if ('is_trial' in (q || {})) push(`questions[${i}]: حقل is_trial محظور — يُعيَّن تلقائياً.`);
    if ('is_draft' in (q || {})) push(`questions[${i}]: حقل is_draft محظور — يُضبط من exam.staging.`);
    if ('answer' in (q || {}) || 'correct_answer_index' in (q || {})) push(`questions[${i}]: الإجابة تُعطى بالنص لا بالرقم.`);

    const sub = (q?.subject || '').toLowerCase();
    if (!subjectKeys.has(sub)) push(`questions[${i}]: مادة غير معلنة (${q?.subject || '؟'}).`);
    if (!str(q?.topic)) push(`questions[${i}].topic: فارغ.`);
    if (!str(q?.question)) push(`questions[${i}].question: فارغ.`);
    if (str(q?.question) && q.question.length > 600) warn(`questions[${i}]: نص السؤال طويل جداً (${q.question.length} حرفاً).`);

    const opts = Array.isArray(q?.options) ? q.options : null;
    if (!opts || opts.length !== 4) push(`questions[${i}].options: 4 خيارات بالضبط (وجد ${opts ? opts.length : '؟'}).`);
    else if (opts.some((o) => !str(o)) || new Set(opts).size !== 4) push(`questions[${i}].options: خيارات فارغة أو مكررة.`);
    else {
      const correct = q?.correct_answer;
      if (!str(correct) || !opts.includes(correct)) push(`questions[${i}].correct_answer: يجب أن يطابق حرفياً أحد الخيارات.`);
      else {
        const p = opts.indexOf(correct);
        positions[p]++;
        if (!perSubjectPositions.has(sub)) perSubjectPositions.set(sub, [0, 0, 0, 0]);
        perSubjectPositions.get(sub)[p]++;
      }
      // توازن أطوال الخيارات (يمنع تمييز الصحيح بصياغته)
      const lens = opts.map((o) => o.length);
      const maxL = Math.max(...lens), minL = Math.min(...lens);
      if (maxL > 0 && minL / maxL < 0.45 && maxL - minL > 40) {
        warn(`questions[${i}]: تفاوت كبير في طول الخيارات (${minL}–${maxL} حرفاً) — قد يميّز الصحيح.`);
      }
    }
    if (!str(q?.explanation)) push(`questions[${i}].explanation: مطلوب (تعليل لا يكرّر الخيار).`);
    else if (q.explanation.length < 25) warn(`questions[${i}]: الشرح قصير (${q.explanation.length} حرفاً).`);

    if (!Array.isArray(q?.cycles) || q.cycles.length === 0) push(`questions[${i}].cycles: مصفوفة غير فارغة.`);
    else {
      q.cycles.forEach((c) => { if (!cycleIds.has(c)) push(`questions[${i}].cycles: cycle غير معلن (${c}).`); });
      // المسلك المعلن للمادة يجب أن يطابق cycles السؤال
      const declared = subjectCycles.get(sub);
      if (declared && q.cycles.some((c) => !declared.includes(c))) {
        push(`questions[${i}].cycles: السؤال خارج مسلك مادته (${q.cycles.join(',')} ⊄ ${declared.join(',')}).`);
      }
    }
    perSubject.set(sub, (perSubject.get(sub) || 0) + 1);
  });
}

/* ── 5) الملخصات ────────────────────────────────────────────── */
const sIds = new Set();
let summaries = 0;
if (pkg.summaries !== undefined && pkg.summaries !== null && !Array.isArray(pkg.summaries)) {
  push('summaries: يجب أن تكون مصفوفة (أو حذف الحقل).');
} else if (Array.isArray(pkg.summaries)) {
  summaries = pkg.summaries.length;
  pkg.summaries.forEach((s, i) => {
    const id = (s?.id || '').toLowerCase();
    if (!/^[a-z0-9_]{6,64}$/.test(id)) push(`summaries[${i}].id: معرف لاتيني صغير (sum_ موصى به).`);
    else if (sIds.has(id)) push(`summaries[${i}]: معرف مكرر (${id}).`);
    else sIds.add(id);
    if (!str(s?.title) || !str(s?.category)) push(`summaries[${i}]: title/category مطلوبة.`);
    if (!cycleNames.has((s?.cycle || '').trim())) push(`summaries[${i}].cycle: يجب أن يطابق أحد أسماء exam.cycles (${s?.cycle || '؟'}).`);
    if (!Array.isArray(s?.sections) || s.sections.length === 0) push(`summaries[${i}].sections: فارغة.`);
    else s.sections.forEach((sec, si) => {
      if (!str(sec?.heading)) push(`summaries[${i}].sections[${si}].heading فارغ.`);
      if (!Array.isArray(sec?.paragraphs) || sec.paragraphs.length === 0) push(`summaries[${i}].sections[${si}].paragraphs فارغة.`);
      else if (sec.paragraphs.some((p) => !str(p))) push(`summaries[${i}].sections[${si}].paragraphs: فقرة فارغة.`);
    });
  });
}

/* ── 6) حد أدنى لكل مادة + توازن المواضع ───────────────────── */
if (MIN_PER_SUBJECT > 0) {
  subjectKeys.forEach((key) => {
    const c = perSubject.get(key) || 0;
    if (c < MIN_PER_SUBJECT) push(`المادة «${subjectNames.get(key) || key}»: ${c} سؤال (المطلوب ${MIN_PER_SUBJECT}).`);
  });
}
const spread = Math.max(...positions) - Math.min(...positions);
if (total >= 40 && spread > Math.ceil(total / 4) + 2) {
  warn(`توزيع مواضع الإجابة الصحيحة غير متوازن globally: ${positions.join('/')} — يُفضّل 25/25/25/25.`);
}

/* ── 7) التقرير ─────────────────────────────────────────────── */
const trialTotal = Array.from(perSubject.values()).reduce((t, c) => t + Math.min(20, c), 0);
console.log('\n— الهوية —');
console.log(`  المباراة   : ${ex.name || '؟'}  (slug: ${slug || '؟'})`);
console.log(`  المسالك     : ${(ex.cycles || []).map((c) => `${c.id}="${c.name}"`).join(' | ') || '—'}`);
console.log(`  الوضع التجريبي (staging): ${ex.staging === undefined ? 'غير محدد (الافتراضي عند الرفع: true)' : ex.staging}`);
console.log('\n— المواد —');
subjectKeys.forEach((key) => {
  const pos = perSubjectPositions.get(key) || [0, 0, 0, 0];
  console.log(`  ${key.padEnd(28)} | ${String(perSubject.get(key) || 0).padStart(4)} سؤال | cycles: ${(subjectCycles.get(key) || []).join(',')} | مواضع الإجابة: ${pos.join('/')}`);
});
console.log('\n— الإحصاء —');
console.log(`  المواد: ${subjectKeys.size} | الأسئلة: ${total} | الملخصات: ${summaries}`);
console.log(`  العيّنة المجانية المتوقعة (أول 20/مادة): ${trialTotal}`);
console.log(`  مواضع الإجابة الصحيحة (عالمي): ${positions.join(' / ')}`);

console.log('\n— ما سيُكتب في قاعدة البيانات —');
console.log(`  exams            : 1   (${slug})`);
console.log(`  subjects         : ${subjectKeys.size}`);
console.log(`  questions        : ${total}`);
console.log(`  question_answers : ${total}  (correct_answer + explanation)`);
console.log(`  summaries        : ${summaries}`);

if (errors.length) {
  console.log(`\n✗ أخطاء (${errors.length}) — لا ترفع الملف قبل تصحيحها:`);
  errors.forEach((e) => console.log('  -', e));
  console.log('\n✗ النتيجة: الحزمة مرفوضة.');
  process.exit(1);
}
console.log('\n✓ لا أخطاء — الحزمة مطابقة لعقد التطبيق.');
if (warnings.length) {
  console.log(`  ⚠ ${warnings.length} تنبيه:`);
  warnings.slice(0, 15).forEach((w) => console.log('   -', w));
  if (warnings.length > 15) console.log(`   ... و${warnings.length - 15} تنبيهاً آخر`);
}
console.log('\n✓ النتيجة: جاهزة للرفع (مع «وضع المهلة التجريبية» مفعّلاً).');
process.exit(0);
