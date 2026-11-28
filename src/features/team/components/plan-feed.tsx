'use client';
import { ChevronRight, MessageCircle } from 'lucide-react';

import { CheckInCommentCard } from '@/features/team/components/checkin-comment-card';
import { PlanCard } from '@/features/team/components/plan-card';
import { usePlanActions } from '@/features/team/hooks/use-plan-actions';
import { TeamBoard } from '@/features/team/types/team.types';

type PlanFeedProps = {
  board: TeamBoard;
  plans: ReturnType<typeof usePlanActions>;
  joinPendingId: string | null;
  onToggleCheckInJoin: (id: string) => void;
  onOpenChallenge: (key: string) => void;
};

// Latest plans and check-in comments, grouped by challenge in board order.
export const PlanFeed = ({ board, plans, joinPendingId, onToggleCheckInJoin, onOpenChallenge }: PlanFeedProps) => {
  const keys = [...new Set([...board.grid.map((r) => r.key), ...board.plans.map((p) => p.challengeKey), ...board.comments.map((c) => c.challengeKey)])];
  const groups = keys
    .map((key) => ({
      key,
      title:
        board.grid.find((r) => r.key === key)?.title ??
        board.plans.find((p) => p.challengeKey === key)?.challengeTitle ??
        board.comments.find((c) => c.challengeKey === key)?.challengeTitle ??
        key,
      inGrid: board.grid.some((r) => r.key === key),
      plans: board.plans.filter((p) => p.challengeKey === key),
      comments: board.comments.filter((c) => c.challengeKey === key),
    }))
    .filter((g) => g.plans.length + g.comments.length > 0);

  if (groups.length === 0) {
    return (
      <p className="flex items-start gap-2 rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
        <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        No plans yet. Tap a challenge on the board to share where you&apos;re training, what you&apos;re reading or where you&apos;re going.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.title} className="flex flex-col gap-2">
          {group.inGrid ? (
            <button type="button" onClick={() => onOpenChallenge(group.key)} className="flex items-center gap-1 self-start text-sm font-bold text-foreground">
              {group.title}
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </button>
          ) : (
            <h3 className="text-sm font-bold">{group.title}</h3>
          )}
          <ul className="flex flex-col gap-3">
            {group.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                pending={plans.pending}
                onToggleJoin={(id) => void plans.toggleJoin(id)}
                onReply={plans.reply}
                onDelete={(id) => void plans.removePlan(id)}
              />
            ))}
            {group.comments.map((c) => (
              <CheckInCommentCard key={c.id} comment={c} today={board.today} pending={joinPendingId === c.id} onToggle={onToggleCheckInJoin} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
