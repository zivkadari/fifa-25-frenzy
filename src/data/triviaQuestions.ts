export interface TriviaQuestion {
  id: number;
  question_text: string;
  correct_answer: number;
  min_value: number;
  max_value: number;
  category: 'world' | 'israel';
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { id: 1, question_text: "How many total goals were scored in all FIFA World Cup tournaments up to 2022?", correct_answer: 2720, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "FIFA" },
  { id: 2, question_text: "How many goals were scored in the UEFA Champions League finals (1956–2023)?", correct_answer: 404, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 3, question_text: "How many matches have been played in all FIFA World Cups up to 2022?", correct_answer: 964, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 4, question_text: "How many goals were scored in the UEFA Champions League from 1992 to 2023?", correct_answer: 8900, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 5, question_text: "How many goals did Lionel Messi score in official club competitions up to 2023?", correct_answer: 704, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FC Barcelona / PSG" },
  { id: 6, question_text: "How many goals did Cristiano Ronaldo score in official club competitions up to 2023?", correct_answer: 710, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 7, question_text: "How many goals were scored in the 2018 FIFA World Cup?", correct_answer: 169, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 8, question_text: "How many total goals were scored in all UEFA European Championship tournaments up to 2021?", correct_answer: 694, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 9, question_text: "How many matches did Xavi Hernández play for FC Barcelona in all competitions?", correct_answer: 767, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FC Barcelona" },
  { id: 10, question_text: "How many matches did Gianluigi Buffon play in his professional club career?", correct_answer: 975, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "Juventus" },
  { id: 11, question_text: "How many league titles has Real Madrid won by 2023?", correct_answer: 35, min_value: 0, max_value: 100, category: "world", difficulty: "medium", source: "La Liga" },
  { id: 12, question_text: "How many league titles has Manchester United won by 2023?", correct_answer: 20, min_value: 0, max_value: 100, category: "world", difficulty: "easy", source: "Premier League" },
  { id: 13, question_text: "How many goals were scored in the 2022 FIFA World Cup?", correct_answer: 172, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 14, question_text: "How many official matches has Andrés Iniesta played in his career?", correct_answer: 887, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "FIFA" },
  { id: 15, question_text: "How many Champions League matches has Real Madrid played up to 2023?", correct_answer: 486, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 16, question_text: "How many total goals were scored in all Israeli Premier League seasons up to 2023?", correct_answer: 23000, min_value: 0, max_value: 50000, category: "israel", difficulty: "hard", source: "IFA" },
  { id: 17, question_text: "How many league titles has Maccabi Tel Aviv won by 2023?", correct_answer: 24, min_value: 0, max_value: 100, category: "israel", difficulty: "medium", source: "Club records" },
  { id: 18, question_text: "How many official matches has Yossi Benayoun played in his club career?", correct_answer: 670, min_value: 0, max_value: 1000, category: "israel", difficulty: "medium", source: "Transfermarkt" },
  { id: 19, question_text: "How many goals were scored in all UEFA Champions League matches between 2010–2020?", correct_answer: 3400, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 20, question_text: "How many goals did Zlatan Ibrahimović score in his professional career?", correct_answer: 573, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 21, question_text: "How many matches were played in the UEFA Euro 2020 tournament?", correct_answer: 51, min_value: 0, max_value: 100, category: "world", difficulty: "easy", source: "UEFA" },
  { id: 22, question_text: "How many goals were scored in the 2006 FIFA World Cup?", correct_answer: 147, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 23, question_text: "How many goals did Thierry Henry score in his professional club career?", correct_answer: 360, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Arsenal" },
  { id: 24, question_text: "How many matches did Sergio Ramos play for Real Madrid?", correct_answer: 671, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Real Madrid" },
  { id: 25, question_text: "How many goals were scored in all Champions League knockout-stage matches up to 2023?", correct_answer: 3200, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 26, question_text: "How many official matches has the Israel national team played up to 2024?", correct_answer: 600, min_value: 0, max_value: 1000, category: "israel", difficulty: "hard", source: "All official internationals" },
  { id: 27, question_text: "How many total goals has the Israel national team scored up to 2024?", correct_answer: 1900, min_value: 0, max_value: 10000, category: "israel", difficulty: "hard", source: "Official matches" },
  { id: 28, question_text: "How many caps does Yossi Benayoun have for Israel?", correct_answer: 102, min_value: 0, max_value: 1000, category: "israel", difficulty: "medium", source: "Record holder" },
  { id: 29, question_text: "How many goals did Yossi Benayoun score for the Israel national team?", correct_answer: 24, min_value: 0, max_value: 100, category: "israel", difficulty: "medium", source: "Official goals" },
  { id: 30, question_text: "How many league titles has Maccabi Haifa won by 2024?", correct_answer: 15, min_value: 0, max_value: 100, category: "israel", difficulty: "medium", source: "Liga championships" },
  { id: 31, question_text: "How many league titles has Hapoel Tel Aviv won by 2024?", correct_answer: 13, min_value: 0, max_value: 100, category: "israel", difficulty: "medium", source: "Club records" },
  { id: 32, question_text: "How many league titles has Beitar Jerusalem won by 2024?", correct_answer: 6, min_value: 0, max_value: 100, category: "israel", difficulty: "easy", source: "Club records" },
  { id: 33, question_text: "How many total goals were scored in Israeli Premier League history up to 2024?", correct_answer: 23000, min_value: 0, max_value: 50000, category: "israel", difficulty: "hard", source: "League aggregate" },
  { id: 34, question_text: "How many matches has Eran Zahavi played in his club career up to 2024?", correct_answer: 620, min_value: 0, max_value: 1000, category: "israel", difficulty: "medium", source: "Club career" },
  { id: 35, question_text: "How many goals has Eran Zahavi scored in his club career up to 2024?", correct_answer: 320, min_value: 0, max_value: 1000, category: "israel", difficulty: "medium", source: "Club career" },
  { id: 36, question_text: "How many goals has Eran Zahavi scored for the Israel national team?", correct_answer: 33, min_value: 0, max_value: 100, category: "israel", difficulty: "medium", source: "All-time top scorer" },
  { id: 37, question_text: "How many matches did Hapoel Tel Aviv play in European competitions up to 2024?", correct_answer: 110, min_value: 0, max_value: 1000, category: "israel", difficulty: "hard", source: "UEFA matches" },
  { id: 38, question_text: "How many matches did Maccabi Tel Aviv play in European competitions up to 2024?", correct_answer: 170, min_value: 0, max_value: 1000, category: "israel", difficulty: "hard", source: "UEFA matches" },
  { id: 39, question_text: "How many goals did Maccabi Haifa score in European competitions up to 2024?", correct_answer: 180, min_value: 0, max_value: 1000, category: "israel", difficulty: "hard", source: "UEFA aggregate" },
  { id: 40, question_text: "How many matches did the Israel national team play in World Cup qualifiers up to 2024?", correct_answer: 180, min_value: 0, max_value: 1000, category: "israel", difficulty: "hard", source: "FIFA qualifiers" },
  { id: 41, question_text: "How many goals were scored in all UEFA Champions League matches up to 2023?", correct_answer: 24000, min_value: 0, max_value: 50000, category: "world", difficulty: "hard", source: "UEFA total" },
  { id: 42, question_text: "How many matches were played in UEFA Champions League history up to 2023?", correct_answer: 8500, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "UEFA total" },
  { id: 43, question_text: "How many goals did Lionel Messi score in all official competitions up to 2024?", correct_answer: 821, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Locked to 2024" },
  { id: 44, question_text: "How many goals did Cristiano Ronaldo score in all official competitions up to 2024?", correct_answer: 873, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Locked to 2024" },
  { id: 45, question_text: "How many official matches did Cristiano Ronaldo play in his career up to 2024?", correct_answer: 1180, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "Career total" },
  { id: 46, question_text: "How many official matches did Lionel Messi play in his career up to 2024?", correct_answer: 1040, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "Career total" },
  { id: 47, question_text: "How many goals were scored in all FIFA World Cups up to 2022?", correct_answer: 2720, min_value: 0, max_value: 10000, category: "world", difficulty: "hard", source: "FIFA" },
  { id: 48, question_text: "How many matches were played in all FIFA World Cups up to 2022?", correct_answer: 964, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "FIFA" },
  { id: 49, question_text: "How many goals were scored in all European Championship tournaments up to 2021?", correct_answer: 694, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "UEFA" },
  { id: 50, question_text: "How many matches did Gianluigi Buffon play in his professional club career?", correct_answer: 975, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "Career total" },
  { id: 51, question_text: "How many goals did Zlatan Ibrahimović score in his professional career?", correct_answer: 573, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Career total" },
  { id: 52, question_text: "How many matches did Andrés Iniesta play in his professional career?", correct_answer: 887, min_value: 0, max_value: 1000, category: "world", difficulty: "hard", source: "Career total" },
  { id: 53, question_text: "How many goals were scored in the 2022 FIFA World Cup?", correct_answer: 172, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Tournament total" },
  { id: 54, question_text: "How many goals were scored in the 2018 FIFA World Cup?", correct_answer: 169, min_value: 0, max_value: 1000, category: "world", difficulty: "medium", source: "Tournament total" },
  { id: 55, question_text: "How many Champions League titles has Real Madrid won by 2024?", correct_answer: 14, min_value: 0, max_value: 100, category: "world", difficulty: "easy", source: "Record holder" },
];

/**
 * Get a random question that hasn't been used yet in this session
 */
export function getRandomQuestion(usedIds: number[]): TriviaQuestion | null {
  const available = TRIVIA_QUESTIONS.filter(q => !usedIds.includes(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export interface TierConfigEntry {
  stars: number;
  count: number;
  label: string;
  isPrime?: boolean;
  includeNational?: boolean;
}

/**
 * Get tier configuration based on winsToComplete (hardcoded fallback)
 */
export function getTierConfig(winsToComplete: number): TierConfigEntry[] {
  switch (winsToComplete) {
    case 4:
      return [
        { stars: 5, count: 2, label: '5 כוכבים', includeNational: true },
        { stars: 4.5, count: 3, label: '4.5 כוכבים', includeNational: true },
        { stars: 4, count: 2, label: '4 כוכבים', includeNational: false },
      ];
    case 5:
      return [
        { stars: 5, count: 1, label: 'Prime', isPrime: true },
        { stars: 5, count: 3, label: '5 כוכבים', includeNational: true },
        { stars: 4.5, count: 3, label: '4.5 כוכבים', includeNational: true },
        { stars: 4, count: 2, label: '4 כוכבים', includeNational: false },
      ];
    case 6:
    default:
      return [
        { stars: 5, count: 3, label: '5 כוכבים', includeNational: true },
        { stars: 4.5, count: 4, label: '4.5 כוכבים', includeNational: true },
        { stars: 4, count: 4, label: '4 כוכבים', includeNational: false },
      ];
  }
}

/**
 * Build tier config from admin PoolConfig (database-driven).
 * This ensures Trivia Mode uses the exact same composition as Random Mode.
 */
export function buildTierConfigFromPoolConfig(config: import('@/data/poolConfig').PoolConfig): TierConfigEntry[] {
  const tiers: TierConfigEntry[] = [];

  // Add Prime tier first if enabled
  if (config.include_prime && config.prime_count > 0) {
    tiers.push({
      stars: 5,
      count: config.prime_count,
      label: 'Prime',
      isPrime: true,
      includeNational: false,
    });
  }

  // Add distribution entries
  for (const entry of config.distribution) {
    const starLabel = entry.stars === 5 ? '5 כוכבים' : entry.stars === 4.5 ? '4.5 כוכבים' : '4 כוכבים';
    tiers.push({
      stars: entry.stars,
      count: entry.count,
      label: starLabel,
      isPrime: false,
      includeNational: entry.include_national,
    });
  }

  return tiers;
}
