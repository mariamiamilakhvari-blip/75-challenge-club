'use client';
import { Check } from 'lucide-react';

import { TodayItem as TodayItemType } from '@/features/checkin/types/checkin.types';
import { cn } from '@/shared/lib/utils';

type TodayItemProps = {
  item: TodayItemType;
  onSelect: (item: TodayItemType) => void;
};

export const TodayItem = ({ item, onSelect }: TodayItemProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-pressed={item.done}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all active:scale-95',
        item.done ? 'border-success/40 bg-success/10' : 'border-border bg-card hover:border-primary/40'
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
        <span className={cn('block font-semibold', item.done && 'text-muted-foreground line-through')}>
          {item.title}
        </span>
        {item.comment && <span className="mt-1 block truncate text-sm text-muted-foreground">{item.comment}</span>}
      </span>
    </button>
  );
};
