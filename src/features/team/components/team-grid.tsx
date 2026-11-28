import { ChevronRight } from 'lucide-react';

import { MemberDot } from '@/features/team/components/member-dot';
import { TeamGridRow, TeamMember } from '@/features/team/types/team.types';
import { WEEKDAY_LETTERS, WEEKDAYS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type TeamGridProps = {
  rows: TeamGridRow[];
  members: TeamMember[];
  todayIndex: number;
  onOpenChallenge: (key: string) => void;
  onOpenCell: (key: string, dayIndex: number) => void;
};

const STATUS_WORDS = { done: 'done', pending: 'not yet', missed: 'missed', upcoming: 'scheduled' } as const;

function rowSubtitle(row: TeamGridRow, total: number): string | null {
  if (row.proposal) {
    const days = row.proposal.days.map((d) => WEEKDAYS[d]).join(', ');
    return `Together: ${days} · ${row.proposal.acceptedIds.length}/${total} in`;
  }
  if (row.requiredDays) return 'Tap to pick days together';
  return row.label;
}

export const TeamGrid = ({ rows, members, todayIndex, onOpenChallenge, onOpenCell }: TeamGridProps) => {
  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Who did each shared challenge on each day this week</caption>
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Challenge
            </th>
            {WEEKDAY_LETTERS.map((letter, d) => (
              <th key={d} scope="col" abbr={WEEKDAYS[d]} className="w-10 px-0.5 py-2 text-center text-xs font-bold">
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full',
                    d === todayIndex ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  {letter}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const subtitle = rowSubtitle(row, members.length);
            const needsVote = row.proposal !== null && row.proposal.myResponse === null;
            return (
              <tr key={row.key} className="border-t">
                <th scope="row" className="max-w-28 p-0 text-left align-middle">
                  <button
                    type="button"
                    onClick={() => onOpenChallenge(row.key)}
                    className="flex w-full items-center gap-1 px-2.5 py-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{row.title}</span>
                        {needsVote && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Vote needed" />}
                      </span>
                      {subtitle && <span className="block truncate text-xs font-normal text-muted-foreground">{subtitle}</span>}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </th>
                {row.cells.map((cell, d) => {
                  const shared = row.proposal?.days.includes(d) ?? false;
                  const done = cell.members.filter((m) => m.status === 'done').length;
                  const label = `${row.title}, ${WEEKDAYS[d]}: ${cell.members
                    .map((m) => `${memberById.get(m.userId)?.name ?? 'Someone'} ${STATUS_WORDS[m.status]}`)
                    .join(', ') || 'nobody scheduled'}`;
                  return (
                    <td
                      key={cell.date}
                      className={cn('p-0.5 text-center align-middle', shared && 'bg-primary/10', d === todayIndex && !shared && 'bg-muted/50')}
                    >
                      {cell.members.length === 0 ? (
                        <span className="text-muted-foreground" aria-label={label}>–</span>
                      ) : (
                        <button
                          type="button"
                          aria-label={`${label}. ${done} of ${cell.members.length} done`}
                          onClick={() => onOpenCell(row.key, d)}
                          className="mx-auto grid grid-cols-2 gap-0.5 rounded-lg p-0.5 transition-transform active:scale-90"
                        >
                          {cell.members.map((m) => (
                            <MemberDot key={m.userId} name={memberById.get(m.userId)?.name ?? '?'} status={m.status} isMe={memberById.get(m.userId)?.isMe} />
                          ))}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-success" aria-hidden />Done</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full border border-muted-foreground/50" aria-hidden />Not yet</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary/10" aria-hidden />Shared days</span>
      </p>
    </div>
  );
};
