'use client';
import { useTeamAction } from '@/features/team/hooks/use-team-action';
import { CreatePlanType, PlanReplyType } from '@/features/team/validations/plan.validation';
import { http } from '@/shared/lib/http';

export const usePlanActions = (onDone: () => Promise<void> | void) => {
  const { run, pending, error } = useTeamAction(onDone);

  return {
    pending,
    error,
    createPlan: (input: CreatePlanType) => run('create', () => http.post('/teams/plans', input)),
    reply: (planId: string, input: PlanReplyType) => run(`reply:${planId}`, () => http.post(`/teams/plans/${planId}/replies`, input)),
    toggleJoin: (planId: string) => run(`join:${planId}`, () => http.post(`/teams/plans/${planId}/join`)),
    removePlan: (planId: string) => run(`delete:${planId}`, () => http.delete(`/teams/plans/${planId}`)),
  };
};
