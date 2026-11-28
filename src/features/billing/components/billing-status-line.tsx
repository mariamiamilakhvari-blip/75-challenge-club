import { BillingSummary } from '@/features/billing/types/billing.types';
import { PLAN_OPTIONS } from '@/shared/const/billing.const';
import { cn } from '@/shared/lib/utils';

type BillingStatusLineProps = {
  billing: BillingSummary;
  className?: string;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export function billingStatusText(billing: BillingSummary): string {
  const plan = PLAN_OPTIONS.find((option) => option.id === billing.plan)?.name ?? 'Plan';
  const days = `${billing.daysLeft} ${billing.daysLeft === 1 ? 'day' : 'days'} left`;
  switch (billing.state) {
    case 'trial':
      return `Free trial · ${days}`;
    case 'trialing':
      return `${plan} · trial, ${days}`;
    case 'active':
      return billing.periodEnd ? `${plan} · renews ${formatDate(billing.periodEnd)}` : `${plan} · active`;
    case 'cancelled':
      return `${plan} cancelled · access until ${formatDate(billing.periodEnd)}`;
    default:
      return billing.status === 'expired' ? 'Subscription ended' : 'Free trial ended';
  }
}

export const BillingStatusLine = ({ billing, className }: BillingStatusLineProps) => {
  return (
    <p className={cn('text-sm font-semibold', billing.hasAccess ? 'text-foreground' : 'text-destructive', className)}>
      {billingStatusText(billing)}
    </p>
  );
};
