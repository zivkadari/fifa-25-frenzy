/**
 * Types for team squad data fetched from external sources (e.g. SoFIFA).
 * Reusable across game modes.
 */

export interface SquadPlayer {
  id: number;
  name: string;
  shortName: string;
  overallRating: number;
  position: string;        // Primary position (e.g. "ST", "CB", "CM")
  altPositions: string[];   // Alternative positions
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  // Goalkeeper specific
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  speed?: number;
  positioning?: number;
}

export interface TeamSquad {
  teamId: number;
  teamName: string;
  clubId: string;  // Our internal club ID
  players: SquadPlayer[];
  fetchedAt: number; // timestamp
}

export interface LineupSlot {
  position: string;         // Position code (e.g. "ST", "LW", "CB")
  positionLabel: string;    // Hebrew label
  player: SquadPlayer;
  reasoning: string;        // Short explanation
}

export interface TeamSetupRecommendation {
  formation: string;         // e.g. "4-3-3"
  formationLabel: string;    // e.g. "4-3-3 (Attack)"
  startingXI: LineupSlot[];
  overallRating: number;     // Average OVR of starting XI
  summary: string;           // Brief overall reasoning
}
