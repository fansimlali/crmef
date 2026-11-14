# دليل إعداد المسالك — كيف أُنشئ مسلكاً وأضع فيه المواد؟

> **المبدأ الأساسي:** المسلك = **مفتاح سلك** (`primary` / `secondary_prep` / `secondary_qual`)
> + **اسم معروض** خاص بالمباراة. العضوية تُحفظ في `subjects.cycles` — وهي **المرجع الوحيد**:
> أسئلة المادة تأخذ مسلك مادتها تلقائياً (trigger)، فلا حاجة لتعديل الأسئلة يدوياً أبداً.

---

## 1) من أين تُقرأ المسالك؟ (3 مصادر، بترتيب الأهمية)

| # | المكان | ماذا يحدّد | كيف يُعدَّل |
|---|---|---|---|
| 1 | **`subjects.cycles`** (قاعدة البيانات) | **أي المسالك تنتمي إليه كل مادة** (المرجع الرسمي) | نافذة الرفع (منتقي المسلك) أو SQL |
| 2 | `questions.cycles` | مسلك كل سؤال | **تلقائياً** عبر trigger `trg_sync_subject_cycles` (لا يُعدَّل يدوياً) |
| 3 | `src/types.ts` → `EXAM_TRACKS` | **الاسم المعروض** لكل مسلك في كل مباراة | تعديل برمجي (سطر لكل مسلك) |
| 3b | `src/data/trackMap.ts` | خريطة مولَّدة: مباراة ← مسلك ← مواد (تستهلكها نافذة الرفع) | `node scripts/build_track_map.cjs` |

**القاعدة الذهبية:** لتغيير مسلك مادة ⇒ عدّل `subjects.cycles` فقط. أسئلتها تتبعها تلقائياً.

---

## 2) المسارات الثلاثة لإعداد مباراة جديدة بمسالك

### (أ) عبر واجهة الإدارة — بلا SQL ولا نشر كود ✅
1. **إدارة ← استعراض الأسئلة ← رفع حزمة مباراة**.
2. اختر `exam_package.json` (من مطوّر المحتوى أو من `node scripts/build_tarbawiyin_package.cjs`).
3. **في كل مادة: اضغط المسلك/الأسلاك** (منتقي جديد أسفل اسم كل مادة).
4. **«وضع المهلة التجريبية»** مفعّل ⇒ الأسئلة مخفية عن الجمهور حتى الاعتماد.
5. **رفع** ⇒ تُحفظ المواد بأسلاكها، وتتبعها أسئلتها تلقائياً، وتُحفظ البطاقة باسمها.

### (ب) عبر SQL (للمواقع الدقيقة)
```sql
-- 1) إنشاء/تعديل المباراة
UPDATE public.exams
SET name = 'مباراة أطر المختصين',
    description = '… ثلاثة مسالك …'
WHERE id = 'tarbawiyin';

-- 2) ربط كل مادة بمسلكها (المرجع)
UPDATE public.subjects SET cycles = ARRAY['primary']::text[] WHERE exam_id='tarbawiyin' AND key='khas_tarbawi';
UPDATE public.subjects SET cycles = ARRAY['secondary_prep']::text[] WHERE exam_id='tarbawiyin' AND key='khas_iqtisad';

-- 3) (اختياري) التحقق: أسئلة المادة تأخذ مسلكها
SELECT subject, cycles, count(*) FROM public.questions
WHERE exam_id='tarbawiyin' GROUP BY subject, cycles ORDER BY subject;
```
> `UPDATE subjects` يفعّل trigger `trg_sync_subject_cycles` ⇒ تُحدَّث أسئلة المادة في نفس اللحظة.

### (ج) داخل حزمة `exam_package.json`
كل مادة تحمل `cycles` (قائمة مفاتيح أسلاك) — وهي التي يستعملها الخادم عند الرفع:
```json
{ "key": "khas_tarbawi", "name": "…", "cycles": ["primary"], "weight": 1 }
```

---

## 3) الأسماء المعروضة لكل مسلك (لكل مباراة)

`src/types.ts`:
```ts
export const EXAM_TRACKS: Record<string, CycleDefinition[]> = {
  tarbawiyin: [
    { id: 'primary',        name: 'مسلك تكوين المختصين التربويين',        badge: 'المختصون التربويون',   available: true },
    { id: 'secondary_prep', name: 'مسلك تكوين أطر مختصي الاقتصاد والتدبير', badge: 'الاقتصاد والتدبير', available: true },
    { id: 'secondary_qual', name: 'مسلك تكوين أطر المختصين الاجتماعيين',   badge: 'المختصون الاجتماعيون', available: true },
  ],
};
```
> نفس `id` يحمل اسماً مختلفاً حسب المباراة: `primary` = «سلك التعليم الابتدائي» في CRMEF،
> و«مسلك تكوين المختصين التربويين» في أطر المختصين. هذا ما يجعل «المسلك» مرتبطاً بـ«المباراة».

---

## 4) من يرى ماذا؟ (نموذج الصلاحيات المطبَّق)

| الحالة | المباريات | المسالك | الكوطة |
|---|---|---|---|
| **مجاني** | مباراته المسجَّلة | مسلك واحد: ما اختاره (يُثبَّت مرة واحدة لكل مباراة) | 20 سؤالاً لكل موضوع |
| **جزئي — 50 د.م** | مباراته فقط | مسلك واحد | بلا كوطة |
| **شامل — 100 د.م** | كل المباريات | كل المسالك | بلا كوطة |
| **مشرف** | كل شيء | كل شيء | — |

**التنفيذ في الخادم** (`supabase_access_model.sql`):
- `profiles.exam_tracks` = خريطة `{"<exam_id>": "<cycle_key>"}` ⇒ لكل مباراة مسلك واحد للمستخدم.
- `set_profile_track(exam, cycle)` — يثبّت المسلك (للمجاني: مرة واحدة لكل مباراة ⇒ بعدها `TRACK_LOCKED`).
- سياسات RLS على `questions`/`question_answers`/`summaries` + `answer_question` تفرض القفل على الخادم.

---

## 5) خريطة المسالك الحالية (مرجع سريع)

**مباراة التعليم (`crmef`)** — 3 أسلاك، المعاملات منfficial التوصيف (20/12/8):

| المسلك | المواد (مفتاح: معامل) | المجموع |
|---|---|---|
| `primary` ابتدائي | ar 6 · fr 6 · ma 6 · sc 2 · dar 3 · dfr 3 · dma 3 · dsc 3 · edu 8 | 40 |
| `secondary_prep` إعدادي | edu 8 · sec_math 20 · sec_d_math 12 · sec_physics 20 · sec_d_physics 12 · sec_svt 20 · sec_d_svt 12 · sec_ar 20 · sec_d_ar 12 · sec_fr 20 · sec_d_fr 12 · sec_eng 20 · sec_d_eng 12 · sec_islamic 20 · sec_d_islamic 12 · sec_hist_geo 20 · sec_d_hist_geo 12 · sec_cs 20 · sec_d_cs 12 · sec_pe 20 · sec_te 20 | 336 |
| `secondary_qual` تأهيلي | (المجالات نفسها + `sec_philo` 20 · `sec_d_philo` 12) | — |

**مباراة أطر المختصين (`tarbawiyin`)** — 3 مسالك، موضوعان لكل مسلك (100 سؤال لكل موضوع):

| المسلك | الموضوعان |
|---|---|
| `primary` تكوين المختصين التربويين | `tadbir_mali_mohasabati` · `khas_tarbawi` |
| `secondary_prep` أطر مختصي الاقتصاد والتدبير | `tadbir_idari_tarbawi` · `khas_iqtisad` |
| `secondary_qual` أطر المختصين الاجتماعيين | `tahlil_nafsia_ijtimaiya` · `khas_ijtimai` |

> الجدول الكامل (يُولَّد): `reports/track_map.md` — ومصدره `scripts/build_track_map.cjs`.

---

## 6) حالة توحيد مواضيع البنك (CRMEF) — للملخص

**المستوى (أ)** — تغيير `topic` إلى المجال الفرعي الرسمي فقط؛ المعاملات (20/12/8) والنتائج كما هي:

| المرحلة | ملف SQL | التغطية |
|---|---|---|
| الابتدائي (950 سؤالاً / 9 مواد) | `sql/crmef_topics_primary.sql` | 950/950 ✓ |
| الثانوي (1334 سؤالاً / 13 تخصصاً) | `sql/crmef_topics_secondary.sql` | 1334/1334 ✓ |

> كل موضوع وُحّد إلى «المجال الفرعي الرسمي» من توصيف **المركز الوطني للامتحانات** (دورة نونبر 2026).
> التقارير: `reports/crmef_topics_primary.md` و `reports/crmef_topics_secondary.md`
> (لكل مجال فرعي: عدد الأسئلة الحالية + ما ينقص للتوليد — تُغذّى إلى مولّد البنك الناقص:
> مثلاً الابتدائي ينقصه ≈ 363 سؤالاً مجانياً على الـ40 إطاراً، الثانوي ≈ 548 سؤالاً).
> الأسئلة التي وُضعت في «خارج التوصيف» (مثل «البلاغة» و«الحركة والقوة والطاقة») **أُبقيت كما هي**
> — تُراجع بالتدبير/الحذف بقرارك (لا تُحذَف عند هذا المستوى).

| ⚠️ تنبيه البنية | ملاحظة |
|---|---|
| بنك الثانوي **لا يحوي مواد ديداكتيك منفصلة** | أسئلة التخصص والديداكتيك مدموجة داخل كل `sec_*` (بخلاف الابتدائي حيث dar/dfr/dma/dsc مواد منفصلة). هذا مطابق لهيكلة البنك الحالية ولا يمنع العمل — لكنه يعني أن «توحيد المواضيع» للثانوي يدمج المجالات التخصصية مع الديدكتيكية في subject واحد. |
| إعلان «أطر المختصين» لا يذكر «التدبير الإداري» | الموضوع الأول لمسلك الاقتصاد والتدبير («التدبير الإداري والتدبيري») **ليس في الإعلان الرسمي** — يحتاج قراراً منك قبل توليد بنكه (راجع الملاحظة في `CRMEF_OFFICIAL_STRUCTURE.md`). |

---

## 7) قائمة تحقّق سريعة بعد أي تعديل

```sql
-- 1) مواد المباراة ومسالكها
SELECT key, name, cycles, weight FROM public.subjects
WHERE exam_id = 'tarbawiyin' ORDER BY key;

-- 2) هل أسئلة كل مادة تتبع مسلكها؟ (يجب أن تكون 0 صفوف)
SELECT q.subject, q.cycles, s.cycles AS subject_cycles, count(*)
FROM public.questions q JOIN public.subjects s
  ON s.exam_id = q.exam_id AND s.key = q.subject
WHERE q.exam_id = 'tarbawiyin' AND q.cycles IS DISTINCT FROM s.cycles
GROUP BY 1,2,3;

-- 3) توزيع المسالك لكل مستخدم (خريطة exam_tracks)
SELECT id, email, cycle, premium_scope, exam_tracks FROM public.profiles
WHERE subscription_status = 'premium' LIMIT 20;
```
