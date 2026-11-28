export const APP_TRIAL_DAYS = 7;

export type PlanOption = {
  id: 'monthly' | 'yearly';
  name: string;
  price: string;
  period: string;
  // small line under the price
  detail: string;
  badge: string | null;
};

export const PLAN_OPTIONS: PlanOption[] = [
  { id: 'yearly', name: 'Yearly', price: '$39.99', period: 'year', detail: 'Just $3.33 a month', badge: 'Save 33%' },
  { id: 'monthly', name: 'Monthly', price: '$4.99', period: 'month', detail: 'Cancel anytime', badge: null },
];

export const PLANS_ROUTE = '/plans';

export const CHECKOUT_SUCCESS_PARAM = 'checkout';

export const SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED';
