import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/billing/repository/billing.repository', () => ({
  billingRepository: { findById: vi.fn(), findByEmail: vi.fn(), updateSubscription: vi.fn() },
}));
vi.mock('@/shared/lib/dodo', () => ({
  dodo: {
    isConfigured: true,
    productIdFor: vi.fn((plan: string) => (plan === 'monthly' ? 'pdt_month' : 'pdt_year')),
    planForProduct: vi.fn((id: string) => (id === 'pdt_month' ? 'monthly' : id === 'pdt_year' ? 'yearly' : null)),
    appUrl: vi.fn((path: string) => `https://club.example${path}`),
    createCheckout: vi.fn(),
    createPortalLink: vi.fn(),
  },
}));

import { billingRepository } from '@/features/billing/repository/billing.repository';
import {
  billingSummary,
  createCheckoutService,
  createPortalService,
  handleDodoWebhookService,
  mapDodoStatus,
} from '@/features/billing/service/billing.service';
import { dodo } from '@/shared/lib/dodo';

const NOW = new Date('2026-11-28T12:00:00Z');
const USER_ID = 'a'.repeat(24);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: { toString: () => USER_ID },
    name: 'Ana',
    email: 'ana@t.io',
    createdAt: daysAgo(3),
    subscriptionStatus: 'none',
    subscriptionPlan: '',
    dodoCustomerId: '',
    subscriptionPeriodEnd: null,
    subscriptionEventAt: null,
    ...overrides,
  }) as never;

const subPayload = (overrides: Record<string, unknown> = {}) => ({
  subscription_id: 'sub_1',
  status: 'active',
  product_id: 'pdt_year',
  created_at: '2026-11-28T10:00:00Z',
  next_billing_date: '2027-11-28T10:00:00Z',
  trial_period_days: 0,
  metadata: { userId: USER_ID },
  customer: { customer_id: 'cus_1', email: 'ana@t.io' },
  ...overrides,
});

const event = (type: string, data: Record<string, unknown>, timestamp = '2026-11-28T11:00:00Z') => ({ type, timestamp, data });

describe('createCheckoutService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the remaining in-app trial days so trials never stack', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ createdAt: daysAgo(3) }));
    vi.mocked(dodo.createCheckout).mockResolvedValueOnce('https://checkout');
    const result = await createCheckoutService(USER_ID, { plan: 'yearly' }, NOW);
    expect(result).toEqual({ data: { checkoutUrl: 'https://checkout' }, status: 200 });
    expect(dodo.createCheckout).toHaveBeenCalledWith({
      productId: 'pdt_year',
      email: 'ana@t.io',
      name: 'Ana',
      userId: USER_ID,
      returnUrl: 'https://club.example/plans?checkout=success',
      trialDays: 4,
    });
  });

  it('charges immediately (trial 0) once the trial is over or a subscription existed', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ createdAt: daysAgo(20) }));
    vi.mocked(dodo.createCheckout).mockResolvedValueOnce('u');
    await createCheckoutService(USER_ID, { plan: 'monthly' }, NOW);
    expect(dodo.createCheckout).toHaveBeenCalledWith(expect.objectContaining({ productId: 'pdt_month', trialDays: 0 }));

    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ createdAt: daysAgo(1), subscriptionStatus: 'expired' }));
    vi.mocked(dodo.createCheckout).mockResolvedValueOnce('u');
    await createCheckoutService(USER_ID, { plan: 'monthly' }, NOW);
    expect(dodo.createCheckout).toHaveBeenLastCalledWith(expect.objectContaining({ trialDays: 0 }));
  });

  it('rejects users who are already subscribed', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ subscriptionStatus: 'active' }));
    expect(await createCheckoutService(USER_ID, { plan: 'yearly' }, NOW)).toEqual({ data: { error: 'ALREADY_SUBSCRIBED' }, status: 409 });
    expect(dodo.createCheckout).not.toHaveBeenCalled();
  });

  it('returns 502 when Dodo gives no checkout url', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user());
    vi.mocked(dodo.createCheckout).mockResolvedValueOnce(null);
    expect((await createCheckoutService(USER_ID, { plan: 'yearly' }, NOW)).status).toBe(502);
  });
});

describe('createPortalService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('needs a Dodo customer', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user());
    expect((await createPortalService(USER_ID)).data).toEqual({ error: 'NO_SUBSCRIPTION' });
  });

  it('returns the portal link', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ dodoCustomerId: 'cus_1' }));
    vi.mocked(dodo.createPortalLink).mockResolvedValueOnce('https://portal');
    expect(await createPortalService(USER_ID)).toEqual({ data: { url: 'https://portal' }, status: 200 });
  });
});

describe('mapDodoStatus', () => {
  it('maps Dodo statuses to trialing / active / cancelled / expired', () => {
    expect(mapDodoStatus(subPayload({ trial_period_days: 7 }) as never, NOW)).toBe('trialing');
    expect(mapDodoStatus(subPayload({ trial_period_days: 7, created_at: '2026-11-01T00:00:00Z' }) as never, NOW)).toBe('active');
    expect(mapDodoStatus(subPayload() as never, NOW)).toBe('active');
    expect(mapDodoStatus(subPayload({ status: 'cancelled' }) as never, NOW)).toBe('cancelled');
    for (const status of ['expired', 'failed', 'on_hold', 'past_due', 'paused']) {
      expect(mapDodoStatus(subPayload({ status }) as never, NOW)).toBe('expired');
    }
    expect(mapDodoStatus(subPayload({ status: 'pending' }) as never, NOW)).toBeNull();
  });
});

describe('handleDodoWebhookService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores an active yearly subscription for the user in metadata', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user());
    const result = await handleDodoWebhookService(event('subscription.active', subPayload()), NOW);
    expect(result).toEqual({ data: { handled: true }, status: 200 });
    expect(billingRepository.updateSubscription).toHaveBeenCalledWith(USER_ID, {
      subscriptionStatus: 'active',
      subscriptionPlan: 'yearly',
      subscriptionId: 'sub_1',
      dodoCustomerId: 'cus_1',
      subscriptionPeriodEnd: new Date('2027-11-28T10:00:00Z'),
      subscriptionEventAt: new Date('2026-11-28T11:00:00Z'),
    });
  });

  it('falls back to the customer email when metadata has no user id', async () => {
    vi.mocked(billingRepository.findByEmail).mockResolvedValueOnce(user());
    await handleDodoWebhookService(event('subscription.cancelled', subPayload({ status: 'cancelled', metadata: {} })), NOW);
    expect(billingRepository.findByEmail).toHaveBeenCalledWith('ana@t.io');
    expect(billingRepository.updateSubscription).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ subscriptionStatus: 'cancelled' }));
  });

  it('uses expires_at as the period end when present', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user());
    await handleDodoWebhookService(event('subscription.expired', subPayload({ status: 'expired', expires_at: '2026-11-27T00:00:00Z' })), NOW);
    expect(billingRepository.updateSubscription).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ subscriptionStatus: 'expired', subscriptionPeriodEnd: new Date('2026-11-27T00:00:00Z') })
    );
  });

  it('ignores events older than the last applied one', async () => {
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(user({ subscriptionEventAt: new Date('2026-11-28T11:30:00Z') }));
    expect((await handleDodoWebhookService(event('subscription.active', subPayload()), NOW)).data).toEqual({ handled: false });
    expect(billingRepository.updateSubscription).not.toHaveBeenCalled();
  });

  it('acknowledges non-subscription events and unknown customers without changes', async () => {
    expect((await handleDodoWebhookService(event('payment.succeeded', {}), NOW)).data).toEqual({ handled: false });
    vi.mocked(billingRepository.findById).mockResolvedValueOnce(null);
    vi.mocked(billingRepository.findByEmail).mockResolvedValueOnce(null);
    expect((await handleDodoWebhookService(event('subscription.active', subPayload()), NOW)).status).toBe(200);
    expect(billingRepository.updateSubscription).not.toHaveBeenCalled();
  });

  it('rejects malformed subscription payloads', async () => {
    expect((await handleDodoWebhookService(event('subscription.active', { status: 'active' }), NOW)).status).toBe(400);
  });
});

describe('billingSummary', () => {
  it('combines access with stored status and plan', () => {
    expect(billingSummary(user({ subscriptionStatus: 'active', subscriptionPlan: 'monthly' }), NOW)).toMatchObject({
      hasAccess: true,
      state: 'active',
      status: 'active',
      plan: 'monthly',
    });
    expect(billingSummary(user({ createdAt: daysAgo(9) }), NOW)).toMatchObject({ hasAccess: false, state: 'locked', plan: null });
  });
});
