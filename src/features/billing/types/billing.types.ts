export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'cancelled' | 'expired';

export type BillingPlan = 'monthly' | 'yearly';

// trial: in-app free week · trialing: Dodo trial on a paid plan · active: paid
// cancelled: paid until period end · locked: no access (data kept)
export type AccessState = 'trial' | 'trialing' | 'active' | 'cancelled' | 'locked';

export type AccessInfo = {
  hasAccess: boolean;
  state: AccessState;
  // end of the in-app trial (ISO)
  trialEndsAt: string;
  // end of the paid / Dodo-trial period, when known (ISO)
  periodEnd: string | null;
  // whole days left in the current trial or period; 0 when locked
  daysLeft: number;
};

export type BillingSummary = AccessInfo & {
  status: SubscriptionStatus;
  plan: BillingPlan | null;
};

export type BillingUserFields = {
  createdAt?: Date | null;
  subscriptionStatus?: SubscriptionStatus | string | null;
  subscriptionPeriodEnd?: Date | null;
};

export type CheckoutResult = { checkoutUrl: string };
