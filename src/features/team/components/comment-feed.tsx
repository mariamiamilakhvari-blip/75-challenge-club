import { Hand, MessageCircle } from 'lucide-react';

import { TeamComment } from '@/features/team/types/team.types';
import { Button } from '@/shared/components/ui/button';
import { addDays } from '@/shared/utils/date';

type CommentFeedProps = {
  comments: TeamComment[];
  today: string;
  pendingId: string | null;
  onToggle: (id: string) => void;
};

function dateLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const CommentFeed = ({ comments, today, pendingId, onToggle }: CommentFeedProps) => {
  if (comments.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
        <MessageCircle className="size-4" aria-hidden />
        No plans shared in the last few days. Add a comment when you check in.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <li key={c.id} className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{c.isMine ? 'You' : c.userName}</span>
            {' · '}
            {c.challengeTitle}
            {' · '}
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
                disabled={pendingId === c.id}
                onClick={() => onToggle(c.id)}
              >
                <Hand aria-hidden />
                {c.joinedByMe ? "I'm in ✓" : "I'm in"}
              </Button>
            )}
            {c.joiners.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Joining: {c.joiners.map((j) => j.name).join(', ')}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
