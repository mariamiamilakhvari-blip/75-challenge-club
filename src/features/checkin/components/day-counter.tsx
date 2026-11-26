import { Trophy } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { CHALLENGE_LENGTH_DAYS } from '@/shared/const/challenge.const';

type DayCounterProps = {
  day: number;
  completed: boolean;
};

export const DayCounter = ({ day, completed }: DayCounterProps) => {
  const percent = Math.round((day / CHALLENGE_LENGTH_DAYS) * 100);

  return (
    <Card className="gap-4 rounded-2xl border-0 bg-primary/10 px-6 py-6 shadow-none animate-rise animate-rise-1">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Day</p>
          <p className="font-mono text-7xl font-bold leading-none text-foreground">{day}</p>
        </div>
        <p className="pb-1 text-sm text-muted-foreground">
          of <span className="font-mono font-semibold text-foreground">{CHALLENGE_LENGTH_DAYS}</span>
        </p>
      </div>
      <Progress value={percent} aria-label={`Day ${day} of ${CHALLENGE_LENGTH_DAYS}`} className="h-3" />
      {completed && (
        <div className="flex items-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-bold text-success-foreground">
          <Trophy className="size-4" />
          Challenge complete 🏆
        </div>
      )}
    </Card>
  );
};
