import { ALL_DAYS, MONTHLY_EXCEPTIONS_ALLOWED, WEEKDAYS } from '@/shared/const/challenge.const';
import { challengeKind } from '@/shared/utils/challenge-rules';

type DayLettersProps = {
  challengeKey: string;
  days: number[];
};

const PILL = 'rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary';

export const DayLetters = ({ challengeKey, days }: DayLettersProps) => {
  const kind = challengeKind(challengeKey);
  const everyDay = kind === 'daily' || kind === 'monthly' || days.length === ALL_DAYS.length;
  const sorted = [...days].sort((a, b) => a - b);

  return (
    <ul className="flex flex-wrap gap-1">
      {everyDay ? (
        <li className={PILL}>Every day</li>
      ) : (
        sorted.map((day) => (
          <li key={day} className={PILL}>
            {WEEKDAYS[day]}
          </li>
        ))
      )}
      {kind === 'monthly' && (
        <li className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {MONTHLY_EXCEPTIONS_ALLOWED} cheat/month
        </li>
      )}
    </ul>
  );
};
