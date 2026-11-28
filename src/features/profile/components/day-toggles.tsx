'use client';
import { WEEKDAYS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type DayTogglesProps = {
  days: number[];
  onToggle: (day: number) => void;
  // when set, unselected days are disabled once this many are picked
  max?: number;
};

export const DayToggles = ({ days, onToggle, max }: DayTogglesProps) => {
  const full = max !== undefined && days.length >= max;

  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days of the week">
      {WEEKDAYS.map((label, day) => {
        const on = days.includes(day);
        const disabled = full && !on;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onToggle(day)}
            className={cn(
              'flex h-9 items-center justify-center rounded-full text-xs font-bold transition-all active:scale-90',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
              on ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
