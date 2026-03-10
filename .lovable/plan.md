

## תיקון: טורניר מתאפס כשהאינטרנט מתנתק

### שורש הבעיה

ב-`Index.tsx` שורה 124-130, יש subscription ל-Supabase Realtime שמאזין לשינויים ב-evening הנוכחי. כשהאינטרנט מתנתק ואז מתחבר מחדש:

1. בזמן הניתוק, כל עדכוני ה-`upsertEveningLive` נכשלים בשקט → ה-state ב-Supabase נשאר ישן
2. כשהאינטרנט חוזר, Supabase Realtime שולח את ה-state הישן מהשרת
3. `setCurrentEvening(remoteEvening)` **דורס את ה-state המקומי החדש** עם data ישן מהשרת
4. זה מפעיל את ה-`useEffect` ב-TournamentGame שקורא ל-`onUpdateEvening` עם ה-data הישן
5. `persistActiveEveningNow` שומר את ה-data הישן ל-localStorage, ודורס גם את הגיבוי המקומי

### התיקון

**קובץ: `src/pages/Index.tsx`** (שורות 124-130)

בתוך ה-callback של `subscribeToEvening`, לפני שדורסים את ה-state, לבדוק אם ה-data מהשרת באמת **חדש יותר** מה-state המקומי. ההשוואה תהיה לפי מספר המשחקים שהושלמו (completed matches) ברחבי כל הסיבובים:

```typescript
const unsubscribe = RemoteStorageService.subscribeToEvening(currentEvening.id, (remoteEvening) => {
  // Count completed matches to determine which state has more progress
  const countCompleted = (e: Evening) => 
    e.rounds.reduce((sum, r) => sum + r.matches.filter(m => m.completed).length, 0);
  
  const localProgress = countCompleted(currentEvening);
  const remoteProgress = countCompleted(remoteEvening);
  
  // Only accept remote state if it has equal or more progress
  if (remoteProgress >= localProgress) {
    setCurrentEvening(remoteEvening);
  }
});
```

הבעיה: `currentEvening` בתוך ה-callback הוא stale (closure ישן). צריך להשתמש ב-`ref` כדי לגשת ל-state העדכני:

- להוסיף `useRef` שמחזיק את `currentEvening` העדכני
- בתוך ה-callback, להשוות מול ה-ref ולא מול ה-closure

**שינויים נדרשים:**

1. **הוספת ref** ב-Index.tsx: `const currentEveningRef = useRef(currentEvening)` + `useEffect` שמעדכן אותו
2. **עדכון ה-realtime callback** להשוות progress לפני דריסה
3. **הוספת הגנה נוספת** ב-`handleUpdateEvening`: כשה-evening שמגיע מ-realtime מפעיל את `onUpdateEvening`, לוודא שלא דורסים state חדש יותר ב-localStorage

