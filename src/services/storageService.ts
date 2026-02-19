import { Evening } from '@/types/tournament';

const STORAGE_KEY = 'ea-fc-25-tournaments';
const ACTIVE_EVENING_KEY = 'ea-fc-25-active-evening';

export class StorageService {
  static saveEvening(evening: Evening): void {
    try {
      const existingEvenings = this.loadEvenings();
      const updatedEvenings = [...existingEvenings, evening];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvenings));
    } catch (error) {
      console.error('Failed to save evening:', error);
    }
  }

  static loadEvenings(): Evening[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load evenings:', error);
      return [];
    }
  }

  static deleteEvening(eveningId: string): void {
    try {
      const existingEvenings = this.loadEvenings();
      const filteredEvenings = existingEvenings.filter(evening => evening.id !== eveningId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvenings));
    } catch (error) {
      console.error('Failed to delete evening:', error);
    }
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_EVENING_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // --- Active (in-progress) evening persistence (prevents iOS background reset) ---
  static saveActiveEvening(evening: Evening): void {
    try {
      localStorage.setItem(ACTIVE_EVENING_KEY, JSON.stringify(evening));
    } catch (error) {
      console.error('Failed to save active evening:', error);
    }
  }

  static loadActiveEvening(): Evening | null {
    try {
      const stored = localStorage.getItem(ACTIVE_EVENING_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as Evening;
      // Validate essential fields to avoid restoring corrupted/empty state
      if (!parsed || !parsed.id || !Array.isArray(parsed.players) || !Array.isArray(parsed.rounds)) {
        console.warn('[StorageService] Invalid active evening data, clearing', parsed);
        localStorage.removeItem(ACTIVE_EVENING_KEY);
        return null;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEV] loadActiveEvening restored', {
          id: parsed.id,
          roundsCount: parsed.rounds.length,
          completed: parsed.completed,
          hasSchedule: !!parsed.pairSchedule,
          roundDetails: parsed.rounds.map((r, i) => ({
            index: i,
            matches: r.matches?.length ?? 0,
            completed: r.completed,
            pairScores: r.pairScores,
            hasTeamPools: !!(r.teamPools && r.teamPools[0]?.length),
          })),
        });
      }
      return parsed;
    } catch (error) {
      console.error('Failed to load active evening:', error);
      return null;
    }
  }

  static clearActiveEvening(): void {
    try {
      localStorage.removeItem(ACTIVE_EVENING_KEY);
    } catch (error) {
      console.error('Failed to clear active evening:', error);
    }
  }
}