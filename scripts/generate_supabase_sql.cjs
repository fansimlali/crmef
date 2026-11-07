const fs = require('fs');
const path = require('path');

const qs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'questions_seed.json'), 'utf8'));

let sql = `-- ==============================================================================
-- Schema and Seed for CRMEF Platform
-- Total deduplicated clean questions: ${qs.length}
-- ==============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  cycles TEXT[] NOT NULL DEFAULT '{"primary"}',
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read" ON questions
  FOR SELECT USING (true);

-- Allow authenticated insert/update/delete for admin
CREATE POLICY IF NOT EXISTS "Allow authenticated insert" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated update" ON questions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated delete" ON questions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert Questions
INSERT INTO questions (id, cycles, subject, topic, question, options, correct_answer, explanation)
VALUES
`;

const rows = qs.map(q => {
  const cyclesArray = `ARRAY[${(q.cycles || ['primary']).map(c => `'${c}'`).join(', ')}]`;
  const escapeSql = (str) => (str || '').replace(/'/g, "''");
  const optionsJson = `'${JSON.stringify(q.options).replace(/'/g, "''")}'::jsonb`;

  return `('${escapeSql(q.id)}', ${cyclesArray}, '${escapeSql(q.subject)}', '${escapeSql(q.topic)}', '${escapeSql(q.question)}', ${optionsJson}, '${escapeSql(q.correct_answer)}', '${escapeSql(q.explanation)}')`;
});

sql += rows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET\n' +
  '  cycles = EXCLUDED.cycles,\n' +
  '  subject = EXCLUDED.subject,\n' +
  '  topic = EXCLUDED.topic,\n' +
  '  question = EXCLUDED.question,\n' +
  '  options = EXCLUDED.options,\n' +
  '  correct_answer = EXCLUDED.correct_answer,\n' +
  '  explanation = EXCLUDED.explanation;\n';

fs.writeFileSync(path.join(__dirname, '..', 'supabase_schema.sql'), sql, 'utf8');
console.log(`Generated supabase_schema.sql with ${qs.length} questions.`);

