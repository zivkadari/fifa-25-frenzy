

## Problem

In Couples mode, the share button generates a link to `/join/${shareCode}`, which requires authentication. The 5-player mode correctly uses `/spectate/${shareCode}` for its public spectator link. The Spectate page already supports Couples mode data, but there's no way to reach it from the Couples share flow.

## Solution

Update the Couples mode share functionality in `TournamentGame.tsx` to share a **spectator link** (`/spectate/${shareCode}`) instead of (or in addition to) the join link (`/join/${shareCode}`).

## Changes

### 1. Update `TournamentGame.tsx` — Share link URL

Change the WhatsApp share function and any other share actions to use `/spectate/${shareCode}` instead of `/join/${shareCode}`. This mirrors the 5-player mode's approach in `FPGame.tsx`.

- Line ~172: Change `const joinUrl = \`\${appUrl}/join/\${shareCode}\`` to `const joinUrl = \`\${appUrl}/spectate/\${shareCode}\``
- Update the share message text to reflect spectating/watching rather than "joining"
- Keep the share code display button as-is (it's useful for manual entry)

This is a minimal change — just the URL path in the share function. The Spectate page already detects couples vs 5-player mode and renders the appropriate view.

