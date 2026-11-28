# PRD 07 — Subscriptions (Dodo Payments)

## Goal
7 days free after sign-up, then a paid plan to keep checking in and using Discover. Data is never deleted.

## Plans
| Plan | Price | Env var for product ID |
|---|---|---|
| Yearly ("Save 33%", shown first) | $39.99 / year | `DODO_YEARLY_PRODUCT_ID` |
| Monthly | $4.99 / month | `DODO_MONTHLY_PRODUCT_ID` |

## Access rule (`accessFor` in `src/shared/utils/access.ts`)
1. Subscription `active` or `trialing` → access.
2. `cancelled` → access until `subscriptionPeriodEnd`.
3. Otherwise in-app trial: `createdAt + 7 days`.
4. Else **locked**: `GET /api/today`, `POST/DELETE /api/checkins`, `GET /api/discover`, `POST /api/discover/skip`, `POST /api/teams/join` return 402 `SUBSCRIPTION_REQUIRED`. Today and Discover show "Subscribe to continue" with both plans. Profile, team board, plans and onboarding stay readable.

## Checkout
- `/plans` (also from Profile → Plan card, and the Today trial banner) → pick plan → `POST /api/billing/checkout {plan}` → Dodo hosted checkout.
- Session: customer email + name, `metadata.userId`, `return_url = APP_URL/plans?checkout=success`.
- `subscription_data.trial_period_days` = unused in-app trial days (0 once the trial is over or after any earlier subscription), so trials never stack.
- On return, `/plans` shows a success banner and refreshes until the webhook lands (every 3 s, up to 30 s).
- Subscribed users get "Manage subscription" → `POST /api/billing/portal` → Dodo customer portal (change plan, card, cancel).

## Webhook
- `POST /api/webhooks/dodo` — public; verifies the Standard Webhooks signature (`webhook-id`, `webhook-timestamp`, `webhook-signature`) with `DODO_PAYMENTS_WEBHOOK_KEY`; 401 if invalid.
- `subscription.*` events: user found by `metadata.userId`, else customer email.
  - `active` → `trialing` while inside the Dodo trial, else `active`
  - `cancelled` → `cancelled`
  - `expired` / `failed` / `on_hold` / `past_due` / `paused` → `expired`
  - `pending` → ignored
- Stores status, plan, subscription id, customer id, period end (`expires_at` ?? `next_billing_date`) and event time; older events than the last applied one are ignored.
- Other events / unknown customers → 200 (no retry storm).

## Env
| Var | Purpose |
|---|---|
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` (default) or `live_mode` |
| `DODO_PAYMENTS_API_KEY` | API key for that mode |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Webhook signing secret (`whsec_…`) |
| `DODO_MONTHLY_PRODUCT_ID`, `DODO_YEARLY_PRODUCT_ID` | Product IDs for that mode |
| `APP_URL` | Base URL for the checkout return (falls back to `NEXTAUTH_URL`) |

Going live = change these env values only; no code change.
