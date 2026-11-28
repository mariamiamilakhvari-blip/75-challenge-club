# PRD 05 — Daily view, streak, comments

## Goal
Check off today's challenges, see teammates' progress.

## Today screen
- Big counter: "Day N of 75" + progress ring/bar.
- List of MY challenges scheduled today (by weekday in my tz). Each row: checkbox; when checking, optional comment sheet (≤140 chars, e.g. "Pilates at FitHub 18:00") → save. Uncheck allowed same day (deletes check-in).
- Teammates strip: each member "Nino 3/5" with mini progress bar (their scheduled-today count vs done today in their tz).
- If nothing scheduled today: "Rest day 🎉".
- Each row carries a small muted kind tag: "Daily", "Scheduled", "Monthly allowance" or "Custom".
- Monthly rows (no-junk, no-alcohol): normal check-off = "Stayed clean today"; secondary action "Use monthly cheat" / "Use monthly drink" logs an exception check-in (no comment sheet). Status line: "Cheat available this month" or "Cheat used this month — another one resets your counter". When the allowance is already used, a confirm dialog warns: "This is your 2nd exception this month. It counts as a miss and your counter will restart at Day 1 tomorrow." Exception check-ins render done with a small "cheat"/"drink" badge.

## Monthly allowance
- Monthly challenges are scheduled every day. Per challenge, `MONTHLY_EXCEPTIONS_ALLOWED` (1) exception per calendar month (user tz) counts as done.
- A further exception in the same month is still stored but counts as a miss → streak restarts at Day 1 at the next evaluation (`buildDoneByDate`).
- Teammate strip counts use the same rule: each teammate's month-to-date check-ins go through `buildDoneByDate`, so an over-allowance exception today is not counted as done.

## Streak rules
- `streakStart` set at publish. Day N = days between streakStart and today (inclusive) in user tz.
- On every read of profile/today (lazy evaluation): for each date d from `lastEvaluated+1` to yesterday: if any challenge scheduled on weekday(d) lacks a counting check-in for d (see Monthly allowance) → `streakStart = d+1`. Then `lastEvaluated = yesterday`.
- Reset never removes from team.
- Day 75 complete → show "Challenge complete 🏆" banner (counter caps display at 75).
- Pure function `evaluateStreak(...)` in `features/checkin/utils` style location → `src/shared/utils/streak.ts` with unit tests.

## API
- `GET /api/today` → `{ day, date, items:[{key,title,kind,done,exception,checkInId,comment,exceptionsUsed?,exceptionsAllowed?}], teammates:[{id,name,done,total}] }` (`exceptionsUsed`/`exceptionsAllowed` only on monthly items; title comes from the preset when the key is a preset).
- `POST /api/checkins` `{ challengeKey, comment?, exception? }` → creates for today (user tz); 400 `NOT_SCHEDULED_TODAY` if not scheduled today; 400 `NOT_MONTHLY` if `exception` is set on a non-monthly challenge. Exceptions over the allowance are accepted (they break the streak).
- `DELETE /api/checkins/:id` (own, today only).
