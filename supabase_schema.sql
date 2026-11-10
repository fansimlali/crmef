-- ==============================================================================
-- Schema for CRMEF Platform (structure + security only)
-- Question/answer seeds live in gitignored supabase_questions_seed.sql (generated locally)
--
-- هذا الملف آمن لإعادة التشغيل (Idempotent) ويطبّق:
--   * جدول profiles كمصدر وحيد للدور وحالة الاشتراك (وليس user_metadata).
--   * جدول subscription_requests + مخزن receipts خاص مع سياسات RLS.
--   * جدول question_progress + دالة خادم تفرض كوطة 20 سؤالاً لكل مادة.
--   * سياسات كتابة على questions للمشرفين فقط.
--
-- بعد التنفيذ، فعّل حساب المشرف يدوياً مرة واحدة:
--   UPDATE public.profiles SET role = 'admin'
--   WHERE email = 'ضع-بريد-المشرف-هنا';
-- ==============================================================================

-- ───────────────────────────── الملفات الشخصية ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'premium')),
  cycle TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- قواعد قديمة قد تفتقد أعمدة (CREATE IF NOT EXISTS لا يضيفها):
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cycle TEXT NOT NULL DEFAULT 'primary';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_subscription_status_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check CHECK (subscription_status IN ('trial', 'premium'));
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- دالة مساعدة: هل المستخدم الحالي مشرف؟ (SECURITY DEFINER لتجنب تكرار RLS)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- نمنع استخدام الدالة كأداة للاستعلام عن أدوار مستخدمين آخرين:
  -- لا نسمح إلا بالمقارنة مع هوية المتصل نفسه (كل السياسات الداخلية تفعل ذلك).
  SELECT COALESCE(uid, auth.uid()) = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = COALESCE(uid, auth.uid()) AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- دالة مساعدة: هل المستخدم مشترك كامل؟ (مصدر وحيد للحالة المدفوعة)
CREATE OR REPLACE FUNCTION public.is_premium(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid())
      AND (subscription_status = 'premium' OR role = 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_premium(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;

DROP POLICY IF EXISTS "profiles read own or admin" ON public.profiles;
CREATE POLICY "profiles read own or admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- المستخدم يستطيع إنشاء ملفه فقط بقيم آمنة (لا يمكنه منح نفسه admin/premium).
DROP POLICY IF EXISTS "profiles insert own safe" ON public.profiles;
CREATE POLICY "profiles insert own safe" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'user'
    AND subscription_status = 'trial'
    -- ربط البريد ببريد الجلسة الحالي وحصر طول الاسم.
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND char_length(COALESCE(full_name, '')) <= 120
    AND cycle IN ('primary', 'secondary_prep', 'secondary_qual')
  );

-- التعديل (بما فيه الترقية) للمشرف فقط. تغيير الاسم يتم عبر إدارة الحساب.
DROP POLICY IF EXISTS "profiles update admin only" ON public.profiles;
CREATE POLICY "profiles update admin only" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles delete admin only" ON public.profiles;
CREATE POLICY "profiles delete admin only" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- قيد نطاق السلك: يمنع حفظ قيمة غير معروفة قادمة من user_metadata.
-- NOT VALID حتى لا تفشل التهيئة على صفوف قديمة، لكنه يُطبَّق على كل صف جديد.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cycle_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cycle_check
  CHECK (cycle IN ('primary', 'secondary_prep', 'secondary_qual')) NOT VALID;

-- إنشاء الملف الشخصي تلقائياً عند التسجيل (بدل الاعتماد على user_metadata).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, cycle)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    CASE
      WHEN NEW.raw_user_meta_data->>'cycle' IN ('primary', 'secondary_prep', 'secondary_qual')
        THEN NEW.raw_user_meta_data->>'cycle'
      ELSE 'primary'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- دالة المشغّل لا تُستدعى مباشرة من العملاء.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تعبئة الملفات الشخصية للمستخدمين الموجودين مسبقاً.
INSERT INTO public.profiles (id, email, full_name, cycle)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, ''), '@', 1)),
  CASE
    WHEN u.raw_user_meta_data->>'cycle' IN ('primary', 'secondary_prep', 'secondary_qual')
      THEN u.raw_user_meta_data->>'cycle'
    ELSE 'primary'
  END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────── طلبات الاشتراك ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  cycle TEXT NOT NULL DEFAULT 'primary',
  receipt_url TEXT,
  receipt_path TEXT,
  payment_method TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- قواعد قديمة قد تفتقد أعمدة:
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS receipt_path TEXT;
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS subscription_requests_user_idx
  ON public.subscription_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_requests_status_idx
  ON public.subscription_requests (status, created_at DESC);

-- طلب واحد قيد المراجعة لكل مستخدم (يمنع الإغراق بطلبات متكررة).
-- ملاحظة: إذا وُجدت صفوف مكررة قديمة، يجب تنظيفها قبل إعادة تشغيل هذا الفهرس.
CREATE UNIQUE INDEX IF NOT EXISTS subscription_requests_one_pending_per_user
  ON public.subscription_requests (user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS subscription_requests_reviewed_by_idx
  ON public.subscription_requests (reviewed_by);

-- قيود حدودية آمنة للتهيئة على بيانات قديمة (NOT VALID تُطبَّق على الصفوف الجديدة).
ALTER TABLE public.subscription_requests DROP CONSTRAINT IF EXISTS subscription_requests_cycle_check;
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_cycle_check
  CHECK (cycle IN ('primary', 'secondary_prep', 'secondary_qual')) NOT VALID;
ALTER TABLE public.subscription_requests DROP CONSTRAINT IF EXISTS subscription_requests_field_limits;
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_field_limits
  CHECK (
    char_length(user_email) BETWEEN 3 AND 320
    AND char_length(COALESCE(user_name, '')) <= 120
    AND char_length(COALESCE(payment_method, '')) <= 80
    AND char_length(COALESCE(notes, '')) <= 2000
    AND char_length(COALESCE(rejection_reason, '')) <= 2000
  ) NOT VALID;

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests insert own pending" ON public.subscription_requests;
CREATE POLICY "requests insert own pending" ON public.subscription_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rejection_reason IS NULL
    -- مسار الوصل يجب أن يكون داخل مجلد المستخدم نفسه.
    AND (receipt_path IS NULL OR receipt_path LIKE auth.uid()::text || '/%')
    -- الوصل يُرفع كملف أولاً ثم يُمرَّر مساره فقط؛ لا نثق بأي رابط خارجي جديد.
    AND receipt_url IS NULL
    AND cycle IN ('primary', 'secondary_prep', 'secondary_qual')
    AND char_length(COALESCE(payment_method, '')) <= 80
    AND char_length(COALESCE(notes, '')) <= 2000
  );

DROP POLICY IF EXISTS "requests read own or admin" ON public.subscription_requests;
CREATE POLICY "requests read own or admin" ON public.subscription_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- لا يستطيع المستخدم تعديل طلبه أو الموافقة عليه بنفسه.
DROP POLICY IF EXISTS "requests update admin only" ON public.subscription_requests;
CREATE POLICY "requests update admin only" ON public.subscription_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "requests delete admin only" ON public.subscription_requests;
CREATE POLICY "requests delete admin only" ON public.subscription_requests
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ───────────────────────────── مخزن الوصولات الخاص ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- حدود صارمة على المخزن: صور فقط (5MB كحد أقصى).
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'receipts';

DROP POLICY IF EXISTS "receipts upload own folder" ON storage.objects;
CREATE POLICY "receipts upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND char_length(name) < 255
    AND (
      lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
      OR lower(right(name, 4)) IN ('.jpg', '.png')
      OR lower(right(name, 5)) IN ('.jpeg', '.webp')
    )
  );

DROP POLICY IF EXISTS "receipts read own or admin" ON storage.objects;
CREATE POLICY "receipts read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "receipts delete own or admin" ON storage.objects;
CREATE POLICY "receipts delete own or admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin(auth.uid())
    )
  );

-- ───────────────────────────── الملخصات المدفوعة ─────────────────────────────
-- المحتوى المدفوع لا يُضمَّن في حزمة JavaScript العامة، بل يُقرأ من هنا فقط
-- للمشتركين الكاملين أو المشرفين وفق سياسة RLS.
CREATE TABLE IF NOT EXISTS public.summaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  cycle TEXT NOT NULL,
  read_time TEXT,
  sections JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- حصر القراءة في سلك المستخدم (قيم cycle العربية في جدول summaries).
        AND (
          p.role = 'admin'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

DROP POLICY IF EXISTS "summaries write admin only" ON public.summaries;
CREATE POLICY "summaries write admin only" ON public.summaries
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ───────────────────────────── جدول الأسئلة (نصوص الأسئلة فقط) ─────────────────────────────
-- الأسئلة والخيارات تُقرأ هنا، بينما الإجابات الصحيحة والشروح في جدول
-- question_answers المحمي (المشترك الكامل/المشرف فقط، أو عبر دالة answer_question).
-- النموذج المدفوع: التجريبي يرى أول 20 سؤالاً لكل مادة (is_trial=true) فقط.

CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  cycles TEXT[] NOT NULL DEFAULT '{"primary"}',
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_trial BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- قواعد البيانات القديمة قد لا تحتوي على عمود cycles.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS cycles TEXT[] NOT NULL DEFAULT '{"primary"}';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT FALSE;

-- جدول الإجابات المنفصل (جديد): يُنشأ قبل ترحيل البيانات القديمة.
CREATE TABLE IF NOT EXISTS public.question_answers (
  question_id TEXT PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ترحيل المحتوى القديم (قواعد البيانات القائمة قبل فصل الإجابات):
-- تُنسخ الإجابات إلى الجدول الجديد ثم تُحذف الأعمدة من جدول الأسئلة.
-- تُنفَّذ مرة واحدة عبر DO لتبقى التهيئة آمنة عند إعادة التشغيل.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'correct_answer'
  ) THEN
    EXECUTE $q$
      INSERT INTO public.question_answers (question_id, correct_answer, explanation)
      SELECT id, correct_answer, COALESCE(explanation, '')
      FROM public.questions
      WHERE correct_answer IS NOT NULL
      ON CONFLICT (question_id) DO NOTHING
    $q$;
    EXECUTE 'ALTER TABLE public.questions DROP COLUMN correct_answer';
    EXECUTE 'ALTER TABLE public.questions DROP COLUMN explanation';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS questions_subject_idx ON public.questions (subject);
CREATE INDEX IF NOT EXISTS questions_cycles_idx ON public.questions USING GIN (cycles);
CREATE INDEX IF NOT EXISTS questions_trial_idx ON public.questions (is_trial, subject);

-- قيود سلامة البنية (NOT VALID حتى لا تفشل التهيئة على صفوف قديمة؛ تُطبَّق على الجديد).
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_structure_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_structure_check
  CHECK (
    char_length(trim(subject)) > 0
    AND char_length(trim(topic)) > 0
    AND char_length(trim(question)) > 0
    AND jsonb_typeof(options) = 'array'
    AND jsonb_array_length(options) >= 2
    AND cycles <@ ARRAY['primary', 'secondary_prep', 'secondary_qual']
  ) NOT VALID;

-- التجريبي يقرأ فقط الأسئلة المجانية (أول 20 لكل مادة) في سلكه؛
-- الكامل يقرأ أسئلة سلكه فقط (الخيار أ: حصر بالسلك المسجل)؛ المشرف يقرأ الكل.
DROP POLICY IF EXISTS "Allow public read" ON public.questions;
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          (is_trial AND p.cycle = ANY(questions.cycles))
          OR (p.subscription_status = 'premium' AND p.cycle = ANY(questions.cycles))
        )
    )
  );

-- الإجابات: المشترك الكامل أو المشرف فقط (التجريبي لا يقرأها مباشرة أبداً).
DROP POLICY IF EXISTS "Answers read premium or admin" ON public.question_answers;
CREATE POLICY "Answers read premium or admin" ON public.question_answers
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.is_premium(auth.uid())
  );

DROP POLICY IF EXISTS "Answers write admin only" ON public.question_answers;
CREATE POLICY "Answers write admin only" ON public.question_answers
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- الكتابة للمشرف العام فقط (وليس لأي مستخدم مسجل)
DROP POLICY IF EXISTS "Allow authenticated insert" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated update" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated delete" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ───────────────────────────── تقدم المستخدم والكوطة ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.question_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_progress_question_idx
  ON public.question_progress (question_id);

ALTER TABLE public.question_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress read own or admin" ON public.question_progress;
CREATE POLICY "progress read own or admin" ON public.question_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- لا توجد سياسة INSERT/UPDATE للمستخدم: الكتابة تتم فقط عبر الدالة أدناه.
CREATE OR REPLACE FUNCTION public.record_question_progress(
  p_question_id TEXT,
  p_is_correct BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_subject TEXT;
  v_trial BOOLEAN;
  v_premium BOOLEAN;
  v_answered INTEGER;
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  -- قفل لكل مستخدم يمنع تجاوز الكوطة بطلبات متوازية.
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));

  SELECT subject, is_trial INTO v_subject, v_trial FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT (subscription_status = 'premium' OR role = 'admin') INTO v_premium
  FROM public.profiles WHERE id = v_uid;

  -- حصر بالسلك المسجل (غير المشرف): التجريبي والكامل لا يجيبان إلا عن أسئلة سلكهما.
  IF NOT public.is_admin(v_uid) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- التجريبي لا يتعامل إلا مع أسئلة العينة المجانية.
  IF NOT COALESCE(v_premium, FALSE) AND NOT v_trial THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  IF NOT COALESCE(v_premium, FALSE) THEN
    SELECT COUNT(*) INTO v_answered
    FROM public.question_progress qp
    JOIN public.questions q ON q.id = qp.question_id
    WHERE qp.user_id = v_uid AND q.subject = v_subject;

    SELECT EXISTS (
      SELECT 1 FROM public.question_progress
      WHERE user_id = v_uid AND question_id = p_question_id
    ) INTO v_exists;

    IF v_answered >= 20 AND NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUOTA_EXCEEDED';
    END IF;
  END IF;

  INSERT INTO public.question_progress (user_id, question_id, is_correct)
  VALUES (v_uid, p_question_id, p_is_correct)
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET is_correct = EXCLUDED.is_correct, answered_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.record_question_progress(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_question_progress(TEXT, BOOLEAN) TO authenticated;

-- ───────────────────────────── الإجابة مع التحقق الخادمي ─────────────────────────────
-- العميل لا يملك الإجابة الصحيحة أبداً قبل الإجابة: يرسل خياره،
-- والخادم يتحقق منه مقابل question_answers ويسجل التقدم ويُعيد الشرح.
-- التجريبي: يُسمح فقط بأسئلة العينة (is_trial) وبحد 20 لكل مادة.
CREATE OR REPLACE FUNCTION public.answer_question(
  p_question_id TEXT,
  p_chosen_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_subject TEXT;
  v_trial BOOLEAN;
  v_premium BOOLEAN;
  v_answered INTEGER;
  v_correct TEXT;
  v_explanation TEXT;
  v_is_correct BOOLEAN;
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));

  SELECT subject, is_trial INTO v_subject, v_trial
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (subscription_status = 'premium' OR role = 'admin') INTO v_premium
  FROM public.profiles WHERE id = v_uid;

  -- حصر بالسلك المسجل: التجريبي والكامل لا يجيبان إلا عن أسئلة سلكهما.
  IF NOT public.is_admin(v_uid) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  IF NOT COALESCE(v_premium, FALSE) THEN
    IF NOT v_trial THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
    SELECT COUNT(*) INTO v_answered
    FROM public.question_progress qp
    JOIN public.questions q ON q.id = qp.question_id
    WHERE qp.user_id = v_uid AND q.subject = v_subject;

    SELECT EXISTS (
      SELECT 1 FROM public.question_progress
      WHERE user_id = v_uid AND question_id = p_question_id
    ) INTO v_exists;

    IF v_answered >= 20 AND NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUOTA_EXCEEDED';
    END IF;
  END IF;

  IF p_chosen_answer IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.questions
    WHERE id = p_question_id
      AND p_chosen_answer = ANY (ARRAY(SELECT jsonb_array_elements_text(options)))
  ) THEN
    RAISE EXCEPTION 'INVALID_ANSWER';
  END IF;

  v_is_correct := (p_chosen_answer IS NOT NULL AND p_chosen_answer = v_correct);

  INSERT INTO public.question_progress (user_id, question_id, is_correct)
  VALUES (v_uid, p_question_id, v_is_correct)
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET is_correct = EXCLUDED.is_correct, answered_at = NOW();

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_correct,
    'explanation', v_explanation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.answer_question(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.answer_question(TEXT, TEXT) TO authenticated;

-- ───────────────────────────── تتبع نقرات الترقية ومحاولات الرفع ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.upgrade_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS upgrade_clicks_user_idx ON public.upgrade_clicks (user_id);
ALTER TABLE public.upgrade_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upgrade_clicks insert all" ON public.upgrade_clicks;
CREATE POLICY "upgrade_clicks insert all" ON public.upgrade_clicks FOR INSERT TO authenticated, anon WITH CHECK (true);
DROP POLICY IF EXISTS "upgrade_clicks read admin" ON public.upgrade_clicks;
CREATE POLICY "upgrade_clicks read admin" ON public.upgrade_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') OR user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.receipt_upload_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'failed',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS receipt_upload_attempts_user_idx ON public.receipt_upload_attempts (user_id);
ALTER TABLE public.receipt_upload_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipt_upload_attempts insert all" ON public.receipt_upload_attempts;
CREATE POLICY "receipt_upload_attempts insert all" ON public.receipt_upload_attempts FOR INSERT TO authenticated, anon WITH CHECK (true);
DROP POLICY IF EXISTS "receipt_upload_attempts read admin" ON public.receipt_upload_attempts;
CREATE POLICY "receipt_upload_attempts read admin" ON public.receipt_upload_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.upgrade_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.upgrade_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upgrade_reminders all admin" ON public.upgrade_reminders;
CREATE POLICY "upgrade_reminders all admin" ON public.upgrade_reminders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


