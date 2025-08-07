import { Player, Pair, Round, Match, Evening, PlayerStats } from '@/types/tournament';
import { TeamSelector } from './teamSelector';

export class TournamentEngine {
  static generatePairs(players: Player[]): Pair[][] {
    if (players.length !== 4) {
      throw new Error('Tournament requires exactly 4 players');
    }

    // Create a shuffled copy of players for randomization
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Generate all possible unique pairs for round-robin
    const rounds: Pair[][] = [
      // Round 1: Random pairing
      [
        { id: `${shuffledPlayers[0].id}-${shuffledPlayers[1].id}-r1`, players: [shuffledPlayers[0], shuffledPlayers[1]] },
        { id: `${shuffledPlayers[2].id}-${shuffledPlayers[3].id}-r1`, players: [shuffledPlayers[2], shuffledPlayers[3]] }
      ],
      // Round 2: Different pairing
      [
        { id: `${shuffledPlayers[0].id}-${shuffledPlayers[2].id}-r2`, players: [shuffledPlayers[0], shuffledPlayers[2]] },
        { id: `${shuffledPlayers[1].id}-${shuffledPlayers[3].id}-r2`, players: [shuffledPlayers[1], shuffledPlayers[3]] }
      ],
      // Round 3: Final pairing
      [
        { id: `${shuffledPlayers[0].id}-${shuffledPlayers[3].id}-r3`, players: [shuffledPlayers[0], shuffledPlayers[3]] },
        { id: `${shuffledPlayers[1].id}-${shuffledPlayers[2].id}-r3`, players: [shuffledPlayers[1], shuffledPlayers[2]] }
      ]
    ];

    // Shuffle the rounds order for more randomness
    return rounds.sort(() => Math.random() - 0.5);
  }

  static createRound(roundNumber: number, pairs: Pair[], winsToComplete: number): Round {
    // Start with empty matches array - matches will be created dynamically
    const matches: Match[] = [];
    
    // Initialize pair scores
    const pairScores: { [pairId: string]: number } = {};
    pairScores[pairs[0].id] = 0;
    pairScores[pairs[1].id] = 0;

    return {
      id: `round-${roundNumber}`,
      number: roundNumber,
      matches,
      completed: false,
      currentMatchIndex: 0,
      pairScores
    };
  }

  static createNextMatch(round: Round, pairs: Pair[]): Match {
    const matchNumber = round.matches.length + 1;
    return {
      id: `match-r${round.number}-${matchNumber}`,
      pairs: [pairs[0], pairs[1]],
      clubs: [{ id: '', name: '', stars: 0, league: '' }, { id: '', name: '', stars: 0, league: '' }],
      completed: false
    };
  }

  static createDeciderMatch(round: Round, pairs: Pair[]): Match {
    const matchNumber = round.matches.length + 1;
    return {
      id: `match-r${round.number}-decider-${matchNumber}`,
      pairs: [pairs[0], pairs[1]],
      clubs: [{ id: '', name: '', stars: 0, league: '' }, { id: '', name: '', stars: 0, league: '' }],
      completed: false
    };
  }

  static calculatePlayerStats(evening: Evening): PlayerStats[] {
    const statsMap = new Map<string, PlayerStats>();
    
    // Initialize stats for all players
    evening.players.forEach(player => {
      statsMap.set(player.id, {
        player,
        wins: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        longestWinStreak: 0,
        points: 0
      });
    });

    let currentStreaks = new Map<string, number>();
    evening.players.forEach(player => currentStreaks.set(player.id, 0));

    // Process all completed matches
    evening.rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.completed && match.score && match.winner) {
          const [score1, score2] = match.score;
          const [pair1, pair2] = match.pairs;
          
          // Update goals for/against
          pair1.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.goalsFor += score1;
            stats.goalsAgainst += score2;
          });
          
          pair2.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.goalsFor += score2;
            stats.goalsAgainst += score1;
          });

          // Update wins and streaks
          const winningPair = match.winner === pair1.id ? pair1 : pair2;
          const losingPair = match.winner === pair1.id ? pair2 : pair1;

          winningPair.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.wins++;
            stats.points++;
            
            const currentStreak = (currentStreaks.get(player.id) || 0) + 1;
            currentStreaks.set(player.id, currentStreak);
            stats.longestWinStreak = Math.max(stats.longestWinStreak, currentStreak);
          });

          losingPair.players.forEach(player => {
            currentStreaks.set(player.id, 0);
          });
        }
      });
    });

    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }

  static calculateRankings(playerStats: PlayerStats[]): { alpha: Player[]; beta: Player[]; gamma: Player[] } {
    const rankings = { alpha: [] as Player[], beta: [] as Player[], gamma: [] as Player[] };
    
    if (playerStats.length === 0) return rankings;

    let currentRank = 1;
    let currentPoints = playerStats[0].points;
    
    playerStats.forEach((stats, index) => {
      if (stats.points < currentPoints) {
        currentRank = index + 1;
        currentPoints = stats.points;
      }
      
      if (currentRank === 1) {
        rankings.alpha.push(stats.player);
      } else if (currentRank === 2) {
        rankings.beta.push(stats.player);
      } else if (currentRank === 3) {
        rankings.gamma.push(stats.player);
      }
    });

    return rankings;
  }

  static isRoundComplete(round: Round, winsToComplete: number): boolean {
    // Check if any pair has reached the required wins
    const scores = Object.values(round.pairScores);
    const maxScore = Math.max(...scores);
    
    console.log('isRoundComplete check:', {
      scores,
      maxScore,
      winsToComplete,
      hasRequiredWins: maxScore >= winsToComplete,
      isComplete: maxScore >= winsToComplete
    });
    
    // Round is complete if someone reached winsToComplete (first to X wins)
    return maxScore >= winsToComplete;
  }

  static isRoundTied(round: Round, winsToComplete: number): boolean {
    // Check if both pairs have the same score and it's equal to winsToComplete
    const scores = Object.values(round.pairScores);
    return scores.length === 2 && scores[0] === winsToComplete && scores[1] === winsToComplete;
  }

  static getRoundWinner(round: Round): string | null {
    const pairIds = Object.keys(round.pairScores);
    const scores = Object.values(round.pairScores);
    
    if (scores[0] > scores[1]) {
      return pairIds[0];
    } else if (scores[1] > scores[0]) {
      return pairIds[1];
    }
    return null; // Tie
  }

  static getRoundPairPoints(round: Round): Map<string, number> {
    const points = new Map<string, number>();
    
    round.matches.forEach(match => {
      const [pair1, pair2] = match.pairs;
      
      if (!points.has(pair1.id)) points.set(pair1.id, 0);
      if (!points.has(pair2.id)) points.set(pair2.id, 0);
      
      if (match.completed && match.winner) {
        const currentPoints = points.get(match.winner) || 0;
        points.set(match.winner, currentPoints + 1);
      }
    });
    
    return points;
  }
}