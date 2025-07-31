import { Player, Pair, Round, Match, Evening, PlayerStats } from '@/types/tournament';
import { TeamSelector } from './teamSelector';

export class TournamentEngine {
  static generatePairs(players: Player[]): Pair[][] {
    if (players.length !== 4) {
      throw new Error('Tournament requires exactly 4 players');
    }

    // Generate all possible pairs for round-robin
    const rounds: Pair[][] = [
      // Round 1: [P1,P2] vs [P3,P4]
      [
        { id: 'p1-p2-r1', players: [players[0], players[1]] },
        { id: 'p3-p4-r1', players: [players[2], players[3]] }
      ],
      // Round 2: [P1,P3] vs [P2,P4]
      [
        { id: 'p1-p3-r2', players: [players[0], players[2]] },
        { id: 'p2-p4-r2', players: [players[1], players[3]] }
      ],
      // Round 3: [P1,P4] vs [P2,P3]
      [
        { id: 'p1-p4-r3', players: [players[0], players[3]] },
        { id: 'p2-p3-r3', players: [players[1], players[2]] }
      ]
    ];

    return rounds;
  }

  static createRound(roundNumber: number, pairs: Pair[], pointsToWin: number): Round {
    const teamSelector = new TeamSelector();
    const clubPools = teamSelector.generateTeamPools(pairs);
    
    // In 4-player 2v2 tournament, each round has exactly ONE match
    // The "pointsToWin" applies to cumulative points across all rounds
    const match: Match = {
      id: `match-r${roundNumber}`,
      pairs: [pairs[0], pairs[1]],
      clubs: [clubPools[0][0], clubPools[1][0]], // Default to first clubs
      completed: false
    };

    return {
      id: `round-${roundNumber}`,
      number: roundNumber,
      matches: [match],
      completed: false,
      pointsToWin // This is now used for overall tournament scoring, not round completion
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

  static isRoundComplete(round: Round, pairPoints: Map<string, number>): boolean {
    for (const [pairId, points] of pairPoints) {
      if (points >= round.pointsToWin) {
        return true;
      }
    }
    return false;
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