import { Club } from '@/types/tournament';
import { supabase } from '@/integrations/supabase/client';

// Club overrides cache
let clubOverridesCache: Record<string, number> | null = null;
let lastOverridesFetch = 0;
const OVERRIDES_CACHE_TTL = 60000; // 1 minute

export const FIFA_CLUBS: Club[] = [
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League (England)
  { id: 'manchester-city', name: 'Manchester City', stars: 5, league: 'Premier League' },
  { id: 'liverpool', name: 'Liverpool', stars: 5, league: 'Premier League' },
  { id: 'arsenal', name: 'Arsenal', stars: 5, league: 'Premier League' },
  { id: 'chelsea', name: 'Chelsea', stars: 4.5, league: 'Premier League' },
  { id: 'tottenham', name: 'Tottenham Hotspur', stars: 4.5, league: 'Premier League' },
  { id: 'manchester-united', name: 'Manchester United', stars: 4.5, league: 'Premier League' },
  { id: 'newcastle', name: 'Newcastle United', stars: 4.5, league: 'Premier League' },
  { id: 'aston-villa', name: 'Aston Villa', stars: 4.5, league: 'Premier League' },
  { id: 'brighton', name: 'Brighton', stars: 4.5, league: 'Premier League' },
  { id: 'crystal-palace', name: 'Crystal Palace', stars: 4.5, league: 'Premier League' },
  { id: 'nottingham-forest', name: 'Nottingham Forest', stars: 4.5, league: 'Premier League' },
  { id: 'west-ham', name: 'West Ham United', stars: 4, league: 'Premier League' },
  { id: 'wolves', name: 'Wolverhampton Wanderers', stars: 4, league: 'Premier League' },
  { id: 'bournemouth', name: 'Bournemouth', stars: 4, league: 'Premier League' },
  { id: 'brentford', name: 'Brentford', stars: 4, league: 'Premier League' },
  { id: 'everton', name: 'Everton', stars: 4, league: 'Premier League' },
  { id: 'fulham', name: 'Fulham', stars: 4, league: 'Premier League' },
  { id: 'leeds', name: 'Leeds United', stars: 4, league: 'Premier League' },
  { id: 'burnley', name: 'Burnley', stars: 4, league: 'Premier League' },
  { id: 'sunderland', name: 'Sunderland', stars: 4, league: 'Premier League' },

  // 🇪🇸 La Liga (Spain)
  { id: 'real-madrid', name: 'Real Madrid', stars: 5, league: 'La Liga' },
  { id: 'barcelona', name: 'FC Barcelona', stars: 5, league: 'La Liga' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', stars: 4.5, league: 'La Liga' },
  { id: 'athletic-bilbao', name: 'Athletic Bilbao', stars: 4.5, league: 'La Liga' },
  { id: 'real-betis', name: 'Real Betis', stars: 4.5, league: 'La Liga' },
  { id: 'villarreal', name: 'Villarreal CF', stars: 4.5, league: 'La Liga' },
  { id: 'real-sociedad', name: 'Real Sociedad', stars: 4, league: 'La Liga' },
  { id: 'girona', name: 'Girona', stars: 4, league: 'La Liga' },
  { id: 'valencia', name: 'Valencia', stars: 4, league: 'La Liga' },
  { id: 'sevilla', name: 'Sevilla FC', stars: 4, league: 'La Liga' },
  { id: 'osasuna', name: 'Osasuna', stars: 4, league: 'La Liga' },
  { id: 'celta-vigo', name: 'Celta Vigo', stars: 4, league: 'La Liga' },
  { id: 'getafe', name: 'Getafe', stars: 4, league: 'La Liga' },
  { id: 'rayo-vallecano', name: 'Rayo Vallecano', stars: 4, league: 'La Liga' },
  { id: 'espanyol', name: 'Espanyol', stars: 4, league: 'La Liga' },
  { id: 'mallorca', name: 'RCD Mallorca', stars: 4, league: 'La Liga' },

  // 🇩🇪 Bundesliga (Germany)
  { id: 'bayern-munich', name: 'FC Bayern München', stars: 5, league: 'Bundesliga' },
  { id: 'bayer-leverkusen', name: 'Bayer 04 Leverkusen', stars: 4, league: 'Bundesliga' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', stars: 4.5, league: 'Bundesliga' },
  { id: 'rb-leipzig', name: 'RB Leipzig', stars: 4.5, league: 'Bundesliga' },
  { id: 'union-berlin', name: 'Union Berlin', stars: 4, league: 'Bundesliga' },
  { id: 'eintracht', name: 'Eintracht Frankfurt', stars: 4, league: 'Bundesliga' },
  { id: 'stuttgart', name: 'VfB Stuttgart', stars: 4.5, league: 'Bundesliga' },
  { id: 'wolfsburg', name: 'VfL Wolfsburg', stars: 4, league: 'Bundesliga' },
  { id: 'gladbach', name: 'Borussia Mönchengladbach', stars: 4, league: 'Bundesliga' },
  { id: 'freiburg', name: 'SC Freiburg', stars: 4, league: 'Bundesliga' },
  { id: 'werder-bremen', name: 'Werder Bremen', stars: 4, league: 'Bundesliga' },
  { id: 'mainz', name: 'Mainz', stars: 4, league: 'Bundesliga' },
  { id: 'hoffenheim', name: 'TSG Hoffenheim', stars: 4, league: 'Bundesliga' },

  // 🇮🇹 Serie A (Italy)
  { id: 'inter', name: 'Inter', stars: 5, league: 'Serie A' },
  { id: 'juventus', name: 'Juventus', stars: 4.5, league: 'Serie A' },
  { id: 'ac-milan', name: 'AC Milan', stars: 4.5, league: 'Serie A' },
  { id: 'napoli', name: 'Napoli', stars: 4.5, league: 'Serie A' },
  { id: 'roma', name: 'AS Roma', stars: 4.5, league: 'Serie A' },
  { id: 'atalanta', name: 'Atalanta', stars: 4.5, league: 'Serie A' },
  { id: 'lazio', name: 'Lazio', stars: 4, league: 'Serie A' },
  { id: 'fiorentina', name: 'Fiorentina', stars: 4, league: 'Serie A' },
  { id: 'bologna', name: 'Bologna', stars: 4, league: 'Serie A' },
  { id: 'torino', name: 'Torino', stars: 4, league: 'Serie A' },
  { id: 'como', name: 'Como', stars: 4, league: 'Serie A' },

  // 🇫🇷 Ligue 1 (France)
  { id: 'psg', name: 'Paris Saint-Germain', stars: 5, league: 'Ligue 1' },
  { id: 'marseille', name: 'Olympique de Marseille', stars: 4.5, league: 'Ligue 1' },
  { id: 'lyon', name: 'Olympique Lyonnais', stars: 4, league: 'Ligue 1' },
  { id: 'monaco', name: 'AS Monaco', stars: 4, league: 'Ligue 1' },
  { id: 'lille', name: 'LOSC Lille', stars: 4, league: 'Ligue 1' },
  { id: 'reims', name: 'Stade de Reims', stars: 4, league: 'Ligue 1' },
  { id: 'lens', name: 'Lens', stars: 4, league: 'Ligue 1' },
  { id: 'nice', name: 'OGC Nice', stars: 4, league: 'Ligue 1' },

  // 🌍 Rest of World
  { id: 'sporting-cp', name: 'Sporting CP', stars: 4.5, league: 'Portugal' },
  { id: 'fenerbahce', name: 'Fenerbahçe', stars: 4.5, league: 'Turkey' },
  { id: 'galatasaray', name: 'Galatasaray', stars: 4.5, league: 'Turkey' },
  { id: 'benfica', name: 'SL Benfica', stars: 4, league: 'Portugal' },
  { id: 'ajax', name: 'Ajax', stars: 4, league: 'Netherlands' },
  { id: 'porto', name: 'FC Porto', stars: 4, league: 'Portugal' },
  { id: 'braga', name: 'SC Braga', stars: 3.5, league: 'Portugal' },
  { id: 'psv-eindhoven', name: 'PSV Eindhoven', stars: 4, league: 'Netherlands' },
  { id: 'feyenoord', name: 'Feyenoord', stars: 4, league: 'Netherlands' },
  { id: 'besiktas', name: 'Beşiktaş', stars: 4, league: 'Turkey' },
  { id: 'al-ittihad', name: 'Al Ittihad', stars: 4, league: 'Saudi Arabia' },
  { id: 'al-ahli', name: 'Al Ahli', stars: 4, league: 'Saudi Arabia' },
  { id: 'al-nassr', name: 'Al Nassr', stars: 4, league: 'Saudi Arabia' },
  { id: 'al-hilal', name: 'Al Hilal', stars: 4, league: 'Saudi Arabia' },
  { id: 'boca-juniors', name: 'Boca Juniors', stars: 4, league: 'Argentina' },
  { id: 'slavia-praha', name: 'Slavia Praha', stars: 4, league: 'Czech Republic' },
  { id: 'olympiacos', name: 'Olympiacos', stars: 4, league: 'Greece' },

  // 🗺️ International (National Teams)
  { id: 'france', name: 'France', stars: 5, league: 'International', isNational: true },
  { id: 'england', name: 'England', stars: 5, league: 'International', isNational: true },
  { id: 'spain', name: 'Spain', stars: 5, league: 'International', isNational: true },
  { id: 'argentina', name: 'Argentina', stars: 5, league: 'International', isNational: true },
  { id: 'germany', name: 'Germany', stars: 5, league: 'International', isNational: true },
  { id: 'italy', name: 'Italy', stars: 5, league: 'International', isNational: true },
  { id: 'netherlands', name: 'Netherlands', stars: 5, league: 'International', isNational: true },
  { id: 'portugal', name: 'Portugal', stars: 5, league: 'International', isNational: true },
  { id: 'croatia', name: 'Croatia', stars: 4.5, league: 'International', isNational: true },
  { id: 'morocco', name: 'Morocco', stars: 4.5, league: 'International', isNational: true },
  { id: 'czechia', name: 'Czechia', stars: 4, league: 'International', isNational: true },
  { id: 'ghana', name: 'Ghana', stars: 4, league: 'International', isNational: true },
  { id: 'mexico', name: 'Mexico', stars: 4, league: 'International', isNational: true },
  { id: 'norway', name: 'Norway', stars: 4, league: 'International', isNational: true },
  { id: 'scotland', name: 'Scotland', stars: 4, league: 'International', isNational: true },
  { id: 'sweden', name: 'Sweden', stars: 4, league: 'International', isNational: true },
  { id: 'united-states', name: 'United States', stars: 4, league: 'International', isNational: true },
  { id: 'poland', name: 'Poland', stars: 4, league: 'International', isNational: true },
  { id: 'ukraine', name: 'Ukraine', stars: 4, league: 'International', isNational: true },
  { id: 'denmark', name: 'Denmark', stars: 4, league: 'International', isNational: true },

  // 🏆 Prime Teams
  { id: 'serie-a-xi', name: 'Serie A XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'soccer-aid', name: 'Soccer Aid', stars: 5, league: 'Prime', isPrime: true },
  { id: 'classic-xi', name: 'Classic XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'bundesliga-xi', name: 'Bundesliga XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'chelsea-xi', name: 'Chelsea XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'bayern-xi', name: 'Bayern XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'juventus-xi', name: 'Juventus XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'la-liga-xi', name: 'La Liga XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'ligue-1-xi', name: 'Ligue 1 XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'liverpool-xi', name: 'Liverpool XI', stars: 5, league: 'Prime', isPrime: true },
  { id: 'premier-league-xi', name: 'Premier League XI', stars: 5, league: 'Prime', isPrime: true },
];

// Load overrides from database
export async function loadClubOverrides(): Promise<Record<string, number>> {
  const now = Date.now();
  if (clubOverridesCache && now - lastOverridesFetch < OVERRIDES_CACHE_TTL) {
    return clubOverridesCache;
  }

  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('club_overrides')
      .select('club_id, stars');
    
    if (error) {
      console.error('Error loading club overrides:', error);
      return clubOverridesCache || {};
    }
    
    const map: Record<string, number> = {};
    (data || []).forEach((row: { club_id: string; stars: number }) => {
      map[row.club_id] = row.stars;
    });
    
    clubOverridesCache = map;
    lastOverridesFetch = now;
    return map;
  } catch (e) {
    console.error('Failed to load club overrides:', e);
    return clubOverridesCache || {};
  }
}

// Get clubs with database overrides applied
export async function getClubsWithOverrides(): Promise<Club[]> {
  const overrides = await loadClubOverrides();
  return FIFA_CLUBS.map(club => ({
    ...club,
    stars: overrides[club.id] ?? club.stars
  }));
}

// Invalidate cache (call after saving overrides)
export function invalidateClubOverridesCache() {
  clubOverridesCache = null;
  lastOverridesFetch = 0;
}

export const getClubsByStars = (stars: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.stars === stars);
};

export const getNationalTeams = (clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.isNational);
};

export const getPrimeTeams = (clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.league === 'Prime');
};

export const getClubsOnly = (stars?: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => !club.isNational && club.league !== 'Prime' && (stars === undefined || club.stars === stars));
};

export const getNationalTeamsByStars = (stars: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.isNational && club.stars === stars);
};

export const getRandomClub = (excludeIds: string[] = [], minStars?: number, maxStars?: number): Club => {
  const baseClubs = FIFA_CLUBS.filter(club => !excludeIds.includes(club.id) && !club.isNational);

  const applyRange = (clubs: Club[]) =>
    clubs.filter(club => {
      if (minStars !== undefined && club.stars < minStars) return false;
      if (maxStars !== undefined && club.stars > maxStars) return false;
      return true;
    });

  // Start with range-constrained pool if provided, otherwise base
  let pool = (minStars !== undefined || maxStars !== undefined) ? applyRange(baseClubs) : baseClubs;

  // Strong preference: 4.5+ stars when possible, otherwise 4+, otherwise any
  const top = pool.filter(c => c.stars >= 4.5);
  const high = pool.filter(c => c.stars >= 4);
  if (top.length > 0) {
    pool = top;
  } else if (high.length > 0) {
    pool = high;
  }

  // If constraints emptied the pool, fall back with the same preference
  if (pool.length === 0) {
    const baseTop = baseClubs.filter(c => c.stars >= 4.5);
    const baseHigh = baseClubs.filter(c => c.stars >= 4);
    pool = baseTop.length ? baseTop : (baseHigh.length ? baseHigh : baseClubs);
  }

  return pool[Math.floor(Math.random() * pool.length)];
};
