import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://lwicejthksskkhfsilky.supabase.co';
const SERVICE_KEY = process.argv[2];

if (!SERVICE_KEY) {
  console.error('Usage: node upload_summaries.mjs <SERVICE_ROLE_KEY>');
  process.exit(1);
}

async function uploadSummaries() {
  const sourcePath = path.resolve('scripts/seed-data/summariesData.ts');
  const content = fs.readFileSync(sourcePath, 'utf8');

  const marker = content.indexOf('SUMMARIES_DATA');
  const equals = content.indexOf('=', marker);
  const start = content.indexOf('[', equals);
  const end = content.lastIndexOf(']');
  const data = JSON.parse(content.slice(start, end + 1));

  console.log(`🚀 بدء رفع ${data.length} ملخصاً إلى جدول summaries في Supabase...`);

  const payload = data.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    cycle: item.cycle,
    read_time: item.readTime,
    sections: item.sections
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/summaries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('❌ خطأ أثناء الرفع:', res.status, errText);
    return;
  }

  const inserted = await res.json();
  console.log(`🎉 تم رفع وحفظ ${inserted.length} ملخص بنجاح في قاعدة البيانات!`);

  // Verify total count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/summaries?select=id&limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'count=exact'
    }
  });
  console.log('📊 العدد الإجمالي للملخصات الآن:', countRes.headers.get('content-range'));
}

uploadSummaries().catch(console.error);
