
# שינוי מגבלת הופעות קבוצות לפי דירוג כוכבים

## מה משתנה
כרגע כל הקבוצות (5★, 4.5★, 4★) חולקות את אותה מגבלת הופעות (`maxAppearances`). צריך לשנות כך ש:
- **5★**: מותר עד 2 הופעות (כמו היום)
- **4.5★**: מותר הופעה אחת בלבד
- **4★**: מותר הופעה אחת בלבד

## מה זה אומר מבחינת כמויות
- 10 זוגות × 2 קבוצות per tier = 20 slots per tier
- 5★ עם max 2 → צריך לפחות 10 קבוצות ייחודיות
- 4.5★ עם max 1 → צריך לפחות 20 קבוצות ייחודיות
- 4★ עם max 1 → צריך לפחות 20 קבוצות ייחודיות

## שינויים טכניים

### `src/services/fivePlayerEngine.ts` — `generateTeamBanks`
1. שינוי מבנה ה-tiers כך שכל tier יכלול את ה-`maxAppearances` שלו:
   - `{ pool: clubs5, countPerPair: 2, maxForTier: maxAppearances }` (ברירת מחדל 2)
   - `{ pool: clubs45, countPerPair: 2, maxForTier: 1 }`
   - `{ pool: clubs4, countPerPair: 2, maxForTier: 1 }`
2. עדכון בדיקת ה-`minNeeded` לכל tier בנפרד לפי ה-max שלו
3. בלולאת ההקצאה, שימוש ב-`tier.maxForTier` במקום `maxAppearances` הגלובלי
4. ה-fallback (max 3) יחול רק על 5★; קבוצות 4/4.5 יישארו עם max 1

### `src/pages/Index.tsx` — Deadlock fallback dialog
- עדכון הטקסט/הסבר ב-dialog כך שיהיה ברור שההרחבה ל-3 הופעות חלה רק על 5★
