/**
 * Voice Result Parser
 * Parses Hebrew speech transcripts into structured match result candidates.
 */

import { Player, Pair, Club } from '@/types/tournament';
import { buildAliasLookup, findClubMatch, normalizeForMatch } from '@/lib/hebrewClubAliases';

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
const SPLIT_PATTERNS = /\s*(?:ואז|אחר כך|ואחר כך|אחרי זה|וגם|ו?אחרי)\s*/;

// Win/loss indicators
const WIN_WORDS = ['ניצחו', 'ניצח', 'ניצחה', 'גברו', 'גבר'];
const LOSS_WORDS = ['הפסידו', 'הפסיד', 'הפסידה'];

// Score patterns
const SCORE_REGEX_NUMERIC = /(\d+)\s*[-:]\s*(\d+)/;

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
 * Returns the pair whose player names best match the spoken text.
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
      if (normalized.includes(playerNorm)) {
        matchScore += 1;
      }
    }
    if (matchScore > 0 && (!bestMatch || matchScore > bestMatch.score)) {
      bestMatch = { pair, score: matchScore };
    }
  }

  if (bestMatch) {
    // Both players matched = high confidence, one player = medium
    const confidence = bestMatch.score >= 2 ? 0.95 : 0.6;
    return { pair: bestMatch.pair, confidence };
  }

  return null;
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

  // Build alias lookup
  const aliasLookup = buildAliasLookup(allClubs);
  const contextClubIds = new Set(availableClubs.map(c => c.id));

  // Split transcript into segments for multiple results
  const segments = transcript.split(SPLIT_PATTERNS).filter(s => s.trim());

  const candidates: VoiceResultCandidate[] = [];

  for (const segment of segments) {
    const candidate = parseSegment(segment.trim(), currentPairs, availableClubs, allClubs, aliasLookup, contextClubIds);
    candidates.push(candidate);
  }

  return candidates;
}

function parseSegment(
  segment: string,
  pairs: Pair[],
  availableClubs: Club[],
  allClubs: Club[],
  aliasLookup: Map<string, string>,
  contextClubIds: Set<string>
): VoiceResultCandidate {
  const warnings: string[] = [];
  let confidence = 0.5;

  // 1. Find the speaking pair (pair A = the pair that "won" or "lost")
  const pairMatch = findPairMatch(segment, pairs);
  let pairA: Pair | null = pairMatch?.pair ?? null;
  let pairB: Pair | null = null;

  if (pairA) {
    confidence = Math.max(confidence, pairMatch!.confidence);
    // Pair B is the other pair
    pairB = pairs.find(p => p.id !== pairA!.id) ?? null;
  } else {
    // If only two pairs in the round, try to infer
    if (pairs.length === 2) {
      warnings.push('לא זוהו שמות שחקנים, מנסה להתאים לזוג הנוכחי');
      pairA = pairs[0];
      pairB = pairs[1];
      confidence = 0.3;
    } else {
      warnings.push('לא זוהו שמות שחקנים');
    }
  }

  // 2. Determine win/loss direction
  let winnerSide: 'A' | 'B' | 'draw' | null = null;
  const segmentLower = segment;

  const hasWinWord = WIN_WORDS.some(w => segmentLower.includes(w));
  const hasLossWord = LOSS_WORDS.some(w => segmentLower.includes(w));

  if (hasWinWord && !hasLossWord) {
    winnerSide = 'A'; // The mentioned pair won
  } else if (hasLossWord && !hasWinWord) {
    winnerSide = 'B'; // The mentioned pair lost
  } else if (hasWinWord && hasLossWord) {
    // Both words present, use the first one
    const winIdx = Math.min(...WIN_WORDS.map(w => { const i = segmentLower.indexOf(w); return i >= 0 ? i : Infinity; }));
    const lossIdx = Math.min(...LOSS_WORDS.map(w => { const i = segmentLower.indexOf(w); return i >= 0 ? i : Infinity; }));
    winnerSide = winIdx < lossIdx ? 'A' : 'B';
  }

  // 3. Extract score
  const scoreResult = extractScore(segment);
  let scoreA = scoreResult?.scoreA ?? null;
  let scoreB = scoreResult?.scoreB ?? null;

  // If winner side is B (pair A lost), the higher score belongs to pair B
  if (winnerSide === 'B' && scoreA !== null && scoreB !== null && scoreA > scoreB) {
    // Swap: spoken score is from pair A's perspective but they lost, 
    // so the score as spoken is "lost X-Y" meaning opponent got X, pair A got Y
    // Actually in Hebrew "הפסידו 2-1" means they lost 2-1, so score is 1-2 from their perspective
    [scoreA, scoreB] = [scoreB, scoreA];
  }

  if (scoreA === null || scoreB === null) {
    warnings.push('לא זוהה ציון');
  }

  // Validate score vs winner
  if (scoreA !== null && scoreB !== null && winnerSide) {
    if (winnerSide === 'A' && scoreA <= scoreB) {
      warnings.push('ציון לא תואם לניצחון');
      confidence *= 0.5;
    }
    if (winnerSide === 'B' && scoreB <= scoreA) {
      warnings.push('ציון לא תואם להפסד');
      confidence *= 0.5;
    }
    if (scoreA === scoreB) {
      winnerSide = 'draw';
    }
  }

  // 4. Extract clubs
  // Look for club names in the segment - try to find two clubs
  // Common patterns: "עם X את/מול/נגד Y", "עם X ל-Y"
  let clubA: Club | null = null;
  let clubB: Club | null = null;

  // Try to find clubs using "עם" (with) for pair A's club
  const withPattern = /עם\s+(.+?)(?:\s+(?:את|מול|נגד|ל))\s+/;
  const withMatch = segment.match(withPattern);
  
  // Also try pattern: "עם X ל-Y SCORE" or "עם X נגד Y SCORE"
  const fullPattern = /עם\s+(.+?)\s+(?:את|מול|נגד|ל)\s*(.+?)(?:\s+\d|$)/;
  const fullMatch = segment.match(fullPattern);

  if (fullMatch) {
    const clubAName = fullMatch[1].trim();
    let clubBName = fullMatch[2].trim();
    // Remove trailing score if present
    clubBName = clubBName.replace(/\s*\d+\s*[-:]\s*\d+.*$/, '').trim();

    const clubAResult = findClubMatch(clubAName, aliasLookup, contextClubIds);
    const clubBResult = findClubMatch(clubBName, aliasLookup, contextClubIds);

    if (clubAResult) {
      clubA = allClubs.find(c => c.id === clubAResult.clubId) ?? availableClubs.find(c => c.id === clubAResult.clubId) ?? null;
      confidence = Math.min(confidence, clubAResult.confidence);
    }
    if (clubBResult) {
      clubB = allClubs.find(c => c.id === clubBResult.clubId) ?? availableClubs.find(c => c.id === clubBResult.clubId) ?? null;
      confidence = Math.min(confidence, clubBResult.confidence);
    }
  } else if (withMatch) {
    const clubAName = withMatch[1].trim();
    const clubAResult = findClubMatch(clubAName, aliasLookup, contextClubIds);
    if (clubAResult) {
      clubA = allClubs.find(c => c.id === clubAResult.clubId) ?? null;
    }
  }

  // If we didn't find clubs through patterns, try scanning the whole segment
  if (!clubA || !clubB) {
    const foundClubs = findAllClubsInText(segment, aliasLookup, contextClubIds, allClubs);
    if (!clubA && foundClubs.length > 0) clubA = foundClubs[0];
    if (!clubB && foundClubs.length > 1) clubB = foundClubs[1];
    if (foundClubs.length === 1 && clubA && !clubB) {
      // Only one club found
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
