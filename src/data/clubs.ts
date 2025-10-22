import { Club } from '@/types/tournament';

export const FIFA_CLUBS: Club[] = [
  // 5-star clubs (85+ rating)
  { id: 'real-madrid', name: 'Real Madrid', stars: 5, league: 'La Liga' },
  { id: 'manchester-city', name: 'Manchester City', stars: 5, league: 'Premier League' },
  { id: 'barcelona', name: 'FC Barcelona', stars: 5, league: 'La Liga' },
  { id: 'liverpool', name: 'Liverpool', stars: 5, league: 'Premier League' },
  { id: 'bayern-munich', name: 'FC Bayern München', stars: 5, league: 'Bundesliga' },
  { id: 'inter', name: 'Inter', stars: 5, league: 'Serie A' },
  
  // 4.5-star clubs (82-84 rating)
  { id: 'arsenal', name: 'Arsenal', stars: 5, league: 'Premier League' },
  { id: 'psg', name: 'Paris Saint-Germain', stars: 5, league: 'Ligue 1' },
  { id: 'bayer-leverkusen', name: 'Bayer 04 Leverkusen', stars: 4.5, league: 'Bundesliga' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', stars: 5, league: 'La Liga' },
  { id: 'newcastle', name: 'Newcastle United', stars: 4.5, league: 'Premier League' },
  { id: 'ac-milan', name: 'AC Milan', stars: 4.5, league: 'Serie A' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', stars: 4.5, league: 'Bundesliga' },
  { id: 'tottenham', name: 'Tottenham Hotspur', stars: 4.5, league: 'Premier League' },
  { id: 'manchester-united', name: 'Manchester United', stars: 4.5, league: 'Premier League' },
  { id: 'chelsea', name: 'Chelsea', stars: 4.5, league: 'Premier League' },
  { id: 'fenerbahce', name: 'Fenerbahçe', stars: 4.5, league: 'Süper Lig' },
  { id: 'athletic-bilbao', name: 'Athletic Bilbao', stars: 4.5, league: 'La Liga' },
  { id: 'aston-villa', name: 'Aston Villa', stars: 4.5, league: 'Premier League' },
  { id: 'rb-leipzig', name: 'RB Leipzig', stars: 4.5, league: 'Bundesliga' },
  { id: 'atalanta', name: 'Atalanta', stars: 4.5, league: 'Serie A' },
  { id: 'sporting-cp', name: 'Sporting CP', stars: 4.5, league: 'Primeira Liga' },
  { id: 'galatasaray', name: 'Galatasaray SK', stars: 4.5, league: 'Süper Lig' },
  { id: 'napoli', name: 'Napoli', stars: 4.5, league: 'Serie A' },
  { id: 'juventus', name: 'Juventus', stars: 4.5, league: 'Serie A' },
  { id: 'marseille', name: 'Olympique de Marseille', stars: 4.5, league: 'Ligue 1' },
  { id: 'crystal-palace', name: 'Crystal Palace', stars: 4.5, league: 'Premier League' },
  { id: 'nottingham-forest', name: 'Nottingham Forest', stars: 4.5, league: 'Premier League' },
  { id: 'roma', name: 'Roma', stars: 4.5, league: 'Serie A' },
  
  // National Teams (5-star)
  { id: 'france', name: 'France', stars: 5, league: 'National Teams', isNational: true },
  { id: 'england', name: 'England', stars: 5, league: 'National Teams', isNational: true },
  { id: 'germany', name: 'Germany', stars: 5, league: 'National Teams', isNational: true },
  { id: 'spain', name: 'Spain', stars: 5, league: 'National Teams', isNational: true },
  
  // National Teams (4.5-star)
  { id: 'portugal', name: 'Portugal', stars: 5, league: 'National Teams', isNational: true },
  { id: 'netherlands', name: 'Netherlands', stars: 5, league: 'National Teams', isNational: true },
  { id: 'argentina', name: 'Argentina', stars: 5, league: 'National Teams', isNational: true },
  { id: 'italy', name: 'Italy', stars: 5, league: 'National Teams', isNational: true },
  
  // National Teams (4.5-star continued)
  { id: 'morocco', name: 'Morocco', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'croatia', name: 'Croatia', stars: 4.5, league: 'National Teams', isNational: true },
  
  // National Teams (4-star)
  { id: 'scotland', name: 'Scotland', stars: 4, league: 'National Teams', isNational: true },
  { id: 'denmark', name: 'Denmark', stars: 4, league: 'National Teams', isNational: true },
  { id: 'sweden', name: 'Sweden', stars: 4, league: 'National Teams', isNational: true },
  { id: 'norway', name: 'Norway', stars: 4, league: 'National Teams', isNational: true },
  { id: 'poland', name: 'Poland', stars: 4, league: 'National Teams', isNational: true },
  { id: 'ukraine', name: 'Ukraine', stars: 4, league: 'National Teams', isNational: true },
  { id: 'united-states', name: 'United States', stars: 4, league: 'National Teams', isNational: true },
  { id: 'czechia', name: 'Czechia', stars: 4, league: 'National Teams', isNational: true },
  { id: 'ghana', name: 'Ghana', stars: 4, league: 'National Teams', isNational: true },
  { id: 'mexico', name: 'Mexico', stars: 4, league: 'National Teams', isNational: true },
  
  // 4-star clubs
  { id: 'west-ham', name: 'West Ham United', stars: 4, league: 'Premier League' },
  { id: 'brighton', name: 'Brighton & Hove Albion', stars: 4, league: 'Premier League' },
  { id: 'bournemouth', name: 'AFC Bournemouth', stars: 4, league: 'Premier League' },
  { id: 'lyon', name: 'Olympique Lyonnais', stars: 4, league: 'Ligue 1' },
  { id: 'monaco', name: 'AS Monaco', stars: 4, league: 'Ligue 1' },
  { id: 'river-plate', name: 'River Plate', stars: 4, league: 'Liga Profesional' },
  { id: 'real-betis', name: 'Real Betis', stars: 4, league: 'La Liga' },
  { id: 'real-sociedad', name: 'Real Sociedad', stars: 4, league: 'La Liga' },
  { id: 'villarreal', name: 'Villarreal CF', stars: 4, league: 'La Liga' },
  { id: 'girona', name: 'Girona FC', stars: 4, league: 'La Liga' },
  { id: 'rayo-vallecano', name: 'Rayo Vallecano', stars: 4, league: 'La Liga' },
  { id: 'espanyol', name: 'RCD Espanyol', stars: 4, league: 'La Liga' },
  { id: 'sevilla', name: 'Sevilla FC', stars: 4, league: 'La Liga' },
  { id: 'psv-eindhoven', name: 'PSV Eindhoven', stars: 4, league: 'Eredivisie' },
  { id: 'fiorentina', name: 'Fiorentina', stars: 4, league: 'Serie A' },
  { id: 'lille', name: 'Lille OSC', stars: 4, league: 'Ligue 1' },
  { id: 'nice', name: 'OGC Nice', stars: 4, league: 'Ligue 1' },
  { id: 'paris-fc', name: 'Paris FC', stars: 4, league: 'Ligue 1' },
  { id: 'al-hilal', name: 'Al Hilal', stars: 4, league: 'Saudi Pro League' },
  { id: 'al-nassr', name: 'Al Nassr', stars: 4, league: 'Saudi Pro League' },
  { id: 'al-ittihad', name: 'Al Ittihad', stars: 4, league: 'Saudi Pro League' },
  { id: 'valencia', name: 'Valencia CF', stars: 4, league: 'La Liga' },
  { id: 'osasuna', name: 'CA Osasuna', stars: 4, league: 'La Liga' },
  { id: 'aek-athens', name: 'AEK Athens', stars: 4, league: 'Super League' },
  { id: 'getafe', name: 'Getafe CF', stars: 4, league: 'La Liga' },
  { id: 'celtic', name: 'Celtic', stars: 4, league: 'Scottish Premiership' },
  { id: 'las-palmas', name: 'UD Las Palmas', stars: 4, league: 'La Liga' },
  { id: 'freiburg', name: 'SC Freiburg', stars: 4, league: 'Bundesliga' },
  { id: 'celta-vigo', name: 'Celta Vigo', stars: 4, league: 'La Liga' },
  { id: 'mallorca', name: 'RCD Mallorca', stars: 4, league: 'La Liga' },
  { id: 'torino', name: 'Torino', stars: 4, league: 'Serie A' },
  { id: 'besiktas', name: 'Beşiktaş', stars: 4, league: 'Süper Lig' },
  { id: 'mainz', name: 'Mainz 05', stars: 4, league: 'Bundesliga' },
  { id: 'werder-bremen', name: 'Werder Bremen', stars: 4, league: 'Bundesliga' },
  { id: 'hoffenheim', name: 'TSG Hoffenheim', stars: 4, league: 'Bundesliga' },
  { id: 'stuttgart', name: 'VfB Stuttgart', stars: 4, league: 'Bundesliga' },
  { id: 'wolfsburg', name: 'VfL Wolfsburg', stars: 4, league: 'Bundesliga' },
  { id: 'como', name: 'Como', stars: 4, league: 'Serie A' },
  { id: 'lazio', name: 'Lazio', stars: 4, league: 'Serie A' },
  { id: 'braga', name: 'SC Braga', stars: 4, league: 'Primeira Liga' },
  { id: 'benfica', name: 'SL Benfica', stars: 4, league: 'Primeira Liga' },
  { id: 'olympiacos', name: 'Olympiacos FC', stars: 4, league: 'Super League' },
  { id: 'slavia-praha', name: 'Slavia Praha', stars: 4, league: 'Fortuna Liga' },
  { id: 'boca-juniors', name: 'Boca Juniors', stars: 4, league: 'Liga Profesional' },
  { id: 'burnley', name: 'Burnley', stars: 4, league: 'Championship' },
  { id: 'leeds', name: 'Leeds United', stars: 4, league: 'Championship' },
  { id: 'sunderland', name: 'Sunderland', stars: 4, league: 'Championship' },
  { id: 'wolves', name: 'Wolverhampton Wanderers', stars: 4, league: 'Premier League' },
  { id: 'eintracht', name: 'Eintracht Frankfurt', stars: 4, league: 'Bundesliga' },
  { id: 'rennes', name: 'Stade Rennais FC', stars: 4, league: 'Ligue 1' },
  { id: 'fulham', name: 'Fulham', stars: 4, league: 'Premier League' },
  { id: 'porto', name: 'FC Porto', stars: 4, league: 'Primeira Liga' },
  { id: 'ajax', name: 'Ajax', stars: 4, league: 'Eredivisie' },
  { id: 'feyenoord', name: 'Feyenoord', stars: 4, league: 'Eredivisie' },
  { id: 'everton', name: 'Everton', stars: 4, league: 'Premier League' },
  { id: 'brentford', name: 'Brentford', stars: 4, league: 'Premier League' },
  { id: 'bologna', name: 'Bologna', stars: 4, league: 'Serie A' },
  
  // 3.5-star clubs
  { id: 'club-brugge', name: 'Club Brugge KV', stars: 3.5, league: 'Pro League' },
  { id: 'strasbourg', name: 'RC Strasbourg Alsace', stars: 3.5, league: 'Ligue 1' },
  
  // 3-star clubs
  { id: 'hertha-berlin', name: 'Hertha BSC', stars: 3, league: '2. Bundesliga' },
  { id: 'sheffield-united', name: 'Sheffield United', stars: 3, league: 'Championship' },
  { id: 'fc-copenhagen', name: 'FC København', stars: 3, league: 'Superliga' },
  { id: 'deportivo', name: 'RC Deportivo de La Coruña', stars: 3, league: 'La Liga 2' },
  { id: 'birmingham', name: 'Birmingham City', stars: 3, league: 'League One' },
  { id: 'los-angeles-fc', name: 'Los Angeles FC', stars: 3, league: 'Major League Soccer' },
  { id: 'young-boys', name: 'BSC Young Boys', stars: 3, league: 'Super League' },
  { id: 'basel', name: 'FC Basel 1893', stars: 3, league: 'Super League' },
  { id: 'schalke', name: 'FC Schalke 04', stars: 3, league: '2. Bundesliga' },
  { id: 'legia', name: 'Legia Warszawa', stars: 3, league: 'Ekstraklasa' },
  { id: 'wrexham', name: 'Wrexham', stars: 3, league: 'League One' },
];

export const getClubsByStars = (stars: number): Club[] => {
  return FIFA_CLUBS.filter(club => club.stars === stars);
};

export const getNationalTeams = (): Club[] => {
  return FIFA_CLUBS.filter(club => club.isNational);
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