

## תיקון: חיבור ה-Overrides לטורניר

### הבעיה

כרגע ה-`TeamSelector` משתמש בפונקציות שמחזירות נתונים סטטיים מ-`FIFA_CLUBS`:
- `getClubsByStars(5)` - מחזיר קבוצות עם 5 כוכבים לפי הנתון הסטטי
- `getClubsOnly(4.5)` - אותו דבר
- וכו'

השינויים שאתה עושה ב-Admin נשמרים בדאטאבייס, אבל ה-`TeamSelector` לא קורא אותם!

---

### הפתרון

לעדכן את `clubs.ts` כך שהפונקציות הקיימות (`getClubsByStars`, `getClubsOnly`, וכו') יתמכו בקבלת רשימת קבוצות כפרמטר. ואז ב-`TeamSelector` לטעון את הקבוצות עם ה-overrides פעם אחת בתחילת הטורניר ולהעביר אותן לפונקציות.

---

### שינויים בקבצים

#### 1. `src/data/clubs.ts`

עדכון הפונקציות להיות יותר גמישות:

```typescript
// הפונקציה הקיימת - עכשיו עם פרמטר אופציונלי
export const getClubsByStars = (stars: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.stars === stars);
};

export const getNationalTeams = (clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.isNational);
};

export const getClubsOnly = (stars?: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => 
    !club.isNational && 
    club.league !== 'Prime' && 
    (stars === undefined || club.stars === stars)
  );
};

export const getNationalTeamsByStars = (stars: number, clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.isNational && club.stars === stars);
};

export const getPrimeTeams = (clubs: Club[] = FIFA_CLUBS): Club[] => {
  return clubs.filter(club => club.league === 'Prime');
};
```

#### 2. `src/services/teamSelector.ts`

עדכון ה-constructor לקבל רשימת קבוצות:

```typescript
export class TeamSelector {
  private clubs: Club[];

  constructor(clubs: Club[] = FIFA_CLUBS) {
    this.clubs = clubs;
  }

  generateTeamPoolsFor4Rounds(pairs: Pair[], excludeClubIds: string[] = []): TeamPoolResult {
    // שימוש ב-this.clubs במקום FIFA_CLUBS
    const fiveStarPool = [...getClubsOnly(5, this.clubs), ...getNationalTeamsByStars(5, this.clubs)];
    // ...
  }
  // ... כל הפונקציות האחרות
}
```

#### 3. `src/pages/Index.tsx` או רכיב הטורניר הראשי

טעינת הקבוצות עם overrides בתחילת הטורניר:

```typescript
import { getClubsWithOverrides } from '@/data/clubs';

// בתוך הקומפוננטה
const [clubs, setClubs] = useState<Club[]>([]);

useEffect(() => {
  getClubsWithOverrides().then(setClubs);
}, []);

// יצירת TeamSelector עם הקבוצות המעודכנות
const teamSelector = new TeamSelector(clubs);
```

---

### זרימת נתונים לאחר התיקון

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Page                                │
│  שינוי כוכבים → שמירה ל-club_overrides → invalidateCache        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      getClubsWithOverrides()                     │
│  FIFA_CLUBS (סטטי) + club_overrides (DB) = רשימה מעודכנת        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   new TeamSelector(clubs)                        │
│  השתמש ברשימה המעודכנת לבחירת קבוצות                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Tournament                                │
│  קבוצות עם הכוכבים המעודכנים מופיעות במשחק                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### סיכום השינויים

| קובץ | פעולה |
|------|-------|
| `src/data/clubs.ts` | עדכון פונקציות לקבל `clubs` כפרמטר אופציונלי |
| `src/services/teamSelector.ts` | הוספת `clubs` ל-constructor ושימוש בו |
| `src/pages/Index.tsx` | טעינת קבוצות עם overrides ויצירת `TeamSelector` |

