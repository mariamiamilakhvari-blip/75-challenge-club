'use client';
import { CheckInCommentCard } from '@/features/team/components/checkin-comment-card';
import { PlanCard } from '@/features/team/components/plan-card';
import { PlanForm } from '@/features/team/components/plan-form';
import { SharedDaysPanel } from '@/features/team/components/shared-days-panel';
import { useDayProposalActions } from '@/features/team/hooks/use-day-proposal-actions';
import { usePlanActions } from '@/features/team/hooks/use-plan-actions';
import { TeamBoard } from '@/features/team/types/team.types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';

type ChallengeSheetProps = {
  board: TeamBoard;
  challengeKey: string | null;
  plans: ReturnType<typeof usePlanActions>;
  proposals: ReturnType<typeof useDayProposalActions>;
  joinPendingId: string | null;
  onToggleCheckInJoin: (id: string) => void;
  onClose: () => void;
};

export const ChallengeSheet = ({ board, challengeKey, plans, proposals, joinPendingId, onToggleCheckInJoin, onClose }: ChallengeSheetProps) => {
  const row = board.grid.find((r) => r.key === challengeKey) ?? null;
  const challengePlans = board.plans.filter((p) => p.challengeKey === challengeKey);
  const comments = board.comments.filter((c) => c.challengeKey === challengeKey);
  const error = plans.error ?? proposals.error;

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-screen max-w-md overflow-y-auto rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="text-xl font-extrabold">{row?.title}</SheetTitle>
          <SheetDescription>Plans, comments and shared days for your team.</SheetDescription>
        </SheetHeader>
        {row && (
          <div className="flex flex-col gap-4 px-4">
            {row.requiredDays !== null && (
              <SharedDaysPanel
                row={row}
                members={board.members}
                pending={proposals.pending}
                onPropose={proposals.propose}
                onRespond={(id, accept) => void proposals.respond(id, accept)}
              />
            )}
            <PlanForm challengeKey={row.key} busy={plans.pending === 'create'} onSubmit={plans.createPlan} />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {challengePlans.length + comments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">Nothing shared yet — be the first.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {challengePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    pending={plans.pending}
                    onToggleJoin={(id) => void plans.toggleJoin(id)}
                    onReply={plans.reply}
                    onDelete={(id) => void plans.removePlan(id)}
                  />
                ))}
                {comments.map((c) => (
                  <CheckInCommentCard key={c.id} comment={c} today={board.today} pending={joinPendingId === c.id} onToggle={onToggleCheckInJoin} />
                ))}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
