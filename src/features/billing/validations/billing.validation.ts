import { z } from 'zod';

export const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export type CheckoutType = z.infer<typeof CheckoutSchema>;

// Fields of a Dodo `subscription.*` webhook payload the app relies on.
export const SubscriptionPayloadSchema = z.object({
  subscription_id: z.string().min(1),
  status: z.string(),
  product_id: z.string(),
  created_at: z.string(),
  next_billing_date: z.string().nullish(),
  expires_at: z.string().nullish(),
  trial_period_days: z.number().nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
  customer: z.object({ customer_id: z.string().optional(), email: z.string().optional() }).nullish(),
});

export type SubscriptionPayload = z.infer<typeof SubscriptionPayloadSchema>;
