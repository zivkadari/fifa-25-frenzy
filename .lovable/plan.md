

## תיקון כפתור Toggle (Switch) - העיגול יוצא מהפס

### הבעיה
כשה-Toggle במצב פעיל (checked), העיגול (thumb) נראה כאילו הוא חורג מגבולות הפס (track). זה קורה בגלל שה-translate של העיגול במצב checked גדול מדי ביחס לרוחב הפס.

### הפתרון
עדכון `src/components/ui/switch.tsx`:
- הגדלת רוחב הפס מ-`w-11` (44px) ל-`w-12` (48px) כדי לתת יותר מרחב
- שינוי translate-x של ה-thumb כש-checked מ-`translate-x-5` ל-`translate-x-6` (24px) כדי שיתיישר יפה בתוך הפס הרחב יותר

### פרטים טכניים

**קובץ:** `src/components/ui/switch.tsx`

Track (Root) - שורה 12:
- שינוי: `w-11` → `w-12`

Thumb - שורה 20:
- שינוי: `data-[state=checked]:translate-x-5` → `data-[state=checked]:translate-x-6`

חישוב: רוחב פס = 48px, border = 4px, רוחב פנימי = 44px. עיגול = 20px + translate 24px = 44px. מתאים בדיוק.
