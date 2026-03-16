/**
 * Hebrew / transliterated aliases for FIFA clubs.
 * Maps spoken Hebrew names to canonical club IDs used in the app.
 * Order matters: more specific aliases should come first.
 */

export const HEBREW_CLUB_ALIASES: Record<string, string[]> = {
  // Premier League
  'manchester-city': ['מנצ\'סטר סיטי', 'מנצסטר סיטי', 'מן סיטי', 'סיטי', 'מנצ סיטי', 'מנצסטר סטי', 'מנציסטר סיטי', 'מנצסטר סטי'],
  'liverpool': ['ליברפול', 'ליוורפול'],
  'arsenal': ['ארסנל', 'ארסנאל'],
  'chelsea': ['צ\'לסי', 'צלסי', 'צלסיה', 'צלצי', 'צ\'לצי'],
  'tottenham': ['טוטנהאם', 'טוטנהם', 'ספרס'],
  'manchester-united': ['מנצ\'סטר יונייטד', 'מנצסטר יונייטד', 'מן יונייטד', 'יונייטד'],
  'newcastle': ['ניוקאסל'],
  'aston-villa': ['אסטון וילה', 'וילה'],
  'brighton': ['ברייטון'],
  'crystal-palace': ['קריסטל פאלאס', 'פאלאס'],
  'nottingham-forest': ['נוטינגהאם פורסט', 'נוטינגהם פורסט', 'פורסט'],
  'west-ham': ['ווסטהאם', 'וסט האם', 'וסטהאם'],
  'wolves': ['וולבס', 'וולברהמפטון'],
  'bournemouth': ['בורנמות\'', 'בורנמות'],
  'brentford': ['ברנטפורד'],
  'everton': ['אברטון'],
  'fulham': ['פולהאם', 'פולם'],
  'leeds': ['לידס'],
  'burnley': ['ברנלי'],
  'sunderland': ['סנדרלנד'],

  // La Liga
  'real-madrid': ['ריאל מדריד', 'ריאל', 'מדריד'],
  'barcelona': ['ברצלונה', 'ברצה', 'בארסה', 'בארצלונה'],
  'atletico-madrid': ['אתלטיקו מדריד', 'אתלטיקו', 'אטלטיקו'],
  'athletic-bilbao': ['אתלטיק בילבאו', 'בילבאו'],
  'real-betis': ['ריאל בטיס', 'בטיס'],
  'villarreal': ['ויאריאל', 'ויאראל'],
  'real-sociedad': ['ריאל סוסיאדד', 'סוסיאדד'],
  'girona': ['ג\'ירונה', 'ג\'ירונא', 'חירונה'],
  'valencia': ['ולנסיה', 'ולנסייה'],
  'sevilla': ['סביליה', 'סביליא'],
  'osasuna': ['אוססונה'],
  'celta-vigo': ['סלטה ויגו', 'סלטה'],
  'getafe': ['חטאפה'],
  'rayo-vallecano': ['ראיו ויקאנו', 'ראיו'],
  'espanyol': ['אספניול'],
  'mallorca': ['מיורקה'],

  // Bundesliga
  'bayern-munich': ['באיירן מינכן', 'באיירן', 'מינכן', 'ביירן'],
  'bayer-leverkusen': ['לברקוזן', 'באייר לברקוזן'],
  'borussia-dortmund': ['דורטמונד', 'בורוסיה דורטמונד'],
  'rb-leipzig': ['לייפציג', 'לייפציח'],
  'union-berlin': ['אוניון ברלין'],
  'eintracht': ['אינטרכט פרנקפורט', 'פרנקפורט', 'אינטראכט'],
  'stuttgart': ['שטוטגרט'],
  'wolfsburg': ['וולפסבורג'],
  'gladbach': ['מנשנגלדבאך', 'גלדבאך'],
  'freiburg': ['פרייבורג'],
  'werder-bremen': ['ורדר ברמן', 'ברמן'],
  'mainz': ['מיינץ', 'מיינצ'],
  'hoffenheim': ['הופנהיים'],

  // Serie A
  'inter': ['אינטר', 'אינטר מילאן'],
  'juventus': ['יובנטוס', 'יובה'],
  'ac-milan': ['מילאן', 'אי סי מילאן', 'מילן'],
  'napoli': ['נאפולי'],
  'roma': ['רומא'],
  'atalanta': ['אטאלנטה', 'אטלנטה'],
  'lazio': ['לאציו'],
  'fiorentina': ['פיורנטינה'],
  'bologna': ['בולוניה'],
  'torino': ['טורינו'],
  'como': ['קומו'],

  // Ligue 1
  'psg': ['פסז\'', 'פסז', 'פריז סן ז\'רמן', 'פאריס', 'פריז'],
  'marseille': ['מרסיי', 'מרסיל'],
  'lyon': ['ליון'],
  'monaco': ['מונאקו'],
  'lille': ['ליל'],
  'reims': ['ריימס'],
  'lens': ['לאנס', 'לנס'],
  'nice': ['ניס'],
  'strasbourg': ['שטרסבורג'],

  // Rest of World
  'sporting-cp': ['ספורטינג', 'ספורטינג ליסבון'],
  'fenerbahce': ['פנרבחצ\'ה', 'פנרבחצה', 'פנר'],
  'galatasaray': ['גלאטסראי', 'גלטסראי'],
  'benfica': ['בנפיקה'],
  'ajax': ['אייאקס', 'אייקס'],
  'porto': ['פורטו'],
  'braga': ['בראגה'],
  'psv-eindhoven': ['איינדהובן', 'פ.ס.ו'],
  'feyenoord': ['פיינורד'],
  'besiktas': ['בשיקטאש'],
  'al-ittihad': ['אל איתיחאד', 'איתיחאד'],
  'al-ahli': ['אל אהלי', 'אהלי'],
  'al-nassr': ['אל נאסר', 'נאסר'],
  'al-hilal': ['אל הילאל', 'הילאל'],
  'al-qadsiah': ['אל קאדסיה', 'קאדסיה'],
  'boca-juniors': ['בוקה ג\'וניורס', 'בוקה'],
  'slavia-praha': ['סלאביה פראג'],
  'olympiacos': ['אולימפיאקוס'],
  'aek-athens': ['אאק', 'א.א.ק'],
  'celtic': ['סלטיק'],

  // International
  'france': ['צרפת'],
  'england': ['אנגליה'],
  'spain': ['ספרד'],
  'argentina': ['ארגנטינה'],
  'germany': ['גרמניה'],
  'italy': ['איטליה'],
  'netherlands': ['הולנד'],
  'portugal': ['פורטוגל'],
  'croatia': ['קרואטיה'],
  'morocco': ['מרוקו'],
  'czechia': ['צ\'כיה', 'צכיה'],
  'ghana': ['גאנה'],
  'mexico': ['מקסיקו'],
  'norway': ['נורבגיה'],
  'scotland': ['סקוטלנד'],
  'sweden': ['שבדיה'],
  'united-states': ['ארצות הברית', 'ארה"ב'],
  'poland': ['פולין'],
  'ukraine': ['אוקראינה'],
  'denmark': ['דנמרק'],

  // Prime
  'serie-a-xi': ['סרייה א אחד עשר', 'סרייה א'],
  'soccer-aid': ['סוקר אייד'],
  'classic-xi': ['קלאסיק'],
  'bundesliga-xi': ['בונדסליגה אחד עשר', 'בונדסליגה'],
  'chelsea-xi': ['צלסי אחד עשר'],
  'bayern-xi': ['באיירן אחד עשר'],
  'juventus-xi': ['יובנטוס אחד עשר'],
  'la-liga-xi': ['לה ליגה אחד עשר', 'לה ליגה'],
  'ligue-1-xi': ['ליג אחת אחד עשר'],
  'liverpool-xi': ['ליברפול אחד עשר'],
  'premier-league-xi': ['פרמיירליג אחד עשר', 'פרמיירליג'],
};

/**
 * Common Hebrew ASR (speech-to-text) substitution mistakes.
 * Maps commonly mistranscribed words to their likely intended words.
 * Applied as a preprocessing step before alias lookup.
 */
export const ASR_CORRECTIONS: [RegExp, string][] = [
  // "על הלל" → "אל הילאל"
  [/על הלל/g, 'אל הילאל'],
  [/על ה[יי]לל/g, 'אל הילאל'],
  [/אל הלל/g, 'אל הילאל'],
  // "על אהלי" → "אל אהלי"
  [/על אהלי/g, 'אל אהלי'],
  // "על נאסר" → "אל נאסר"
  [/על נאסר/g, 'אל נאסר'],
  [/על נסר/g, 'אל נאסר'],
  // "על איתי חד" → "אל איתיחאד"
  [/על איתי\s*חד/g, 'אל איתיחאד'],
  [/אל איתי\s*חד/g, 'אל איתיחאד'],
  // common misspellings for PSG
  [/פי\s*אס\s*ג/g, 'פסז'],
  [/פ\s*ס\s*ז/g, 'פסז'],
  // "מנצסטר" variants
  [/מנצי?סטר/g, 'מנצסטר'],
  [/מנצסתר/g, 'מנצסטר'],
  // "ארסנאל" / "ארסנל" 
  [/ארס[ינ]ל/g, 'ארסנל'],
  // "ברצלונה" variants
  [/בר[סצ]לונ[הא]/g, 'ברצלונה'],
  // "יובנטוס" variants
  [/יוב[נא]טוס/g, 'יובנטוס'],
  // "ליברפול" variants
  [/ליב[רא]פול/g, 'ליברפול'],
  [/ליוורפול/g, 'ליברפול'],
];

/**
 * Normalize a string for fuzzy matching: lowercase, remove quotes/apostrophes, trim
 */
export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"״׳`']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Apply ASR correction rules to a transcript before parsing.
 */
export function applyAsrCorrections(text: string): string {
  let corrected = text;
  for (const [pattern, replacement] of ASR_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}

/**
 * Build a reverse lookup: normalized alias → club ID
 * Also includes English names from the clubs data.
 */
export function buildAliasLookup(clubs: { id: string; name: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  
  // Add Hebrew aliases
  for (const [clubId, aliases] of Object.entries(HEBREW_CLUB_ALIASES)) {
    for (const alias of aliases) {
      map.set(normalizeForMatch(alias), clubId);
    }
  }
  
  // Add English names (from clubs data)
  for (const club of clubs) {
    map.set(normalizeForMatch(club.name), club.id);
    // Also add just the first word for common short references
    const firstName = club.name.split(' ')[0];
    if (firstName.length > 3 && !map.has(normalizeForMatch(firstName))) {
      map.set(normalizeForMatch(firstName), club.id);
    }
  }
  
  return map;
}

/**
 * Compute Levenshtein distance between two strings (for fuzzy matching).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * Find the best matching club ID for a spoken name.
 * Supports exact match, substring match, and fuzzy (Levenshtein) match.
 * Prefers clubs in the given context pool.
 */
export function findClubMatch(
  spokenName: string,
  aliasLookup: Map<string, string>,
  contextClubIds?: Set<string>
): { clubId: string; confidence: number } | null {
  const normalized = normalizeForMatch(spokenName);
  if (!normalized || normalized.length < 2) return null;
  
  // Direct match
  const directMatch = aliasLookup.get(normalized);
  if (directMatch) {
    return { clubId: directMatch, confidence: contextClubIds?.has(directMatch) ? 1.0 : 0.8 };
  }
  
  // Substring match: check if any alias is contained in the spoken name or vice versa
  let bestMatch: { clubId: string; confidence: number; length: number } | null = null;
  
  for (const [alias, clubId] of aliasLookup.entries()) {
    if (alias.length < 2) continue;
    if (normalized.includes(alias) || alias.includes(normalized)) {
      const matchLength = Math.min(alias.length, normalized.length);
      const confidence = contextClubIds?.has(clubId) ? 0.7 : 0.5;
      if (!bestMatch || matchLength > bestMatch.length || (matchLength === bestMatch.length && contextClubIds?.has(clubId))) {
        bestMatch = { clubId, confidence, length: matchLength };
      }
    }
  }
  
  if (bestMatch) return { clubId: bestMatch.clubId, confidence: bestMatch.confidence };

  // Fuzzy match: try Levenshtein distance for context clubs first
  if (contextClubIds && contextClubIds.size > 0) {
    let bestFuzzy: { clubId: string; distance: number } | null = null;
    for (const [alias, clubId] of aliasLookup.entries()) {
      if (!contextClubIds.has(clubId)) continue;
      if (alias.length < 2) continue;
      const dist = levenshtein(normalized, alias);
      const maxLen = Math.max(normalized.length, alias.length);
      // Allow up to 30% character difference
      if (dist <= Math.ceil(maxLen * 0.3) && (!bestFuzzy || dist < bestFuzzy.distance)) {
        bestFuzzy = { clubId, distance: dist };
      }
    }
    if (bestFuzzy) {
      return { clubId: bestFuzzy.clubId, confidence: 0.55 };
    }
  }

  // Global fuzzy match (lower confidence)
  {
    let bestFuzzy: { clubId: string; distance: number } | null = null;
    for (const [alias, clubId] of aliasLookup.entries()) {
      if (alias.length < 3) continue;
      const dist = levenshtein(normalized, alias);
      const maxLen = Math.max(normalized.length, alias.length);
      if (dist <= Math.ceil(maxLen * 0.25) && (!bestFuzzy || dist < bestFuzzy.distance)) {
        bestFuzzy = { clubId, distance: dist };
      }
    }
    if (bestFuzzy) {
      return { clubId: bestFuzzy.clubId, confidence: 0.4 };
    }
  }
  
  return null;
}
