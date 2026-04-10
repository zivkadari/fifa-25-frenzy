/**
 * All-time cumulative stats service for 5-player doubles mode.
 * Computes stats across multiple completed FP evenings + current evening.
 */
import { FPEvening, FPPlayerStats, FPPairStats } from '@/types/fivePlayerTypes';
import { Player } from '@/types/tournament';
import { calculatePlayerStats, calculatePairStats } from '@/services/fivePlayerEngine';
import { computePersonalStats, PartnerRecord, OpponentRecord } from '@/services/spectatorPersonalStats';

export interface AllTimePlayerStats {
  player: Player;
  totalPoints: number;
  tonightPoints: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalGoalDiff: number;
  totalPlayed: number;
  totalWinRate: number;
  eveningsPlayed: number;
  bestPartnerEver: { partner: Player; points: number; wins: number; draws: number; losses: number; played: number } | null;
  partnerRecords: AllTimePartnerRecord[];
  opponentRecords: AllTimeOpponentRecord[];
  toughestOpponentEver: { opponent: Player; losses: number; played: number; wins: number } | null;
  // Club stats
  clubRecords: ClubRecord[];
  bestClubEver: ClubRecord | null;
  // Star tier stats
  tierRecords: TierRecord[];
  bestTierEver: TierRecord | null;
  // Per-evening breakdown (for insight comparisons)
  eveningBreakdowns: EveningBreakdown[];
}

export interface AllTimePartnerRecord {
  partner: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

export interface AllTimeOpponentRecord {
  opponent: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ClubRecord {
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TierRecord {
  stars: number;
  label: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface EveningBreakdown {
  eveningId: string;
  date: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  rank: number;
}

function playerInPair(playerId: string, pair: { players: [Player, Player] }): boolean {
  return pair.players[0].id === playerId || pair.players[1].id === playerId;
}

function getPartner(playerId: string, pair: { players: [Player, Player] }): Player {
  return pair.players[0].id === playerId ? pair.players[1] : pair.players[0];
}

/**
 * Compute all-time stats for a specific player across multiple FP evenings.
 */
export function computeAllTimeStats(
  historicalEvenings: FPEvening[],
  currentEvening: FPEvening,
  playerId: string
): AllTimePlayerStats | null {
  const player = currentEvening.players.find(p => p.id === playerId);
  if (!player) return null;

  // All evenings to process: historical + current
  const allEvenings = [...historicalEvenings, currentEvening];
  
  // Find which evenings this player participated in
  const playerEvenings = allEvenings.filter(ev => 
    ev.players.some(p => p.id === playerId)
  );

  if (playerEvenings.length === 0) return null;

  let totalPoints = 0, totalWins = 0, totalDraws = 0, totalLosses = 0;
  let totalGoalsFor = 0, totalGoalsAgainst = 0, totalGoalDiff = 0, totalPlayed = 0;
  let tonightPoints = 0;

  const partnerMap = new Map<string, AllTimePartnerRecord>();
  const opponentMap = new Map<string, AllTimeOpponentRecord>();
  const clubMap = new Map<string, ClubRecord>();
  const tierMap = new Map<number, TierRecord>();
  const eveningBreakdowns: EveningBreakdown[] = [];

  for (const ev of playerEvenings) {
    const playerStats = calculatePlayerStats(ev);
    const myStats = playerStats.find(s => s.player.id === playerId);
    if (!myStats) continue;

    const rank = playerStats.findIndex(s => s.player.id === playerId) + 1;

    // Accumulate totals
    totalPoints += myStats.points;
    totalWins += myStats.wins;
    totalDraws += myStats.draws;
    totalLosses += myStats.losses;
    totalGoalsFor += myStats.goalsFor;
    totalGoalsAgainst += myStats.goalsAgainst;
    totalGoalDiff += myStats.goalDiff;
    totalPlayed += myStats.played;

    if (ev.id === currentEvening.id) {
      tonightPoints = myStats.points;
    }

    eveningBreakdowns.push({
      eveningId: ev.id,
      date: ev.date,
      points: myStats.points,
      wins: myStats.wins,
      draws: myStats.draws,
      losses: myStats.losses,
      played: myStats.played,
      rank,
    });

    // Process individual matches for partner/opponent/club/tier records
    for (const match of ev.schedule) {
      if (!match.completed || match.scoreA === undefined || match.scoreB === undefined) continue;
      
      const inA = playerInPair(playerId, match.pairA);
      const inB = playerInPair(playerId, match.pairB);
      if (!inA && !inB) continue;

      const myPair = inA ? match.pairA : match.pairB;
      const oppPair = inA ? match.pairB : match.pairA;
      const myScore = inA ? match.scoreA : match.scoreB;
      const theirScore = inA ? match.scoreB : match.scoreA;
      const won = myScore > theirScore;
      const drew = myScore === theirScore;
      const lost = myScore < theirScore;

      // Partner record
      const partner = getPartner(playerId, myPair);
      if (!partnerMap.has(partner.id)) {
        partnerMap.set(partner.id, {
          partner, played: 0, wins: 0, draws: 0, losses: 0, points: 0,
          goalsFor: 0, goalsAgainst: 0, winRate: 0,
        });
      }
      const pr = partnerMap.get(partner.id)!;
      pr.played++;
      pr.goalsFor += myScore;
      pr.goalsAgainst += theirScore;
      if (won) { pr.wins++; pr.points += 3; }
      else if (drew) { pr.draws++; pr.points += 1; }
      else { pr.losses++; }

      // Opponent records
      for (const opp of oppPair.players) {
        if (!opponentMap.has(opp.id)) {
          opponentMap.set(opp.id, {
            opponent: opp, played: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
          });
        }
        const or = opponentMap.get(opp.id)!;
        or.played++;
        or.goalsFor += myScore;
        or.goalsAgainst += theirScore;
        if (won) or.wins++;
        else if (drew) or.draws++;
        else or.losses++;
      }

      // Club record
      const myClub = inA ? match.clubA : match.clubB;
      if (myClub) {
        if (!clubMap.has(myClub.name)) {
          clubMap.set(myClub.name, { clubName: myClub.name, played: 0, wins: 0, draws: 0, losses: 0 });
        }
        const cr = clubMap.get(myClub.name)!;
        cr.played++;
        if (won) cr.wins++;
        else if (drew) cr.draws++;
        else cr.losses++;

        // Tier record
        const stars = myClub.stars;
        if (!tierMap.has(stars)) {
          tierMap.set(stars, {
            stars, label: `${stars}★`, played: 0, wins: 0, draws: 0, losses: 0, winRate: 0,
          });
        }
        const tr = tierMap.get(stars)!;
        tr.played++;
        if (won) tr.wins++;
        else if (drew) tr.draws++;
        else tr.losses++;
      }
    }
  }

  // Finalize win rates
  for (const pr of partnerMap.values()) {
    pr.winRate = pr.played > 0 ? Math.round((pr.wins / pr.played) * 100) : 0;
  }
  for (const tr of tierMap.values()) {
    tr.winRate = tr.played > 0 ? Math.round((tr.wins / tr.played) * 100) : 0;
  }

  const partnerRecords = Array.from(partnerMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
  const opponentRecords = Array.from(opponentMap.values()).sort((a, b) => b.losses - a.losses || (b.goalsAgainst - b.goalsFor) - (a.goalsAgainst - a.goalsFor));
  const clubRecords = Array.from(clubMap.values()).sort((a, b) => b.wins - a.wins || b.played - a.played);
  const tierRecords = Array.from(tierMap.values()).sort((a, b) => b.winRate - a.winRate);

  const bestPartnerEver = partnerRecords.length > 0 && partnerRecords[0].played >= 1
    ? partnerRecords[0]
    : null;

  const toughestOpponentEver = opponentRecords.length > 0 && opponentRecords[0].played >= 1
    ? { opponent: opponentRecords[0].opponent, losses: opponentRecords[0].losses, played: opponentRecords[0].played, wins: opponentRecords[0].wins }
    : null;

  const bestClubEver = clubRecords.length > 0 && clubRecords[0].played >= 2
    ? clubRecords[0]
    : null;

  const bestTierEver = tierRecords.length > 0 && tierRecords[0].played >= 3
    ? tierRecords[0]
    : null;

  const totalWinRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

  return {
    player,
    totalPoints,
    tonightPoints,
    totalWins,
    totalDraws,
    totalLosses,
    totalGoalsFor,
    totalGoalsAgainst,
    totalGoalDiff,
    totalPlayed,
    totalWinRate,
    eveningsPlayed: playerEvenings.length,
    bestPartnerEver: bestPartnerEver ? {
      partner: bestPartnerEver.partner,
      points: bestPartnerEver.points,
      wins: bestPartnerEver.wins,
      draws: bestPartnerEver.draws,
      losses: bestPartnerEver.losses,
      played: bestPartnerEver.played,
    } : null,
    partnerRecords,
    opponentRecords,
    toughestOpponentEver,
    clubRecords,
    bestClubEver,
    tierRecords,
    bestTierEver,
    eveningBreakdowns,
  };
}

/**
 * Compute all-time stats for ALL players (for comparison insights).
 */
export function computeAllTimeStatsForAll(
  historicalEvenings: FPEvening[],
  currentEvening: FPEvening
): Map<string, AllTimePlayerStats> {
  const result = new Map<string, AllTimePlayerStats>();
  for (const player of currentEvening.players) {
    const stats = computeAllTimeStats(historicalEvenings, currentEvening, player.id);
    if (stats) result.set(player.id, stats);
  }
  return result;
}
