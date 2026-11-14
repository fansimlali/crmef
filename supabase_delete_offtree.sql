-- ============================================================================
-- حذف الأسئلة والأجوبة الخارجة عن التوصيف الرسمي (الابتدائي)
--   • مادة اللغة العربية (main): «البلاغة» — ٨ أسئلة (exam=crmef، مادة ar)
--   • مادة العلوم (main): «الحركة والقوة والطاقة» — ١٤ سؤالاً (exam=crmef، مادة sc)
-- تُنفَّذ مرة واحدة في Supabase SQL Editor — الحذف لا رجعة فيه.
--
-- المنهج: DELETE من الخاص أولاً (question_progress، question_answers)
--        ثم من public.questions (الترتيب مهم للاشتراط الأجنبي).
-- ============================================================================

-- 1) احذف من جدول تقدم المستخدمين (أجوبتهم المحفوظة)
DELETE FROM public.question_progress
WHERE question_id IN (
  SELECT id FROM public.questions
  WHERE (subject = 'ar' AND topic = 'البلاغة')
     OR (subject = 'sc' AND topic = 'الحركة والقوة والطاقة')
);

-- 2) احذف من جدول الإجابات المحمية للأسئلة نفسها
DELETE FROM public.question_answers
WHERE question_id IN (
  SELECT id FROM public.questions
  WHERE (subject = 'ar' AND topic = 'البلاغة')
     OR (subject = 'sc' AND topic = 'الحركة والقوة والطاقة')
);

-- 3) احذف الأسئلة نفسها
DELETE FROM public.questions
WHERE (subject = 'ar' AND topic = 'البلاغة')
   OR (subject = 'sc' AND topic = 'الحركة والقوة والطاقة');

-- 4) تحقق بعد التنفيذ (يجب 0):
-- SELECT count(*) FROM public.questions WHERE subject='ar' AND topic='البلاغة';
-- SELECT count(*) FROM public.questions WHERE subject='sc' AND topic='الحركة والقوة والطاقة';
