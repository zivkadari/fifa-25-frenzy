

## Spectate Page Fixes

### 5 issues to fix in `src/pages/Spectate.tsx` and `src/components/FPGame.tsx`:

### 1. Allow sharing before first match
**File: `src/components/FPGame.tsx`**
The share button already works before the first match — the issue is that `upsertEveningLiveWithTeam` may not be called until a match update happens. The `handleShare` already calls upsert before getting the code, so this should work. However, the `currentEvening` passed to upsert needs the full evening data. Will verify the upsert call uses the current evening state correctly (it does — line 243). No code change needed here unless there's a deeper issue with the upsert failing for evenings with 0 completed matches. Will ensure the upsert doesn't filter out evenings with no completed matches.

**File: `src/services/remoteStorageService.ts`** — Check if `upsertEveningLiveWithTeam` has any guard that prevents syncing when no matches are completed. If so, remove it.

### 2. Remove index (#) column from standings tables
**File: `src/pages/Spectate.tsx`**
Remove the `#` column header and the `{idx + 1}` cell from both the pairs and players tables. This frees horizontal space so the table fits without scrolling.

### 3. Add "Upcoming Matches" expandable section
**File: `src/pages/Spectate.tsx`**
Add a collapsible button below the current match card labeled "משחקים הבאים" that, when tapped, reveals a list of the next upcoming (not yet completed) matches showing pair names and sitting-out player. Use a simple state toggle — no heavy UI.

### 4. Fix reversed score in recent results
**File: `src/pages/Spectate.tsx`** (line 376-378)
The score displays `{m.scoreA}-{m.scoreB}` but since the layout is RTL and the names show pairA first (on the right), the score reads backwards. The fix: display the score as `{m.scoreA}-{m.scoreB}` with explicit `dir="ltr"` on the score span so numbers render correctly in RTL context.

### 5. Rename "בנקי קבוצות" to "צפייה בכל הקבוצות"
**File: `src/pages/Spectate.tsx`**
- Button text (line 234): change to "צפייה בכל הקבוצות"
- Drawer title (line 391): change to "כל הקבוצות"
- Drawer description (line 394): change to "כל הקבוצות של הזוגות בליגה"
- Remove the Wallet icon, use Eye or similar

---

### Technical details

**File changes:**

1. **`src/services/remoteStorageService.ts`** — Verify no guard blocks upsert for 0-match evenings
2. **`src/pages/Spectate.tsx`** — All UI changes:
   - Remove `#` column from both tables (lines 255, 270, 305, 320)
   - Add upcoming matches section with collapsible state
   - Add `dir="ltr"` to score span in recent results
   - Rename all "בנקי קבוצות" references
3. **`src/components/FPGame.tsx`** — Likely no changes needed (share already works pre-match)

