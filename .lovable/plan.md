

## תיקון: הצגת כוכבים מעודכנים בטורניר

### הבעיה שזוהתה

כשהקבוצות נשמרות בטורניר (`round.teamPools`), הן נשמרות **עם הכוכבים שהיו להן באותו רגע**. כשאתה מעדכן כוכבים ב-Admin, הקבוצות שכבר קיימות בטורניר לא מתעדכנות.

לדוגמא:
- בנפיקה הייתה 4 כוכבים כשהטורניר נוצר
- עדכנת אותה ל-4.5 ב-Admin
- הטורניר עדיין מציג 4 כוכבים כי זה מה שנשמר ב-`round.teamPools`

---

### הפתרון

ליצור פונקציית `getDisplayStars()` שמחפשת את הכוכבים העדכניים מה-`clubsWithOverrides` במקום להשתמש ב-`club.stars` ישירות.

---

### שינויים טכניים

#### 1. `src/components/TournamentGame.tsx`

הוספת פונקציית helper ושימוש בה בתצוגה:

```typescript
// Helper function to get current star rating from database overrides
const getDisplayStars = (club: Club): number => {
  const override = clubsWithOverrides.find(c => c.id === club.id);
  return override?.stars ?? club.stars;
};
```

עדכון כל המקומות שמציגים כוכבים:

| שורה | לפני | אחרי |
|------|------|------|
| ~904 | `selectedClub.stars` | `getDisplayStars(selectedClub)` |
| ~937 | `club.stars` | `getDisplayStars(club)` |

#### 2. `src/components/SinglesClubAssignment.tsx`

אותו תיקון - להעביר את `clubsWithOverrides` כ-prop ולהשתמש ב-`getDisplayStars`.

#### 3. `src/components/SinglesGameLive.tsx`

אותו תיקון - להעביר את `clubsWithOverrides` כ-prop ולהשתמש ב-`getDisplayStars`.

#### 4. `src/components/ClubSwapDialog.tsx`

אותו תיקון לתצוגת הכוכבים בדיאלוג ההחלפה.

---

### זרימת נתונים לאחר התיקון

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Tournament State                            │
│  round.teamPools = [{ id: 'benfica', stars: 4, ... }]           │
│                      (נשמר כשהטורניר נוצר)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      getDisplayStars(club)                       │
│  1. חפש את club.id ב-clubsWithOverrides                         │
│  2. אם נמצא → החזר stars מה-override                            │
│  3. אם לא נמצא → החזר club.stars המקורי                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        UI Display                                │
│  "SL Benfica 4.5★"  ← הכוכבים מה-override                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### יתרונות הפתרון

1. **שינויים ב-Admin מתעדכנים מיד** - גם בטורנירים קיימים
2. **לא דורש מיגרציה של נתונים** - הטורנירים הקיימים ממשיכים לעבוד
3. **הלוגיקה של בחירת קבוצות לא משתנה** - רק התצוגה מתעדכנת

---

### סיכום הקבצים לשינוי

| קובץ | פעולה |
|------|-------|
| `src/components/TournamentGame.tsx` | הוספת `getDisplayStars()` ושימוש בה |
| `src/components/SinglesClubAssignment.tsx` | הוספת prop + `getDisplayStars()` |
| `src/components/SinglesGameLive.tsx` | הוספת prop + `getDisplayStars()` |
| `src/components/ClubSwapDialog.tsx` | הוספת prop + `getDisplayStars()` |
| `src/pages/Index.tsx` | העברת `clubsWithOverrides` לקומפוננטות |

