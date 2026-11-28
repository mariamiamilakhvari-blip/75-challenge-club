'use client';
import { useTeamAction } from '@/features/team/hooks/use-team-action';
import { ProposeDaysType } from '@/features/team/validations/day-proposal.validation';
import { http } from '@/shared/lib/http';

export const useDayProposalActions = (onDone: () => Promise<void> | void) => {
  const { run, pending, error } = useTeamAction(onDone);

  return {
    pending,
    error,
    propose: (input: ProposeDaysType) => run('propose', () => http.post('/teams/proposals', input)),
    respond: (proposalId: string, accept: boolean) =>
      run(accept ? 'accept' : 'decline', () => http.post(`/teams/proposals/${proposalId}/respond`, { accept })),
  };
};
