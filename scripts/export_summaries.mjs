/**
 * Generates a SQL seed file for the private `summaries` table from the
 * untracked local source `scripts/seed-data/summariesData.ts`.
 *
 * Usage: node scripts/export_summaries.mjs
 *
 * Never commit the generated SQL or the source file: they contain paid content.
 */
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('scripts/seed-data/summariesData.ts');
const outputPath = path.resolve('supabase_summaries_seed.sql');

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing paid content source: ${sourcePath}`);
  console.error('Keep this file locally (it is gitignored) and rerun the script.');
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf8');

// The file is a single exported array literal. Extract it without needing the
// TypeScript compiler API (the installed TS 7 package exposes only tsc).
const marker = source.indexOf('SUMMARIES_DATA');
const equals = source.indexOf('=', marker);
const start = source.indexOf('[', equals);
const end = source.lastIndexOf(']');

if (marker < 0 || equals < 0 || start < 0 || end <= start) {
  console.error('Could not locate the SUMMARIES_DATA array literal.');
  process.exit(1);
}

const literal = source.slice(start, end + 1);
const data = new Function(`"use strict"; return (${literal});`)();

if (!Array.isArray(data) || data.length === 0) {
  console.error('SUMMARIES_DATA was not found or is empty.');
  process.exit(1);
}

const sqlString = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`;

const rows = data.map((article) => {
  const sections = JSON.stringify(article.sections ?? []).replace(/'/g, "''");
  return `(${[
    sqlString(article.id),
    sqlString(article.title),
    sqlString(article.category),
    sqlString(article.cycle),
    sqlString(article.readTime),
    `'${sections}'::jsonb`,
  ].join(', ')})`;
});

const sql = `-- Generated paid summaries seed. DO NOT COMMIT.
-- Run this in the Supabase SQL Editor after supabase_schema.sql.
INSERT INTO public.summaries (id, title, category, cycle, read_time, sections)
VALUES
${rows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  cycle = EXCLUDED.cycle,
  read_time = EXCLUDED.read_time,
  sections = EXCLUDED.sections;
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Wrote ${data.length} summaries to ${outputPath}`);
