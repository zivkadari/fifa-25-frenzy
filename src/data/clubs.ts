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
  { id: 'arsenal', name: 'Arsenal', stars: 4.5, league: 'Premier League' },
  { id: 'psg', name: 'Paris Saint-Germain', stars: 4.5, league: 'Ligue 1' },
  { id: 'bayer-leverkusen', name: 'Bayer 04 Leverkusen', stars: 4.5, league: 'Bundesliga' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', stars: 4.5, league: 'La Liga' },
  { id: 'newcastle', name: 'Newcastle United', stars: 4.5, league: 'Premier League' },
  { id: 'ac-milan', name: 'AC Milan', stars: 4.5, league: 'Serie A' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', stars: 4.5, league: 'Bundesliga' },
  { id: 'tottenham', name: 'Tottenham Hotspur', stars: 4.5, league: 'Premier League' },
  { id: 'manchester-united', name: 'Manchester United', stars: 4.5, league: 'Premier League' },
  { id: 'chelsea', name: 'Chelsea', stars: 4.5, league: 'Premier League' },
  
  // National Teams (5-star)
  { id: 'france', name: 'France', stars: 5, league: 'National Teams', isNational: true },
  { id: 'england', name: 'England', stars: 5, league: 'National Teams', isNational: true },
  { id: 'germany', name: 'Germany', stars: 5, league: 'National Teams', isNational: true },
  { id: 'spain', name: 'Spain', stars: 5, league: 'National Teams', isNational: true },
  
  // National Teams (4.5-star)
  { id: 'portugal', name: 'Portugal', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'netherlands', name: 'Netherlands', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'argentina', name: 'Argentina', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'italy', name: 'Italy', stars: 4.5, league: 'National Teams', isNational: true },
  
  // National Teams (4-star)
  { id: 'morocco', name: 'Morocco', stars: 4, league: 'National Teams', isNational: true },
  { id: 'croatia', name: 'Croatia', stars: 4, league: 'National Teams', isNational: true },
  { id: 'denmark', name: 'Denmark', stars: 4, league: 'National Teams', isNational: true },
  
  // 4-star clubs (79-81 rating)
  { id: 'rb-leipzig', name: 'RB Leipzig', stars: 4, league: 'Bundesliga' },
  { id: 'atalanta', name: 'Atalanta', stars: 4, league: 'Serie A' },
  { id: 'sporting-cp', name: 'Sporting CP', stars: 4, league: 'Primeira Liga' },
  { id: 'galatasaray', name: 'Galatasaray SK', stars: 4, league: 'Süper Lig' },
  { id: 'napoli', name: 'Napoli', stars: 4, league: 'Serie A' },
  { id: 'roma', name: 'Roma', stars: 4, league: 'Serie A' },
  { id: 'benfica', name: 'SL Benfica', stars: 4, league: 'Primeira Liga' },
  { id: 'juventus', name: 'Juventus', stars: 4, league: 'Serie A' },
  { id: 'marseille', name: 'Olympique de Marseille', stars: 4, league: 'Ligue 1' },
  { id: 'west-ham', name: 'West Ham United', stars: 4, league: 'Premier League' },
  { id: 'crystal-palace', name: 'Crystal Palace', stars: 4, league: 'Premier League' },
  { id: 'nottingham-forest', name: 'Nottingham Forest', stars: 4, league: 'Premier League' },
  { id: 'brighton', name: 'Brighton & Hove Albion', stars: 4, league: 'Premier League' },
  { id: 'bournemouth', name: 'AFC Bournemouth', stars: 4, league: 'Premier League' },
  { id: 'lyon', name: 'Olympique Lyonnais', stars: 4, league: 'Ligue 1' },
  { id: 'monaco', name: 'AS Monaco', stars: 4, league: 'Ligue 1' },
  { id: 'river-plate', name: 'River Plate', stars: 4, league: 'Liga Profesional' },
  
  // 3.5-star clubs (76-78 rating)
  { id: 'wolves', name: 'Wolverhampton Wanderers', stars: 3.5, league: 'Premier League' },
  { id: 'eintracht', name: 'Eintracht Frankfurt', stars: 3.5, league: 'Bundesliga' },
  { id: 'gladbach', name: 'Borussia Mönchengladbach', stars: 3.5, league: 'Bundesliga' },
  { id: 'rennes', name: 'Stade Rennais FC', stars: 3.5, league: 'Ligue 1' },
  { id: 'porto', name: 'FC Porto', stars: 3.5, league: 'Primeira Liga' },
  { id: 'ajax', name: 'Ajax', stars: 3.5, league: 'Eredivisie' },
  { id: 'feyenoord', name: 'Feyenoord', stars: 3.5, league: 'Eredivisie' },
  { id: 'olympiacos', name: 'Olympiacos FC', stars: 3.5, league: 'Super League' },
  { id: 'everton', name: 'Everton', stars: 3.5, league: 'Premier League' },
  { id: 'ipswich', name: 'Ipswich Town', stars: 3.5, league: 'Premier League' },
  { id: 'brentford', name: 'Brentford', stars: 3.5, league: 'Premier League' },
  { id: 'bologna', name: 'Bologna', stars: 3.5, league: 'Serie A' },
  { id: 'como', name: 'Como', stars: 3.5, league: 'Serie A' },
  { id: 'club-brugge', name: 'Club Brugge KV', stars: 3.5, league: 'Pro League' },
  
  // 3-star clubs (72-75 rating)
  { id: 'strasbourg', name: 'RC Strasbourg Alsace', stars: 3, league: 'Ligue 1' },
  { id: 'sunderland', name: 'Sunderland', stars: 3, league: 'Championship' },
  { id: 'leicester', name: 'Leicester City', stars: 3, league: 'Premier League' },
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
  let availableClubs = FIFA_CLUBS.filter(club => !excludeIds.includes(club.id) && !club.isNational);
  
  if (minStars !== undefined || maxStars !== undefined) {
    availableClubs = availableClubs.filter(club => {
      if (minStars !== undefined && club.stars < minStars) return false;
      if (maxStars !== undefined && club.stars > maxStars) return false;
      return true;
    });
  }
  
  return availableClubs[Math.floor(Math.random() * availableClubs.length)];
};