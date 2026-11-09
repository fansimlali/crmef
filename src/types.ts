export type CycleKey = 
  | 'primary'          // سلك التعليم الابتدائي (مزدوج)
  | 'primary_amazigh'  // سلك التعليم الابتدائي (أمازيغية) - غير متاحة في التطبيق
  | 'secondary_prep'   // سلك التعليم الثانوي الإعدادي
  | 'secondary_qual';  // سلك التعليم الثانوي التأهيلي

export interface CycleDefinition {
  id: CycleKey;
  name: string;
  badge: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
}

export const CYCLES: CycleDefinition[] = [
  {
    id: 'primary',
    name: 'سلك التعليم الابتدائي – التخصص المزدوج',
    badge: 'ابتدائي مزدوج',
    description: 'مواد التخصص (20) + ديداكتيك المواد (12) + علوم التربية (8).',
    available: true,
  },
  {
    id: 'secondary_prep',
    name: 'سلك التعليم الثانوي الإعدادي',
    badge: 'ثانوي إعدادي',
    description: 'مادة التخصص (20) + ديداكتيك مادة التخصص (12) + علوم التربية (8).',
    available: true,
  },
  {
    id: 'secondary_qual',
    name: 'سلك التعليم الثانوي التأهيلي',
    badge: 'ثانوي تأهيلي',
    description: 'مادة التخصص (20) + ديداكتيك مادة التخصص (12) + علوم التربية (8).',
    available: true,
  },
  {
    id: 'primary_amazigh',
    name: 'سلك التعليم الابتدائي – تخصص اللغة الأمازيغية',
    badge: 'أمازيغية',
    description: 'تخصص اللغة الأمازيغية وديداكتيكها.',
    available: false,
    unavailableReason: 'غير متاحة في التطبيق',
  },
];

export type SubjectKey = 
  // مواد الابتدائي
  | 'ma' 
  | 'fr' 
  | 'ar' 
  | 'sc' 
  | 'dma' 
  | 'dfr' 
  | 'dar' 
  | 'dsc' 
  | 'edu'
  // تخصصات وديداكتيك الثانوي الإعدادي والتأهيلي
  | 'sec_philo'        // الفلسفة
  | 'sec_d_philo'      // ديداكتيك الفلسفة
  | 'sec_math'         // الرياضيات ثانوي
  | 'sec_d_math'       // ديداكتيك الرياضيات ثانوي
  | 'sec_physics'      // الفيزياء والكيمياء
  | 'sec_d_physics'    // ديداكتيك الفيزياء والكيمياء
  | 'sec_svt'          // علوم الحياة والأرض
  | 'sec_d_svt'        // ديداكتيك علوم الحياة والأرض
  | 'sec_ar'           // اللغة العربية ثانوي
  | 'sec_d_ar'         // ديداكتيك العربية ثانوي
  | 'sec_fr'           // اللغة الفرنسية ثانوي
  | 'sec_d_fr'         // ديداكتيك الفرنسية ثانوي
  | 'sec_eng'          // اللغة الإنجليزية
  | 'sec_d_eng'        // ديداكتيك الإنجليزية
  | 'sec_islamic'      // التربية الإسلامية
  | 'sec_d_islamic'    // ديداكتيك التربية الإسلامية
  | 'sec_hist_geo'     // التاريخ والجغرافيا / الاجتماعيات
  | 'sec_d_hist_geo'   // ديداكتيك التاريخ والجغرافيا
  | 'sec_cs'           // المعلوميات
  | 'sec_d_cs'         // ديداكتيك المعلوميات
  | 'sec_eco'          // علوم الاقتصاد والتدبير
  | 'sec_d_eco'        // ديداكتيك الاقتصاد والتدبير
  | 'sec_pe'           // التربية البدنية والرياضية
  | 'sec_te';          // التكنولوجيا

export type SubscriptionStatus = 'trial' | 'premium' | 'suspended';

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  cycle: CycleKey;
  receiptUrl: string;
  receiptPath?: string;
  receiptName?: string;
  paymentMethod?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  subscriptionStatus: SubscriptionStatus;
  cycle?: CycleKey;
  sessionId?: string;
}

/**
 * سؤال كما يراه العميل.
 * النموذج المدفوع: `correct_answer`/`explanation` تُرسَل للمشرف والكامل فقط،
 * وتبقى فارغة للتجريبي (الإجابة تُتحقق منها خادمياً عبر دالة answer_question).
 */
export interface Question {
  id: string;
  cycles?: CycleKey[]; // إن لم تُحدد، يتم اشتقاقها من المادة. علوم التربية edu صالحة لجميع الأسلاك!
  subject: SubjectKey;
  topic: string;
  question: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
}

/** نتيجة تحقق الخادم بعد الإجابة (من دالة answer_question). */
export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  cycle: string;
  readTime: string;
  sections: { heading: string; paragraphs: string[] }[];
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

export const SUBJECT_NAMES: Record<SubjectKey, string> = {
  // الابتدائي
  ar: 'اللغة العربية (ابتدائي)',
  fr: 'اللغة الفرنسية (ابتدائي)',
  ma: 'الرياضيات (ابتدائي)',
  sc: 'العلوم والنشاط العلمي (ابتدائي)',
  dar: 'ديداكتيك العربية (ابتدائي)',
  dfr: 'ديداكتيك الفرنسية (ابتدائي)',
  dma: 'ديداكتيك الرياضيات (ابتدائي)',
  dsc: 'ديداكتيك العلوم (ابتدائي)',
  edu: 'علوم التربية ومستجدات المنظومة (مشترك لجميع الأسلاك)',
  
  // الثانوي
  sec_philo: 'الفلسفة وديداكتيكها (ثانوي تأهيلي)',
  sec_d_philo: 'ديداكتيك الفلسفة',
  sec_math: 'الرياضيات وديداكتيكها (ثانوي)',
  sec_d_math: 'ديداكتيك الرياضيات (ثانوي)',
  sec_physics: 'الفيزياء والكيمياء وديداكتيكها (ثانوي)',
  sec_d_physics: 'ديداكتيك الفيزياء والكيمياء',
  sec_svt: 'علوم الحياة والأرض وديداكتيكها (ثانوي)',
  sec_d_svt: 'ديداكتيك علوم الحياة والأرض',
  sec_ar: 'اللغة العربية وديداكتيكها (ثانوي)',
  sec_d_ar: 'ديداكتيك اللغة العربية (ثانوي)',
  sec_fr: 'اللغة الفرنسية وديداكتيكها (ثانوي)',
  sec_d_fr: 'ديداكتيك اللغة الفرنسية (ثانوي)',
  sec_eng: 'اللغة الإنجليزية وديداكتيكها (ثانوي)',
  sec_d_eng: 'ديداكتيك اللغة الإنجليزية',
  sec_islamic: 'التربية الإسلامية وديداكتيكها (ثانوي)',
  sec_d_islamic: 'ديداكتيك التربية الإسلامية',
  sec_hist_geo: 'التاريخ والجغرافيا / الاجتماعيات وديداكتيكها (ثانوي)',
  sec_d_hist_geo: 'ديداكتيك التاريخ والجغرافيا',
  sec_cs: 'المعلوميات وديداكتيكها (ثانوي)',
  sec_d_cs: 'ديداكتيك المعلوميات',
  sec_eco: 'العلوم الاقتصادية والتدبير وديداكتيكها (تأهيلي)',
  sec_d_eco: 'ديداكتيك الاقتصاد والتدبير',
  sec_pe: 'التربية البدنية والرياضية وديداكتيكها (ثانوي)',
  sec_te: 'التكنولوجيا الصناعية وديداكتيكها (إعدادي)',
};

// المعاملات الرسمية لسلك الابتدائي
export const PRIMARY_WEIGHTS: Partial<Record<SubjectKey, number>> = {
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

// المعاملات الرسمية لسلك الثانوي (الإعدادي والتأهيلي)
// مادة التخصص: 20، ديداكتيك التخصص: 12، علوم التربية: 8
export function getSubjectWeight(cycle: CycleKey, sub: SubjectKey): number {
  if (cycle === 'primary') {
    return PRIMARY_WEIGHTS[sub] || 1;
  }
  // للثانوي:
  if (sub === 'edu') return 8;
  if (sub.startsWith('sec_d_') || sub.startsWith('d')) return 12;
  return 20; // مادة التخصص
}

export const CONFIDENCE_OPTIONS: ConfidenceLevel[] = [
  'متأكد',
  'متردد',
  'تخمين',
  'لا أعرف'
];
