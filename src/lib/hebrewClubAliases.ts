/**
 * Hebrew / transliterated aliases for FIFA clubs.
 * Maps spoken Hebrew names to canonical club IDs used in the app.
 * Order matters: more specific aliases should come first.
 */

export const HEBREW_CLUB_ALIASES: Record<string, string[]> = {
  // Premier League
  'manchester-city': ['מנצ\'סטר סיטי', 'מנצסטר סיטי', 'מן סיטי', 'סיטי', 'מנצ סיטי', 'מנצסטר סטי'],
  'liverpool': ['ליברפול'],
  'arsenal': ['ארסנל', 'ארסנאל'],
  'chelsea': ['צ\'לסי', 'צלסי', 'צלסיה'],
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
 * Find the best matching club ID for a spoken name, preferring clubs in the given context pool.
 */
export function findClubMatch(
  spokenName: string,
  aliasLookup: Map<string, string>,
  contextClubIds?: Set<string>
): { clubId: string; confidence: number } | null {
  const normalized = normalizeForMatch(spokenName);
  if (!normalized) return null;
  
  // Direct match
  const directMatch = aliasLookup.get(normalized);
  if (directMatch) {
    return { clubId: directMatch, confidence: contextClubIds?.has(directMatch) ? 1.0 : 0.8 };
  }
  
  // Substring match: check if any alias is contained in the spoken name or vice versa
  let bestMatch: { clubId: string; confidence: number; length: number } | null = null;
  
  for (const [alias, clubId] of aliasLookup.entries()) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      const matchLength = Math.min(alias.length, normalized.length);
      const confidence = contextClubIds?.has(clubId) ? 0.7 : 0.5;
      if (!bestMatch || matchLength > bestMatch.length || (matchLength === bestMatch.length && contextClubIds?.has(clubId))) {
        bestMatch = { clubId, confidence, length: matchLength };
      }
    }
  }
  
  if (bestMatch) return { clubId: bestMatch.clubId, confidence: bestMatch.confidence };
  
  return null;
}
