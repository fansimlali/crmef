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
