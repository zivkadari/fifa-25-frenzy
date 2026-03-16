/**
 * Voice Result Parser
 * Parses Hebrew speech transcripts into structured match result candidates.
 * Supports multi-result parsing with context carry-forward and club-only inference.
 */

import { Player, Pair, Club } from '@/types/tournament';
import { buildAliasLookup, findClubMatch, normalizeForMatch, applyAsrCorrections } from '@/lib/hebrewClubAliases';

export interface VoiceResultCandidate {
  id: string;
  pairAPlayers: string; // display names
  pairBPlayers: string;
  pairAClub: Club | null;
  pairBClub: Club | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerSide: 'A' | 'B' | 'draw' | null;
  transcriptFragment: string;
  confidence: number; // 0-1
  warnings: string[];
  // Internal IDs for applying results
  pairAId?: string;
  pairBId?: string;
}

// Hebrew number words → digits
const HEBREW_NUMBERS: Record<string, number> = {
  'אפס': 0, 'שום': 0,
  'אחת': 1, 'אחד': 1,
  'שתיים': 2, 'שניים': 2, 'שתים': 2,
  'שלוש': 3, 'שלושה': 3,
  'ארבע': 4, 'ארבעה': 4,
  'חמש': 5, 'חמישה': 5,
  'שש': 6, 'שישה': 6,
  'שבע': 7, 'שבעה': 7,
  'שמונה': 8,
  'תשע': 9, 'תשעה': 9,
  'עשר': 10,
};

// Split delimiters for multiple results
const SPLIT_PATTERN = /\s+(?:ואז|אחר כך|ואחר כך|אחרי זה|וגם|ו?אחרי)\s+/;

// Win/loss indicators
const WIN_WORDS = ['ניצחו', 'ניצח', 'ניצחה', 'גברו', 'גבר'];
const LOSS_WORDS = ['הפסידו', 'הפסיד', 'הפסידה'];
const DRAW_WORDS = ['עשו', 'עשתה', 'נגמר', 'תיקו'];

// Score patterns
const SCORE_REGEX_NUMERIC = /(\d+)\s*[-–:]\s*(\d+)/;

function parseHebrewNumber(word: string): number | null {
  const n = HEBREW_NUMBERS[word];
  if (n !== undefined) return n;
  const parsed = parseInt(word);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Try to extract a score from a text fragment.
 * Supports: "3-1", "3:1", "שלוש אחת"
 */
function extractScore(text: string): { scoreA: number; scoreB: number; matchedText: string } | null {
  // Try numeric pattern first
  const numMatch = text.match(SCORE_REGEX_NUMERIC);
  if (numMatch) {
    return {
      scoreA: parseInt(numMatch[1]),
      scoreB: parseInt(numMatch[2]),
      matchedText: numMatch[0],
    };
  }

  // Try Hebrew number words
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const a = parseHebrewNumber(words[i]);
    const b = parseHebrewNumber(words[i + 1]);
    if (a !== null && b !== null && a >= 0 && a <= 20 && b >= 0 && b <= 20) {
      return { scoreA: a, scoreB: b, matchedText: `${words[i]} ${words[i + 1]}` };
    }
  }

  return null;
}

/**
 * Find which pair matches spoken player names.
 */
function findPairMatch(
  spokenText: string,
  pairs: Pair[]
): { pair: Pair; confidence: number } | null {
  const normalized = normalizeForMatch(spokenText);
  let bestMatch: { pair: Pair; score: number } | null = null;

  for (const pair of pairs) {
    let matchScore = 0;
    for (const player of pair.players) {
      const playerNorm = normalizeForMatch(player.name);
      if (playerNorm.length >= 2 && normalized.includes(playerNorm)) {
        matchScore += 1;
      }
    }
    if (matchScore > 0 && (!bestMatch || matchScore > bestMatch.score)) {
      bestMatch = { pair, score: matchScore };
    }
  }

  if (bestMatch) {
    const confidence = bestMatch.score >= 2 ? 0.95 : 0.6;
    return { pair: bestMatch.pair, confidence };
  }

  return null;
}

/**
 * Try to infer pairs from club assignments in current match context.
 * If clubs are currently selected for pairs, we can match spoken clubs to pairs.
 */
function inferPairsFromClubs(
  clubA: Club | null,
  clubB: Club | null,
  pairs: Pair[],
  availableClubs: Club[]
): { pairA: Pair | null; pairB: Pair | null } {
  if (pairs.length !== 2 || !clubA || !clubB) {
    return { pairA: null, pairB: null };
  }

  // Check which pool each club belongs to
  // availableClubs is [...pool0, ...pool1], but we don't know the split
  // For now just assign pair[0] to clubA and pair[1] to clubB as default
  return { pairA: pairs[0], pairB: pairs[1] };
}

interface ParseContext {
  lastPairA: Pair | null;
  lastPairB: Pair | null;
}

/**
 * Main parser: takes a transcript and tournament context, returns structured candidates.
 */
export function parseVoiceResults(
  transcript: string,
  currentPairs: Pair[],
  availableClubs: Club[], // all clubs in the current round pools
  allClubs: Club[] // full club list for alias resolution
): VoiceResultCandidate[] {
  if (!transcript.trim()) return [];

  // Apply ASR corrections before parsing
  const corrected = applyAsrCorrections(transcript);

  // Build alias lookup
  const aliasLookup = buildAliasLookup(allClubs);
  const contextClubIds = new Set(availableClubs.map(c => c.id));

  // Split transcript into segments for multiple results
  const segments = corrected.split(SPLIT_PATTERN).filter(s => s.trim());

  const candidates: VoiceResultCandidate[] = [];
  const context: ParseContext = { lastPairA: null, lastPairB: null };

  for (const segment of segments) {
    const candidate = parseSegment(segment.trim(), currentPairs, availableClubs, allClubs, aliasLookup, contextClubIds, context);
    candidates.push(candidate);
    // Carry forward context: if this segment identified pairs, remember them
    if (candidate.pairAId) {
      context.lastPairA = currentPairs.find(p => p.id === candidate.pairAId) ?? null;
      context.lastPairB = currentPairs.find(p => p.id === candidate.pairBId) ?? null;
    }
  }

  return candidates;
}

function parseSegment(
  segment: string,
  pairs: Pair[],
  availableClubs: Club[],
  allClubs: Club[],
  aliasLookup: Map<string, string>,
  contextClubIds: Set<string>,
  carryContext: ParseContext
): VoiceResultCandidate {
  const warnings: string[] = [];
  let confidence = 0.5;

  // 1. Find the speaking pair (pair A = the pair that "won" or "lost")
  const pairMatch = findPairMatch(segment, pairs);
  let pairA: Pair | null = pairMatch?.pair ?? null;
  let pairB: Pair | null = null;

  if (pairA) {
    confidence = Math.max(confidence, pairMatch!.confidence);
    pairB = pairs.find(p => p.id !== pairA!.id) ?? null;
  } else if (carryContext.lastPairA) {
    // Carry forward from previous clause
    pairA = carryContext.lastPairA;
    pairB = carryContext.lastPairB;
    confidence = 0.45;
  } else if (pairs.length === 2) {
    // Default: assign pairs[0] as A, pairs[1] as B — will refine with club matching below
    pairA = pairs[0];
    pairB = pairs[1];
    confidence = 0.3;
  } else {
    warnings.push('לא זוהו שמות שחקנים');
  }

  // 2. Determine win/loss direction
  let winnerSide: 'A' | 'B' | 'draw' | null = null;
  const hasWinWord = WIN_WORDS.some(w => segment.includes(w));
  const hasLossWord = LOSS_WORDS.some(w => segment.includes(w));
  const hasDrawWord = DRAW_WORDS.some(w => segment.includes(w));

  if (hasDrawWord && !hasWinWord && !hasLossWord) {
    winnerSide = 'draw';
  } else if (hasWinWord && !hasLossWord) {
    winnerSide = 'A'; // The mentioned pair won
  } else if (hasLossWord && !hasWinWord) {
    winnerSide = 'B'; // The mentioned pair lost
  } else if (hasWinWord && hasLossWord) {
    const winIdx = Math.min(...WIN_WORDS.map(w => { const i = segment.indexOf(w); return i >= 0 ? i : Infinity; }));
    const lossIdx = Math.min(...LOSS_WORDS.map(w => { const i = segment.indexOf(w); return i >= 0 ? i : Infinity; }));
    winnerSide = winIdx < lossIdx ? 'A' : 'B';
  }

  // 3. Extract score
  const scoreResult = extractScore(segment);
  let scoreA = scoreResult?.scoreA ?? null;
  let scoreB = scoreResult?.scoreB ?? null;

  // If winner side is B (pair A lost), swap scores so pair A has the lower score
  if (winnerSide === 'B' && scoreA !== null && scoreB !== null && scoreA > scoreB) {
    [scoreA, scoreB] = [scoreB, scoreA];
  }

  if (scoreA === null || scoreB === null) {
    warnings.push('לא זוהה ציון');
  }

  // Validate score vs winner
  if (scoreA !== null && scoreB !== null) {
    if (scoreA === scoreB) {
      winnerSide = 'draw';
    } else if (winnerSide === 'A' && scoreA <= scoreB) {
      warnings.push('ציון לא תואם לניצחון');
      confidence *= 0.5;
    } else if (winnerSide === 'B' && scoreB <= scoreA) {
      warnings.push('ציון לא תואם להפסד');
      confidence *= 0.5;
    } else if (!winnerSide) {
      // Infer winner from score
      winnerSide = scoreA > scoreB ? 'A' : 'B';
    }
  }

  // 4. Extract clubs — try multiple patterns
  let clubA: Club | null = null;
  let clubB: Club | null = null;

  // Pattern: "עם X את/מול/נגד/ל Y"
  const fullPattern = /עם\s+(.+?)\s+(?:את|מול|נגד|ל)\s*-?\s*(.+?)(?:\s+\d|$)/;
  const fullMatch = segment.match(fullPattern);

  // Pattern: "X ניצחה/הפסידה את/ל Y"  (club-only, no "עם")
  const clubOnlyPattern = /^(.+?)\s+(?:ניצחו?|ניצחה|הפסידו?|הפסידה|גברו?|עשו|עשתה)\s+(?:את\s+|ל\s*-?\s*|מול\s+|נגד\s+)?(.+?)(?:\s+\d|$)/;
  const clubOnlyMatch = segment.match(clubOnlyPattern);

  // Pattern: "עשו/נגמר X-Y עם A נגד/מול B"
  const drawPattern = /(?:עשו|עשתה|נגמר)\s+\d+\s*[-–:]\s*\d+\s+עם\s+(.+?)\s+(?:נגד|מול|את)\s+(.+?)$/;
  const drawMatch = segment.match(drawPattern);

  if (fullMatch) {
    const clubAName = fullMatch[1].trim();
    let clubBName = fullMatch[2].trim().replace(/\s*\d+\s*[-–:]\s*\d+.*$/, '').trim();

    const clubAResult = findClubMatch(clubAName, aliasLookup, contextClubIds);
    const clubBResult = findClubMatch(clubBName, aliasLookup, contextClubIds);

    if (clubAResult) clubA = allClubs.find(c => c.id === clubAResult.clubId) ?? availableClubs.find(c => c.id === clubAResult.clubId) ?? null;
    if (clubBResult) clubB = allClubs.find(c => c.id === clubBResult.clubId) ?? availableClubs.find(c => c.id === clubBResult.clubId) ?? null;
  } else if (drawMatch) {
    const clubAResult = findClubMatch(drawMatch[1].trim(), aliasLookup, contextClubIds);
    const clubBResult = findClubMatch(drawMatch[2].trim(), aliasLookup, contextClubIds);
    if (clubAResult) clubA = allClubs.find(c => c.id === clubAResult.clubId) ?? null;
    if (clubBResult) clubB = allClubs.find(c => c.id === clubBResult.clubId) ?? null;
  } else if (clubOnlyMatch) {
    const clubAName = clubOnlyMatch[1].trim();
    let clubBName = clubOnlyMatch[2].trim().replace(/\s*\d+\s*[-–:]\s*\d+.*$/, '').trim();
    const clubAResult = findClubMatch(clubAName, aliasLookup, contextClubIds);
    const clubBResult = findClubMatch(clubBName, aliasLookup, contextClubIds);
    if (clubAResult) clubA = allClubs.find(c => c.id === clubAResult.clubId) ?? null;
    if (clubBResult) clubB = allClubs.find(c => c.id === clubBResult.clubId) ?? null;

    // Club-only mode: if no pair was identified from player names, infer from club context
    if (!pairMatch && clubA && clubB && pairs.length === 2) {
      // Check which pool each club belongs to
      const pool0Ids = new Set(availableClubs.slice(0, Math.ceil(availableClubs.length / 2)).map(c => c.id));
      // Simplified: just mark as inferred, user can fix in confirmation
      if (!carryContext.lastPairA) {
        warnings.push('זוהו קבוצות בלבד - בדקו התאמה לזוגות');
      }
    }
  }

  // If we didn't find clubs through patterns, try scanning the whole segment
  if (!clubA || !clubB) {
    const foundClubs = findAllClubsInText(segment, aliasLookup, contextClubIds, allClubs);
    if (!clubA && foundClubs.length > 0) clubA = foundClubs[0];
    if (!clubB && foundClubs.length > 1) clubB = foundClubs[1];
    if (foundClubs.length === 1 && clubA && !clubB) {
      warnings.push('זוהתה רק קבוצה אחת');
    }
  }

  if (!clubA) warnings.push('לא זוהתה קבוצת הזוג הראשון');
  if (!clubB) warnings.push('לא זוהתה קבוצת היריב');

  // Check if clubs are in the current round context
  if (clubA && !contextClubIds.has(clubA.id)) {
    warnings.push(`${clubA.name} לא נמצאת במאגר הסיבוב הנוכחי`);
    confidence *= 0.6;
  }
  if (clubB && !contextClubIds.has(clubB.id)) {
    warnings.push(`${clubB.name} לא נמצאת במאגר הסיבוב הנוכחי`);
    confidence *= 0.6;
  }

  return {
    id: crypto.randomUUID(),
    pairAPlayers: pairA ? pairA.players.map(p => p.name).join(' + ') : '?',
    pairBPlayers: pairB ? pairB.players.map(p => p.name).join(' + ') : '?',
    pairAClub: clubA,
    pairBClub: clubB,
    scoreA,
    scoreB,
    winnerSide,
    transcriptFragment: segment,
    confidence,
    warnings,
    pairAId: pairA?.id,
    pairBId: pairB?.id,
  };
}

/**
 * Scan text for all recognizable club names, returning them in order of appearance.
 */
function findAllClubsInText(
  text: string,
  aliasLookup: Map<string, string>,
  contextClubIds: Set<string>,
  allClubs: Club[]
): Club[] {
  const normalized = normalizeForMatch(text);
  const found: { club: Club; position: number; aliasLength: number }[] = [];
  const seenIds = new Set<string>();

  // Sort aliases by length (longer first) for greedy matching
  const sortedAliases = Array.from(aliasLookup.entries())
    .sort((a, b) => b[0].length - a[0].length);

  for (const [alias, clubId] of sortedAliases) {
    if (seenIds.has(clubId)) continue;
    if (alias.length < 2) continue;
    const pos = normalized.indexOf(alias);
    if (pos >= 0) {
      const club = allClubs.find(c => c.id === clubId);
      if (club) {
        found.push({ club, position: pos, aliasLength: alias.length });
        seenIds.add(clubId);
      }
    }
  }

  // Sort by position in text
  found.sort((a, b) => a.position - b.position);
  return found.map(f => f.club);
}
