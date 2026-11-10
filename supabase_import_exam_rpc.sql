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
