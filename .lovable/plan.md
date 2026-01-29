# תיקון: חיבור ה-Overrides לטורניר

## סטטוס: ✅ הושלם

### מה תוקן

כעת כשמעדכנים כוכבים של קבוצות בדף Admin, השינויים משפיעים על הטורניר עצמו.

### השינויים שבוצעו

| קובץ | פעולה |
|------|-------|
| `src/data/clubs.ts` | הפונקציות `getClubsByStars`, `getClubsOnly`, `getNationalTeams`, `getNationalTeamsByStars`, `getPrimeTeams`, `getRandomClub` מקבלות כעת פרמטר אופציונלי `clubs` |
| `src/services/teamSelector.ts` | הקלאס מקבל `clubs` ב-constructor ומשתמש בו בכל הפונקציות |
| `src/services/tournamentEngine.ts` | `createSinglesEvening` מקבל פרמטר `clubs` אופציונלי |
| `src/components/TournamentGame.tsx` | טוען קבוצות עם overrides ומעביר ל-`TeamSelector` |
| `src/pages/Index.tsx` | טוען קבוצות עם overrides ומעביר ל-`createSinglesEvening` |

### זרימת נתונים

```text
Admin Page → club_overrides (DB) → getClubsWithOverrides() → TeamSelector(clubs) → Tournament
```
