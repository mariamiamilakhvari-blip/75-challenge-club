# PRD 04 — Team board

## Goal
See what the team does together this week.

## Content
- Header: team members avatars (initials) + each member's Day counter ("Day 12").
- Table: rows = challenges ALL members share (intersection of keys); columns = Mon–Sun. Row title uses the preset title when the key is a preset (stored titles may be stale).
  - Scheduled / custom rows: cell shows count of members scheduled that day (e.g. dot filled + "3/4"); highlight today column.
  - Daily rows: one spanning cell "Every day". Monthly rows: "Every day · 1/month allowance".
- If intersection empty: message "No shared challenges yet" + list of each member's own.
- Comment feed (today + last 2 days; monthly exception check-ins are never shown): "Nino · Work out 30 min · 'Yoga at Vake park 7pm'" + **I'm in** button (toggle) + list of joiners.
- "Leave team" button (confirm dialog).

## API
- `GET /api/teams/me` → `TeamBoard` `{ team: {id, members[]}, sharedChallenges[], grid, comments[] }` or 404 `NO_TEAM`.
- `POST /api/teams/leave`.
- `POST /api/checkins/:id/join` toggles viewer in joiners (teammates only).
