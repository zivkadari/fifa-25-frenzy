

## תיקון בחירה ידנית במצב Deadlock – רשימה אחידה לשני הזוגות

### הבעיה
כשלוחצים "בחר ידנית" במצב deadlock, המערכת מפצלת את רשימת הקבוצות הזמינות לשניים (`candidates.slice(0, half)` ו-`candidates.slice(half)`) ונותנת לכל זוג חצי שונה. זה שגוי — שני הזוגות צריכים לראות את **אותה רשימה** ולבחור ממנה, ואחרי שנבחרו שתי קבוצות (אחת לכל זוג) הן יורדות מהרשימה למשחק הבא.

### הפתרון

**קובץ:** `src/components/TournamentGame.tsx`

**שורות 1168-1174** (deadlock manual selection) ו-**שורות 1128-1130** (decider manual selection):

שינוי הלוגיקה כך ש-`setTeamPools` מקבל את **אותה רשימת candidates עבור שני הזוגות**:

```typescript
// במקום:
const half = Math.ceil(candidates.length / 2);
setTeamPools([candidates.slice(0, half), candidates.slice(half)]);

// צריך להיות:
setTeamPools([candidates, candidates]);
```

שינוי זה מתבצע בשני מקומות:
1. **שורות 1129-1130** — כפתור "בחר ידנית" ב-decider match
2. **שורות 1173-1174** — כפתור "בחר ידנית" ב-deadlock

כך שני הזוגות רואים את אותה הרשימה. הסינון הקיים (שורות 1203-1208) כבר דואג שקבוצה שנבחרה על ידי זוג אחד לא תופיע לזוג השני באותו משחק, ואחרי שהמשחק נרשם ה-`usedClubIdsThisRound` מתעדכן וגורם לקבוצות שכבר שוחקו לרדת מהרשימה.

