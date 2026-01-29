

## תיקון בעיית ההרשאות - Admin Clubs

### הבעיה

ה-RLS policies הנוכחיות מנסות לגשת לטבלת `auth.users` ישירות:
```sql
EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND email = 'zivkad12@gmail.com'
)
```

זה לא מותר מהקליינט ולכן מקבלים שגיאת "permission denied for table users".

---

### הפתרון

ליצור **פונקציית SECURITY DEFINER** שרצה עם הרשאות גבוהות ויכולה לגשת לטבלת `auth.users`, ואז לעדכן את ה-RLS policies להשתמש בפונקציה הזו.

---

### Migration חדשה

```sql
-- 1. Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_clubs_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND email = 'zivkad12@gmail.com'
  )
$$;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "club_overrides: admin can insert" ON public.club_overrides;
DROP POLICY IF EXISTS "club_overrides: admin can update" ON public.club_overrides;
DROP POLICY IF EXISTS "club_overrides: admin can delete" ON public.club_overrides;

-- 3. Recreate policies using the new function
CREATE POLICY "club_overrides: admin can insert" 
ON public.club_overrides FOR INSERT 
WITH CHECK (public.is_clubs_admin(auth.uid()));

CREATE POLICY "club_overrides: admin can update" 
ON public.club_overrides FOR UPDATE 
USING (public.is_clubs_admin(auth.uid()));

CREATE POLICY "club_overrides: admin can delete" 
ON public.club_overrides FOR DELETE 
USING (public.is_clubs_admin(auth.uid()));
```

---

### איך זה עובד

```text
┌─────────────────────────────────────────────────────────┐
│                    Before (Broken)                       │
├─────────────────────────────────────────────────────────┤
│  RLS Policy ──► auth.users ──► Permission Denied!        │
│  (runs as user)    (protected)                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    After (Fixed)                         │
├─────────────────────────────────────────────────────────┤
│  RLS Policy ──► is_clubs_admin() ──► auth.users ──► OK  │
│  (runs as user)  (SECURITY DEFINER)   (accessed as owner)│
└─────────────────────────────────────────────────────────┘
```

הפונקציה `is_clubs_admin` מוגדרת כ-`SECURITY DEFINER` - זה אומר שהיא רצה עם ההרשאות של מי שיצר אותה (בעל הדאטאבייס) ולא עם ההרשאות של המשתמש שקורא לה. זה מאפשר לה לגשת לטבלת `auth.users` בבטחה.

---

### סיכום השינויים

| קובץ | פעולה |
|------|-------|
| `supabase/migrations/xxx.sql` | Migration חדשה עם הפונקציה ועדכון ה-policies |

אחרי התיקון, תוכל לשמור שינויים בכוכבים בלי בעיות.

