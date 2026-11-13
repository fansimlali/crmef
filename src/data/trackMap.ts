// خريطة المسالك — مولَّدة من scripts/build_track_map.cjs (لا تُحرّر يدوياً).
// تحدّد: لكل مباراة ← المسالك ← المواد (المفتاح/الاسم/المعامل) — تُستخدم في نافذة الرفع
// وفي عرض «المسلك» و«الموضوع» للمستخدم.

export interface TrackSubject {
  key: string;
  name: string;
  weight: number;
}

export interface TrackDef {
  id: string;
  name: string;
  desc?: string;
  subjects: TrackSubject[];
}

export interface ExamTracks {
  id: string;
  name: string;
  tracks: TrackDef[];
}

export const EXAM_TRACK_MAP: ExamTracks[] = [
  {
    "id": "crmef",
    "name": "مباراة التعليم",
    "tracks": [
      {
        "id": "primary",
        "name": "سلك التعليم الابتدائي",
        "desc": "التخصص المزدوج + ديداكتيك المواد + علوم التربية",
        "subjects": [
          {
            "key": "ar",
            "name": "اللغة العربية (ابتدائي)",
            "weight": 6
          },
          {
            "key": "fr",
            "name": "اللغة الفرنسية (ابتدائي)",
            "weight": 6
          },
          {
            "key": "ma",
            "name": "الرياضيات (ابتدائي)",
            "weight": 6
          },
          {
            "key": "sc",
            "name": "العلوم والنشاط العلمي (ابتدائي)",
            "weight": 2
          },
          {
            "key": "dar",
            "name": "ديداكتيك العربية (ابتدائي)",
            "weight": 3
          },
          {
            "key": "dfr",
            "name": "ديداكتيك الفرنسية (ابتدائي)",
            "weight": 3
          },
          {
            "key": "dma",
            "name": "ديداكتيك الرياضيات (ابتدائي)",
            "weight": 3
          },
          {
            "key": "dsc",
            "name": "ديداكتيك العلوم (ابتدائي)",
            "weight": 3
          },
          {
            "key": "edu",
            "name": "علوم التربية ومستجدات المنظومة",
            "weight": 8
          }
        ]
      },
      {
        "id": "secondary_prep",
        "name": "سلك التعليم الثانوي الإعدادي",
        "desc": "مادة التخصص + ديداكتيك التخصص + علوم التربية",
        "subjects": [
          {
            "key": "edu",
            "name": "علوم التربية ومستجدات المنظومة",
            "weight": 8
          },
          {
            "key": "sec_math",
            "name": "الرياضيات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_math",
            "name": "ديداكتيك الرياضيات (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_physics",
            "name": "الفيزياء والكيمياء وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_physics",
            "name": "ديداكتيك الفيزياء والكيمياء",
            "weight": 12
          },
          {
            "key": "sec_svt",
            "name": "علوم الحياة والأرض وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_svt",
            "name": "ديداكتيك علوم الحياة والأرض",
            "weight": 12
          },
          {
            "key": "sec_ar",
            "name": "اللغة العربية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_ar",
            "name": "ديداكتيك اللغة العربية (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_fr",
            "name": "اللغة الفرنسية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_fr",
            "name": "ديداكتيك اللغة الفرنسية (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_eng",
            "name": "اللغة الإنجليزية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_eng",
            "name": "ديداكتيك اللغة الإنجليزية",
            "weight": 12
          },
          {
            "key": "sec_islamic",
            "name": "التربية الإسلامية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_islamic",
            "name": "ديداكتيك التربية الإسلامية",
            "weight": 12
          },
          {
            "key": "sec_hist_geo",
            "name": "التاريخ والجغرافيا / الاجتماعيات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_hist_geo",
            "name": "ديداكتيك التاريخ والجغرافيا",
            "weight": 12
          },
          {
            "key": "sec_cs",
            "name": "المعلوميات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_cs",
            "name": "ديداكتيك المعلوميات",
            "weight": 12
          },
          {
            "key": "sec_pe",
            "name": "التربية البدنية والرياضية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_te",
            "name": "التكنولوجيا الصناعية وديداكتيكها (إعدادي)",
            "weight": 20
          }
        ]
      },
      {
        "id": "secondary_qual",
        "name": "سلك التعليم الثانوي التأهيلي",
        "desc": "مادة التخصص + ديداكتيك التخصص + علوم التربية",
        "subjects": [
          {
            "key": "edu",
            "name": "علوم التربية ومستجدات المنظومة",
            "weight": 8
          },
          {
            "key": "sec_math",
            "name": "الرياضيات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_math",
            "name": "ديداكتيك الرياضيات (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_physics",
            "name": "الفيزياء والكيمياء وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_physics",
            "name": "ديداكتيك الفيزياء والكيمياء",
            "weight": 12
          },
          {
            "key": "sec_svt",
            "name": "علوم الحياة والأرض وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_svt",
            "name": "ديداكتيك علوم الحياة والأرض",
            "weight": 12
          },
          {
            "key": "sec_ar",
            "name": "اللغة العربية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_ar",
            "name": "ديداكتيك اللغة العربية (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_fr",
            "name": "اللغة الفرنسية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_fr",
            "name": "ديداكتيك اللغة الفرنسية (ثانوي)",
            "weight": 12
          },
          {
            "key": "sec_eng",
            "name": "اللغة الإنجليزية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_eng",
            "name": "ديداكتيك اللغة الإنجليزية",
            "weight": 12
          },
          {
            "key": "sec_islamic",
            "name": "التربية الإسلامية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_islamic",
            "name": "ديداكتيك التربية الإسلامية",
            "weight": 12
          },
          {
            "key": "sec_hist_geo",
            "name": "التاريخ والجغرافيا / الاجتماعيات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_hist_geo",
            "name": "ديداكتيك التاريخ والجغرافيا",
            "weight": 12
          },
          {
            "key": "sec_cs",
            "name": "المعلوميات وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_d_cs",
            "name": "ديداكتيك المعلوميات",
            "weight": 12
          },
          {
            "key": "sec_pe",
            "name": "التربية البدنية والرياضية وديداكتيكها (ثانوي)",
            "weight": 20
          },
          {
            "key": "sec_philo",
            "name": "الفلسفة وديداكتيكها (ثانوي تأهيلي)",
            "weight": 20
          },
          {
            "key": "sec_d_philo",
            "name": "ديداكتيك الفلسفة",
            "weight": 12
          },
          {
            "key": "sec_eco",
            "name": "العلوم الاقتصادية والتدبير وديداكتيكها (تأهيلي)",
            "weight": 20
          },
          {
            "key": "sec_d_eco",
            "name": "ديداكتيك الاقتصاد والتدبير",
            "weight": 12
          }
        ]
      }
    ]
  },
  {
    "id": "tarbawiyin",
    "name": "مباراة أطر المختصين",
    "tracks": [
      {
        "id": "primary",
        "name": "مسلك تكوين المختصين التربويين",
        "desc": "",
        "subjects": [
          {
            "key": "tadbir_mali_mohasabati",
            "name": "التدبير المالي والمحاسباتي لمؤسسات التربية والتعليم العمومي",
            "weight": 1
          },
          {
            "key": "khas_tarbawi",
            "name": "الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين التربويين)",
            "weight": 1
          },
          {
            "key": "tadbir_idari_tarbawi",
            "name": "التدبير الإداري والتدبيري لمؤسسات التربية والتعليم العمومي",
            "weight": 1
          },
          {
            "key": "khas_iqtisad",
            "name": "الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك الاقتصاد والتدبير — مختبرات مدرسية / حراسة تربوية وتوثيق)",
            "weight": 1
          },
          {
            "key": "tahlil_nafsia_ijtimaiya",
            "name": "تحليل ظاهرة نفسية واجتماعية",
            "weight": 1
          },
          {
            "key": "khas_ijtimai",
            "name": "الاختصاصات أو المهام المرتبطة بالوظيفة المطلوب شغلها (مسلك المختصين الاجتماعيين)",
            "weight": 1
          }
        ]
      },
      {
        "id": "secondary_prep",
        "name": "مسلك تكوين أطر مختصي الاقتصاد والتدبير",
        "desc": "",
        "subjects": []
      },
      {
        "id": "secondary_qual",
        "name": "مسلك تكوين أطر المختصين الاجتماعيين",
        "desc": "",
        "subjects": []
      }
    ]
  }
];

/** مسالك مباراة معيّنة (بترتيب ثابت). */
export function getTracksOfExam(examId: string | null | undefined): TrackDef[] {
  if (!examId) return [];
  return EXAM_TRACK_MAP.find((e) => e.id === examId)?.tracks ?? [];
}

/** المواد المنتمية لمسلك في مباراة. */
export function getSubjectsOfTrack(examId: string | null | undefined, trackId: string): TrackSubject[] {
  return getTracksOfExam(examId).find((t) => t.id === trackId)?.subjects ?? [];
}
