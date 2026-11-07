const fs = require('fs');
const path = require('path');

// ==============================================================================
// 1. أسئلة اللغة الإنجليزية للثانوي (sec_eng) - 65 سؤالاً: cen101-cen115 و cen151-cen200
// ==============================================================================
const engQuestions = [
  // --- cen101 to cen115 (15 questions) ---
  {
    id: "cen101",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Conditionals",
    question: "Complete the third conditional sentence: « If she had studied harder, she ... the exam. »",
    options: ["would have passed", "will pass", "would pass", "had passed"],
    correct_answer: "would have passed",
    explanation: "Third conditional form: If + Past Perfect, would have + past participle (expressing hypothetical past)."
  },
  {
    id: "cen102",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Passive Voice",
    question: "Choose the correct passive form of: « The teacher is explaining the lesson right now. »",
    options: ["The lesson is being explained by the teacher right now", "The lesson was explained by the teacher", "The lesson is explained by the teacher", "The lesson has been explained by the teacher"],
    correct_answer: "The lesson is being explained by the teacher right now",
    explanation: "Present Continuous Passive is formed with: is/are + being + past participle."
  },
  {
    id: "cen103",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Reported Speech",
    question: "Change to reported speech: « I bought a new laptop yesterday, » Tom said.",
    options: ["Tom said that he had bought a new laptop the day before", "Tom said that he bought a new laptop yesterday", "Tom said that he has bought a new laptop the previous day", "Tom said that he would buy a new laptop"],
    correct_answer: "Tom said that he had bought a new laptop the day before",
    explanation: "Past Simple changes to Past Perfect, and 'yesterday' backshifts to 'the day before / the previous day'."
  },
  {
    id: "cen104",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Modal Verbs",
    question: "Which modal verb best expresses a past logical deduction: « The ground is wet; it ... last night. » ?",
    options: ["must have rained", "should rain", "can rain", "might rain"],
    correct_answer: "must have rained",
    explanation: "« Must have + past participle » expresses high certainty / deduction about an event in the past."
  },
  {
    id: "cen105",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Gerunds & Infinitives",
    question: "Choose the correct verb form: « I look forward to ... you at the conference. »",
    options: ["meeting", "meet", "met", "to meet"],
    correct_answer: "meeting",
    explanation: "In the phrasal expression « look forward to », 'to' is a preposition, and prepositions are followed by gerunds (-ing)."
  },
  {
    id: "cen106",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Relative Clauses",
    question: "Complete the sentence: « The scientist ... discovered the vaccine won the Nobel Prize. »",
    options: ["who", "which", "whose", "whom"],
    correct_answer: "who",
    explanation: "The relative pronoun 'who' is used for persons as the subject of the relative clause."
  },
  {
    id: "cen107",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Phrasal Verbs",
    question: "What does the phrasal verb « call off » mean in: « They had to call off the meeting due to bad weather » ?",
    options: ["To cancel", "To postpone", "To announce", "To start"],
    correct_answer: "To cancel",
    explanation: "« Call off » means to cancel an event or arrangement (distinct from 'put off', which means to postpone)."
  },
  {
    id: "cen108",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Inversion",
    question: "Complete the inverted sentence: « Rarely ... such a brilliant performance. »",
    options: ["have I seen", "I have seen", "I saw", "did I seen"],
    correct_answer: "have I seen",
    explanation: "When negative or restrictive adverbs (rarely, seldom, hardly) begin a sentence, subject-auxiliary inversion is required."
  },
  {
    id: "cen109",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Wishes & Regrets",
    question: "Choose the correct form to express past regret: « I wish I ... so much money on that useless gadget. »",
    options: ["had not spent", "did not spend", "would not spend", "do not spend"],
    correct_answer: "had not spent",
    explanation: "« Wish + Past Perfect » is used to express regrets about past events that cannot be changed."
  },
  {
    id: "cen110",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Collocations",
    question: "Which verb correctly collocates with « a mistake » ?",
    options: ["Make a mistake", "Do a mistake", "Create a mistake", "Perform a mistake"],
    correct_answer: "Make a mistake",
    explanation: "The natural English collocation is « to make a mistake » (not 'do a mistake')."
  },
  {
    id: "cen111",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Language Functions",
    question: "Which utterance expresses polite disagreement?",
    options: ["I see your point, but I have a slightly different view", "You are completely wrong", "I agree with you 100%", "That makes no sense whatsoever"],
    correct_answer: "I see your point, but I have a slightly different view",
    explanation: "Diplomatic disagreement acknowledges the interlocutor's perspective before presenting an alternative viewpoint."
  },
  {
    id: "cen112",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Tenses & Aspect",
    question: "By the end of next month, our team ... the entire construction project.",
    options: ["will have completed", "will complete", "is completing", "completes"],
    correct_answer: "will have completed",
    explanation: "« By + future time expression » requires the Future Perfect tense (will have + past participle)."
  },
  {
    id: "cen113",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Linking Words & Concession",
    question: "Complete the sentence: « ... the heavy rain, the football match went ahead as planned. »",
    options: ["Despite", "Although", "Even though", "However"],
    correct_answer: "Despite",
    explanation: "« Despite » (and 'in spite of') is followed by a noun phrase, whereas 'although' introduces a full clause."
  },
  {
    id: "cen114",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT Methodology & SLA",
    question: "In communicative language teaching (CLT), what is the primary role of the teacher?",
    options: ["A facilitator, guide and organizer of communicative activities", "The sole authoritative lecturer and source of knowledge", "A strict error-corrector who stops every mistake immediately", "An examiner who only administers grammar tests"],
    correct_answer: "A facilitator, guide and organizer of communicative activities",
    explanation: "In learner-centred CLT, the teacher acts as a facilitator and monitor of authentic communication."
  },
  {
    id: "cen115",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Phonetics & Pronunciation",
    question: "How is the past tense ending « -ed » pronounced in the verb « decided » ?",
    options: ["/ɪd/", "/t/", "/d/", "/ed/"],
    correct_answer: "/ɪd/",
    explanation: "Verbs ending in /t/ or /d/ sounds add an extra syllable /ɪd/ in the past tense (e.g., wanted, decided)."
  },
  // --- cen151 to cen200 (50 questions) ---
  {
    id: "cen151",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Conditionals",
    question: "Complete the mixed conditional: « If I had won the lottery last year, I ... a yacht today. »",
    options: ["would own", "would have owned", "will own", "had owned"],
    correct_answer: "would own",
    explanation: "Mixed conditional (past condition + present result): If + Past Perfect, would + bare infinitive."
  },
  {
    id: "cen152",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Subjunctive",
    question: "Choose the correct mandate subjunctive form: « The doctor recommended that the patient ... more water. »",
    options: ["drink (bare infinitive)", "drinks", "drank", "would drink"],
    correct_answer: "drink (bare infinitive)",
    explanation: "The English mandative subjunctive uses the base form of the verb regardless of the subject (he/she/it drink)."
  },
  {
    id: "cen153",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Articles & Determiners",
    question: "Which sentence correctly uses the definite article « the » ?",
    options: ["The Nile is the longest river in Africa", "Nile is the longest river in Africa", "The Mount Everest is the highest peak", "The Lake Victoria is very deep"],
    correct_answer: "The Nile is the longest river in Africa",
    explanation: "Rivers, seas, and oceans take the definite article 'the' (the Nile, the Atlantic), unlike individual mountains or lakes."
  },
  {
    id: "cen154",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Inversion",
    question: "Complete: « No sooner had we entered the hall ... the lights went out. »",
    options: ["than", "when", "then", "that"],
    correct_answer: "than",
    explanation: "The correlative structure is « No sooner ... than » (paired with Past Perfect inversion)."
  },
  {
    id: "cen155",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Phrasal Verbs",
    question: "What does the phrasal verb « look up to » mean in: « Young athletes look up to him as a role model » ?",
    options: ["To admire and respect", "To search for information in a dictionary", "To despise and mock", "To visit unexpectedly"],
    correct_answer: "To admire and respect",
    explanation: "« To look up to someone » is an idiom meaning to have great respect and admiration for someone."
  },
  {
    id: "cen156",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Phrasal Verbs",
    question: "Choose the phrasal verb meaning « to tolerate or endure » :",
    options: ["Put up with", "Put off", "Put out", "Put down"],
    correct_answer: "Put up with",
    explanation: "« Put up with » is a three-part phrasal verb meaning to tolerate an unpleasant situation or person."
  },
  {
    id: "cen157",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Suffixes",
    question: "What is the correct noun formed from the adjective « resilient » ?",
    options: ["Resilience", "Resilientness", "Resiliencytion", "Resiliente"],
    correct_answer: "Resilience",
    explanation: "Adjectives ending in -ent typically form abstract nouns ending in -ence (patient → patience, resilient → resilience)."
  },
  {
    id: "cen158",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Idioms",
    question: "What does the idiom « burn the midnight oil » mean?",
    options: ["To work or study late into the night", "To waste precious energy carelessly", "To start a dangerous fire", "To wake up very early at dawn"],
    correct_answer: "To work or study late into the night",
    explanation: "« Burning the midnight oil » refers to staying up late to study or complete work."
  },
  {
    id: "cen159",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Modals",
    question: "Which sentence expresses reproach or criticism about a past failure?",
    options: ["You should have told me the truth earlier", "You must have told me the truth", "You might tell me the truth", "You could tell me the truth"],
    correct_answer: "You should have told me the truth earlier",
    explanation: "« Should have + past participle » expresses regret or criticism about what was desirable but did not happen."
  },
  {
    id: "cen160",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Quantifiers",
    question: "Choose the correct sentence regarding countable and uncountable nouns:",
    options: ["We have little time and few resources", "We have few time and little resources", "We have much resources and many time", "We have a few time and a little resources"],
    correct_answer: "We have little time and few resources",
    explanation: "'Little' is used with uncountable nouns ('time'), while 'few' is used with plural countable nouns ('resources')."
  },
  {
    id: "cen161",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Language Functions",
    question: "« Could you possibly give me a hand with this heavy box? » expresses:",
    options: ["A polite request", "An offer of assistance", "A formal apology", "A command"],
    correct_answer: "A polite request",
    explanation: "« Could you possibly + verb » is a high-politeness formula used to make requests."
  },
  {
    id: "cen162",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Discourse Markers",
    question: "Which discourse connector is used to introduce an additional and reinforcing point?",
    options: ["Furthermore", "Nevertheless", "Whereas", "Otherwise"],
    correct_answer: "Furthermore",
    explanation: "« Furthermore » (along with moreover, in addition) introduces cumulative additive arguments."
  },
  {
    id: "cen163",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Literature in English",
    question: "Who wrote the famous dystopian novel « 1984 », which introduced concepts like Big Brother and Doublethink?",
    options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "William Golding"],
    correct_answer: "George Orwell",
    explanation: "George Orwell published « Nineteen Eighty-Four » in 1949, warning against totalitarian state surveillance."
  },
  {
    id: "cen164",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Literature in English",
    question: "Which Shakespearean tragedy features the famous soliloquy « To be, or not to be, that is the question » ?",
    options: ["Hamlet", "Macbeth", "Othello", "King Lear"],
    correct_answer: "Hamlet",
    explanation: "Prince Hamlet contemplates existence and suicide in Act 3, Scene 1 of Shakespeare's tragedy Hamlet."
  },
  {
    id: "cen165",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Linguistics & Phonology",
    question: "What is a « minimal pair » in phonology?",
    options: ["Two words that differ by only a single phoneme and have different meanings (e.g., ship / sheep)", "Two words that have identical spellings but different pronunciations", "A pair of antonyms", "Two syllables in the same compound word"],
    correct_answer: "Two words that differ by only a single phoneme and have different meanings (e.g., ship / sheep)",
    explanation: "Minimal pairs prove that two phonetic sounds constitute distinct phonemes in a language's sound system."
  },
  {
    id: "cen166",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT Methodology & Skills",
    question: "What reading sub-skill involves reading rapidly through a text to find specific pieces of information (like a date or phone number)?",
    options: ["Scanning", "Skimming", "Extensive reading", "Critical reading"],
    correct_answer: "Scanning",
    explanation: "Scanning is search reading for specific target data, whereas skimming is reading for the general gist."
  },
  {
    id: "cen167",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT Methodology & Skills",
    question: "What does the reading technique « Skimming » focus on?",
    options: ["Reading quickly to get the main idea or gist of a text", "Analyzing every grammatical structure in detail", "Looking up unfamiliar words in the dictionary", "Reading aloud with correct intonation"],
    correct_answer: "Reading quickly to get the main idea or gist of a text",
    explanation: "Skimming enables the reader to grasp the overarching topic and macrostructure in a minimum of time."
  },
  {
    id: "cen168",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Causative Verbs",
    question: "Choose the correct causative sentence: « She had the mechanic ... her car brakes. »",
    options: ["repair (bare infinitive)", "to repair", "repaired", "repairing"],
    correct_answer: "repair (bare infinitive)",
    explanation: "Active causative 'have': have + person + bare infinitive (She had the mechanic repair her car)."
  },
  {
    id: "cen169",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Causative Verbs",
    question: "Choose the correct passive causative form: « I need to get my passport ... before traveling. »",
    options: ["renewed", "renew", "to renew", "renewing"],
    correct_answer: "renewed",
    explanation: "Passive causative structure: have/get + object + past participle (get something done)."
  },
  {
    id: "cen170",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & False Friends",
    question: "The English word « actually » means:",
    options: ["In reality / as a matter of fact", "At the present moment (currently)", "Potentially", "Occasionally"],
    correct_answer: "In reality / as a matter of fact",
    explanation: "'Actually' is a false friend (faux-ami) with French 'actuellement'; it means 'in fact', not 'currently'."
  },
  {
    id: "cen171",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Participle Clauses",
    question: "Identify the correct participle clause: « ... his homework, Adam went out to play with his friends. »",
    options: ["Having finished", "Finished", "Finish", "To have finish"],
    correct_answer: "Having finished",
    explanation: "The perfect participle ('Having finished') denotes an action completed prior to the action of the main verb."
  },
  {
    id: "cen172",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Used to",
    question: "Complete the sentence expressing habituation: « She is gradually getting used to ... in a cold climate. »",
    options: ["living", "live", "lived", "life live"],
    correct_answer: "living",
    explanation: "« Be / get used to » is followed by a gerund (-ing) or noun phrase, denoting the process of becoming accustomed."
  },
  {
    id: "cen173",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Morphology & Word Formation",
    question: "What morphological process created the word « brunch » (from breakfast + lunch)?",
    options: ["Blending (portmanteau word)", "Clipping", "Acronymy", "Conversion"],
    correct_answer: "Blending (portmanteau word)",
    explanation: "Blending merges parts of two distinct words to create a new hybrid lexical item (breakfast + lunch = brunch)."
  },
  {
    id: "cen174",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Morphology & Word Formation",
    question: "Forming the word « flu » from « influenza » is an example of:",
    options: ["Clipping", "Borrowing", "Compounding", "Affixation"],
    correct_answer: "Clipping",
    explanation: "Clipping (or truncation) shortens a polysyllabic word while retaining its original meaning and grammatical class."
  },
  {
    id: "cen175",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "SLA & Second Language Acquisition",
    question: "According to Stephen Krashen's Input Hypothesis, language acquisition occurs when learners are exposed to comprehensible input at level:",
    options: ["i + 1 (just slightly beyond their current competence)", "i + 0 (at their exact current level)", "i + 5 (far beyond their current grasp)", "i - 1 (below their level)"],
    correct_answer: "i + 1 (just slightly beyond their current competence)",
    explanation: "Krashen's Input Hypothesis states that learners progress along the natural order when receiving input at 'i + 1'."
  },
  {
    id: "cen176",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "SLA & Affective Filter",
    question: "In Krashen's Monitor Model, a « low affective filter » means that the learner:",
    options: ["Has high motivation, self-confidence, and low anxiety, which facilitates acquisition", "Is unmotivated and distracted", "Suffers from severe linguistic inhibitions", "Lacks any grammatical awareness"],
    correct_answer: "Has high motivation, self-confidence, and low anxiety, which facilitates acquisition",
    explanation: "A low affective filter allows comprehensible input to strike the Language Acquisition Device (LAD) unhindered."
  },
  {
    id: "cen177",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Assessment in ELT",
    question: "What is « formative assessment » primarily designed to do?",
    options: ["Provide ongoing feedback to improve learning and teaching during the instructional process", "Assign final letter grades at the end of the academic year", "Rank students nationally for university admission", "Test memorization of isolated vocabulary lists"],
    correct_answer: "Provide ongoing feedback to improve learning and teaching during the instructional process",
    explanation: "Formative assessment ('assessment for learning') diagnoses learning gaps and guides remedial instruction mid-course."
  },
  {
    id: "cen178",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Prepositions",
    question: "Choose the correct preposition: « She is capable ... handling complex negotiations independently. »",
    options: ["of", "to", "for", "with"],
    correct_answer: "of",
    explanation: "The adjective 'capable' collocates with the dependent preposition 'of' followed by a gerund: « capable of handling »."
  },
  {
    id: "cen179",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Prepositions",
    question: "Choose the correct preposition: « He congratulated me ... passing the competitive teaching exam. »",
    options: ["on", "for", "at", "in"],
    correct_answer: "on",
    explanation: "The standard English construction is: « congratulate someone ON something / ON doing something »."
  },
  {
    id: "cen180",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Cleft Sentences",
    question: "Which cleft sentence correctly emphasizes the person who solved the issue?",
    options: ["It was Sarah who solved the technical issue", "It was Sarah which solved the issue", "What Sarah solved was the issue person", "That Sarah did was solving"],
    correct_answer: "It was Sarah who solved the technical issue",
    explanation: "An it-cleft structure focuses on a specific constituent: It + be + focused element + who/that clause."
  },
  {
    id: "cen181",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Idioms & Figurative Language",
    question: "What does the expression « take something with a pinch of salt » mean?",
    options: ["To view a piece of information with skepticism and not believe it completely", "To season food carefully before eating", "To become extremely angry", "To accept everything without questioning"],
    correct_answer: "To view a piece of information with skepticism and not believe it completely",
    explanation: "To take something with a pinch/grain of salt means to maintain critical skepticism towards exaggerated claims."
  },
  {
    id: "cen182",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Figures of Speech",
    question: "« The wind whispered through the dark trees » is an example of:",
    options: ["Personification", "Hyperbole", "Simile", "Euphemism"],
    correct_answer: "Personification",
    explanation: "Personification attributes human qualities or actions ('whispered') to an inanimate natural phenomenon ('the wind')."
  },
  {
    id: "cen183",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Figures of Speech",
    question: "Which sentence contains a « simile » ?",
    options: ["He fought like a lion on the battlefield", "Time is a thief", "I am so hungry I could eat a horse", "The pen is mightier than the sword"],
    correct_answer: "He fought like a lion on the battlefield",
    explanation: "A simile makes an explicit comparison between two dissimilar things using comparative words such as 'like' or 'as'."
  },
  {
    id: "cen184",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Subordination",
    question: "Complete the sentence expressing contrast: « ... she worked hard, she did not achieve the promotion. »",
    options: ["Although", "Because", "Since", "Provided that"],
    correct_answer: "Although",
    explanation: "« Although » introduces an adverbial clause of concession showing an unexpected contrast."
  },
  {
    id: "cen185",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Subordination",
    question: "« You will pass your driving test ... you keep your concentration throughout. »",
    options: ["provided that", "unless", "in case of", "although"],
    correct_answer: "provided that",
    explanation: "« Provided that » (or 'as long as') acts as a conditional conjunction meaning 'only if'."
  },
  {
    id: "cen186",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Unless",
    question: "Rewrite using 'unless' : « If you do not hurry, you will miss the train. »",
    options: ["Unless you hurry, you will miss the train", "Unless you don't hurry, you will miss the train", "Unless you will hurry, you miss the train", "Unless hurry, you missed the train"],
    correct_answer: "Unless you hurry, you will miss the train",
    explanation: "« Unless » means 'if not'; therefore, it takes an affirmative verb clause without double negation."
  },
  {
    id: "cen187",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Antonyms",
    question: "What is the antonym of the adjective « ubiquitous » (present everywhere)?",
    options: ["Rare / scarce", "Omnipresent", "Pervasive", "Abundant"],
    correct_answer: "Rare / scarce",
    explanation: "Ubiquitous means found everywhere; its direct opposite is rare, scarce, or localized."
  },
  {
    id: "cen188",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Synonyms",
    question: "Which word is closest in meaning to « meticulous » ?",
    options: ["Thorough and precise", "Careless and sloppy", "Aggressive", "Quick and superficial"],
    correct_answer: "Thorough and precise",
    explanation: "'Meticulous' describes someone showing extreme care, thoroughness, and attention to detail."
  },
  {
    id: "cen189",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Linguistics & Pragmatics",
    question: "In pragmatic speech act theory (Austin & Searle), what does the « illocutionary force » refer to?",
    options: ["The speaker's communicative intent or purpose in saying something (e.g., promising, ordering)", "The literal acoustic phonetic sound uttered", "The consequential effect achieved on the hearer's feelings", "The syntactic parse tree of the sentence"],
    correct_answer: "The speaker's communicative intent or purpose in saying something (e.g., promising, ordering)",
    explanation: "The illocutionary act represents the functional intention performed in saying words (e.g., making a promise or request)."
  },
  {
    id: "cen190",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT Methodology & Lesson Planning",
    question: "In teaching writing, what does the « Process Writing » approach emphasize?",
    options: ["Brainstorming, drafting, peer-reviewing, revising and editing rather than merely evaluating the final product", "Copying perfect model paragraphs by hand", "Strict memorization of grammar rules without creative expression", "Focusing exclusively on mechanical spelling drills"],
    correct_answer: "Brainstorming, drafting, peer-reviewing, revising and editing rather than merely evaluating the final product",
    explanation: "Process writing views writing as a recursive, multi-stage cognitive journey of drafting and refinement."
  },
  {
    id: "cen191",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT Methodology & PPP Framework",
    question: "What does the pedagogical acronym « PPP » stand for in ELT lesson planning?",
    options: ["Presentation, Practice, Production", "Phonics, Pronunciation, Poetry", "Participation, Progress, Performance", "Planning, Peer-review, Publishing"],
    correct_answer: "Presentation, Practice, Production",
    explanation: "PPP is the classic three-stage structural lesson design: Teacher presents language, learners practice controlled forms, then produce freely."
  },
  {
    id: "cen192",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Question Tags",
    question: "Choose the correct question tag: « Nobody called while I was out, ... ? »",
    options: ["did they", "didn't they", "did he", "didn't nobody"],
    correct_answer: "did they",
    explanation: "'Nobody' is negative in meaning (requiring a positive tag) and is referred to by the plural pronoun 'they' in question tags."
  },
  {
    id: "cen193",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Question Tags",
    question: "Choose the correct question tag: « Let's take a break, ... ? »",
    options: ["shall we", "will you", "don't we", "aren't we"],
    correct_answer: "shall we",
    explanation: "The standard question tag following suggestions starting with 'Let's' is « shall we »."
  },
  {
    id: "cen194",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Discourse & Cohesion",
    question: "In text linguistics, the grammatical and lexical ties that bind a text together into a unified whole are termed:",
    options: ["Cohesion", "Coherence", "Pragmatics", "Syntax"],
    correct_answer: "Cohesion",
    explanation: "Cohesion refers to the explicit surface linguistic devices (pronouns, linkers, ellipsis) that tie sentences together."
  },
  {
    id: "cen195",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Grammar & Inversion",
    question: "Complete the sentence: « Only after completing the report ... to leave the office. »",
    options: ["was she allowed", "she was allowed", "did she allowed", "she allowed"],
    correct_answer: "was she allowed",
    explanation: "When 'Only after...' introduces a fronted adverbial element, the main clause undergoes auxiliary-subject inversion."
  },
  {
    id: "cen196",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Word Choice",
    question: "The government took measures to ... poverty in rural communities.",
    options: ["alleviate", "aggravate", "deteriorate", "inflate"],
    correct_answer: "alleviate",
    explanation: "To 'alleviate' means to make suffering, deficiency, or a problem less severe."
  },
  {
    id: "cen197",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Vocabulary & Prefixes",
    question: "Which negative prefix pairs correctly with the root word « literate » ?",
    options: ["Il- (illiterate)", "Un-", "Dis-", "Im-"],
    correct_answer: "Il- (illiterate)",
    explanation: "The negative prefix in- assimilates to il- before root words beginning with the letter 'l' (illiterate, illegal, illegible)."
  },
  {
    id: "cen198",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT & Error Correction",
    question: "In second language teaching, what is a « slip » as opposed to an « error » ?",
    options: ["A performance lapse that the learner can self-correct when pointed out", "A deep gap in grammatical competence that the learner cannot fix alone", "A permanent cognitive fossilization", "A pronunciation mistake only"],
    correct_answer: "A performance lapse that the learner can self-correct when pointed out",
    explanation: "A slip is a temporary performance failure that the student knows how to correct, unlike a systematic competence error."
  },
  {
    id: "cen199",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "ELT & Classroom Management",
    question: "What does the abbreviation « TTT » stand for in communicative teacher training?",
    options: ["Teacher Talking Time", "Total Task Testing", "Target Text Translation", "Timed Teaching Technique"],
    correct_answer: "Teacher Talking Time",
    explanation: "Minimizing excessive Teacher Talking Time (TTT) is recommended to maximize Student Talking Time (STT) and communicative output."
  },
  {
    id: "cen200",
    cycles: ["secondary_prep", "secondary_qual"],
    subject: "sec_eng",
    topic: "Literature in English",
    question: "Which Romantic poet wrote the famous lines : « I wandered lonely as a cloud / That floats on high o'er vales and hills » ?",
    options: ["William Wordsworth", "Lord Byron", "John Keats", "Percy Bysshe Shelley"],
    correct_answer: "William Wordsworth",
    explanation: "William Wordsworth composed « Daffodils » (1807), a cornerstone of English Romantic nature lyricism."
  }
];

console.log(`Generated ${engQuestions.length} secondary English questions.`);

const seedPath = path.join(__dirname, '..', 'questions_seed.json');
let allQuestions = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const engIds = new Set(engQuestions.map(q => q.id));
allQuestions = allQuestions.filter(q => !engIds.has(q.id));
allQuestions.push(...engQuestions);
allQuestions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

fs.writeFileSync(seedPath, JSON.stringify(allQuestions, null, 2), 'utf8');

const tsContent = `import type { Question } from '../types';\n\nexport const INITIAL_QUESTIONS = ${JSON.stringify(allQuestions, null, 2)} as unknown as Question[];\n`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'initialQuestions.ts'), tsContent, 'utf8');

console.log(`Total questions in bank after English update: ${allQuestions.length}`);
