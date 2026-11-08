import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lwicejthksskkhfsilky.supabase.co';

if (!serviceRoleKey) {
  console.error('❌ يرجى تمرير مفتاح service_role:');
  console.error('node scripts/upload_to_supabase.mjs <SERVICE_ROLE_SECRET_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function upload() {
  const seedFile = path.join(__dirname, '..', 'questions_seed.json');
  if (!fs.existsSync(seedFile)) {
    console.error('❌ لم يتم العثور على questions_seed.json');
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  console.log(`🚀 بدء رفع ${questions.length} سؤالاً إلى Supabase...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const chunk = questions.slice(i, i + BATCH_SIZE);

    // 1. إدراج الأسئلة
    const questionRows = chunk.map(q => ({
      id: q.id,
      cycles: q.cycles || ['primary'],
      subject: q.subject,
      topic: q.topic,
      question: q.question,
      options: q.options
    }));

    const { error: qError } = await supabase
      .from('questions')
      .upsert(questionRows, { onConflict: 'id' });

    if (qError) {
      console.error(`❌ خطأ في إدراج الأسئلة (دفعة ${i}-${i + chunk.length}):`, qError.message);
      process.exit(1);
    }

    // 2. إدراج الإجابات
    const answerRows = chunk.map(q => ({
      question_id: q.id,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null
    }));

    const { error: aError } = await supabase
      .from('question_answers')
      .upsert(answerRows, { onConflict: 'question_id' });

    if (aError) {
      console.error(`❌ خطأ في إدراج الإجابات (دفعة ${i}-${i + chunk.length}):`, aError.message);
      process.exit(1);
    }

    process.stdout.write(`✅ تم رفع ${Math.min(i + BATCH_SIZE, questions.length)} / ${questions.length} سؤالاً وإجابة...\r`);
  }

  console.log('\n🎯 تحديث كوطة العينة المجانية (is_trial)...');
  // تحديث is_trial لأول 20 سؤالاً لكل مادة
  // جلب المواد
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('id, subject')
    .order('id', { ascending: true });

  if (allQuestions) {
    const subjectCounts = {};
    const trialIds = [];
    for (const q of allQuestions) {
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      if (subjectCounts[q.subject] <= 20) {
        trialIds.push(q.id);
      }
    }

    // تحديث trialIds إلى true
    for (let i = 0; i < trialIds.length; i += 200) {
      const slice = trialIds.slice(i, i + 200);
      await supabase.from('questions').update({ is_trial: true }).in('id', slice);
    }
  }

  console.log('🎉 اكتمل الرفع بنجاح! جميع الأسئلة والإجابات تم إدراجها في قاعدة البيانات.');
}

upload().catch(err => {
  console.error('❌ حدث خطأ غير متوقع:', err);
  process.exit(1);
});

