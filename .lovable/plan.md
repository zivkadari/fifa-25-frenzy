
## תיקון: Race Condition בטעינת Club Overrides

### הבעיה שזיהיתי

יש **race condition** בקוד. הסיבוב הראשון מתחיל עם נתונים סטטיים לפני שה-overrides נטענים מהדאטאבייס.

**המצב הנוכחי:**

```typescript
// שורה 89 - State מאותחל עם הנתונים הסטטיים
const [clubsWithOverrides, setClubsWithOverrides] = useState<Club[]>(FIFA_CLUBS);

// שורה 130-132 - טוען overrides מהדאטאבייס (async)
useEffect(() => {
  getClubsWithOverrides().then(setClubsWithOverrides);
}, []);

// שורה 134-142 - מתחיל סיבוב ראשון כשיש שינוי ב-clubsWithOverrides
useEffect(() => {
  if (clubsWithOverrides.length === 0) return;  // ❌ הבעיה!
  if (currentEvening.rounds.length === 0) {
    startNextRound(0);  // ❌ נקרא עם FIFA_CLUBS לפני שה-overrides הגיעו!
  }
}, [clubsWithOverrides]);
```

**למה זה לא עובד:**
1. `clubsWithOverrides` מאותחל ל-`FIFA_CLUBS` (118 קבוצות - לא ריק!)
2. הבדיקה `clubsWithOverrides.length === 0` מחזירה `false` מיידית
3. `startNextRound(0)` נקרא עם הנתונים הסטטיים
4. רק אחר כך ה-overrides נטענים - אבל כבר מאוחר מדי!

---

### הפתרון

להוסיף flag `overridesLoaded` שמציין שה-overrides נטענו בהצלחה:

```typescript
// הוספת state חדש
const [overridesLoaded, setOverridesLoaded] = useState(false);

// עדכון ה-useEffect שטוען overrides
useEffect(() => {
  getClubsWithOverrides().then(clubs => {
    setClubsWithOverrides(clubs);
    setOverridesLoaded(true);  // מסמן שהטעינה הסתיימה
  });
}, []);

// עדכון ה-useEffect שמתחיל את הסיבוב הראשון
useEffect(() => {
  if (!overridesLoaded) return;  // ✅ ממתין לטעינה אמיתית
  if (currentEvening.rounds.length === 0) {
    startNextRound(0);
  } else {
    loadCurrentRound();
  }
}, [overridesLoaded]);
```

---

### שינויים לביצוע

#### קובץ: `src/components/TournamentGame.tsx`

| שורה | שינוי |
|------|-------|
| 89 | הוספת `const [overridesLoaded, setOverridesLoaded] = useState(false);` |
| 130-132 | עדכון ה-useEffect לסמן `setOverridesLoaded(true)` אחרי הטעינה |
| 134-142 | שינוי התנאי מ-`clubsWithOverrides.length === 0` ל-`!overridesLoaded` |

---

### זרימת נתונים לאחר התיקון

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Component Mount                              │
│  clubsWithOverrides = FIFA_CLUBS (default)                      │
│  overridesLoaded = false                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 useEffect: Load Overrides                        │
│  getClubsWithOverrides() → async...                             │
│  (לוקח כמה מילישניות)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 useEffect: Start Round                           │
│  if (!overridesLoaded) return;  ← ✅ ממתין!                      │
└─────────────────────────────────────────────────────────────────┘
                              │
         (Async completes)    │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              setClubsWithOverrides(updatedClubs)                │
│              setOverridesLoaded(true)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 useEffect: Start Round (re-runs)                 │
│  overridesLoaded = true ✅                                       │
│  startNextRound(0) ← עכשיו עם הנתונים המעודכנים!                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### סיכום

| קובץ | פעולה |
|------|-------|
| `src/components/TournamentGame.tsx` | הוספת flag `overridesLoaded` והמתנה לו לפני התחלת סיבוב |

אחרי התיקון, הקבוצות יסוננו נכון לפי הכוכבים המעודכנים מהדאטאבייס:
- לברקוזן (4.5★) תופיע בקטגוריית 4.5 ולא 4
- בנפיקה (4.5★) תופיע בקטגוריית 4.5 ולא 4
