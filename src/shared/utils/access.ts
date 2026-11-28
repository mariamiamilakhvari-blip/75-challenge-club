import { AccessInfo, BillingUserFields } from '@/features/billing/types/billing.types';
import { APP_TRIAL_DAYS, SUBSCRIPTION_REQUIRED } from '@/shared/const/billing.const';
import { ServiceResult } from '@/shared/types/common';

const MS_PER_DAY = 86_400_000;

const daysUntil = (end: Date, now: Date) => Math.max(0, Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY));

export function trialEndFor(user: BillingUserFields, now: Date): Date {
  // documents without createdAt (never in production) start their trial now
  const start = user.createdAt ? new Date(user.createdAt) : now;
  return new Date(start.getTime() + APP_TRIAL_DAYS * MS_PER_DAY);
}

/**
 * Who may use check-ins and Discover:
 * paid (active) or Dodo trial → yes; cancelled → until the paid period ends;
 * otherwise the in-app 7-day trial from sign-up; after that → locked.
 */
export function accessFor(user: BillingUserFields, now: Date = new Date()): AccessInfo {
  const trialEnd = trialEndFor(user, now);
  const periodEnd = user.subscriptionPeriodEnd ? new Date(user.subscriptionPeriodEnd) : null;
  const base = { trialEndsAt: trialEnd.toISOString(), periodEnd: periodEnd ? periodEnd.toISOString() : null };
  const status = user.subscriptionStatus ?? 'none';

  if (status === 'active' || status === 'trialing') {
    return { ...base, hasAccess: true, state: status, daysLeft: periodEnd ? daysUntil(periodEnd, now) : 0 };
  }
  if (status === 'cancelled' && periodEnd && periodEnd > now) {
    return { ...base, hasAccess: true, state: 'cancelled', daysLeft: daysUntil(periodEnd, now) };
  }
  if (trialEnd > now) {
    return { ...base, hasAccess: true, state: 'trial', daysLeft: daysUntil(trialEnd, now) };
  }
  return { ...base, hasAccess: false, state: 'locked', daysLeft: 0 };
}

/** Service guard: a 402 result when the user has no access, else null. */
export function subscriptionGuard(user: BillingUserFields, now: Date = new Date()): ServiceResult<never> | null {
  return accessFor(user, now).hasAccess ? null : { data: { error: SUBSCRIPTION_REQUIRED }, status: 402 };
}
