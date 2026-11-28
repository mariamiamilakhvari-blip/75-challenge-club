'use client';
import { MemberDot } from '@/features/team/components/member-dot';
import { CellStatus, TeamGridRow, TeamMember } from '@/features/team/types/team.types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { WEEKDAYS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type CellSheetProps = {
  row: TeamGridRow | null;
  dayIndex: number;
  members: TeamMember[];
  onClose: () => void;
};

const STATUS_LABELS: Record<CellStatus, string> = {
  done: 'Done',
  pending: 'Not yet',
  missed: 'Missed',
  upcoming: 'Scheduled',
};

const STATUS_STYLES: Record<CellStatus, string> = {
  done: 'bg-success/15 text-success',
  pending: 'bg-primary/10 text-primary',
  missed: 'bg-muted text-muted-foreground',
  upcoming: 'bg-muted text-muted-foreground',
};

export const CellSheet = ({ row, dayIndex, members, onClose }: CellSheetProps) => {
  const cell = row?.cells[dayIndex];
  const memberById = new Map(members.map((m) => [m.id, m]));
  const date = cell ? new Date(`${cell.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="text-xl font-extrabold">{row?.title}</SheetTitle>
          <SheetDescription>
            {WEEKDAYS[dayIndex]} · {date}
          </SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-3 px-4">
          {cell?.members.map((m) => {
            const member = memberById.get(m.userId);
            return (
              <li key={m.userId} className="flex items-start gap-3 rounded-2xl border bg-card p-3">
                <MemberDot name={member?.name ?? '?'} status={m.status} isMe={member?.isMe} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{member?.isMe ? 'You' : (member?.name ?? 'Someone')}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[m.status])}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </div>
                  {m.comment && <p className="mt-1 text-sm text-muted-foreground">“{m.comment}”</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
