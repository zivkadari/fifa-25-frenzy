import { Club } from '@/types/tournament';

export const FIFA_CLUBS: Club[] = [
  // 5-star clubs
  { id: 'psg', name: 'Paris Saint-Germain', stars: 5, league: 'Ligue 1' },
  { id: 'manchester-city', name: 'Manchester City', stars: 5, league: 'Premier League' },
  { id: 'real-madrid', name: 'Real Madrid', stars: 5, league: 'La Liga' },
  { id: 'barcelona', name: 'FC Barcelona', stars: 5, league: 'La Liga' },
  { id: 'liverpool', name: 'Liverpool', stars: 5, league: 'Premier League' },
  { id: 'bayern-munich', name: 'Bayern Munich', stars: 5, league: 'Bundesliga' },
  
  // 4.5-star clubs
  { id: 'arsenal', name: 'Arsenal', stars: 4.5, league: 'Premier League' },
  { id: 'chelsea', name: 'Chelsea', stars: 4.5, league: 'Premier League' },
  { id: 'manchester-united', name: 'Manchester United', stars: 4.5, league: 'Premier League' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', stars: 4.5, league: 'La Liga' },
  { id: 'juventus', name: 'Juventus', stars: 4.5, league: 'Serie A' },
  { id: 'inter-milan', name: 'Inter Milan', stars: 4.5, league: 'Serie A' },
  { id: 'ac-milan', name: 'AC Milan', stars: 4.5, league: 'Serie A' },
  { id: 'napoli', name: 'SSC Napoli', stars: 4.5, league: 'Serie A' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', stars: 4.5, league: 'Bundesliga' },
  { id: 'tottenham', name: 'Tottenham', stars: 4.5, league: 'Premier League' },
  
  // National Teams (4-5 stars)
  { id: 'france', name: 'France', stars: 5, league: 'National Teams', isNational: true },
  { id: 'brazil', name: 'Brazil', stars: 5, league: 'National Teams', isNational: true },
  { id: 'argentina', name: 'Argentina', stars: 5, league: 'National Teams', isNational: true },
  { id: 'england', name: 'England', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'spain', name: 'Spain', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'germany', name: 'Germany', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'portugal', name: 'Portugal', stars: 4.5, league: 'National Teams', isNational: true },
  { id: 'netherlands', name: 'Netherlands', stars: 4, league: 'National Teams', isNational: true },
  { id: 'italy', name: 'Italy', stars: 4, league: 'National Teams', isNational: true },
  
  // 4-star clubs
  { id: 'sevilla', name: 'Sevilla FC', stars: 4, league: 'La Liga' },
  { id: 'leicester', name: 'Leicester City', stars: 4, league: 'Premier League' },
  { id: 'west-ham', name: 'West Ham United', stars: 4, league: 'Premier League' },
  { id: 'villarreal', name: 'Villarreal CF', stars: 4, league: 'La Liga' },
  { id: 'real-sociedad', name: 'Real Sociedad', stars: 4, league: 'La Liga' },
  { id: 'atalanta', name: 'Atalanta', stars: 4, league: 'Serie A' },
  { id: 'roma', name: 'AS Roma', stars: 4, league: 'Serie A' },
  { id: 'lazio', name: 'SS Lazio', stars: 4, league: 'Serie A' },
  { id: 'rb-leipzig', name: 'RB Leipzig', stars: 4, league: 'Bundesliga' },
  { id: 'bayer-leverkusen', name: 'Bayer Leverkusen', stars: 4, league: 'Bundesliga' },
  
  // 3.5-star clubs
  { id: 'wolves', name: 'Wolverhampton', stars: 3.5, league: 'Premier League' },
  { id: 'brighton', name: 'Brighton & Hove Albion', stars: 3.5, league: 'Premier League' },
  { id: 'betis', name: 'Real Betis', stars: 3.5, league: 'La Liga' },
  { id: 'athletic-bilbao', name: 'Athletic Bilbao', stars: 3.5, league: 'La Liga' },
  { id: 'fiorentina', name: 'ACF Fiorentina', stars: 3.5, league: 'Serie A' },
  { id: 'eintracht', name: 'Eintracht Frankfurt', stars: 3.5, league: 'Bundesliga' },
  { id: 'marseille', name: 'Olympique Marseille', stars: 3.5, league: 'Ligue 1' },
  { id: 'monaco', name: 'AS Monaco', stars: 3.5, league: 'Ligue 1' },
  
  // 3-star clubs  
  { id: 'crystal-palace', name: 'Crystal Palace', stars: 3, league: 'Premier League' },
  { id: 'everton', name: 'Everton', stars: 3, league: 'Premier League' },
  { id: 'valencia', name: 'Valencia CF', stars: 3, league: 'La Liga' },
  { id: 'celta-vigo', name: 'RC Celta', stars: 3, league: 'La Liga' },
  { id: 'torino', name: 'Torino FC', stars: 3, league: 'Serie A' },
  { id: 'mainz', name: '1. FSV Mainz 05', stars: 3, league: 'Bundesliga' },
  { id: 'lyon', name: 'Olympique Lyon', stars: 3, league: 'Ligue 1' },
  { id: 'lille', name: 'Lille OSC', stars: 3, league: 'Ligue 1' },
];

export const getClubsByStars = (stars: number): Club[] => {
  return FIFA_CLUBS.filter(club => club.stars === stars);
};

export const getNationalTeams = (): Club[] => {
  return FIFA_CLUBS.filter(club => club.isNational && club.stars >= 4);
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