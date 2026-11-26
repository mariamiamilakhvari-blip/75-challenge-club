'use client';
import { CommentFeed } from '@/features/team/components/comment-feed';
import { LeaveTeamButton } from '@/features/team/components/leave-team-button';
import { NoTeamState } from '@/features/team/components/no-team-state';
import { SharedEmpty } from '@/features/team/components/shared-empty';
import { TeamGrid } from '@/features/team/components/team-grid';
import { TeamHeader } from '@/features/team/components/team-header';
import { useTeamBoard } from '@/features/team/hooks/use-team-board';
import { useToggleJoin } from '@/features/team/hooks/use-toggle-join';
import { PageHeader } from '@/shared/components/layout/page-header';
import { Button } from '@/shared/components/ui/button';
import { MAX_TEAM_SIZE } from '@/shared/const/challenge.const';

export const TeamScreen = () => {
  const { board, noTeam, loading, error, reload } = useTeamBoard();
  const { toggle, pendingId } = useToggleJoin(reload);

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
            <TeamGrid rows={board.grid} total={board.members.length} todayIndex={board.todayIndex} />
          ) : (
            <SharedEmpty memberChallenges={board.memberChallenges} />
          )}
        </section>
        <section aria-labelledby="plans-heading" className="flex flex-col gap-3 animate-rise animate-rise-3">
          <h2 id="plans-heading" className="text-lg font-bold">Plans & comments</h2>
          <CommentFeed comments={board.comments} today={board.today} pendingId={pendingId} onToggle={(id) => void toggle(id)} />
        </section>
        <LeaveTeamButton onLeft={reload} />
      </div>
    </>
  );
};
