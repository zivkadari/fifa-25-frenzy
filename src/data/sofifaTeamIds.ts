/**
 * Mapping from our internal club IDs to SoFIFA numeric team IDs.
 * These IDs are used with the SoFIFA API: GET https://api.sofifa.net/team/{id}
 * National teams and Prime teams are not supported by the club API.
 */
export const SOFIFA_TEAM_IDS: Record<string, number> = {
  // Premier League
  'manchester-city': 10,
  'liverpool': 9,
  'arsenal': 1,
  'chelsea': 5,
  'tottenham': 18,
  'manchester-united': 11,
  'newcastle': 13,
  'aston-villa': 2,
  'brighton': 1808,
  'crystal-palace': 1799,
  'nottingham-forest': 15,
  'west-ham': 19,
  'wolves': 110,
  'bournemouth': 1943,
  'brentford': 1800,
  'everton': 7,
  'fulham': 144,
  'leeds': 8,
  'burnley': 1796,
  'sunderland': 17,

  // La Liga
  'real-madrid': 243,
  'barcelona': 241,
  'atletico-madrid': 240,
  'athletic-bilbao': 448,
  'real-betis': 449,
  'villarreal': 483,
  'real-sociedad': 457,
  'girona': 100767,
  'valencia': 461,
  'sevilla': 481,
  'osasuna': 450,
  'celta-vigo': 452,
  'getafe': 457,
  'rayo-vallecano': 455,
  'espanyol': 452,
  'mallorca': 1854,

  // Bundesliga
  'bayern-munich': 21,
  'bayer-leverkusen': 32,
  'borussia-dortmund': 22,
  'rb-leipzig': 112172,
  'union-berlin': 1900,
  'eintracht': 1824,
  'stuttgart': 36,
  'wolfsburg': 175,
  'gladbach': 23,
  'freiburg': 25,
  'werder-bremen': 38,
  'mainz': 34,
  'hoffenheim': 10029,

  // Serie A
  'inter': 44,
  'juventus': 45,
  'ac-milan': 47,
  'napoli': 48,
  'roma': 52,
  'atalanta': 39,
  'lazio': 46,
  'fiorentina': 50,
  'bologna': 43,
  'torino': 53,
  'como': 100888,

  // Ligue 1
  'psg': 73,
  'marseille': 71,
  'lyon': 66,
  'monaco': 69,
  'lille': 67,
  'reims': 1801,
  'lens': 1807,
  'nice': 72,
  'strasbourg': 1806,

  // Rest of World
  'sporting-cp': 237,
  'fenerbahce': 88,
  'galatasaray': 325,
  'benfica': 234,
  'ajax': 245,
  'porto': 236,
  'braga': 1939,
  'psv-eindhoven': 246,
  'feyenoord': 247,
  'besiktas': 326,
  'al-ittihad': 2375,
  'al-ahli': 2378,
  'al-nassr': 2379,
  'al-hilal': 2374,
  'al-qadsiah': 114605,
  'boca-juniors': 481,
  'slavia-praha': 1888,
  'olympiacos': 1893,
  'aek-athens': 1884,
  'celtic': 76,
  'club-brugge': 232,
};

/**
 * Returns the SoFIFA numeric team ID for a given club ID.
 * Returns null if the club is a national team, prime team, or unmapped.
 */
export function getSofifaTeamId(clubId: string): number | null {
  return SOFIFA_TEAM_IDS[clubId] ?? null;
}
