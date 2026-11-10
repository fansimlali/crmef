import { supabase } from './supabase';

export interface UploadAttemptLog {
  userId?: string | null;
  userEmail?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'success' | 'failed';
  errorMessage?: string | null;
}

/**
 * تسجيل كل نقرة على زر رفع الوصل في قاعدة البيانات حتى عند الفشل لتشخيص أي مشكل بدقة.
 */
export async function logReceiptUploadAttempt(log: UploadAttemptLog): Promise<void> {
  // 1. تسجيل محلي احتياطي دائم في المتصفح
  try {
    const LOCAL_KEY = 'crmef_receipt_upload_attempts';
    const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    existing.unshift({ ...log, timestamp: new Date().toISOString() });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }

  // 2. تسجيل في جدول Supabase
  try {
    if (supabase) {
      await supabase.from('receipt_upload_attempts').insert({
        user_id: log.userId || null,
        user_email: log.userEmail || null,
        file_name: log.fileName,
        file_size: log.fileSize,
        file_type: log.fileType,
        status: log.status,
        error_message: log.errorMessage || null,
      });
    }
  } catch (err) {
    console.warn('Failed to log receipt upload attempt to Supabase:', err);
  }
}

/**
 * تسجيل نقرة المستخدم على زر الترقية لفتح نافذة الاشتراك.
 */
export async function recordUpgradeClick(userId?: string | null, userEmail?: string | null): Promise<void> {
  try {
    // 1. تخزين محلي
    const LOCAL_KEY = 'crmef_upgrade_clicks';
    const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    existing.unshift({ userId, userEmail, clickedAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {
    // تجاهل
  }

  // 2. تسجيل في Supabase
  try {
    if (supabase) {
      await supabase.from('upgrade_clicks').insert({
        user_id: userId || null,
        user_email: userEmail || null,
      });
    }
  } catch (err) {
    console.warn('Failed to log upgrade click to Supabase:', err);
  }
}
