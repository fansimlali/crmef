-- ============================================================================
-- اختبار تدفق الإحالات — آمن وقابل للتراجع (Rollback-safe)
--
-- ماذا يختبر؟
--   1) ربط الإحالة عند التسجيل عبر handle_new_user (كود ?ref=).
--   2) بقاء الإحالة pending حتى تأكيد البريد واستيفاء 20 سؤالاً مختلفاً
--      خلال يومين بتوقيت المغرب.
--   3) منح المكافأة (3 أشهر) مرة واحدة عند بلوغ 20 إحالة مؤهلة.
--   4) منع الإحالة الذاتية على مستوى القيد في قاعدة البيانات.
--   5) رفض الإحالة واستعادتها عبر RPC الإدارة، ومنع المستخدم العادي.
--   6) عدم سحب/تكرار المكافأة عند رفض إحالة مؤهلة ثم استعادتها.
--   7) تطابق أرقام my_referral_summary و my_referrals وإخفاء البريد.
--
-- الأمان:
--   * ينشئ مستخدمين وأسئلة اختبارية بمعرّفات ثابتة تبدأ بـ selftest فقط.
--   * كل شيء داخل كتلة DO واحدة: أي فشل يتراجع عنه PostgreSQL كاملاً.
--   * عند النجاح تُحذف بيانات الاختبار في نهاية الكتلة، فلا يبقى أثر.
--   * لا يلمس أي مستخدم أو سؤال أو إحالة حقيقية.
--
-- طريقة التنفيذ:
--   الصق الملف كاملاً في Supabase SQL Editor ثم Run.
--   النجاح = رسالة NOTICE: «نجحت جميع اختبارات الإحالات».
--   الفشل = استثناء SELFTEST FAILED مع سبب واضح، ولا يبقى أي أثر.
-- ============================================================================

DO $selftest$
DECLARE
  v_referrer UUID := 'c0c00000-0000-4000-8000-000000000000';
  v_admin UUID := 'c0c00000-0000-4000-8000-0000000000aa';
  v_link_referred UUID := 'c0c00000-0000-4000-8000-000000000021';
  v_first_referred UUID := 'c0c00000-0000-4000-8000-000000000001';

  v_id UUID;
  v_email TEXT;
  v_exam TEXT;
  v_ref_code TEXT;
  v_meta JSONB;

  v_status TEXT;
  v_source TEXT;
  v_scope TEXT;
  v_reason TEXT;
  v_count BIGINT;
  v_q INTEGER;
  v_p INTEGER;
  v_r INTEGER;
  v_req INTEGER;
  v_rem INTEGER;
  v_granted TIMESTAMPTZ;
  v_until TIMESTAMPTZ;
  v_until_before TIMESTAMPTZ;
  v_granted_before TIMESTAMPTZ;
BEGIN
  -- ───────────────────────── 1) التحقق من المتطلبات ─────────────────────────
  IF to_regclass('public.referrals') IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: جدول referrals غير موجود. نفّذ supabase_referrals.sql أولاً.';
  END IF;
  IF to_regclass('public.exams') IS NULL OR to_regclass('public.questions') IS NULL
     OR to_regclass('public.question_progress') IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: جداول exams/questions/question_progress غير موجودة.';
  END IF;
  IF to_regprocedure('public.refresh_referral_qualification(uuid)') IS NULL
     OR to_regprocedure('public.refresh_referrer_reward(uuid)') IS NULL
     OR to_regprocedure('public.admin_reject_referral(uuid,text)') IS NULL
     OR to_regprocedure('public.admin_restore_referral(uuid)') IS NULL
     OR to_regprocedure('public.my_referral_summary()') IS NULL
     OR to_regprocedure('public.my_referrals()') IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: دوال الإحالات غير مكتملة. نفّذ supabase_referrals.sql كاملاً.';
  END IF;

  -- ───────────────────────── 1ب) تنظيف بقايا تشغيل سابق ─────────────────────────
  DELETE FROM public.questions WHERE id LIKE 'selftest-q-%';
  DELETE FROM auth.users WHERE email LIKE 'selftest-%@example.invalid';

  -- مباراة موجودة لتلبية المفاتيح الأجنبية (profiles.exam_id / questions.exam_id).
  -- نفضّل مباراة نشطة لأن handle_new_user يتجاهل غير النشطة ويسقط إلى crmef.
  SELECT id INTO v_exam
  FROM public.exams
  WHERE is_active
  ORDER BY sort_order ASC, id ASC
  LIMIT 1;

  IF v_exam IS NULL THEN
    SELECT id INTO v_exam FROM public.exams WHERE id = 'crmef';
  END IF;

  IF v_exam IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: لا توجد مباراة نشطة أو مباراة crmef في جدول exams.';
  END IF;

  -- ───────────────────────── 2) أسئلة اختبارية ─────────────────────────
  INSERT INTO public.questions (id, cycles, subject, topic, question, options, is_trial, exam_id)
  SELECT
    'selftest-q-' || lpad(q::text, 2, '0'),
    ARRAY['primary']::text[],
    'selftest',
    'selftest',
    'سؤال اختبار الإحالات رقم ' || q,
    '["أ","ب"]'::jsonb,
    TRUE,
    v_exam
  FROM generate_series(1, 20) AS q;

  SELECT COUNT(*) INTO v_count FROM public.questions WHERE id LIKE 'selftest-q-%';
  IF v_count <> 20 THEN
    RAISE EXCEPTION 'SELFTEST FAILED: تعذّر إنشاء 20 سؤالاً اختبارياً (وجد %).', v_count;
  END IF;

  -- ───────────────────────── 3) المستخدم المُحيل + كود الإحالة ─────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_referrer,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'selftest-referrer@example.invalid',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'مُحيل اختبار', 'exam_id', v_exam),
    NOW(), NOW()
  );

  SELECT referral_code INTO v_ref_code
  FROM public.profiles
  WHERE id = v_referrer;

  IF v_ref_code IS NULL OR v_ref_code !~ '^[A-F0-9]{16}$' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: لم يُولَّد كود إحالة صالح للمُحيل (%).', v_ref_code;
  END IF;

  -- ───────────────────────── 4) مستخدم إداري للاختبار ─────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_admin,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'selftest-admin@example.invalid',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'مشرف اختبار', 'exam_id', v_exam),
    NOW(), NOW()
  );

  UPDATE public.profiles SET role = 'admin' WHERE id = v_admin;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'SELFTEST FAILED: تعذّر ترقية المشرف الاختباري.';
  END IF;

  -- ───────────────────────── 5) 20 مُحالاً (بدون تأكيد بعد) ─────────────────────────
  FOR i IN 1..20 LOOP
    v_id := ('c0c00000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    v_email := 'selftest-referred-' || lpad(i::text, 2, '0') || '@example.invalid';
    v_meta := jsonb_build_object(
      'full_name', 'مُحال اختبار ' || i,
      'exam_id', v_exam
    );

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      v_meta,
      NOW(), NOW()
    );

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_id) THEN
      RAISE EXCEPTION 'SELFTEST FAILED: لم يُنشأ ملف شخصي للمُحال رقم %.', i;
    END IF;

    UPDATE public.profiles SET referred_by = v_referrer WHERE id = v_id;

    INSERT INTO public.referrals (referred_id, referrer_id, status)
    VALUES (v_id, v_referrer, 'pending');
  END LOOP;

  -- ───────────────────────── 6) ربط الإحالة عند التسجيل (handle_new_user) ─────────────────────────
  -- بصمة جهاز مطابقة للمُحيل: يجب أن تُسجَّل كعلم خطر للمراجعة فقط.
  UPDATE public.profiles
  SET signup_fingerprint = 'selftest-device-0001'
  WHERE id = v_referrer;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_link_referred,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'selftest-referred-21@example.invalid',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', 'مُحال عبر الرابط',
      'exam_id', v_exam,
      'ref_code', v_ref_code,
      'signup_fingerprint', 'selftest-device-0001'
    ),
    NOW(), NOW()
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referred_id = v_link_referred
      AND referrer_id = v_referrer
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'SELFTEST FAILED: handle_new_user لم يسجّل الإحالة من كود ?ref=.';
  END IF;

  IF (SELECT referred_by FROM public.profiles WHERE id = v_link_referred)
     IS DISTINCT FROM v_referrer THEN
    RAISE EXCEPTION 'SELFTEST FAILED: handle_new_user لم يضبط referred_by.';
  END IF;

  IF COALESCE((
    SELECT (risk_flags ->> 'same_device')::boolean
    FROM public.referrals
    WHERE referred_id = v_link_referred
  ), FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'SELFTEST FAILED: لم يُسجَّل علم الخطر same_device عند تطابق بصمة الجهاز.';
  END IF;

  -- ───────────────────────── 7) منع الإحالة الذاتية (قيد قاعدة البيانات) ─────────────────────────
  BEGIN
    INSERT INTO public.referrals (referred_id, referrer_id)
    VALUES (v_referrer, v_referrer);

    RAISE EXCEPTION 'SELFTEST FAILED: قيد منع الإحالة الذاتية لم يعمل.';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  -- ───────────────────────── 8) عتبة الأسئلة ثم عتبة اليومين ─────────────────────────
  -- 19 سؤالاً في يوم واحد: لا تكفي (عدد الأسئلة).
  INSERT INTO public.question_progress (user_id, question_id, is_correct, answered_at)
  SELECT
    v_first_referred,
    'selftest-q-' || lpad(q::text, 2, '0'),
    TRUE,
    NOW() - INTERVAL '1 day'
  FROM generate_series(1, 19) AS q;

  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = v_first_referred;

  SELECT status INTO v_status
  FROM public.referrals
  WHERE referred_id = v_first_referred;

  IF v_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: تأهّلت الإحالة بعدد 19 سؤالاً (الحالة: %).', v_status;
  END IF;

  -- 20 سؤالاً لكنها كلها في يوم واحد: تبقى pending (عدد الأيام).
  INSERT INTO public.question_progress (user_id, question_id, is_correct, answered_at)
  VALUES (v_first_referred, 'selftest-q-20', TRUE, NOW() - INTERVAL '1 day');

  SELECT status INTO v_status
  FROM public.referrals
  WHERE referred_id = v_first_referred;

  IF v_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: تأهّلت الإحالة بـ20 سؤالاً في يوم واحد فقط (الحالة: %).', v_status;
  END IF;

  -- نقل إجابة واحدة إلى يوم سابق: يكتمل شرط اليومين ويتأهل فوراً.
  UPDATE public.question_progress
  SET answered_at = NOW() - INTERVAL '2 days'
  WHERE user_id = v_first_referred
    AND question_id = 'selftest-q-20';

  SELECT status INTO v_status
  FROM public.referrals
  WHERE referred_id = v_first_referred;

  IF v_status IS DISTINCT FROM 'qualified' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: لم تتأهل الإحالة بعد استيفاء 20 سؤالاً في يومين (الحالة: %).', v_status;
  END IF;

  -- ───────────────────────── 9) تراكم الإحالات حتى المكافأة ─────────────────────────
  FOR i IN 2..20 LOOP
    v_id := ('c0c00000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

    INSERT INTO public.question_progress (user_id, question_id, is_correct, answered_at)
    SELECT
      v_id,
      'selftest-q-' || lpad(q::text, 2, '0'),
      TRUE,
      CASE WHEN q <= 10 THEN NOW() - INTERVAL '2 days' ELSE NOW() - INTERVAL '1 day' END
    FROM generate_series(1, 20) AS q;

    UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = v_id;

    SELECT status INTO v_status
    FROM public.referrals
    WHERE referred_id = v_id;

    IF v_status IS DISTINCT FROM 'qualified' THEN
      RAISE EXCEPTION 'SELFTEST FAILED: الإحالة رقم % لم تتأهل (الحالة: %).', i, v_status;
    END IF;

    IF i < 20 THEN
      SELECT referral_reward_granted_at INTO v_granted
      FROM public.profiles
      WHERE id = v_referrer;

      IF v_granted IS NOT NULL THEN
        RAISE EXCEPTION 'SELFTEST FAILED: مُنحت المكافأة قبل بلوغ 20 إحالة (عند %).', i;
      END IF;
    END IF;
  END LOOP;

  SELECT referral_reward_granted_at, premium_until, subscription_status, premium_source, premium_scope
  INTO v_granted, v_until, v_status, v_source, v_scope
  FROM public.profiles
  WHERE id = v_referrer;

  IF v_granted IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: لم تُمنح المكافأة عند 20 إحالة مؤهلة.';
  END IF;
  IF v_status IS DISTINCT FROM 'premium' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: حالة المُحيل بعد المكافأة ليست premium (%).', v_status;
  END IF;
  IF v_source IS DISTINCT FROM 'referral' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: مصدر الاشتراك بعد المكافأة ليس referral (%).', v_source;
  END IF;
  IF v_scope IS DISTINCT FROM v_exam THEN
    RAISE EXCEPTION 'SELFTEST FAILED: نطاق الاشتراك بعد المكافأة غير متوقع (% بدل %).', v_scope, v_exam;
  END IF;
  IF v_until IS NULL
     OR abs(extract(epoch FROM (v_until - (NOW() + INTERVAL '3 months')))) > 3600 THEN
    RAISE EXCEPTION 'SELFTEST FAILED: مدة المكافأة ليست 3 أشهر تقريباً (%).', v_until;
  END IF;

  -- ───────────────────────── 10) RPC واجهة المستخدم ─────────────────────────
  PERFORM set_config('request.jwt.claim.sub', v_referrer::text, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_referrer, 'role', 'authenticated')::text,
    TRUE
  );

  SELECT qualified_count, pending_count, rejected_count, required_count, remaining_count
  INTO v_q, v_p, v_r, v_req, v_rem
  FROM public.my_referral_summary();

  IF v_q IS DISTINCT FROM 20 OR v_p IS DISTINCT FROM 1
     OR v_r IS DISTINCT FROM 0 OR v_req IS DISTINCT FROM 20 OR v_rem IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION
      'SELFTEST FAILED: my_referral_summary غير متوقع (qualified=%, pending=%, rejected=%, required=%, remaining=%).',
      v_q, v_p, v_r, v_req, v_rem;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.my_referrals();
  IF v_count <> 21 THEN
    RAISE EXCEPTION 'SELFTEST FAILED: my_referrals أعاد % صفاً بدل 21.', v_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.my_referrals()
    WHERE referred_email = 's***@example.invalid'
  ) THEN
    RAISE EXCEPTION 'SELFTEST FAILED: my_referrals لا يُخفي البريد بالصيغة المتوقعة.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.my_referrals()
    WHERE referred_email LIKE '%selftest-referred%'
       OR referred_email NOT LIKE '%***@%'
  ) THEN
    RAISE EXCEPTION 'SELFTEST FAILED: my_referrals كشف بريداً كاملاً.';
  END IF;

  -- ───────────────────────── 11) المستخدم العادي لا يستطيع الرفض ─────────────────────────
  BEGIN
    PERFORM public.admin_reject_referral(v_link_referred, 'محاولة غير مصرح بها');
    RAISE EXCEPTION 'SELFTEST FAILED: سُمح لمستخدم عادي برفض إحالة.';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%ADMIN_REQUIRED%' THEN
        RAISE;
      END IF;
  END;

  -- ───────────────────────── 12) رفض/استعادة إحالة pending ─────────────────────────
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text,
    TRUE
  );

  PERFORM public.admin_reject_referral(v_link_referred, 'سبب اختبار الرفض');

  SELECT status, rejection_reason, rejected_at
  INTO v_status, v_reason, v_granted
  FROM public.referrals
  WHERE referred_id = v_link_referred;

  IF v_status IS DISTINCT FROM 'rejected'
     OR v_reason IS DISTINCT FROM 'سبب اختبار الرفض'
     OR v_granted IS NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: admin_reject_referral لم يسجّل الرفض/السبب/التاريخ.';
  END IF;

  PERFORM public.admin_restore_referral(v_link_referred);

  SELECT status, qualified_at, rejected_at, rejection_reason
  INTO v_status, v_until, v_granted, v_reason
  FROM public.referrals
  WHERE referred_id = v_link_referred;

  IF v_status IS DISTINCT FROM 'pending'
     OR v_until IS NOT NULL
     OR v_granted IS NOT NULL
     OR v_reason IS NOT NULL THEN
    RAISE EXCEPTION 'SELFTEST FAILED: admin_restore_referral لم يُعد الإحالة إلى pending نظيفة.';
  END IF;

  -- ───────────────────────── 13) رفض مؤهلة ثم استعادتها: لا سحب ولا تكرار للمكافأة ─────────────────────────
  SELECT premium_until, referral_reward_granted_at
  INTO v_until_before, v_granted_before
  FROM public.profiles
  WHERE id = v_referrer;

  PERFORM public.admin_reject_referral(v_first_referred, 'اختبار عدم سحب المكافأة');

  SELECT premium_until, referral_reward_granted_at
  INTO v_until, v_granted
  FROM public.profiles
  WHERE id = v_referrer;

  IF v_until IS DISTINCT FROM v_until_before
     OR v_granted IS DISTINCT FROM v_granted_before THEN
    RAISE EXCEPTION 'SELFTEST FAILED: رفض إحالة مؤهلة غيّر مكافأة المُحيل.';
  END IF;

  -- واجهة المستخدم ترى 19 مؤهلة + 1 مرفوضة.
  PERFORM set_config('request.jwt.claim.sub', v_referrer::text, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_referrer, 'role', 'authenticated')::text,
    TRUE
  );

  SELECT qualified_count, rejected_count, remaining_count
  INTO v_q, v_r, v_rem
  FROM public.my_referral_summary();

  IF v_q IS DISTINCT FROM 19 OR v_r IS DISTINCT FROM 1 OR v_rem IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION
      'SELFTEST FAILED: ملخص المستخدم بعد الرفض غير متوقع (qualified=%, rejected=%, remaining=%).',
      v_q, v_r, v_rem;
  END IF;

  -- استعادة الإحالة المؤهلة: تعود qualified دون تمديد جديد.
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text,
    TRUE
  );

  PERFORM public.admin_restore_referral(v_first_referred);

  SELECT status INTO v_status
  FROM public.referrals
  WHERE referred_id = v_first_referred;

  IF v_status IS DISTINCT FROM 'qualified' THEN
    RAISE EXCEPTION 'SELFTEST FAILED: استعادة إحالة مؤهلة لم تُعِدها qualified (%).', v_status;
  END IF;

  SELECT premium_until, referral_reward_granted_at
  INTO v_until, v_granted
  FROM public.profiles
  WHERE id = v_referrer;

  IF v_until IS DISTINCT FROM v_until_before
     OR v_granted IS DISTINCT FROM v_granted_before THEN
    RAISE EXCEPTION 'SELFTEST FAILED: استعادة الإحالة كرّرت/مدّدت المكافأة.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_referrer::text, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_referrer, 'role', 'authenticated')::text,
    TRUE
  );

  SELECT qualified_count, rejected_count, remaining_count
  INTO v_q, v_r, v_rem
  FROM public.my_referral_summary();

  IF v_q IS DISTINCT FROM 20 OR v_r IS DISTINCT FROM 0 OR v_rem IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION
      'SELFTEST FAILED: ملخص المستخدم بعد الاستعادة غير متوقع (qualified=%, rejected=%, remaining=%).',
      v_q, v_r, v_rem;
  END IF;

  -- ───────────────────────── 14) تنظيف كامل ─────────────────────────
  PERFORM set_config('request.jwt.claim.sub', '', TRUE);
  PERFORM set_config('request.jwt.claims', '', TRUE);

  DELETE FROM auth.users WHERE email LIKE 'selftest-%@example.invalid';
  DELETE FROM public.questions WHERE id LIKE 'selftest-q-%';

  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE email LIKE 'selftest-%@example.invalid';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SELFTEST FAILED: بقيت % حسابات اختبارية.', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.questions
  WHERE id LIKE 'selftest-q-%';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SELFTEST FAILED: بقيت % أسئلة اختبارية.', v_count;
  END IF;

  RAISE NOTICE '✅ نجحت جميع اختبارات الإحالات: الربط، 20 سؤالاً/يومان، المكافأة مرة واحدة، الرفض/الاستعادة، وإخفاء البريد.';
END;
$selftest$;
