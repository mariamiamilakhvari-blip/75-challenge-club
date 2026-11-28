# PRD 06 — AI challenge suggestions

## Goal
Help new users pick a good starter set of challenges and weekdays from their interests.

## Scope
Onboarding only. No motivation messages, recaps, or chat.

## Behaviour
- 5–6 picks from the 10 preset challenges only, each with a short reason tied to interests.
- Shown as a "✨ Suggested" badge on matching cards in the main list (no separate panel, no auto-select).
- Selecting a suggested scheduled card prefills the AI's days when they match the required count.
- Fallback when AI fails or returns junk: deterministic interest → challenge map (always includes water + sleep), caption "Based on your interests".

## API
- `GET /api/ai/suggestions` → `{ suggestions: [{ key, title, days, reason }], source: 'ai' | 'fallback' }`; 401 without session.

## Tech
- `src/shared/lib/openrouter.ts` singleton client; never throws, 20s timeout, returns null on failure.
- Model output validated with Zod; unknown keys dropped, days clamped 0–6 and deduped.
- Env: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.
