import { Player } from '@/types/tournament';
import { FPEvening, FPMatch, FPPair, FPPlayerStats } from '@/types/fivePlayerTypes';

export interface PartnerRecord {
  partner: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface OpponentRecord {
  opponent: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PersonalStats {
  player: Player;
  stats: FPPlayerStats;
  rank: number;
  matchesLeft: number;
  winRate: number;
  currentStreak: { type: 'W' | 'D' | 'L' | 'none'; count: number };
  unbeatenStreak: number;
  partnerRecords: PartnerRecord[];
  bestPartner: PartnerRecord | null;
  opponentRecords: OpponentRecord[];
  toughestOpponent: OpponentRecord | null;
  nextMatch: FPMatch | null;
  nextPartner: Player | null;
  nextOpponents: [Player, Player] | null;
  nextSittingOut: boolean; // whether next unplayed match has this player sitting out
  isPlayingNow: boolean;
  isSittingOutNow: boolean;
  currentPartner: Player | null;
  currentOpponents: [Player, Player] | null;
}

function playerInPair(playerId: string, pair: FPPair): boolean {
  return pair.players[0].id === playerId || pair.players[1].id === playerId;
}

function getPartnerFromPair(playerId: string, pair: FPPair): Player {
  return pair.players[0].id === playerId ? pair.players[1] : pair.players[0];
}

export function computePersonalStats(
  evening: FPEvening,
  playerId: string,
  playerStatsList: FPPlayerStats[]
): PersonalStats | null {
  const player = evening.players.find(p => p.id === playerId);
  if (!player) return null;

  const statsEntry = playerStatsList.find(s => s.player.id === playerId);
  if (!statsEntry) return null;

  const idx = playerStatsList.findIndex(s => s.player.id === playerId);
  // Competition ranking: if previous player has same points, share their rank
  let rank = idx + 1;
  if (idx > 0 && playerStatsList[idx].points === playerStatsList[idx - 1].points) {
    // Find the first player with this point total
    let first = idx;
    while (first > 0 && playerStatsList[first - 1].points === playerStatsList[idx].points) {
      first--;
    }
    rank = first + 1;
  }

  // Completed matches involving this player
  const myMatches = evening.schedule.filter(m =>
    m.completed && (playerInPair(playerId, m.pairA) || playerInPair(playerId, m.pairB))
  );

  const totalMyMatches = evening.schedule.filter(m =>
    playerInPair(playerId, m.pairA) || playerInPair(playerId, m.pairB)
  );
  const matchesLeft = totalMyMatches.length - myMatches.length;

  const winRate = myMatches.length > 0 ? Math.round((statsEntry.wins / myMatches.length) * 100) : 0;

  // Current streak
  let currentStreak: PersonalStats['currentStreak'] = { type: 'none', count: 0 };
  if (myMatches.length > 0) {
    const sorted = [...myMatches].sort((a, b) => a.globalIndex - b.globalIndex);
    const last = sorted[sorted.length - 1];
    const lastResult = getMatchResult(playerId, last);
    let count = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (getMatchResult(playerId, sorted[i]) === lastResult) count++;
      else break;
    }
    currentStreak = { type: lastResult, count };
  }

  // Unbeaten streak (from most recent going back)
  let unbeatenStreak = 0;
  if (myMatches.length > 0) {
    const sorted = [...myMatches].sort((a, b) => a.globalIndex - b.globalIndex);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const r = getMatchResult(playerId, sorted[i]);
      if (r === 'L') break;
      unbeatenStreak++;
    }
  }

  // Partner records
  const partnerMap = new Map<string, PartnerRecord>();
  for (const m of myMatches) {
    const inA = playerInPair(playerId, m.pairA);
    const myPair = inA ? m.pairA : m.pairB;
    const partner = getPartnerFromPair(playerId, myPair);
    const myScore = inA ? m.scoreA! : m.scoreB!;
    const theirScore = inA ? m.scoreB! : m.scoreA!;

    if (!partnerMap.has(partner.id)) {
      partnerMap.set(partner.id, { partner, played: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    const rec = partnerMap.get(partner.id)!;
    rec.played++;
    rec.goalsFor += myScore;
    rec.goalsAgainst += theirScore;
    if (myScore > theirScore) { rec.wins++; rec.points += 3; }
    else if (myScore === theirScore) { rec.draws++; rec.points += 1; }
    else { rec.losses++; }
  }
  const partnerRecords = Array.from(partnerMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
  const bestPartner = partnerRecords.length > 0 && partnerRecords[0].played > 0 ? partnerRecords[0] : null;

  // Opponent records
  const opponentMap = new Map<string, OpponentRecord>();
  for (const m of myMatches) {
    const inA = playerInPair(playerId, m.pairA);
    const oppPair = inA ? m.pairB : m.pairA;
    const myScore = inA ? m.scoreA! : m.scoreB!;
    const theirScore = inA ? m.scoreB! : m.scoreA!;

    for (const opp of oppPair.players) {
      if (!opponentMap.has(opp.id)) {
        opponentMap.set(opp.id, { opponent: opp, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
      }
      const rec = opponentMap.get(opp.id)!;
      rec.played++;
      rec.goalsFor += myScore;
      rec.goalsAgainst += theirScore;
      if (myScore > theirScore) rec.wins++;
      else if (myScore === theirScore) rec.draws++;
      else rec.losses++;
    }
  }
  const opponentRecords = Array.from(opponentMap.values()).sort((a, b) => b.losses - a.losses || (b.goalsAgainst - b.goalsFor) - (a.goalsAgainst - a.goalsFor));
  const toughestOpponent = opponentRecords.length > 0 && opponentRecords[0].played > 0 ? opponentRecords[0] : null;

  // Current match
  const currentMatch = evening.schedule[evening.currentMatchIndex] ?? null;
  const isPlayingNow = currentMatch ? (playerInPair(playerId, currentMatch.pairA) || playerInPair(playerId, currentMatch.pairB)) : false;
  const isSittingOutNow = currentMatch ? currentMatch.sittingOut.id === playerId : false;

  let currentPartner: Player | null = null;
  let currentOpponents: [Player, Player] | null = null;
  if (isPlayingNow && currentMatch) {
    const inA = playerInPair(playerId, currentMatch.pairA);
    const myPair = inA ? currentMatch.pairA : currentMatch.pairB;
    const oppPair = inA ? currentMatch.pairB : currentMatch.pairA;
    currentPartner = getPartnerFromPair(playerId, myPair);
    currentOpponents = [oppPair.players[0], oppPair.players[1]];
  }

  // Next match
  const upcomingMatches = evening.schedule.filter((m, i) => !m.completed && i !== evening.currentMatchIndex);
  const nextMatch = upcomingMatches.find(m =>
    playerInPair(playerId, m.pairA) || playerInPair(playerId, m.pairB)
  ) ?? null;

  let nextPartner: Player | null = null;
  let nextOpponents: [Player, Player] | null = null;
  if (nextMatch) {
    const inA = playerInPair(playerId, nextMatch.pairA);
    const myPair = inA ? nextMatch.pairA : nextMatch.pairB;
    const oppPair = inA ? nextMatch.pairB : nextMatch.pairA;
    nextPartner = getPartnerFromPair(playerId, myPair);
    nextOpponents = [oppPair.players[0], oppPair.players[1]];
  }

  // Check if next unplayed is sitting out
  const nextUnplayed = upcomingMatches[0] ?? null;
  const nextSittingOut = nextUnplayed ? nextUnplayed.sittingOut.id === playerId : false;

  return {
    player,
    stats: statsEntry,
    rank,
    matchesLeft,
    winRate,
    currentStreak,
    unbeatenStreak,
    partnerRecords,
    bestPartner,
    opponentRecords,
    toughestOpponent,
    nextMatch,
    nextPartner,
    nextOpponents,
    nextSittingOut,
    isPlayingNow,
    isSittingOutNow,
    currentPartner,
    currentOpponents,
  };
}

function getMatchResult(playerId: string, match: FPMatch): 'W' | 'D' | 'L' {
  const inA = playerInPair(playerId, match.pairA);
  const myScore = inA ? match.scoreA! : match.scoreB!;
  const theirScore = inA ? match.scoreB! : match.scoreA!;
  if (myScore > theirScore) return 'W';
  if (myScore < theirScore) return 'L';
  return 'D';
}

export function playerInMatch(playerId: string, match: FPMatch): boolean {
  return playerInPair(playerId, match.pairA) || playerInPair(playerId, match.pairB);
}

export function playerInFPPair(playerId: string, pair: FPPair): boolean {
  return pair.players[0].id === playerId || pair.players[1].id === playerId;
}
