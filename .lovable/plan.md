

## שני תיקונים: ממשק שאלות וניהול קבוצות

### שינוי 1: הסרת טווח ומקור מממשק השאלות

**קובץ:** `src/components/TierQuestionPhase.tsx`

הסרת שתי שורות מהתצוגה:
- שורה 136-138: `<p className="text-xs...">מקור: {question.source}</p>`
- שורה 141-143: `<div className="text-center...">טווח: ...</div>`

---

### שינוי 2: תיקון מחיקת קבוצה ושינוי שם

**הבעיה:** הפוליסות של RLS בטבלת `teams` חוסמות DELETE ו-UPDATE לכולם:
```sql
Policy: "Teams: restrict delete" → qual: false  -- חוסם הכל!
Policy: "Teams: restrict updates" → qual: false -- חוסם הכל!
```

**הפתרון:** עדכון הפוליסות לאפשר רק לבעלים של הקבוצה:

```sql
-- מחיקת הפוליסות הישנות
DROP POLICY IF EXISTS "Teams: restrict delete" ON teams;
DROP POLICY IF EXISTS "Teams: restrict updates" ON teams;

-- פוליסה חדשה למחיקה - רק בעלים
CREATE POLICY "Teams: owner can delete"
ON teams FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- פוליסה חדשה לעדכון - רק בעלים
CREATE POLICY "Teams: owner can update"
ON teams FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
```

---

### שינוי 3: הוספת אפשרות לשנות שם קבוצה בממשק

**קובץ:** `src/components/TeamsManager.tsx`

הוספת:
1. State לעריכת שם קבוצה
2. כפתור עריכה ליד כל קבוצה
3. Dialog או inline input לשינוי השם
4. קריאה ל-`RemoteStorageService.renameTeam`

---

### סיכום הקבצים לשינוי

| קובץ | שינוי |
|------|-------|
| `src/components/TierQuestionPhase.tsx` | הסרת טווח ומקור מהתצוגה |
| `supabase/migrations/XXXX_fix_teams_rls.sql` | תיקון פוליסות RLS |
| `src/components/TeamsManager.tsx` | הוספת אפשרות עריכת שם |

