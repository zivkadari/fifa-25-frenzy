/**
 * Client-side service for fetching team squad data.
 * Handles caching and API calls through the edge function.
 */
import { TeamSquad, SquadPlayer } from './teamSquadTypes';
import { getCachedSquad, setCachedSquad } from './teamSquadCache';
import { getSofifaTeamId } from '@/data/sofifaTeamIds';
import { Club } from '@/types/tournament';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'ikbywydyidnkohbdrqdk';

export interface FetchSquadResult {
  squad: TeamSquad | null;
  error: string | null;
  source: 'cache' | 'api' | 'none';
}

/**
 * Fetch squad data for a club, with per-tournament caching.
 */
export async function fetchTeamSquad(
  club: Club,
  tournamentId: string
): Promise<FetchSquadResult> {
  // 1. Check cache first
  const cached = getCachedSquad(tournamentId, club.id);
  if (cached) {
    return { squad: cached, error: null, source: 'cache' };
  }

  // 2. Check if we have a SoFIFA mapping
  if (club.isNational || club.isPrime) {
    return {
      squad: null,
      error: 'נבחרות וקבוצות Prime לא נתמכות כרגע בהמלצת הרכב',
      source: 'none',
    };
  }

  const sofifaId = getSofifaTeamId(club.id);
  if (!sofifaId) {
    return {
      squad: null,
      error: `לא נמצא מזהה SoFIFA עבור ${club.name}`,
      source: 'none',
    };
  }

  // 3. Fetch from edge function
  try {
    const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/fetch-team-squad?teamId=${sofifaId}`;
    const res = await fetch(url);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'שגיאה בטעינת נתוני הקבוצה' }));
      const errorMsg = data.error === 'SOFIFA_BLOCKED'
        ? 'שירות SoFIFA לא זמין כרגע. נסו שוב מאוחר יותר.'
        : data.message || `שגיאה ${res.status}`;
      return { squad: null, error: errorMsg, source: 'none' };
    }

    const rawSquad = await res.json();
    const squad: TeamSquad = {
      teamId: rawSquad.teamId,
      teamName: rawSquad.teamName,
      clubId: club.id,
      players: rawSquad.players as SquadPlayer[],
      fetchedAt: rawSquad.fetchedAt,
    };

    // 4. Cache the result
    setCachedSquad(tournamentId, club.id, squad);

    return { squad, error: null, source: 'api' };
  } catch (err) {
    console.error('Failed to fetch team squad:', err);
    return {
      squad: null,
      error: 'שגיאת רשת בטעינת נתוני הקבוצה',
      source: 'none',
    };
  }
}
