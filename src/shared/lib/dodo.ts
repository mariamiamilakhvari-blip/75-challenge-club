import DodoPayments from 'dodopayments';

export type DodoEnvironment = 'test_mode' | 'live_mode';

export type CheckoutInput = {
  productId: string;
  email: string;
  name: string;
  userId: string;
  returnUrl: string;
  // overrides the product's trial; 0 = charge now
  trialDays: number;
};

export type DodoWebhookEvent = {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
};

/**
 * Thin wrapper over the Dodo Payments SDK.
 * Test vs live is only DODO_PAYMENTS_ENVIRONMENT (test_mode | live_mode);
 * keys and product IDs come from env, so switching modes needs no code change.
 */
class DodoPaymentsClient {
  private client: DodoPayments | null = null;

  get environment(): DodoEnvironment {
    return process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
  }

  productIdFor(plan: 'monthly' | 'yearly'): string | null {
    const id = plan === 'monthly' ? process.env.DODO_MONTHLY_PRODUCT_ID : process.env.DODO_YEARLY_PRODUCT_ID;
    return id?.trim() || null;
  }

  planForProduct(productId: string): 'monthly' | 'yearly' | null {
    if (productId === this.productIdFor('monthly')) return 'monthly';
    if (productId === this.productIdFor('yearly')) return 'yearly';
    return null;
  }

  appUrl(path: string): string {
    const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return `${base}${path}`;
  }

  get isConfigured(): boolean {
    return Boolean(process.env.DODO_PAYMENTS_API_KEY);
  }

  private sdk(): DodoPayments {
    if (!this.client) {
      this.client = new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY,
        webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
        environment: this.environment,
      });
    }
    return this.client;
  }

  async createCheckout(input: CheckoutInput): Promise<string | null> {
    const session = await this.sdk().checkoutSessions.create({
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: { email: input.email, name: input.name },
      metadata: { userId: input.userId },
      return_url: input.returnUrl,
      subscription_data: { trial_period_days: input.trialDays },
    });
    return session.checkout_url ?? null;
  }

  /** Link to Dodo's hosted portal where the customer can change or cancel their plan. */
  async createPortalLink(customerId: string): Promise<string> {
    const session = await this.sdk().customers.customerPortal.create(customerId);
    return session.link;
  }

  /** Verifies the Standard Webhooks signature; null when missing/invalid. */
  verifyWebhook(rawBody: string, headers: Record<string, string>): DodoWebhookEvent | null {
    if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) return null;
    try {
      const event = this.sdk().webhooks.unwrap(rawBody, { headers, key: process.env.DODO_PAYMENTS_WEBHOOK_KEY });
      return { type: event.type, timestamp: event.timestamp, data: { ...event.data } };
    } catch {
      return null;
    }
  }
}

export const dodo = new DodoPaymentsClient();
