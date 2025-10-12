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
    // Assign clubs to each player with specific star distribution
    const playerClubs: { [playerId: string]: Club[] } = {};
    
    // Get available clubs by star rating
    const fiveStarClubs = FIFA_CLUBS.filter(club => club.stars === 5);
    const fourHalfStarClubs = FIFA_CLUBS.filter(club => club.stars === 4.5);
    const fourStarClubs = FIFA_CLUBS.filter(club => club.stars === 4);
    
    // Pool of all available clubs for additional slots
    const additionalClubPool = [...fourHalfStarClubs, ...fourStarClubs];
    
    players.forEach(player => {
      const assignedClubs: Club[] = [];
      const usedClubIds = new Set<string>();
      
      // Slot 1: Always 5-star
      if (clubsPerPlayer >= 1) {
        const available5Star = fiveStarClubs.filter(c => !usedClubIds.has(c.id));
        if (available5Star.length > 0) {
          const club = available5Star[Math.floor(Math.random() * available5Star.length)];
          assignedClubs.push(club);
          usedClubIds.add(club.id);
        }
      }
      
      // Slot 2: Always 4.5-star
      if (clubsPerPlayer >= 2) {
        const available4Half = fourHalfStarClubs.filter(c => !usedClubIds.has(c.id));
        if (available4Half.length > 0) {
          const club = available4Half[Math.floor(Math.random() * available4Half.length)];
          assignedClubs.push(club);
          usedClubIds.add(club.id);
        }
      }
      
      // Slot 3: Always 4.5-star
      if (clubsPerPlayer >= 3) {
        const available4Half = fourHalfStarClubs.filter(c => !usedClubIds.has(c.id));
        if (available4Half.length > 0) {
          const club = available4Half[Math.floor(Math.random() * available4Half.length)];
          assignedClubs.push(club);
          usedClubIds.add(club.id);
        }
      }
      
      // Slots 4+: Random from pool (4.5 and 4 star clubs)
      for (let i = 3; i < clubsPerPlayer; i++) {
        const availableAdditional = additionalClubPool.filter(c => !usedClubIds.has(c.id));
        if (availableAdditional.length > 0) {
          const club = availableAdditional[Math.floor(Math.random() * availableAdditional.length)];
          assignedClubs.push(club);
          usedClubIds.add(club.id);
        }
      }
      
      playerClubs[player.id] = assignedClubs;
    });
    
    // Balance average stars across all players
    this.balancePlayerClubStars(playerClubs, players);

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

  static balancePlayerClubStars(playerClubs: { [playerId: string]: Club[] }, players: Player[]): void {
    // Calculate average stars for each player
    const playerAvgStars = new Map<string, number>();
    players.forEach(player => {
      const clubs = playerClubs[player.id] || [];
      const totalStars = clubs.reduce((sum, club) => sum + club.stars, 0);
      playerAvgStars.set(player.id, clubs.length > 0 ? totalStars / clubs.length : 0);
    });

    // Calculate global average
    const globalAvg = Array.from(playerAvgStars.values()).reduce((sum, avg) => sum + avg, 0) / players.length;

    // Try to balance by swapping clubs between players
    const maxIterations = 50;
    for (let iter = 0; iter < maxIterations; iter++) {
      let improved = false;

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const player1 = players[i];
          const player2 = players[j];
          const clubs1 = playerClubs[player1.id];
          const clubs2 = playerClubs[player2.id];

          // Only try to swap clubs from slot 4 onwards (indices 3+)
          for (let idx1 = 3; idx1 < clubs1.length; idx1++) {
            for (let idx2 = 3; idx2 < clubs2.length; idx2++) {
              const club1 = clubs1[idx1];
              const club2 = clubs2[idx2];

              // Calculate current deviation
              const avg1 = clubs1.reduce((sum, c) => sum + c.stars, 0) / clubs1.length;
              const avg2 = clubs2.reduce((sum, c) => sum + c.stars, 0) / clubs2.length;
              const currentDev = Math.abs(avg1 - globalAvg) + Math.abs(avg2 - globalAvg);

              // Simulate swap
              clubs1[idx1] = club2;
              clubs2[idx2] = club1;
              const newAvg1 = clubs1.reduce((sum, c) => sum + c.stars, 0) / clubs1.length;
              const newAvg2 = clubs2.reduce((sum, c) => sum + c.stars, 0) / clubs2.length;
              const newDev = Math.abs(newAvg1 - globalAvg) + Math.abs(newAvg2 - globalAvg);

              if (newDev < currentDev) {
                // Keep the swap
                improved = true;
              } else {
                // Revert the swap
                clubs1[idx1] = club1;
                clubs2[idx2] = club2;
              }
            }
          }
        }
      }

      if (!improved) break; // No more improvements possible
    }
  }

  static generateSinglesGameSequence(players: Player[], playerClubs: { [playerId: string]: Club[] }): SinglesGame[] {
    // Generate all possible matchups (each player vs each other player, for each club they have)
    const allMatchups: { player1: Player; player2: Player; clubIndex: number }[] = [];
    
    // Find the minimum number of clubs any player has (this determines max games)
    const minClubsPerPlayer = Math.min(...players.map(p => playerClubs[p.id]?.length || 0));
    
    for (let clubIndex = 0; clubIndex < minClubsPerPlayer; clubIndex++) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const player1 = players[i];
          const player2 = players[j];
          
          // Only create matchup if both players have a club at this index
          if (playerClubs[player1.id]?.[clubIndex] && playerClubs[player2.id]?.[clubIndex]) {
            allMatchups.push({
              player1,
              player2,
              clubIndex
            });
          }
        }
      }
    }

    // Optimize order to minimize waiting time
    const optimizedOrder = this.optimizeMatchSequence(allMatchups, players);
    
    // Convert to SinglesGame objects
    const games: SinglesGame[] = optimizedOrder.map((matchup, index) => {
      const club1 = playerClubs[matchup.player1.id][matchup.clubIndex];
      const club2 = playerClubs[matchup.player2.id][matchup.clubIndex];
      
      return {
        id: `singles-game-${matchup.player1.id}-${matchup.player2.id}-${matchup.clubIndex}-${index}`,
        players: [matchup.player1, matchup.player2],
        clubs: [{ id: '', name: '', stars: 0, league: '' }, { id: '', name: '', stars: 0, league: '' }], // Empty clubs - will be selected during game
        completed: false
      };
    });

    return games;
  }

  static optimizeMatchSequence(
    matchups: { player1: Player; player2: Player; clubIndex: number }[], 
    players: Player[]
  ): { player1: Player; player2: Player; clubIndex: number }[] {
    const sequence: { player1: Player; player2: Player; clubIndex: number }[] = [];
    const remaining = [...matchups];
    const lastPlayed = new Map<string, number>();
    players.forEach(p => lastPlayed.set(p.id, -1));

    const pairKey = (a: Player, b: Player) => {
      const ids = [a.id, b.id].sort();
      return ids.join('-');
    };

    while (remaining.length > 0) {
      // Compute waiting times per player
      const currentIndex = sequence.length;
      const wait = new Map<string, number>();
      players.forEach(p => {
        const lp = lastPlayed.get(p.id) ?? -1;
        wait.set(p.id, currentIndex - lp - 1);
      });
      const maxWait = Math.max(...Array.from(wait.values()));

      // 1) Prefer matches that include at least one player who waited the most
      let candidates = remaining.filter(
        m => (wait.get(m.player1.id) ?? 0) === maxWait || (wait.get(m.player2.id) ?? 0) === maxWait
      );
      if (candidates.length === 0) candidates = [...remaining];

      // 2) Avoid repeating the exact same pair as the previous game, if possible
      const last = sequence[sequence.length - 1];
      if (last) {
        const prevKey = pairKey(last.player1, last.player2);
        const nonRepeat = candidates.filter(m => pairKey(m.player1, m.player2) !== prevKey);
        if (nonRepeat.length > 0) candidates = nonRepeat;
      }

      // 3) Pick the candidate maximizing total waiting time (reduces overall idle time)
      let bestIdx = 0;
      let bestScore = -Infinity;
      for (let i = 0; i < candidates.length; i++) {
        const m = candidates[i];
        const score = (wait.get(m.player1.id) ?? 0) + (wait.get(m.player2.id) ?? 0);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      const selected = candidates[bestIdx];
      // Remove by identity from remaining
      const remIndex = remaining.indexOf(selected);
      const [spliced] = remaining.splice(remIndex, 1);
      sequence.push(spliced);

      // Update last played indices
      const gi = sequence.length - 1;
      lastPlayed.set(spliced.player1.id, gi);
      lastPlayed.set(spliced.player2.id, gi);
    }

    return sequence;
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