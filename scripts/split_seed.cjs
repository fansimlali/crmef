/**
 * Splits supabase_questions_seed.sql into editor-friendly chunks (200 questions each).
 * Usage: node scripts/split_seed.cjs
 * Output: supabase_seed_part_01.sql ... (gitignored, do not commit)
 */
const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'supabase_questions_seed.sql');
const CHUNK = 200;

if (!fs.existsSync(inPath)) {
  console.error('Run first: npm run seed:questions');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'questions_seed.json'), 'utf8'));
const escapeSql = (s) => (s || '').replace(/'/g, "''");

function header(n, total) {
  return `-- Part ${n}/${total} of seed (run in order). DO NOT COMMIT.\n`;
}

const parts = Math.ceil(seed.length / CHUNK);
for (let p = 0; p < parts; p++) {
  const slice = seed.slice(p * CHUNK, (p + 1) * CHUNK);
  const qRows = slice.map((q) => {
    const cycles = `ARRAY[${(q.cycles || ['primary']).map((c) => `'${c}'`).join(', ')}]`;
    const opts = `'${JSON.stringify(q.options).replace(/'/g, "''")}'::jsonb`;
    return `('${escapeSql(q.id)}', ${cycles}, '${escapeSql(q.subject)}', '${escapeSql(q.topic)}', '${escapeSql(q.question)}', ${opts})`;
  });
  const aRows = slice.map((q) => `('${escapeSql(q.id)}', '${escapeSql(q.correct_answer)}', '${escapeSql(q.explanation)}')`);
  let sql = header(p + 1, parts);
  sql += 'INSERT INTO public.questions (id, cycles, subject, topic, question, options)\nVALUES\n' + qRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET\n  cycles = EXCLUDED.cycles,\n  subject = EXCLUDED.subject,\n  topic = EXCLUDED.topic,\n  question = EXCLUDED.question,\n  options = EXCLUDED.options;\n\n';
  sql += 'INSERT INTO public.question_answers (question_id, correct_answer, explanation)\nVALUES\n' + aRows.join(',\n') + '\nON CONFLICT (question_id) DO UPDATE SET\n  correct_answer = EXCLUDED.correct_answer,\n  explanation = EXCLUDED.explanation;\n';
  if (p === parts - 1) {
    sql += '\n-- تعليم العينة المجانية: أول 20 سؤالاً لكل مادة.\nWITH ranked AS (\n  SELECT id, ROW_NUMBER() OVER (PARTITION BY subject ORDER BY id) AS rn\n  FROM public.questions\n)\nUPDATE public.questions q SET is_trial = (r.rn <= 20) FROM ranked r WHERE q.id = r.id;\n';
  }
  const name = `supabase_seed_part_${String(p + 1).padStart(2, '0')}.sql`;
  fs.writeFileSync(path.join(__dirname, '..', name), sql, 'utf8');
  console.log(name, slice.length, 'questions');
}
console.log(`Done: ${parts} part files (run each in order in SQL Editor).`);
