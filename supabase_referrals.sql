-- ============================================================================
-- المرحلة 3.0 — برنامج الإحالات + تأقيت الاشتراكات
--
-- الهدف:
--   * لكل مستخدم كود إحالة فريد ورابط قابل للمشاركة.
--   * الإحالة تُسجَّل عند التسجيل لكنها تبقى «قيد التحقق» حتى يستوفي
--     المستخدم المُحال شروط النشاط الحقيقي.
--   * عند بلوغ 20 إحالة مؤهلة: تفعيل تلقائي لصاحب الرابط لمدة 3 أشهر،
--     مرة واحدة فقط لكل حساب.
--   * كل الاشتراكات (المدفوعة والمكافأة) تصبح مؤقتة بتاريخ انتهاء.
--   * الاشتراك المدفوع الجديد: 12 شهراً. المشتركون الحاليون: 12 شهراً من
--     تاريخ تنفيذ هذا الملف. مكافأة الإحالة: +3 أشهر فوق المتبقي.
--
-- ترتيب التنفيذ:
--   نفّذ هذا الملف بعد supabase_schema.sql (آخر مرحلة)، وبعد أي ملف مرحلة
--   أخرى يعيد تعريف سياسات questions/question_answers/summaries.
--
-- ملاحظة أمنية:
--   كل الكتابة على الإحالات والاشتراك تتم عبر دوال SECURITY DEFINER.
--   المستخدم لا يستطيع تعديل referral_code أو referred_by أو premium_until
--   أو subscription_status مباشرة (سياسة profiles update للمشرف فقط).
-- ============================================================================

-- ───────────────────────── 1) أعمدة الملف الشخصي ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_reward_granted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_fingerprint TEXT;

-- مفتاح أجنبي للمُحيل (لا يُحذف سجل المُحال عند حذف المُحيل).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_referred_by_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_referred_by_fkey
      FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END; $$;

-- ───────────────────────── 2) تعبئة القيم القديمة ─────────────────────────
-- كود إحالة ثابت ومشتق من معرّف المستخدم: 16 حرفاً hex (احتمال التصادم مهمل).
UPDATE public.profiles
SET referral_code = upper(substr(md5(id::text), 1, 16))
WHERE referral_code IS NULL OR referral_code !~ '^[A-F0-9]{16}$';

-- كل مشترك حالي يحصل على 12 شهراً من تاريخ التطبيق.
UPDATE public.profiles
SET premium_until = COALESCE(premium_until, NOW() + INTERVAL '12 months'),
    premium_source = COALESCE(premium_source, 'paid')
WHERE subscription_status = 'premium';

-- ───────────────────────── 3) القيود والفهارس ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referral_code_format') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_referral_code_format
      CHECK (referral_code ~ '^[A-F0-9]{16}$') NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referred_by_not_self') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_referred_by_not_self
      CHECK (referred_by IS NULL OR referred_by <> id) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_premium_source_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_premium_source_check
      CHECK (premium_source IS NULL OR premium_source IN ('paid', 'referral', 'admin')) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_premium_until_required') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_premium_until_required
      CHECK (subscription_status <> 'premium' OR premium_until IS NOT NULL) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_signup_fingerprint_len') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_signup_fingerprint_len
      CHECK (signup_fingerprint IS NULL OR char_length(signup_fingerprint) <= 128) NOT VALID;
  END IF;
END; $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_uidx
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_premium_until_idx
  ON public.profiles (premium_until)
  WHERE subscription_status = 'premium';

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON public.profiles (referred_by)
  WHERE referred_by IS NOT NULL;

-- ───────────────────────── 4) جدول الإحالات ─────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  referred_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  qualified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  signup_fingerprint TEXT,
  risk_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referrals_status_check CHECK (status IN ('pending', 'qualified', 'rejected')),
  CONSTRAINT referrals_not_self CHECK (referrer_id <> referred_id),
  CONSTRAINT referrals_reason_len CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  CONSTRAINT referrals_fingerprint_len CHECK (signup_fingerprint IS NULL OR char_length(signup_fingerprint) <= 128)
);

ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS signup_fingerprint TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS risk_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS referrals_referrer_status_idx
  ON public.referrals (referrer_id, status);

CREATE INDEX IF NOT EXISTS referrals_created_idx
  ON public.referrals (created_at DESC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals read own or admin" ON public.referrals;
DROP POLICY IF EXISTS "referrals read admin" ON public.referrals;
CREATE POLICY "referrals read admin" ON public.referrals
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- لا توجد سياسة قراءة مباشرة للمستخدم على الجدول:
-- يقرأ إحالاته عبر my_referrals() التي تخفي البريد الكامل وبصمة الجهاز.
-- المشرف يرى كل الأعمدة للمراجعة.
-- لا توجد سياسات INSERT/UPDATE/DELETE للمستخدم:
-- التسجيل يتم عبر handle_new_user، والتأهيل/الرفض عبر دوال SECURITY DEFINER.

-- صلاحية القراءة على الجدول: RLS وحدها لا تمنح صلاحية الوصول.
-- المستخدم العادي يحصل على 0 صفوف (السياسة للمشرف فقط)، ويقرأ إحالاته عبر RPC.
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

-- ───────────────────────── 5) توليد الكود وضبط الاشتراك ─────────────────────────
-- يعمل قبل كل كتابة على profiles:
--   * يضمن كود إحالة صالحاً.
--   * يضمن أن أي حساب premium له تاريخ انتهاء.
--   * يمدّد الاشتراك المدفوع 12 شهراً عند أول تفعيل، ويحترم تاريخ
--     مكافأة الإحالة (3 أشهر) عند تفعيلها.
CREATE OR REPLACE FUNCTION public.normalize_profile_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code !~ '^[A-F0-9]{16}$' THEN
    NEW.referral_code := upper(substr(md5(NEW.id::text), 1, 16));
  ELSE
    NEW.referral_code := upper(NEW.referral_code);
  END IF;

  IF NEW.subscription_status = 'premium' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.premium_source IS NULL THEN
        NEW.premium_source := 'paid';
      END IF;
      IF NEW.premium_until IS NULL OR NEW.premium_until <= NOW() THEN
        NEW.premium_until := NOW() +
          CASE WHEN NEW.premium_source = 'referral'
               THEN INTERVAL '3 months'
               ELSE INTERVAL '12 months'
          END;
      END IF;

    ELSIF TG_OP = 'UPDATE' AND OLD.subscription_status <> 'premium' THEN
      IF NEW.premium_source IS NULL THEN
        NEW.premium_source := 'paid';
      END IF;
      IF NEW.premium_until IS NULL OR NEW.premium_until <= NOW() THEN
        IF NEW.premium_source = 'referral' THEN
          NEW.premium_until := NOW() + INTERVAL '3 months';
        ELSE
          -- التجديد/الدفع يُضاف إلى نهاية المتبقي ولا يلغيه.
          NEW.premium_until := GREATEST(COALESCE(OLD.premium_until, NOW()), NOW())
                               + INTERVAL '12 months';
        END IF;
      END IF;

    ELSIF TG_OP = 'UPDATE' AND NEW.premium_until IS NULL THEN
      IF NEW.premium_source IS NULL THEN
        NEW.premium_source := 'paid';
      END IF;
      NEW.premium_until := NOW() +
        CASE WHEN NEW.premium_source = 'referral'
             THEN INTERVAL '3 months'
             ELSE INTERVAL '12 months'
        END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_normalize_referral ON public.profiles;
CREATE TRIGGER profiles_normalize_referral
  BEFORE INSERT OR UPDATE OF referral_code, subscription_status, premium_until, premium_source
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_referral();

-- ───────────────────────── 6) التسجيل: ربط الإحالة ─────────────────────────
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
  v_ref_code TEXT;
  v_referrer UUID;
  v_fingerprint TEXT;
  v_risk JSONB := '{}'::jsonb;
  v_updated INTEGER;
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

  -- كود الإحالة: صيغة صارمة (16 hex) حتى لا تُقبل قيم عشوائية.
  v_ref_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'ref_code', '')));
  IF v_ref_code ~ '^[A-F0-9]{16}$' THEN
    SELECT id INTO v_referrer
    FROM public.profiles
    WHERE referral_code = v_ref_code;
  END IF;

  -- بصمة جهاز اختيارية: تُستخدم كعلم خطر فقط، لا كحجب تلقائي.
  v_fingerprint := trim(COALESCE(NEW.raw_user_meta_data->>'signup_fingerprint', ''));
  IF v_fingerprint !~ '^[A-Za-z0-9_-]{8,128}$' THEN
    v_fingerprint := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, cycle, exam_id, exam_tracks,
    referred_by, signup_fingerprint
  )
  VALUES (
    NEW.id, COALESCE(NEW.email,''), v_name, v_cycle, v_exam,
    jsonb_build_object(v_exam, v_cycle),
    NULL, v_fingerprint
  )
  ON CONFLICT (id) DO NOTHING;

  -- ربط الإحالة في كتلة مستقلة: أي فشل هنا يجب ألا يمنع إنشاء الحساب.
  IF v_referrer IS NOT NULL AND v_referrer <> NEW.id THEN
    BEGIN
      UPDATE public.profiles
      SET referred_by = v_referrer,
          signup_fingerprint = COALESCE(signup_fingerprint, v_fingerprint)
      WHERE id = NEW.id
        AND (referred_by IS NULL OR referred_by = v_referrer);

      GET DIAGNOSTICS v_updated = ROW_COUNT;

      -- لا نُنشئ إحالة إذا كان الحساب مرتبطاً بمُحيل آخر مسبقاً.
      IF v_updated > 0 THEN
        -- نفس البصمة = احتمال إحالة ذاتية/جهاز مشترك؛ تُسجَّل للمراجعة فقط.
        IF v_fingerprint IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = v_referrer AND p.signup_fingerprint = v_fingerprint
        ) THEN
          v_risk := v_risk || jsonb_build_object('same_device', TRUE);
        END IF;

        INSERT INTO public.referrals (
          referred_id, referrer_id, signup_fingerprint, risk_flags
        )
        VALUES (NEW.id, v_referrer, v_fingerprint, v_risk)
        ON CONFLICT (referred_id) DO NOTHING;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'referral link skipped for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- إعادة إنشاء trigger التسجيل لضمان وجوده على قواعد قديمة.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ───────────────────────── 7) تأكيد البريد: إعادة تقييم الأهلية ─────────────────────────
-- قد يكون المستخدم أجاب عن 20 سؤالاً قبل تأكيد البريد؛ عند التأكيد نعيد الفحص.
CREATE OR REPLACE FUNCTION public.handle_user_confirmed_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM public.refresh_referral_qualification(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral confirmation check skipped for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- ───────────────────────── 8) أهلية الإحالة ─────────────────────────
-- شروط الأهلية:
--   1) بريد مؤكد.
--   2) 20 سؤالاً مختلفاً على الأقل.
--   3) نشاط في يومين مختلفين (بتوقيت المغرب).
-- الإحالة تبقى pending حتى تتحقق الشروط، ثم تصبح qualified.
CREATE OR REPLACE FUNCTION public.refresh_referral_qualification(p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer UUID;
  v_status TEXT;
  v_confirmed TIMESTAMPTZ;
  v_questions BIGINT;
  v_days BIGINT;
BEGIN
  IF p_referred_id IS NULL THEN
    RETURN;
  END IF;

  SELECT referrer_id, status
  INTO v_referrer, v_status
  FROM public.referrals
  WHERE referred_id = p_referred_id
  FOR UPDATE;

  IF NOT FOUND OR v_status <> 'pending' THEN
    RETURN;
  END IF;

  SELECT email_confirmed_at
  INTO v_confirmed
  FROM auth.users
  WHERE id = p_referred_id;

  IF v_confirmed IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT question_id),
         COUNT(DISTINCT (answered_at AT TIME ZONE 'Africa/Casablanca')::date)
  INTO v_questions, v_days
  FROM public.question_progress
  WHERE user_id = p_referred_id;

  IF v_questions >= 20 AND v_days >= 2 THEN
    UPDATE public.referrals
    SET status = 'qualified',
        qualified_at = NOW(),
        updated_at = NOW()
    WHERE referred_id = p_referred_id
      AND status = 'pending';

    IF FOUND THEN
      PERFORM public.refresh_referrer_reward(v_referrer);
    END IF;
  END IF;
END;
$$;

-- ───────────────────────── 9) مكافأة المُحيل ─────────────────────────
-- عند 20 إحالة مؤهلة: 3 أشهر تُضاف إلى نهاية الصلاحية الحالية.
-- مرة واحدة فقط لكل حساب عبر referral_reward_granted_at.
CREATE OR REPLACE FUNCTION public.refresh_referrer_reward(p_referrer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_granted TIMESTAMPTZ;
  v_status TEXT;
  v_exam TEXT;
  v_count BIGINT;
BEGIN
  IF p_referrer_id IS NULL THEN
    RETURN;
  END IF;

  -- قفل صف المُحيل: يمنع منح المكافأة مرتين عند تأهيل إحالتين متزامنتين.
  SELECT role, referral_reward_granted_at, subscription_status, exam_id
  INTO v_role, v_granted, v_status, v_exam
  FROM public.profiles
  WHERE id = p_referrer_id
  FOR UPDATE;

  IF NOT FOUND OR v_role = 'admin' OR v_granted IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.referrals
  WHERE referrer_id = p_referrer_id
    AND status = 'qualified';

  IF v_count < 20 THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET subscription_status = 'premium',
      premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + INTERVAL '3 months',
      premium_scope = CASE
        WHEN v_status = 'premium' THEN premium_scope
        ELSE COALESCE(NULLIF(v_exam, ''), 'crmef')
      END,
      premium_source = CASE
        WHEN v_status = 'premium' THEN COALESCE(premium_source, 'paid')
        ELSE 'referral'
      END,
      referral_reward_granted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_referrer_id;

  RAISE NOTICE 'Referral reward granted to %', p_referrer_id;
END;
$$;

-- تأكيد البريد يعيد تقييم الأهلية بعد وجود الدالتين أعلاه.
DROP TRIGGER IF EXISTS on_auth_user_confirmed_referral ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_referral
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_confirmed_referral();

-- ───────────────────────── 10) trigger النشاط ─────────────────────────
-- يعمل بعد كل إجابة جديدة أو إعادة إجابة (answered_at) دون أن يُفشل
-- تسجيل الإجابة إذا حدث خطأ في حساب الإحالة.
CREATE OR REPLACE FUNCTION public.handle_question_progress_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM public.refresh_referral_qualification(NEW.user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral qualification skipped for %: %', NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_question_progress_referral ON public.question_progress;
CREATE TRIGGER on_question_progress_referral
  AFTER INSERT OR UPDATE OF answered_at
  ON public.question_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_question_progress_referral();

-- ───────────────────────── 11) انتهاء الاشتراك ─────────────────────────
-- تُستدعى من cron كل دقيقة، ومن التطبيق عند الدخول (refresh_my_subscription).
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.profiles
    SET subscription_status = 'trial',
        updated_at = NOW()
    WHERE subscription_status = 'premium'
      AND role <> 'admin'
      AND premium_until IS NOT NULL
      AND premium_until <= NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_my_subscription()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  UPDATE public.profiles
  SET subscription_status = 'trial',
      updated_at = NOW()
  WHERE id = v_uid
    AND subscription_status = 'premium'
    AND role <> 'admin'
    AND premium_until IS NOT NULL
    AND premium_until <= NOW();
END;
$$;

-- جدولة انتهاء الاشتراكات إن كان pg_cron مفعّلاً.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('expire-crmef-premium');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    BEGIN
      PERFORM cron.schedule(
        'expire-crmef-premium',
        '* * * * *',
        $cron$SELECT public.expire_due_subscriptions();$cron$
      );
      RAISE NOTICE 'تمت جدولة انتهاء الاشتراكات كل دقيقة.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'تعذر جدولة انتهاء الاشتراكات: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron غير مفعّل: فعّله من Supabase ثم أعد تنفيذ هذا الملف، أو استدعِ public.expire_due_subscriptions() يدوياً.';
  END IF;
END;
$do$;

-- ───────────────────────── 12) واجهات القراءة للمستخدم ─────────────────────────
CREATE OR REPLACE FUNCTION public.my_referral_summary()
RETURNS TABLE (
  referral_code TEXT,
  qualified_count INTEGER,
  pending_count INTEGER,
  rejected_count INTEGER,
  required_count INTEGER,
  remaining_count INTEGER,
  reward_granted_at TIMESTAMPTZ,
  premium_until TIMESTAMPTZ,
  premium_source TEXT,
  subscription_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.referral_code,
    LEAST(COALESCE(r.qualified_count, 0), 20)::INTEGER AS qualified_count,
    COALESCE(r.pending_count, 0)::INTEGER AS pending_count,
    COALESCE(r.rejected_count, 0)::INTEGER AS rejected_count,
    20 AS required_count,
    GREATEST(20 - COALESCE(r.qualified_count, 0), 0)::INTEGER AS remaining_count,
    p.referral_reward_granted_at AS reward_granted_at,
    p.premium_until,
    p.premium_source,
    CASE
      WHEN p.role = 'admin' THEN 'premium'
      WHEN p.subscription_status = 'premium'
           AND (p.premium_until IS NULL OR p.premium_until > NOW())
        THEN 'premium'
      ELSE 'trial'
    END AS subscription_status
  FROM public.profiles p
  LEFT JOIN (
    SELECT referrer_id,
           COUNT(*) FILTER (WHERE status = 'qualified') AS qualified_count,
           COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
           COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count
    FROM public.referrals
    WHERE referrer_id = auth.uid()
    GROUP BY referrer_id
  ) r ON r.referrer_id = p.id
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_referrals()
RETURNS TABLE (
  referred_email TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN p.email IS NULL OR position('@' IN p.email) = 0 THEN 'مستخدم'
      ELSE left(split_part(p.email, '@', 1), 1) || '***@' || split_part(p.email, '@', 2)
    END AS referred_email,
    r.status,
    r.created_at,
    r.qualified_at
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 50;
$$;

-- إعادة تقييم إحالة المستخدم الحالي (مفيدة بعد تأكيد البريد أو عند الدخول).
CREATE OR REPLACE FUNCTION public.refresh_my_referral_status()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  PERFORM public.refresh_referral_qualification(v_uid);
END;
$$;

-- ───────────────────────── 13) إدارة الإحالات والاشتراك ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_reject_referral(
  p_referred_id UUID,
  p_reason TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  UPDATE public.referrals
  SET status = 'rejected',
      rejected_at = NOW(),
      rejection_reason = left(COALESCE(p_reason, ''), 500),
      updated_at = NOW()
  WHERE referred_id = p_referred_id
    AND status <> 'rejected';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REFERRAL_NOT_FOUND_OR_ALREADY_REJECTED';
  END IF;

  -- إذا كانت المكافأة مُنحت سابقاً فلا تُسحب تلقائياً؛
  -- القرار المالي/التعويضي يبقى يدوياً وموثقاً.
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restore_referral(p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  UPDATE public.referrals
  SET status = 'pending',
      qualified_at = NULL,
      rejected_at = NULL,
      rejection_reason = NULL,
      updated_at = NOW()
  WHERE referred_id = p_referred_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REFERRAL_NOT_FOUND';
  END IF;

  -- يعيد الفحص فوراً إن كان النشاط مستوفياً.
  PERFORM public.refresh_referral_qualification(p_referred_id);
END;
$$;

-- تمديد اشتراك يدوياً (للتجديد أو التعويض). يُضاف إلى النهاية ولا يلغيها.
CREATE OR REPLACE FUNCTION public.admin_extend_subscription(
  p_user_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_USER';
  END IF;

  IF p_months IS NULL OR p_months < 1 OR p_months > 60 THEN
    RAISE EXCEPTION 'INVALID_MONTHS';
  END IF;

  UPDATE public.profiles
  SET subscription_status = 'premium',
      premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW())
                      + make_interval(months => p_months),
      premium_source = CASE
        WHEN subscription_status = 'premium' THEN COALESCE(premium_source, 'paid')
        ELSE 'paid'
      END,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING premium_until INTO v_until;

  IF v_until IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  RETURN v_until;
END;
$$;

-- ───────────────────────── 14) تحديث سياسات المحتوى بالتاريخ ─────────────────────────
-- نفس تعريفات المرحلة 2.9 النهائية + شرط premium_until، حتى لا يبقى
-- الوصول مفتوحاً بين انتهاء الصلاحية وتشغيل مهمة cron.
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
            (p.subscription_status = 'premium'
             AND p.premium_scope = 'all'
             AND (p.premium_until IS NULL OR p.premium_until > NOW()))
            -- (ب) مشترك مباراة واحدة: مباراته، في مسلك واحد فقط
            OR (p.subscription_status = 'premium'
                AND p.premium_scope = questions.exam_id
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles)
                AND (p.premium_until IS NULL OR p.premium_until > NOW()))
            -- (ج) مجاني: عيّنة (is_trial) في مسلكه المختار، بنفس الكوطة
            OR (p.subscription_status <> 'premium'
                AND questions.is_trial
                AND COALESCE(p.exam_tracks ->> questions.exam_id, p.cycle) = ANY(questions.cycles))
          )
      )
    )
  );

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
          (p.subscription_status = 'premium'
           AND p.premium_scope = 'all'
           AND (p.premium_until IS NULL OR p.premium_until > NOW()))
          OR (p.subscription_status = 'premium'
              AND p.premium_scope = q.exam_id
              AND COALESCE(p.exam_tracks ->> q.exam_id, p.cycle) = ANY(q.cycles)
              AND (p.premium_until IS NULL OR p.premium_until > NOW()))
        )
    )
  );

DROP POLICY IF EXISTS "summaries read premium or admin" ON public.summaries;
CREATE POLICY "summaries read premium or admin" ON public.summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR (p.subscription_status = 'premium'
              AND (p.premium_until IS NULL OR p.premium_until > NOW()))
        )
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

-- ───────────────────────── 15) الدالة المساعدة is_premium ─────────────────────────
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
      AND (
        role = 'admin'
        OR (subscription_status = 'premium'
            AND (premium_until IS NULL OR premium_until > NOW()))
      )
  );
$$;

-- ───────────────────────── 16) الصلاحيات ─────────────────────────
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.handle_user_confirmed_referral() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.normalize_profile_referral() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.handle_question_progress_referral() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.refresh_referral_qualification(UUID) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.refresh_referrer_reward(UUID) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC, authenticated, anon;

REVOKE ALL ON FUNCTION public.refresh_my_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_my_subscription() TO authenticated;

REVOKE ALL ON FUNCTION public.refresh_my_referral_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_my_referral_status() TO authenticated;

REVOKE ALL ON FUNCTION public.my_referral_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_summary() TO authenticated;

REVOKE ALL ON FUNCTION public.my_referrals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referrals() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_reject_referral(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_referral(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_restore_referral(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_restore_referral(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_extend_subscription(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_extend_subscription(UUID, INTEGER) TO authenticated;

REVOKE ALL ON FUNCTION public.is_premium(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;

-- service_role قد يحتاج استدعاء مهمة الانتهاء يدوياً من لوحة الإدارة.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role';
  END IF;
END; $$;

-- ───────────────────────── 17) تحقق نهائي بعد التنفيذ ─────────────────────────
-- نفّذ الملف كاملاً (Ctrl+A ثم Run). يجب أن يعرض هذا الاستعلام صفاً واحداً:
--   status = OK، columns_found = 6، وكل الأعمدة المنطقية = true.
SELECT
  'OK' AS status,
  (
    SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN (
        'referral_code', 'referred_by', 'premium_until',
        'premium_source', 'referral_reward_granted_at', 'signup_fingerprint'
      )
  ) AS columns_found,
  (to_regclass('public.referrals') IS NOT NULL) AS referrals_table,
  (to_regprocedure('public.my_referral_summary()') IS NOT NULL) AS summary_rpc,
  (to_regprocedure('public.my_referrals()') IS NOT NULL) AS list_rpc,
  (to_regprocedure('public.expire_due_subscriptions()') IS NOT NULL) AS expiry_rpc,
  (to_regprocedure('public.refresh_referral_qualification(uuid)') IS NOT NULL) AS qualification_rpc,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_question_progress_referral'
      AND tgrelid = 'public.question_progress'::regclass
  ) AS activity_trigger;

-- فحوصات إضافية بعد التطبيق (اختيارية):
-- SELECT id, email, referral_code, referred_by, subscription_status, premium_until
-- FROM public.profiles LIMIT 10;
--
-- SELECT public.expire_due_subscriptions();
--
-- SELECT jobid, jobname, schedule, command, active
-- FROM cron.job WHERE jobname = 'expire-crmef-premium';
