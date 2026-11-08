const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'molakhasat');
const files = fs.readdirSync(dir).filter(f => f.startsWith('0') || f.startsWith('1'));

console.log('Found summary files:', files.length);

const articles = [];

const fileMeta = {
  '01_ديداكتيك_وعلوم_التربية_الابتدائي.md': {
    id: 'sum_pri_edu',
    title: 'ملخص علوم التربية والديداكتيك العام (الابتدائي)',
    category: 'علوم التربية ومدرسة الريادة',
    cycle: 'ابتدائي مزدوج',
    readTime: '10 دقائق قراءة'
  },
  '02_اللغة_العربية_وديداكتيكها_ابتدائي.md': {
    id: 'sum_pri_ar',
    title: 'ملخص اللغة العربية وديداكتيكها (الابتدائي)',
    category: 'اللغة العربية وديداكتيكها',
    cycle: 'ابتدائي مزدوج',
    readTime: '12 دقيقة قراءة'
  },
  '03_اللغة_الفرنسية_وديداكتيكها_ابتدائي.md': {
    id: 'sum_pri_fr',
    title: 'ملخص اللغة الفرنسية وديداكتيكها (الابتدائي)',
    category: 'Français et Didactique',
    cycle: 'ابتدائي مزدوج',
    readTime: '12 دقيقة قراءة'
  },
  '04_الرياضيات_وديداكتيكها_ابتدائي.md': {
    id: 'sum_pri_ma',
    title: 'ملخص الرياضيات وديداكتيكها (الابتدائي)',
    category: 'الرياضيات وديداكتيكها',
    cycle: 'ابتدائي مزدوج',
    readTime: '12 دقيقة قراءة'
  },
  '05_النشاط_العلمي_وديداكتيكه_ابتدائي.md': {
    id: 'sum_pri_sc',
    title: 'ملخص النشاط العلمي ونهج التقصي (الابتدائي)',
    category: 'النشاط العلمي وديداكتيكه',
    cycle: 'ابتدائي مزدوج',
    readTime: '10 دقائق قراءة'
  },
  '06_علوم_التربية_المشترك_للثانوي.md': {
    id: 'sum_sec_edu',
    title: 'ملخص علوم التربية والمستجدات (الثانوي)',
    category: 'علوم التربية وسيكولوجيا المراهق',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '10 دقائق قراءة'
  },
  '07_الرياضيات_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_math',
    title: 'ملخص مادة الرياضيات وديداكتيكها (الثانوي)',
    category: 'الرياضيات وديداكتيكها',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '08_الفيزياء_والكيمياء_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_physics',
    title: 'ملخص مادة الفيزياء والكيمياء وديداكتيكها (الثانوي)',
    category: 'الفيزياء والكيمياء',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '09_علوم_الحياة_والأرض_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_svt',
    title: 'ملخص علوم الحياة والأرض وديداكتيكها (الثانوي)',
    category: 'علوم الحياة والأرض',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '10_اللغة_العربية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_ar',
    title: 'ملخص مادة اللغة العربية وديداكتيكها (الثانوي)',
    category: 'اللغة العربية وديداكتيكها',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '11_اللغة_الفرنسية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_fr',
    title: 'ملخص مادة اللغة الفرنسية وديداكتيكها (الثانوي)',
    category: 'Français et Didactique',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '12_اللغة_الإنجليزية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_eng',
    title: 'ملخص مادة اللغة الإنجليزية وديداكتيكها (الثانوي)',
    category: 'English & ELT Didactics',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '12 دقيقة قراءة'
  },
  '13_التربية_الإسلامية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_islamic',
    title: 'ملخص مادة التربية الإسلامية وديداكتيكها (الثانوي)',
    category: 'التربية الإسلامية وديداكتيكها',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '14_التاريخ_والجغرافيا_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_hist_geo',
    title: 'ملخص التاريخ والجغرافيا وديداكتيكها (الثانوي)',
    category: 'التاريخ والجغرافيا والمواطنة',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '15_المعلوميات_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_cs',
    title: 'ملخص مادة المعلوميات وديداكتيكها (الثانوي)',
    category: 'المعلوميات والتفكير الحاسوبي',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '16_التكنولوجيا_الصناعية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_te',
    title: 'ملخص التكنولوجيا الصناعية وديداكتيكها (الإعدادي)',
    category: 'التكنولوجيا الصناعية',
    cycle: 'ثانوي إعدادي',
    readTime: '12 دقيقة قراءة'
  },
  '17_التربية_البدنية_والرياضية_وديداكتيكها_ثانوي.md': {
    id: 'sum_sec_pe',
    title: 'ملخص التربية البدنية والرياضية وديداكتيكها (الثانوي)',
    category: 'التربية البدنية والرياضية',
    cycle: 'ثانوي إعدادي وتأهيلي',
    readTime: '12 دقيقة قراءة'
  },
  '18_الفلسفة_وديداكتيكها_ثانوي_تأهيلي.md': {
    id: 'sum_sec_philo',
    title: 'ملخص مادة الفلسفة وديداكتيكها (التأهيلي)',
    category: 'الفلسفة وديداكتيك التفلسف',
    cycle: 'ثانوي تأهيلي',
    readTime: '15 دقيقة قراءة'
  },
  '19_العلوم_الاقتصادية_والتدبير_ثانوي_تأهيلي.md': {
    id: 'sum_sec_eco',
    title: 'ملخص الاقتصاد والتدبير وديداكتيكها (التأهيلي)',
    category: 'علوم الاقتصاد والتدبير',
    cycle: 'ثانوي تأهيلي',
    readTime: '15 دقيقة قراءة'
  }
};

files.sort().forEach(file => {
  const meta = fileMeta[file];
  if (!meta) return;

  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');

  const sections = [];
  let currentHeading = 'مقدمة ومدخل تمهيدي';
  let currentParas = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('# ')) continue; // skip main doc title

    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentParas.length > 0) {
        sections.push({
          heading: currentHeading,
          paragraphs: [...currentParas]
        });
        currentParas = [];
      }
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
    } else {
      currentParas.push(line);
    }
  }

  if (currentParas.length > 0) {
    sections.push({
      heading: currentHeading,
      paragraphs: [...currentParas]
    });
  }

  articles.push({
    ...meta,
    sections
  });
});

const tsCode = `export interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  cycle: string;
  readTime: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export const SUMMARIES_DATA: SummaryArticle[] = ${JSON.stringify(articles, null, 2)};
`;

// IMPORTANT: paid content must never be written into src/, otherwise it is
// bundled into the public JavaScript. It is generated into the gitignored
// scripts/seed-data folder and then exported to SQL by export_summaries.mjs.
const outputDir = path.join(__dirname, 'seed-data');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'summariesData.ts');

fs.writeFileSync(outputPath, tsCode, 'utf8');
console.log('Successfully generated', outputPath, 'with', articles.length, 'articles.');

