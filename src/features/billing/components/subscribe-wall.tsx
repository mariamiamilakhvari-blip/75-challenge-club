'use client';
import { Lock } from 'lucide-react';

import { PlanOptions } from '@/features/billing/components/plan-options';

export const SubscribeWall = () => {
  return (
    <div className="animate-rise space-y-6 pt-4">
      <div className="space-y-2 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-6" aria-hidden />
        </span>
        <h2 className="text-2xl font-extrabold">Subscribe to continue</h2>
        <p className="text-sm text-muted-foreground">
          Your free week is over. Your streak, team, plans and check-ins are all saved — pick a plan to keep going.
        </p>
      </div>
      <PlanOptions trialDaysLeft={0} />
    </div>
  );
};
