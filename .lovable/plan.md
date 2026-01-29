

## מניעת שמירת טורנירים ריקים להיסטוריה

### הבעיה

בצילום המסך רואים טורנירים רבים עם "1 rounds" אבל ללא משחקים שהושלמו. אלה טורנירים שנסגרו לפני שבוצע אפילו משחק אחד, אבל עדיין נשמרו להיסטוריה וסטטיסטיקה.

---

### הפתרון

להוסיף פונקציית בדיקה `hasCompletedGames(evening)` ולמנוע שמירה אם אין משחקים שהושלמו:

**לוגיקת הבדיקה:**
- **טורניר זוגות**: בדוק אם יש לפחות משחק אחד עם `completed: true` ב-`rounds`
- **טורניר יחידים**: בדוק אם יש לפחות משחק אחד עם `completed: true` ב-`gameSequence`

---

### שינויים לביצוע

#### 1. `src/services/tournamentEngine.ts`

הוספת פונקציה סטטית חדשה:

```typescript
static hasCompletedGames(evening: Evening): boolean {
  if (evening.type === 'singles') {
    // Singles: check gameSequence
    return evening.gameSequence?.some(game => game.completed) ?? false;
  } else {
    // Pairs: check rounds → matches
    return evening.rounds.some(round => 
      round.matches.some(match => match.completed)
    );
  }
}
```

#### 2. `src/components/EveningSummary.tsx`

שינוי כפתור השמירה להיות מושבת אם אין משחקים:

| מיקום | שינוי |
|-------|-------|
| Import | הוספת `TournamentEngine` (כבר קיים) |
| לפני כפתור Save | בדיקת `hasCompletedGames` |
| כפתור Save | הוספת `disabled` + הודעה למשתמש |

קוד לדוגמא:

```tsx
const hasGames = TournamentEngine.hasCompletedGames(evening);

// בכפתור:
{!saved && (
  <Button
    variant="gaming"
    size="lg"
    onClick={handleSaveToHistory}
    disabled={!hasGames}
    className="w-full"
  >
    <Save className="h-4 w-4" />
    {hasGames ? "Save to History" : "No Games to Save"}
  </Button>
)}
```

---

### התנהגות לאחר התיקון

| מצב | תוצאה |
|-----|-------|
| טורניר עם משחקים | כפתור "Save to History" פעיל |
| טורניר ללא משחקים | כפתור מושבת עם טקסט "No Games to Save" |

---

### סיכום קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `src/services/tournamentEngine.ts` | הוספת `hasCompletedGames()` |
| `src/components/EveningSummary.tsx` | שימוש בפונקציה להשבתת כפתור |

