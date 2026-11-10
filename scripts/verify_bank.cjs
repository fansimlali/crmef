/**
 * أداة التحقق من بنك أسئلة — تُشغَّل على ملفات بنوك «مباراة أطر المختصين».
 * الاستعمال:  node scripts/verify_bank.cjs "tarbawiyin mokhtabarat/questions_nafsia_ijtimaiya.json"
 *            node scripts/verify_bank.cjs <ملف> ... ( plusieurs ملفات )
 * الفحص: عدد الأسئلة، التكرار، 4 خيارات، انتماء الإجابة الصحيحة للخيارات،
 *        وجود الشرح، توزيع مواضع الإجابة الصحيحة، الحقول الفارغة، ترميز UTF-8.
 * المخرج: تقرير + رمز خروج 0 (سليم) أو 1 (أخطاء).
 */
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('الاستعمال: node scripts/verify_bank.cjs <ملف بنك> [ملف آخر ...]');
  process.exit(2);
}

const EXPECTED_COUNT = 100;
let globalErrors = 0;

for (const file of files) {
  const abs = path.resolve(file);
  console.log('\n══════════════════════════════════════════');
  console.log('الملف:', file);
  console.log('══════════════════════════════════════════');

  let raw;
  try {
    raw = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    console.error('✗ تعذّر قراءة الملف:', e.message);
    globalErrors++;
    continue;
  }

  // فحص الترميز: وجود محارف بديلة (U+FFFD) يعني تلفاً في UTF-8
  if (raw.includes('\uFFFD')) {
    console.error('✗ الملف يحتوي محارف تالفة (ترميز ليس UTF-8 صحيحاً).');
    globalErrors++;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('✗ JSON غير صالح:', e.message);
    globalErrors++;
    continue;
  }

  if (!Array.isArray(data)) {
    console.error('✗ الملف ليس مصفوفة JSON من الأسئلة.');
    globalErrors++;
    continue;
  }

  const errors = [];
  const warnings = [];
  const positions = [0, 0, 0, 0];
  const subjects = new Map();
  const ids = new Map();
  const topics = new Map();

  if (data.length !== EXPECTED_COUNT) {
    errors.push(`عدد الأسئلة ${data.length} (المطلوب ${EXPECTED_COUNT}).`);
  }

  data.forEach((q, i) => {
    const at = `سؤال #${i + 1}`;
    if (!q || typeof q !== 'object') { errors.push(`${at}: عنصر غير صالح.`); return; }
    if (!q.id || typeof q.id !== 'string') errors.push(`${at}: الحقل id مفقود أو غير نصي.`);
    else if (ids.has(q.id)) errors.push(`${at}: معرف مكرر «${q.id}» (موجود أيضاً في #${ids.get(q.id) + 1}).`);
    else ids.set(q.id, i);

    if (!Array.isArray(q.cycles) || q.cycles.length === 0) errors.push(`${at} (${q.id}): الحقل cycles يجب أن يكون مصفوفة غير فارغة (قيمة المسلك).`);
    if (!q.subject || typeof q.subject !== 'string') errors.push(`${at} (${q.id}): الحقل subject مفقود.`);
    else subjects.set(q.subject, (subjects.get(q.subject) || 0) + 1);

    if (!q.topic || typeof q.topic !== 'string' || !q.topic.trim()) errors.push(`${at} (${q.id}): الحقل topic فارغ.`);
    else topics.set(q.topic, (topics.get(q.topic) || 0) + 1);

    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) errors.push(`${at} (${q.id}): نص السؤال فارغ.`);
    if (!Array.isArray(q.options)) { errors.push(`${at} (${q.id}): options ليست مصفوفة.`); return; }
    if (q.options.length !== 4) errors.push(`${at} (${q.id}): عدد الخيارات ${q.options.length} (المطلوب 4 بالضبط).`);
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) errors.push(`${at} (${q.id}): يوجد خيار فارغ أو غير نصي.`);
    if (new Set(q.options).size !== q.options.length) errors.push(`${at} (${q.id}): خيارات مكررة.`);
    if (!q.correct_answer || typeof q.correct_answer !== 'string') errors.push(`${at} (${q.id}): الحقل correct_answer مفقود.`);
    else {
      const idx = q.options.indexOf(q.correct_answer);
      if (idx === -1) errors.push(`${at} (${q.id}): correct_answer ليس ضمن الخيارات (مطابقة نصية حرفية).`);
      else positions[idx]++;
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length < 10) {
      errors.push(`${at} (${q.id}): الشرح (explanation) مفقود أو قصير جداً (مطلوب شرح تعليمي).`);
    }
    if ('is_trial' in q) errors.push(`${at} (${q.id}): الحقل is_trial محظور — يُعيَّن تلقائياً عند الاستيراد.`);
    if ('correct_answer_index' in q || 'answer' in q) errors.push(`${at} (${q.id}): الإجابة تُعطى بالنص لا بالرقم.`);
  });

  console.log('الأسئلة:', data.length);
  console.log('المواد :', JSON.stringify(Object.fromEntries(subjects)));
  console.log('المحاور:', topics.size, '—', JSON.stringify(Object.fromEntries(topics)));
  console.log('توزيع مواضع الإجابة الصحيحة (0-based):', positions);

  const spread = Math.max(...positions) - Math.min(...positions);
  if (data.length >= 40 && spread > Math.ceil(data.length / 4) + 2) {
    warnings.push(`توزيع مواضع الإجابة غير متوازن (الفارق ${spread}) — يُفضّل 25/25/25/25.`);
  }

  if (errors.length) {
    console.log(`\n✗ أخطاء (${errors.length}):`);
    errors.slice(0, 25).forEach((e) => console.log('  -', e));
    if (errors.length > 25) console.log(`  ... و${errors.length - 25} خطأ أخرى`);
    globalErrors += errors.length;
  } else {
    console.log('\n✓ لا أخطاء — الملف مطابق للعقد.');
  }
  warnings.forEach((w) => console.log('  ⚠', w));
}

console.log('\n══════════════════════════════════════════');
console.log(globalErrors === 0 ? '✓ النتيجة: كل الملفات سليمة.' : `✗ النتيجة: ${globalErrors} خطأ — يجب التصحيح قبل التسليم.`);
process.exit(globalErrors === 0 ? 0 : 1);
