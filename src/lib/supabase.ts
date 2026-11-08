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
      .select('id, cycles, subject, topic, question, options, is_trial')
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
