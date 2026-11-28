import { Suspense } from 'react';

import { PlansScreen } from '@/features/billing/components/plans-screen';

export default function PlansPage() {
  return (
    <Suspense>
      <PlansScreen />
    </Suspense>
  );
}
