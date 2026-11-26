# PRD 02 — Challenge picker & publish

## Goal
User picks challenges and which weekdays each applies, then publishes profile.

## Preset challenges (`CHALLENGES` const, key → title, hint)
1. `water` Drink 2 L of water
2. `workout` Work out 30 min — gym, yoga, pilates, dancing, walking, jogging…
3. `read` Read 10 pages
4. `no-junk` No junk food — 1 cheat per month
5. `no-alcohol` No alcohol — 1 exception per month
6. `social` One social activity per week
7. `sleep` Sleep before 12 A.M.
8. `doomscroll` Max 1 hour doomscrolling per day
9. `meditate` Meditate / full-body relax 15 min
10. `skill` Learn a new skill for 20 min

Custom: user adds title (2–60 chars); key = `custom-<slug>-<rand4>`.

## UX
- List of challenge cards; tap to select (checkbox state). Selected card expands a row of 7 day toggle buttons M T W T F S S. Default on select: all 7 days.
- "Add custom challenge" input + Add button.
- Sticky bottom bar: "N challenges selected" + **Publish** button (disabled until ≥1 challenge with ≥1 day).
- Same screen reused from `/profile` → "Edit challenges".

## API
- `GET /api/profile/me` → own profile.
- `PUT /api/profile/challenges` body `{ challenges: [{key,title,custom,days:number[]}] }` (1–15 items, days unique 0–6, min 1).
- `POST /api/profile/publish` → sets published=true; sets `streakStart` = today (user tz) if empty. Redirect `/discover`.

## Acceptance
- Can't publish with 0 challenges.
- Editing challenges later keeps streak.
