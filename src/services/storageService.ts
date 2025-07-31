import { Evening } from '@/types/tournament';

const STORAGE_KEY = 'ea-fc-25-tournaments';

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
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}