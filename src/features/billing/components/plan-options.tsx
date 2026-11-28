'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { useCheckout } from '@/features/billing/hooks/use-checkout';
import { BillingPlan } from '@/features/billing/types/billing.types';
import { Button } from '@/shared/components/ui/button';
import { PLAN_OPTIONS } from '@/shared/const/billing.const';
import { cn } from '@/shared/lib/utils';

type PlanOptionsProps = {
  // remaining in-app trial days carried into the paid plan
  trialDaysLeft: number;
};

export const PlanOptions = ({ trialDaysLeft }: PlanOptionsProps) => {
  const [selected, setSelected] = useState<BillingPlan>('yearly');
  const { startCheckout, pendingPlan, error } = useCheckout();
  const option = PLAN_OPTIONS.find((plan) => plan.id === selected);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Choose a plan" className="space-y-3">
        {PLAN_OPTIONS.map((plan) => {
          const on = plan.id === selected;
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(plan.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-sm transition-all active:scale-95',
                on ? 'border-primary' : 'border-border'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                )}
              >
                {on && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-bold">{plan.name}</span>
                  {plan.badge && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">{plan.badge}</span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">{plan.detail}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-lg font-bold">{plan.price}</span>
                <span className="block text-xs text-muted-foreground">/ {plan.period}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button
        type="button"
        disabled={pendingPlan !== null}
        onClick={() => void startCheckout(selected)}
        className="h-12 w-full rounded-full text-base font-semibold active:scale-95"
      >
        {pendingPlan ? 'Opening checkout…' : `Continue with ${option?.name ?? 'plan'}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {trialDaysLeft > 0
          ? `No charge until your free trial ends in ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'}.`
          : 'Billed today.'}{' '}
        Secure checkout by Dodo Payments. Cancel anytime.
      </p>
    </div>
  );
};
