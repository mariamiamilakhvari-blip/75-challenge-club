# PRD 02 — Challenge picker & publish

## Goal
User picks challenges and which weekdays each applies, then publishes profile.

## Preset challenges (`CHALLENGES` const)

| Group | Kind | Key | Title | Days rule |
|---|---|---|---|---|
| Required | Daily | `water` | Drink 2 L of water | all 7, fixed |
| Required | Scheduled | `workout` | Work out 45 min | exactly 4 user-picked days |
| Required | Monthly | `no-junk` | No junk food | every day; 1 cheat per calendar month |
| Required | Daily | `read` | Read 10 pages | all 7, fixed |
| Required | Scheduled | `social` | Social activity | exactly 1 user-picked day |
| Optional | Daily | `doomscroll` | Max 1 hour of doomscrolling (social media) | all 7, fixed |
| Optional | Daily | `meditate` | Body relaxation 15 min | all 7, fixed |
| Optional | Scheduled | `sleep` | Sleep before 12 AM | exactly 5 user-picked days |
| Optional | Scheduled | `skill` | Learn a new skill 30 min | exactly 4 user-picked days |
| Optional | Monthly | `no-alcohol` | No alcohol | every day; 1 drink per calendar month |

Required keys live in `REQUIRED_CHALLENGE_KEYS` (display order). Every profile must include all five; they are pre-selected and cannot be removed.

Monthly allowance: the first exception in a calendar month counts as done; a second one in the same month counts as a miss (counter restarts at Day 1).

Custom: user adds title (2–60 chars); key = `custom-<slug>-<rand4>`; any ≥1 days, with an "Every day" button.

Rules live in `src/shared/utils/challenge-rules.ts` (`normalizeDays`) and are enforced server-side.

## UX
- Two sections: **Required** (5 locked cards with a "Required" badge) on top, **Add more (optional)** below (optional presets + custom). Each challenge appears once.
- Daily and monthly cards: checkbox only ("Every day" label; monthly shows an info note). No day picker.
- Scheduled cards: "Days of the week" label + Mon…Sun buttons; exact count enforced ("Pick 4 days (3/4)").
- Custom cards: "Days of the week" + Mon…Sun + "Every day" button.
- AI suggestions (PRD 06) appear as a "✨ Suggested" badge on optional cards only — no separate panel, no auto-select.
- Sticky bottom bar: no minimum counter. Publish enabled once every selected challenge has valid days (e.g. Work out exactly 4, Social exactly 1); otherwise hint "Pick days for <title>".
- Existing profiles missing a required challenge (or with invalid days) get `needsChallengeFix: true`: Profile shows a "Fix in Edit challenges" flag; the picker pre-adds the missing required cards and shows a notice listing them.
- Same screen reused from `/profile` → "Edit challenges".

## API
- `GET /api/profile/me` → own profile.
- `PUT /api/profile/challenges` body `{ challenges: [{key,title,custom,days:number[]}] }` (≤15 items; must include all required keys → 400 `MISSING_REQUIRED`; days normalized/validated per rule → 400 `INVALID_DAYS`).
- `POST /api/profile/publish` → sets published=true; sets `streakStart` = today (user tz) if empty. Redirect `/discover`.

## Acceptance
- Can't save or publish without all 5 required challenges with valid days (400 `MISSING_REQUIRED`).
- Editing challenges later keeps streak.
