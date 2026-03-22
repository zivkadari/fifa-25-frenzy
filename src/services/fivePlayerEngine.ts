import { Player, Club } from '@/types/tournament';
import { FPPair, FPMatch, FPEvening, FPTeamBank, FPPairStats, FPPlayerStats } from '@/types/fivePlayerTypes';
import { FIFA_CLUBS } from '@/data/clubs';

/**
 * Generate all 10 unique pairs from 5 players.
 */
export function generateAllPairs(players: Player[]): FPPair[] {
  const pairs: FPPair[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      pairs.push({
        id: `${players[i].id}-${players[j].id}`,
        players: [players[i], players[j]],
      });
    }
  }
  return pairs;
}

/**
 * The structural template for one round.
 * Players indexed as 0=A, 1=B, 2=C, 3=D, 4=E.
 * Each entry: [pairA_indices, pairB_indices, sittingOut_index]
 * In each round, every player plays 4 matches and sits out exactly once.
 */
const ROUND_TEMPLATE: [number, number, number, number, number][] = [
  // [playerA1, playerA2, playerB1, playerB2, sittingOut]
  [0, 1, 2, 3, 4], // AB vs CD, E sits
  [0, 2, 3, 4, 1], // AC vs DE, B sits
  [0, 3, 1, 4, 2], // AD vs BE, C sits
  [0, 4, 1, 2, 3], // AE vs BC, D sits
  [1, 3, 2, 4, 0], // BD vs CE, A sits
];

/**
 * Generate the full 30-match schedule across 6 rounds.
 * For each round we use the same structural template but rotate the player assignment
 * to distribute bench appearances fairly and avoid consecutive sit-outs.
 */
export function generateSchedule(players: Player[], pairs: FPPair[]): FPMatch[] {
  const pairLookup = new Map<string, FPPair>();
  for (const p of pairs) {
    const key1 = `${p.players[0].id}-${p.players[1].id}`;
    const key2 = `${p.players[1].id}-${p.players[0].id}`;
    pairLookup.set(key1, p);
    pairLookup.set(key2, p);
  }

  const findPair = (p1: Player, p2: Player): FPPair => {
    return pairLookup.get(`${p1.id}-${p2.id}`) || pairLookup.get(`${p2.id}-${p1.id}`)!;
  };

  // 6 permutations of the 5 players to vary which position each player takes across rounds
  // This ensures sit-out distribution is fair and minimizes consecutive sit-outs
  const permutations = generateFairPermutations(players);

  const schedule: FPMatch[] = [];
  let globalIdx = 0;

  for (let round = 0; round < 6; round++) {
    const perm = permutations[round];
    for (let matchIdx = 0; matchIdx < 5; matchIdx++) {
      const tmpl = ROUND_TEMPLATE[matchIdx];
      const pairA = findPair(perm[tmpl[0]], perm[tmpl[1]]);
      const pairB = findPair(perm[tmpl[2]], perm[tmpl[3]]);
      const sittingOut = perm[tmpl[4]];

      schedule.push({
        id: `fp-match-${round}-${matchIdx}`,
        roundIndex: round,
        matchIndex: matchIdx,
        globalIndex: globalIdx++,
        pairA,
        pairB,
        sittingOut,
        completed: false,
      });
    }
  }

  return schedule;
}

/**
 * Generate 6 permutations of players that distribute bench appearances fairly.
 * Each permutation maps index 0-4 to a player.
 * The template has fixed sit-out indices [4, 1, 2, 3, 0] per round.
 * We rotate players through positions so each player sits out ~6 times total
 * (once per round) and consecutive sit-outs within the match sequence are minimized.
 */
function generateFairPermutations(players: Player[]): Player[][] {
  // Use Latin-square-like rotation: shift start position each round
  const perms: Player[][] = [];
  const n = 5;
  for (let round = 0; round < 6; round++) {
    const perm: Player[] = [];
    for (let i = 0; i < n; i++) {
      perm.push(players[(i + round) % n]);
    }
    perms.push(perm);
  }
  return perms;
}

/**
 * Generate team banks for all 10 pairs.
 * Each pair gets exactly 6 clubs: 2×5★, 2×4.5★, 2×4★.
 * Constraints:
 *  - 5★ teams may appear at most `maxAppearances` times (default 2)
 *  - 4.5★ and 4★ teams may appear at most once
 *  - Interleaved allocation (fair)
 */
export function generateTeamBanks(
  pairs: FPPair[],
  players: Player[],
  clubsOverride?: Club[],
  maxAppearances: number = 2
): FPTeamBank[] | string {
  const allClubs = clubsOverride || FIFA_CLUBS;
  
  // Include both clubs and national teams, exclude only Prime
  const clubs5 = shuffleArray(allClubs.filter(c => c.stars === 5 && !c.isPrime));
  const clubs45 = shuffleArray(allClubs.filter(c => c.stars === 4.5 && !c.isPrime));
  const clubs4 = shuffleArray(allClubs.filter(c => c.stars === 4 && !c.isPrime));

  // Per-tier max appearances: 5★ uses the parameter, 4.5★ and 4★ always 1
  const max5 = maxAppearances;
  const max45 = 1;
  const max4 = 1;

  // We need 10 pairs × 2 teams per tier = 20 slots per tier
  const minNeeded5 = Math.ceil(20 / max5);
  const minNeeded45 = Math.ceil(20 / max45);
  const minNeeded4 = Math.ceil(20 / max4);
  if (clubs5.length < minNeeded5) return `לא מספיק קבוצות/נבחרות 5 כוכבים (צריך לפחות ${minNeeded5}, יש ${clubs5.length})`;
  if (clubs45.length < minNeeded45) return `לא מספיק קבוצות/נבחרות 4.5 כוכבים (צריך לפחות ${minNeeded45}, יש ${clubs45.length})`;
  if (clubs4.length < minNeeded4) return `לא מספיק קבוצות/נבחרות 4 כוכבים (צריך לפחות ${minNeeded4}, יש ${clubs4.length})`;

  const banks: FPTeamBank[] = pairs.map(p => ({
    pairId: p.id,
    clubs: [],
    usedClubIds: [],
  }));

  // Track global team usage count
  const globalClubCount = new Map<string, number>();
  // Track per-player club assignments
  const playerClubs = new Map<string, Set<string>>(); // playerId -> set of clubIds
  for (const p of players) {
    playerClubs.set(p.id, new Set());
  }

  const tiers: { pool: Club[]; countPerPair: number; maxForTier: number }[] = [
    { pool: clubs5, countPerPair: 2, maxForTier: max5 },
    { pool: clubs45, countPerPair: 2, maxForTier: max45 },
    { pool: clubs4, countPerPair: 2, maxForTier: max4 },
  ];

  for (const tier of tiers) {
    for (let pass = 0; pass < tier.countPerPair; pass++) {
      const pairOrder = shuffleArray([...Array(10).keys()]);
      for (const pairIdx of pairOrder) {
        const pair = pairs[pairIdx];
        const bank = banks[pairIdx];
        const p1Id = pair.players[0].id;
        const p2Id = pair.players[1].id;
        const p1Clubs = playerClubs.get(p1Id)!;
        const p2Clubs = playerClubs.get(p2Id)!;

        // Filter valid candidates, then sort by usage count (prefer unused teams first)
        const candidates = tier.pool.filter(club => {
          const count = globalClubCount.get(club.id) || 0;
          if (count >= tier.maxForTier) return false;
          if (p1Clubs.has(club.id)) return false;
          if (p2Clubs.has(club.id)) return false;
          if (bank.clubs.some(c => c.id === club.id)) return false;
          return true;
        });
        candidates.sort((a, b) => (globalClubCount.get(a.id) || 0) - (globalClubCount.get(b.id) || 0));

        let assigned = false;
        if (candidates.length > 0) {
          const club = candidates[0];
          const count = globalClubCount.get(club.id) || 0;
          bank.clubs.push(club);
          globalClubCount.set(club.id, count + 1);
          p1Clubs.add(club.id);
          p2Clubs.add(club.id);
          assigned = true;
        }

        if (!assigned) {
          return 'לא מספיק קבוצות זמינות תחת האילוצים הנוכחיים. נסה שוב.';
        }
      }
    }
  }

  return banks;
}

/**
 * Calculate pair standings from completed matches.
 */
export function calculatePairStats(evening: FPEvening): FPPairStats[] {
  const statsMap = new Map<string, FPPairStats>();
  
  for (const pair of evening.pairs) {
    statsMap.set(pair.id, {
      pair,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    });
  }

  for (const match of evening.schedule) {
    if (!match.completed || match.scoreA === undefined || match.scoreB === undefined) continue;

    const cappedDiff = Math.min(3, Math.max(-3, match.scoreA - match.scoreB));
    
    const sA = statsMap.get(match.pairA.id)!;
    const sB = statsMap.get(match.pairB.id)!;

    sA.played++;
    sB.played++;
    sA.goalsFor += match.scoreA;
    sA.goalsAgainst += match.scoreB;
    sB.goalsFor += match.scoreB;
    sB.goalsAgainst += match.scoreA;
    sA.goalDiff += cappedDiff;
    sB.goalDiff -= cappedDiff;

    if (match.scoreA > match.scoreB) {
      sA.wins++; sA.points += 3;
      sB.losses++;
    } else if (match.scoreA < match.scoreB) {
      sB.wins++; sB.points += 3;
      sA.losses++;
    } else {
      sA.draws++; sA.points += 1;
      sB.draws++; sB.points += 1;
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * Calculate individual player standings.
 */
export function calculatePlayerStats(evening: FPEvening): FPPlayerStats[] {
  const statsMap = new Map<string, FPPlayerStats>();

  for (const player of evening.players) {
    statsMap.set(player.id, {
      player,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    });
  }

  for (const match of evening.schedule) {
    if (!match.completed || match.scoreA === undefined || match.scoreB === undefined) continue;

    const cappedDiff = Math.min(3, Math.max(-3, match.scoreA - match.scoreB));

    // Update both players in pairA
    for (const p of match.pairA.players) {
      const s = statsMap.get(p.id)!;
      s.played++;
      s.goalsFor += match.scoreA;
      s.goalsAgainst += match.scoreB;
      s.goalDiff += cappedDiff;
      if (match.scoreA > match.scoreB) { s.wins++; s.points += 3; }
      else if (match.scoreA < match.scoreB) { s.losses++; }
      else { s.draws++; s.points += 1; }
    }

    // Update both players in pairB
    for (const p of match.pairB.players) {
      const s = statsMap.get(p.id)!;
      s.played++;
      s.goalsFor += match.scoreB;
      s.goalsAgainst += match.scoreA;
      s.goalDiff -= cappedDiff;
      if (match.scoreB > match.scoreA) { s.wins++; s.points += 3; }
      else if (match.scoreB < match.scoreA) { s.losses++; }
      else { s.draws++; s.points += 1; }
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * Create a new 5-player doubles evening.
 */
export function createFPEvening(players: Player[], clubsOverride?: Club[], maxAppearances: number = 2): FPEvening | string {
  if (players.length !== 5) return 'נדרשים בדיוק 5 שחקנים';

  // Shuffle player order randomly so setup input order doesn't create schedule bias
  const shuffledPlayers = shuffleArray([...players]);

  const pairs = generateAllPairs(shuffledPlayers);
  const schedule = generateSchedule(shuffledPlayers, pairs);
  const banksResult = generateTeamBanks(pairs, shuffledPlayers, clubsOverride, maxAppearances);

  if (typeof banksResult === 'string') return banksResult;

  return {
    id: `fp-evening-${Date.now()}`,
    date: new Date().toISOString(),
    mode: 'five-player-doubles',
    players,
    pairs,
    schedule,
    teamBanks: banksResult,
    currentMatchIndex: 0,
    completed: false,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
