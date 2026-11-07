import { createClient } from '@supabase/supabase-js';
import type { Question } from '../types';
import { INITIAL_QUESTIONS } from '../data/initialQuestions';

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

// الحصول على الأسئلة المحلية المضافة
function getLocalCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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

// جلب جميع الأسئلة
export async function getQuestions(): Promise<Question[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, falling back to local data:', error.message);
      } else if (data && data.length > 0) {
        return data as Question[];
      }
    } catch (err) {
      console.warn('Network error reaching Supabase, using local fallback:', err);
    }
  }

  // في حال عدم توفر Supabase أو عدم وجود بيانات به: الدمج بين الأسئلة الأساسية وما أضافه المستخدم محلياً
  const localAdded = getLocalCustomQuestions();
  const mergedMap = new Map<string, Question>();
  INITIAL_QUESTIONS.forEach(q => mergedMap.set(q.id, q));
  localAdded.forEach(q => mergedMap.set(q.id, q));

  return Array.from(mergedMap.values());
}

// إضافة سؤال فردي
export async function addQuestion(question: Question): Promise<{ success: boolean; error?: string }> {
  let supabaseSuccess = false;
  let supabaseErrorMsg = '';

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('questions').upsert({
        id: question.id,
        subject: question.subject,
        topic: question.topic,
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation || ''
      });

      if (!error) {
        supabaseSuccess = true;
      } else {
        supabaseErrorMsg = error.message;
      }
    } catch (e: any) {
      supabaseErrorMsg = e?.message || 'Network error';
    }
  }

  // حفظ في التخزين المحلي أيضاً للاستخدام في وضع Offline
  const current = getLocalCustomQuestions();
  const filtered = current.filter(q => q.id !== question.id);
  filtered.push(question);
  saveLocalCustomQuestions(filtered);

  if (isSupabaseConfigured() && !supabaseSuccess) {
    return { success: false, error: `فشل الحفظ في Supabase: ${supabaseErrorMsg}. تم الحفظ محلياً.` };
  }

  return { success: true };
}

// رفع دفعة أسئلة (Bulk Upload)
export async function bulkAddQuestions(questions: Question[]): Promise<{ count: number; error?: string }> {
  if (!questions || questions.length === 0) {
    return { count: 0, error: 'لا توجد أسئلة للرفع' };
  }

  let errorMsg = '';
  if (isSupabaseConfigured() && supabase) {
    try {
      const rows = questions.map(q => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || ''
      }));

      const { error } = await supabase.from('questions').upsert(rows);
      if (error) {
        errorMsg = error.message;
      }
    } catch (e: any) {
      errorMsg = e?.message || 'خطأ في الاتصال بقاعدة البيانات';
    }
  }

  // حفظ أيضاً محلياً
  const current = getLocalCustomQuestions();
  const currentMap = new Map<string, Question>();
  current.forEach(q => currentMap.set(q.id, q));
  questions.forEach(q => currentMap.set(q.id, q));
  saveLocalCustomQuestions(Array.from(currentMap.values()));

  return { count: questions.length, error: errorMsg ? `تحذير: ${errorMsg}. تم الحفظ محلياً.` : undefined };
}

// مسح وحذف سؤال
export async function removeQuestion(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('questions').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }

  const current = getLocalCustomQuestions();
  saveLocalCustomQuestions(current.filter(q => q.id !== id));
  return true;
}
