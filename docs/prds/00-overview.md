# PRD 00 — 75 Challenge Club: Overview

## Problem
People quit 75-day challenges alone. Small accountability teams with shared habits and shared schedules keep each other going.

## Product
Mobile-first web app (Next.js 16, MongoDB, NextAuth credentials). Max width ~`max-w-md`, bottom tab nav.

## Core flow
1. Sign up (email, password, name, age, city, interests) → PRD 01
2. Pick challenges + weekdays, publish profile → PRD 02
3. Discover: swipe profile cards sorted by overlap → PRD 03
4. Team board: shared challenges × weekdays → PRD 04
5. Daily view: check off, streak counter, comments, "I'm in" → PRD 05

## Decisions (locked)
- Auth: email + password only (Google kept in code, optional).
- DB: MongoDB Atlas via `MONGO_URI`.
- Teams: user in max ONE team at a time; team max 6 members; can leave.
- Design: warm & energetic — off-white base, coral accent, Plus Jakarta Sans.
- Timezone: stored per user (browser `Intl` tz at signup); "today" and "midnight" evaluated in user tz.

## Routes
| Route | Group | Purpose |
|---|---|---|
| `/` | public | Landing |
| `/sign-up`, `/sign-in` | public | Auth |
| `/onboarding` | protected | Challenge picker + publish |
| `/discover` | protected | Swipe deck |
| `/team` | protected | Team board |
| `/today` | protected | Daily check-in |
| `/profile` | protected | Own profile, edit, sign out |

## Data model
- `User` — auth + profile: name, email, passwordHash, age, city, interests[], timezone, challenges[{key, title, custom, days[0-6]}], published, teamId, streakStart (YYYY-MM-DD), lastEvaluated (YYYY-MM-DD), skipped[userId].
- `Team` — members[userId] (≤6), createdAt.
- `CheckIn` — userId, teamId?, date (YYYY-MM-DD), challengeKey, comment?, joiners[userId]. Unique (userId, date, challengeKey).

Weekday index: 0=Mon … 6=Sun.

## Non-goals
Chat, push notifications, photos upload, multiple teams, admin panel.
