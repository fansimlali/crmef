/**
 * يبني «خريطة المسالك» لكل مباراة: أي مادة تنتمي إلى أي مسلك وبأي معامل.
 *
 * المصادر:
 *  - supabase_schema.sql  → مواد مباراة CRMEF (المعادات/الأسلاك الرسمية)
 *  - scripts/build_tarbawiyin_package.cjs → مواد مباراة أطر المختصين (المسالك الثلاثة)
 *
 * المخرجات:
 *  - src/data/trackMap.ts        (يستهلكها التطبيق: نافذة الرفع + شاشات العرض)
 *  - reports/track_map.md        (جدول بشري: ما يوضع أين + الفجوات)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* ── 1) مواد CRMEF من ملف المخطط ─────────────────────────────── */
function parseCrmefSubjects() {
  const sql = read('supabase_schema.sql');
  const start = sql.indexOf("INSERT INTO public.subjects (exam_id, key, name, cycles, weight) VALUES");
  if (start < 0) return [];
  const block = sql.slice(start, start + 4000);
  const rows = [];
  const re = /\('crmef','([a-z_]+)','([^']*)',ARRAY\[([^\]]*)\]::text\[\],(\d+)\)/g;
  let m;
  while ((m = re.exec(block))) {
    const cycles = m[3].split(',').map((s) => s.trim().replace(/'/g, ''));
    rows.push({ exam: 'crmef', key: m[1], name: m[2], cycles, weight: Number(m[4]) });
  }
  return rows;
}

/* ── 2) مواد أطر المختصين من باني الحزمة ──────────────────────── */
function parseTarbawiyinSubjects() {
  const src = read('scripts/build_tarbawiyin_package.cjs');
  const names = {};
  const re = /key:\s*'([a-z_]+)',\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) names[m[1]] = m[2];
  const tracks = {
    primary: 'مسلك تكوين المختصين التربويين',
    secondary_prep: 'مسلك تكوين أطر مختصي الاقتصاد والتدبير',
    secondary_qual: 'مسلك تكوين أطر المختصين الاجتماعيين',
  };
  const rows = [];
  for (const [key, name] of Object.entries(names)) {
    const cycle = Object.keys(tracks).find((c) => src.includes(`'${key}': { cycles: ['${c}']`) || src.includes(`key: '${key}'`) && false);
    rows.push({ key, name });
  }
  // نقرأ التعيين من TRACK_OF_SUBJECT إن وُجد، وإلا من cycles المذكورة في الملف
  const cycleOf = {};
  const re2 = /(\w+):\s*\{[^{}]*?cycles:\s*\[([^\]]*)\]/g;
  while ((m = re2.exec(src))) {
    const cyc = m[2].replace(/'/g, '').trim();
    if (cyc) cycleOf[m[1]] = cyc;
  }
  for (const r of rows) r.cycles = cycleOf[r.key] ? [cycleOf[r.key]] : ['primary'];
  for (const r of rows) r.exam = 'tarbawiyin';
  return rows;
}

/* ── 3) بناء الخريطة ─────────────────────────────────────────── */
const EXAM_META = {
  crmef: {
    name: 'مباراة التعليم',
    tracks: {
      primary: { name: 'سلك التعليم الابتدائي', desc: 'التخصص المزدوج + ديداكتيك المواد + علوم التربية' },
      secondary_prep: { name: 'سلك التعليم الثانوي الإعدادي', desc: 'مادة التخصص + ديداكتيك التخصص + علوم التربية' },
      secondary_qual: { name: 'سلك التعليم الثانوي التأهيلي', desc: 'مادة التخصص + ديداكتيك التخصص + علوم التربية' },
    },
  },
  tarbawiyin: {
    name: 'مباراة أطر المختصين',
    tracks: {
      primary: { name: 'مسلك تكوين المختصين التربويين', desc: '' },
      secondary_prep: { name: 'مسلك تكوين أطر مختصي الاقتصاد والتدبير', desc: '' },
      secondary_qual: { name: 'مسلك تكوين أطر المختصين الاجتماعيين', desc: '' },
    },
  },
};

function build() {
  const subjects = [...parseCrmefSubjects(), ...parseTarbawiyinSubjects()];
  const map = {};
  for (const s of subjects) {
    map[s.exam] = map[s.exam] || {};
    for (const c of s.cycles) {
      map[s.exam][c] = map[s.exam][c] || [];
      map[s.exam][c].push({ key: s.key, name: s.name, weight: s.weight || 1 });
    }
  }
  return map;
}

function main() {
  const map = build();

  // ── ملف TS للتطبيق ──
  const ts = `// خريطة المسالك — مولَّدة من scripts/build_track_map.cjs (لا تُحرّر يدوياً).
// تحدّد: لكل مباراة ← المسالك ← المواد (المفتاح/الاسم/المعامل) — تُستخدم في نافذة الرفع
// وفي عرض «المسلك» و«الموضوع» للمستخدم.

export interface TrackSubject {
  key: string;
  name: string;
  weight: number;
}

export interface TrackDef {
  id: string;
  name: string;
  desc?: string;
  subjects: TrackSubject[];
}

export interface ExamTracks {
  id: string;
  name: string;
  tracks: TrackDef[];
}

export const EXAM_TRACK_MAP: ExamTracks[] = ${JSON.stringify(
    Object.entries(EXAM_META).map(([id, meta]) => ({
      id,
      name: meta.name,
      tracks: Object.entries(meta.tracks).map(([tid, t]) => ({
        id: tid,
        name: t.name,
        desc: t.desc || '',
        subjects: (map[id] && map[id][tid]) || [],
      })),
    })),
    null,
    2
  )};

/** مسالك مباراة معيّنة (بترتيب ثابت). */
export function getTracksOfExam(examId: string | null | undefined): TrackDef[] {
  if (!examId) return [];
  return EXAM_TRACK_MAP.find((e) => e.id === examId)?.tracks ?? [];
}

/** المواد المنتمية لمسلك في مباراة. */
export function getSubjectsOfTrack(examId: string | null | undefined, trackId: string): TrackSubject[] {
  return getTracksOfExam(examId).find((t) => t.id === trackId)?.subjects ?? [];
}
`;
  const tsPath = path.join(ROOT, 'src', 'data', 'trackMap.ts');
  fs.mkdirSync(path.dirname(tsPath), { recursive: true });
  fs.writeFileSync(tsPath, ts, 'utf8');
  console.log('written:', path.relative(ROOT, tsPath));

  // ── تقرير بشري ──
  const lines = [];
  lines.push('# خريطة المسالك — أين يوضع كل موضوع');
  lines.push('');
  lines.push('> مولَّد من `scripts/build_track_map.cjs` — المصدر: جدول `subjects` في `supabase_schema.sql`');
  lines.push('> (مباراة التعليم) وباني حزمة أطر المختصين. المعاملات = أوزان الاختبارات الرسمية.');
  lines.push('');
  for (const [id, meta] of Object.entries(EXAM_META)) {
    lines.push(`\n## ${meta.name} (\`${id}\`)\n`);
    for (const [tid, t] of Object.entries(meta.tracks)) {
      const subs = (map[id] && map[id][tid]) || [];
      const total = subs.reduce((s, x) => s + (x.weight || 0), 0);
      lines.push(`### ${t.name} — \`${tid}\``);
      if (t.desc) lines.push(`_${t.desc}_`);
      lines.push('');
      lines.push('| # | مفتاح المادة | الاسم | المعامل |');
      lines.push('|---|---|---|---|');
      subs.forEach((s, i) => lines.push(`| ${i + 1} | \`${s.key}\` | ${s.name} | ${s.weight} |`));
      lines.push(`| | | **المجموع** | **${total}** |`);
      lines.push('');
    }
  }
  const repPath = path.join(ROOT, 'reports', 'track_map.md');
  fs.mkdirSync(path.dirname(repPath), { recursive: true });
  fs.writeFileSync(repPath, lines.join('\n'), 'utf8');
  console.log('written:', path.relative(ROOT, repPath));
}

if (require.main === module) main();
module.exports = { build, EXAM_META };
