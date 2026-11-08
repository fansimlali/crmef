# ✅ قائمة التحقق قبل وبعد النشر

هذه الخطوات **إلزامية** لتفعيل النسخة الآمنة. لا تعتبر التغييرات مكتملة بمجرد دفع الكود إلى Git.

---

## 1. قاعدة البيانات (Supabase)

- [ ] افتح **Supabase Dashboard > SQL Editor** لمشروع `lwicejthksskkhfsilky`.
- [ ] نفّذ محتوى [`supabase_schema.sql`](./supabase_schema.sql) كاملاً (آمن لإعادة التشغيل).
- [ ] تحقق من وجود الجداول: `profiles`، `questions`، `subscription_requests`، `question_progress`، `summaries`.
- [ ] تحقق من أن `questions` يحتوي **2,284** صفاً:

```sql
SELECT count(*) FROM public.questions;
```

- [ ] تحقق من أن عمود `cycles` موجود وأن قيمته الافتراضية `{primary}`.
- [ ] تحقق من أن مخزن `receipts` **خاص**:

```sql
SELECT id, public FROM storage.buckets WHERE id = 'receipts';
-- يجب أن تكون public = false
```

- [ ] فعّل حساب المشرف الوحيد المطلوب:

```sql
UPDATE public.profiles
SET role = 'admin', subscription_status = 'premium'
WHERE email = 'ضع-بريد-المشرف-الحقيقي-هنا';

-- تأكد ألا يوجد مشرف آخر غير مقصود:
SELECT id, email, role, subscription_status FROM public.profiles WHERE role = 'admin';
```

- [ ] (اختياري) أدرج الملخصات المدفوعة:

```bash
npm run seed:summaries
# نفّذ supabase_summaries_seed.sql في SQL Editor
```

- [ ] في **Authentication > URL Configuration**، أضف:
  - Site URL: `https://crmef.vercel.app` (أو النطاق النهائي)
  - Redirect URLs: نفس النطاق + `http://localhost:5173` للتطوير
- [ ] راجع **Authentication > Providers > Email**: تأكيد البريد مفعّل، وكلمة المرور بحد أدنى مناسب.

---

## 2. إعدادات Vercel

- [ ] أضف `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` في **Settings > Environment Variables** لبيئات Production وPreview.
- [ ] تأكد أن المفتاح هو `anon`/`publishable` فقط، وليس `service_role`.
- [ ] أعد النشر (**Redeploy**) بعد إضافة المتغيرات.
- [ ] تأكد من وجود رؤوس الأمان على النطاق المنشور (CSP، HSTS، X-Frame-Options، nosniff، Referrer-Policy، Permissions-Policy، COOP).
- [ ] تحقق من أن حزمة الإنتاج لا تحتوي بيانات الدخول القديمة:

```bash
npm run build
# يجب ألا يعيد أي نتيجة:
rg "admin@crmef.ma|admin123456" dist
```

---

## 3. معالجة الحادث الأمني السابق (مرة واحدة)

النسخة القديمة المنشورة كانت تحتوي بيانات دخول مشرف مضمّنة في الكود، وكانت بعض الملفات المدفوعة مرفوعة إلى Git. نفّذ ما يلي:

- [ ] **غيّر أو احذف** أي حساب Supabase يطابق `admin@crmef.ma`، أو أي كلمة مرور كانت منشورة علناً.
- [ ] راجع `auth.users` و`profiles` بحثاً عن حسابات مشرف غير متوقعة.
- [ ] أعد نشر الواجهة الجديدة حتى يختفي الملف القديم من الشبكة.
- [ ] **نظّف تاريخ Git** من المحتوى المدفوع والملفات القديمة:
  - خذ نسخة احتياطية من المستودع أولاً.
  - استخدم `git filter-repo` أو BFG لحذف:
    - `src/data/summariesData.ts` (المحتوى المدفوع القديم)
    - `molakhasat/` (إن كان لا يزال في التاريخ)
  - مثال باستخدام `git filter-repo`:

```bash
git filter-repo --path src/data/summariesData.ts --invert-paths
git filter-repo --path molakhasat --invert-paths
git push --force --all
git push --force --tags
```

- [ ] أبلغ أي مساهمين بإعادة استنساخ المستودع بعد إعادة كتابة التاريخ.
- [ ] إن كانت كلمات المرور القديمة مستخدمة في خدمات أخرى، غيّرها هناك أيضاً.

---

## 4. فحوصات وظيفية بعد النشر

- [ ] إنشاء حساب جديد → تصل رسالة تأكيد البريد → الرابط يعمل.
- [ ] تسجيل الدخول بحساب تجريبي → يظهر شريط الكوطة 20/20 لكل مادة.
- [ ] اجتياز 20 سؤالاً في مادة → يُمنع السؤال 21 ويظهر زر الترقية.
- [ ] اختيار «جميع المواد» → لا يتجاوز مجموع الأسئلة الكوطة المتبقية لكل مادة.
- [ ] رفع وصل اشتراك → يُحفظ الطلب بحالة `pending` وتظهر المعاينة للمشرف.
- [ ] موافقة المشرف → تصبح حالة الحساب `premium` وتُفتح الملخصات.
- [ ] فتح تبويب الملخصات بحساب `trial` → تظهر شاشة الحجب فقط، ولا تُحمّل أي نصوص مدفوعة من الشبكة.
- [ ] تسجيل الخروج والعودة → يُستعاد التقدم من `question_progress` وليس من `localStorage` وحده.

---

## 5. فحوصات RLS سلبية (مهمة)

نفّذ هذه الاستعلامات بحساب/مفتاح `anon` أو مستخدم `trial`، ويجب أن تفشل أو تعيد صفراً:

```sql
-- يجب أن يفشل: anon لا يكتب الأسئلة
INSERT INTO public.questions (id, subject, topic, question, options, correct_answer, explanation)
VALUES ('hack', 'ar', 'x', 'x', '["a","b"]'::jsonb, 'a', '');

-- لمستخدم trial: يجب أن يعيد 0 صفوف
SELECT * FROM public.summaries;

-- لمستخدم غير مشرف: يجب أن يفشل تعديل دوره
UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
```

- [ ] تأكد أن الصور في `receipts` غير قابلة للوصول عبر رابط عام مباشر.
- [ ] تأكد أن رابط الوصل الموقّع يعمل للمشرف فقط وينتهي بعد ساعة.

---

## 6. التراجع (Rollback)

- إن فشل النشر: أعد نشر آخر نسخة مستقرة من Vercel.
- لا تحذف جداول Supabase أثناء التراجع؛ الواجهة القديمة قد تعتمد على `questions` فقط.
- احتفظ بنسخة من `supabase_summaries_seed.sql` خارج المستودع.
