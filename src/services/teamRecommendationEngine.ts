/**
 * Reusable team setup recommendation engine.
 * Takes a TeamSquad and generates the best overall starting XI recommendation.
 * Can be used in spectator mode (5-player) and later in regular couples mode.
 */
import { SquadPlayer, TeamSetupRecommendation, LineupSlot, TeamSquad } from './teamSquadTypes';

// ── Formation definitions ──

interface FormationDefinition {
  name: string;
  label: string;
  positions: { code: string; label: string; zone: 'GK' | 'DEF' | 'MID' | 'ATT' }[];
}

const FORMATIONS: FormationDefinition[] = [
  {
    name: '4-3-3',
    label: '4-3-3',
    positions: [
      { code: 'GK', label: 'שוער', zone: 'GK' },
      { code: 'RB', label: 'מגן ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם שמאלי', zone: 'DEF' },
      { code: 'LB', label: 'מגן שמאלי', zone: 'DEF' },
      { code: 'CM', label: 'קשר ימני', zone: 'MID' },
      { code: 'CDM', label: 'קשר הגנתי', zone: 'MID' },
      { code: 'CM', label: 'קשר שמאלי', zone: 'MID' },
      { code: 'RW', label: 'כנף ימנית', zone: 'ATT' },
      { code: 'ST', label: 'חלוץ', zone: 'ATT' },
      { code: 'LW', label: 'כנף שמאלית', zone: 'ATT' },
    ],
  },
  {
    name: '4-4-2',
    label: '4-4-2',
    positions: [
      { code: 'GK', label: 'שוער', zone: 'GK' },
      { code: 'RB', label: 'מגן ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם שמאלי', zone: 'DEF' },
      { code: 'LB', label: 'מגן שמאלי', zone: 'DEF' },
      { code: 'RM', label: 'קשר ימני', zone: 'MID' },
      { code: 'CM', label: 'קשר מרכזי', zone: 'MID' },
      { code: 'CM', label: 'קשר מרכזי', zone: 'MID' },
      { code: 'LM', label: 'קשר שמאלי', zone: 'MID' },
      { code: 'ST', label: 'חלוץ ימני', zone: 'ATT' },
      { code: 'ST', label: 'חלוץ שמאלי', zone: 'ATT' },
    ],
  },
  {
    name: '4-2-3-1',
    label: '4-2-3-1',
    positions: [
      { code: 'GK', label: 'שוער', zone: 'GK' },
      { code: 'RB', label: 'מגן ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם שמאלי', zone: 'DEF' },
      { code: 'LB', label: 'מגן שמאלי', zone: 'DEF' },
      { code: 'CDM', label: 'קשר הגנתי', zone: 'MID' },
      { code: 'CDM', label: 'קשר הגנתי', zone: 'MID' },
      { code: 'CAM', label: 'קשר התקפי', zone: 'MID' },
      { code: 'RW', label: 'כנף ימנית', zone: 'ATT' },
      { code: 'ST', label: 'חלוץ', zone: 'ATT' },
      { code: 'LW', label: 'כנף שמאלית', zone: 'ATT' },
    ],
  },
  {
    name: '3-5-2',
    label: '3-5-2',
    positions: [
      { code: 'GK', label: 'שוער', zone: 'GK' },
      { code: 'CB', label: 'בלם ימני', zone: 'DEF' },
      { code: 'CB', label: 'בלם מרכזי', zone: 'DEF' },
      { code: 'CB', label: 'בלם שמאלי', zone: 'DEF' },
      { code: 'RM', label: 'כנף ימנית', zone: 'MID' },
      { code: 'CM', label: 'קשר ימני', zone: 'MID' },
      { code: 'CDM', label: 'קשר הגנתי', zone: 'MID' },
      { code: 'CM', label: 'קשר שמאלי', zone: 'MID' },
      { code: 'LM', label: 'כנף שמאלית', zone: 'MID' },
      { code: 'ST', label: 'חלוץ ימני', zone: 'ATT' },
      { code: 'ST', label: 'חלוץ שמאלי', zone: 'ATT' },
    ],
  },
];

// ── Position compatibility ──

const POSITION_GROUPS: Record<string, string[]> = {
  'GK': ['GK'],
  'RB': ['RB', 'RWB'],
  'CB': ['CB'],
  'LB': ['LB', 'LWB'],
  'CDM': ['CDM', 'CM'],
  'CM': ['CM', 'CDM', 'CAM'],
  'CAM': ['CAM', 'CM', 'CF'],
  'RM': ['RM', 'RW', 'RB'],
  'LM': ['LM', 'LW', 'LB'],
  'RW': ['RW', 'RM', 'RF'],
  'LW': ['LW', 'LM', 'LF'],
  'ST': ['ST', 'CF', 'CAM'],
  'CF': ['CF', 'ST', 'CAM'],
  'RWB': ['RWB', 'RB', 'RM'],
  'LWB': ['LWB', 'LB', 'LM'],
  'RF': ['RF', 'RW', 'ST'],
  'LF': ['LF', 'LW', 'ST'],
};

/**
 * Calculate how well a player fits a specific position.
 * Returns a score 0-100 where higher = better fit.
 */
function positionFitScore(player: SquadPlayer, targetPos: string): number {
  const compatible = POSITION_GROUPS[targetPos] ?? [targetPos];

  // Perfect fit: primary position matches
  if (player.position === targetPos) return 100;

  // Alt position matches target
  if (player.altPositions.includes(targetPos)) return 90;

  // Primary position is in compatible group
  if (compatible.includes(player.position)) return 75;

  // Alt positions overlap with compatible group
  const altOverlap = player.altPositions.some(p => compatible.includes(p));
  if (altOverlap) return 60;

  // Zone-level compatibility (attacker in attack slot, etc.)
  const playerZone = getPlayerZone(player);
  const targetZone = getPositionZone(targetPos);
  if (playerZone === targetZone) return 30;

  return 5; // Very poor fit
}

function getPlayerZone(p: SquadPlayer): string {
  if (p.position === 'GK') return 'GK';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(p.position)) return 'DEF';
  if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(p.position)) return 'ATT';
  return 'MID';
}

function getPositionZone(pos: string): string {
  if (pos === 'GK') return 'GK';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(pos)) return 'DEF';
  if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(pos)) return 'ATT';
  return 'MID';
}

/**
 * Calculate a weighted overall score for a player in a specific position.
 * Uses position-relevant attributes, not just OVR.
 */
function playerPositionScore(player: SquadPlayer, targetPos: string): number {
  const fit = positionFitScore(player, targetPos);
  const ovr = player.overallRating;

  // Attribute-weighted bonus based on position zone
  let attrBonus = 0;
  const zone = getPositionZone(targetPos);

  if (zone === 'GK') {
    // For GK, use GK-specific stats if available, else OVR
    attrBonus = player.diving != null
      ? (player.diving + player.handling! + player.reflexes! + player.kicking! + player.positioning!) / 5
      : ovr;
  } else if (zone === 'ATT') {
    // Attack: shooting, pace, dribbling matter most
    attrBonus = (player.shooting * 0.35 + player.pace * 0.25 + player.dribbling * 0.25 + player.passing * 0.15);
  } else if (zone === 'MID') {
    // Midfield: passing, dribbling, defending, physical
    attrBonus = (player.passing * 0.3 + player.dribbling * 0.25 + player.defending * 0.2 + player.physical * 0.15 + player.shooting * 0.1);
  } else if (zone === 'DEF') {
    // Defence: defending, physical, pace
    attrBonus = (player.defending * 0.35 + player.physical * 0.25 + player.pace * 0.2 + player.passing * 0.15 + player.dribbling * 0.05);
  }

  // Combined score: position fit + OVR + attribute bonus
  return (fit * 0.3) + (ovr * 0.35) + (attrBonus * 0.35);
}

/**
 * Generate a short Hebrew reasoning for why a player was selected.
 */
function generateReasoning(player: SquadPlayer, targetPos: string): string {
  const zone = getPositionZone(targetPos);
  const fitPrimary = player.position === targetPos || player.altPositions.includes(targetPos);
  const posNote = fitPrimary ? '' : ` (ממוקם כ-${player.position})`;

  if (zone === 'GK') {
    return `דירוג ${player.overallRating}${posNote}`;
  }

  // Find the standout attributes
  const attrs: { name: string; value: number }[] = [
    { name: 'מהירות', value: player.pace },
    { name: 'בעיטה', value: player.shooting },
    { name: 'מסירות', value: player.passing },
    { name: 'כדרור', value: player.dribbling },
    { name: 'הגנה', value: player.defending },
    { name: 'פיזי', value: player.physical },
  ];
  attrs.sort((a, b) => b.value - a.value);

  const top2 = attrs.slice(0, 2).map(a => `${a.name} ${a.value}`).join(', ');
  return `${player.overallRating} OVR · ${top2}${posNote}`;
}

/**
 * Use a greedy assignment algorithm to fill each formation slot
 * with the best available player.
 */
function assignPlayers(
  players: SquadPlayer[],
  positions: FormationDefinition['positions']
): LineupSlot[] {
  const available = [...players];
  const slots: LineupSlot[] = [];

  // Sort positions: GK first (must be filled), then others by scarcity
  const sortedPositions = [...positions].sort((a, b) => {
    if (a.code === 'GK') return -1;
    if (b.code === 'GK') return 1;
    // Prioritize positions with fewer compatible players
    const aCount = available.filter(p => positionFitScore(p, a.code) >= 60).length;
    const bCount = available.filter(p => positionFitScore(p, b.code) >= 60).length;
    return aCount - bCount;
  });

  for (const pos of sortedPositions) {
    // Score all available players for this position
    const scored = available.map(p => ({
      player: p,
      score: playerPositionScore(p, pos.code),
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best) {
      slots.push({
        position: pos.code,
        positionLabel: pos.label,
        player: best.player,
        reasoning: generateReasoning(best.player, pos.code),
      });
      // Remove assigned player
      const idx = available.findIndex(p => p.id === best.player.id);
      if (idx !== -1) available.splice(idx, 1);
    }
  }

  // Re-sort to match original formation order
  const posOrder = positions.map(p => p.code + p.label);
  slots.sort((a, b) => {
    const ai = posOrder.indexOf(a.position + a.positionLabel);
    const bi = posOrder.indexOf(b.position + b.positionLabel);
    return ai - bi;
  });

  return slots;
}

/**
 * Generate the best overall team setup recommendation.
 * Tries all available formations and picks the highest-scoring one.
 */
export function generateRecommendation(squad: TeamSquad): TeamSetupRecommendation {
  let bestFormation: FormationDefinition = FORMATIONS[0];
  let bestSlots: LineupSlot[] = [];
  let bestAvgScore = 0;

  for (const formation of FORMATIONS) {
    const slots = assignPlayers(squad.players, formation.positions);
    const avgScore = slots.reduce((sum, s) => sum + s.player.overallRating, 0) / slots.length;

    // Also consider position fit quality
    const avgFit = slots.reduce((sum, s) => sum + positionFitScore(s.player, s.position), 0) / slots.length;
    const combinedScore = avgScore * 0.7 + avgFit * 0.3;

    if (combinedScore > bestAvgScore) {
      bestAvgScore = combinedScore;
      bestFormation = formation;
      bestSlots = slots;
    }
  }

  const avgOvr = Math.round(bestSlots.reduce((s, sl) => s + sl.player.overallRating, 0) / bestSlots.length);

  return {
    formation: bestFormation.name,
    formationLabel: bestFormation.label,
    startingXI: bestSlots,
    overallRating: avgOvr,
    summary: `מערך ${bestFormation.label} עם דירוג ממוצע ${avgOvr}. הרכב אופטימלי לפי התאמת עמדות ותכונות שחקנים.`,
  };
}
