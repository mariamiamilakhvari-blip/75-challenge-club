# 75-challenge-club

Mobile-first web app for a 75-day group challenge. Pick daily habits and the weekdays you do them, find teammates with the same schedule by swiping, and keep each other accountable on a shared team board.

## Features

- Sign up with name, age, city and interests
- Pick from 10 preset challenges (or add your own) and choose weekdays for each
- Discover deck sorted by shared challenges and shared days — swipe right to join a team (max 6), left to skip
- Team board: shared challenges × weekdays, member day counters, check-in comments with "I'm in"
- Daily view: check off today's challenges, see teammates' progress; missing a scheduled challenge resets your counter to Day 1

## Stack

Next.js 16 (App Router) · NextAuth v5 · MongoDB/Mongoose · Tailwind + shadcn/ui · Zustand · Zod · Vitest

## Getting started

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, NEXTAUTH_SECRET, Google OAuth keys
npm run dev            # http://localhost:3000
```

Product specs live in [docs/prds](docs/prds). Architecture rules live in [CLAUDE.md](CLAUDE.md).

## Scripts

```bash
npm run dev       # dev server
npm run build     # production build
npm run lint      # ESLint
npm run test      # Vitest
```
