# بطاقة تقنية — تحويل منصة CRMEF إلى منصة متعددة المباريات (Multi-Exam Platform)

**الهدف:** تعميم التطبيق من مباراة واحدة (CRMEF / التعليم) إلى منصة تدعم مباريات متعددة
مع الحفاظ على بنك الأسئلة والإجابات والملخصات وضمان استمرارية النموذج المدفوع.
**الحالة:** ٿا تصميمية (لم تُنفّذ بعد) — هذه البطاقة مرجع للمطوّر القادم.
**الإصدار:** 1.0 — 2026-11-09

---

## 1. رؤية المنتج

### 1.1 قبل
```
مباراة واحدة (CRMEF) ← أسلاك (ابتدائي/إعدادي/تأهيلي) ← مواد ← أسئلة + ملخصات
```
### 1.2 بعد
```
منصة عامة ← مباريات متعددة (CRMEF، طب، محاماة، قضاء، إدارة...) ← لكل مباراة:
    أسلاك/تخصصات ← مواد ← أسئلة + إجابات + شروح + ملخصات
```

### 1.3 قواعد ثابتة (لا تتغير)
| المبدأ | الوصف |
|---|---|
| المحتوى مدفوع | التجريبي يرى عينة (20/مادة) بلا إجابات؛ الكامل يرى البنك والملخصات في **مجاله** |
| الاشتراك بمراجعة بشرية | وصل (صورة) + موافقة مشرف → Premium |
| الأسئلة خارج الحزمة | مصدر وحيد: Supabase (لا بنك مدمج في JS) |
| الدور من `profiles` | لا `user_metadata` ولا لون محلي |
| حصر بالسلك/المباراة | لا انفتاح عرضي على مباراة أخرى |

---

## 2. المعمارية المقترحة

```
┌─────────────────────────────────────────────────┐
│  Frontend (React 19 + TS + Tailwind v4)         │
│  Landing → اختيار مباراة → سلك → مادة → اختبار │
│  إدارة مفصلة (Admin: exams/subjects/questions/  │
│  summaries/subscriptions)                       │
└──────────────────┬──────────────────────────────┘
                   │ Supabase (PostgREST + RPC)
┌──────────────────┴──────────────────────────────┐
│  Tables: exams, subjects, questions,            │
│  question_answers, summaries, profiles,         │
│  subscription_requests, question_progress,      │
│  receipts (storage خاص)                        │
│  RPC: answer_question (تحقق خادمي)             │
│  RLS: كل قراءة تشترط exam_id + سلك + اشتراك     │
└─────────────────────────────────────────────────┘
```

---

## 3. نموذج البيانات (SQL)

### 3.1 جداول جديدة

```sql
CREATE TABLE IF NOT EXISTS public.exams (
  id          TEXT PRIMARY KEY,          -- 'crmef', 'medicine', 'law'...
  name        TEXT NOT NULL,             -- 'مباراة التعليم (CRMEF)'
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT DEFAULT 'graduation-cap',
  color       TEXT DEFAULT 'emerald',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id        TEXT PRIMARY KEY,           -- 'subject_ar', 'subject_medicine_anat'
  exam_id   TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  key       TEXT NOT NULL,             -- 'ar', 'anatomy' (للعرض/المعاملات)
  name      TEXT NOT NULL,             -- 'اللغة العربية'
  weight    INT NOT NULL DEFAULT 1,     -- المعامل
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (exam_id, key)
);
```

### 3.2 تعديل الجداول القائمة

```sql
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef'
    REFERENCES public.exams(id) ON DELETE CASCADE;
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subject_id TEXT
    REFERENCES public.subjects(id) ON DELETE RESTRICT;

ALTER TABLE public.summaries
  ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef'
    REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef'
    REFERENCES public.exams(id) ON DELETE RESTRICT;
```

### 3.3 جداول قائمة دون تغيير هيكلي
- `question_answers (question_id, correct_answer, explanation)` — بلا تغيير.
- `question_progress (user_id, question_id, is_correct)` — بلا تغيير (المعرفة تتم عبر `questions`).
- `subscription_requests` — يُضاف `exam_id` اختياري إذا تبنّى المنتج الخيار (ب) "اشتراك لكل مباراة".
- `receipts` (مخزن) — بلا تغيير.

### 3.4 صفوف أولية (Seed)
```sql
INSERT INTO public.exams (id, name, slug, description)
VALUES ('crmef', 'مباراة التعليم (CRMEF)', 'crmef', 'سلك تأهيل أطر التدريس');

-- مواد CRMEF الحالية تُرحَّل إلى subjects مع exam_id='crmef'
-- أسئلة/ملخصات CRMEF تُوسم exam_id='crmef'
```

---

## 4. سياسات RLS والتحقق الخادمي

### 4.1 القراءة (SELECT)

```sql
-- questions: التجريبي → is_trial في سلكه ومباراته فقط
-- premium → rows في exam_id + cycle للمستخدم فقط
-- admin → كل شيء

-- question_answers: admin فقط (premium عبر answer_question)
-- summaries: premium في exam_id + cycle للمستخدم، admin كل شيء
```

### 4.2 الدوال
| الدالة | التغيير |
|---|---|
| `answer_question(p_question_id, p_chosen_answer)` | تحقق إضافي: `p_question_id` ينتمي إلى `profiles.exam_id` و`cycles` |
| `record_question_progress` (قديمة) | استبدال/إلغاء (كما أوصى التدقيق) |
| `is_premium/is_admin` | بلا تغيير |

### 4.3 فهرسة وأداء
- `questions(exam_id, subject)`, `questions(exam_id, cycles)`, `summaries(exam_id, cycle)`.
- تصفية على الخادم عند الجلب (تجنب صرفال 1000 صف).

---

## 5. واجهة المستخدم

### 5.1 تدفق جديد (قبل السلك)
```
Landing (اختيار مباراة)
  → QuizSetup (اختيار السلك/التخصص + مرحلة قبلي/بعدي)
    → الاختبار (إيقاف مؤقت / نتيجة مبكرة / إعادة)
```

### 5.2 قائمة المباريات
- بطاقات: شعار/لون/وصف/عدد أسئلة المباراة (محسوب خادمياً).
- المباراة غير النشطة (`is_active=false`) مخفية عن المستخدم العادي.

### 5.3 لوحة المشرف
تبويبات: **المباريات** (إضافة/تفعيل) • **المواد** (لكل مباراة) • **الأسئلة/الإجابات** • **الملخصات** • **الاشتراكات**.
بحث وفلترة بكل قسم؛ رفع جماعي JSON كما قبل.

### 5.4 حساب المستخدم
- يعرض مباراته الحالية وسلكه واشتراكه.
- زر "إضافة مباراة" → طلب اشتراك جديد (إذا أيّد المنتج الخيار ب).

---

## 6. نموذج الاشتراك — قرار يجب حسمه

| الخيار | الفكرة | متى يُفضل |
|---|---|---|
| **أ: اشتراك شامل** | اشتراك واحد → كل المباريات + الملخصات | نمو سريع، بساطة |
| **ب: لكل مباراة** | اشتراك منفصل لكل مباراة | إيراد أعلى، تعقيد أعلى |

> **الأرجح:** أ أولاً، ثم ب لاحقاً. RLS تدعم كليهما: إن فُتح شامل، تفتح `questions` لكل `exams` للمشترك؛ وإن فُرض ب، يُقيَّد بـ `profiles.exam_id`.

---

## 7. خطة الترحيل (آمنة، دون توقف العمل)

### المرحلة 1 — البنية (SQL فقط)
- [ ] إنشاء `exams` + `subjects` + أعمدة `exam_id`/`subject_id`.
- [ ] إدراج صف `crmef` مع مواد CRMEF.
- [ ] ترحيل أسئلة/ملخصات CRMEF إلى `exam_id='crmef'`.
- [ ] تحديث RLS والدوال لتشترط `exam_id`.
- [ ] اختبار: حساب تجريبي يرى عينة CRMEF فقط قبل هذه الخطوة وبعدها (نفس النتيجة).

### المرحلة 2 — الواجهة
- [ ] صفحة اختيار مباراة (بطاقات من جدول `exams`).
- [ ] `QuizSetup`: فلترة المواد بـ `exam_id`.
- [ ] `SummariesViewer`: فلترة بـ `exam_id` + السلك.
- [ ] `QuestionManager` + `SubscriptionManager`: إدارة متعددة المباريات.

### المرحلة 3 — بيانات تجريبية
- [ ] إضافة مباراة وهمية (مواد/أسئلة/ملخصات قليلة) للتحقق من العزل.
- [ ] اختبارات عزل:
  - مشترك CRMEF لا يقرأ أسئلة المباراة الوهمية (`SELECT` يعيد `[]`).
  - `answer_question` على سؤال مباراة أخرى → `TRIAL_QUESTION_LOCKED`.
  - ملخص مباراة أخرى → RLS يعيده خالياً.

### المرحلة 4 — الإنتاج
- [ ] اختبارات روتينية في قائمة النشر.
- [ ] تحديث التوثيق (`README`, `TECHNICAL_SHEET`, قائمة التحقق).

---

## 8. اعتبارات أمان عند التوسع

1. **عزل المباريات صارم:** أي تسرب بين مباراتين = تجاوز كامل لل paywall — اختبره دائماً بـ JWT حقيقي.
2. **لا تُوسّع RLS بربط واسع:** من الخطأ `OR exam_id IS NULL` (يسمح بالكل).
3. **البذور المدفوعة خارج المستودع:** مباراة جديدة = بذور خاصة جديدة، لا `git` (كما قبل).
4. **أسماء المباريات/المواد تُعرض في الواجهة فقط** — لا منطق هيكلي في النصوص.
5. **تدقيق الاشتراك:** بصمة الوصل + RPC ذرية (من تقرير التدقيق) تنطبق على كل مباراة.

---

## 9. ملخص التكلفة/الجهد التقريبي

| Phase | الجهد التقديري |
|---|---|
| 1. البنية + RLS | متوسط (يوم-يومان) |
| 2. الواجهة + لوحة المشرف | متوسط (يوم-يومان) |
| 3. اختبارات العزل | قصير (نصف يوم) |
| 4. التوثيق والنشر | قصير |
| **الإجمالي** | **3-5 أيام عمل** (بما فيها المراجعة) |

---

## 10. أسئلة مفتوحة قبل التنفيذ

1. **النموذج المدفوع:** شامل (أ) أم لكل مباراة (ب)؟
2. **أسلاك المباريات الجديدة:** هل لكل مباراة أسلاك أيضاً، أم تخصصات مباشرة؟
3. **الأسئلة المشتركة:** هل توجد أسئلة عامة (علوم تربية) ينبغي تسميتها لكل مباراة أم نسخها؟
4. **التقويم والمعدل:** هل تختلف معاملات كل مباراة؟
5. **ترتيب الإطلاق:** أي مباراة تلي CRMEF؟
