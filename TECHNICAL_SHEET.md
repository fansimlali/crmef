# 📋 البطاقة التقنية لمنصة CRMEF

**اسم المشروع:** منصة التقويم التجريبي لمباراة التعليم  
**الحالة:** جاهزة للنشر بعد تطبيق مخطط Supabase وإعادة النشر  
**المستودع:** https://github.com/fansimlali/crmef  
**الأسلاك:** الابتدائي المزدوج، الثانوي الإعدادي، الثانوي التأهيلي  
**بنك الأسئلة المدمج:** 2,284 سؤالاً

---

## 1. الروابط والبيانات الأساسية

| البيان | القيمة |
| :--- | :--- |
| مستودع الكود | https://github.com/fansimlali/crmef |
| الفرع الرئيسي | `main` |
| مشروع Supabase | `lwicejthksskkhfsilky` |
| رابط التطوير المحلي | `http://localhost:5173` |
| الاستضافة | Vercel (Vite) |

---

## 2. المتغيرات البيئية

تُضبط محلياً في `.env.local` أو في **Vercel > Settings > Environment Variables**:

```env
VITE_SUPABASE_URL=https://lwicejthksskkhfsilky.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

> **تحذير:** كل متغير يبدأ بـ `VITE_` يُضمَّن في حزمة JavaScript العامة. لا تضع `service_role` أو أي مفتاح سري في هذه المتغيرات. أداة `npm run check:env` ترفض مفتاح `service_role` وتتحقق من صيغة الرابط.

---

## 3. المعمارية التقنية

- **الواجهة:** React 19 + TypeScript (strict) + Vite 8.
- **التنسيق:** Tailwind CSS v4، واجهة عربية RTL، خطوط Cairo/Tajawal.
- **الأيقونات:** Lucide React، و`canvas-confetti` للنتائج.
- **الخلفية:** Supabase (PostgreSQL + PostgREST + Auth + Storage).
- **الاستضافة:** GitHub → Vercel، مع `vercel.json` لرؤوس الأمان وSPA rewrites.
- **تقسيم الحزمة:** تحميل كسول لـ `initialQuestions` و`SummariesViewer` و`QuestionManager` و`QuizResults` و`UpgradeModal` و`SubscriptionManager`.

---

## 4. مخطط قاعدة البيانات

الملف المرجعي: [`supabase_schema.sql`](./supabase_schema.sql) — آمن لإعادة التشغيل (idempotent).

### 4.1 `public.profiles`

| العمود | النوع | ملاحظات |
| :--- | :--- | :--- |
| `id` | UUID PK | مرجع `auth.users(id)` |
| `email` | TEXT UNIQUE NOT NULL | |
| `full_name` | TEXT | |
| `role` | TEXT | `user` أو `admin`، الافتراضي `user` |
| `subscription_status` | TEXT | `trial` أو `premium` |
| `cycle` | TEXT | السلك المختار |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

- يُنشأ السجل تلقائياً عبر trigger `on_auth_user_created`، مع تعبئة المستخدمين السابقين.
- **الدور والاشتراك لا يُقرآن من `user_metadata`** بل من هذا الجدول فقط.
- ترقية المشرف يدوية:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = '...';
```

### 4.2 `public.questions`

| العمود | النوع |
| :--- | :--- |
| `id` | TEXT PK |
| `cycles` | TEXT[] |
| `subject` | TEXT |
| `topic` | TEXT |
| `question` | TEXT |
| `options` | JSONB |
| `correct_answer` | TEXT |
| `explanation` | TEXT |
| `created_at` | TIMESTAMPTZ |

يحتوي الملف على بذور 2,284 سؤالاً. عمود `cycles` يُضاف تلقائياً لقواعد البيانات القديمة.

### 4.3 `public.subscription_requests`

| العمود | النوع |
| :--- | :--- |
| `id` | TEXT PK |
| `user_id` | UUID → `auth.users` |
| `user_email` / `user_name` | TEXT |
| `cycle` | TEXT |
| `receipt_url` / `receipt_path` | TEXT |
| `payment_method` / `notes` | TEXT |
| `status` | `pending` / `approved` / `rejected` |
| `rejection_reason` | TEXT |
| `reviewed_by` | UUID |
| `created_at` / `reviewed_at` | TIMESTAMPTZ |

### 4.4 `public.question_progress`

| العمود | النوع |
| :--- | :--- |
| `user_id` | UUID → `auth.users` |
| `question_id` | TEXT → `questions(id)` |
| `is_correct` | BOOLEAN |
| `answered_at` | TIMESTAMPTZ |

المفتاح الأساسي: `(user_id, question_id)`. لا توجد سياسة كتابة مباشرة للمستخدم؛ الكتابة عبر الدالة `record_question_progress` فقط.

### 4.5 `public.summaries`

| العمود | النوع |
| :--- | :--- |
| `id` | TEXT PK |
| `title` / `category` / `cycle` | TEXT |
| `read_time` | TEXT |
| `sections` | JSONB |

المحتوى المدفوع لا يُضمَّن في الحزمة العامة؛ يُقرأ من هذا الجدول للمشترك الكامل أو المشرف فقط.

### 4.6 مخزن `receipts`

- Bucket **خاص** (`public = false`).
- مسار الملف: `<user-id>/<uuid>.<ext>`.
- صلاحيات: الرفع والقراءة والحذف لصاحب المجلد، والقراءة/الحذف للمشرف.
- الواجهة تعرض صورة عبر رابط موقّع مؤقت (ساعة واحدة).

---

## 5. سياسات RLS (ملخص)

| الجدول / المخزن | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | صاحب السجل أو المشرف | صاحب السجل بقيم `user/trial` فقط | المشرف | المشرف |
| `questions` | عام | المشرف | المشرف | المشرف |
| `subscription_requests` | صاحب الطلب أو المشرف | صاحب الطلب بحالة `pending` | المشرف | المشرف |
| `question_progress` | صاحب التقدم أو المشرف | عبر RPC فقط | عبر RPC فقط | — |
| `summaries` | مشترك `premium` أو مشرف | المشرف | المشرف | المشرف |
| `storage.receipts` | صاحب المجلد أو المشرف | صاحب المجلد | — | صاحب المجلد أو المشرف |

دالة `public.is_admin(uid)` هي `SECURITY DEFINER` وتُستخدم داخل السياسات لتجنب التكرار اللانهائي.

---

## 6. تدفق المصادقة والاشتراك

1. **إنشاء حساب:** `supabase.auth.signUp` مع `full_name` و`cycle` فقط. لا تُرسل حقول الدور أو الاشتراك.
2. **تأكيد البريد:** إن كان مفعّلاً، تُعرض رسالة انتظار. إن كان معطلاً، تُفتح الجلسة مباشرة.
3. **تحميل الملف الشخصي:** يُقرأ من `profiles`؛ عند تعذّره يُستخدم وضع آمن (trial، بلا مشرف).
4. **تسجيل الدخول:** `signInWithPassword` مع ترجمة أخطاء عربية وعدّاد محاولات في الواجهة.
5. **الاشتراك:** رفع الوصل إلى `receipts` → إدراج طلب `pending` → مراجعة المشرف → تحديث `profiles.subscription_status` إلى `premium`.
6. **استعادة كلمة المرور:** رابط Supabase يعيد التوجيه إلى أصل الموقع، ويُفتح `ResetPasswordModal` عند حدث `PASSWORD_RECOVERY`.

---

## 7. الكوطة التجريبية (20 سؤالاً/مادة)

- **الواجهة:** `QuizSetup` يعطّل المواد المكتملة ويعرض العداد المتبقي، و`App` يقيّد الاختيار حتى في «جميع المواد».
- **الخادم:** `record_question_progress(p_question_id, p_is_correct)`:
  1. تتحقق من وجود المستخدم والسؤال.
  2. تقرأ حالة الاشتراك من `profiles`.
  3. إذا كان المستخدم `trial`، ترفض تجاوز 20 سؤالاً في نفس المادة.
  4. تُدرج أو تُحدّث سجل التقدم.
- لذلك يجب أن تكون كل الأسئلة المستخدمة موجودة في جدول `questions` (البذور الكاملة).

---

## 8. المنطق البيداغوجي

### 8.1 معاملات الابتدائي المزدوج

| المادة | المعامل |
| :--- | :---: |
| اللغة العربية | 6 |
| اللغة الفرنسية | 6 |
| الرياضيات | 6 |
| العلوم والنشاط العلمي | 2 |
| ديداكتيك العربية | 3 |
| ديداكتيك الفرنسية | 3 |
| ديداكتيك الرياضيات | 3 |
| ديداكتيك العلوم | 3 |
| علوم التربية والمستجدات | 8 |

### 8.2 معاملات الثانوي (إعدادي/تأهيلي)

| المادة | المعامل |
| :--- | :---: |
| مادة التخصص | 20 |
| ديداكتيك مادة التخصص | 12 |
| علوم التربية | 8 |

### 8.3 حساب النتيجة

$$\text{Final Score} = \frac{\sum (\text{المعامل} \times \text{نسبة الصواب بالمادة})}{\sum \text{المعاملات}} \div 5$$

### 8.4 التقويم الميتامعرفي

- درجات الثقة: `متأكد`، `متردد`، `تخمين`، `لا أعرف`.
- «وهم المعرفة»: ثقة عالية + جواب خاطئ.
- «تخمين الحظ»: تخمين + جواب صائب.

---

## 9. الأمان على مستوى النشر

`vercel.json` يضبط:

- `Content-Security-Policy` (مع السماح لـ Supabase وGoogle Fonts فقط).
- `Strict-Transport-Security` (سنتان + preload).
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` لتعطيل الكاميرا والميكروفون والموقع والدفع.
- `Cross-Origin-Opener-Policy: same-origin`.

كما يوجد `ErrorBoundary` عام يمنع الشاشة البيضاء، و`tsconfig` بوضع `strict: true`.

---

## 10. التشغيل والبناء

```bash
git clone https://github.com/fansimlali/crmef.git
cd crmef
npm install
cp .env.example .env.local   # ثم املأ القيم
npm run check:env
npm run dev
```

فحص الإنتاج:

```bash
npm run lint
npm run build
npm run preview
```

---

## 11. سكريبتات الصيانة

| السكريبت | الوظيفة |
| :--- | :--- |
| `scripts/generate_supabase_sql.cjs` | يحدّث قسم بذور الأسئلة فقط في `supabase_schema.sql` ويحافظ على كل سياسات الأمان |
| `scripts/build_summaries_data.cjs` | يبني `scripts/seed-data/summariesData.ts` من `molakhasat/` (كله غير متتبع) |
| `scripts/export_summaries.mjs` | ينتج `supabase_summaries_seed.sql` من المصدر المحلي |
| `scripts/check_env.mjs` | يتحقق من متغيرات البيئة العامة (يرفض `service_role`/`sb_secret_*`؛ يعمل قبل البناء والتطوير) |
| `scripts/analyze_questions.cjs` | إحصاء سريع لبنك الأسئلة |
| `scripts/generate_*.cjs` | توليد دفعات البنك (مرجع تاريخي؛ `questions_seed.json` هو المصدر النموذجي) |
| `.github/workflows/ci.yml` | يشغّل `npm ci` + lint + build على كل push/PR |

---

## 12. قيود معروفة

- لا توجد اختبارات وحدات آلية بعد؛ التحقق الحالي يعتمد على TypeScript وlint والبناء وفحوصات النشر اليدوية.
- إدارة المشرفين والترقيات تتم عبر SQL/لوحة Supabase، وليس عبر واجهة إدارة مستخدمين.
- روابط الوصولات الموقّعة تنتهي بعد ساعة، وتُعاد عند تحديث القائمة.
- بذور الأسئلة الكاملة شرط لعمل الكوطة الخادمية، كما هو موضح في القسم 7.
