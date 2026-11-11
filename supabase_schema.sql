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



-- ============================================================================
-- المرحلة 2.6 — الخطتان السعريةان ونطاق الاشتراك premium_scope (نسخة من supabase_pricing_tiers.sql)
-- ============================================================================
-- ============================================================================
-- الخطتان السعريةان — نطاق الاشتراك (premium_scope)
-- الاشتراك الشامل : 100 درهم — يفتح جميع المباريات الحالية (CRMEF + tarbawiyin)
--                    وكل مباراة ستنزل مستقبلاً.
-- اشتراك مباراة واحدة : 50 درهم — يفتح بنك أسئلة وملخصات مباراة واحدة فقط.
--
-- الآلية: profiles.premium_scope يشير إلى 'all' أو معرّف مباراة
-- (exam_id). عند الموافقة على طلب يعيّن المشرف النطاق حسب خطة الطلب،
-- وتُطوّق سياسات RLS على أسئلة/إجابات/ملخصات النطاق آلياً.
--
-- المطابقة الآمنة للتهيئة الجديدة مع قواعد البيانات القائمة (ADD IF NOT EXISTS،
-- CREATE OR REPLACE، DROP+CREATE POLICY)، بدون مساس بالمحتوى القديم:
-- المشتركون الحاليون يبقون بنطاقهم الشامل 'all' افتراضياً.
-- ============================================================================

-- ───────────────────────────── 1) أعمدة النطاق ─────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_scope TEXT NOT NULL DEFAULT 'all';

ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS premium_scope TEXT NOT NULL DEFAULT 'all';
-- المبلغ المسجل للتوثيق (بالدرهم) — الطلبات القديمة بقاءها قيمة الاشتراك الفردي إلزامياً.
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS amount_mad NUMERIC NOT NULL DEFAULT 50;

ALTER TABLE public.subscription_requests DROP CONSTRAINT IF EXISTS subscription_requests_plan_check;
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_plan_check
  CHECK (plan IN ('all', 'single')) NOT VALID;

-- النطاق إما 'all' أو معرّف مباراة (نص 1-60) — التحقق المرجعي للمباريات
-- يتم في نافذة الموافقة وجانب الخادم (لا يشترط FK لأن 'all' ليست مباراة).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_premium_scope_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_premium_scope_check
  CHECK (premium_scope = 'all' OR char_length(trim(premium_scope)) BETWEEN 1 AND 60) NOT VALID;

-- الطلبات القديمة (قبل الخطط): تُعامل اشتراكاً شاملاً بمبلغ 50 مسجلاً توثيقاً.
UPDATE public.subscription_requests
SET plan = 'all', premium_scope = 'all'
WHERE plan IS NULL OR plan NOT IN ('all', 'single');

-- ───────────────────────────── 2) أسئلة: طوق النطاق ─────────────────────────────
-- التجريبي: أول 20 لكل مادة في سلكه (كما قبل).
-- الكامل الشامل: أسئلة سلكه من كل المباريات.
-- كامل مباراة واحدة (scope مباراة): أسئلة سلكه في مباراته فقط.
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
          OR (p.subscription_status = 'premium'
              AND p.cycle = ANY(questions.cycles)
              AND (
                p.role = 'admin'
                OR (p.premium_scope = 'all')
                OR (p.premium_scope = questions.exam_id)
              ))
        )
    )
  );

-- ───────────────────────────── 3) الإجابات المحمية: طوق النطاق ─────────────────────────────
-- المشرف: الكل. المشترك الكامل الشامل: إجابات كل المباريات.
-- مشترك مباراة واحدة: إجابات أسئلة مباراته فقط.
DROP POLICY IF EXISTS "Answers read premium or admin" ON public.question_answers;
CREATE POLICY "Answers read premium or admin" ON public.question_answers
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.questions q ON q.id = question_answers.question_id
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR (
            p.subscription_status = 'premium'
            AND (p.premium_scope = 'all' OR p.premium_scope = q.exam_id)
          )
        )
    )
  );

-- ───────────────────────────── 4) الملخصات المحمية: طوق النطاق ─────────────────────────────
-- تضاف حانة النطاق فوق قاعدة "حصر السلك" الموجودة: الملخصات لسلك
-- المستخدم، وفي النطاق المدفوع لمباراته فقط (الشامل يرى الكل).
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- النطاق: الشامل/المشرف يرى كل مباريات، ومشترك مباراة واحدة يراها في مباراته.
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        -- حصر القراءة في سلك المستخدم (قيم cycle العربية في جدول summaries).
        AND (
          p.role = 'admin'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────────── 5) الإجابة الخادمية: طوق النطاق ─────────────────────────────
-- دالة answer_question: نفس منطق RLS — المشترك الكامل الشامل يجيب
-- عن أسئلة كل المباريات؛ مشترك مباراة واحدة عن أسئلة مباراته فقط.
-- المطابقة الصامتة للتقدم للتوثيق والمستخدمين المحفوظين (CREATE OR REPLACE).
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
  v_exam TEXT;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
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

  SELECT subject, is_trial, exam_id INTO v_subject, v_trial, v_exam
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- حصر بالسلك المسجل: التجريبي والكامل لا يجيبان إلا عن أسئلة سلكهما.
  IF NOT COALESCE(v_admin, FALSE) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
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

-- ───────────────────────────── 6) مرجع سريع للتحقق ─────────────────────────────
-- بعد التنفيذ:
--   SELECT id, subscription_status, premium_scope FROM public.profiles;
--   المشتركون الحاليون جميعاً premium_scope = 'all'.
-- الموافقة من الواجهة اليوم تعيّن النطاق آلياً حسب خطة الطلب.

-- ============================================================================
-- المرحلة 2.7 — مهلة تجريبية is_draft (نسخة من supabase_staging_and_editing.sql)
-- ============================================================================
-- ============================================================================
-- مهلة تجريبية قبل الاعتماد الرسمي (is_draft) + حاجز الخادم
-- الأسئلة والملخصات المستوردة في «وضع تجريبي» تبقى تُرى للمشرف فقط،
-- ولا يراها المشتركون/المجربون ولا تُحسب في المباراة حتى اعتمادها من الواجهة.
--
-- المراحل: is_draft = TRUE (تجريبي داخلي) ⟵⟶ FALSE (معتمد رسمياً).
-- الرفع الجماعي يأخذ الحالة من حقل exam.staging في exam_package.json
-- (الافتراضي عند غيابه: TRUE أي ظهور تجريبي حتى يقرر المشرف).
-- المطابقة الآمنة (IF NOT EXISTS / CREATE OR REPLACE) — لا مساس بالمعتمد القديم.
-- ============================================================================

-- ───────────────────────────── 1) العمودان ─────────────────────────────
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS questions_draft_idx ON public.questions (exam_id, is_draft);

-- ───────────────────────────── 2) قراءة الأسئلة: طوق التجريبي ─────────────────────────────
-- نفس قواعد المرحلة السابقة (تدريبي/مدفوع/نطاق) — مضافاً: غير المشرف
-- لا يقرأ سؤالاً تجريبياً (is_draft) مهما كانت حالته.
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            (is_trial AND p.cycle = ANY(questions.cycles))
            OR (p.subscription_status = 'premium'
                AND p.cycle = ANY(questions.cycles)
                AND (
                  p.role = 'admin'
                  OR (p.premium_scope = 'all')
                  OR (p.premium_scope = questions.exam_id)
                ))
          )
      )
    )
  );

-- ───────────────────────────── 3) قراءة الملخصات: طوق التجريبي ─────────────────────────────
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- ملخص تجريبي داخلي: للمشرف فقط.
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        -- النطاق: الشامل يرى الكل، ومشترك مباراة واحدة يراها في مباراته.
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        -- حصر القراءة في سلك المستخدم (قيم cycle العربية المعيارية).
        AND (
          p.role = 'admin'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────────── 4) الإجابة الخادمية: طوق التجريبي ─────────────────────────────
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
  v_exam TEXT;
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
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

  SELECT subject, is_trial, exam_id, is_draft INTO v_subject, v_trial, v_exam, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- حصر بالسلك المسجل: التجريبي والكامل لا يجيبان إلا عن أسئلة سلكهما.
  IF NOT COALESCE(v_admin, FALSE) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
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

-- ───────────────────────────── 5) تحقق سريع ─────────────────────────────
-- عدد الأسئلة التجريبية (المخفية عن الجمهور) لكل مباراة:
--   SELECT exam_id, count(*) FROM public.questions WHERE is_draft GROUP BY exam_id;
-- الاعتماد الرسمي يُجرى من واجهة إدارة الأسئلة (زر التبويب) أو:
--   UPDATE public.questions SET is_draft = FALSE WHERE exam_id = 'tarbawiyin';

-- ============================================================================
-- المرحلة 3 (تحديث) — import_exam_package مع الوضع التجريبي staging (نسخة من supabase_import_exam_rpc.sql)
-- ============================================================================
-- ============================================================================
-- المرحلة 3 — دالة رفع حزمة المباراة `import_exam_package(jsonb)`
-- العقد: SKILL_EXAM_CONTENT.md §1.1 — ملف exam_package.json واحد:
--   exam + subjects + questions + summaries.
-- السلوك: فحص صارم (قواعد §2/§3) ثم إدراج ذرّي — كل شيء ينجح أو لا شيء —
--   مباراة + مواد + أسئلة (بلا إجابات) + إجابات في question_answers + ملخصات،
--   وتظليل أول 20 سؤالاً/مادة بترتيب المعرّف (is_trial).
-- الصلاحية: المشرف فقط (SECURITY DEFINER + فحص is_admin داخل الدالة).
-- التكرار: نفس الـ slug = تحديث وإضافة على نفس المباراة (لا نسخ مكررة).
-- شروط سابقة: تنفيذ supabase_schema.sql (أو المخطط القائم في قاعدة الإنتاج).
-- ملاحظة: RLS قراءة الملخصات يقيّد بقيم cycle العربية المعيارية — للإطارات
--   الجديدة ذات أسماء cycle مخصصة، يبقى رؤيتها للمشرف/المشترك حتى تشديد RLS
--   المتزامن مع تعدد المباريات (موثق في §8).
-- ============================================================================

DROP FUNCTION IF EXISTS public.import_exam_package(jsonb);

CREATE OR REPLACE FUNCTION public.import_exam_package(p_package jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug         text;
  v_name         text;
  v_desc         text;
  v_summaries    jsonb;
  v_rec          record;
  v_sec          record;
  v_par          jsonb;
  v_cycle_ids    text := '|';   -- معرفات أسلاك الحزمة (معيارية فقط)
  v_cycle_names  text := '|';   -- أسمائها المعروضة (للملخصات)
  v_sub_keys     text := '|';   -- مفاتيح المواد المعلنة
  v_q_ids        text := '|';   -- معرفات الأسئلة (فريدية عامة)
  v_s_ids        text := '|';   -- معرفات الملخصات
  v_i            int;
  v_id           text;
  v_key          text;
  v_nm           text;
  v_opts         text[];
  v_correct      text;
  v_errs         text := '';
  v_err_count    int := 0;
  v_n_sub        int;
  v_n_q          int;
  v_n_a          int;
  v_n_s          int;
BEGIN
  -- صلاحية المشرف فقط (RLS لا يغطي SECURITY DEFINER — الفحص هنا إلزامي).
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'رفع حزم المباريات متاح للمشرف فقط.';
  END IF;

  IF p_package IS NULL OR jsonb_typeof(p_package) <> 'object' THEN
    RAISE EXCEPTION 'الحزمة غير صالحة: كائن JSON مطلوب.';
  END IF;
  IF p_package->>'package_version' IS DISTINCT FROM '1.0' THEN
    RAISE EXCEPTION 'package_version يجب أن يكون "1.0".';
  END IF;
  IF NOT (p_package->'exam' IS NOT NULL AND jsonb_typeof(p_package->'exam') = 'object') THEN
    RAISE EXCEPTION 'قسم exam مفقود أو غير صالح.';
  END IF;

  v_slug    := lower(trim(COALESCE(p_package->'exam'->>'slug', '')));
  v_name    := trim(COALESCE(p_package->'exam'->>'name', ''));
  v_desc    := COALESCE(p_package->'exam'->>'description', '');

  IF v_slug NOT SIMILAR TO '[a-z0-9_]{3,40}' THEN
    v_errs := v_errs || ' • exam.slug: 3-40 حرفاً من [a-z0-9_] فقط.';
    v_err_count := v_err_count + 1;
  END IF;
  IF v_name = '' OR char_length(v_name) > 160 THEN
    v_errs := v_errs || ' • exam.name: نص مطلوب بحد 160.';
    v_err_count := v_err_count + 1;
  END IF;

  -- الوضع التجريبي (اختياري): إجابات/ملخصات تبقى مخفية عن الجمهور حتى الاعتماد.
  IF p_package->'exam' ? 'staging'
     AND jsonb_typeof(p_package->'exam'->'staging') IS DISTINCT FROM 'boolean' THEN
    v_errs := v_errs || ' • exam.staging: يجب أن تكون قيمة منطقية true/false.';
    v_err_count := v_err_count + 1;
  END IF;

  IF NOT (p_package->'exam'->'cycles' IS NOT NULL
          AND jsonb_typeof(p_package->'exam'->'cycles') = 'array'
          AND jsonb_array_length(p_package->'exam'->'cycles') > 0) THEN
    v_errs := v_errs || ' • exam.cycles: مصفوفة واحدة على الأقل مطلوبة.';
    v_err_count := v_err_count + 1;
  ELSE
    FOR v_rec IN SELECT e.value, e.ord
                 FROM jsonb_array_elements(p_package->'exam'->'cycles') WITH ORDINALITY AS e(value, ord)
    LOOP
      v_id := lower(trim(COALESCE(v_rec.value->>'id', '')));
      v_nm := trim(COALESCE(v_rec.value->>'name', ''));
      IF v_id NOT IN ('primary', 'secondary_prep', 'secondary_qual') THEN
        v_errs := v_errs || ' • cycles[' || (v_rec.ord - 1) || '].id خارج المعيار (primary/secondary_prep/secondary_qual).';
        v_err_count := v_err_count + 1;
      ELSIF v_nm = '' OR char_length(v_nm) > 60 THEN
        v_errs := v_errs || ' • cycles[' || (v_rec.ord - 1) || '].name: نص مطلوب بحد 60.';
        v_err_count := v_err_count + 1;
      ELSE
        v_cycle_ids   := v_cycle_ids || v_id || '|';
        v_cycle_names := v_cycle_names || v_nm || '|';
      END IF;
    END LOOP;
  END IF;

  -- المواد المعلنة ──────────────────────────────────────────────
  IF NOT (p_package->'subjects' IS NOT NULL
          AND jsonb_typeof(p_package->'subjects') = 'array'
          AND jsonb_array_length(p_package->'subjects') > 0) THEN
    v_errs := v_errs || ' • subjects: مصفوفة بعنصر واحد على الأقل مطلوبة.';
    v_err_count := v_err_count + 1;
  ELSE
    FOR v_rec IN SELECT e.value, e.ord
                 FROM jsonb_array_elements(p_package->'subjects') WITH ORDINALITY AS e(value, ord)
    LOOP
      v_key := lower(trim(COALESCE(v_rec.value->>'key', '')));
      IF v_key NOT SIMILAR TO '[a-z0-9_]{3,50}' THEN
        v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || '].key: 3-50 من [a-z0-9_].';
        v_err_count := v_err_count + 1;
      ELSIF position('|' || v_key || '|' IN v_sub_keys) > 0 THEN
        v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || ']: المفتاح مكرر (' || v_key || ').';
        v_err_count := v_err_count + 1;
      ELSE
        v_sub_keys := v_sub_keys || v_key || '|';
      END IF;

      IF COALESCE(v_rec.value->>'name', '') = '' OR char_length(v_rec.value->>'name') > 160 THEN
        v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || '].name: نص مطلوب بحد 160.';
        v_err_count := v_err_count + 1;
      END IF;

      IF NOT (v_rec.value->'cycles' IS NOT NULL AND jsonb_typeof(v_rec.value->'cycles') = 'array') THEN
        v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || '].cycles: مصفوفة مطلوبة.';
        v_err_count := v_err_count + 1;
      ELSE
        FOR v_id IN SELECT jsonb_array_elements_text(v_rec.value->'cycles') LOOP
          IF position('|' || v_id || '|' IN v_cycle_ids) = 0 THEN
            v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || ']: cycle غير معلن (' || v_id || ').';
            v_err_count := v_err_count + 1;
          END IF;
        END LOOP;
      END IF;

      IF NOT (v_rec.value->'weight' IS NOT NULL AND jsonb_typeof(v_rec.value->'weight') = 'number'
              AND (v_rec.value->'weight')::numeric > 0 AND (v_rec.value->'weight')::numeric <= 9999) THEN
        v_errs := v_errs || ' • subjects[' || (v_rec.ord - 1) || '].weight: عدد موجب ≤9999.';
        v_err_count := v_err_count + 1;
      END IF;
    END LOOP;
  END IF;

  -- الأسئلة (قواعد §2) ─────────────────────────────────────────
  IF NOT (p_package->'questions' IS NOT NULL
          AND jsonb_typeof(p_package->'questions') = 'array'
          AND jsonb_array_length(p_package->'questions') > 0) THEN
    v_errs := v_errs || ' • questions: مصفوفة بسؤال واحد على الأقل مطلوبة.';
    v_err_count := v_err_count + 1;
  ELSE
    FOR v_rec IN SELECT e.value, e.ord
                 FROM jsonb_array_elements(p_package->'questions') WITH ORDINALITY AS e(value, ord)
    LOOP
      v_i := v_rec.ord - 1;
      v_id := lower(trim(COALESCE(v_rec.value->>'id', '')));

      IF v_id NOT SIMILAR TO '[a-z0-9_]{2,30}[0-9]{3}' OR char_length(v_id) > 64 THEN
        v_errs := v_errs || ' • questions[' || v_i || '].id: بادئة + 3 أرقام مكمّلة (ـ' || COALESCE(v_id, 'فارغ') || ').';
        v_err_count := v_err_count + 1;
      ELSIF position('|' || v_id || '|' IN v_q_ids) > 0 THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: معرف مكرر (' || v_id || ').';
        v_err_count := v_err_count + 1;
      ELSE
        v_q_ids := v_q_ids || v_id || '|';
      END IF;

      IF v_rec.value ? 'is_trial' THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: حقل is_trial محظور (يُعيَّن تلقائياً).';
        v_err_count := v_err_count + 1;
      END IF;

      IF position('|' || COALESCE(lower(trim(v_rec.value->>'subject')), 'x') || '|' IN v_sub_keys) = 0 THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: subject غير معلن (' || COALESCE(v_rec.value->>'subject', '؟') || ').';
        v_err_count := v_err_count + 1;
      END IF;

      IF COALESCE(v_rec.value->>'topic', '') = '' THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: topic فارغ.';
        v_err_count := v_err_count + 1;
      END IF;
      IF COALESCE(v_rec.value->>'question', '') = '' THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: نص السؤال فارغ.';
        v_err_count := v_err_count + 1;
      END IF;

      IF NOT (v_rec.value->'options' IS NOT NULL AND jsonb_typeof(v_rec.value->'options') = 'array'
              AND jsonb_array_length(v_rec.value->'options') = 4) THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: options يجب أن تكون 4 بالضبط.';
        v_err_count := v_err_count + 1;
      ELSE
        SELECT array_agg(t) INTO v_opts
        FROM jsonb_array_elements_text(v_rec.value->'options') AS t(t);
        IF v_opts IS NULL
           OR (SELECT count(*) FROM unnest(v_opts) o WHERE COALESCE(o, '') = '') > 0
           OR (SELECT count(DISTINCT o) FROM unnest(v_opts) o) <> 4 THEN
          v_errs := v_errs || ' • questions[' || v_i || ']: خيارات فارغة أو مكررة (4 مختلفة بالضبط).';
          v_err_count := v_err_count + 1;
        END IF;
        v_correct := v_rec.value->>'correct_answer';
        IF v_correct IS NULL OR v_correct = '' OR NOT (v_correct = ANY(v_opts)) THEN
          v_errs := v_errs || ' • questions[' || v_i || ']: correct_answer بتطابق حرفي مع أحد الخيارات مطلوب.';
          v_err_count := v_err_count + 1;
        END IF;
      END IF;

      IF COALESCE(v_rec.value->>'explanation', '') = '' THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: explanation مطلوب (تعليل لا يكرر الخيار).';
        v_err_count := v_err_count + 1;
      END IF;

      IF NOT (v_rec.value->'cycles' IS NOT NULL AND jsonb_typeof(v_rec.value->'cycles') = 'array'
              AND jsonb_array_length(v_rec.value->'cycles') > 0) THEN
        v_errs := v_errs || ' • questions[' || v_i || ']: cycles مصفوفة غير فارغة.';
        v_err_count := v_err_count + 1;
      ELSE
        FOR v_key IN SELECT jsonb_array_elements_text(v_rec.value->'cycles') LOOP
          IF position('|' || v_key || '|' IN v_cycle_ids) = 0 THEN
            v_errs := v_errs || ' • questions[' || v_i || ']: cycle غير معلن (' || v_key || ').';
            v_err_count := v_err_count + 1;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- الملخصات (قواعد §3 — اختيارية) ────────────────────────────
  v_summaries := COALESCE(p_package->'summaries', '[]'::jsonb);
  IF NOT (jsonb_typeof(v_summaries) = 'array') THEN
    v_errs := v_errs || ' • summaries: يجب أن تكون مصفوفة.';
    v_err_count := v_err_count + 1;
  ELSE
    FOR v_rec IN SELECT e.value, e.ord
                 FROM jsonb_array_elements(v_summaries) WITH ORDINALITY AS e(value, ord)
    LOOP
      v_i := v_rec.ord - 1;
      v_id := lower(trim(COALESCE(v_rec.value->>'id', '')));

      IF v_id NOT SIMILAR TO '[a-z0-9_]{6,64}' THEN
        v_errs := v_errs || ' • summaries[' || v_i || '].id صغير ببادئة sum_.';
        v_err_count := v_err_count + 1;
      ELSIF position('|' || v_id || '|' IN v_s_ids) > 0 THEN
        v_errs := v_errs || ' • summaries[' || v_i || ']: معرف مكرر.';
        v_err_count := v_err_count + 1;
      ELSE
        v_s_ids := v_s_ids || v_id || '|';
      END IF;

      IF COALESCE(v_rec.value->>'title', '') = '' OR COALESCE(v_rec.value->>'category', '') = '' THEN
        v_errs := v_errs || ' • summaries[' || v_i || ']: title/category مطلوبة.';
        v_err_count := v_err_count + 1;
      END IF;

      IF position('|' || COALESCE(v_rec.value->>'cycle', '') || '|' IN v_cycle_names) = 0 THEN
        v_errs := v_errs || ' • summaries[' || v_i || ']: cycle غير معلن باسمه المعروض.';
        v_err_count := v_err_count + 1;
      END IF;

      IF NOT (v_rec.value->'sections' IS NOT NULL AND jsonb_typeof(v_rec.value->'sections') = 'array'
              AND jsonb_array_length(v_rec.value->'sections') > 0) THEN
        v_errs := v_errs || ' • summaries[' || v_i || ']: sections فارغة.';
        v_err_count := v_err_count + 1;
      ELSE
        FOR v_sec IN SELECT s.value, s.ord FROM jsonb_array_elements(v_rec.value->'sections') WITH ORDINALITY AS s(value, ord) LOOP
          IF COALESCE(v_sec.value->>'heading', '') = '' THEN
            v_errs := v_errs || ' • summaries[' || v_i || '].sections[' || (v_sec.ord - 1) || '].heading فارغ.';
            v_err_count := v_err_count + 1;
          END IF;
          IF NOT (v_sec.value->'paragraphs' IS NOT NULL AND jsonb_typeof(v_sec.value->'paragraphs') = 'array'
                  AND jsonb_array_length(v_sec.value->'paragraphs') > 0) THEN
            v_errs := v_errs || ' • summaries[' || v_i || '].sections[' || (v_sec.ord - 1) || '].paragraphs فارغة.';
            v_err_count := v_err_count + 1;
          ELSE
            FOR v_par IN SELECT p.value FROM jsonb_array_elements(v_sec.value->'paragraphs') p LOOP
              IF jsonb_typeof(v_par.value) <> 'string' OR COALESCE(v_par.value #>> '{}', '') = '' THEN
                v_errs := v_errs || ' • summaries[' || v_i || ']: فقرة فارغة (نص مطلوب: نص أو "---" فاصل).';
                v_err_count := v_err_count + 1;
              END IF;
            END LOOP;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  IF v_err_count > 0 THEN
    RAISE EXCEPTION 'الحزمة مرفوضة: % خطأ قاطع.%', v_err_count, left(v_errs, 2500);
  END IF;

  -- الكتابة الذرّية (كل شيء أو لا شيء) ────────────────────────

  -- 1) المباراة (الرفع يُحدّث ولا يكرر — نفس slug).
  INSERT INTO public.exams (id, slug, name, description, icon, color, is_active, sort_order)
  VALUES (v_slug, v_slug, v_name, v_desc,
          COALESCE(p_package->'exam'->>'icon', 'book'),
          COALESCE(p_package->'exam'->>'color', 'purple'),
          TRUE,
          COALESCE((p_package->'exam'->>'sort_order')::int, 50))
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    icon = EXCLUDED.icon, color = EXCLUDED.color,
    is_active = TRUE, sort_order = EXCLUDED.sort_order;

  -- 2) المواد.
  INSERT INTO public.subjects (exam_id, key, name, cycles, weight)
  SELECT v_slug, s.key, s.name, s.cycles, s.weight
  FROM (
    SELECT lower(s.value->>'key') AS key,
           trim(s.value->>'name') AS name,
           ARRAY(SELECT jsonb_array_elements_text(s.value->'cycles')) AS cycles,
           (s.value->'weight')::int AS weight
    FROM jsonb_array_elements(p_package->'subjects') AS s(value)
  ) s
  ON CONFLICT (exam_id, key) DO UPDATE SET
    name = EXCLUDED.name, cycles = EXCLUDED.cycles, weight = EXCLUDED.weight;

  -- 3) الأسئلة (نصوص + خيارات فقط — الإجابات في question_answers).
  -- الوضع التجريبي: staging=true (أو غيابه مع حزمة/مباراة جديدة) هو true (يُرى للمشرف
  -- فقط حتى اعتماده)؛ staging=false يعتمد فوراً؛ غياب staging مع مباراة قائمة لا يغيّر حالتها.
  INSERT INTO public.questions (id, cycles, subject, topic, question, options, is_trial, is_draft, exam_id)
  SELECT q.id, q.cycles, q.subject, q.topic, q.question, q.options, FALSE,
         COALESCE((p_package->'exam'->>'staging')::boolean, TRUE), v_slug
  FROM (
    SELECT qq.id,
           ARRAY(SELECT jsonb_array_elements_text(qq.cycles)) AS cycles,
           lower(trim(qq.subject)) AS subject,
           qq.topic, qq.question, qq.options
    FROM jsonb_to_recordset(p_package->'questions')
         AS qq(id text, cycles jsonb, subject text, topic text, question text, options jsonb)
  ) q
  ON CONFLICT (id) DO UPDATE SET
    cycles = EXCLUDED.cycles, subject = EXCLUDED.subject, topic = EXCLUDED.topic,
    question = EXCLUDED.question, options = EXCLUDED.options, exam_id = EXCLUDED.exam_id,
    is_draft = CASE WHEN p_package->'exam' ? 'staging'
               THEN COALESCE((p_package->'exam'->>'staging')::boolean, TRUE)
               ELSE public.questions.is_draft END;

  -- 4) تظليل العينة المجانية: أول 20 سؤالاً/مادة بترتيب id تصاعدياً.
  UPDATE public.questions q SET is_trial = (x.rn <= 20)
  FROM (
    SELECT id, row_number() OVER (PARTITION BY subject ORDER BY id) AS rn
    FROM public.questions WHERE exam_id = v_slug
  ) x
  WHERE x.id = q.id;

  -- 5) الإجابات المفصولة (جدول محمي).
  INSERT INTO public.question_answers (question_id, correct_answer, explanation)
  SELECT a.id, a.correct_answer, COALESCE(a.explanation, '')
  FROM jsonb_to_recordset(p_package->'questions')
       AS a(id text, correct_answer text, explanation text)
  ON CONFLICT (question_id) DO UPDATE SET
    correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation;

  -- 6) الملخصات (إن وُجدت) — بنفس قاعدة الوضع التجريبي للأسئلة.
  IF jsonb_array_length(v_summaries) > 0 THEN
    INSERT INTO public.summaries (id, title, category, cycle, read_time, sections, is_draft, exam_id)
    SELECT s.id, s.title, s.category, s.cycle, COALESCE(s."readTime", ''), s.sections,
           COALESCE((p_package->'exam'->>'staging')::boolean, TRUE), v_slug
    FROM jsonb_to_recordset(v_summaries)
         AS s(id text, title text, category text, cycle text, "readTime" text, sections jsonb)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title, category = EXCLUDED.category, cycle = EXCLUDED.cycle,
      read_time = EXCLUDED.read_time, sections = EXCLUDED.sections, exam_id = EXCLUDED.exam_id,
      is_draft = CASE WHEN p_package->'exam' ? 'staging'
                 THEN COALESCE((p_package->'exam'->>'staging')::boolean, TRUE)
                 ELSE public.summaries.is_draft END;
  END IF;

  SELECT count(*) INTO v_n_sub FROM public.subjects WHERE exam_id = v_slug;
  SELECT count(*) INTO v_n_q FROM public.questions WHERE exam_id = v_slug;
  SELECT count(*) INTO v_n_a FROM public.question_answers qa
    JOIN public.questions q ON q.id = qa.question_id WHERE q.exam_id = v_slug;
  SELECT count(*) INTO v_n_s FROM public.summaries WHERE exam_id = v_slug;

  RETURN jsonb_build_object(
    'exam_id', v_slug, 'name', v_name,
    'subjects', v_n_sub, 'questions', v_n_q, 'trial',
    (SELECT count(*) FROM public.questions WHERE exam_id = v_slug AND is_trial),
    'draft',
    (SELECT count(*) FROM public.questions WHERE exam_id = v_slug AND is_draft),
    'answers', v_n_a, 'summaries', v_n_s);
END;
$$;

-- الصلاحية: للمصادَقين فقط، مع فحص is_admin داخل الدالة (نمط الدوال القائمة).
REVOKE ALL ON FUNCTION public.import_exam_package(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_exam_package(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.import_exam_package(jsonb) TO authenticated;

-- ============================================================================
-- المرحلة 2.5 — ربط ملف المستخدم بالمباراة المختارة profiles.exam_id (نسخة من supabase_set_profile_exam.sql)
-- ============================================================================
-- ============================================================================
-- المرحلة 2.5 — ربط ملف المستخدم بالمباراة المختارة profiles.exam_id
-- المنطلق: تعدد المباريات (شاشات إدارة المستخدمين والاشتراكات تفلتر حسب
-- profiles.exam_id). التقاط المباراة: تلقائياً عند اختيار المستخدم لبطاقة
-- مباراة (استدعاء صامت من الواجهة)، مع بقاء السلك cycle كما هو.
-- الصلاحية: مستخدم مصادَق يحدّث ملفه هو فقط (لا يتدخل في غيره).
-- التنفيذ متكرر آمن (CREATE OR REPLACE).
-- ============================================================================

DROP FUNCTION IF EXISTS public.set_profile_exam(text);

CREATE OR REPLACE FUNCTION public.set_profile_exam(p_exam_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'مصادقة مطلوبة.';
  END IF;
  IF p_exam_id IS NULL OR trim(p_exam_id) = '' THEN
    RAISE EXCEPTION 'معرف المباراة مطلوب.';
  END IF;

  -- المباراة يجب أن تكون معرفة ونشطة (ذاكرة الحماية من إشارات مزيّفة).
  SELECT id INTO v_ok FROM public.exams WHERE id = lower(trim(p_exam_id)) AND is_active;
  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'مباراة غير معروفة أو غير نشطة.';
  END IF;

  UPDATE public.profiles SET exam_id = v_ok WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_exam(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profile_exam(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_profile_exam(text) TO authenticated;

-- ============================================================================
-- المرحلة 2.8 — مباراة أطر المختصين على المسالك الرسمية (نسخة من supabase_tarbawiyin_tracks.sql)
-- ============================================================================
-- ============================================================================
-- المرحلة 2.8 — مباراة أطر المختصين: إعادة الهيكلة على المسالك الرسمية
-- (من أسلاك تعليمية إلى مسالك: تكوين المختصين التربويين / الاقتصاد والتدبير /
--  المختصين الاجتماعيين) + تعديل السياسات لتلائم المباريات غير التعليمية.
--
-- ما يفعله هذا الملف:
--   1) تحديث بطاقة المباراة: الاسم الرسمي «مباراة أطر المختصين» + وصف يذكر
--      المسالك الثلاثة (مباراة وليس مسابقة).
--   2) إعادة تسمية المواد الست بالعناوين الرسمية من الإعلان + ربط كل مادة
--      بمسلكها الوحيد (cycles) + معاملات متساوية (الشفوي بلا معاملات رسمية).
--   3) إعادة تجميع كل أسئلة المباراة على مسلك مادتها.
--   4) تعديل RLS: المباريات غير التعليمية (غير crmef) لا تُقفَل بسلك التسجيل —
--      المسالك الثلاثة متاحة لكل مترشح (القراءة والإجابة)، ويبقى قيد السلك
--      لمباراة crmef كما هو. وقراءة الملخصات للمباريات الأخرى بلا قيد أسماء
--      الأسلاك العربية (المسالك أسماؤها مختلفة).
-- التنفيذ متكرر آمن (UPDATE/CREATE OR REPLACE/DROP IF EXISTS).
-- شرط سابق: supabase_staging_and_editing.sql (أعمدة is_draft والسياسات الحديثة).
-- ملاحظة: هذا الملف مستقل بذاته — يضيف أعمدة is_draft/premium_scope/exam_id إن لم تكن
--   موجودة، فلا يهمّ أي ملف نُفّذ أولاً (ALTER TABLE ... IF NOT EXISTS آمنة ومكرّرة).
-- ⚠️ ترتيب التنفيذ مهم: «آخر تعريف يفوز» في Postgres — لذا نفّذ هذا الملف **بعد**
--   supabase_staging_and_editing.sql (و supabase_import_exam_rpc.sql المحدّثة)، وإلا
--   أعادت الجولة السابقة سياسات المرحلة 2.7 (بقيد سلك التسجيل لكل المباريات).
-- ============================================================================

-- ───────────────────────── 0) تهيئة الأعمدة (آمنة ومكرّرة) ─────────────────────────
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_scope TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
CREATE INDEX IF NOT EXISTS questions_draft_idx ON public.questions (exam_id, is_draft);

-- ───────────────────────── 1) بطاقة المباراة ─────────────────────────
UPDATE public.exams SET
  name        = 'مباراة أطر المختصين',
  short_name  = 'الأطر المختصين',
  description = 'مباراة ولوج أطر المختصين بقطاع التربية الوطنية — ثلاثة مسالك: تكوين المختصين التربويين، تكوين أطر مختصي الاقتصاد والتدبير، تكوين أطر المختصين الاجتماعيين. في كل مسلك موضوعان، والاختبار الشفوي مقابلة حول الاختصاصات والمهام المرتبطة بالوظيفة المطلوب شغلها.',
  icon        = 'book',
  color       = 'purple',
  is_active   = TRUE,
  sort_order  = 20
WHERE id = 'tarbawiyin';

-- ───────────────────────── 2) المواد الست بالأسماء الرسمية ومسلكها ─────────────────────────
UPDATE public.subjects SET name = 'التدبير المالي والمحاسباتي لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_mali_mohasabati';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين التربويين)',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_tarbawi';

UPDATE public.subjects SET name = 'التدبير الإداري والتدبيري لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_idari_tarbawi';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك الاقتصاد والتدبير — مختبرات مدرسية / حراسة تربوية وتوثيق)',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_iqtisad';

UPDATE public.subjects SET name = 'تحليل ظاهرة نفسية واجتماعية',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tahlil_nafsia_ijtimaiya';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين الاجتماعيين)',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_ijtimai';

-- ───────────────────────── 3) إعادة تجميع الأسئلة على مسلك مادتها ─────────────────────────
-- كل سؤال يأخذ cycles مادته (مسلك وحيد) — من جدول subjects المرجع أعلاه.
UPDATE public.questions q
SET cycles = s.cycles
FROM public.subjects s
WHERE s.exam_id = 'tarbawiyin'
  AND s.key = q.subject
  AND q.exam_id = 'tarbawiyin'
  AND q.cycles IS DISTINCT FROM s.cycles;

-- ───────────────────────── 4) قراءة الأسئلة: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
-- crmef: يبقى قيد سلك التسجيل كما هو (تجريبي/مدفوع ضمن سلك المستخدم).
-- غير crmef (مسالك): المسالك الثلاثة متاحة لكل مترشح — يكفي الحالة (تجريبي/مدفوع) والنطاق.
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            -- مباراة crmef: قيد السلك الأصلي
            (questions.exam_id = 'crmef' AND (
              (questions.is_trial AND p.cycle = ANY(questions.cycles))
              OR (p.subscription_status = 'premium'
                  AND p.cycle = ANY(questions.cycles)
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
            -- مباريات المسالك: بلا قيد سلك — النطاق فقط
            OR (COALESCE(questions.exam_id, 'crmef') <> 'crmef' AND (
              questions.is_trial
              OR (p.subscription_status = 'premium'
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
          )
      )
    )
  );

-- ───────────────────────── 5) قراءة الملخصات: المباريات غير التعليمية بلا قيد أسماء الأسلاك ─────────────────────────
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- ملخص تجريبي داخلي: للمشرف فقط.
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        -- النطاق: الشامل يرى الكل، ومشترك مباراة واحدة يراها في مباراته.
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        -- حصر القراءة في سلك المستخدم (مباراة crmef فقط — قيم cycle العربية المعيارية).
        -- المباريات الأخرى (المسالك) بلا قيد أسماء — أسماؤها ليست من نظام الأسلاك.
        AND (
          p.role = 'admin'
          OR COALESCE(summaries.exam_id, 'crmef') <> 'crmef'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────── 6) الإجابة الخادمية: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
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
  v_exam TEXT;
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
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

  SELECT subject, is_trial, exam_id, is_draft INTO v_subject, v_trial, v_exam, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- حصر بالسلك المسجل: مباراة crmef فقط — المباريات ذات المسالك مفتوحة لكل المترشحين.
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_exam, 'crmef') = 'crmef' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
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

-- ───────────────────────── 7) تحقق سريع بعد التنفيذ ─────────────────────────
-- المواد ومسالكها وأعداد أسئلتها:
--   SELECT key, name, cycles, (SELECT count(*) FROM public.questions q WHERE q.exam_id='tarbawiyin' AND q.subject=s.key) AS questions
--     FROM public.subjects s WHERE exam_id='tarbawiyin' ORDER BY key;
-- كل الأسئلة على مسلك مادتها (يجب أن ترجع 0 صفوف):
--   SELECT q.id FROM public.questions q
--     JOIN public.subjects s ON s.exam_id=q.exam_id AND s.key=q.subject
--     WHERE q.exam_id='tarbawiyin' AND q.cycles IS DISTINCT FROM s.cycles;

-- ============================================================================
-- ============================================================================
-- المرحلة 2.8 — مباراة أطر المختصين: إعادة الهيكلة على المسالك الرسمية
-- (من أسلاك تعليمية إلى مسالك: تكوين المختصين التربويين / الاقتصاد والتدبير /
--  المختصين الاجتماعيين) + تعديل السياسات لتلائم المباريات غير التعليمية.
--
-- ما يفعله هذا الملف:
--   1) تحديث بطاقة المباراة: الاسم الرسمي «مباراة أطر المختصين» + وصف يذكر
--      المسالك الثلاثة (مباراة وليس مسابقة).
--   2) إعادة تسمية المواد الست بالعناوين الرسمية من الإعلان + ربط كل مادة
--      بمسلكها الوحيد (cycles) + معاملات متساوية (الشفوي بلا معاملات رسمية).
--   3) إعادة تجميع كل أسئلة المباراة على مسلك مادتها.
--   4) تعديل RLS: المباريات غير التعليمية (غير crmef) لا تُقفَل بسلك التسجيل —
--      المسالك الثلاثة متاحة لكل مترشح (القراءة والإجابة)، ويبقى قيد السلك
--      لمباراة crmef كما هو. وقراءة الملخصات للمباريات الأخرى بلا قيد أسماء
--      الأسلاك العربية (المسالك أسماؤها مختلفة).
-- التنفيذ متكرر آمن (UPDATE/CREATE OR REPLACE/DROP IF EXISTS).
-- شرط سابق: supabase_staging_and_editing.sql (أعمدة is_draft والسياسات الحديثة).
-- ملاحظة: هذا الملف مستقل بذاته — يضيف أعمدة is_draft/premium_scope إن لم تكن موجودة،
--   فلا يهمّ أي ملف نُفّذ أولاً (ALTER TABLE ... IF NOT EXISTS آمنة ومكرّرة).
-- ============================================================================

-- ───────────────────────── 0) تهيئة الأعمدة (آمنة ومكرّرة) ─────────────────────────
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_scope TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_id TEXT NOT NULL DEFAULT 'crmef';
CREATE INDEX IF NOT EXISTS questions_draft_idx ON public.questions (exam_id, is_draft);

-- ───────────────────────── 1) بطاقة المباراة ─────────────────────────
UPDATE public.exams SET
  name        = 'مباراة أطر المختصين',
  short_name  = 'الأطر المختصين',
  description = 'مباراة ولوج أطر المختصين بقطاع التربية الوطنية — ثلاثة مسالك: تكوين المختصين التربويين، تكوين أطر مختصي الاقتصاد والتدبير، تكوين أطر المختصين الاجتماعيين. في كل مسلك موضوعان، والاختبار الشفوي مقابلة حول الاختصاصات والمهام المرتبطة بالوظيفة المطلوب شغلها.',
  icon        = 'book',
  color       = 'purple',
  is_active   = TRUE,
  sort_order  = 20
WHERE id = 'tarbawiyin';

-- ───────────────────────── 2) المواد الست بالأسماء الرسمية ومسلكها ─────────────────────────
UPDATE public.subjects SET name = 'التدبير المالي والمحاسباتي لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_mali_mohasabati';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين التربويين)',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_tarbawi';

UPDATE public.subjects SET name = 'التدبير الإداري والتدبيري لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_idari_tarbawi';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك الاقتصاد والتدبير — مختبرات مدرسية / حراسة تربوية وتوثيق)',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_iqtisad';

UPDATE public.subjects SET name = 'تحليل ظاهرة نفسية واجتماعية',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tahlil_nafsia_ijtimaiya';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين الاجتماعيين)',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_ijtimai';

-- ───────────────────────── 3) إعادة تجميع الأسئلة على مسلك مادتها ─────────────────────────
-- كل سؤال يأخذ cycles مادته (مسلك وحيد) — من جدول subjects المرجع أعلاه.
UPDATE public.questions q
SET cycles = s.cycles
FROM public.subjects s
WHERE s.exam_id = 'tarbawiyin'
  AND s.key = q.subject
  AND q.exam_id = 'tarbawiyin'
  AND q.cycles IS DISTINCT FROM s.cycles;

-- ───────────────────────── 4) قراءة الأسئلة: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
-- crmef: يبقى قيد سلك التسجيل كما هو (تجريبي/مدفوع ضمن سلك المستخدم).
-- غير crmef (مسالك): المسالك الثلاثة متاحة لكل مترشح — يكفي الحالة (تجريبي/مدفوع) والنطاق.
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            -- مباراة crmef: قيد السلك الأصلي
            (questions.exam_id = 'crmef' AND (
              (questions.is_trial AND p.cycle = ANY(questions.cycles))
              OR (p.subscription_status = 'premium'
                  AND p.cycle = ANY(questions.cycles)
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
            -- مباريات المسالك: بلا قيد سلك — النطاق فقط
            OR (COALESCE(questions.exam_id, 'crmef') <> 'crmef' AND (
              questions.is_trial
              OR (p.subscription_status = 'premium'
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
          )
      )
    )
  );

-- ───────────────────────── 5) قراءة الملخصات: المباريات غير التعليمية بلا قيد أسماء الأسلاك ─────────────────────────
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- ملخص تجريبي داخلي: للمشرف فقط.
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        -- النطاق: الشامل يرى الكل، ومشترك مباراة واحدة يراها في مباراته.
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        -- حصر القراءة في سلك المستخدم (مباراة crmef فقط — قيم cycle العربية المعيارية).
        -- المباريات الأخرى (المسالك) بلا قيد أسماء — أسماؤها ليست من نظام الأسلاك.
        AND (
          p.role = 'admin'
          OR COALESCE(summaries.exam_id, 'crmef') <> 'crmef'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────── 6) الإجابة الخادمية: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
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
  v_exam TEXT;
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
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

  SELECT subject, is_trial, exam_id, is_draft INTO v_subject, v_trial, v_exam, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- حصر بالسلك المسجل: مباراة crmef فقط — المباريات ذات المسالك مفتوحة لكل المترشحين.
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_exam, 'crmef') = 'crmef' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
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

-- ───────────────────────── 7) تحقق سريع بعد التنفيذ ─────────────────────────
-- المواد ومسالكها وأعداد أسئلتها:
--   SELECT key, name, cycles, (SELECT count(*) FROM public.questions q WHERE q.exam_id='tarbawiyin' AND q.subject=s.key) AS questions
--     FROM public.subjects s WHERE exam_id='tarbawiyin' ORDER BY key;
-- كل الأسئلة على مسلك مادتها (يجب أن ترجع 0 صفوف):
--   SELECT q.id FROM public.questions q
--     JOIN public.subjects s ON s.exam_id=q.exam_id AND s.key=q.subject
--     WHERE q.exam_id='tarbawiyin' AND q.cycles IS DISTINCT FROM s.cycles;

-- ============================================================================
-- ============================================================================
-- المرحلة 2.8 — مباراة أطر المختصين: إعادة الهيكلة على المسالك الرسمية
-- (من أسلاك تعليمية إلى مسالك: تكوين المختصين التربويين / الاقتصاد والتدبير /
--  المختصين الاجتماعيين) + تعديل السياسات لتلائم المباريات غير التعليمية.
--
-- ما يفعله هذا الملف:
--   1) تحديث بطاقة المباراة: الاسم الرسمي «مباراة أطر المختصين» + وصف يذكر
--      المسالك الثلاثة (مباراة وليس مسابقة).
--   2) إعادة تسمية المواد الست بالعناوين الرسمية من الإعلان + ربط كل مادة
--      بمسلكها الوحيد (cycles) + معاملات متساوية (الشفوي بلا معاملات رسمية).
--   3) إعادة تجميع كل أسئلة المباراة على مسلك مادتها.
--   4) تعديل RLS: المباريات غير التعليمية (غير crmef) لا تُقفَل بسلك التسجيل —
--      المسالك الثلاثة متاحة لكل مترشح (القراءة والإجابة)، ويبقى قيد السلك
--      لمباراة crmef كما هو. وقراءة الملخصات للمباريات الأخرى بلا قيد أسماء
--      الأسلاك العربية (المسالك أسماؤها مختلفة).
-- التنفيذ متكرر آمن (UPDATE/CREATE OR REPLACE/DROP IF EXISTS).
-- شرط سابق: supabase_staging_and_editing.sql (أعمدة is_draft والسياسات الحديثة).
-- ============================================================================

-- ───────────────────────── 1) بطاقة المباراة ─────────────────────────
UPDATE public.exams SET
  name        = 'مباراة أطر المختصين',
  short_name  = 'الأطر المختصين',
  description = 'مباراة ولوج أطر المختصين بقطاع التربية الوطنية — ثلاثة مسالك: تكوين المختصين التربويين، تكوين أطر مختصي الاقتصاد والتدبير، تكوين أطر المختصين الاجتماعيين. في كل مسلك موضوعان، والاختبار الشفوي مقابلة حول الاختصاصات والمهام المرتبطة بالوظيفة المطلوب شغلها.',
  icon        = 'book',
  color       = 'purple',
  is_active   = TRUE,
  sort_order  = 20
WHERE id = 'tarbawiyin';

-- ───────────────────────── 2) المواد الست بالأسماء الرسمية ومسلكها ─────────────────────────
UPDATE public.subjects SET name = 'التدبير المالي والمحاسباتي لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_mali_mohasabati';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين التربويين)',
  cycles = ARRAY['primary']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_tarbawi';

UPDATE public.subjects SET name = 'التدبير الإداري والتدبيري لمؤسسات التربية والتعليم العمومي',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tadbir_idari_tarbawi';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك الاقتصاد والتدبير — مختبرات مدرسية / حراسة تربوية وتوثيق)',
  cycles = ARRAY['secondary_prep']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_iqtisad';

UPDATE public.subjects SET name = 'تحليل ظاهرة نفسية واجتماعية',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'tahlil_nafsia_ijtimaiya';

UPDATE public.subjects SET name = 'الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين الاجتماعيين)',
  cycles = ARRAY['secondary_qual']::text[], weight = 1
WHERE exam_id = 'tarbawiyin' AND key = 'khas_ijtimai';

-- ───────────────────────── 3) إعادة تجميع الأسئلة على مسلك مادتها ─────────────────────────
-- كل سؤال يأخذ cycles مادته (مسلك وحيد) — من جدول subjects المرجع أعلاه.
UPDATE public.questions q
SET cycles = s.cycles
FROM public.subjects s
WHERE s.exam_id = 'tarbawiyin'
  AND s.key = q.subject
  AND q.exam_id = 'tarbawiyin'
  AND q.cycles IS DISTINCT FROM s.cycles;

-- ───────────────────────── 4) قراءة الأسئلة: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
-- crmef: يبقى قيد سلك التسجيل كما هو (تجريبي/مدفوع ضمن سلك المستخدم).
-- غير crmef (مسالك): المسالك الثلاثة متاحة لكل مترشح — يكفي الحالة (تجريبي/مدفوع) والنطاق.
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            -- مباراة crmef: قيد السلك الأصلي
            (questions.exam_id = 'crmef' AND (
              (questions.is_trial AND p.cycle = ANY(questions.cycles))
              OR (p.subscription_status = 'premium'
                  AND p.cycle = ANY(questions.cycles)
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
            -- مباريات المسالك: بلا قيد سلك — النطاق فقط
            OR (COALESCE(questions.exam_id, 'crmef') <> 'crmef' AND (
              questions.is_trial
              OR (p.subscription_status = 'premium'
                  AND (
                    p.role = 'admin'
                    OR (p.premium_scope = 'all')
                    OR (p.premium_scope = questions.exam_id)
                  ))
            ))
          )
      )
    )
  );

-- ───────────────────────── 5) قراءة الملخصات: المباريات غير التعليمية بلا قيد أسماء الأسلاك ─────────────────────────
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        -- ملخص تجريبي داخلي: للمشرف فقط.
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        -- النطاق: الشامل يرى الكل، ومشترك مباراة واحدة يراها في مباراته.
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        -- حصر القراءة في سلك المستخدم (مباراة crmef فقط — قيم cycle العربية المعيارية).
        -- المباريات الأخرى (المسالك) بلا قيد أسماء — أسماؤها ليست من نظام الأسلاك.
        AND (
          p.role = 'admin'
          OR COALESCE(summaries.exam_id, 'crmef') <> 'crmef'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────── 6) الإجابة الخادمية: إعفاء المباريات غير التعليمية من قيد السلك ─────────────────────────
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
  v_exam TEXT;
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
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

  SELECT subject, is_trial, exam_id, is_draft INTO v_subject, v_trial, v_exam, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- حصر بالسلك المسجل: مباراة crmef فقط — المباريات ذات المسالك مفتوحة لكل المترشحين.
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_exam, 'crmef') = 'crmef' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.questions q ON q.id = p_question_id
      WHERE p.id = v_uid AND p.cycle = ANY(q.cycles)
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
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

-- ───────────────────────── 7) تحقق سريع بعد التنفيذ ─────────────────────────
-- المواد ومسالكها وأعداد أسئلتها:
--   SELECT key, name, cycles, (SELECT count(*) FROM public.questions q WHERE q.exam_id='tarbawiyin' AND q.subject=s.key) AS questions
--     FROM public.subjects s WHERE exam_id='tarbawiyin' ORDER BY key;
-- كل الأسئلة على مسلك مادتها (يجب أن ترجع 0 صفوف):
--   SELECT q.id FROM public.questions q
--     JOIN public.subjects s ON s.exam_id=q.exam_id AND s.key=q.subject
--     WHERE q.exam_id='tarbawiyin' AND q.cycles IS DISTINCT FROM s.cycles;

-- ============================================================================
-- المرحلة 2.9 — نموذج الصلاحيات: مباراة + مسلك (نسخة من supabase_access_model.sql)
-- ============================================================================
-- ============================================================================
-- المرحلة 2.9 — نموذج الصلاحيات الجديد: «المباراة + المسلك» وحدة واحدة
--
-- الحالات الأربع:
--   1) مجاني (trial): يقرأ أسئلة العيّنة (is_trial) فقط، وداخل المسلك/السلك
--      الذي اختاره عند التسجيل (profiles.exam_tracks → profiles.cycle)،
--      بنفس الكوطة (20 سؤال لكل موضوع).
--   2) اشتراك جزئي (50 د.م — مباراة واحدة): كل أسئلة مباراته، في مسلك واحد
--      فقط (المسلك المختار له في تلك المباراة).
--   3) اشتراك شامل (100 د.م): كل المباريات وكل المسالك (بلا قيد سلك).
--   4) مشرف: كل شيء.
--
-- التخزين: profiles.exam_tracks JSONB = { "<exam_id>": "<cycle_key>" }
--   (سلك المستخدم الافتراضي ما زال profiles.cycle — يُستخدم كاحتياط).
--
-- التنفيذ متكرر آمن. يجب أن يُنفَّذ بعد المراحل 2.7 (المهلة التجريبية)
-- و2.8 (المسالك)، وإلا أعادت الجولة السابقة سياساتها.
-- ============================================================================

-- ───────────────────────── 1) عمود المسالك لكل مباراة ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_tracks JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ───────────────────────── 1-ب) قراءة المباريات النشطة للزائر قبل التسجيل ─────────────────────────
-- بدون هذه السياسة لا يستطيع الزائر (غير مسجل) رؤية قائمة المباريات في نافذة
-- التسجيل، فيقتصر الاختيار على المباراة الافتراضية. تُقرأ المباريات النشطة فقط
-- (لا بيانات مستخدمين ولا محتوى مدفوع).
DROP POLICY IF EXISTS "exams read active public" ON public.exams;
CREATE POLICY "exams read active public" ON public.exams
  FOR SELECT TO anon, authenticated
  USING (is_active);

-- قيمة صالحة: كائن JSON (خريطة مباراة → سلك)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_exam_tracks_object'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_exam_tracks_object CHECK (jsonb_typeof(exam_tracks) = 'object');
  END IF;
END $$;

-- ───────────────────────── 2) التسجيل: المباراة + المسلك معاً ─────────────────────────
-- يُوسَّع trigger إنشاء الحساب ليقرأ exam_id من بيانات التسجيل ويخزّن
-- (المباراة → المسلك) في exam_tracks.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle TEXT;
  v_exam  TEXT;
  v_name  TEXT;
BEGIN
  v_cycle := CASE WHEN NEW.raw_user_meta_data->>'cycle' IN ('primary','secondary_prep','secondary_qual')
                  THEN NEW.raw_user_meta_data->>'cycle' ELSE 'primary' END;
  v_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''),'@',1));

  -- المباراة المسجَّلة: تُقبل إن كانت نشطة في جدول exams، وإلا الافتراضية crmef.
  v_exam := 'crmef';
  IF NEW.raw_user_meta_data->>'exam_id' IS NOT NULL THEN
    SELECT id INTO v_exam FROM public.exams
    WHERE id = lower(trim(NEW.raw_user_meta_data->>'exam_id')) AND is_active;
    IF v_exam IS NULL THEN
      v_exam := 'crmef';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, cycle, exam_id, exam_tracks)
  VALUES (NEW.id, COALESCE(NEW.email,''), v_name, v_cycle, v_exam,
          jsonb_build_object(v_exam, v_cycle))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ───────────────────────── 3) تسجيل اختيار المسلك (مطوّر / مشترك) ─────────────────────────
-- يكتب (المباراة → المسلك) للمستخدم الحالي، بشرط أن تكون المباراة ضمن نطاقه:
-- مشترك شامل (كل المباريات) أو مشترك تلك المباراة تحديداً.
-- المستخدم المجاني لا يستطيع تغيير مسلكه (يبقى ما اختاره عند التسجيل) — المشرف وحده يغيّره.
CREATE OR REPLACE FUNCTION public.set_profile_track(p_exam_id TEXT, p_cycle TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exam TEXT;
  v_status TEXT;
  v_scope TEXT;
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  IF p_exam_id IS NULL OR trim(p_exam_id) = '' THEN
    RAISE EXCEPTION 'EXAM_REQUIRED';
  END IF;
  IF p_cycle IS NULL OR p_cycle NOT IN ('primary','secondary_prep','secondary_qual') THEN
    RAISE EXCEPTION 'INVALID_CYCLE';
  END IF;

  SELECT id INTO v_exam FROM public.exams
  WHERE id = lower(trim(p_exam_id)) AND is_active;
  IF v_exam IS NULL THEN
    RAISE EXCEPTION 'UNKNOWN_EXAM';
  END IF;

  SELECT subscription_status, COALESCE(premium_scope,'all'), role
  INTO v_status, v_scope, v_role
  FROM public.profiles WHERE id = v_uid;

  IF v_role <> 'admin' AND NOT (v_status = 'premium' AND (v_scope = 'all' OR v_scope = v_exam)) THEN
    RAISE EXCEPTION 'TRACK_LOCKED';
  END IF;

  UPDATE public.profiles
  SET exam_tracks = jsonb_set(COALESCE(exam_tracks, '{}'::jsonb), ARRAY[v_exam], to_jsonb(p_cycle), true),
      updated_at = NOW()
  WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_track(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_track(TEXT, TEXT) TO authenticated;

-- ───────────────────────── 4) قراءة الأسئلة: نموذج «مباراة + مسلك» ─────────────────────────
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            -- (أ) مشترك شامل: كل المباريات وكل المسالك
            (p.subscription_status = 'premium' AND p.premium_scope = 'all')
            -- (ب) مشترك مباراة واحدة: مباراته، في مسلك واحد فقط
            OR (p.subscription_status = 'premium'
                AND p.premium_scope = questions.exam_id
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles))
            -- (ج) مجاني: عيّنة (is_trial) في مسلكه المختار، بنفس الكوطة
            OR (p.subscription_status <> 'premium'
                AND questions.is_trial
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles))
          )
      )
    )
  );

-- ───────────────────────── 5) قراءة الإجابات: نفس النموذج + حاجز المهلة التجريبية ─────────────────────────
DROP POLICY IF EXISTS "Answers read premium or admin" ON public.question_answers;
CREATE POLICY "Answers read premium or admin" ON public.question_answers
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.questions q ON q.id = question_answers.question_id
      WHERE p.id = auth.uid()
        AND NOT COALESCE(q.is_draft, FALSE)
        AND (
          (p.subscription_status = 'premium' AND p.premium_scope = 'all')
          OR (p.subscription_status = 'premium'
              AND p.premium_scope = q.exam_id
              AND COALESCE(p.exam_tracks ->> q.exam_id, p.cycle) = ANY(q.cycles))
        )
    )
  );

-- ───────────────────────── 6) قراءة الملخصات: نطاق + مسلك ─────────────────────────
-- ملخصات المباريات غير التعليمية (مسالك) تُقرأ ضمن نطاق الاشتراك بلا قيد
-- أسماء الأسلاك (أسماؤها ليست من نظام الأسلاك)، وبقيت مطابقة لمباراة crmef.
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        AND (
          p.role = 'admin'
          OR COALESCE(summaries.exam_id, 'crmef') <> 'crmef'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────── 7) الإجابة الخادمية: نفس النموذج ─────────────────────────
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
  v_exam TEXT;
  v_cycles TEXT[];
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
  v_eff_cycle TEXT;
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

  SELECT subject, is_trial, exam_id, cycles, is_draft
  INTO v_subject, v_trial, v_exam, v_cycles, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- المسلك الفعّال لهذا السؤال: من خريطة المسالك per exam، وإلا السلك العام.
  SELECT COALESCE(exam_tracks ->> v_exam, cycle) INTO v_eff_cycle
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- قفل المسلك: المشترك الشامل بلا قيد — وغيره داخل مسلكه فقط.
  IF NOT COALESCE(v_admin, FALSE)
     AND NOT (COALESCE(v_premium, FALSE) AND COALESCE(v_scope, 'all') = 'all')
     AND COALESCE(v_eff_cycle, 'primary') <> ALL(COALESCE(v_cycles, ARRAY[]::text[])) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
  END IF;

  -- الكوطة المجانية: 20 سؤال لكل موضوع (داخل المباراة الحالية).
  IF NOT COALESCE(v_premium, FALSE) THEN
    IF NOT v_trial THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
    SELECT COUNT(*) INTO v_answered
    FROM public.question_progress qp
    JOIN public.questions q ON q.id = qp.question_id
    WHERE qp.user_id = v_uid AND q.subject = v_subject AND q.exam_id = COALESCE(v_exam, 'crmef');

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

-- ───────────────────────── 8) اعتماد الاشتراك الجزئي يكتب المسلك ─────────────────────────
-- عند الموافقة على طلب «مباراة واحدة» يُسجَّل المسلك المطلوب في profiles.exam_tracks
-- (عبر RPC آمن بدل UPDATE مباشر — لأن سياسات profiles تحديثها للمشرف فقط).
CREATE OR REPLACE FUNCTION public.apply_subscription_scope(
  p_user_id UUID,
  p_exam_id TEXT,
  p_cycle TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  IF p_user_id IS NULL OR p_exam_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGS';
  END IF;

  UPDATE public.profiles
  SET premium_scope = p_exam_id,
      exam_tracks = jsonb_set(COALESCE(exam_tracks, '{}'::jsonb), ARRAY[p_exam_id],
                               to_jsonb(COALESCE(NULLIF(p_cycle, ''), cycle)), true),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_subscription_scope(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_subscription_scope(UUID, TEXT, TEXT) TO authenticated;

-- ───────────────────────── 9) تحقق سريع بعد التنفيذ ─────────────────────────
--   SELECT id, email, cycle, exam_id, exam_tracks, premium_scope FROM public.profiles LIMIT 10;
--   SELECT count(*) FROM public.questions WHERE exam_id = 'tarbawiyin';

-- ============================================================================
-- ============================================================================
-- المرحلة 2.9 — نموذج الصلاحيات الجديد: «المباراة + المسلك» وحدة واحدة
--
-- الحالات الأربع:
--   1) مجاني (trial): يقرأ أسئلة العيّنة (is_trial) فقط، وداخل المسلك/السلك
--      الذي اختاره عند التسجيل (profiles.exam_tracks → profiles.cycle)،
--      بنفس الكوطة (20 سؤال لكل موضوع).
--   2) اشتراك جزئي (50 د.م — مباراة واحدة): كل أسئلة مباراته، في مسلك واحد
--      فقط (المسلك المختار له في تلك المباراة).
--   3) اشتراك شامل (100 د.م): كل المباريات وكل المسالك (بلا قيد سلك).
--   4) مشرف: كل شيء.
--
-- التخزين: profiles.exam_tracks JSONB = { "<exam_id>": "<cycle_key>" }
--   (سلك المستخدم الافتراضي ما زال profiles.cycle — يُستخدم كاحتياط).
--
-- التنفيذ متكرر آمن. يجب أن يُنفَّذ بعد المراحل 2.7 (المهلة التجريبية)
-- و2.8 (المسالك)، وإلا أعادت الجولة السابقة سياساتها.
-- ============================================================================

-- ───────────────────────── 1) عمود المسالك لكل مباراة ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_tracks JSONB NOT NULL DEFAULT '{}'::jsonb;

-- قيمة صالحة: كائن JSON (خريطة مباراة → سلك)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_exam_tracks_object'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_exam_tracks_object CHECK (jsonb_typeof(exam_tracks) = 'object');
  END IF;
END $$;

-- ───────────────────────── 2) التسجيل: المباراة + المسلك معاً ─────────────────────────
-- يُوسَّع trigger إنشاء الحساب ليقرأ exam_id من بيانات التسجيل ويخزّن
-- (المباراة → المسلك) في exam_tracks.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle TEXT;
  v_exam  TEXT;
  v_name  TEXT;
BEGIN
  v_cycle := CASE WHEN NEW.raw_user_meta_data->>'cycle' IN ('primary','secondary_prep','secondary_qual')
                  THEN NEW.raw_user_meta_data->>'cycle' ELSE 'primary' END;
  v_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''),'@',1));

  -- المباراة المسجَّلة: تُقبل إن كانت نشطة في جدول exams، وإلا الافتراضية crmef.
  v_exam := 'crmef';
  IF NEW.raw_user_meta_data->>'exam_id' IS NOT NULL THEN
    SELECT id INTO v_exam FROM public.exams
    WHERE id = lower(trim(NEW.raw_user_meta_data->>'exam_id')) AND is_active;
    IF v_exam IS NULL THEN
      v_exam := 'crmef';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, cycle, exam_id, exam_tracks)
  VALUES (NEW.id, COALESCE(NEW.email,''), v_name, v_cycle, v_exam,
          jsonb_build_object(v_exam, v_cycle))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ───────────────────────── 3) تسجيل اختيار المسلك (مطوّر / مشترك) ─────────────────────────
-- يكتب (المباراة → المسلك) للمستخدم الحالي، بشرط أن تكون المباراة ضمن نطاقه:
-- مشترك شامل (كل المباريات) أو مشترك تلك المباراة تحديداً.
-- المستخدم المجاني لا يستطيع تغيير مسلكه (يبقى ما اختاره عند التسجيل) — المشرف وحده يغيّره.
CREATE OR REPLACE FUNCTION public.set_profile_track(p_exam_id TEXT, p_cycle TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exam TEXT;
  v_status TEXT;
  v_scope TEXT;
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  IF p_exam_id IS NULL OR trim(p_exam_id) = '' THEN
    RAISE EXCEPTION 'EXAM_REQUIRED';
  END IF;
  IF p_cycle IS NULL OR p_cycle NOT IN ('primary','secondary_prep','secondary_qual') THEN
    RAISE EXCEPTION 'INVALID_CYCLE';
  END IF;

  SELECT id INTO v_exam FROM public.exams
  WHERE id = lower(trim(p_exam_id)) AND is_active;
  IF v_exam IS NULL THEN
    RAISE EXCEPTION 'UNKNOWN_EXAM';
  END IF;

  SELECT subscription_status, COALESCE(premium_scope,'all'), role
  INTO v_status, v_scope, v_role
  FROM public.profiles WHERE id = v_uid;

  IF v_role <> 'admin' AND NOT (v_status = 'premium' AND (v_scope = 'all' OR v_scope = v_exam)) THEN
    RAISE EXCEPTION 'TRACK_LOCKED';
  END IF;

  UPDATE public.profiles
  SET exam_tracks = jsonb_set(COALESCE(exam_tracks, '{}'::jsonb), ARRAY[v_exam], to_jsonb(p_cycle), true),
      updated_at = NOW()
  WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_track(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_track(TEXT, TEXT) TO authenticated;

-- ───────────────────────── 4) قراءة الأسئلة: نموذج «مباراة + مسلك» ─────────────────────────
DROP POLICY IF EXISTS "Questions read trial or premium" ON public.questions;
CREATE POLICY "Questions read trial or premium" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT questions.is_draft
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (
            -- (أ) مشترك شامل: كل المباريات وكل المسالك
            (p.subscription_status = 'premium' AND p.premium_scope = 'all')
            -- (ب) مشترك مباراة واحدة: مباراته، في مسلك واحد فقط
            OR (p.subscription_status = 'premium'
                AND p.premium_scope = questions.exam_id
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles))
            -- (ج) مجاني: عيّنة (is_trial) في مسلكه المختار، بنفس الكوطة
            OR (p.subscription_status <> 'premium'
                AND questions.is_trial
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles))
          )
      )
    )
  );

-- ───────────────────────── 5) قراءة الإجابات: نفس النموذج + حاجز المهلة التجريبية ─────────────────────────
DROP POLICY IF EXISTS "Answers read premium or admin" ON public.question_answers;
CREATE POLICY "Answers read premium or admin" ON public.question_answers
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.questions q ON q.id = question_answers.question_id
      WHERE p.id = auth.uid()
        AND NOT COALESCE(q.is_draft, FALSE)
        AND (
          (p.subscription_status = 'premium' AND p.premium_scope = 'all')
          OR (p.subscription_status = 'premium'
              AND p.premium_scope = q.exam_id
              AND COALESCE(p.exam_tracks ->> q.exam_id, p.cycle) = ANY(q.cycles))
        )
    )
  );

-- ───────────────────────── 6) قراءة الملخصات: نطاق + مسلك ─────────────────────────
-- ملخصات المباريات غير التعليمية (مسالك) تُقرأ ضمن نطاق الاشتراك بلا قيد
-- أسماء الأسلاك (أسماؤها ليست من نظام الأسلاك)، وبقيت مطابقة لمباراة crmef.
DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.subscription_status = 'premium' OR p.role = 'admin')
        AND (p.role = 'admin' OR NOT COALESCE(summaries.is_draft, FALSE))
        AND (
          p.role = 'admin'
          OR p.premium_scope = 'all'
          OR p.premium_scope = COALESCE(summaries.exam_id, 'crmef')
        )
        AND (
          p.role = 'admin'
          OR COALESCE(summaries.exam_id, 'crmef') <> 'crmef'
          OR (p.cycle = 'primary' AND summaries.cycle = 'ابتدائي مزدوج')
          OR (p.cycle = 'secondary_prep' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي إعدادي'))
          OR (p.cycle = 'secondary_qual' AND summaries.cycle IN ('ثانوي إعدادي وتأهيلي', 'ثانوي تأهيلي'))
        )
    )
  );

-- ───────────────────────── 7) الإجابة الخادمية: نفس النموذج ─────────────────────────
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
  v_exam TEXT;
  v_cycles TEXT[];
  v_draft BOOLEAN;
  v_premium BOOLEAN;
  v_admin BOOLEAN;
  v_scope TEXT;
  v_eff_cycle TEXT;
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

  SELECT subject, is_trial, exam_id, cycles, is_draft
  INTO v_subject, v_trial, v_exam, v_cycles, v_draft
  FROM public.questions WHERE id = p_question_id;
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND';
  END IF;

  SELECT correct_answer, explanation INTO v_correct, v_explanation
  FROM public.question_answers WHERE question_id = p_question_id;
  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'ANSWER_NOT_FOUND';
  END IF;

  SELECT (role = 'admin'), (subscription_status = 'premium'),
         COALESCE(premium_scope, 'all')
  INTO v_admin, v_premium, v_scope
  FROM public.profiles WHERE id = v_uid;

  -- المسلك الفعّال لهذا السؤال: من خريطة المسالك per exam، وإلا السلك العام.
  SELECT COALESCE(exam_tracks ->> v_exam, cycle) INTO v_eff_cycle
  FROM public.profiles WHERE id = v_uid;

  -- غير المشرف لا يجيب عن سؤال تجريبي داخلي (مهلة المراجعة).
  IF NOT COALESCE(v_admin, FALSE) AND COALESCE(v_draft, FALSE) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- قفل المسلك: المشترك الشامل بلا قيد — وغيره داخل مسلكه فقط.
  IF NOT COALESCE(v_admin, FALSE)
     AND NOT (COALESCE(v_premium, FALSE) AND COALESCE(v_scope, 'all') = 'all')
     AND COALESCE(v_eff_cycle, 'primary') <> ALL(COALESCE(v_cycles, ARRAY[]::text[])) THEN
    RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
  END IF;

  -- طوق النطاق المدفوع: مشترك مباراة واحدة لا يجيب عن أسئلة مباريات أخرى.
  IF NOT COALESCE(v_admin, FALSE)
     AND COALESCE(v_premium, FALSE)
     AND COALESCE(v_scope, 'all') <> 'all'
     AND COALESCE(v_scope, 'all') <> COALESCE(v_exam, 'crmef') THEN
    RAISE EXCEPTION 'PREMIUM_SCOPE_LOCKED';
  END IF;

  -- الكوطة المجانية: 20 سؤال لكل موضوع (داخل المباراة الحالية).
  IF NOT COALESCE(v_premium, FALSE) THEN
    IF NOT v_trial THEN
      RAISE EXCEPTION 'TRIAL_QUESTION_LOCKED';
    END IF;
    SELECT COUNT(*) INTO v_answered
    FROM public.question_progress qp
    JOIN public.questions q ON q.id = qp.question_id
    WHERE qp.user_id = v_uid AND q.subject = v_subject AND q.exam_id = COALESCE(v_exam, 'crmef');

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

-- ───────────────────────── 8) اعتماد الاشتراك الجزئي يكتب المسلك ─────────────────────────
-- عند الموافقة على طلب «مباراة واحدة» يُسجَّل المسلك المطلوب في profiles.exam_tracks
-- (عبر RPC آمن بدل UPDATE مباشر — لأن سياسات profiles تحديثها للمشرف فقط).
CREATE OR REPLACE FUNCTION public.apply_subscription_scope(
  p_user_id UUID,
  p_exam_id TEXT,
  p_cycle TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  IF p_user_id IS NULL OR p_exam_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGS';
  END IF;

  UPDATE public.profiles
  SET premium_scope = p_exam_id,
      exam_tracks = jsonb_set(COALESCE(exam_tracks, '{}'::jsonb), ARRAY[p_exam_id],
                               to_jsonb(COALESCE(NULLIF(p_cycle, ''), cycle)), true),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_subscription_scope(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_subscription_scope(UUID, TEXT, TEXT) TO authenticated;

-- ───────────────────────── 9) تحقق سريع بعد التنفيذ ─────────────────────────
--   SELECT id, email, cycle, exam_id, exam_tracks, premium_scope FROM public.profiles LIMIT 10;
--   SELECT count(*) FROM public.questions WHERE exam_id = 'tarbawiyin';
