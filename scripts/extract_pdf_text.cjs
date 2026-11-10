/**
 * Extracts best-effort text from a PDF (FlateDecode streams) for the Arabic
 * exam announcement. Local utility only (reads an announcement the owner
 * supplies); never ships PDF content to the repo.
 * Usage: node scripts/extract_pdf_text.cjs <file.pdf>
 */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/extract_pdf_text.cjs <file.pdf>'); process.exit(1); }

let buf = fs.readFileSync(file);
const pieces = [];

while (true) {
  const i = buf.indexOf(Buffer.from('stream'));
  if (i === -1) break;
  const st = i + 7;
  const en = buf.indexOf(Buffer.from('endstream'), st);
  if (en < 0) break;
  let chunk = buf.slice(st, en);
  if (chunk[0] === 13 || chunk[0] === 10) chunk = chunk.slice(1);
  if (chunk[0] === 13 || chunk[0] === 10) chunk = chunk.slice(1);
  let text;
  try { text = zlib.inflateSync(chunk); }
  catch (e) { try { text = zlib.inflateRawSync(chunk); } catch (e2) { text = null; } }
  if (text) {
    const s = text.toString('latin1');
    const strs = s.match(/\(((?:\\.|[^()\\])*)\)/g);
    if (strs) pieces.push(strs.join(' '));
    else {
      const clean = s.replace(/[\x00-\x1F\x7F-\xFF]+/g, ' ');
      if (clean.trim()) pieces.push(clean);
    }
  }
  buf = buf.slice(en + 9);
}

const joined = pieces.join(' ');
const arab = joined.match(/[\u0600-\u06FF][^]{3,}/g) || [];
const compact = arab.join(' ').replace(/\s+/g, ' ');
console.log(compact.slice(0, 6000));
if (arab.length === 0) {
  console.log('\n[no Arabic streams found — dumping latin text head]');
  console.log(joined.replace(/[^\x20-\x7E]+/g, ' ').slice(0, 3000));
}
