import { FPPair } from '@/types/fivePlayerTypes';
import { Player } from '@/types/tournament';

/**
 * FP history often uses freshly generated player ids per evening,
 * so cross-tournament all-time aggregation must stitch players by name.
 */
export function normalizeFivePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function getFivePlayerIdentity(player: Pick<Player, 'name'>): string {
  return normalizeFivePlayerName(player.name);
}

export function buildCanonicalPlayerLookup(players: Player[]): Map<string, Player> {
  return new Map(players.map((player) => [getFivePlayerIdentity(player), player]));
}

export function resolveCanonicalFivePlayerPlayer(
  player: Player,
  canonicalPlayers: Map<string, Player>
): Player {
  return canonicalPlayers.get(getFivePlayerIdentity(player)) ?? player;
}

export function pairHasPlayerIdentity(pair: FPPair, playerIdentity: string): boolean {
  return pair.players.some((player) => getFivePlayerIdentity(player) === playerIdentity);
}

export function getPartnerByIdentity(pair: FPPair, playerIdentity: string): Player | null {
  return pair.players.find((player) => getFivePlayerIdentity(player) !== playerIdentity) ?? null;
}