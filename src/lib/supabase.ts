import { createClient } from '@supabase/supabase-js';
import type { Question, SubjectKey } from '../types';
import { SUBJECT_NAMES } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl.startsWith('https://') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEY = 'crmef_custom_questions_v1';

// الحصول على الأسئلة المحلية المضافة على جهاز المشرف فقط (وضع عدم الاتصال)
function getLocalCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Question[]) : [];
  } catch (e) {
    console.error('Error reading localStorage', e);
    return [];
  }
}

// حفظ الأسئلة محلياً
function saveLocalCustomQuestions(questions: Question[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

/** تحقق مشترك من سلامة بنية السؤال قبل الحفظ (يستخدمه المشرف). */
export function validateQuestion(q: Partial<Question>): string | null {
  if (!q.id || typeof q.id !== 'string' || !q.id.trim()) return 'معرّف السؤال مطلوب.';
  if (!q.subject || !(q.subject in SUBJECT_NAMES)) return 'مادة السؤال غير صالحة.';
  if (!q.topic || !q.topic.trim()) return 'محور السؤال مطلوب.';
  if (!q.question || !q.question.trim()) return 'نص السؤال مطلوب.';
  if (!Array.isArray(q.options) || q.options.length < 2) {
    return 'يجب أن يحتوي السؤال على خيارين على الأقل.';
  }
  if (q.options.some((opt) => typeof opt !== 'string' || !opt.trim())) {
    return 'جميع الخيارات يجب أن تكون نصوصاً غير فارغة.';
  }
  if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
    return 'الجواب الصحيح يجب أن يطابق أحد الخيارات نصاً.';
  }
  if (new Set(q.options).size !== q.options.length) {
    return 'لا يمكن تكرار نفس الخيار مرتين.';
  }
  return null;
}

/**
 * جلب الأسئلة المسموح بها لحساب المتصل.
 * النموذج المدفوع: التجريبي يرى فقط is_trial (أول 20 لكل مادة) بلا إجابات،
 * والمشترك الكامل/المشرف يرى البنك كاملاً مع الإجابات (عند توفرها).
 * لا يوجد بنك مدمج في الحزمة: المصدر الوحيد هو Supabase.
 */
export async function getQuestions(isAdmin = false): Promise<Question[]> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      'خدمة الأسئلة غير مهيأة. يرجى ضبط إعدادات Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) وإعادة النشر.'
    );
  }

  const client = supabase;

  // 1. الأسئلة العامة (بلا إجابات) — RLS يحدد المشاهدة حسب الاشتراك.
  const PAGE = 1000;
  let offset = 0;
  const rows: any[] = [];
  for (;;) {
    const { data, error } = await client
      .from('questions')
      .select('id, cycles, subject, topic, question, options, is_trial, exam_id')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) {
      throw new Error(`تعذر جلب الأسئلة من Supabase: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  const mergedMap = new Map<string, Question>();
  rows.forEach((row: any) => {
    mergedMap.set(row.id, {
      id: row.id,
      exam_id: row.exam_id || 'crmef',
      subject: row.subject as SubjectKey,
      topic: row.topic || '',
      question: row.question,
      options: Array.isArray(row.options) ? row.options : [],
      // الإجابة لا تُرسل للتجريبي أبداً (بلا عمود في الجدول أصلاً).
      correct_answer: undefined,
      explanation: undefined,
      cycles: row.cycles || (
        String(row.subject).startsWith('sec_')
          ? ['secondary_prep', 'secondary_qual']
          : row.subject === 'edu'
          ? ['primary', 'secondary_prep', 'secondary_qual']
          : ['primary']
      ),
    } as Question);
  });

  // 2. الإجابات: المشرف يقرأها مباشرة، والكامل يتحقق منها عبر الدالة عند الإجابة.
  // للمشرف ندمجها هنا لتظهر في لوحة الإدارة.
  if (isAdmin) {
    try {
      const answerRows: any[] = [];
      let ansOffset = 0;
      for (;;) {
        const { data, error } = await client
          .from('question_answers')
          .select('question_id, correct_answer, explanation')
          .range(ansOffset, ansOffset + PAGE - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        answerRows.push(...data);
        if (data.length < PAGE) break;
        ansOffset += PAGE;
      }
      answerRows.forEach((a: any) => {
        const q = mergedMap.get(a.question_id);
        if (q) {
          q.correct_answer = a.correct_answer;
          q.explanation = a.explanation || '';
        }
      });
    } catch (err) {
      console.warn('question_answers fetch failed (admin view):', err);
    }
  }

  // 3. دمج الأسئلة المضافة محلياً على جهاز المشرف (وضع عدم الاتصال)
  if (isAdmin) {
    getLocalCustomQuestions().forEach((q) => mergedMap.set(q.id, q));
  }

  return Array.from(mergedMap.values());
}

// إضافة سؤال فردي (نص في questions + إجابة في question_answers)
export async function addQuestion(question: Question): Promise<{ success: boolean; error?: string }> {
  const validationError = validateQuestion(question);
  if (validationError) return { success: false, error: validationError };

  const baseRow = {
    id: question.id,
    subject: question.subject,
    topic: question.topic,
    question: question.question,
    options: question.options,
    cycles: question.cycles || (question.subject === 'edu'
      ? ['primary', 'secondary_prep', 'secondary_qual']
      : question.subject.startsWith('sec_')
      ? ['secondary_prep', 'secondary_qual']
      : ['primary']),
  };

  if (isSupabaseConfigured() && supabase) {
    const client = supabase;
    const { error } = await client.from('questions').upsert(baseRow);
    if (error) {
      return { success: false, error: `فشل الحفظ في Supabase: ${error.message}` };
    }
    const { error: answerError } = await client.from('question_answers').upsert({
      question_id: question.id,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
    });
    if (answerError) {
      return { success: false, error: `حُفظ نص السؤال لكن فشل حفظ الإجابة: ${answerError.message}` };
    }
    return { success: true };
  }

  // وضع محلي فقط عند غياب إعدادات Supabase
  const current = getLocalCustomQuestions().filter((q) => q.id !== question.id);
  current.push(question);
  saveLocalCustomQuestions(current);
  return { success: true };
}

// رفع دفعة أسئلة (Bulk Upload)
export async function bulkAddQuestions(questions: Question[]): Promise<{ count: number; error?: string }> {
  if (!questions || questions.length === 0) {
    return { count: 0, error: 'لا توجد أسئلة للرفع' };
  }

  // رفض المعرفات المكررة داخل الدفعة نفسها.
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) return { count: 0, error: `معرّف مكرر داخل الدفعة: ${q.id}` };
    seen.add(q.id);
  }

  for (let i = 0; i < questions.length; i++) {
    const validationError = validateQuestion(questions[i]);
    if (validationError) {
      return { count: 0, error: `السؤال رقم ${i + 1}: ${validationError}` };
    }
  }

  const baseRows = questions.map((q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    question: q.question,
    options: q.options,
    cycles: q.cycles || (q.subject === 'edu'
      ? ['primary', 'secondary_prep', 'secondary_qual']
      : q.subject.startsWith('sec_')
      ? ['secondary_prep', 'secondary_qual']
      : ['primary']),
  }));
  const answerRows = questions.map((q) => ({
    question_id: q.id,
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
  }));

  if (isSupabaseConfigured() && supabase) {
    const client = supabase;
    const { error } = await client.from('questions').upsert(baseRows);
    if (error) {
      return { count: 0, error: `فشل رفع الأسئلة إلى Supabase: ${error.message}` };
    }
    const { error: answerError } = await client.from('question_answers').upsert(answerRows);
    if (answerError) {
      return { count: 0, error: `رفُعت الأسئلة لكن فشل رفع الإجابات: ${answerError.message}` };
    }
    return { count: questions.length };
  }

  // وضع محلي فقط
  const current = getLocalCustomQuestions();
  const currentMap = new Map<string, Question>();
  current.forEach((q) => currentMap.set(q.id, q));
  questions.forEach((q) => currentMap.set(q.id, q));
  saveLocalCustomQuestions(Array.from(currentMap.values()));
  return { count: questions.length };
}

// حذف سؤال (الإجابة أولاً لأنها مرجع FK، ثم النص)
export async function removeQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const client = supabase;
    const { error: answerError } = await client.from('question_answers').delete().eq('question_id', id);
    if (answerError) {
      return { success: false, error: `تعذر حذف إجابة السؤال من Supabase: ${answerError.message}` };
    }
    const { error } = await client.from('questions').delete().eq('id', id);
    if (error) {
      return { success: false, error: `تعذر حذف السؤال من Supabase: ${error.message}` };
    }
  }

  const current = getLocalCustomQuestions();
  saveLocalCustomQuestions(current.filter((q) => q.id !== id));
  return { success: true };
}


// ─── إشعار المشتركين بأسئلة جديدة ───────────────────────────────────────────
/**
 * يُرسل إيميل إشعار لجميع المشتركين المفعّلين (subscription_status = 'premium')
 * عبر Supabase Edge Function notify-subscribers.
 * يستدعيها المشرف فقط من QuestionManager بعد رفع أسئلة جديدة.
 */
export async function notifySubscribersNewQuestions(opts: {
  questionCount: number;
  examName?: string;
  adminName?: string;
}): Promise<{ success: boolean; sent?: number; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase غير مهيأ' };
  }

  try {
    // 1. جلب إيميلات المشتركين المفعّلين مباشرة
    const { data: premiumProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('subscription_status', 'premium')
      .neq('role', 'admin');

    if (profErr) {
      return { success: false, error: `تعذر جلب قائمة المشتركين: ${profErr.message}` };
    }

    const recipients = (premiumProfiles || []).filter((p: { email: string | null; full_name: string | null }) => p.email);
    if (recipients.length === 0) {
      return { success: true, sent: 0 };
    }

    // 2. استدعاء Edge Function (إن وُجدت) أو تسجيل الإشعار في جدول notifications_log
    const { error: fnErr } = await supabase.functions.invoke('notify-new-questions', {
      body: {
        recipients: recipients.map((p: { email: string | null; full_name: string | null }) => ({
          email: p.email,
          name: p.full_name || p.email,
        })),
        questionCount: opts.questionCount,
        examName: opts.examName || 'مباراة التعليم (CRMEF)',
        adminName: opts.adminName || 'فريق CRMEF Prep',
      },
    });

    if (fnErr) {
      // Edge Function غير منشورة بعد — نسجّل الطلب في جدول notifications_log للمعالجة اليدوية
      console.warn('notify-new-questions edge function not available, logging instead:', fnErr.message);
      await supabase.from('notifications_log').insert({
        type: 'new_questions',
        question_count: opts.questionCount,
        exam_name: opts.examName || 'crmef',
        recipients_count: recipients.length,
        status: 'pending',
        created_at: new Date().toISOString(),
      }).then(() => {});
      // نُعيد نجاحاً جزئياً مع تنبيه
      return {
        success: true,
        sent: 0,
        error: `تم تسجيل الإشعار (${recipients.length} مشترك). Edge Function غير منشورة بعد — سيُرسَل الإيميل بعد نشرها.`,
      };
    }

    return { success: true, sent: recipients.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'خطأ غير متوقع' };
  }
}

// ─── تعدد المباريات (المرحلة 2: القوائم من قاعدة البيانات، ببديل ثابت آمن) ───

export interface SubjectRowConfig {
  key: string;
  name: string;
  cycles: string[];
  weight: number;
  isActive: boolean;
}

export interface ExamRowConfig {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  icon: string;
  color: string;
  isActive: boolean;
  questionCount: number;
}

/** إعدادات المباريات من جدول exams (يشمل عدد الأسئلة لكل مباراة). قائمة فارغة عند الفشل. */
export async function getExamConfigs(): Promise<{ exams: ExamRowConfig[]; fromDb: boolean }> {
  if (!supabase) return { exams: [], fromDb: false };
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('id, slug, name, short_name, description, icon, color, is_active, sort_order, questions(count)')
      .order('sort_order', { ascending: true });
    if (error || !data) {
      console.warn('exams fetch failed, keeping static fallback:', error?.message);
      return { exams: [], fromDb: false };
    }
    const exams: ExamRowConfig[] = data.map((row: Record<string, unknown>) => {
      const counts = (row.questions as unknown as Array<{ count: number }> | null) ?? [];
      return {
        id: String(row.id),
        name: String(row.name),
        shortName: (row.short_name as string | null) ?? null,
        description: (row.description as string | null) ?? null,
        icon: String(row.icon || 'graduation'),
        color: String(row.color || 'emerald'),
        isActive: Boolean(row.is_active),
        questionCount: counts[0]?.count ?? 0,
      };
    });
    return { exams, fromDb: true };
  } catch (e) {
    console.warn('exams fetch exception:', e);
    return { exams: [], fromDb: false };
  }
}

/** مواد مباراة معينة من جدول subjects — فارغة عند الفشل (لا تغيير سلوك). */
export async function getSubjectConfigs(examId: string): Promise<{ subjects: SubjectRowConfig[]; fromDb: boolean }> {
  if (!supabase || !examId) return { subjects: [], fromDb: false };
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('key, name, cycles, weight, is_active')
      .eq('exam_id', examId)
      .order('weight', { ascending: false });
    if (error || !data || data.length === 0) {
      console.warn('subjects fetch failed, keeping static fallback:', error?.message);
      return { subjects: [], fromDb: false };
    }
    const subjects: SubjectRowConfig[] = data.map((row: Record<string, unknown>) => ({
      key: String(row.key),
      name: String(row.name),
      cycles: Array.isArray(row.cycles) ? (row.cycles as string[]) : [],
      weight: Number(row.weight ?? 1),
      isActive: Boolean(row.is_active),
    }));
    return { subjects, fromDb: true };
  } catch (e) {
    console.warn('subjects fetch exception:', e);
    return { subjects: [], fromDb: false };
  }
}

// ─── ربط ملف المستخدم بالمباراة المختارة (المستخدم ليفس المباريات المنفردة السلك) ───

/** يستدعي RPC الخادمي set_profile_exam — لالتقاط مباراة المستخدم تلقائياً عند اختياره. */
export async function setProfileExam(examId: string): Promise<void> {
  if (!supabase || !examId) return;
  try {
    await supabase.rpc('set_profile_exam', { p_exam_id: examId });
  } catch {
    // استدعاء صامت — التقاط المباراة خدمة إحصائية لا شرط للعب.
  }
}

// ─── المرحلة 3: رفع حزمة مباراة (exam_package.json) عبر RPC خادمي للمشرف فقط ───
export interface ExamImportSummary {
  exam_id: string;
  name: string;
  subjects: number;
  questions: number;
  trial: number;
  answers: number;
  summaries: number;
}

/** رفع حزمة كاملة ذرياً: كل شيء ينجح أو لا شيء (يتحقق الخادم من القواعد أيضاً). */
export async function importExamPackage(
  pkg: unknown
): Promise<{ success: boolean; summary?: ExamImportSummary; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase غير مهيأ — أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.' };
  }
  try {
    const { data, error } = await supabase.rpc('import_exam_package', { p_package: pkg as object });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, summary: data as ExamImportSummary };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'خطأ غير متوقع أثناء الرفع.' };
  }
}
