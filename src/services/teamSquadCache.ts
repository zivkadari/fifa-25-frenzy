/**
 * In-memory cache for team squad data within a tournament session.
 * Prevents repeated API calls for the same team.
 */
import { TeamSquad } from './teamSquadTypes';

const squadCache = new Map<string, TeamSquad>();

function cacheKey(tournamentId: string, clubId: string): string {
  return `${tournamentId}::${clubId}`;
}

export function getCachedSquad(tournamentId: string, clubId: string): TeamSquad | null {
  return squadCache.get(cacheKey(tournamentId, clubId)) ?? null;
}

export function setCachedSquad(tournamentId: string, clubId: string, squad: TeamSquad): void {
  squadCache.set(cacheKey(tournamentId, clubId), squad);
}

export function clearTournamentCache(tournamentId: string): void {
  for (const key of squadCache.keys()) {
    if (key.startsWith(`${tournamentId}::`)) {
      squadCache.delete(key);
    }
  }
}
