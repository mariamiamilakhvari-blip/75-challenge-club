import { Hand } from 'lucide-react';

import { TeamComment } from '@/features/team/types/team.types';
import { Button } from '@/shared/components/ui/button';
import { addDays } from '@/shared/utils/date';

type CheckInCommentCardProps = {
  comment: TeamComment;
  today: string;
  pending: boolean;
  onToggle: (id: string) => void;
};

function dateLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const CheckInCommentCard = ({ comment: c, today, pending, onToggle }: CheckInCommentCardProps) => {
  return (
    <li className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{c.isMine ? 'You' : c.userName}</span>
        {' · checked in · '}
        {dateLabel(c.date, today)}
      </p>
      <p className="mt-1.5 text-base">“{c.comment}”</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!c.isMine && (
          <Button
            size="sm"
            variant={c.joinedByMe ? 'default' : 'outline'}
            className="rounded-full active:scale-95"
            aria-pressed={c.joinedByMe}
            disabled={pending}
            onClick={() => onToggle(c.id)}
          >
            <Hand aria-hidden />
            {c.joinedByMe ? "I'm in ✓" : "I'm in"}
          </Button>
        )}
        {c.joiners.length > 0 && <span className="text-xs text-muted-foreground">Joining: {c.joiners.map((j) => j.name).join(', ')}</span>}
      </div>
    </li>
  );
};
