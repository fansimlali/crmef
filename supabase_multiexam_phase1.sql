-- ============================================================================
-- المرحلة 1 — أساس تعدد المباريات: exams / subjects + أعمدة exam_id
-- (التنفيذ متكرر آمن؛ شرط تفعيل زر «رفع حزمة مباراة» والبطاقات الديناميكية)
-- ============================================================================

-- 1) جدول المباريات (الكيان الرئيسي للبطاقات).
CREATE TABLE IF NOT EXISTS public.exams (
  id          TEXT PRIMARY KEY,               -- 'crmef'
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  short_name  TEXT,
  description TEXT,
  icon        TEXT NOT NULL DEFAULT 'graduation',
  color       TEXT NOT NULL DEFAULT 'emerald',
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exams read active or admin" ON public.exams;
CREATE POLICY "exams read active or admin" ON public.exams
  FOR SELECT TO authenticated
  USING (is_active OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "exams write admin" ON public.exams;
CREATE POLICY "exams write admin" ON public.exams
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) مواد كل مباراة (التخصص = key داخل المباراة؛ الاسم المعروض هنا).
CREATE TABLE IF NOT EXISTS public.subjects (
  exam_id    TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,                  -- 'ar'، 'sec_math'، 'med_anat'…
  name       TEXT NOT NULL,
  cycles     TEXT[] NOT NULL DEFAULT ARRAY['primary','secondary_prep','secondary_qual']::text[],
  weight     INT NOT NULL DEFAULT 1,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (exam_id, key)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects read all authenticated" ON public.subjects;
CREATE POLICY "subjects read all authenticated" ON public.subjects
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "subjects write admin" ON public.subjects;
CREATE POLICY "subjects write admin" ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3) ربط المحتوى الحالي بالمباراة (افتراضياً CRMEF إلى أن تُنشأ مباراة أخرى).
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';

-- مرجعية ناعمة (NOT VALID): تفرضها الكتابات الجديدة دون الفشل على صفوف قديمة نادرة.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_exam_fk;
ALTER TABLE public.questions ADD CONSTRAINT questions_exam_fk
  FOREIGN KEY (exam_id) REFERENCES public.exams(id) NOT VALID;
ALTER TABLE public.summaries DROP CONSTRAINT IF EXISTS summaries_exam_fk;
ALTER TABLE public.summaries ADD CONSTRAINT summaries_exam_fk
  FOREIGN KEY (exam_id) REFERENCES public.exams(id) NOT VALID;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_exam_fk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_exam_fk
  FOREIGN KEY (exam_id) REFERENCES public.exams(id) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON public.questions (exam_id, subject);

-- ملاحظة: تشديد RLS حسب exam_id مؤجل عمداً حتى وجود مباراتين نشطتين معاً
-- (العزل حالياً بالسلك+is_trial؛ راجع SKILL_EXAM_CONTENT.md §8).

-- 4) بذر المباراة CRMEF وموادها الثلاث والثلاثين (أسماء مطابقة للواجهة).
INSERT INTO public.exams (id, slug, name, short_name, description, icon, color, is_active, sort_order)
VALUES ('crmef', 'crmef', 'مباراة التعليم', 'CRMEF',
        'سلك تأهيل أطر التدريس بالمراكز الجهوية — ابتدائي، إعدادي، تأهيلي',
        'graduation', 'emerald', TRUE, 10)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, name = EXCLUDED.name, short_name = EXCLUDED.short_name,
  description = EXCLUDED.description, icon = EXCLUDED.icon, color = EXCLUDED.color;

INSERT INTO public.subjects (exam_id, key, name, cycles, weight) VALUES
('crmef','ar','اللغة العربية (ابتدائي)',ARRAY['primary']::text[],6),
('crmef','fr','اللغة الفرنسية (ابتدائي)',ARRAY['primary']::text[],6),
('crmef','ma','الرياضيات (ابتدائي)',ARRAY['primary']::text[],6),
('crmef','sc','العلوم والنشاط العلمي (ابتدائي)',ARRAY['primary']::text[],2),
('crmef','dar','ديداكتيك العربية (ابتدائي)',ARRAY['primary']::text[],3),
('crmef','dfr','ديداكتيك الفرنسية (ابتدائي)',ARRAY['primary']::text[],3),
('crmef','dma','ديداكتيك الرياضيات (ابتدائي)',ARRAY['primary']::text[],3),
('crmef','dsc','ديداكتيك العلوم (ابتدائي)',ARRAY['primary']::text[],3),
('crmef','edu','علوم التربية ومستجدات المنظومة',ARRAY['primary','secondary_prep','secondary_qual']::text[],8),
('crmef','sec_math','الرياضيات وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_math','ديداكتيك الرياضيات (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_physics','الفيزياء والكيمياء وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_physics','ديداكتيك الفيزياء والكيمياء',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_svt','علوم الحياة والأرض وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_svt','ديداكتيك علوم الحياة والأرض',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_ar','اللغة العربية وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_ar','ديداكتيك اللغة العربية (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_fr','اللغة الفرنسية وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_fr','ديداكتيك اللغة الفرنسية (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_eng','اللغة الإنجليزية وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_eng','ديداكتيك اللغة الإنجليزية',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_islamic','التربية الإسلامية وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_islamic','ديداكتيك التربية الإسلامية',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_hist_geo','التاريخ والجغرافيا / الاجتماعيات وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_hist_geo','ديداكتيك التاريخ والجغرافيا',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_cs','المعلوميات وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_d_cs','ديداكتيك المعلوميات',ARRAY['secondary_prep','secondary_qual']::text[],12),
('crmef','sec_pe','التربية البدنية والرياضية وديداكتيكها (ثانوي)',ARRAY['secondary_prep','secondary_qual']::text[],20),
('crmef','sec_philo','الفلسفة وديداكتيكها (ثانوي تأهيلي)',ARRAY['secondary_qual']::text[],20),
('crmef','sec_d_philo','ديداكتيك الفلسفة',ARRAY['secondary_qual']::text[],12),
('crmef','sec_eco','العلوم الاقتصادية والتدبير وديداكتيكها (تأهيلي)',ARRAY['secondary_qual']::text[],20),
('crmef','sec_d_eco','ديداكتيك الاقتصاد والتدبير',ARRAY['secondary_qual']::text[],12),
('crmef','sec_te','التكنولوجيا الصناعية وديداكتيكها (إعدادي)',ARRAY['secondary_prep']::text[],20)
ON CONFLICT (exam_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  cycles = EXCLUDED.cycles,
  weight = EXCLUDED.weight;


