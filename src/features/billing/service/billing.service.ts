import { UserDocument } from '@/features/auth/schema/user.schema';
import { billingRepository } from '@/features/billing/repository/billing.repository';
import {
  BillingPlan,
  BillingSummary,
  CheckoutResult,
  SubscriptionStatus,
} from '@/features/billing/types/billing.types';
import { CheckoutType, SubscriptionPayload, SubscriptionPayloadSchema } from '@/features/billing/validations/billing.validation';
import { CHECKOUT_SUCCESS_PARAM, PLANS_ROUTE } from '@/shared/const/billing.const';
import { dodo, DodoWebhookEvent } from '@/shared/lib/dodo';
import { ServiceResult } from '@/shared/types/common';
import { accessFor, trialEndFor } from '@/shared/utils/access';

const MS_PER_DAY = 86_400_000;
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function billingSummary(user: UserDocument, now: Date = new Date()): BillingSummary {
  const plan = user.subscriptionPlan === 'monthly' || user.subscriptionPlan === 'yearly' ? user.subscriptionPlan : null;
  return { ...accessFor(user, now), status: user.subscriptionStatus ?? 'none', plan };
}

/** Days of the in-app trial still unused; a paid plan's trial never stacks on top of it. */
export function remainingTrialDays(user: UserDocument, now: Date): number {
  if (user.subscriptionStatus && user.subscriptionStatus !== 'none') return 0;
  return Math.max(0, Math.ceil((trialEndFor(user, now).getTime() - now.getTime()) / MS_PER_DAY));
}

export async function createCheckoutService(
  userId: string,
  input: CheckoutType,
  now: Date = new Date()
): Promise<ServiceResult<CheckoutResult>> {
  const user = await billingRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const state = accessFor(user, now).state;
  if (state === 'active' || state === 'trialing') return { data: { error: 'ALREADY_SUBSCRIBED' }, status: 409 };

  const productId = dodo.productIdFor(input.plan);
  if (!productId || !dodo.isConfigured) return { data: { error: 'BILLING_NOT_CONFIGURED' }, status: 503 };

  const checkoutUrl = await dodo.createCheckout({
    productId,
    email: user.email,
    name: user.name,
    userId,
    returnUrl: dodo.appUrl(`${PLANS_ROUTE}?${CHECKOUT_SUCCESS_PARAM}=success`),
    trialDays: remainingTrialDays(user, now),
  });
  if (!checkoutUrl) return { data: { error: 'CHECKOUT_FAILED' }, status: 502 };
  return { data: { checkoutUrl }, status: 200 };
}

export async function createPortalService(userId: string): Promise<ServiceResult<{ url: string }>> {
  const user = await billingRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!user.dodoCustomerId) return { data: { error: 'NO_SUBSCRIPTION' }, status: 404 };
  if (!dodo.isConfigured) return { data: { error: 'BILLING_NOT_CONFIGURED' }, status: 503 };

  const url = await dodo.createPortalLink(user.dodoCustomerId);
  return { data: { url }, status: 200 };
}

/**
 * Maps Dodo's subscription status onto the app's.
 * null = leave the stored status alone (e.g. still pending payment).
 */
export function mapDodoStatus(payload: SubscriptionPayload, now: Date): SubscriptionStatus | null {
  if (payload.status === 'active') {
    const trialDays = payload.trial_period_days ?? 0;
    const trialEnd = Date.parse(payload.created_at) + trialDays * MS_PER_DAY;
    return trialDays > 0 && trialEnd > now.getTime() ? 'trialing' : 'active';
  }
  if (payload.status === 'cancelled') return 'cancelled';
  if (['expired', 'failed', 'on_hold', 'past_due', 'paused'].includes(payload.status)) return 'expired';
  return null;
}

async function findUserFor(payload: SubscriptionPayload): Promise<UserDocument | null> {
  const userId = payload.metadata?.userId;
  if (userId && OBJECT_ID_PATTERN.test(userId)) {
    const user = await billingRepository.findById(userId);
    if (user) return user;
  }
  const email = payload.customer?.email;
  return email ? billingRepository.findByEmail(email) : null;
}

const toDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

export async function handleDodoWebhookService(
  event: DodoWebhookEvent,
  now: Date = new Date()
): Promise<ServiceResult<{ handled: boolean }>> {
  if (!event.type.startsWith('subscription.')) return { data: { handled: false }, status: 200 };

  const parsed = SubscriptionPayloadSchema.safeParse(event.data);
  if (!parsed.success) return { data: { error: 'INVALID_PAYLOAD' }, status: 400 };
  const payload = parsed.data;

  const status = mapDodoStatus(payload, now);
  if (!status) return { data: { handled: false }, status: 200 };

  const user = await findUserFor(payload);
  // unknown customer: acknowledge so Dodo stops retrying
  if (!user) return { data: { handled: false }, status: 200 };

  const eventAt = new Date(event.timestamp);
  if (user.subscriptionEventAt && new Date(user.subscriptionEventAt) > eventAt) {
    return { data: { handled: false }, status: 200 };
  }

  const plan: BillingPlan | '' = dodo.planForProduct(payload.product_id) ?? '';
  await billingRepository.updateSubscription(user._id.toString(), {
    subscriptionStatus: status,
    subscriptionPlan: plan,
    subscriptionId: payload.subscription_id,
    dodoCustomerId: payload.customer?.customer_id ?? user.dodoCustomerId ?? '',
    subscriptionPeriodEnd: toDate(payload.expires_at) ?? toDate(payload.next_billing_date),
    subscriptionEventAt: eventAt,
  });
  return { data: { handled: true }, status: 200 };
}
