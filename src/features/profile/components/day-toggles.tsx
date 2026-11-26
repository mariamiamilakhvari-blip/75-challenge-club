'use client';
import { WEEKDAYS, WEEKDAY_LETTERS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type DayTogglesProps = {
  days: number[];
  onToggle: (day: number) => void;
};

export const DayToggles = ({ days, onToggle }: DayTogglesProps) => {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Weekdays">
      {WEEKDAY_LETTERS.map((letter, day) => {
        const on = days.includes(day);
        return (
          <button
            key={WEEKDAYS[day]}
            type="button"
            aria-pressed={on}
            aria-label={WEEKDAYS[day]}
            onClick={() => onToggle(day)}
            className={cn(
              'flex h-10 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-90',
              on ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};
