

## תיקון שני בעיות: חזרה לטורניר פעיל + הגדרת הרכב קבוצות (Admin)

---

### בעיה 1: חזרה לטורניר פעיל לא עובדת כמו שצריך

**שורש הבעיה:**

ב-`TournamentGame.tsx`, כשחוזרים לטורניר פעיל, ה-state של `currentRound` מאותחל ל-`0`:

```typescript
const [currentRound, setCurrentRound] = useState(0);
```

ואז ב-`useEffect` נקרא `loadCurrentRound()` ללא פרמטר, מה שטוען את סבב 0 במקום הסבב הנוכחי. אם הטורניר היה בסבב 2, הוא יטען את סבב 0 שכבר הושלם.

**הפתרון:**

בעת אתחול הקומפוננטה, לחפש את הסבב הפעיל (האחרון שלא הושלם) ולטעון אותו:

```typescript
// ב-useEffect של אתחול:
if (currentEvening.rounds.length > 0) {
  // מצא את הסבב הפעיל - האחרון שלא הושלם, או האחרון בכלל
  const activeRoundIndex = currentEvening.rounds.findIndex(r => !r.completed);
  const targetIndex = activeRoundIndex >= 0 
    ? activeRoundIndex 
    : currentEvening.rounds.length - 1;
  setCurrentRound(targetIndex);
  loadCurrentRound(targetIndex);
}
```

**קובץ:** `src/components/TournamentGame.tsx` - עדכון ה-useEffect באתחול (שורות 139-146)

---

### בעיה 2: הגדרת הרכב קבוצות לטורניר זוגות (Admin)

**מה נדרש:**

אפשרות לאדמין לקבוע כמה קבוצות מכל דירוג כוכבים יהיו בכל סוג טורניר (4/5/6 ניצחונות).

לדוגמה, עבור טורניר עד 4 ניצחונות (מקסימום 7 משחקים):
- ברירת מחדל: 2 x 5 כוכבים, 3 x 4.5 כוכבים, 2 x 4 כוכבים
- אפשר לשנות ל: 3 x 5 כוכבים, 2 x 4.5 כוכבים, 2 x 4 כוכבים

**מבנה טכני:**

#### 1. טבלת DB חדשה: `pairs_pool_config`

```sql
CREATE TABLE pairs_pool_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wins_to_complete integer NOT NULL UNIQUE,  -- 4, 5, or 6
  distribution jsonb NOT NULL,               -- [{stars: 5, count: 2}, {stars: 4.5, count: 3}, ...]
  include_prime boolean NOT NULL DEFAULT false,
  prime_count integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
```

דוגמה לערך `distribution`:
```json
[
  {"stars": 5, "count": 2, "include_national": true},
  {"stars": 4.5, "count": 3, "include_national": true},
  {"stars": 4, "count": 2, "include_national": false}
]
```

RLS: קריאה לכל authenticated, כתיבה רק לאדמין (דרך `is_clubs_admin`).

#### 2. דף אדמין חדש: `/admin/pool-config`

- הצגת 3 כרטיסים (אחד לכל סוג: 4/5/6 ניצחונות)
- בכל כרטיס: רשימת שורות עם דירוג כוכבים + כמות
- אפשר להוסיף/להסיר שורות ולשנות כמויות
- סך הכל = מקסימום משחקים (7/9/11)
- כפתור שמירה

#### 3. עדכון `TeamSelector` לקרוא מהגדרה דינמית

במקום hardcoded בפונקציות `generateTeamPoolsFor4Rounds`, `generateTeamPoolsFor5Rounds`, `generateTeamPoolsFor6Rounds`, הלוגיקה תקרא את ההגדרה מהדאטאבייס.

פונקציה חדשה `generateTeamPoolsFromConfig(pairs, config, excludeClubIds)` שמקבלת את ההגדרה ובונה את הפולים לפיה.

#### 4. טעינת ההגדרה

- ב-`Index.tsx` ו-`TournamentGame.tsx` - טעינת ההגדרה מ-Supabase בעת אתחול
- Cache מקומי (דומה ל-`getClubsWithOverrides`)
- Fallback לערכי ברירת מחדל אם אין הגדרה בDB

---

### סיכום קבצים לשינוי

| קובץ | שינוי |
|------|-------|
| `src/components/TournamentGame.tsx` | תיקון אתחול סבב נוכחי |
| `supabase/migrations/XXXX_pool_config.sql` | טבלת `pairs_pool_config` + RLS + defaults |
| `src/pages/AdminPoolConfig.tsx` | דף אדמין חדש להגדרת הרכב |
| `src/App.tsx` | הוספת route `/admin/pool-config` |
| `src/components/TournamentHome.tsx` | לינק לדף החדש (לאדמין בלבד) |
| `src/services/teamSelector.ts` | פונקציה חדשה `generateTeamPoolsFromConfig` |
| `src/data/poolConfig.ts` | קובץ עזר לטעינה + cache של ההגדרה |

---

### ברירות מחדל (יוכנסו ל-DB במיגרציה)

| ניצחונות | סה"כ | הרכב |
|----------|------|------|
| 4 | 7 | 2x5★, 3x4.5★, 2x4★ (ללא Prime) |
| 5 | 9 | 1 Prime, 3x5★, 3x4.5★, 2x4★ |
| 6 | 11 | 3x5★, 4x4.5★, 4x4★ (ללא Prime) |

