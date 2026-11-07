export type SubjectKey = 
  | 'ma' 
  | 'fr' 
  | 'ar' 
  | 'sc' 
  | 'dma' 
  | 'dfr' 
  | 'dar' 
  | 'dsc' 
  | 'edu';

export interface Question {
  id: string;
  subject: SubjectKey;
  topic: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export type ConfidenceLevel = 'متأكد' | 'متردد' | 'تخمين' | 'لا أعرف';

export interface ExamRecord {
  id: string;
  subject: SubjectKey;
  topic: string;
  question: string;
  chosen: string | null;
  correct: string;
  isCorrect: boolean;
  confidence: ConfidenceLevel;
  timeSpentSeconds: number;
  changeCount: number;
  explanation?: string;
}

export interface ExamSessionResult {
  phase: 'قبلي' | 'بعدي';
  date: string;
  totalQuestions: number;
  correctAnswersCount: number;
  scoreOutOf20: number;
  records: ExamRecord[];
  subjectStats: Record<string, { total: number; correct: number; percentage: number; weight: number }>;
  topicStats: Record<string, { total: number; correct: number; percentage: number }>;
  metaStats: {
    falseConfidence: number; // متأكد وأخطأ
    luckyGuess: number;      // تخمين وصح
    hesitantCorrect: number; // متردد وصح
    unknown: number;         // لا أعرف
  };
}

export const SUBJECT_NAMES: Record<SubjectKey, string> = {
  ar: 'اللغة العربية',
  fr: 'اللغة الفرنسية',
  ma: 'الرياضيات',
  sc: 'العلوم والنشاط العلمي',
  dar: 'ديداكتيك العربية',
  dfr: 'ديداكتيك الفرنسية',
  dma: 'ديداكتيك الرياضيات',
  dsc: 'ديداكتيك العلوم',
  edu: 'علوم التربية ومستجدات المنظومة',
};

export const SUBJECT_WEIGHTS: Record<SubjectKey, number> = {
  ar: 6,
  fr: 6,
  ma: 6,
  sc: 2,
  dar: 3,
  dfr: 3,
  dma: 3,
  dsc: 3,
  edu: 8,
};

export const CONFIDENCE_OPTIONS: ConfidenceLevel[] = [
  'متأكد',
  'متردد',
  'تخمين',
  'لا أعرف'
];

