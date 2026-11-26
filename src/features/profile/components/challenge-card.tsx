'use client';
import { Check, X } from 'lucide-react';

import { DayToggles } from '@/features/profile/components/day-toggles';
import { cn } from '@/shared/lib/utils';

type ChallengeCardProps = {
  title: string;
  hint?: string;
  selected: boolean;
  custom?: boolean;
  days: number[];
  onToggleSelected: () => void;
  onToggleDay: (day: number) => void;
};

export const ChallengeCard = ({
  title,
  hint,
  selected,
  custom = false,
  days,
  onToggleSelected,
  onToggleDay,
}: ChallengeCardProps) => {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card shadow-sm transition-colors',
        selected ? 'border-primary' : 'border-border'
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        onClick={onToggleSelected}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-muted/40"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
          )}
        >
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-foreground">{title}</span>
          {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
          {custom && !hint && <span className="mt-0.5 block text-xs text-muted-foreground">Custom · tap to remove</span>}
        </span>
        {custom && <X className="size-4 text-muted-foreground" aria-hidden="true" />}
      </button>

      {selected && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <DayToggles days={days} onToggle={onToggleDay} />
        </div>
      )}
    </div>
  );
};
