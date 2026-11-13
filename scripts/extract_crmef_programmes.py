# -*- coding: utf-8 -*-
"""
مستخرج «التوصيفات الرسمية» لمباراة التعليم (المركز الوطني للامتحانات) → JSON منظّم.

المصدر (جذر المشروع): 3 ملفات PDF
  • مادة أو مواد التخصص_0.pdf            → المكون 1: مادة/مواد التخصص (معامل 20، 4 ساعات)
  • ديداكتيك المادة أو المواد_0.pdf      → المكون 2: ديداكتيك المادة/المواد (معامل 12، ساعتان)
  • علوم التربية_ثانوي_1.pdf              → المكون 3: علوم التربية (معامل 8، ساعتان)

المخرج: crmef_programmes.json — لكل تخصص: مجالاته الرئيسة (بأوزانها) ومجالاته الفرعية
        (بأوزانها وعناصرها التفصيلية) — وهي مرجع توليد بنك الأسئلة وتوزيعه رسمياً.

التحقق الذاتي: مجموع أوزان المجالات الرئيسة لكل تخصص = 100% (أو مجموع الأوزان الفرعية).
"""
import io, json, os, re, sys, glob
from collections import OrderedDict
from pypdf import PdfReader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SRC_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SRC_DIR, 'crmef_programmes.json')

# أسطر زخرفية تُحذف من المحتوى (ترويسة/تذييل الصفحة)
FOOTER = ('cne@men', 'cnee@men', 'المركز الوطني', 'المركزالوطني', 'البريد', 'المقر المركزي')
# أسطر تCover تُستخدم للاكتشاف فقط
COVER = ('توصيف المجالات المضمونية', 'اختبارات الكتابية لمباريات', 'دورة نونبر', 'توصيف المضموني')

PCT_RE = re.compile(r'^(?:QCM\s*)?(\d{1,3})\s*%$')
MAIN_RE = re.compile(r'^(?:\d+\.\s*)?المجال\s*(?:الرئيس\s*ي?)?\s*[:\s]*(.*)$')
SUB_RE = re.compile(r'^(?:\d+\.\d+\.?\s*)?المجال\s*الفرعي\s*(?:ال\w+\s*)?(?:\d+\s*)?[:\s]*(.*)$')
BULLET_RE = re.compile(r'^[-▪•●–]\s*(.+)$')
SPEC_PREFIX = re.compile(r'^(?:تخصص|التخصص)\s+(.{2,60})$')


def find_pdf(pattern):
    hits = glob.glob(os.path.join(SRC_DIR, pattern))
    if not hits:
        raise SystemExit(f'الملف غير موجود: {pattern}')
    return hits[0]


def clean(s):
    return re.sub(r'\s+', ' ', (s or '')).strip()


def keyify(name):
    k = re.sub(r'[^a-z0-9\u0600-\u06FF]+', '_', name.lower()).strip('_')
    return k[:40] or 'spec'


def is_cover_line(l):
    return any(c in l for c in COVER)


def parse(path):
    specials = OrderedDict()
    cur_spec = None
    cur_dom = None
    cur_sub = None
    dom_mode = 'domain'

    def new_spec(name):
        nonlocal cur_spec, cur_dom, cur_sub
        k = keyify(name)
        if k not in specials:
            specials[k] = {'name': name, 'key': k, 'domains': []}
        cur_spec = specials[k]
        cur_dom = None
        cur_sub = None
        return cur_spec

    def collect_name(lines, i, first):
        """يجمع اسم المجال المبتد (يمتد على أسطر قصيرة) ويعيد (الاسم، الفهرس التالي)."""
        parts = [first] if first else []
        j = i
        while j < len(lines) and len(parts) < 3:
            nxt = lines[j]
            if (len(nxt) > 58 or ':' in nxt or 'ـ' in nxt or '•' in nxt
                    or nxt.startswith('المجال') or PCT_RE.match(nxt) or nxt.startswith('-')):
                break
            parts.append(nxt)
            j += 1
        return clean(' '.join(parts)).strip(' :'), j

    reader = PdfReader(path)
    for page in reader.pages:
        raw = [clean(l) for l in (page.extract_text() or '').split('\n')]
        raw = [l for l in raw if l and not any(f in l for f in FOOTER)]

        # ── صفحة غلاف ⇒ تخصص جديد ──
        cover_idx = next((k for k, l in enumerate(raw) if is_cover_line(l)), None)
        if cover_idx is not None:
            name = None
            for l in raw[:cover_idx + 2]:
                m = SPEC_PREFIX.match(l)
                if m:
                    name = m.group(1).strip(' .')
                    break
            if not name:
                for l in raw[:cover_idx + 2]:
                    if len(l) < 70 and not is_cover_line(l) and 'نوع المباراة' not in l and 'الاختبار' not in l \
                            and 'المعامل' not in l and 'مدة' not in l:
                        name = l.strip(' .')
                        break
            if name:
                new_spec(name)

        lines = [l for l in raw if not is_cover_line(l) and 'نوع المباراة' not in l
                 and not re.match(r'^(الاختبار|\s*الاختبار|المعامل|مدة الإنجاز|مواصفات|lغة)', l)
                 and 'تخصص ' not in l]
        if cur_spec is None:
            new_spec('عام')

        # نمط الأوزان من رأس الجدول
        head = ' '.join(lines[:4])
        if 'وزن المجال الفرعي' in head or 'المجال الفرعي (%)' in head:
            dom_mode = 'sub'
        elif 'وزن المجال' in head:
            dom_mode = 'domain'

        i = 0
        while i < len(lines):
            l = lines[i]

            mp = PCT_RE.match(l)
            if mp:
                w = int(mp.group(1))
                if dom_mode == 'sub':
                    if cur_sub is not None and cur_sub.get('weight') is None:
                        cur_sub['weight'] = w
                    elif cur_dom is not None and cur_dom.get('weight') is None:
                        cur_dom['weight'] = w
                    elif cur_sub is not None:
                        cur_sub['weight'] = w
                elif cur_dom is not None:
                    cur_dom['weight'] = w
                i += 1
                continue

            ms = SUB_RE.match(l)
            if ms:
                name, i = collect_name(lines, i + 1, clean(ms.group(1)).strip(' :'))
                if cur_dom is None:
                    cur_dom = {'name': 'عام', 'weight': None, 'subdomains': []}
                    cur_spec['domains'].append(cur_dom)
                cur_sub = {'name': name or 'عام', 'weight': None, 'details': []}
                cur_dom['subdomains'].append(cur_sub)
                continue

            mm = MAIN_RE.match(l)
            if mm and 'الفرعي' not in l:
                name, i = collect_name(lines, i + 1, clean(mm.group(1)).strip(' :'))
                cur_dom = {'name': name or 'عام', 'weight': None, 'subdomains': []}
                cur_spec['domains'].append(cur_dom)
                cur_sub = None
                continue

            mb = BULLET_RE.match(l)
            if mb:
                txt = clean(mb.group(1))
                if cur_sub is not None:
                    cur_sub['details'].append(txt)
                elif cur_dom is not None:
                    cur_dom.setdefault('details', []).append(txt)
                i += 1
                continue

            if cur_sub is not None and len(l) > 20:
                cur_sub['details'].append(l)
            i += 1

    for sp in specials.values():
        sp['domains'] = [d for d in sp['domains'] if d.get('name') and d['name'] != 'عام']
        for d in sp['domains']:
            d['subdomains'] = [s for s in d.get('subdomains', []) if s.get('name') and s['name'] != 'عام']
            d.pop('details', None)
    return specials


def build():
    comps = OrderedDict([
        ('specialisation', {'label': 'مادة/مواد التخصص', 'coefficient': 20, 'duration_hours': 4,
                            'file': find_pdf('*التخصص_0.pdf')}),
        ('didactics', {'label': 'ديداكتيك المادة/المواد', 'coefficient': 12, 'duration_hours': 2,
                       'file': find_pdf('*ديداكتيك*.pdf')}),
        ('edu', {'label': 'علوم التربية', 'coefficient': 8, 'duration_hours': 2,
                 'file': find_pdf('*علوم التربية*.pdf')}),
    ])

    out = OrderedDict()
    out['source'] = 'المركز الوطني للامتحانات المدرسية وتقييم التعلمات — توصيف المجالات المضمونية، دورة نونبر 2026'
    out['exam'] = 'crmef'
    out['cycles'] = ['secondary_prep', 'secondary_qual']
    out['components'] = OrderedDict()
    problems = []

    for key, meta in comps.items():
        specs = parse(meta['file'])
        cleaned = OrderedDict()
        for sk, sp in specs.items():
            doms = sp['domains']
            if not doms:
                continue
            dom_total = sum(d['weight'] or 0 for d in doms)
            subs = [s for d in doms for s in d['subdomains']]
            sub_total = sum(s['weight'] or 0 for s in subs)
            status = 'ok' if dom_total == 100 else ('sub-ok' if sub_total == 100 else 'needs-review')
            cleaned[sk] = {
                'name': sp['name'], 'key': sk, 'domains': doms,
                '_check': {'domains_total': dom_total, 'subdomains_total': sub_total, 'status': status},
            }
            if status == 'needs-review':
                problems.append(f"{meta['label']} :: {sp['name']} — رئيسي={dom_total} فرعي={sub_total}")
        out['components'][key] = {
            'label': meta['label'], 'coefficient': meta['coefficient'],
            'duration_hours': meta['duration_hours'], 'specialisations': cleaned,
        }

    with io.open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # ── فهرس خام (صفحة ← نصها) لتدقيق الهيكل يدوياً ──
    raw_out = os.path.join(SRC_DIR, 'crmef_programmes_raw.json')
    raw = OrderedDict()
    for key, meta in comps.items():
        pages = []
        reader = PdfReader(meta['file'])
        for pno, page in enumerate(reader.pages, 1):
            lines = [clean(l) for l in (page.extract_text() or '').split('\n')]
            lines = [l for l in lines if l and not any(f in l for f in FOOTER)]
            pages.append({'page': pno, 'lines': lines})
        raw[key] = {'file': os.path.basename(meta['file']), 'pages': pages}
    with io.open(raw_out, 'w', encoding='utf-8') as f:
        json.dump(raw, f, ensure_ascii=False, indent=2)
    print('raw index:', raw_out)

    print('written:', OUT)
    for key, comp in out['components'].items():
        print(f"\n== {key} ({comp['label']}) — {len(comp['specialisations'])} تخصص")
        for sk, sp in comp['specialisations'].items():
            ch = sp['_check']
            flag = {'ok': '✓', 'sub-ok': '✓فرعي', 'needs-review': '⚠'}[ch['status']]
            print(f"  {flag} {sp['name'][:44]:46s} رئيسي={ch['domains_total']:3d} فرعي={ch['subdomains_total']:3d} مجالات={len(sp['domains'])}")
    if problems:
        print('\n-- يحتاج مراجعة (' + str(len(problems)) + '):')
        for p in problems[:30]:
            print('   -', p)


if __name__ == '__main__':
    build()
