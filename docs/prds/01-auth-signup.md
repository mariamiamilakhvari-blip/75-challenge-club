# PRD 01 — Sign up & Auth

## Goal
Create account with profile basics in one short form.

## Requirements
- Fields: name (2–50), email, password (≥8), age (13–100 int), city (2–60), interests (1–8 chips from `INTERESTS` const + free text tag).
- Timezone captured silently from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- After sign up → auto sign in → `/onboarding`.
- Sign in → `/today` if published, else `/onboarding`.
- Protected layout: any signed-in user (remove admin-only gate).
- `proxy.ts` protects `/onboarding`, `/discover`, `/team`, `/today`, `/profile`.

## API
- `POST /api/auth/register` body `SignUpSchema` → 201 / 409 `EMAIL_TAKEN`.

## Acceptance
- Invalid fields show inline errors (react-hook-form + zod).
- Duplicate email shows "Email already in use".
- Mobile layout 360px wide works without horizontal scroll.

## Google sign-in (added)
- "Continue with Google" on sign-in and sign-up, above an "or" divider → `/today`.
- New Google users have no age/city/interests (timezone UTC). Profile exposes `needsAbout`; `/onboarding` shows an "About you" form (age, city, interests, timezone from browser) before the challenge picker.
- `PUT /api/profile/about` body `AboutYouSchema` (same rules as signup).
- Google Console redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`.
