import { Evening } from '@/types/tournament';
import { FPEvening } from '@/types/fivePlayerTypes';

const STORAGE_KEY = 'ea-fc-25-tournaments';
const ACTIVE_EVENING_KEY = 'ea-fc-25-active-evening';
const FP_STORAGE_KEY = 'ea-fc-25-fp-tournaments';
const FP_ACTIVE_KEY = 'ea-fc-25-fp-active';
const FP_GROUPS_KEY = 'ea-fc-25-fp-saved-groups';

export interface FPSavedGroup {
  id: string;
  name: string;
  players: string[]; // exactly 5 names
}

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

  // --- 5-Player Doubles persistence ---
  static saveFPEvening(evening: FPEvening): void {
    try {
      const existing = this.loadFPEvenings();
      const index = existing.findIndex(e => e.id === evening.id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...evening };
      } else {
        existing.push(evening);
      }
      localStorage.setItem(FP_STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save FP evening:', error);
    }
  }

  static loadFPEvenings(): FPEvening[] {
    try {
      const stored = localStorage.getItem(FP_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static deleteFPEvening(eveningId: string): void {
    try {
      const existing = this.loadFPEvenings();
      localStorage.setItem(FP_STORAGE_KEY, JSON.stringify(existing.filter(e => e.id !== eveningId)));
    } catch {}
  }

  static saveFPActive(evening: FPEvening): void {
    try {
      localStorage.setItem(FP_ACTIVE_KEY, JSON.stringify(evening));
    } catch {}
  }

  static loadFPActive(): FPEvening | null {
    try {
      const stored = localStorage.getItem(FP_ACTIVE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as FPEvening;
      if (!parsed || !parsed.id || parsed.mode !== 'five-player-doubles') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static clearFPActive(): void {
    try {
      localStorage.removeItem(FP_ACTIVE_KEY);
    } catch {}
  }

  // --- Saved 5-Player Groups ---
  static loadFPGroups(): FPSavedGroup[] {
    try {
      const stored = localStorage.getItem(FP_GROUPS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch { return []; }
  }

  static saveFPGroups(groups: FPSavedGroup[]): void {
    try {
      localStorage.setItem(FP_GROUPS_KEY, JSON.stringify(groups));
    } catch {}
  }

  static addFPGroup(group: FPSavedGroup): void {
    const groups = this.loadFPGroups();
    this.saveFPGroups([...groups, group]);
  }

  static updateFPGroup(group: FPSavedGroup): void {
    const groups = this.loadFPGroups().map(g => g.id === group.id ? group : g);
    this.saveFPGroups(groups);
  }

  static deleteFPGroup(groupId: string): void {
    const groups = this.loadFPGroups().filter(g => g.id !== groupId);
    this.saveFPGroups(groups);
  }
}