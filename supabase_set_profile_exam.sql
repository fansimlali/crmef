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
