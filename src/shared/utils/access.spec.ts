import { describe, expect, it } from 'vitest';

import { accessFor, subscriptionGuard } from '@/shared/utils/access';

const NOW = new Date('2026-11-28T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe('accessFor', () => {
  it('gives a 7-day in-app trial from sign-up', () => {
    expect(accessFor({ createdAt: daysAgo(2) }, NOW)).toMatchObject({ hasAccess: true, state: 'trial', daysLeft: 5 });
    expect(accessFor({ createdAt: daysAgo(2) }, NOW).trialEndsAt).toBe(inDays(5).toISOString());
  });

  it('locks after the trial when there is no subscription', () => {
    expect(accessFor({ createdAt: daysAgo(8), subscriptionStatus: 'none' }, NOW)).toMatchObject({ hasAccess: false, state: 'locked', daysLeft: 0 });
  });

  it('allows active and Dodo-trialing subscriptions', () => {
    expect(accessFor({ createdAt: daysAgo(40), subscriptionStatus: 'active', subscriptionPeriodEnd: inDays(10) }, NOW)).toMatchObject({
      hasAccess: true,
      state: 'active',
      daysLeft: 10,
    });
    expect(accessFor({ createdAt: daysAgo(40), subscriptionStatus: 'trialing' }, NOW).state).toBe('trialing');
  });

  it('keeps cancelled subscribers in until the paid period ends', () => {
    expect(accessFor({ createdAt: daysAgo(40), subscriptionStatus: 'cancelled', subscriptionPeriodEnd: inDays(3) }, NOW)).toMatchObject({
      hasAccess: true,
      state: 'cancelled',
    });
    expect(accessFor({ createdAt: daysAgo(40), subscriptionStatus: 'cancelled', subscriptionPeriodEnd: daysAgo(1) }, NOW).state).toBe('locked');
  });

  it('locks expired subscriptions once the in-app trial is over', () => {
    expect(accessFor({ createdAt: daysAgo(40), subscriptionStatus: 'expired' }, NOW).hasAccess).toBe(false);
  });
});

describe('subscriptionGuard', () => {
  it('returns 402 SUBSCRIPTION_REQUIRED when locked, null otherwise', () => {
    expect(subscriptionGuard({ createdAt: daysAgo(30) }, NOW)).toEqual({ data: { error: 'SUBSCRIPTION_REQUIRED' }, status: 402 });
    expect(subscriptionGuard({ createdAt: daysAgo(1) }, NOW)).toBeNull();
  });
});
