

## Problem Analysis

When clicking the share button, the flow is:
1. `handleShare` → `RemoteStorageService.getShareCode(eveningId)`
2. `getShareCode` calls the RPC `get_evening_share_code` which queries `evenings` where `id = eveningId AND owner_id = auth.uid()`
3. If the evening row doesn't exist yet in Supabase, or the user isn't authenticated, it returns null → error toast

The root cause: `handleShare` assumes the evening already exists in the `evenings` table. But the upsert happens asynchronously on updates, and if the user clicks share before any update has synced, the row may not exist yet.

## Fix

**File: `src/components/FPGame.tsx`** — Update `handleShare` to ensure the evening is upserted to Supabase before requesting the share code:

1. Before calling `getShareCode`, first call `RemoteStorageService.upsertEveningLiveWithTeam(currentEvening, teamId)` to guarantee the row exists
2. Add better error logging to surface what actually fails (auth? missing row?)

**File: `src/services/remoteStorageService.ts`** — Make `getShareCode` more robust:
1. If the RPC returns null/empty, attempt a direct `.select('share_code')` query as fallback (the owner has SELECT access via RLS)
2. Log the specific error for debugging

This is a small, targeted fix — no changes to tournament logic, scoring, or UI layout.

