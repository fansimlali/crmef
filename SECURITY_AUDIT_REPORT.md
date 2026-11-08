# تقرير التدقيق الأمني والتقني الشامل
# منصة التقويم التجريبي لمباراة التعليم — CRMEF

**التاريخ:** 2026-11-08
**المستودع:** https://github.com/fansimlali/crmef
**الفرع:** `main` (آخر commit: `317d437` في وقت كتابة التقرير)
**النطاق:** `src/`, `supabase_schema.sql`, `scripts/`, `vercel.json`, `.github/`, `README.md`, `TECHNICAL_SHEET.md`, `DEPLOYMENT_CHECKLIST.md`
**الغرض:** تسليم لمطوّر آخر لاستكمال الإصلاحات المعلقة

> **تنبيه:** لا يحتوي هذا التقرير أي مفاتيح سرية. المفاتيح التي ذُكرت سابقاً في المحادثة (GitHub PAT، Vercel Token، رموز جلسة من روابط بريد) يجب **إلغاؤها فوراً** راجع قسم "مفاتيح مسرّبة سابقاً".

---

## 1. الملخص التنفيذي

التطبيق (Vite + React 19 + TypeScript + Tailwind v4 + Supabase) مرّ بمرحلتين إصلاحيتين:
- **مرحلة 1 (قبل التقرير):** إزالة حساب المشرف المضمّن، توثيق عبر Supabase Auth فقط، مخزن وصلات خاص، كوطة تجريبية على الخادم، فصل الملخصات المدفوعة عن الحزمة، تشديد CSP/HSTS، TypeScript strict، CI.
- **مرحلة 2 (هذا التقرير):** تحويل بنك الأسئلة إلى نموذج مدفوع (تجريبي = أول 20 سؤالاً/مادة بلا إجابات)، فصل الإجابات في `question_answers`، التحقق من الإجابة خادمياً (`answer_question`)، حصر المشترك في سلكه المسجل، فرض تأكيد البريد في الكود، تحديث تلقائي لحالة الاشتراك، إيقاف مؤقت/نتيجة مبكرة/إعادة في الاختبار، إخفاء تبويب الإدارة عن غير المشرف، تنظيف تاريخ Git من المحتوى المدفوع، إضافة ترحيل أعمدة ناقصة لـ `profiles`.

**الحالة الحالية:** الكود سليم ويبني بنجاح (`npm run build` ✓، `npm run lint` = 0 errors). **التبقي كله يدوي** في لوحات Supabase/Vercel — لا يصلح بالكود وحده.

---

## 2. المعمارية الحالية

### 2.1 الطبقات
| الطبقة | التقنية | الملاحظة |
|---|---|---|
| الواجهة | React 19 + TS strict + Vite 8 | لا بنك أسئلة مدمج في الحزمة |
| المصادقة | Supabase Auth (بريد+كلمة مرور) | الدور/الاشتراك من `public.profiles` فقط |
| القاعدة | Supabase PostgreSQL + RLS | المشروع `lwicejthksskkhfsilky` |
| التخزين | Bucket `receipts` خاص | وصولات صور ≤5MB |
| النشر | Vercel | مشروع `crmef-wqvv` النشط |

### 2.2 النموذج المدفوع (بعد الإصلاح)
| المستخدم | الأسئلة | الإجابات | الملخصات |
|---|---|---|---|
| زائر (بلا حساب) | لا شيء | لا شيء | لا شيء |
| تجريبي (`trial`) | أول 20/مادة في سلكه (`is_trial`) | لا يقرأها — تُتحقق خادمياً وتُعاد بعد الإجابة | مغلقة |
| مشترك (`premium`) | أسئلة **سلكه المسجل فقط** | عبر `answer_question` | في سلكه فقط |
| مشرف (`admin`) | كل شيء | يقرأها مباشرة | كل شيء |

### 2.3 الملفات المرجعية
- هيكل القاعدة + الأمان: `supabase_schema.sql` (بلا بذور مدفوعة).
- بذور الأسئلة (خاص، غير متتبع): `supabase_questions_seed.sql` ← من `npm run seed:questions` (يتطلب `questions_seed.json` محلياً).
- بذور الملخصات (خاص، غير متتبع): `supabase_summaries_seed.sql` ← من `npm run seed:summaries`.
- سياسات التشغيل: `DEPLOYMENT_CHECKLIST.md`.

---

## 3. المشاكل المعلقة (تحتاج تدخلاً يدوياً — الأولوية)

### 3.1 [حرج] Site URL ما زال `localhost:3000` — روابط البريد لا تعمل
**الوصف:** الضغط على رابط تأكيد التسجيل أو إعادة تعيين كلمة المرور ينقل إلى `http://localhost:3000/` (صفحة لا توجد).
**السبب الجذري:** في Supabase → Authentication → URL Configuration، الـ Site URL المضبوط هو `localhost:3000`. الكود يرسل `redirectTo: window.location.origin` (`src/context/AuthContext.tsx:629`) لكن Supabase يرفض النطاق غير المسموح فيعيد إلى Site URL.
**الدليل:** لقطات اللوحة تظهر "URL Configuration" في القائمة اليسرى — لم تُضبط بعد. الكود لا يحتوي أي `localhost` مضمّن (تم التحقق بـ grep).
**الإصلاح:**
1. Supabase → Authentication → **URL Configuration**.
2. **Site URL** = `https://crmef-wqvv.vercel.app` (احذف أي `localhost:3000`).
3. **Redirect URLs**:
   ```
   https://crmef-wqvv.vercel.app/**
   http://localhost:5173/**
   ```
4. **Save**.
**معيار القبول:** حساب جديد → رابط التأكيد يفتح النطاق الإنتاجي. "نسيت كلمة المرور" → نفس السلوك.

### 3.2 [حرج] "Confirm email" معطّل — الدخول مباشرة بعد التسجيل
**الوصف:** إنشاء حساب جديد يدخل التطبيق فوراً دون الضغط على رابط التأكيد.
**السبب الجذري:** في Supabase → Authentication → Providers → Email، خيار **Confirm email** معطّل، فيعتبر Supabase كل بريد مؤكَّداً فوراً (`email_confirmed_at` موجود)، فلا ينفع فحص الكود وحده.
**ما أصلحه الكود (موجود لكنه لا يكفي):**
- `login()` يرفض الدخول ببريد غير مؤكَّد (`AuthContext.tsx`).
- `initAuth` و`onAuthStateChange` يطردان الجلسات غير المؤكَّدة.
- **لن يعمل أيٌّ من هذا حتى يُفعَّل Confirm email في اللوحة** — لأن Supabase يؤكد تلقائياً عند التعطيل.
**الإصلاح:**
1. Supabase → Authentication → **Sign In / Providers** → **Email**.
2. فعّل **"Confirm email" = ON** → **Save**.
**معيار القبول:** حساب جديد → رسالة "تفقد بريدك" → الدخول مرفوض حتى الضغط على الرابط.

### 3.3 [متوسط] مشروعان في Vercel بنفس المستودع
**الوصف:** يوجد نطاقان: `crmef.vercel.app` و`crmef-wqvv.vercel.app`.
**السبب:** مشروعان مربوطان بنفس GitHub (`crmef` قديم مكرر + `crmef-wqvv` النشط).
**الإصلاح:** في Vercel → Projects، احذف مشروع `crmef` (أو افصل Git عنه). اعتمد `crmef-wqvv` وحيداً. ثم في Supabase استعمل نطاقه فقط في (3.1).

### 3.4 [متوسط] ملف CI يرفض دفعه عبر PAT بلا نطاق `workflow`
**الوصف:** `.github/workflows/ci.yml` رُفع بنجاح بعد توفير PAT بنطاق `workflow`، لكن أي PATCH لاحق يتطلب نفس النطاق.
**الحالة الآن:** الملف **موجود ومدفوع** في `main` وآخر تشغيل CI = `success`. لا إجراء مطلوباً إلا عند تعديله مستقبلاً.

### 3.5 [معلومة] تنظيف تاريخ Git — اكتمل
حُذف من **كل التاريخ** (بعد نسخة احتياطية `cmref-backup-before-filter.bundle` خارج المستودع) ودُفع قسرياً:
- `molakhasat/`, `examen_blanc*.html`, `src/data/summariesData.ts`, `questions_seed.json`, `src/data/initialQuestions.ts`, النسخة القديمة من `supabase_schema.sql`.
- التحقق: `git log --all -- molakhasat` يعيد صفراً.

---

## 4. نتائج التدقيق السابقة (أُصلحت بالكامل في الكود)

### 4.1 أمنية
| # | المشكلة | الإصلاح | ملف |
|---|---|---|---|
| S1 | حساب مشرف مضمّن في الكود | أُزيل؛ الدور من `profiles` حصراً | `AuthContext.tsx` |
| S2 | بنك الأسئلة + الإجابات عام في الحزمة | أُزيل `initialQuestions.ts`؛ الإجابات في `question_answers` محمية | `supabase.ts`, `supabase_schema.sql` |
| S3 | تجاوز الكوطة بطلبات متوازية | قفل `pg_advisory_xact_lock` في دالتي التقدم/الإجابة | `supabase_schema.sql` |
| S4 | المشاف/الكامل يرى أسئلة كل الأسلاك | حصر بالسلك (`p.cycle = ANY(questions.cycles)`) في RLS والدوال | `supabase_schema.sql` |
| S5 | `is_admin` كأداة تعداد أدوار | يرفض الاستعلام عن غير المتصل | `supabase_schema.sql` |
| S6 | رفع وصولات بلا حدود حجم/نوع | `file_size_limit=5MB` + `allowed_mime_types` (صور فقط) | `supabase_schema.sql` |
| S7 | إغراق طلبات اشتراك | فهرس فريد جزئي + قيود أطوال + `receipt_url IS NULL` | `supabase_schema.sql` |
| S8 | ملخصات كل الأسلاك لمشترك واحد | سياسة RLS حسب السلك | `supabase_schema.sql` |
| S9 | `id` طلب بلا قيد | قواعد أطوال + فهرس `reviewed_by` | `supabase_schema.sql` |
| S10 | ثغرات فحص البيئة | `prebuild`/`predev` يشغل `check:env`؛ يرفض `sb_secret_*` | `package.json`, `scripts/check_env.mjs` |

### 4.2 وظيفية
| # | المشكلة | الإصلاح |
|---|---|---|
| F1 | تأكيد البريد يترك المستخدم عالقاً حتى تحديث الصفحة | معالجة `SIGNED_IN`/`TOKEN_REFRESHED` + فحص `email_confirmed_at` |
| F2 | الاشتراك لا ينعكس على الواجهة بعد القبول | تحديث تلقائي كل 20 ثانية + عند عودة التركيز + إغلاق نافذة الترقية |
| F3 | `record_question_progress` نار-وانسَ | `answer_question` تتحقق وتعيد الصحيح/الشرح |
| F4 | الاختبار الطويل بلا توقف/نتيجة مبكرة | إيقاف مؤقت + متابعة + نتيجة مبكرة + إعادة من الصفر |
| F5 | تبويب الإدارة يظهر لغير المشرف | يُركَّب فقط عند `isAdmin` + حارس في `handleSetActiveTab` |
| F6 | تحميل الأسئلة يفشل بصمت | رسالة خطأ + زر إعادة محاولة |
| F7 | إرسال مزدوج يفسد السجل | تحديثات وظيفية + قفل `submittedRef` |
| F8 | حد 1000 صف في Supabase | تصفية `getQuestions` و`question_progress` |
| F9 | جدول `profiles` ناقص الأعمدة في القواعد القديمة | `ADD COLUMN IF NOT EXISTS` لكل عمود + قيود |
| F10 | زر الكوطة المستنفدة ميت | `aria-disabled` يبقيه قابلاً للنقر (يفتح الترقية) |

### 4.3 جودة
- `QuizResults`: نقل حارس "بلا إجابات" بعد الخطافات (كان يسبب خطأ hooks شرطياً وفشل CI).
- `QuestionManager`: `try/catch/finally`، رفض حد 5MB، `crypto.randomUUID()`، رفض الخيارات المكررة.
- `QuizQuestion`: قفل إرسال، شريط تقدم `role="progressbar"`، فرنسي/إنجليزي LTR.
- `supabase_schema.sql`: تأهيل `public.questions`، فهارس `subject`/`cycles`/`trial`، قيود بنية.
- CI: قيم بيئة وهمية للبناء + `engines.node>=20`.

---

## 5. حدود مقصودة (قرارات تصميمية — ليست عيوباً)

1. **التقدم "مبلَّغ ذاتياً":** `is_correct` تُشتق خادمياً من `question_answers` (الإصلاح F3)، لكن العميل يختار أي سؤال يجيب عنه — لا يوجد نظام شهادات/تصنيفات مرتبط بها. مقبول كما هو.
2. **بنك الأسئلة ليس محتوى مجانياً:** التجريبي يرى 20/مادة فقط بلا إجابات، والباقي مدفوع مع الملخصات — حسب قرار صاحب المنتج.
3. **إعادة استخدام حساب تجريبي:** لا ربط جهاز — إنشاء حساب جديد يعيد 20/مادة. مقبول لطبقة مجانية.
4. **محتوى مدفوع خارج المستودع:** البذور (`supabase_*_seed.sql`) و`questions_seed.json` محلية فقط (`.gitignore`) — يجب توليدها محلياً قبل أي نشر جديد.

---

## 6. مفاتيح مُسرَّبة سابقاً — إجراءات فورية

المحادثة السابقة شاركت:
1. **GitHub PAT** (نطاق `workflow`) — **ألغه** من Settings → Developer settings.
2. **Vercel Token** — **ألغه** من Settings → Tokens.
3. **رابط استعادة كلمة مرور بصيغة `localhost:3000/#access_token=...&refresh_token=...`** — رمز جلسة حقيقي (ينتهي بعد ساعة لكن الـ refresh token أطول). لا تشارك روابط من هذا النوع. بعد الإلغاء، سجّل خروجاً من كل الأجهزة إن أمكن.

لا تضع أي مفتاح `service_role` في متغيرات `VITE_*` أبداً.

---

## 7. قائمة إنجاز نهائية (للمطوّر القادم)

### لوحة Supabase (يدوي)
- [ ] Site URL = `https://crmef-wqvv.vercel.app` (احذف `localhost:3000`).
- [ ] Redirect URLs: `https://crmef-wqvv.vercel.app/**` + `http://localhost:5173/**`.
- [ ] Email provider: **Confirm email = ON** → Save.
- [ ] SQL Editor: الصق `supabase_schema.sql` الجديد كاملاً → Run (تحقق: لا أخطاء).
- [ ] ولّد ونفّذ `supabase_questions_seed.sql` (و`supabase_summaries_seed.sql` إن لزم).
- [ ] فعّل المشرف:
  ```sql
  UPDATE public.profiles SET role='admin', subscription_status='premium' WHERE email='...';
  ```
- [ ] فحوص RLS في `DEPLOYMENT_CHECKLIST.md` §5.

### Vercel (يدوي)
- [ ] احذف مشروع `crmef` المكرر، اعتمد `crmef-wqvv`.
- [ ] تأكد من متغيرات البيئة: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon/publishable فقط).
- [ ] إعادة نشر بعد أي تعديل SQL.

### تحقق وظيفي
- [ ] حساب جديد → رسالة تأكيد → الرابط يفتح النطاق الإنتاجي.
- [ ] دخول ببريد غير مؤكَّد → يُرفض برسالة واضحة.
- [ ] استعادة كلمة المرور → تفتح النطاق الإنتاجي (لا localhost).
- [ ] قبول وصل → الواجهة تتحول لـ Premium خلال ≤20 ثانية دون تحديث.
- [ ] إيقاف مؤقت → متابعة من نفس السؤال → نتيجة مبكرة (المُجاب فقط) → إعادة من الصفر.
- [ ] تبويب الإدارة غير ظاهر لحساب تجريبي/كامل.

---

## 8. أوامر مساعدة

```bash
npm run dev          # تطوير (يتطلب .env.local)
npm run build        # فحص TypeScript + بناء
npm run lint         # oxlint (تحذيرات بنّاءة مسموحة)
npm run check:env    # فحص متغيرات Supabase العامة
npm run seed:questions   # توليد البذور الخاصة (لا ترفعها)
npm run seed:summaries
git log --all -- molakhasat   # يجب أن يعيد صفراً
```
