import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const unwrap = vi.fn();
const portal = vi.fn();
const ctor = vi.fn();

vi.mock('dodopayments', () => ({
  default: class {
    checkoutSessions = { create };
    webhooks = { unwrap };
    customers = { customerPortal: { create: portal } };
    constructor(opts: unknown) {
      ctor(opts);
    }
  },
}));

const ENV = { ...process.env };

async function freshClient() {
  vi.resetModules();
  return (await import('@/shared/lib/dodo')).dodo;
}

describe('dodo client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DODO_PAYMENTS_API_KEY = 'key';
    process.env.DODO_PAYMENTS_WEBHOOK_KEY = 'whsec_test';
    process.env.DODO_MONTHLY_PRODUCT_ID = 'pdt_month';
    process.env.DODO_YEARLY_PRODUCT_ID = 'pdt_year';
    process.env.APP_URL = 'https://club.example/';
    delete process.env.DODO_PAYMENTS_ENVIRONMENT;
  });
  afterEach(() => {
    process.env = { ...ENV };
  });

  it('defaults to test mode and switches to live via env only', async () => {
    let dodo = await freshClient();
    expect(dodo.environment).toBe('test_mode');
    process.env.DODO_PAYMENTS_ENVIRONMENT = 'live_mode';
    dodo = await freshClient();
    expect(dodo.environment).toBe('live_mode');
    create.mockResolvedValueOnce({ session_id: 's', checkout_url: 'u' });
    await dodo.createCheckout({ productId: 'p', email: 'e', name: 'n', userId: 'u', returnUrl: 'r', trialDays: 0 });
    expect(ctor).toHaveBeenCalledWith(expect.objectContaining({ environment: 'live_mode', bearerToken: 'key' }));
  });

  it('maps plans to product ids and back', async () => {
    const dodo = await freshClient();
    expect(dodo.productIdFor('monthly')).toBe('pdt_month');
    expect(dodo.productIdFor('yearly')).toBe('pdt_year');
    expect(dodo.planForProduct('pdt_year')).toBe('yearly');
    expect(dodo.planForProduct('other')).toBeNull();
  });

  it('builds app urls without double slashes', async () => {
    expect((await freshClient()).appUrl('/plans?checkout=success')).toBe('https://club.example/plans?checkout=success');
  });

  it('creates a checkout session with customer, metadata, return url and trial override', async () => {
    const dodo = await freshClient();
    create.mockResolvedValueOnce({ session_id: 'cks_1', checkout_url: 'https://test.checkout.dodopayments.com/cks_1' });
    const url = await dodo.createCheckout({
      productId: 'pdt_year', email: 'a@b.c', name: 'Ana', userId: 'u1', returnUrl: 'https://club.example/plans', trialDays: 4,
    });
    expect(url).toBe('https://test.checkout.dodopayments.com/cks_1');
    expect(create).toHaveBeenCalledWith({
      product_cart: [{ product_id: 'pdt_year', quantity: 1 }],
      customer: { email: 'a@b.c', name: 'Ana' },
      metadata: { userId: 'u1' },
      return_url: 'https://club.example/plans',
      subscription_data: { trial_period_days: 4 },
    });
  });

  it('returns the event for a valid signature and null otherwise', async () => {
    const dodo = await freshClient();
    unwrap.mockReturnValueOnce({ type: 'subscription.active', timestamp: 't', data: { subscription_id: 'sub' } });
    expect(dodo.verifyWebhook('{}', { 'webhook-id': '1' })).toEqual({ type: 'subscription.active', timestamp: 't', data: { subscription_id: 'sub' } });
    expect(unwrap).toHaveBeenCalledWith('{}', { headers: { 'webhook-id': '1' }, key: 'whsec_test' });

    unwrap.mockImplementationOnce(() => {
      throw new Error('No matching signature found');
    });
    expect(dodo.verifyWebhook('{}', {})).toBeNull();
  });

  it('rejects every webhook when no secret is configured', async () => {
    delete process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    const dodo = await freshClient();
    expect(dodo.verifyWebhook('{}', {})).toBeNull();
    expect(unwrap).not.toHaveBeenCalled();
  });

  it('creates a customer portal link', async () => {
    const dodo = await freshClient();
    portal.mockResolvedValueOnce({ link: 'https://portal' });
    expect(await dodo.createPortalLink('cus_1')).toBe('https://portal');
    expect(portal).toHaveBeenCalledWith('cus_1');
  });
});
