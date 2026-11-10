-- ==============================================================================
-- تَحْسِينَاتُ الإِدَارَةِ وَتَتَبُّعِ الإِشْتِرَاكَاتِ وَالرَّفْعِ - CRMEF PREP
-- ==============================================================================

-- 1. جدول تسجيل نقرات زر الترقية (Upgrade Clicks)
CREATE TABLE IF NOT EXISTS public.upgrade_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS upgrade_clicks_user_idx ON public.upgrade_clicks (user_id);
CREATE INDEX IF NOT EXISTS upgrade_clicks_time_idx ON public.upgrade_clicks (clicked_at DESC);

ALTER TABLE public.upgrade_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upgrade_clicks insert all" ON public.upgrade_clicks;
CREATE POLICY "upgrade_clicks insert all" ON public.upgrade_clicks
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "upgrade_clicks read admin" ON public.upgrade_clicks;
CREATE POLICY "upgrade_clicks read admin" ON public.upgrade_clicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) OR user_id = auth.uid()
  );

-- 2. جدول تسجيل محاولات رفع الوصل (سواء نجحت أو فشلت لتشخيص أي مشكل)
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
CREATE INDEX IF NOT EXISTS receipt_upload_attempts_time_idx ON public.receipt_upload_attempts (created_at DESC);

ALTER TABLE public.receipt_upload_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receipt_upload_attempts insert all" ON public.receipt_upload_attempts;
CREATE POLICY "receipt_upload_attempts insert all" ON public.receipt_upload_attempts
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "receipt_upload_attempts read admin" ON public.receipt_upload_attempts;
CREATE POLICY "receipt_upload_attempts read admin" ON public.receipt_upload_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. جدول تتبع التذكيرات الآلية (Automated Reminders)
CREATE TABLE IF NOT EXISTS public.upgrade_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS upgrade_reminders_email_idx ON public.upgrade_reminders (user_email);

ALTER TABLE public.upgrade_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upgrade_reminders all admin" ON public.upgrade_reminders;
CREATE POLICY "upgrade_reminders all admin" ON public.upgrade_reminders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. التأكد من دعم حالة 'suspended' في طلبات الاشتراك
ALTER TABLE public.subscription_requests DROP CONSTRAINT IF EXISTS subscription_requests_status_check;
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 5. توسيع قيود نوع الصورة في مخزن receipts إن وجدت
DO $$
BEGIN
  UPDATE storage.buckets
  SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/jpg'],
      max_file_size = 10485760 -- 10MB
  WHERE id = 'receipts';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
