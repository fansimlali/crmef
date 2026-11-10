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
