import { TeamGridRow } from '@/features/team/types/team.types';
import { WEEKDAY_LETTERS, WEEKDAYS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type TeamGridProps = {
  rows: TeamGridRow[];
  total: number;
  todayIndex: number;
};

export const TeamGrid = ({ rows, total, todayIndex }: TeamGridProps) => {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">Members scheduled per shared challenge and weekday</caption>
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Challenge
            </th>
            {WEEKDAY_LETTERS.map((letter, d) => (
              <th
                key={d}
                scope="col"
                abbr={WEEKDAYS[d]}
                className={cn('w-11 px-1 py-2 text-center text-xs font-bold', d === todayIndex ? 'bg-accent text-primary' : 'text-muted-foreground')}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              <th scope="row" className="max-w-36 truncate px-3 py-2.5 text-left font-semibold">
                {row.title}
              </th>
              {row.counts.map((count, d) => {
                const everyone = count === total;
                return (
                  <td key={d} className={cn('px-1 py-2.5 text-center', d === todayIndex && 'bg-accent')}>
                    {count === 0 ? (
                      <span className="text-muted-foreground" aria-label="Nobody">–</span>
                    ) : (
                      <span className="flex flex-col items-center gap-0.5">
                        <span
                          className={cn('size-2 rounded-full', everyone ? 'bg-success' : 'border border-muted-foreground')}
                          aria-hidden
                        />
                        <span className={cn('font-mono text-xs', everyone ? 'font-bold text-foreground' : 'text-muted-foreground')}>
                          {count}/{total}
                        </span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
