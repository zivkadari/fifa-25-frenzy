import { Player, Pair, Evening, Match, Round } from '@/types/tournament';

export interface CouplesPartnerRecord {
  partner: Player;
  roundsPlayed: number;
  matchesPlayed: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  roundWins: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface CouplesOpponentRecord {
  opponent: Player;
  matchesPlayed: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface CouplesPairStanding {
  pair: Pair;
  roundsPlayed: number;
  roundWins: number;
  matchesPlayed: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number; // 3 per match win, 1 per draw
}

export interface CouplesPlayerStanding {
  player: Player;
  matchesPlayed: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  roundWins: number;
}

export interface CouplesPersonalStats {
  player: Player;
  standing: CouplesPlayerStanding;
  rank: number;

  // Current round info
  currentRound: Round | null;
  currentRoundNumber: number;
  currentPartner: Player | null;
  currentOpponents: [Player, Player] | null;
  currentPairScore: { mine: number; theirs: number } | null;
  winsToComplete: number;

  // Current match info
  currentMatch: Match | null;
  currentMyClub: { name: string } | null;
  currentOppClub: { name: string } | null;

  // Stats
  winRate: number;
  currentStreak: { type: 'W' | 'D' | 'L' | 'none'; count: number };
  unbeatenStreak: number;

  // Partner records
  partnerRecords: CouplesPartnerRecord[];
  bestPartner: CouplesPartnerRecord | null;

  // Opponent records
  opponentRecords: CouplesOpponentRecord[];
  toughestOpponent: CouplesOpponentRecord | null;
}

function playerInPair(playerId: string, pair: Pair): boolean {
  return pair.players[0].id === playerId || pair.players[1].id === playerId;
}

function getPartner(playerId: string, pair: Pair): Player {
  return pair.players[0].id === playerId ? pair.players[1] : pair.players[0];
}

export function computeCouplesPlayerStandings(evening: Evening): CouplesPlayerStanding[] {
  const map = new Map<string, CouplesPlayerStanding>();
  evening.players.forEach(p => {
    map.set(p.id, {
      player: p, matchesPlayed: 0, matchWins: 0, matchDraws: 0, matchLosses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, roundWins: 0,
    });
  });

  (evening.rounds || []).forEach(round => {
    const [pair1, pair2] = round.matches.length > 0 ? [round.matches[0].pairs[0], round.matches[0].pairs[1]] : [null, null];

    round.matches.forEach(match => {
      if (!match.completed || !match.score) return;
      const [s1, s2] = match.score;
      const [p1, p2] = match.pairs;

      p1.players.forEach(pl => {
        const st = map.get(pl.id);
        if (!st) return;
        st.matchesPlayed++;
        st.goalsFor += s1;
        st.goalsAgainst += s2;
        if (match.winner === p1.id) { st.matchWins++; st.points++; }
        else if (match.winner === p2.id) { st.matchLosses++; }
        else { st.matchDraws++; }
      });

      p2.players.forEach(pl => {
        const st = map.get(pl.id);
        if (!st) return;
        st.matchesPlayed++;
        st.goalsFor += s2;
        st.goalsAgainst += s1;
        if (match.winner === p2.id) { st.matchWins++; st.points++; }
        else if (match.winner === p1.id) { st.matchLosses++; }
        else { st.matchDraws++; }
      });
    });

    // Round wins
    if (round.completed && pair1 && pair2) {
      const scores = round.pairScores;
      const s1 = scores[pair1.id] || 0;
      const s2 = scores[pair2.id] || 0;
      const winningPair = s1 > s2 ? pair1 : s2 > s1 ? pair2 : null;
      if (winningPair) {
        winningPair.players.forEach(pl => {
          const st = map.get(pl.id);
          if (st) st.roundWins++;
        });
      }
    }
  });

  const result = Array.from(map.values());
  result.forEach(s => { s.goalDiff = s.goalsFor - s.goalsAgainst; });
  result.sort((a, b) => b.points - a.points || b.matchWins - a.matchWins || b.goalDiff - a.goalDiff);
  return result;
}

export function computeCouplesPairStandings(evening: Evening): CouplesPairStanding[] {
  const map = new Map<string, CouplesPairStanding>();

  (evening.rounds || []).forEach(round => {
    if (round.matches.length === 0) return;
    const [pair1, pair2] = [round.matches[0].pairs[0], round.matches[0].pairs[1]];

    [pair1, pair2].forEach(pair => {
      if (!map.has(pair.id)) {
        map.set(pair.id, {
          pair, roundsPlayed: 0, roundWins: 0, matchesPlayed: 0, matchWins: 0, matchDraws: 0, matchLosses: 0,
          goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        });
      }
    });

    const rec1 = map.get(pair1.id)!;
    const rec2 = map.get(pair2.id)!;

    const hasCompletedMatch = round.matches.some(m => m.completed);
    if (hasCompletedMatch) { rec1.roundsPlayed++; rec2.roundsPlayed++; }

    round.matches.forEach(match => {
      if (!match.completed || !match.score) return;
      const [s1, s2] = match.score;

      rec1.matchesPlayed++;
      rec1.goalsFor += s1;
      rec1.goalsAgainst += s2;
      rec2.matchesPlayed++;
      rec2.goalsFor += s2;
      rec2.goalsAgainst += s1;

      if (match.winner === pair1.id) { rec1.matchWins++; rec1.points += 3; rec2.matchLosses++; }
      else if (match.winner === pair2.id) { rec2.matchWins++; rec2.points += 3; rec1.matchLosses++; }
      else { rec1.matchDraws++; rec1.points += 1; rec2.matchDraws++; rec2.points += 1; }
    });

    if (round.completed) {
      const s1 = round.pairScores[pair1.id] || 0;
      const s2 = round.pairScores[pair2.id] || 0;
      if (s1 > s2) rec1.roundWins++;
      else if (s2 > s1) rec2.roundWins++;
    }
  });

  const result = Array.from(map.values());
  result.forEach(s => { s.goalDiff = s.goalsFor - s.goalsAgainst; });
  result.sort((a, b) => b.points - a.points || b.roundWins - a.roundWins || b.goalDiff - a.goalDiff);
  return result;
}

export function computeCouplesPersonalStats(
  evening: Evening,
  playerId: string,
): CouplesPersonalStats | null {
  const player = evening.players.find(p => p.id === playerId);
  if (!player) return null;

  const playerStandings = computeCouplesPlayerStandings(evening);
  const standing = playerStandings.find(s => s.player.id === playerId);
  if (!standing) return null;

  const idx = playerStandings.findIndex(s => s.player.id === playerId);
  let rank = idx + 1;
  if (idx > 0 && playerStandings[idx].points === playerStandings[idx - 1].points) {
    let first = idx;
    while (first > 0 && playerStandings[first - 1].points === playerStandings[idx].points) first--;
    rank = first + 1;
  }

  // Current round
  const currentRound = (evening.rounds || []).find(r => !r.completed) || null;
  const currentRoundNumber = currentRound ? currentRound.number : (evening.rounds || []).length;
  let currentPartner: Player | null = null;
  let currentOpponents: [Player, Player] | null = null;
  let currentPairScore: { mine: number; theirs: number } | null = null;
  let currentMatch: Match | null = null;
  let currentMyClub: { name: string } | null = null;
  let currentOppClub: { name: string } | null = null;

  if (currentRound && currentRound.matches.length > 0) {
    const firstMatch = currentRound.matches[0];
    const inPair1 = playerInPair(playerId, firstMatch.pairs[0]);
    const myPair = inPair1 ? firstMatch.pairs[0] : firstMatch.pairs[1];
    const oppPair = inPair1 ? firstMatch.pairs[1] : firstMatch.pairs[0];
    currentPartner = getPartner(playerId, myPair);
    currentOpponents = [oppPair.players[0], oppPair.players[1]];
    currentPairScore = {
      mine: currentRound.pairScores[myPair.id] || 0,
      theirs: currentRound.pairScores[oppPair.id] || 0,
    };

    // Current match (last uncompleted or last in round)
    const activeMatch = currentRound.matches.find(m => !m.completed) || null;
    if (activeMatch) {
      currentMatch = activeMatch;
      const inA = playerInPair(playerId, activeMatch.pairs[0]);
      const myClub = inA ? activeMatch.clubs[0] : activeMatch.clubs[1];
      const oppClub = inA ? activeMatch.clubs[1] : activeMatch.clubs[0];
      if (myClub && myClub.name) currentMyClub = myClub;
      if (oppClub && oppClub.name) currentOppClub = oppClub;
    }
  }

  // All completed matches for this player
  const myMatches: { match: Match; myPair: Pair; oppPair: Pair }[] = [];
  (evening.rounds || []).forEach(round => {
    round.matches.forEach(match => {
      if (!match.completed || !match.score) return;
      const inP1 = playerInPair(playerId, match.pairs[0]);
      const inP2 = playerInPair(playerId, match.pairs[1]);
      if (!inP1 && !inP2) return;
      myMatches.push({
        match,
        myPair: inP1 ? match.pairs[0] : match.pairs[1],
        oppPair: inP1 ? match.pairs[1] : match.pairs[0],
      });
    });
  });

  const winRate = myMatches.length > 0 ? Math.round((standing.matchWins / myMatches.length) * 100) : 0;

  // Current streak
  let currentStreak: CouplesPersonalStats['currentStreak'] = { type: 'none', count: 0 };
  if (myMatches.length > 0) {
    const lastResult = getResult(myMatches[myMatches.length - 1]);
    let count = 0;
    for (let i = myMatches.length - 1; i >= 0; i--) {
      if (getResult(myMatches[i]) === lastResult) count++;
      else break;
    }
    currentStreak = { type: lastResult, count };
  }

  // Unbeaten streak
  let unbeatenStreak = 0;
  for (let i = myMatches.length - 1; i >= 0; i--) {
    if (getResult(myMatches[i]) === 'L') break;
    unbeatenStreak++;
  }

  // Partner records
  const partnerMap = new Map<string, CouplesPartnerRecord>();
  const roundPairMap = new Map<string, Set<string>>(); // track rounds per partner

  (evening.rounds || []).forEach(round => {
    if (round.matches.length === 0) return;
    const firstMatch = round.matches[0];
    const inP1 = playerInPair(playerId, firstMatch.pairs[0]);
    if (!inP1 && !playerInPair(playerId, firstMatch.pairs[1])) return;
    const myPair = inP1 ? firstMatch.pairs[0] : firstMatch.pairs[1];
    const oppPair = inP1 ? firstMatch.pairs[1] : firstMatch.pairs[0];
    const partner = getPartner(playerId, myPair);

    if (!partnerMap.has(partner.id)) {
      partnerMap.set(partner.id, {
        partner, roundsPlayed: 0, matchesPlayed: 0, matchWins: 0, matchDraws: 0, matchLosses: 0,
        roundWins: 0, goalsFor: 0, goalsAgainst: 0,
      });
      roundPairMap.set(partner.id, new Set());
    }
    const rec = partnerMap.get(partner.id)!;
    roundPairMap.get(partner.id)!.add(round.id);

    round.matches.forEach(m => {
      if (!m.completed || !m.score) return;
      const [s1, s2] = m.score;
      const isFirst = playerInPair(playerId, m.pairs[0]);
      rec.matchesPlayed++;
      rec.goalsFor += isFirst ? s1 : s2;
      rec.goalsAgainst += isFirst ? s2 : s1;
      if (m.winner === myPair.id) rec.matchWins++;
      else if (m.winner === oppPair.id) rec.matchLosses++;
      else rec.matchDraws++;
    });

    if (round.completed) {
      const myScore = round.pairScores[myPair.id] || 0;
      const oppScore = round.pairScores[oppPair.id] || 0;
      if (myScore > oppScore) rec.roundWins++;
    }
  });

  partnerMap.forEach((rec, id) => {
    rec.roundsPlayed = roundPairMap.get(id)?.size || 0;
  });

  const partnerRecords = Array.from(partnerMap.values()).sort((a, b) => b.matchWins - a.matchWins || b.roundWins - a.roundWins);
  const bestPartner = partnerRecords.length > 0 && partnerRecords[0].matchesPlayed > 0 ? partnerRecords[0] : null;

  // Opponent records
  const oppMap = new Map<string, CouplesOpponentRecord>();
  myMatches.forEach(({ match, myPair, oppPair }) => {
    const [s1, s2] = match.score!;
    const isFirst = playerInPair(playerId, match.pairs[0]);
    const myScore = isFirst ? s1 : s2;
    const theirScore = isFirst ? s2 : s1;

    oppPair.players.forEach(opp => {
      if (!oppMap.has(opp.id)) {
        oppMap.set(opp.id, { opponent: opp, matchesPlayed: 0, matchWins: 0, matchDraws: 0, matchLosses: 0, goalsFor: 0, goalsAgainst: 0 });
      }
      const rec = oppMap.get(opp.id)!;
      rec.matchesPlayed++;
      rec.goalsFor += myScore;
      rec.goalsAgainst += theirScore;
      if (match.winner === myPair.id) rec.matchWins++;
      else if (match.winner === oppPair.id) rec.matchLosses++;
      else rec.matchDraws++;
    });
  });

  const opponentRecords = Array.from(oppMap.values()).sort((a, b) => b.matchLosses - a.matchLosses || (b.goalsAgainst - b.goalsFor) - (a.goalsAgainst - a.goalsFor));
  const toughestOpponent = opponentRecords.length > 0 && opponentRecords[0].matchesPlayed > 0 ? opponentRecords[0] : null;

  return {
    player, standing, rank,
    currentRound, currentRoundNumber, currentPartner, currentOpponents, currentPairScore,
    winsToComplete: evening.winsToComplete,
    currentMatch, currentMyClub, currentOppClub,
    winRate, currentStreak, unbeatenStreak,
    partnerRecords, bestPartner,
    opponentRecords, toughestOpponent,
  };
}

function getResult(entry: { match: Match; myPair: Pair }): 'W' | 'D' | 'L' {
  if (entry.match.winner === entry.myPair.id) return 'W';
  if (!entry.match.winner) return 'D';
  return 'L';
}

export function couplesPlayerInPair(playerId: string, pair: Pair): boolean {
  return pair.players[0].id === playerId || pair.players[1].id === playerId;
}
