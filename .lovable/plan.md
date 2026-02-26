

## הוספת 4 קבוצות חדשות

### קבוצות להוספה

| קבוצה | ליגה | כוכבים |
|--------|------|--------|
| Al Qadsiah | Saudi Arabia | 4 |
| RC Strasbourg | Ligue 1 | 4 |
| AEK Athens | Greece | 4 |
| Celtic | Scotland (ליגה חדשה) | 4 |

### פרטים טכניים

**קובץ:** `src/data/clubs.ts`

1. **Saudi Arabia** — הוספת `{ id: 'al-qadsiah', name: 'Al Qadsiah', stars: 4, league: 'Saudi Arabia' }` אחרי Al Hilal
2. **Ligue 1** — הוספת `{ id: 'strasbourg', name: 'RC Strasbourg', stars: 4, league: 'Ligue 1' }` אחרי Nice
3. **Greece** — הוספת `{ id: 'aek-athens', name: 'AEK Athens', stars: 4, league: 'Greece' }` אחרי Olympiacos
4. **Scotland** — ליגה חדשה. הוספת `{ id: 'celtic', name: 'Celtic', stars: 4, league: 'Scotland' }` באזור Rest of World

**קובץ:** `src/pages/AdminClubs.tsx`

5. הוספת `"Scotland"` ל-`LEAGUE_ORDER` (אחרי Greece)
6. הוספת `"Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"` ל-`LEAGUE_FLAGS`

