'use client';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { PLANS_ROUTE } from '@/shared/const/billing.const';

// Small reminder during the free week; hidden once the user is on a plan.
export const TrialBanner = () => {
  const { profile } = useMyProfile();
  const billing = profile?.billing;
  if (!billing || billing.state !== 'trial') return null;

  return (
    <Link
      href={PLANS_ROUTE}
      className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm transition-colors hover:bg-primary/15"
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="flex-1 font-medium">
        Free trial · {billing.daysLeft} {billing.daysLeft === 1 ? 'day' : 'days'} left
      </span>
      <span className="font-semibold text-primary">See plans</span>
    </Link>
  );
};
