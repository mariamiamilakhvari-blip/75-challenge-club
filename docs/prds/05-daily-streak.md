# PRD 05 — Daily view, streak, comments

## Goal
Check off today's challenges, see teammates' progress.

## Today screen
- Big counter: "Day N of 75" + progress ring/bar.
- List of MY challenges scheduled today (by weekday in my tz). Each row: checkbox; when checking, optional comment sheet (≤140 chars, e.g. "Pilates at FitHub 18:00") → save. Uncheck allowed same day (deletes check-in).
- Teammates strip: each member "Nino 3/5" with mini progress bar (their scheduled-today count vs done today in their tz).
- If nothing scheduled today: "Rest day 🎉".

## Streak rules
- `streakStart` set at publish. Day N = days between streakStart and today (inclusive) in user tz.
- On every read of profile/today (lazy evaluation): for each date d from `lastEvaluated+1` to yesterday: if any challenge scheduled on weekday(d) lacks a check-in for d → `streakStart = d+1`. Then `lastEvaluated = yesterday`.
- Reset never removes from team.
- Day 75 complete → show "Challenge complete 🏆" banner (counter caps display at 75).
- Pure function `evaluateStreak(...)` in `features/checkin/utils` style location → `src/shared/utils/streak.ts` with unit tests.

## API
- `GET /api/today` → `{ day, date, items:[{key,title,done,checkInId,comment}], teammates:[{id,name,done,total}] }`.
- `POST /api/checkins` `{ challengeKey, comment? }` → creates for today (user tz); 400 if not scheduled today.
- `DELETE /api/checkins/:id` (own, today only).
