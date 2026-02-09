

## מימוש מלא: דף הגדרת הרכב קבוצות + תיקון חזרה לטורניר

הטבלה `pairs_pool_config` כבר קיימת בדאטאבייס עם הנתונים הנכונים, אבל כל קבצי הקוד חסרים. צריך ליצור/לעדכן את הקבצים הבאים:

---

### 1. יצירת `src/data/poolConfig.ts`

קובץ עזר לטעינה ו-cache של הגדרות הרכב הקבוצות מ-Supabase:
- פונקציה `fetchPoolConfigs()` שקוראת מטבלת `pairs_pool_config`
- Cache מקומי למניעת קריאות מיותרות
- Fallback לברירות מחדל אם אין חיבור

---

### 2. יצירת `src/pages/AdminPoolConfig.tsx`

דף ניהול עם 3 כרטיסים (4/5/6 ניצחונות). בכל כרטיס:
- שורות עם דירוג כוכבים (5, 4.5, 4) + כמות (מספר)
- Toggle ל-Prime ולנבחרות
- ולידציה: סך הכל = מקסימום משחקים (7/9/11)
- כפתור שמירה שכותב ל-DB

---

### 3. עדכון `src/App.tsx`

הוספת route:
```
<Route path="/admin/pool-config" element={<AdminPoolConfig />} />
```

---

### 4. עדכון `src/components/TournamentHome.tsx`

הוספת כפתור אדמין נוסף (רק ל-`zivkad12@gmail.com`):
```
<Link to="/admin/pool-config">הגדרת הרכב קבוצות (Admin)</Link>
```

---

### 5. עדכון `src/services/teamSelector.ts`

הוספת פונקציה חדשה `generateTeamPoolsFromConfig(pairs, config, excludeClubIds)` שמשתמשת בהגדרה הדינמית מהDB במקום הערכים הקבועים.

---

### 6. תיקון `src/components/TournamentGame.tsx` (שורה 144)

שינוי מ:
```typescript
loadCurrentRound();
```
ל:
```typescript
const activeRoundIndex = currentEvening.rounds.findIndex(r => !r.completed);
const targetIndex = activeRoundIndex >= 0 ? activeRoundIndex : currentEvening.rounds.length - 1;
setCurrentRound(targetIndex);
loadCurrentRound(targetIndex);
```

---

### סיכום

| קובץ | פעולה |
|------|-------|
| `src/data/poolConfig.ts` | יצירה חדשה |
| `src/pages/AdminPoolConfig.tsx` | יצירה חדשה |
| `src/App.tsx` | הוספת route |
| `src/components/TournamentHome.tsx` | הוספת לינק אדמין |
| `src/services/teamSelector.ts` | הוספת `generateTeamPoolsFromConfig` |
| `src/components/TournamentGame.tsx` | תיקון אתחול סבב נוכחי |

