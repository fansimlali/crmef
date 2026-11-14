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
  v_has_track BOOLEAN;
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

  -- هل اختار المستخدم مسلكاً لهذه المباراة من قبل؟
  SELECT (exam_tracks ? v_exam) INTO v_has_track
  FROM public.profiles WHERE id = v_uid;

  IF v_role <> 'admin' AND NOT (v_status = 'premium' AND (v_scope = 'all' OR v_scope = v_exam)) THEN
    -- مجاني: يختار مسلكاً واحداً لكل مباراة، ثم يُقفل (حماية الكوطة).
    IF COALESCE(v_has_track, FALSE) THEN
      RAISE EXCEPTION 'TRACK_LOCKED';
    END IF;
  END IF;

  UPDATE public.profiles
  SET exam_tracks = jsonb_set(COALESCE(exam_tracks, '{}'::jsonb), ARRAY[v_exam], to_jsonb(p_cycle), true),
      updated_at = NOW()
  WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_track(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_track(TEXT, TEXT) TO authenticated;

-- ───────────────────────── 4) أسئلة المادة تتبع مسالكها تلقائياً ─────────────────────────
-- ارتباط المسلك بالمادة هو المرجع: عند تغيير material.cycles تُحدَّث أسئلتها آلياً،
-- فتكفي عملية واحدة (تعيين المادة إلى مسلك) بدل تحديث كل سؤال على حدة.
CREATE OR REPLACE FUNCTION public.sync_subject_cycles_to_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cycles IS DISTINCT FROM OLD.cycles THEN
    UPDATE public.questions
    SET cycles = NEW.cycles
    WHERE subject = NEW.key AND exam_id = NEW.exam_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_subject_cycles ON public.subjects;
CREATE TRIGGER trg_sync_subject_cycles
AFTER UPDATE OF cycles ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.sync_subject_cycles_to_questions();

-- ───────────────────────── 5) قراءة الأسئلة: نموذج «مباراة + مسلك» ─────────────────────────
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

-- ───────────────────────── 6) قراءة الإجابات: نفس النموذج + حاجز المهلة التجريبية ─────────────────────────
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

-- ───────────────────────── 7) قراءة الملخصات: نطاق + مسلك ─────────────────────────
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

-- ───────────────────────── 8) الإجابة الخادمية: نفس النموذج ─────────────────────────
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

-- 8) الإجابة الخادمية الجزئي يكتب المسلك ─────────────────────────
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

-- 9) اعتماد الاشتراك بعد التنفيذ ─────────────────────────
--   SELECT id, email, cycle, exam_id, exam_tracks, premium_scope FROM public.profiles LIMIT 10;
--   SELECT count(*) FROM public.questions WHERE exam_id = 'tarbawiyin';
