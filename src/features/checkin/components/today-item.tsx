'use client';
import { Check } from 'lucide-react';

import { TodayItem as TodayItemType } from '@/features/checkin/types/checkin.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CHALLENGE_KIND_LABELS, MONTHLY_EXCEPTIONS_ALLOWED } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';
import { exceptionNoun } from '@/shared/utils/challenge-rules';

type TodayItemProps = {
  item: TodayItemType;
  onSelect: (item: TodayItemType) => void;
  onException: (item: TodayItemType) => void;
};

export function allowanceUsed(item: TodayItemType): boolean {
  return (item.exceptionsUsed ?? 0) >= (item.exceptionsAllowed ?? MONTHLY_EXCEPTIONS_ALLOWED);
}

function kindLabel(item: TodayItemType): string {
  return item.kind === 'custom' ? 'Custom' : CHALLENGE_KIND_LABELS[item.kind];
}

function allowanceStatus(item: TodayItemType): string {
  const noun = exceptionNoun(item.key);
  const label = noun.charAt(0).toUpperCase() + noun.slice(1);
  const over = (item.exceptionsUsed ?? 0) > (item.exceptionsAllowed ?? MONTHLY_EXCEPTIONS_ALLOWED);
  if (item.exception && over) return `Extra ${noun} logged — your counter restarts at Day 1 tomorrow`;
  if (allowanceUsed(item)) return `${label} used this month — another one resets your counter`;
  return `${label} available this month`;
}

export const TodayItem = ({ item, onSelect, onException }: TodayItemProps) => {
  const monthly = item.kind === 'monthly';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        item.done ? 'border-success/40 bg-success/10' : 'border-border bg-card'
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-pressed={item.done}
        className={cn(
          'flex w-full items-center gap-4 px-4 py-4 text-left transition-all active:scale-95',
          !item.done && 'hover:bg-primary/5'
        )}
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            item.done ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/40'
          )}
        >
          {item.done && <Check className="size-5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted-foreground">{kindLabel(item)}</span>
          <span className="flex items-center gap-2">
            <span className={cn('block truncate font-semibold', item.done && 'text-muted-foreground line-through')}>
              {item.title}
            </span>
            {item.exception && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                {exceptionNoun(item.key)}
              </Badge>
            )}
          </span>
          {monthly && !item.done && (
            <span className="mt-1 block text-sm text-muted-foreground">Tap when you stayed clean today</span>
          )}
          {item.comment && <span className="mt-1 block truncate text-sm text-muted-foreground">{item.comment}</span>}
        </span>
      </button>
      {monthly && (
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <span className={cn('text-xs', allowanceUsed(item) ? 'text-destructive' : 'text-muted-foreground')}>
            {allowanceStatus(item)}
          </span>
          {!item.done && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full active:scale-95"
              onClick={() => onException(item)}
            >
              Use monthly {exceptionNoun(item.key)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
