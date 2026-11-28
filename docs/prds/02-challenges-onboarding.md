# PRD 02 — Challenge picker & publish

## Goal
User picks challenges and which weekdays each applies, then publishes profile.

## Preset challenges (`CHALLENGES` const)

| Kind | Key | Title | Days rule |
|---|---|---|---|
| Daily | `water` | Drink 2 L of water | all 7, fixed |
| Daily | `read` | Read 10 pages | all 7, fixed |
| Daily | `doomscroll` | Max 1 hour of doomscrolling (social media) | all 7, fixed |
| Daily | `meditate` | Body relaxation 15 min | all 7, fixed |
| Scheduled | `workout` | Work out 45 min | exactly 4 user-picked days |
| Scheduled | `sleep` | Sleep before 12 AM | exactly 5 user-picked days |
| Scheduled | `skill` | Learn a new skill 30 min | exactly 4 user-picked days |
| Scheduled | `social` | Social activity | exactly 1 user-picked day |
| Monthly | `no-junk` | No junk food | every day; 1 cheat per calendar month |
| Monthly | `no-alcohol` | No alcohol | every day; 1 drink per calendar month |

Monthly allowance: the first exception in a calendar month counts as done; a second one in the same month counts as a miss (counter restarts at Day 1).

Custom: user adds title (2–60 chars); key = `custom-<slug>-<rand4>`; any ≥1 days, with an "Every day" button.

Rules live in `src/shared/utils/challenge-rules.ts` (`normalizeDays`) and are enforced server-side.

## UX
- One list, grouped: Daily · Scheduled · Monthly allowance · Custom. Each challenge appears once.
- Daily and monthly cards: checkbox only ("Every day" label; monthly shows an info note). No day picker.
- Scheduled cards: "Days of the week" label + Mon…Sun buttons; exact count enforced ("Pick 4 days (3/4)").
- Custom cards: "Days of the week" + Mon…Sun + "Every day" button.
- AI suggestions (PRD 06) appear as a "✨ Suggested" badge on matching cards — no separate panel, no auto-select.
- Sticky bottom bar: Publish disabled until ≥5 valid challenges; hint "Select at least 5 challenges (3/5)".
- Same screen reused from `/profile` → "Edit challenges".

## API
- `GET /api/profile/me` → own profile.
- `PUT /api/profile/challenges` body `{ challenges: [{key,title,custom,days:number[]}] }` (5–15 items; days normalized/validated per rule → 400 `INVALID_DAYS`).
- `POST /api/profile/publish` → sets published=true; sets `streakStart` = today (user tz) if empty. Redirect `/discover`.

## Acceptance
- Can't publish with fewer than 5 challenges (400 `NOT_ENOUGH_CHALLENGES`).
- Editing challenges later keeps streak.
