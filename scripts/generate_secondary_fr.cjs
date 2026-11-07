const fs = require('fs');
const path = require('path');

// ==============================================================================
// 1. أسئلة اللغة الفرنسية للثانوي (sec_fr) - 65 سؤالاً: cfr101-cfr115 و cfr151-cfr200
// ==============================================================================
const frQuestions = [
  // --- cfr101 إلى cfr115 (15 سؤالاً) ---
  {
    id: "cfr101",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et syntaxe",
    question: "Dans la phrase : « Bien qu'il ... malade, il est venu travailler », quel mode et forme verbale faut-il employer ?",
    options: ["soit (subjonctif présent)", "est (indicatif présent)", "serait (conditionnel)", "fut (passé simple)"],
    correct_answer: "soit (subjonctif présent)",
    explanation: "La locution conjonctive de concession « bien que » exige toujours le subjonctif : « bien qu'il soit »."
  },
  {
    id: "cfr102",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et syntaxe",
    question: "Quelle est la fonction de la proposition entre crochets dans : « L'idée [que tu proposes] me paraît intéressante » ?",
    options: ["Proposition subordonnée relative, complément de l'antécédent « idée »", "Proposition subordonnée complétive", "Proposition circonstancielle de cause", "Proposition principale"],
    correct_answer: "Proposition subordonnée relative, complément de l'antécédent « idée »",
    explanation: "Introduite par le pronom relatif « que » qui reprend l'antécédent nominal « idée » (que tu proposes l'idée)."
  },
  {
    id: "cfr103",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "Quelle figure de style est employée dans : « Cette obscure clarté qui tombe des étoiles » (Corneille, Le Cid) ?",
    options: ["Un oxymore", "Une hyperbole", "Une métonymie", "Une litote"],
    correct_answer: "Un oxymore",
    explanation: "L'oxymore unit deux termes contradictoires dans un même syntagme (« obscure clarté ») pour créer un effet saisissant."
  },
  {
    id: "cfr104",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "Quelle figure de style consiste à désigner le contenu par le contenant dans : « Boire un verre » ?",
    options: ["Une métonymie", "Une métaphore", "Une allitération", "Une antiphrase"],
    correct_answer: "Une métonymie",
    explanation: "La métonymie repose sur un lien logique de contiguïté, ici l'emploi du contenant (« verre ») pour désigner le contenu liquide."
  },
  {
    id: "cfr105",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe grammaticale",
    question: "Choisissez la bonne orthographe pour compléter : « Les efforts que ce projet a ... ont été immenses. »",
    options: ["coûtés", "coûté", "coûter", "coûtée"],
    correct_answer: "coûté",
    explanation: "Avec les verbes de mesure/prix (coûter, valoir, peser, mesurer), le participe passé reste invariable lorsque le complément exprime un prix ou une quantité."
  },
  {
    id: "cfr106",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Concordance des temps",
    question: "Complétez selon la concordance au passé : « Il m'a assuré qu'il ... le lendemain. »",
    options: ["viendrait (conditionnel présent)", "viendra (futur simple)", "vienne (subjonctif)", "est venu"],
    correct_answer: "viendrait (conditionnel présent)",
    explanation: "Le conditionnel présent exprime le « futur dans le passé » après un verbe introducteur conjugué à un temps du passé."
  },
  {
    id: "cfr107",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature et mouvements",
    question: "Quel mouvement littéraire du XIXe siècle, représenté par Zola et Maupassant, applique la méthode scientifique expérimentale au roman ?",
    options: ["Le Naturalisme", "Le Romantisme", "Le Classicisme", "Le Surréalisme"],
    correct_answer: "Le Naturalisme",
    explanation: "Le naturalisme approfondit le réalisme en appliquant les théories de l'hérédité et du milieu social à l'analyse romanesque."
  },
  {
    id: "cfr108",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature maghrébine",
    question: "Qui est l'auteur du célèbre roman autobiographique marocain « La Boîte à Merveilles » publié en 1954 ?",
    options: ["Ahmed Sefrioui", "Driss Chraïbi", "Tahar Ben Jelloun", "Abdellatif Laâbi"],
    correct_answer: "Ahmed Sefrioui",
    explanation: "Ahmed Sefrioui est l'auteur pionnier de « La Boîte à Merveilles », roman au programme scolaire marocain racontant l'enfance de Sidi Mohammed à Fès."
  },
  {
    id: "cfr109",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et voix passive",
    question: "Quelle est la forme passive correcte de : « Les élèves ont rédigé la dissertation » ?",
    options: ["La dissertation a été rédigée par les élèves", "La dissertation est rédigée par les élèves", "La dissertation avait été rédigée par les élèves", "La dissertation fut rédigée par les élèves"],
    correct_answer: "La dissertation a été rédigée par les élèves",
    explanation: "Le verbe actif est au passé composé (« ont rédigé »), l'auxiliaire « être » doit donc être au passé composé (« a été rédigée »)."
  },
  {
    id: "cfr110",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Discours rapporté",
    question: "En transposant au discours indirect : Il a ordonné : « Sortez immédiatement ! », on obtient :",
    options: ["Il a ordonné de sortir immédiatement", "Il a ordonné que vous sortez immédiatement", "Il a ordonné si nous sortions immédiatement", "Il a ordonné que sortent immédiatement"],
    correct_answer: "Il a ordonné de sortir immédiatement",
    explanation: "L'impératif au discours direct se transforme en « de + infinitif » au discours indirect."
  },
  {
    id: "cfr111",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Registres littéraires",
    question: "Quel registre littéraire vise à susciter la pitié et l'attendrissement devant le malheur d'êtres vulnérables ?",
    options: ["Le registre pathétique", "Le registre tragique", "Le registre polémique", "Le registre épique"],
    correct_answer: "Le registre pathétique",
    explanation: "Le registre pathétique (du grec pathos, souffrance) émeut le lecteur en décrivant des souffrances touchantes et douloureuses."
  },
  {
    id: "cfr112",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature théâtrale",
    question: "Dans la tragédie classique française du XVIIe siècle (Racine, Corneille), la règle des trois unités impose :",
    options: ["Un seul jour, un seul lieu, une seule action principale", "Trois actes, trois décors, trois personnages", "Trois thèmes : amour, guerre et mort", "Une durée maximale de trois heures sans entracte"],
    correct_answer: "Un seul jour, un seul lieu, une seule action principale",
    explanation: "Boileau résume la règle classique : « Qu'en un lieu, qu'en un jour, un seul fait accompli / Tienne jusqu'à la fin le théâtre rempli »."
  },
  {
    id: "cfr113",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe lexicale et homophones",
    question: "Complétez la phrase : « ... que vous fassiez, restez calme. »",
    options: ["Quoi", "Quoique", "Quoi que", "Qu'elle"],
    correct_answer: "Quoi que",
    explanation: "« Quoi que » en deux mots signifie « quelle que soit la chose que » (ici suivi du subjonctif), à ne pas confondre avec la conjonction « quoique » (bien que)."
  },
  {
    id: "cfr114",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et types de phrases",
    question: "La phrase : « Que la fête commence ! » correspond à un acte de parole exprimant :",
    options: ["Un souhait ou un ordre à la 3e personne au subjonctif", "Une interrogation indirecte", "Une assertion affirmative ordinaire", "Une exclamation d'étonnement pur"],
    correct_answer: "Un souhait ou un ordre à la 3e personne au subjonctif",
    explanation: "Le subjonctif en proposition indépendante introduit par « que » exprime l'injonction, le souhait ou l'ordre envers une 3e personne."
  },
  {
    id: "cfr115",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature française",
    question: "Quel philosophe des Lumières a rédigé le conte philosophique « Candide ou l'Optimisme » en 1759 ?",
    options: ["Voltaire", "Jean-Jacques Rousseau", "Denis Diderot", "Montesquieu"],
    correct_answer: "Voltaire",
    explanation: "Voltaire a écrit « Candide » pour réfuter l'optimisme béat de Leibniz (« tout est pour le mieux dans le meilleur des mondes possibles »)."
  },
  // --- cfr151 إلى cfr200 (50 سؤالاً) ---
  {
    id: "cfr151",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et pronoms",
    question: "Dans la phrase : « Je pense à mes vacances / J'y pense », quelle est la fonction du pronom « y » ?",
    options: ["Complément d'objet indirect (COI) introduit par la préposition « à »", "Complément circonstanciel de lieu", "Sujet inversé", "Attribut du sujet"],
    correct_answer: "Complément d'objet indirect (COI) introduit par la préposition « à »",
    explanation: "Le pronom adverbial « y » remplace un COI inanimé ou une idée introduite par la préposition « à » (penser à quelque chose)."
  },
  {
    id: "cfr152",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et pronoms",
    question: "Dans : « Il a acheté des pommes / Il en a acheté trois », que remplace le pronom « en » ?",
    options: ["Un complément introduit par l'article partitif ou la préposition « de »", "Un complément d'attribution", "Un adjectif qualificatif épithète", "Le sujet du verbe"],
    correct_answer: "Un complément introduit par l'article partitif ou la préposition « de »",
    explanation: "Le pronom « en » remplace un nom précédé d'un article partitif, indéfini ou de la préposition « de »."
  },
  {
    id: "cfr153",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe des verbes pronominaux",
    question: "Choisissez l'accord correct : « Elles se sont ... la main avant le départ. »",
    options: ["serré", "serrées", "serrée", "serrer"],
    correct_answer: "serré",
    explanation: "Le verbe pronominal « se serrer » a ici un COD placé après (« la main ») : elles ont serré quoi ? la main (COD) à qui ? à elles (se = COI). Pas d'accord."
  },
  {
    id: "cfr154",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe des verbes pronominaux",
    question: "Choisissez l'accord correct : « Les mains qu'elles se sont ... étaient moites. »",
    options: ["serrées", "serré", "serrée", "serrés"],
    correct_answer: "serrées",
    explanation: "Le COD (« qu' », mis pour « les mains », féminin pluriel) est placé avant le verbe : accord du participe au féminin pluriel."
  },
  {
    id: "cfr155",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "Dans : « Va, je ne te hais point » (Chimène à Rodrigue dans Le Cid), quelle figure de style atténue l'expression pour faire entendre le contraire (je t'aime) ?",
    options: ["Une litote", "Un euphémisme", "Une hyperbole", "Une prosopopée"],
    correct_answer: "Une litote",
    explanation: "La litote dit le moins pour suggérer le plus, souvent à l'aide d'une tournure négative."
  },
  {
    id: "cfr156",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "« Il nous a quittés » pour désigner la mort d'une personne est un exemple de :",
    options: ["Euphémisme", "Antithèse", "Chiasme", "Anaphore"],
    correct_answer: "Euphémisme",
    explanation: "L'euphémisme atténue la brutalité ou le caractère choquant d'une réalité douloureuse (comme la mort ou la maladie)."
  },
  {
    id: "cfr157",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "La répétition d'un même mot ou groupe de mots en début de phrases ou de vers successifs s'appelle :",
    options: ["Une anaphore", "Une épiphore", "Une périphrase", "Une gradation"],
    correct_answer: "Une anaphore",
    explanation: "L'anaphore est la reprise délibérée d'un terme en tête de proposition ou de vers pour créer un rythme oratoire insistant."
  },
  {
    id: "cfr158",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Versification française",
    question: "Un vers français composé de douze syllabes poétiques s'appelle :",
    options: ["Un alexandrin", "Un décasyllabe", "Un octosyllabe", "Un ennéasyllabe"],
    correct_answer: "Un alexandrin",
    explanation: "L'alexandrin est le vers noble par excellence de la poésie classique française, traditionnellement coupé à l'hémistiche (6+6)."
  },
  {
    id: "cfr159",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Versification française",
    question: "La disposition des rimes selon le schéma ABBA correspond à des rimes :",
    options: ["Embrassées", "Croisées (alternées)", "Suivies (plates)", "Redoublées"],
    correct_answer: "Embrassées",
    explanation: "Les rimes embrassées encadrent deux rimes identiques entre deux autres (ABBA), à distinguer des rimes croisées (ABAB) et suivies (AABB)."
  },
  {
    id: "cfr160",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XXe siècle",
    question: "Qui a écrit la pièce de théâtre « Antigone » créée en 1944 sous l'Occupation allemande en France ?",
    options: ["Jean Anouilh", "Jean-Paul Sartre", "Albert Camus", "Eugène Ionesco"],
    correct_answer: "Jean Anouilh",
    explanation: "Jean Anouilh a réécrit le mythe sophocléen d'Antigone, pièce étudiée en 1re année du baccalauréat marocain."
  },
  {
    id: "cfr161",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XIXe siècle",
    question: "Quel roman à thèse de Victor Hugo (1829) plaide pour l'abolition universelle de la peine de mort ?",
    options: ["Le Dernier Jour d'un condamné", "Les Misérables", "Notre-Dame de Paris", "Quatrevingt-Treize"],
    correct_answer: "Le Dernier Jour d'un condamné",
    explanation: "Dans « Le Dernier Jour d'un condamné », Hugo retrace le monologue intérieur poignant d'un condamné à la guillotine."
  },
  {
    id: "cfr162",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature et mouvements",
    question: "Le mouvement du Romantisme au début du XIXe siècle privilégie :",
    options: ["L'expression du moi, le lyrisme des sentiments, la liberté formelle et la communion avec la nature", "Le culte exclusif de la raison et de la modération", "La description froide et scientifique de la société", "Le rejet total de toute émotion personnelle"],
    correct_answer: "L'expression du moi, le lyrisme des sentiments, la liberté formelle et la communion avec la nature",
    explanation: "Le romantisme (Hugo, Lamartine, Musset) réagit contre le rationalisme classique en exaltant la sensibilité individuelle et la mélancolie."
  },
  {
    id: "cfr163",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et propositions",
    question: "Dans : « Il travaille dur [afin que ses enfants réussissent] », quel est le rapport logique exprimé ?",
    options: ["Le but", "La cause", "La conséquence", "L'opposition"],
    correct_answer: "Le but",
    explanation: "La locution conjonctive « afin que » (suivie du subjonctif) introduit une proposition subordonnée circonstancielle de but."
  },
  {
    id: "cfr164",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et propositions",
    question: "Dans : « Il a tellement crié [qu'il en a perdu la voix] », la proposition subordonnée exprime :",
    options: ["La conséquence", "La cause", "La comparaison", "La concession"],
    correct_answer: "La conséquence",
    explanation: "La corrélation « tellement ... que » introduit une proposition subordonnée circonstancielle de conséquence."
  },
  {
    id: "cfr165",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe et pluriel des noms composés",
    question: "Quel est le pluriel correct du nom composé « un chef-d'œuvre » ?",
    options: ["des chefs-d'œuvre", "des chef-d'œuvres", "des chefs-d'œuvres", "des chef-d'œuvre"],
    correct_answer: "des chefs-d'œuvre",
    explanation: "Dans un nom composé avec préposition (« de »), seul le premier élément nominal s'accorde au pluriel : « des chefs-d'œuvre »."
  },
  {
    id: "cfr166",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe des adjectifs de couleur",
    question: "Choisissez l'accord correct : « Elle portait des robes ... »",
    options: ["bleu marine", "bleues marines", "bleues marine", "bleus marines"],
    correct_answer: "bleu marine",
    explanation: "Les adjectifs de couleur composés de deux mots restent invariables : « des robes bleu marine »."
  },
  {
    id: "cfr167",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe des adjectifs de couleur",
    question: "Choisissez l'orthographe correcte pour des yeux couleur de noisette : « Elle a les yeux ... »",
    options: ["noisette (invariable)", "noisettes", "noisettés", "noisetteux"],
    correct_answer: "noisette (invariable)",
    explanation: "Les noms employés comme adjectifs de couleur (marron, noisette, orange, cerise) restent généralement invariables (sauf rose, pourpre, mauve, écarlate, fauve, incarnat)."
  },
  {
    id: "cfr168",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Conjugaison et subjonctif",
    question: "À quelle personne et temps est conjugué le verbe dans : « Qu'ils s'en aillent ! » ?",
    options: ["Subjonctif présent, 3e personne du pluriel", "Indicatif présent", "Impératif présent", "Conditionnel présent"],
    correct_answer: "Subjonctif présent, 3e personne du pluriel",
    explanation: "C'est la forme du subjonctif présent du verbe « s'en aller » : que je m'en aille, ..., qu'ils s'en aillent."
  },
  {
    id: "cfr169",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Conjugaison et passé simple",
    question: "Quelle est la forme correcte à la 1re personne du singulier au passé simple pour le verbe « faire » ?",
    options: ["Je fis", "Je faisais", "Je fisai", "Je fus"],
    correct_answer: "Je fis",
    explanation: "Le passé simple du verbe faire est en -i- : je fis, tu fis, il fit, nous fîmes, vous fîtes, ils firent."
  },
  {
    id: "cfr170",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Conjugaison et passé simple",
    question: "Quelle est la 3e personne du singulier au passé simple du verbe « naître » ?",
    options: ["Il naquit", "Il naquitait", "Il naît", "Il néa"],
    correct_answer: "Il naquit",
    explanation: "Le verbe naître a un passé simple particulier : il naquit (avec accent circonflexe à nous naquîmes)."
  },
  {
    id: "cfr171",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature maghrébine d'expression française",
    question: "Quel roman de Driss Chraïbi, publié en 1954, a provoqué une onde de choc en contestant l'autorité patriarcale traditionnelle ?",
    options: ["Le Passé Simple", "Les Boucs", "La Civilisation, ma Mère !...", "Une enquête au pays"],
    correct_answer: "Le Passé Simple",
    explanation: "« Le Passé Simple » est l'acte de naissance de la littérature marocaine francophone moderne de contestation, mettant en scène le héros Driss face au « Seigneur »."
  },
  {
    id: "cfr172",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature maghrébine d'expression française",
    question: "Qui est le premier auteur marocain à avoir remporté le prestigieux Prix Goncourt en 1987 avec son roman « La Nuit sacrée » ?",
    options: ["Tahar Ben Jelloun", "Mohammed Khaïr-Eddine", "Fouad Laroui", "Abdelkébir Khatibi"],
    correct_answer: "Tahar Ben Jelloun",
    explanation: "Tahar Ben Jelloun a reçu le prix Goncourt pour « La Nuit sacrée », suite de « L'Enfant de sable »."
  },
  {
    id: "cfr173",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Théorie littéraire et narratologie",
    question: "Dans la typologie de Gérard Genette, la focalisation zéro (ou point de vue omniscient) signifie que :",
    options: ["Le narrateur sait tout des personnages (pensées, passé, avenir), il en sait plus que les personnages eux-mêmes (Narrateur > Personnage)", "Le narrateur ne sait que ce que perçoit un personnage particulier", "Le narrateur se contente d'observer de l'extérieur sans pénétrer les consciences", "L'histoire est racontée à la deuxième personne du pluriel"],
    correct_answer: "Le narrateur sait tout des personnages (pensées, passé, avenir), il en sait plus que les personnages eux-mêmes (Narrateur > Personnage)",
    explanation: "La focalisation zéro correspond au narrateur-dieu omniscient qui embrasse la totalité des faits et des esprits."
  },
  {
    id: "cfr174",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Théorie littéraire et narratologie",
    question: "Dans le schéma actantiel de Greimas, le personnage ou l'élément qui aide le héros à accomplir sa quête est appelé :",
    options: ["L'adjuvant", "L'opposant", "Le destinataire", "Le destinateur"],
    correct_answer: "L'adjuvant",
    explanation: "L'adjuvant apporte son aide au sujet/héros, par opposition à l'opposant qui fait obstacle à sa quête."
  },
  {
    id: "cfr175",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et conditionnelles",
    question: "Dans un système hypothétique : « Si j'avais su, je ne serais pas venu », quelle nuance temporelle et modale est exprimée ?",
    options: ["L'irréel du passé (action non réalisée dans le passé)", "Le potentiel dans le futur", "L'irréel du présent", "Une certitude absolue"],
    correct_answer: "L'irréel du passé (action non réalisée dans le passé)",
    explanation: "La structure « Si + plus-que-parfait ... conditionnel passé » exprime un regret ou un constat d'irréel dans le passé."
  },
  {
    id: "cfr176",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et conditionnelles",
    question: "Complétez la phrase exprimant l'irréel du présent : « Si j'avais le temps, je ... tous les jours. »",
    options: ["lirais (conditionnel présent)", "lirai (futur simple)", "lisais (imparfait)", "aurais lu"],
    correct_answer: "lirais (conditionnel présent)",
    explanation: "La structure « Si + imparfait » appelle le conditionnel présent dans la proposition principale pour exprimer l'irréel du présent."
  },
  {
    id: "cfr177",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "L'expression : « Paris est magique, Paris s'éveille, Paris sourit » comporte :",
    options: ["Une personnification alliée à une anaphore", "Un oxymore", "Une hyperbole et une litote", "Un zeugme"],
    correct_answer: "Une personnification alliée à une anaphore",
    explanation: "La ville de Paris est dotée de traits humains (« s'éveille », « sourit » = personnification) avec répétition en tête de membres (« Paris » = anaphore)."
  },
  {
    id: "cfr178",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Figures de style",
    question: "Le chiasme est une figure de construction qui consiste en :",
    options: ["Une disposition croisée de termes de même nature selon le schéma AB / B'A'", "Une succession de termes de sens équivalent", "L'omission volontaire d'un mot essentiel", "La répétition de voyelles identiques"],
    correct_answer: "Une disposition croisée de termes de même nature selon le schéma AB / B'A'",
    explanation: "Exemple célèbre de chiasme : « Il faut manger pour vivre et non pas vivre pour manger » (A B / B' A')."
  },
  {
    id: "cfr179",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Lexique et sémantique",
    question: "Des mots de sens voisins ou très proches comme « peur », « angoisse », « terreur » et « effroi » sont des :",
    options: ["Synonymes", "Antonymes", "Homonymes", "Paronymes"],
    correct_answer: "Synonymes",
    explanation: "La synonymie désigne la relation d'équivalence sémantique entre deux ou plusieurs unités lexicales de même catégorie grammaticale."
  },
  {
    id: "cfr180",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Lexique et sémantique",
    question: "Deux mots qui se ressemblent phonétiquement au point de prêter à confusion, comme « collision » et « collusion », sont des :",
    options: ["Paronymes", "Homophones", "Antonymes", "Hyponymes"],
    correct_answer: "Paronymes",
    explanation: "La paronymie est la ressemblance formelle ou phonétique entre des mots de sens totalement différents."
  },
  {
    id: "cfr181",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Genres littéraires",
    question: "L'apologue est un genre littéraire bref à visée :",
    options: ["Pédagogique, argumentative et morale (comme la fable ou le conte philosophique)", "Uniquement comique et burlesque", "Purement lyrique sans intention morale", "Journalistique et documentaire"],
    correct_answer: "Pédagogique, argumentative et morale (comme la fable ou le conte philosophique)",
    explanation: "L'apologue est un récit allégorique démonstratif (fable, parabole) conçu pour délivrer un enseignement moral ou philosophique."
  },
  {
    id: "cfr182",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XVIIe siècle",
    question: "Quel dramaturge comique français a dénoncé l'hypocrisie religieuse dans sa pièce « Tartuffe » en 1664 ?",
    options: ["Molière", "Pierre Corneille", "Jean Racine", "La Fontaine"],
    correct_answer: "Molière",
    explanation: "Molière a suscité la colère des dévots et la censure royale avec « Tartuffe ou l'Imposteur » fustigeant la fausse piété."
  },
  {
    id: "cfr183",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XIXe siècle",
    question: "Quel poète français est l'auteur du recueil révolutionnaire « Les Fleurs du Mal » (1857), condamné pour outrage aux bonnes mœurs ?",
    options: ["Charles Baudelaire", "Arthur Rimbaud", "Paul Verlaine", "Stéphane Mallarmé"],
    correct_answer: "Charles Baudelaire",
    explanation: "Baudelaire y invente la modernité poétique en extrayant la beauté du mal et de la laideur urbaine (« Alchimie de la douleur »)."
  },
  {
    id: "cfr184",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et négation",
    question: "Dans un registre soutenu, quel adverbe de négation permet d'omettre « pas » avec certains verbes (pouvoir, cesser, oser, savoir) ?",
    options: ["ne (négation restrictive ou ne explétif / littéraire)", "pas tout seul", "point du tout", "guère"],
    correct_answer: "ne (négation restrictive ou ne explétif / littéraire)",
    explanation: "Le « ne » littéraire peut exprimer à lui seul la négation avec certains verbes : « Je ne puis vous répondre », « Il ne cesse de parler »."
  },
  {
    id: "cfr185",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et négation",
    question: "Dans : « Je crains qu'il ne vienne », que représente le mot « ne » ?",
    options: ["Un « ne » explétif (qui n'a aucune valeur négative réelle)", "Une négation totale", "Une négation restrictive", "Une erreur grammaticale"],
    correct_answer: "Un « ne » explétif (qui n'a aucune valeur négative réelle)",
    explanation: "Le « ne » explétif apparaît dans la langue soignée après les verbes de crainte ou de doute sans apporter de négation au sens."
  },
  {
    id: "cfr186",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe grammaticale",
    question: "Complétez correctement la phrase : « ... de ses raisons me convainc. »",
    options: ["Aucune", "Aucunes", "Aucunne", "Aucuns"],
    correct_answer: "Aucune",
    explanation: "L'indéfini « aucun » s'accorde en genre avec le nom (« raison », féminin singulier : « aucune »)."
  },
  {
    id: "cfr187",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Conjugaison et futur antérieur",
    question: "Quelle est la forme correcte du verbe « finir » au futur antérieur à la 1re personne du pluriel ?",
    options: ["Nous aurons fini", "Nous aurions fini", "Nous avions fini", "Nous finirons"],
    correct_answer: "Nous aurons fini",
    explanation: "Le futur antérieur se forme avec l'auxiliaire au futur simple (« nous aurons ») suivi du participe passé (« fini »)."
  },
  {
    id: "cfr188",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Conjugaison et plus-que-parfait",
    question: "Le plus-que-parfait de l'indicatif exprime fondamentalement :",
    options: ["Une action passée accomplie et antérieure à une autre action passée", "Une vérité générale intemporelle", "Une action en cours d'accomplissement dans le présent", "Un ordre impératif différé"],
    correct_answer: "Une action passée accomplie et antérieure à une autre action passée",
    explanation: "Le plus-que-parfait marque l'antériorité par rapport à un repère temporel déjà situé dans le passé (imparfait ou passé simple)."
  },
  {
    id: "cfr189",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XXe siècle",
    question: "Quel roman d'Albert Camus s'ouvre par la phrase célèbre : « Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas » ?",
    options: ["L'Étranger", "La Peste", "La Chute", "Le Mythe de Sisyphe"],
    correct_answer: "L'Étranger",
    explanation: "« L'Étranger » (1942) met en scène le personnage de Meursault illustrant la philosophie camusienne de l'absurde."
  },
  {
    id: "cfr190",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du XXe siècle",
    question: "Quel mouvement artistique et littéraire fondé par André Breton en 1924 fait appel à l'écriture automatique et au rêve ?",
    options: ["Le Surréalisme", "Le Dadaïsme", "L'Oulipo", "Le Symbolisme"],
    correct_answer: "Le Surréalisme",
    explanation: "Le Premier Manifeste du surréalisme (1924) définit le surréalisme comme un automatisme psychique pur dicté par l'inconscient."
  },
  {
    id: "cfr191",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Enonciation et déixis",
    question: "Des termes comme « ici », « maintenant », « hier », « je », « vous » dont le sens dépend de la situation de communication sont appelés :",
    options: ["Des déictiques (ou embrayeurs)", "Des modalisateurs de certitude", "Des connecteurs logiques", "Des archaïsmes"],
    correct_answer: "Des déictiques (ou embrayeurs)",
    explanation: "Les déictiques ancrent l'énoncé dans la situation d'énonciation hic et nunc (ici et maintenant, émetteur et récepteur)."
  },
  {
    id: "cfr192",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Enonciation et modalisation",
    question: "Dans : « Il est sans doute chez lui », quel rôle joue l'expression « sans doute » ?",
    options: ["Un modalisateur de doute / d'incertitude", "Un connecteur d'opposition", "Une cheville poétique", "Un pronom démonstratif"],
    correct_answer: "Un modalisateur de doute / d'incertitude",
    explanation: "Les modalisateurs nuancent le degré d'adhésion du locuteur à son propre énoncé (probabilité, certitude, jugement de valeur)."
  },
  {
    id: "cfr193",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et voix pronominale",
    question: "Dans : « Cette maison s'est vendue très rapidement », quel est le sens de la tournure pronominale ?",
    options: ["Pronominale à sens passif (elle a été vendue)", "Pronominale réfléchie", "Pronominale réciproque", "Pronominale autonome"],
    correct_answer: "Pronominale à sens passif (elle a été vendue)",
    explanation: "Le sujet inanimé subit l'action sans que l'agent ne soit mentionné : tournure pronominale passive."
  },
  {
    id: "cfr194",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Grammaire et infinitif",
    question: "Quelle est la fonction du verbe à l'infinitif dans : « Partir, c'est mourir un peu » ?",
    options: ["Sujet de la phrase", "Complément d'objet direct", "Attribut du complément", "Complément d'agent"],
    correct_answer: "Sujet de la phrase",
    explanation: "L'infinitif nominalisé « partir » assume ici la fonction syntaxique de sujet grammatical."
  },
  {
    id: "cfr195",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe d'usage",
    question: "Quel mot s'écrit correctement avec deux « m » ?",
    options: ["Dilemme", "Dilemne", "Dillème", "Dillemne"],
    correct_answer: "Dilemme",
    explanation: "Le mot « dilemme » s'écrit avec deux « m » et sans « n » (du grec di-lemma, double proposition)."
  },
  {
    id: "cfr196",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Orthographe d'usage",
    question: "Laquelle de ces phrases contient l'adverbe correctement orthographié ?",
    options: ["Il a agi prudemment", "Il a agi prudament", "Il a agi prudemmentment", "Il a agi prudemant"],
    correct_answer: "Il a agi prudemment",
    explanation: "Les adjectifs en -ent forment leur adverbe en -emment : prudent → prudemment (prononcé [amã])."
  },
  {
    id: "cfr197",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Littérature du Moyen Âge",
    question: "La « Chanson de Roland » (XIe siècle) appartient au genre médiéval de :",
    options: ["La chanson de geste", "Le roman courtois", "Le fabliau comique", "La farce"],
    correct_answer: "La chanson de geste",
    explanation: "Les chansons de geste sont de longs poèmes épiques célébrant les exploits guerriers héroïques et la chevalerie chrétienne."
  },
  {
    id: "cfr198",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Poésie française de la Renaissance",
    question: "Quel groupe de sept poètes du XVIe siècle, mené par Ronsard et Du Bellay, a révolutionné la langue poétique française ?",
    options: ["La Pléiade", "Les Félibres", "Le Parnasse", "Les Parnassiens"],
    correct_answer: "La Pléiade",
    explanation: "La Pléiade (1549, « Défense et illustration de la langue française ») a enrichi la langue vernaculaire en imitant les formes antiques (ode, sonnet)."
  },
  {
    id: "cfr199",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Stylistique et niveaux de langue",
    question: "Les trois registres de langue traditionnels en français sont :",
    options: ["Le niveau familier, le niveau courant, et le niveau soutenu (ou soigné)", "Le niveau urbain, rural et maritime", "Le niveau classique, romantique et réaliste", "Le niveau oral, gestuel et écrit"],
    correct_answer: "Le niveau familier, le niveau courant, et le niveau soutenu (ou soigné)",
    explanation: "La sociolinguistique distingue trois principaux registres d'usage selon la situation de communication et le lexique employé."
  },
  {
    id: "cfr200",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_fr",
    topic: "Méthodologie de l'analyse littéraire",
    question: "Dans le commentaire composé de texte littéraire, qu'est-ce qu'une « problématique » ?",
    options: ["La question directrice qui interroge les enjeux majeurs et le sens profond du texte pour guider la lecture organisée", "Le résumé linéaire strophe par strophe", "La biographie complète de l'auteur", "La liste des fautes de grammaire du texte"],
    correct_answer: "La question directrice qui interroge les enjeux majeurs et le sens profond du texte pour guider la lecture organisée",
    explanation: "La problématique est l'axe d'interprétation central auquel répondent les différentes parties ordonnées du commentaire littéraire."
  }
];

console.log(`Generated ${frQuestions.length} secondary French questions.`);

const seedPath = path.join(__dirname, '..', 'questions_seed.json');
let allQuestions = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const frIds = new Set(frQuestions.map(q => q.id));
allQuestions = allQuestions.filter(q => !frIds.has(q.id));
allQuestions.push(...frQuestions);
allQuestions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

fs.writeFileSync(seedPath, JSON.stringify(allQuestions, null, 2), 'utf8');

const tsContent = `import type { Question } from '../types';\n\nexport const INITIAL_QUESTIONS = ${JSON.stringify(allQuestions, null, 2)} as unknown as Question[];\n`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'initialQuestions.ts'), tsContent, 'utf8');

console.log(`Total questions in bank after French update: ${allQuestions.length}`);

