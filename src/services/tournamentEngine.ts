import { Player, Pair, Round, Match, Evening, PlayerStats, SinglesGame, Club } from '@/types/tournament';
import { TeamSelector } from './teamSelector';
import { FIFA_CLUBS } from '@/data/clubs';

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

  static calculateRankings(playerStats: PlayerStats[]): { alpha: Player[]; beta: Player[]; gamma: Player[]; delta: Player[] } {
    const rankings = { alpha: [] as Player[], beta: [] as Player[], gamma: [] as Player[], delta: [] as Player[] };
    
    if (playerStats.length === 0) return rankings;

    // Sort by points desc, then wins, then goal diff
    const sorted = [...playerStats].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });

    // Assign distinct ranks (1st group -> alpha, 2nd -> beta, 3rd -> gamma, 4th -> delta)
    let distinctRank = 1;
    let prevPoints = sorted[0].points;

    sorted.forEach((stats, index) => {
      if (stats.points < prevPoints) {
        distinctRank += 1;
        prevPoints = stats.points;
      }

      if (distinctRank === 1) rankings.alpha.push(stats.player);
      else if (distinctRank === 2) rankings.beta.push(stats.player);
      else if (distinctRank === 3) rankings.gamma.push(stats.player);
      else if (distinctRank === 4) rankings.delta.push(stats.player);
      // Ignore lower ranks for now
    });

    return rankings;
  }

  static isRoundComplete(round: Round, winsToComplete: number): boolean {
    // Round completes either when someone reaches winsToComplete OR when max scheduled matches are played
    const scores = Object.values(round.pairScores);
    const maxScore = Math.max(...scores);
    const completedMatches = round.matches.filter(m => m.completed).length;
    const maxMatches = winsToComplete * 2 - 1;

    const hasRequiredWins = maxScore >= winsToComplete;
    const reachedMaxMatches = completedMatches >= maxMatches;
    
    console.log('isRoundComplete check:', {
      scores,
      maxScore,
      winsToComplete,
      completedMatches,
      maxMatches,
      hasRequiredWins,
      reachedMaxMatches,
      isComplete: hasRequiredWins || reachedMaxMatches
    });
    
    // Complete if either condition is met
    return hasRequiredWins || reachedMaxMatches;
  }

  static isRoundTied(round: Round, winsToComplete: number): boolean {
    const scores = Object.values(round.pairScores);
    const completedMatches = round.matches.filter(m => m.completed).length;
    const maxMatches = winsToComplete * 2 - 1;
    const isEqual = scores.length === 2 && scores[0] === scores[1];
    // Tie if both hit winsToComplete simultaneously OR if max scheduled matches ended in equal score
    return isEqual && (scores[0] === winsToComplete || completedMatches >= maxMatches);
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

  // ========== SINGLES TOURNAMENT METHODS ==========

  static createSinglesEvening(players: Player[], clubsPerPlayer: number, teamId?: string): Evening {
    // Assign random clubs to each player
    const playerClubs: { [playerId: string]: Club[] } = {};
    const availableClubs = FIFA_CLUBS.filter(club => club.stars >= 4); // Only 4+ star clubs
    
    players.forEach(player => {
      const shuffledClubs = [...availableClubs].sort(() => Math.random() - 0.5);
      playerClubs[player.id] = shuffledClubs.slice(0, clubsPerPlayer);
    });

    // Generate game sequence
    const gameSequence = this.generateSinglesGameSequence(players, playerClubs);

    const evening: Evening = {
      id: `singles-evening-${Date.now()}`,
      date: new Date().toISOString(),
      players,
      rounds: [], // Singles doesn't use rounds
      winsToComplete: 0, // Not applicable for singles
      completed: false,
      type: 'singles',
      clubsPerPlayer,
      playerClubs,
      gameSequence,
      currentGameIndex: 0
    };

    return evening;
  }

  static generateSinglesGameSequence(players: Player[], playerClubs: { [playerId: string]: Club[] }): SinglesGame[] {
    const games: SinglesGame[] = [];
    const totalClubsPerPlayer = Object.values(playerClubs)[0]?.length || 0;
    
    // For each club each player has, generate matchups
    for (let clubIndex = 0; clubIndex < totalClubsPerPlayer; clubIndex++) {
      // Generate all possible pairings for this club round
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const player1 = players[i];
          const player2 = players[j];
          const club1 = playerClubs[player1.id][clubIndex];
          const club2 = playerClubs[player2.id][clubIndex];
          
          if (club1 && club2) {
            games.push({
              id: `singles-game-${player1.id}-${player2.id}-${clubIndex}`,
              players: [player1, player2],
              clubs: [club1, club2],
              completed: false
            });
          }
        }
      }
    }

    // Shuffle the games for random order
    return games.sort(() => Math.random() - 0.5);
  }

  static isSinglesComplete(evening: Evening): boolean {
    if (evening.type !== 'singles' || !evening.gameSequence) return false;
    return evening.gameSequence.every(game => game.completed);
  }

  static getSinglesStats(evening: Evening): PlayerStats[] {
    if (evening.type !== 'singles' || !evening.gameSequence) return [];

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

    // Process all completed games
    evening.gameSequence.forEach(game => {
      if (game.completed && game.score && game.winner) {
        const [score1, score2] = game.score;
        const [player1, player2] = game.players;
        
        // Update goals for/against
        const stats1 = statsMap.get(player1.id)!;
        const stats2 = statsMap.get(player2.id)!;
        
        stats1.goalsFor += score1;
        stats1.goalsAgainst += score2;
        stats2.goalsFor += score2;
        stats2.goalsAgainst += score1;

        // Update wins and streaks
        const winner = game.winner === player1.id ? player1 : player2;
        const loser = game.winner === player1.id ? player2 : player1;

        const winnerStats = statsMap.get(winner.id)!;
        winnerStats.wins++;
        winnerStats.points++;
        
        const currentStreak = (currentStreaks.get(winner.id) || 0) + 1;
        currentStreaks.set(winner.id, currentStreak);
        winnerStats.longestWinStreak = Math.max(winnerStats.longestWinStreak, currentStreak);

        currentStreaks.set(loser.id, 0);
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }
}