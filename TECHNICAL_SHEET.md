# 📋 البطاقة التقنية لمنصة الاختبار التجريبي CRMEF
**اسم المشروع:** منصة التقويم التجريبي لمباراة التعليم – سلك الابتدائي (مزدوج)  
**الحالة:** جاهز للاستخدام ومرفوع على السحابة (Production Ready)  
**المستودع:** https://github.com/fansimlali/crmef  

---

### 1. الروابط والمستودعات الأساسية

| البيان | الرابط / التفاصيل |
| :--- | :--- |
| **مستودع الكود (GitHub)** | https://github.com/fansimlali/crmef |
| **الفرع الرئيسي (Default Branch)** | `main` |
| **مشروع Supabase** | المعرّف: `lwicejthksskkhfsilky` |
| **رابط الخادم المحلي** | `http://localhost:5173` |

---

### 2. المتغيرات البيئية المطلوبة (Environment Variables)

يتم ضبط هذه المتغيرات في ملف `.env.local` محلياً، أو في إعدادات **Vercel** (`Settings > Environment Variables`):

```env
# رابط مشروع قاعدة البيانات Supabase
VITE_SUPABASE_URL=https://lwicejthksskkhfsilky.supabase.co

# المفتاح العام للمتصفح (Anon / Publishable Key من Supabase Dashboard > API)
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key

# مفتاح بوابة الذكاء الاصطناعي Vercel AI Gateway (اختياري)
VITE_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

> **ملاحظة أمنية:**  
> المفتاح السري (Secret Key) لا يتم تضمينه في المستودع العام، بل يظل محفوظاً في لوحة تحكم Supabase لاستخدامه في العمليات الإدارية الخاصة.

---

### 3. المعمارية التقنية (Architecture & Tech Stack)

* **الواجهة الأمامية (Frontend):** 
  * `React 19` + `TypeScript` + `Vite 8`
  * `Tailwind CSS v4` للتصميم المتجاوب ودعم اللغة العربية (RTL).
  * `Lucide React` للأيقونات، و `canvas-confetti` للتفاعل عند النجاح.
* **قاعدة البيانات والواجهة الخلفية (Backend & Database):**
  * **Supabase** (PostgreSQL 15+ مع محرك PostgREST).
  * نظام تخزين مزدوج (**Dual-Storage Strategy**): يقرأ ويكتب سحابياً في Supabase، مع نظام حفظ احتياطي تلقائي بـ `localStorage` في حال انقطاع الشبكة.
* **الاستضافة والنشر (Hosting & CI/CD):**
  * `GitHub` -> `Vercel Edge Network`.
  * تم تضمين ملف `vercel.json` لضمان عمل الروابط وإعادة التوجيه (SPA Routing).

---

### 4. هيكل قاعدة البيانات (Database Schema)

الجدول الأساسي هو `questions` ومخططه معرّف بالكامل في الملف `supabase_schema.sql`:

```sql
create table public.questions (
    id text primary key,             -- معرّف السؤال الفريد (مثل: ma1, ar_17123456)
    subject text not null,          -- رمز المادة: ar, fr, ma, sc, dar, dfr, dma, dsc, edu
    topic text not null,            -- المحور: مثل "الكسور"، "النحو"، "نظريات التعلم"
    question text not null,         -- نص السؤال
    options jsonb not null,         -- مصفوفة الخيارات ["أ", "ب", "ج", "د"]
    correct_answer text not null,   -- نص الجواب الصحيح المطابق لأحد الخيارات
    explanation text default '',    -- التعليل والتوضيح البيداغوجي لظهوره عند التصحيح
    created_at timestamp with time zone default now()
);
```

---

### 5. المنطق البيداغوجي للمباراة (Business Logic)

1. **نظام المعاملات المعتمد (مباراة الابتدائي المزدوج):**
   * العربية: `6` | الفرنسية: `6` | الرياضيات: `6` | النشاط العلمي: `2`
   * ديداكتيك العربية: `3` | الفرنسية: `3` | الرياضيات: `3` | العلوم: `3`
   * علوم التربية والمستجدات: `8`
2. **صيغة حساب النتيجة من 20:**
   $$\text{Final Score} = \frac{\sum (\text{المعامل} \times \text{نسبة الصواب بالمادة})}{\sum \text{المعاملات}} \div 5$$
3. **التقويم الميتامعرفي (Metacognition):**
   * قياس درجات الثقة: `متأكد`، `متردد`، `تخمين`، `لا أعرف`.
   * استخراج مؤشر **"وهم المعرفة"** (متأكد + جواب خاطئ) ومؤشر **"تخمين الحظ"** (تخمين + جواب صائب).

---

### 6. تشغيل المشروع لأي مطور جديد في 3 خطوات

```bash
# 1. استنساخ المستودع
git clone https://github.com/fansimlali/crmef.git
cd crmef

# 2. تثبيت الحزم
npm install

# 3. تشغيل الخادم المحلي
npm run dev
```
