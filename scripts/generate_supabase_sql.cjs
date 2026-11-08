/**
 * Generates the PRIVATE question/answer seed SQL from questions_seed.json.
 *
 * Paid-model: questions + answers are paid content (trial = first 20/subject),
 * so the seed MUST NOT be committed. It writes `supabase_questions_seed.sql`
 * (gitignored) — run it in the Supabase SQL Editor AFTER supabase_schema.sql.
 *
 * IMPORTANT: this script never touches supabase_schema.sql (structure + RLS),
 * so it can never reintroduce old insecure policies.
 *
 * The bank source `questions_seed.json` is also private (gitignored, local only).
 *
 * Usage: node scripts/generate_supabase_sql.cjs
 */
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'supabase_questions_seed.sql');
const seedPath = path.join(__dirname, '..', 'questions_seed.json');

const qs = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const escapeSql = (str) => (str || '').replace(/'/g, "''");

// الأسئلة (نصوص + خيارات فقط — بلا إجابات)
const rows = qs.map((q) => {
  const cyclesArray = `ARRAY[${(q.cycles || ['primary']).map((c) => `'${c}'`).join(', ')}]`;
  const optionsJson = `'${JSON.stringify(q.options).replace(/'/g, "''")}'::jsonb`;

  return `('${escapeSql(q.id)}', ${cyclesArray}, '${escapeSql(q.subject)}', '${escapeSql(q.topic)}', '${escapeSql(q.question)}', ${optionsJson})`;
});

// الإجابات والشروح (جدول محمي: المشترك الكامل/المشرف فقط)
const answerRows = qs.map(
  (q) => `('${escapeSql(q.id)}', '${escapeSql(q.correct_answer)}', '${escapeSql(q.explanation)}')`
);

const sql =
  '-- Generated paid question-bank seed. DO NOT COMMIT.\n' +
  '-- Run this in the Supabase SQL Editor AFTER supabase_schema.sql.\n' +
  `-- Total questions: ${qs.length} (trial sample = first 20/subject by id)\n` +
  'INSERT INTO public.questions (id, cycles, subject, topic, question, options)\nVALUES\n' +
  rows.join(',\n') +
  '\nON CONFLICT (id) DO UPDATE SET\n' +
  '  cycles = EXCLUDED.cycles,\n' +
  '  subject = EXCLUDED.subject,\n' +
  '  topic = EXCLUDED.topic,\n' +
  '  question = EXCLUDED.question,\n' +
  '  options = EXCLUDED.options;\n' +
  '\nINSERT INTO public.question_answers (question_id, correct_answer, explanation)\nVALUES\n' +
  answerRows.join(',\n') +
  '\nON CONFLICT (question_id) DO UPDATE SET\n' +
  '  correct_answer = EXCLUDED.correct_answer,\n' +
  '  explanation = EXCLUDED.explanation;\n' +
  '\n-- تعليم العينة المجانية: أول 20 سؤالاً لكل مادة (مرتبة بالمعرّف).\n' +
  'WITH ranked AS (\n' +
  '  SELECT id, ROW_NUMBER() OVER (PARTITION BY subject ORDER BY id) AS rn\n' +
  '  FROM public.questions\n' +
  ')\n' +
  'UPDATE public.questions q SET is_trial = (r.rn <= 20) FROM ranked r WHERE q.id = r.id;\n';

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${qs.length} questions to ${outPath} (gitignored — do not commit).`);
