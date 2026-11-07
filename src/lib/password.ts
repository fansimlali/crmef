// فحص كلمة المرور في المتصفح للإرشاد فقط. الفرض الحقيقي يتم في إعدادات Supabase Auth.
const COMMON = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', '12341234',
  'password', 'password1', 'password123', 'azerty123', 'qwertyuiop', 'qwerty123',
  'motdepasse', 'admin123', 'admin1234', 'admin123456', 'iloveyou1', 'abcd1234',
]);

const LABELS = ['ضعيفة جدا', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'];

export interface PasswordCheck {
  ok: boolean;
  score: number; // من 0 إلى 4
  label: string;
  issues: string[];
}

export function checkPassword(password: string, email = ''): PasswordCheck {
  const issues: string[] = [];

  if (password.length < 8) issues.push('8 أحرف على الأقل');
  if (COMMON.has(password.toLowerCase())) issues.push('كلمة مرور شائعة جدا');
  if (password.length > 0 && /^(.)\1+$/.test(password)) issues.push('حرف واحد مكرر');

  const local = email.split('@')[0].toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    issues.push('تتضمن جزءا من بريدك');
  }

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;

  let score = 0;
  if (issues.length === 0) {
    score = 1;
    if (password.length >= 10) score++;
    if (password.length >= 14) score++;
    if (classes >= 3) score++;
  }

  return { ok: issues.length === 0, score, label: LABELS[score], issues };
}
