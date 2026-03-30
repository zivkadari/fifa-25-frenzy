/**
 * Competition ranking (1224) for Alpha–Epsilon tier labels.
 * Tied players share the same placement; the next placement skips accordingly.
 */

export const TIER_LABELS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'] as const;
export const TIER_EMOJIS = ['👑', '🥈', '🥉', '4️⃣', '5️⃣'] as const;
export const TIER_COLORS = [
  'from-yellow-400/25 to-yellow-600/10 border-yellow-400/50 ring-yellow-400/20',
  'from-slate-300/20 to-slate-400/10 border-slate-300/40',
  'from-amber-600/20 to-amber-700/10 border-amber-600/40',
  'from-border/30 to-border/10 border-border/40',
  'from-border/20 to-border/5 border-border/30',
] as const;
export const TIER_TEXT = [
  'text-yellow-400',
  'text-slate-300',
  'text-amber-500',
  'text-muted-foreground',
  'text-muted-foreground',
] as const;

/**
 * Given a sorted array of player stats (descending by points),
 * returns an array of 0-based tier indices using competition ranking.
 *
 * Example: points [45, 45, 40, 20, 18] → tier indices [0, 0, 2, 3, 4]
 *   meaning Alpha, Alpha, Gamma, Delta, Epsilon
 */
export function computeTierIndices(points: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || points[i] !== points[i - 1]) {
      result.push(i); // competition rank = position index
    } else {
      result.push(result[i - 1]); // same as previous
    }
  }
  return result;
}

/**
 * Given a 1-based rank, returns the tier index (0-based).
 * For use with PersonalSummaryCard where rank is already computed.
 */
export function rankToTierIndex(rank: number): number {
  return Math.max(0, Math.min(4, rank - 1));
}
