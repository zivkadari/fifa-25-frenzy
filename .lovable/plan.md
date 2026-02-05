
## Tier Question Pick Mode - Couples Tournament

### Overview

This mode adds a skill-based team selection layer on top of the existing Couples Tournament. Instead of fully random team assignment, couples compete in numeric football trivia questions to earn a team choice advantage per star tier. All existing tournament logic (pairing, rounds, scoring, fairness rules) remains unchanged.

---

### Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        New Mode Integration Point                            │
│                                                                              │
│  TournamentTypeSelection                                                     │
│       └── "Pairs Tournament" selected                                        │
│            └── EveningSetup (players + winsToComplete)                       │
│                 └── NEW: PairsGameModeSelection                              │
│                      ├── "Random Mode" → existing flow                       │
│                      └── "Tier Question Mode" → NEW flow                     │
│                           └── TierQuestionRound (per round)                  │
│                                └── For each tier (5★, 4.5★, 4★):             │
│                                     ├── Show available teams                 │
│                                     ├── Display question                     │
│                                     ├── Both couples guess                   │
│                                     ├── Reveal answer + winner               │
│                                     ├── Winner picks team                    │
│                                     └── System assigns remaining             │
│                                └── Proceed to match play                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Data Model Changes

#### New Type: `TriviaQuestion`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique question ID |
| `question_text` | `string` | The question to display |
| `correct_answer` | `number` | The correct numeric answer |
| `min_value` | `number` | Minimum allowed guess |
| `max_value` | `number` | Maximum allowed guess |
| `category` | `'world' \| 'israel'` | Question category |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | Difficulty level |
| `source` | `string` | Source attribution |

#### Extended Types in `tournament.ts`

```typescript
// Add to Evening interface
interface Evening {
  // ... existing fields ...
  teamSelectionMode?: 'random' | 'tier-question';
  tierQuestionState?: TierQuestionRoundState;
}

interface TierQuestionRoundState {
  currentTier: number; // 5, 4.5, or 4
  tiersCompleted: number[];
  pairTeamChoices: { [pairId: string]: string[] }; // Club IDs chosen by each pair
  usedQuestionIds: number[];
}
```

---

### New Files to Create

| File | Purpose |
|------|---------|
| `src/data/triviaQuestions.ts` | Static question bank (55 questions provided) |
| `src/components/PairsGameModeSelection.tsx` | Mode selection after player setup |
| `src/components/TierQuestionFlow.tsx` | Main question flow controller per round |
| `src/components/TierQuestionPhase.tsx` | Single tier question UI (question + input + reveal) |
| `src/components/TeamPickerModal.tsx` | UI for winner to select their team |

---

### Detailed Component Design

#### 1. `src/data/triviaQuestions.ts`

```typescript
export interface TriviaQuestion {
  id: number;
  question_text: string;
  correct_answer: number;
  min_value: number;
  max_value: number;
  category: 'world' | 'israel';
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { id: 1, question_text: "How many total goals were scored...", ... },
  // All 55 questions from provided table
];

export function getRandomQuestion(usedIds: number[]): TriviaQuestion | null {
  const available = TRIVIA_QUESTIONS.filter(q => !usedIds.includes(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
```

#### 2. `src/components/PairsGameModeSelection.tsx`

New component shown after `EveningSetup` completes:

- Card: "Random Mode" - existing flow
- Card: "Tier Question Mode" - new flow with trivia competition

#### 3. `src/components/TierQuestionFlow.tsx`

This component orchestrates the per-round tier question flow:

**State Machine:**
```text
IDLE → SHOW_TIER_TEAMS → DISPLAY_QUESTION → COLLECT_GUESSES → 
REVEAL_ANSWER → TEAM_SELECTION → (next tier or COMPLETE)
```

**Per-tier process:**
1. Display all eligible teams in current tier
2. Show question from random pool
3. Each couple submits a numeric guess (slider + input)
4. Calculate distances, determine winner
5. If tie: ask another question (repeat until winner)
6. Winner selects one team
7. System auto-assigns remaining teams to balance pools
8. Proceed to next tier

#### 4. `src/components/TierQuestionPhase.tsx`

Single tier question UI:

| Section | Content |
|---------|---------|
| Header | "שלב 5 כוכבים" (or 4.5, 4) |
| Teams List | Available teams in this tier (compact cards) |
| Question Card | Question text + source |
| Input Area | Two sliders/inputs for each couple |
| Submit Button | "גמרנו לנחש" |
| Result Area | Correct answer, distances, winner announcement |
| Team Picker | Winner picks their team |

#### 5. Team Assignment Logic

After winner picks one team:

```typescript
function assignRemainingTeams(
  tier: number,
  availableTeams: Club[],
  chosenTeamId: string,
  winnerPairId: string,
  loserPairId: string,
  existingPools: [Club[], Club[]]
): [Club[], Club[]] {
  // Winner gets the chosen team
  // Remaining teams distributed to balance:
  // 1. Same number of teams per pair
  // 2. Same total star rating per pair
  // This uses existing TeamSelector balancing logic
}
```

---

### Flow Integration

#### Modified `Index.tsx` Flow:

```text
'setup' → 'pairs-mode-selection' → 'tier-question-round' → 'game'
                                         ↑
                                  (repeats per round)
```

#### Modified `TournamentGame.tsx`:

When `evening.teamSelectionMode === 'tier-question'`:
- Before generating random pools, redirect to TierQuestionFlow
- TierQuestionFlow returns the team assignments
- Then proceed to normal match play

---

### UI/UX Flow (Hebrew)

**שלב 1: בחירת מצב**
```text
┌──────────────────────────────────┐
│      בחירת מצב בחירת קבוצות       │
├──────────────────────────────────┤
│  🎲 רנדומלי                      │
│     המערכת בוחרת קבוצות           │
├──────────────────────────────────┤
│  ❓ שאלות טריוויה                 │
│     ענו על שאלות כדי לבחור קבוצות  │
└──────────────────────────────────┘
```

**שלב 2: שלב שאלות (לכל טייר)**
```text
┌──────────────────────────────────┐
│  ⭐⭐⭐⭐⭐ קבוצות 5 כוכבים         │
├──────────────────────────────────┤
│  Real Madrid  │  Barcelona       │
│  Bayern       │  Man City        │
├──────────────────────────────────┤
│  📋 שאלה:                        │
│  כמה גולים הבקיע מסי בקריירה?     │
│                                  │
│  טווח: 750 - 900                 │
├──────────────────────────────────┤
│  זוג 1 (אלי + דני):    [  812  ] │
│  זוג 2 (נועם + עמית):  [  845  ] │
├──────────────────────────────────┤
│         [ שלחו תשובות ]           │
└──────────────────────────────────┘
```

**שלב 3: חשיפת תשובה**
```text
┌──────────────────────────────────┐
│  ✅ התשובה הנכונה: 821            │
├──────────────────────────────────┤
│  זוג 1: 812 (מרחק: 9) 🏆         │
│  זוג 2: 845 (מרחק: 24)           │
├──────────────────────────────────┤
│  🎉 זוג 1 זכו! בחרו קבוצה אחת:    │
│                                  │
│  [Real Madrid] [Barcelona]       │
│  [Bayern] [Man City]             │
└──────────────────────────────────┘
```

**שלב 4: סיכום חלוקה**
```text
┌──────────────────────────────────┐
│  ✅ חלוקת קבוצות 5 כוכבים:        │
├──────────────────────────────────┤
│  זוג 1: Real Madrid ⭐, Bayern    │
│  זוג 2: Barcelona, Man City      │
├──────────────────────────────────┤
│       [ המשך ל-4.5 כוכבים ]       │
└──────────────────────────────────┘
```

---

### Technical Implementation Details

#### Tier Order (based on winsToComplete)

| `winsToComplete` | Tiers Order | Teams per tier |
|------------------|-------------|----------------|
| 4 | 5★ → 4.5★ → 4★ | 2, 3, 2 |
| 5 | Prime → 5★ → 4.5★ → 4★ | 1, 3, 3, 2 |
| 6 | 5★ → 4.5★ → 4★ | 3, 4, 4 |

#### Tiebreaker Logic

```typescript
async function runTiebreaker(
  usedQuestionIds: number[]
): Promise<{ winnerPairId: string; newUsedIds: number[] }> {
  let attempts = 0;
  while (attempts < 10) {
    const question = getRandomQuestion(usedQuestionIds);
    if (!question) throw new Error("No questions left");
    
    // Collect guesses
    const guess1 = await collectGuess(pair1);
    const guess2 = await collectGuess(pair2);
    
    const dist1 = Math.abs(guess1 - question.correct_answer);
    const dist2 = Math.abs(guess2 - question.correct_answer);
    
    usedQuestionIds.push(question.id);
    
    if (dist1 < dist2) return { winnerPairId: pair1.id, newUsedIds: usedQuestionIds };
    if (dist2 < dist1) return { winnerPairId: pair2.id, newUsedIds: usedQuestionIds };
    
    // Still tied, continue
    attempts++;
  }
  // Ultimate fallback (extremely unlikely): random winner
  return { winnerPairId: Math.random() > 0.5 ? pair1.id : pair2.id, newUsedIds: usedQuestionIds };
}
```

#### Persisting State for Resume

The `tierQuestionState` in Evening allows resuming mid-flow:

```typescript
const handleTierComplete = (tierResult: TierResult) => {
  const updatedEvening = {
    ...evening,
    tierQuestionState: {
      ...evening.tierQuestionState,
      currentTier: nextTier,
      tiersCompleted: [...tiersCompleted, currentTier],
      pairTeamChoices: updatedChoices,
      usedQuestionIds: [...usedQuestionIds, ...newlyUsedIds],
    }
  };
  onUpdateEvening(updatedEvening);
};
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/data/triviaQuestions.ts` | CREATE - 55 questions bank |
| `src/types/tournament.ts` | MODIFY - Add new interfaces |
| `src/components/PairsGameModeSelection.tsx` | CREATE - Mode selection UI |
| `src/components/TierQuestionFlow.tsx` | CREATE - Flow orchestrator |
| `src/components/TierQuestionPhase.tsx` | CREATE - Single tier UI |
| `src/components/TeamPickerModal.tsx` | CREATE - Team picker UI |
| `src/pages/Index.tsx` | MODIFY - Add new app states |
| `src/components/TournamentGame.tsx` | MODIFY - Integrate tier question mode |
| `src/services/teamSelector.ts` | MODIFY - Add team distribution after pick |

---

### Implementation Order

1. Create `triviaQuestions.ts` with all 55 questions
2. Extend types in `tournament.ts`
3. Create `PairsGameModeSelection.tsx`
4. Create `TierQuestionPhase.tsx` (core UI)
5. Create `TeamPickerModal.tsx`
6. Create `TierQuestionFlow.tsx` (orchestrator)
7. Modify `Index.tsx` to add new states
8. Integrate with `TournamentGame.tsx`
9. Add resume capability for mid-flow state
