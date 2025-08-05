export interface Player {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  stars: number;
  isNational?: boolean;
  league: string;
}

export interface Pair {
  id: string;
  players: [Player, Player];
}

export interface Match {
  id: string;
  pairs: [Pair, Pair];
  clubs: [Club, Club];
  score?: [number, number];
  winner?: string; // pair id
  completed: boolean;
}

export interface Round {
  id: string;
  number: number;
  matches: Match[];
  completed: boolean;
  currentMatchIndex: number;
  pairScores: { [pairId: string]: number }; // Track wins for each pair in this round
  isDeciderMatch?: boolean; // Flag for tiebreaker match
}

export interface Evening {
  id: string;
  date: string;
  players: Player[];
  rounds: Round[];
  winsToComplete: number; // First to X wins per round
  completed: boolean;
  rankings?: {
    alpha: Player[];
    beta: Player[];
    gamma: Player[];
  };
}

export interface PlayerStats {
  player: Player;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
  longestWinStreak: number;
  points: number;
}