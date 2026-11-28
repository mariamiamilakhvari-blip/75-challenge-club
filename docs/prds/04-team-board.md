# PRD 04 — Team board

## Goal
See what the team does together this week, plan together, and agree on shared days.

## Header
- Each member: avatar (initials), name ("You" for the viewer), **today's progress** ("3/5 today", own timezone, monthly allowance counts as done) and **Day N**.

## Board (this week, Mon–Sun of the viewer's week)
- Rows = challenges ALL members share. Row title uses the preset title. Every row has 7 day cells (daily/monthly rows too; their label "Every day" / "Every day · 1/month allowance" sits under the title).
- Cell = one mini avatar per member scheduled that weekday: **filled = done**, outlined = not yet (faded for days still ahead). "–" when nobody is scheduled.
- Tap a cell → sheet listing each scheduled member: Done / Not yet / Missed / Scheduled + their check-in comment (monthly exception comments are hidden).
- Tap a row title → challenge sheet (plans, comments, shared days). A coral dot marks rows with a proposal the viewer hasn't answered.
- Shared days of a row's proposal are tinted; subtitle "Together: Mon, Wed, Fri, Sun · 2/3 in".
- Legend under the table: Done · Not yet · Shared days.
- Empty intersection: "No shared challenges yet" + each member's own list.

## Plans (posted from the board, not only at check-in)
| Challenge | Question | Fields (* required) | "I'm in" |
|---|---|---|---|
| Social activity | Where are you planning to go? | place*, day/time, note | yes |
| Work out 45 min | Where and what are you training? | place*, workout type*, day/time, note | yes |
| Read 10 pages | What are you reading? | book title*, author, note | no |
| Any other | Share a note with your team | note* | no |

- Config: `PLAN_PROMPTS` in `src/shared/const/plan.const.ts`; server keeps only the prompt's fields (`normalizePlanDetails`).
- Teammates reply (≤140 chars) and tap "I'm in" on joinable plans; authors can delete their plan.
- "Plans & comments" section: plans from the last 7 days + check-in comments from the last 2 days, grouped by challenge in board order. Group title opens the challenge sheet.

## Shared days
- Scheduled presets only (Work out, Social activity, Sleep before 12 AM, Learn a new skill), and only when every member has the challenge.
- Any member proposes days; must match the day-count rule (`normalizeDays`) → else 400 `INVALID_DAYS`.
- One open proposal per team + challenge; a new one replaces the old. The proposer is auto-accepted.
- Accept → member's personal days for that challenge become the shared days (streak is synced first so past days are judged under the old schedule). Decline → recorded, schedule unchanged. Members can change their answer.

## API
- `GET /api/teams/me` → `TeamBoard` (members with todayDone/todayTotal, grid rows with cells + proposal, weekDates, comments, plans) or 404 `NO_TEAM`.
- `POST /api/teams/plans` `{challengeKey, place?, when?, activity?, book?, author?, note?}` → 201 · 400 `MISSING_FIELDS` / `NOT_YOUR_CHALLENGE`.
- `DELETE /api/teams/plans/:id` (author only).
- `POST /api/teams/plans/:id/replies` `{text}`.
- `POST /api/teams/plans/:id/join` toggles "I'm in" (not own, joinable only).
- `POST /api/teams/proposals` `{challengeKey, days}` → 400 `NOT_SCHEDULED` / `NOT_SHARED` / `INVALID_DAYS`.
- `POST /api/teams/proposals/:id/respond` `{accept}`.
- `POST /api/checkins/:id/join` toggles "I'm in" on a check-in comment.
- `POST /api/teams/leave`.
