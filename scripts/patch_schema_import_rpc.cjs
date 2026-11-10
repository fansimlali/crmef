/**
 * إعادة لصق كتلة دالة الرفع (المرحلة 3) داخل supabase_schema.sql بعد أي
 * تعديل في supabase_import_exam_rpc.sql — خيطة واحدة للحفاظ على مصدرين متطابقين.
 */
const fs = require('fs');
const schema = 'supabase_schema.sql';
const block = 'supabase_import_exam_rpc.sql';
let sc = fs.readFileSync(schema, 'utf8');
const marker = '-- المرحلة 3 — دالة رفع حزمة المباراة';
const idx = sc.indexOf(marker);
if (idx === -1) throw new Error('HTTPS marker not found');
const cut = sc.lastIndexOf('-- ============================================================================', idx);
fs.writeFileSync(schema, sc.slice(0, cut) + (sc.slice(0, cut).endsWith('\n\n') ? '' : '\n'), 'utf8');
fs.appendFileSync(schema, fs.readFileSync(block, 'utf8'), 'utf8');
const chk = fs.readFileSync(schema, 'utf8');
console.log('schema re-patched, size:', fs.statSync(schema).size);
console.log('contains v_nm declaration:', chk.includes('  v_nm           text;'));
console.log('function count:', (chk.match(/import_exam_package/g) || []).length);
