'use client';
import { useState } from 'react';

import { BillingPlan, CheckoutResult } from '@/features/billing/types/billing.types';
import { http } from '@/shared/lib/http';

const ERROR_MESSAGES: Record<string, string> = {
  ALREADY_SUBSCRIBED: 'You already have an active plan.',
  BILLING_NOT_CONFIGURED: 'Payments are not set up yet. Try again later.',
};

export const useCheckout = () => {
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sends the browser to Dodo's hosted checkout; it returns to /plans?checkout=success.
  const startCheckout = async (plan: BillingPlan) => {
    setPendingPlan(plan);
    setError(null);
    try {
      const { checkoutUrl } = await http.post<CheckoutResult>('/billing/checkout', { plan });
      window.location.assign(checkoutUrl);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setError(ERROR_MESSAGES[code] ?? 'Could not open checkout. Try again.');
      setPendingPlan(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    try {
      const { url } = await http.post<{ url: string }>('/billing/portal');
      window.location.assign(url);
    } catch {
      setError('Could not open subscription settings. Try again.');
    }
  };

  return { startCheckout, openPortal, pendingPlan, error };
};
