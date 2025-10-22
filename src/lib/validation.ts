import { z } from 'zod';

/**
 * Validation schemas for user inputs to prevent injection attacks
 * and ensure data integrity
 */

export const teamNameSchema = z.string()
  .trim()
  .min(1, { message: 'שם קבוצה נדרש' })
  .max(50, { message: 'שם קבוצה ארוך מדי (מקסימום 50 תווים)' })
  .regex(/^[\u0590-\u05FF\w\s-]+$/, { message: 'תווים לא חוקיים בשם הקבוצה' });

export const playerNameSchema = z.string()
  .trim()
  .min(1, { message: 'שם שחקן נדרש' })
  .max(30, { message: 'שם שחקן ארוך מדי (מקסימום 30 תווים)' })
  .regex(/^[\u0590-\u05FF\w\s-]+$/, { message: 'תווים לא חוקיים בשם השחקן' });

export const displayNameSchema = z.string()
  .trim()
  .min(1, { message: 'שם תצוגה נדרש' })
  .max(50, { message: 'שם תצוגה ארוך מדי (מקסימום 50 תווים)' });

/**
 * Validates a team name
 */
export function validateTeamName(name: string): { valid: boolean; error?: string; value?: string } {
  try {
    const validated = teamNameSchema.parse(name);
    return { valid: true, value: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid team name' };
    }
    return { valid: false, error: 'Invalid team name' };
  }
}

/**
 * Validates a player name
 */
export function validatePlayerName(name: string): { valid: boolean; error?: string; value?: string } {
  try {
    const validated = playerNameSchema.parse(name);
    return { valid: true, value: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid player name' };
    }
    return { valid: false, error: 'Invalid player name' };
  }
}

/**
 * Validates a display name
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string; value?: string } {
  try {
    const validated = displayNameSchema.parse(name);
    return { valid: true, value: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid display name' };
    }
    return { valid: false, error: 'Invalid display name' };
  }
}
