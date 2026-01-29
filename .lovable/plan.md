

## תיקון: אפשור מחיקת טורנירים מההיסטוריה

### הבעיה

מדיניות RLS (Row Level Security) בטבלת `evenings` חוסמת מחיקה לחלוטין:

```sql
Policy Name: Evenings: restrict delete
Using Expression: false  -- חוסם כל מחיקות!
```

זה אומר שאף אחד - כולל הבעלים של הטורניר - לא יכול למחוק טורנירים מהדאטאבייס.

---

### הפתרון

ליצור מדיניות RLS חדשה שמאפשרת לבעלים של טורניר למחוק אותו:

```sql
-- מחיקת המדיניות הישנה שחוסמת הכל
DROP POLICY IF EXISTS "Evenings: restrict delete" ON public.evenings;

-- יצירת מדיניות חדשה - רק הבעלים יכול למחוק
CREATE POLICY "Evenings: owner can delete"
  ON public.evenings
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
```

---

### שינויים נוספים בקוד

צריך גם לעדכן את הקוד כדי לתת משוב למשתמש כשהמחיקה מצליחה/נכשלת:

#### `src/services/remoteStorageService.ts`

עדכון הפונקציה `deleteEvening` להחזיר תוצאה ולזרוק שגיאה:

```typescript
static async deleteEvening(eveningId: string): Promise<boolean> {
  if (!this.isEnabled() || !supabase) return false;
  const { error, count } = await supabase
    .from(EVENINGS_TABLE)
    .delete()
    .eq("id", eveningId);
  
  if (error) {
    console.error("Supabase deleteEvening error:", error.message);
    throw new Error(error.message);
  }
  return true;
}
```

#### `src/pages/Index.tsx`

עדכון handler המחיקה לתת משוב למשתמש:

```typescript
const handleDeleteEvening = async (eveningId: string) => {
  if (RemoteStorageService.isEnabled()) {
    try {
      await RemoteStorageService.deleteEvening(eveningId);
      toast({ title: "הטורניר נמחק בהצלחה" });
    } catch (e: any) {
      toast({ 
        title: "שגיאה במחיקה", 
        description: e.message || "לא ניתן למחוק את הטורניר",
        variant: "destructive" 
      });
      return; // Don't update local state if remote delete failed
    }
  }
  // Rest of the function...
};
```

---

### התנהגות לאחר התיקון

| משתמש | תוצאה |
|-------|-------|
| בעלים של הטורניר | יכול למחוק את הטורניר שלו |
| משתתף (לא בעלים) | לא יכול למחוק |
| משתמש לא מחובר | לא יכול למחוק |

---

### אופציונלי: דיאלוג אישור מחיקה

מומלץ גם להוסיף דיאלוג אישור לפני מחיקה כדי למנוע מחיקות בטעות:

```typescript
// בתוך TournamentHistory.tsx
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

// במקום onClick ישיר:
onClick={() => setDeleteConfirmId(evening.id)}

// ואז AlertDialog שמבקש אישור
```

---

### סיכום שינויים

| קובץ/משאב | פעולה |
|-----------|-------|
| מדיניות RLS | מחיקת "restrict delete" והוספת "owner can delete" |
| `src/services/remoteStorageService.ts` | עדכון `deleteEvening` לזרוק שגיאה |
| `src/pages/Index.tsx` | עדכון handler עם משוב למשתמש |
| `src/components/TournamentHistory.tsx` | (אופציונלי) דיאלוג אישור מחיקה |

