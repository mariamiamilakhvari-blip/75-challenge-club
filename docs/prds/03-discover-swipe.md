# PRD 03 — Discover & swipe

## Goal
Find teammates with most overlap.

## Ranking
For viewer V and candidate C:
- sharedChallenges = keys in both (custom keys only match exact key — effectively never; ok).
- sharedDays = count of weekdays where at least one shared challenge is scheduled for both.
- score = sharedChallenges * 10 + sharedDays. Sort desc, tie → newest.
Exclude: self, unpublished, skipped by V, members of V's team, candidates whose team is full (6).

## Card
Name, age, city, interest chips, challenge list (shared ones highlighted), overlap badge: "4 challenges · 3 days match". Team status: "Solo" or "Team of N".

## Interaction
- Drag/swipe card horizontally (pointer events, CSS transform via Tailwind classes + state; no inline style — use `translate-x-*`/`rotate-*` step classes or framer-free class switching). Threshold → commit.
- Buttons below: ✕ Skip, ✓ Join (accessibility + desktop).
- Right = join: if C in team → V joins C's team; if C solo → new team [C, V]. V leaves old team first (if any). Redirect `/team`.
- Left = skip: add to V.skipped.
- Empty state: "No more people right now" + reset skips button.

## API
- `GET /api/discover` → `DiscoverCard[]`.
- `POST /api/discover/skip` `{ userId }`.
- `POST /api/teams/join` `{ userId }` → 200 `{ teamId }` / 409 `TEAM_FULL`.
