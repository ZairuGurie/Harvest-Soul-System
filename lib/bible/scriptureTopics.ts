/**
 * Curated topic → reference map for Scripture-grounded retrieval.
 * References are verified against the Bible DB before being shown to users.
 */
export const SCRIPTURE_TOPICS: Array<{
  id: string;
  keywords: string[];
  references: string[];
}> = [
  {
    id: "anxiety",
    keywords: [
      "anxiety",
      "anxious",
      "worry",
      "worried",
      "fear",
      "afraid",
      "panic",
      "stress",
      "nervous",
      "overthinking",
      "scared",
    ],
    references: [
      "Philippians 4:6-7",
      "1 Peter 5:7",
      "Matthew 6:25-34",
      "Psalm 55:22",
      "Isaiah 41:10",
    ],
  },
  {
    id: "forgiveness",
    keywords: [
      "forgive",
      "forgiveness",
      "bitterness",
      "resentment",
      "unforgiveness",
      "hurt me",
      "betrayed",
      "revenge",
    ],
    references: [
      "Ephesians 4:31-32",
      "Matthew 6:14-15",
      "Colossians 3:12-13",
      "Matthew 18:21-22",
    ],
  },
  {
    id: "faith",
    keywords: [
      "faith",
      "believe",
      "belief",
      "trust god",
      "strengthen faith",
      "doubt",
      "doubting",
      "unbelief",
    ],
    references: [
      "Hebrews 11:1",
      "Romans 10:17",
      "Mark 9:23-24",
      "Proverbs 3:5-6",
      "2 Corinthians 5:7",
    ],
  },
  {
    id: "prayer",
    keywords: [
      "pray",
      "prayer",
      "praying",
      "how should i pray",
      "talk to god",
      "quiet time",
    ],
    references: [
      "Matthew 6:9-13",
      "Philippians 4:6",
      "1 Thessalonians 5:16-18",
      "James 5:16",
      "Luke 11:1-4",
    ],
  },
  {
    id: "temptation",
    keywords: [
      "temptation",
      "tempted",
      "resist sin",
      "lust",
      "addiction",
      "porn",
      "habit",
      "fall into sin",
    ],
    references: [
      "1 Corinthians 10:13",
      "James 1:12-15",
      "Matthew 26:41",
      "Galatians 5:16",
      "Psalm 119:11",
    ],
  },
  {
    id: "love",
    keywords: ["love", "loving", "charity", "agape", "kindness", "compassion"],
    references: [
      "1 Corinthians 13:4-7",
      "John 13:34-35",
      "1 John 4:7-11",
      "Romans 12:9-10",
    ],
  },
  {
    id: "hope",
    keywords: [
      "hope",
      "hopeless",
      "discouraged",
      "discouragement",
      "despair",
      "give up",
      "giving up",
    ],
    references: [
      "Romans 15:13",
      "Jeremiah 29:11",
      "Psalm 42:5",
      "Lamentations 3:22-23",
      "Romans 8:28",
    ],
  },
  {
    id: "grief",
    keywords: [
      "grief",
      "grieving",
      "mourning",
      "loss",
      "died",
      "death",
      "bereaved",
      "funeral",
      "passed away",
    ],
    references: [
      "Psalm 34:18",
      "Matthew 5:4",
      "Revelation 21:4",
      "2 Corinthians 1:3-4",
      "John 11:25-26",
    ],
  },
  {
    id: "wisdom",
    keywords: [
      "wisdom",
      "wise",
      "decision",
      "decide",
      "guidance",
      "counsel",
      "job",
      "career",
      "should i",
      "confused",
      "what should i do",
      "choice",
      "choices",
    ],
    references: [
      "James 1:5",
      "Proverbs 3:5-6",
      "Proverbs 15:22",
      "Proverbs 16:3",
      "Psalm 32:8",
    ],
  },
  {
    id: "peace",
    keywords: ["peace", "rest", "calm", "troubled", "chaos", "overwhelmed"],
    references: ["John 14:27", "Isaiah 26:3", "Philippians 4:7", "Colossians 3:15"],
  },
  {
    id: "strength",
    keywords: [
      "strength",
      "weak",
      "weary",
      "tired",
      "exhausted",
      "burnout",
      "burned out",
    ],
    references: [
      "Isaiah 40:31",
      "Philippians 4:13",
      "2 Corinthians 12:9-10",
      "Psalm 46:1",
    ],
  },
  {
    id: "salvation",
    keywords: [
      "salvation",
      "saved",
      "gospel",
      "eternal life",
      "born again",
      "jesus",
      "how to be saved",
      "accept christ",
      "christian",
    ],
    references: [
      "John 3:16",
      "Romans 10:9-10",
      "Ephesians 2:8-9",
      "Acts 4:12",
      "Romans 3:23-24",
    ],
  },
  {
    id: "gratitude",
    keywords: ["thank", "thanksgiving", "grateful", "gratitude", "appreciate"],
    references: [
      "1 Thessalonians 5:18",
      "Psalm 100:4",
      "Colossians 3:15-17",
      "Psalm 107:1",
    ],
  },
  {
    id: "humility",
    keywords: ["humble", "humility", "pride", "proud", "ego", "arrogant"],
    references: ["Philippians 2:3-8", "James 4:6", "Micah 6:8", "1 Peter 5:5-6"],
  },
  {
    id: "marriage",
    keywords: [
      "marriage",
      "spouse",
      "husband",
      "wife",
      "wedding",
      "married",
      "divorce",
    ],
    references: [
      "Ephesians 5:21-33",
      "1 Corinthians 13:4-7",
      "Colossians 3:18-19",
      "Genesis 2:24",
    ],
  },
  {
    id: "relationships",
    keywords: [
      "relationship",
      "boyfriend",
      "girlfriend",
      "dating",
      "friend",
      "friends",
      "friendship",
      "breakup",
      "broken heart",
    ],
    references: [
      "1 Corinthians 13:4-7",
      "Proverbs 13:20",
      "Ecclesiastes 4:9-10",
      "Romans 12:10",
      "Proverbs 27:17",
    ],
  },
  {
    id: "parenting",
    keywords: [
      "parent",
      "parenting",
      "children",
      "child",
      "kids",
      "family",
      "son",
      "daughter",
    ],
    references: [
      "Ephesians 6:1-4",
      "Proverbs 22:6",
      "Deuteronomy 6:6-7",
      "Colossians 3:20-21",
    ],
  },
  {
    id: "money",
    keywords: [
      "money",
      "finances",
      "financial",
      "wealth",
      "poor",
      "giving",
      "tithe",
      "steward",
      "debt",
      "bills",
      "salary",
      "broke",
    ],
    references: [
      "Matthew 6:19-21",
      "1 Timothy 6:6-10",
      "Proverbs 3:9-10",
      "2 Corinthians 9:6-7",
      "Hebrews 13:5",
    ],
  },
  {
    id: "loneliness",
    keywords: [
      "lonely",
      "loneliness",
      "alone",
      "abandoned",
      "isolated",
      "no one",
      "left out",
    ],
    references: [
      "Deuteronomy 31:6",
      "Psalm 23:1-4",
      "Isaiah 41:10",
      "Matthew 28:20",
      "Hebrews 13:5",
    ],
  },
  {
    id: "anger",
    keywords: ["anger", "angry", "rage", "wrath", "mad", "frustrated", "hate"],
    references: [
      "Ephesians 4:26-27",
      "James 1:19-20",
      "Proverbs 15:1",
      "Colossians 3:8",
    ],
  },
  {
    id: "spiritual growth",
    keywords: [
      "grow",
      "growth",
      "spiritually",
      "discipleship",
      "mature",
      "devotional",
      "devotion",
      "bible study",
      "read the bible",
    ],
    references: [
      "2 Peter 3:18",
      "Colossians 2:6-7",
      "Psalm 1:1-3",
      "Joshua 1:8",
      "Romans 12:1-2",
    ],
  },
  {
    id: "guilt",
    keywords: [
      "guilt",
      "guilty",
      "shame",
      "condemnation",
      "confess",
      "regret",
      "sorry",
      "mistakes",
    ],
    references: ["1 John 1:9", "Romans 8:1", "Psalm 51:1-12", "Psalm 32:1-5"],
  },
  {
    id: "service",
    keywords: [
      "serve",
      "service",
      "ministry",
      "volunteer",
      "help others",
      "calling",
      "purpose",
    ],
    references: [
      "Mark 10:45",
      "Galatians 5:13",
      "1 Peter 4:10",
      "Matthew 25:35-40",
    ],
  },
  {
    id: "suffering",
    keywords: [
      "suffer",
      "suffering",
      "pain",
      "trial",
      "trials",
      "hardship",
      "why me",
      "unfair",
      "sick",
      "illness",
    ],
    references: [
      "Romans 5:3-5",
      "James 1:2-4",
      "2 Corinthians 4:16-18",
      "Psalm 34:18",
      "Romans 8:28",
    ],
  },
  {
    id: "identity",
    keywords: [
      "identity",
      "who am i",
      "worth",
      "self-esteem",
      "insecure",
      "insecurity",
      "value",
      "compare",
      "comparison",
    ],
    references: [
      "Psalm 139:13-14",
      "Ephesians 2:10",
      "2 Corinthians 5:17",
      "Genesis 1:27",
      "1 Peter 2:9",
    ],
  },
  {
    id: "work",
    keywords: [
      "work",
      "workplace",
      "boss",
      "coworker",
      "school",
      "studies",
      "exam",
      "business",
    ],
    references: [
      "Colossians 3:23-24",
      "Proverbs 16:3",
      "Ecclesiastes 9:10",
      "Proverbs 22:29",
    ],
  },
  {
    id: "patience",
    keywords: ["patience", "patient", "waiting", "wait on god", "delay"],
    references: [
      "Romans 12:12",
      "Galatians 5:22-23",
      "Psalm 27:14",
      "James 5:7-8",
    ],
  },
  {
    id: "truth",
    keywords: ["truth", "lie", "lying", "honesty", "integrity", "fake"],
    references: [
      "Ephesians 4:25",
      "Proverbs 12:22",
      "John 8:32",
      "Psalm 15:1-2",
    ],
  },
];

/** Light synonym expansion so retrieval catches paraphrased questions. */
const QUERY_SYNONYMS: Array<{ pattern: RegExp; inject: string }> = [
  { pattern: /\bscared\b|\bterrified\b|\bnervous\b/i, inject: "fear anxiety" },
  { pattern: /\bheartbroken\b|\bbreak ?up\b|\bdumped\b/i, inject: "grief loneliness relationships" },
  { pattern: /\bmoney problems?\b|\bno money\b|\bcan't pay\b|\bcant pay\b/i, inject: "money finances" },
  { pattern: /\bdon't know what to do\b|\bdont know what to do\b|\bstuck\b/i, inject: "wisdom decision guidance" },
  { pattern: /\bfeel empty\b|\bmeaningless\b|\bno purpose\b/i, inject: "hope purpose identity" },
  { pattern: /\bhow do i talk to god\b|\bhow can i talk to god\b/i, inject: "pray prayer" },
  { pattern: /\bam i enough\b|\bnot good enough\b|\bworthless\b/i, inject: "identity worth shame" },
  { pattern: /\bwhy is this happening\b|\bwhy god\b/i, inject: "suffering trials hope" },
  { pattern: /\bmy friend\b|\bfriends?\b|\bclassmate\b/i, inject: "friendship relationships love" },
  { pattern: /\bboss\b|\bcoworker\b|\boffice\b/i, inject: "work wisdom patience" },
];

export function expandQueryForMatching(query: string): string {
  let expanded = query;
  for (const rule of QUERY_SYNONYMS) {
    if (rule.pattern.test(query)) {
      expanded += ` ${rule.inject}`;
    }
  }
  return expanded;
}

export function matchTopics(query: string): typeof SCRIPTURE_TOPICS {
  const expanded = expandQueryForMatching(query).toLowerCase();
  const scored = SCRIPTURE_TOPICS.map((topic) => {
    let score = 0;
    for (const kw of topic.keywords) {
      if (expanded.includes(kw.toLowerCase())) {
        // Longer phrase matches are stronger signals
        score += Math.max(1, Math.floor(kw.length / 4));
      }
    }
    return { topic, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map((row) => row.topic);
}
