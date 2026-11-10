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
