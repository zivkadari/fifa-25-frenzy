

## תיקון: הצגת כוכבים מעודכנים בטורניר

### הבעיה שזוהתה

בצילומי המסך רואים שבנפיקה מופיעה עם 4 כוכבים בטורניר, אבל ב-Admin עדכנת אותה ל-4.5 כוכבים.

הסיבה: כשקבוצות נשמרות ב-`teamPools` או `playerClubs`, הן נשמרות **עם הכוכבים שהיו להן באותו רגע**. התצוגה ב-UI משתמשת ב-`club.stars` ישירות במקום לבדוק את הערך העדכני מהדאטאבייס.

**מיקום הבעיה בקוד:**
- שורה 904: `${selectedClub.stars}★`
- שורה 937: `${club.stars}★`

---

### הפתרון

ליצור פונקציית `getDisplayStars(club)` שמחפשת את הכוכבים העדכניים מה-`clubsWithOverrides`:

```typescript
const getDisplayStars = (club: Club): number => {
  const override = clubsWithOverrides.find(c => c.id === club.id);
  return override?.stars ?? club.stars;
};
```

---

### שינויים לביצוע

#### 1. `src/components/TournamentGame.tsx`

הוספת הפונקציה ושימוש בה בכל המקומות שמציגים כוכבים:

| שורה | לפני | אחרי |
|------|------|------|
| 904 | `${selectedClub.stars}★` | `${getDisplayStars(selectedClub)}★` |
| 937 | `${club.stars}★` | `${getDisplayStars(club)}★` |

#### 2. `src/components/SinglesClubAssignment.tsx`

- להוסיף prop של `clubsWithOverrides`
- ליצור פונקציית `getDisplayStars`
- לעדכן תצוגת הכוכבים

#### 3. `src/components/SinglesGameLive.tsx`

- להוסיף prop של `clubsWithOverrides`
- ליצור פונקציית `getDisplayStars`
- לעדכן תצוגת הכוכבים (שורות 297-299, 352-354)

#### 4. `src/components/ClubSwapDialog.tsx`

- להוסיף prop של `clubsWithOverrides`
- לעדכן תצוגת הכוכבים בדיאלוג

#### 5. `src/pages/Index.tsx`

- להעביר `clubsWithOverrides` כ-prop לכל הקומפוננטות הרלוונטיות

---

### זרימת נתונים לאחר התיקון

```text
Tournament State (saved data)
    club = { id: 'benfica', stars: 4, ... }
                  │
                  ▼
         getDisplayStars(club)
                  │
    ┌─────────────┴─────────────┐
    │  Search in clubsWithOverrides  │
    │  for club.id === 'benfica'     │
    └─────────────┬─────────────┘
                  │
    Found: { id: 'benfica', stars: 4.5 }
                  │
                  ▼
         Display: "SL Benfica 4.5★"
```

---

### סיכום

| קובץ | פעולה |
|------|-------|
| `src/components/TournamentGame.tsx` | הוספת `getDisplayStars()` ושימוש בה |
| `src/components/SinglesClubAssignment.tsx` | הוספת prop + `getDisplayStars()` |
| `src/components/SinglesGameLive.tsx` | הוספת prop + `getDisplayStars()` |
| `src/components/ClubSwapDialog.tsx` | הוספת prop + `getDisplayStars()` |
| `src/pages/Index.tsx` | העברת `clubsWithOverrides` לקומפוננטות |

אחרי התיקון, שינויי כוכבים ב-Admin יופיעו מיד גם בטורנירים קיימים!

