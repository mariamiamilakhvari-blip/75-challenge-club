'use client';
import { Settings } from 'lucide-react';

import { useCheckout } from '@/features/billing/hooks/use-checkout';
import { Button } from '@/shared/components/ui/button';

export const ManageSubscriptionButton = () => {
  const { openPortal, error } = useCheckout();

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => void openPortal()} className="h-12 w-full rounded-full text-base font-semibold active:scale-95">
        <Settings aria-hidden />
        Manage subscription
      </Button>
      <p className="text-center text-xs text-muted-foreground">Change plan, update your card or cancel on Dodo Payments.</p>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};
