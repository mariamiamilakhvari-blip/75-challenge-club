'use client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { BillingStatusLine } from '@/features/billing/components/billing-status-line';
import { ManageSubscriptionButton } from '@/features/billing/components/manage-subscription-button';
import { PlanOptions } from '@/features/billing/components/plan-options';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { PageHeader } from '@/shared/components/layout/page-header';
import { CHECKOUT_SUCCESS_PARAM } from '@/shared/const/billing.const';

const POLL_MS = 3000;
const MAX_POLLS = 10;

export const PlansScreen = () => {
  const { profile, loading, reload } = useMyProfile();
  const justPaid = useSearchParams().get(CHECKOUT_SUCCESS_PARAM) === 'success';
  const polls = useRef(0);
  const billing = profile?.billing;
  const subscribed = billing?.state === 'active' || billing?.state === 'trialing';

  // the webhook can land a few seconds after Dodo redirects back; refresh until it does
  useEffect(() => {
    if (!justPaid || subscribed || polls.current >= MAX_POLLS) return;
    const timer = setTimeout(() => {
      polls.current += 1;
      void reload();
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [justPaid, subscribed, profile, reload]);

  return (
    <>
      <PageHeader title="Plans" subtitle="Full access to check-ins, your team and Discover." />
      <div className="space-y-5">
        {justPaid && (
          <div role="status" className="animate-rise flex items-start gap-3 rounded-2xl bg-success/15 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-bold text-foreground">Payment successful — welcome to the club!</p>
              <p className="text-muted-foreground">
                {subscribed ? 'Your plan is active.' : 'Activating your plan, this takes a few seconds…'}
              </p>
            </div>
          </div>
        )}

        {!billing ? (
          loading && <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" aria-label="Loading" />
        ) : (
          <>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your plan</p>
              <BillingStatusLine billing={billing} className="mt-1 text-base" />
            </div>
            {subscribed ? (
              <ManageSubscriptionButton />
            ) : (
              <PlanOptions trialDaysLeft={billing.state === 'trial' ? billing.daysLeft : 0} />
            )}
          </>
        )}
      </div>
    </>
  );
};
