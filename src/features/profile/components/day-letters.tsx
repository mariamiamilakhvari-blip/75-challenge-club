import { WEEKDAYS, WEEKDAY_LETTERS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type DayLettersProps = {
  days: number[];
};

export const DayLetters = ({ days }: DayLettersProps) => {
  return (
    <div className="flex gap-1" aria-label={days.map((day) => WEEKDAYS[day]).join(', ')}>
      {WEEKDAY_LETTERS.map((letter, day) => (
        <span
          key={WEEKDAYS[day]}
          aria-hidden="true"
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs font-bold',
            days.includes(day) ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50'
          )}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};
