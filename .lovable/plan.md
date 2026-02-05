

## תיקון באג: מערכת נתקעת אחרי בחירת קבוצה במצב טריוויה

### הבעיה

במצב "Tier Question Pick", אחרי שזוג עונה על שאלה ובוחר קבוצה, המערכת נתקעת. הסיבה היא באג בלוגיקה של `TierQuestionFlow.tsx`:

**שורש הבעיה:**
```typescript
// בזמן הרינדור - מחושב availableTeams עם shuffle
const availableTeams = getTeamsForTier(currentTierIndex);
// הרשימה הזו מועברת ל-TierQuestionPhase

// כשהמשתמש בוחר קבוצה, נקראת handleTierComplete
const handleTierComplete = (result) => {
  // מחושב שוב availableTeams - עם shuffle חדש!
  const availableTeams = getTeamsForTier(currentTierIndex);
  // הקבוצה שנבחרה לא קיימת ברשימה החדשה!
  const chosenClub = availableTeams.find(c => c.id === result.chosenClubId);
  // chosenClub = undefined → המערכת נשברת
}
```

הפונקציה `getTeamsForTier` מבצעת `shuffle` חדש בכל קריאה, כך שהרשימה שהמשתמש ראה שונה מהרשימה שמחושבת כשהוא שולח את הבחירה.

---

### הפתרון

לשמור את `availableTeams` ב-state כדי שיהיה עקבי לאורך כל השלב:

1. להוסיף state לשמירת הקבוצות הזמינות לטייר הנוכחי
2. לחשב את הקבוצות פעם אחת כשעוברים לטייר חדש
3. להשתמש בערך השמור במקום לחשב מחדש

---

### שינויים נדרשים

#### קובץ: `src/components/TierQuestionFlow.tsx`

**1. הוספת state לקבוצות הטייר הנוכחי:**

```typescript
const [currentTierTeams, setCurrentTierTeams] = useState<Club[]>([]);
```

**2. עדכון ה-useEffect לחשב קבוצות פעם אחת:**

```typescript
useEffect(() => {
  if (currentTierIndex < tierConfig.length) {
    // חשב קבוצות זמינות פעם אחת לטייר הנוכחי
    const teams = getTeamsForTier(currentTierIndex);
    setCurrentTierTeams(teams);
    
    // חשב שאלה חדשה
    if (!currentQuestion) {
      const question = getRandomQuestion(usedQuestionIds);
      if (question) {
        setCurrentQuestion(question);
        setUsedQuestionIds(prev => [...prev, question.id]);
      }
    }
  }
}, [currentTierIndex]);
```

**3. עדכון handleTierComplete להשתמש ב-state השמור:**

```typescript
const handleTierComplete = (result) => {
  const tier = tierConfig[currentTierIndex];
  // שימוש ב-currentTierTeams במקום לחשב מחדש
  const chosenClub = currentTierTeams.find(c => c.id === result.chosenClubId);
  
  if (!chosenClub) {
    console.error('Selected club not found in available teams');
    return;
  }
  
  const remainingTeams = currentTierTeams.filter(c => c.id !== result.chosenClubId);
  // ... המשך הלוגיקה
};
```

**4. עדכון המעבר לטייר הבא:**

```typescript
// בסוף handleTierComplete, כשעוברים לטייר הבא:
setCurrentTierIndex(currentTierIndex + 1);
setCurrentQuestion(null);
setCurrentTierTeams([]); // אפס כדי לחשב מחדש בטייר הבא
setIsTiebreaker(false);
```

**5. עדכון הרינדור להשתמש ב-state:**

```typescript
// במקום:
const availableTeams = getTeamsForTier(currentTierIndex);

// להשתמש ב:
// currentTierTeams כבר מחושב ושמור ב-state
```

---

### סיכום השינויים

| קובץ | שינוי |
|------|-------|
| `src/components/TierQuestionFlow.tsx` | הוספת `currentTierTeams` state |
| | עדכון useEffect לחשב קבוצות פעם אחת |
| | עדכון `handleTierComplete` להשתמש ב-state |
| | עדכון הרינדור להשתמש ב-`currentTierTeams` |

---

### לפני ואחרי

**לפני (באג):**
```text
רינדור → shuffle → [A, B, C, D]
משתמש בוחר A
handleTierComplete → shuffle חדש → [C, A, D, B]
חיפוש A → מוצא אבל במיקום שונה או לא מוצא
→ לוגיקת חלוקה נשברת
```

**אחרי (תיקון):**
```text
רינדור → shuffle → שמירה ב-state → [A, B, C, D]
משתמש בוחר A
handleTierComplete → קריאה מ-state → [A, B, C, D]
חיפוש A → מוצא!
→ לוגיקת חלוקה עובדת
```

