/**
 * مدقّق حزمة المباراة exam_package.json (المرحلة 3) — نسخة الواجهة من قواعد
 * SKILL_EXAM_CONTENT.md §1.1/§2/§3. التحقق الحاسم يكرره خادمياً
 * دالة import_exam_package (supabase_import_exam_rpc.sql) قبل الأدراح والتظليل.
 * هنا التقرير المسبق للمشرف: إحصائيات + أخطاء قاطعة (يُمنع الرفع عند وجودها).
 */

export interface ExamPackageCycle { id: string; name: string }
export interface ExamPackageSubject { key: string; name: string; cycles: string[]; weight: number }
export interface ExamPackageSection { heading: string; paragraphs: string[] }
export interface ExamPackageSummary { id: string; title: string; category: string; cycle: string; readTime?: string; sections: ExamPackageSection[] }
export interface ExamPackageQuestion {
  id: string;
  cycles: string[];
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}
export interface ExamPackage {
  package_version: string;
  exam: {
    name: string;
    slug: string;
    description?: string;
    cycles: ExamPackageCycle[];
    // امتدادات v2.0 اختيارية تُستتلم إن وُجدت:
    short_name?: string;
    icon?: string;
    color?: string;
    is_active?: boolean;
    sort_order?: number;
  };
  subjects: ExamPackageSubject[];
  questions: ExamPackageQuestion[];
  summaries?: ExamPackageSummary[];
}

export interface PackageStats {
  subjects: number;
  questions: number;
  summaries: number;
  trial: number;
  perSubject: Array<{ key: string; name: string; count: number; trial: number }>;
  positions: number[]; // توزيع مواضع الجواب الصحيح (0-based) لكشف انحياز التخمين
}

export interface PackageValidationResult {
  ok: boolean;
  errors: string[];
  errorCount: number;
  examSlug: string;
  examName: string;
  stats: PackageStats;
}

const MAX_ERRORS_SHOWN = 40;

function isNonEmptyStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

export function validateExamPackage(raw: unknown): PackageValidationResult {
  const errors: string[] = [];
  const push = (msg: string) => { if (errors.length < MAX_ERRORS_SHOWN) errors.push(msg); };

  const emptyStats: PackageStats = {
    subjects: 0, questions: 0, summaries: 0, trial: 0, perSubject: [], positions: [0, 0, 0, 0],
  };

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['الملف كائن JSON مطلوب (وليس مصفوفة أو نصاً).'], errorCount: 1, examSlug: '', examName: '', stats: emptyStats };
  }
  const pkg = raw as ExamPackage;

  if (pkg.package_version !== '1.0') {
    push(`package_version يجب أن يكون "1.0" (وجد: ${JSON.stringify(pkg.package_version)}).`);
  }

  const ex = (pkg.exam || {}) as ExamPackage['exam'];
  const slug = (ex.slug || '').toLowerCase();
  if (!/^[a-z0-9_]{3,40}$/.test(slug)) {
    push('exam.slug: 3-40 حرفاً من [a-z0-9_] فقط.');
  }
  if (!isNonEmptyStr(ex.name) || ex.name.length > 160) {
    push('exam.name: نص مطلوب بحد 160 حرفاً.');
  }

  // الأسلاك المعلنة (معيارية فقط)
  const cycleIds = new Set<string>();
  const cycleNames = new Set<string>();
  if (!Array.isArray(ex.cycles) || ex.cycles.length === 0) {
    push('exam.cycles: مصفوفة بسلك واحد على الأقل مطلوبة.');
  } else {
    ex.cycles.forEach((c, i) => {
      const id = (c?.id || '').toLowerCase();
      if (!['primary', 'secondary_prep', 'secondary_qual'].includes(id)) {
        push(`exam.cycles[${i}].id خارج المعيار (primary / secondary_prep / secondary_qual).`);
      } else if (!isNonEmptyStr(c?.name) || c.name.length > 60) {
        push(`exam.cycles[${i}].name: نص معروض مطلوب بحد 60.`);
      } else {
        cycleIds.add(id);
        cycleNames.add(c.name.trim());
      }
    });
  }

  // المواد المعلنة
  const subjectKeys = new Set<string>();
  const subjectNames = new Map<string, string>();
  if (!Array.isArray(pkg.subjects) || pkg.subjects.length === 0) {
    push('subjects: مصفوفة بمادة واحدة على الأقل مطلوبة.');
  } else {
    pkg.subjects.forEach((s, i) => {
      const key = (s?.key || '').toLowerCase();
      if (!/^[a-z0-9_]{3,50}$/.test(key)) push(`subjects[${i}].key: 3-50 حرفاً من [a-z0-9_].`);
      else if (subjectKeys.has(key)) push(`subjects[${i}]: المفتاح مكرر (${key}).`);
      else subjectKeys.add(key);

      if (!isNonEmptyStr(s?.name) || s.name.length > 160) push(`subjects[${i}].name: نص مطلوب بحد 160.`);
      else subjectNames.set(key || `؟[${i}]`, s.name.trim());

      if (!Array.isArray(s?.cycles) || s.cycles.length === 0) {
        push(`subjects[${i}].cycles: مصفوفة معرفات مطلوبة.`);
      } else {
        s.cycles.forEach((c) => {
          if (!cycleIds.has(c)) push(`subjects[${i}]: cycle غير معلن (${c}).`);
        });
      }
      if (typeof s?.weight !== 'number' || !Number.isFinite(s.weight) || s.weight <= 0 || s.weight > 9999) {
        push(`subjects[${i}].weight: عدد موجب ≤ 9999.`);
      }
    });
  }

  // الأسئلة (قواعد §2)
  const qIds = new Set<string>();
  const perSubject = new Map<string, number>();
  const positions = [0, 0, 0, 0];
  let questionsCount = 0;
  if (!Array.isArray(pkg.questions) || pkg.questions.length === 0) {
    push('questions: مصفوفة بسؤال واحد على الأقل مطلوبة.');
  } else {
    questionsCount = pkg.questions.length;
    pkg.questions.forEach((q, idx) => {
      const id = (q?.id || '').toLowerCase();
      if (!/^[a-z0-9_]{2,30}[0-9]{3}$/.test(id)) {
        push(`questions[${idx}].id: بادئة + 3 أرقام مكمّلة (${id || 'فارغ'}).`);
      } else if (qIds.has(id)) push(`questions[${idx}]: معرف مكرر (${id}).`);
      else qIds.add(id);

      if ('is_trial' in (q || ({} as Record<string, unknown>))) {
        push(`questions[${idx}]: حقل is_trial محظور — يُعيَّن تلقائياً (أول 20/مادة).`);
      }
      if (!subjectKeys.has((q?.subject || '').toLowerCase())) {
        push(`questions[${idx}]: مادة غير معلنة في subjects (${q?.subject || '؟'}).`);
      }
      if (!isNonEmptyStr(q?.topic)) push(`questions[${idx}]: topic فارغ.`);
      if (!isNonEmptyStr(q?.question)) push(`questions[${idx}]: نص السؤال فارغ.`);

      const opts = Array.isArray(q?.options) ? q.options : null;
      if (!opts || opts.length !== 4) {
        push(`questions[${idx}]: options يجب أن تكون 4 خيارات بالضبط (وجد: ${opts ? opts.length : '؟'}).`);
      } else if (opts.some((o) => !isNonEmptyStr(o)) || new Set(opts).size !== 4) {
        push(`questions[${idx}]: خيارات فارغة أو مكررة (4 مختلفة بالضبط).`);
      } else {
        const correct = q?.correct_answer;
        if (!isNonEmptyStr(correct) || !opts.includes(correct)) {
          push(`questions[${idx}]: correct_answer يجب أن يطابق حرفياً أحد الخيارات.`);
        } else {
          positions[opts.indexOf(correct)]++;
        }
      }

      if (!isNonEmptyStr(q?.explanation)) push(`questions[${idx}]: explanation مطلوب (تعليل لا يكرر الخيار).`);
      if (!Array.isArray(q?.cycles) || q.cycles.length === 0) {
        push(`questions[${idx}]: cycles مصفوفة غير فارغة.`);
      } else {
        q.cycles.forEach((c) => { if (!cycleIds.has(c)) push(`questions[${idx}]: cycle غير معلن (${c}).`); });
      }

      perSubject.set((q?.subject || '؟') as string, (perSubject.get((q?.subject || '؟') as string) || 0) + 1);
    });
  }

  // الملخصات (اختيارية)
  let summariesCount = 0;
  const sIds = new Set<string>();
  if (pkg.summaries !== undefined && pkg.summaries !== null && !Array.isArray(pkg.summaries)) {
    push('summaries: يجب أن تكون مصفوفة (أو حذف الحقل).');
  } else if (Array.isArray(pkg.summaries)) {
    summariesCount = pkg.summaries.length;
    pkg.summaries.forEach((s, idx) => {
      const id = (s?.id || '').toLowerCase();
      if (!/^[a-z0-9_]{6,64}$/.test(id)) push(`summaries[${idx}].id: معرف لاتيني صغير (بادئة sum_ موصى بها).`);
      else if (sIds.has(id)) push(`summaries[${idx}]: معرف مكرر (${id}).`);
      else sIds.add(id);

      if (!isNonEmptyStr(s?.title) || !isNonEmptyStr(s?.category)) push(`summaries[${idx}]: title/category مطلوبة.`);
      if (!cycleNames.has((s?.cycle || '').trim())) push(`summaries[${idx}]: cycle باسمه المعروض في exam.cycles مطلوب (${s?.cycle || '؟'}).`);

      if (!Array.isArray(s?.sections) || s.sections.length === 0) {
        push(`summaries[${idx}]: sections فارغة.`);
      } else {
        s.sections.forEach((sec, si) => {
          if (!isNonEmptyStr(sec?.heading)) push(`summaries[${idx}].sections[${si}].heading فارغ.`);
          if (!Array.isArray(sec?.paragraphs) || sec.paragraphs.length === 0) {
            push(`summaries[${idx}].sections[${si}].paragraphs فارغة.`);
          } else if (sec.paragraphs.some((p) => !isNonEmptyStr(p))) {
            push(`summaries[${idx}].sections[${si}]: فقرة فارغة (نص مطلوب، أو "---" فاصل).`);
          }
        });
      }
    });
  }

  const trialTotal = (() => {
    // عدد العيّنات = مجموع min(20, عدد أسئلة المادة) — نفس منطق الخادم
    let t = 0;
    perSubject.forEach((c) => { t += Math.min(20, c); });
    return t;
  })();

  const perSubjectArr = Array.from(subjectNames.entries()).map(([key, name]) => ({
    key,
    name,
    count: perSubject.get(key) || 0,
    trial: Math.min(20, perSubject.get(key) || 0),
  }));

  return {
    ok: errors.length === 0,
    errors,
    errorCount: errors.length,
    examSlug: slug,
    examName: ex.name || '',
    stats: {
      subjects: subjectKeys.size,
      questions: questionsCount,
      summaries: summariesCount,
      trial: trialTotal,
      perSubject: perSubjectArr,
      positions,
    },
  };
}
