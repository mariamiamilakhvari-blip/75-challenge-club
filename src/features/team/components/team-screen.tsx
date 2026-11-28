'use client';
import { useState } from 'react';

import { CellSheet } from '@/features/team/components/cell-sheet';
import { ChallengeSheet } from '@/features/team/components/challenge-sheet';
import { LeaveTeamButton } from '@/features/team/components/leave-team-button';
import { NoTeamState } from '@/features/team/components/no-team-state';
import { PlanFeed } from '@/features/team/components/plan-feed';
import { SharedEmpty } from '@/features/team/components/shared-empty';
import { TeamGrid } from '@/features/team/components/team-grid';
import { TeamHeader } from '@/features/team/components/team-header';
import { useDayProposalActions } from '@/features/team/hooks/use-day-proposal-actions';
import { usePlanActions } from '@/features/team/hooks/use-plan-actions';
import { useTeamBoard } from '@/features/team/hooks/use-team-board';
import { useToggleJoin } from '@/features/team/hooks/use-toggle-join';
import { PageHeader } from '@/shared/components/layout/page-header';
import { Button } from '@/shared/components/ui/button';
import { MAX_TEAM_SIZE } from '@/shared/const/challenge.const';

export const TeamScreen = () => {
  const { board, noTeam, loading, error, reload } = useTeamBoard();
  const { toggle, pendingId } = useToggleJoin(reload);
  const plans = usePlanActions(reload);
  const proposals = useDayProposalActions(reload);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [openCell, setOpenCell] = useState<{ key: string; day: number } | null>(null);

  if (loading) {
    return (
      <>
        <PageHeader title="Team" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-label="Loading team" />
      </>
    );
  }

  if (noTeam || !board) {
    return (
      <>
        <PageHeader title="Team" />
        {error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="rounded-full" onClick={() => void reload()}>
              Try again
            </Button>
          </div>
        ) : (
          <NoTeamState />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Team" subtitle={`${board.members.length} of ${MAX_TEAM_SIZE} members`} />
      <div className="flex flex-col gap-8">
        <TeamHeader members={board.members} />
        <section aria-labelledby="week-heading" className="flex flex-col gap-3 animate-rise animate-rise-2">
          <h2 id="week-heading" className="text-lg font-bold">This week together</h2>
          {board.grid.length > 0 ? (
            <TeamGrid
              rows={board.grid}
              members={board.members}
              todayIndex={board.todayIndex}
              onOpenChallenge={setOpenKey}
              onOpenCell={(key, day) => setOpenCell({ key, day })}
            />
          ) : (
            <SharedEmpty memberChallenges={board.memberChallenges} />
          )}
        </section>
        <section aria-labelledby="plans-heading" className="flex flex-col gap-3 animate-rise animate-rise-3">
          <h2 id="plans-heading" className="text-lg font-bold">Plans & comments</h2>
          <PlanFeed
            board={board}
            plans={plans}
            joinPendingId={pendingId}
            onToggleCheckInJoin={(id) => void toggle(id)}
            onOpenChallenge={setOpenKey}
          />
        </section>
        <LeaveTeamButton onLeft={reload} />
      </div>
      <ChallengeSheet
        board={board}
        challengeKey={openKey}
        plans={plans}
        proposals={proposals}
        joinPendingId={pendingId}
        onToggleCheckInJoin={(id) => void toggle(id)}
        onClose={() => setOpenKey(null)}
      />
      <CellSheet
        row={board.grid.find((r) => r.key === openCell?.key) ?? null}
        dayIndex={openCell?.day ?? 0}
        members={board.members}
        onClose={() => setOpenCell(null)}
      />
    </>
  );
};
