import { planRepository } from '@/features/team/repository/plan.repository';
import { PlanDocument } from '@/features/team/schema/plan.schema';
import { loadTeamContext } from '@/features/team/service/team.service';
import { CreatePlanType, PlanReplyType } from '@/features/team/validations/plan.validation';
import { ObjectIdSchema } from '@/features/team/validations/team.validation';
import { ServiceResult } from '@/shared/types/common';
import { isJoinablePlan, normalizePlanDetails } from '@/shared/utils/plan-rules';

type PlanAccess = { ok: true; plan: PlanDocument } | { ok: false; error: ServiceResult<never> };

// Loads a plan the viewer may act on: it must belong to the viewer's current team.
async function loadTeamPlan(userId: string, planId: string): Promise<PlanAccess> {
  if (!ObjectIdSchema.safeParse(planId).success) return { ok: false, error: { data: { error: 'INVALID_ID' }, status: 400 } };

  const loaded = await loadTeamContext(userId);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const plan = await planRepository.findById(planId);
  if (!plan) return { ok: false, error: { data: { error: 'NOT_FOUND' }, status: 404 } };
  if (plan.teamId.toString() !== loaded.context.teamId) {
    return { ok: false, error: { data: { error: 'NOT_TEAMMATE' }, status: 403 } };
  }
  return { ok: true, plan };
}

export async function createPlanService(userId: string, input: CreatePlanType): Promise<ServiceResult<{ id: string }>> {
  const loaded = await loadTeamContext(userId);
  if (!loaded.ok) return loaded.error;
  const { viewer, teamId } = loaded.context;

  if (!viewer.challenges.some((c) => c.key === input.challengeKey)) {
    return { data: { error: 'NOT_YOUR_CHALLENGE' }, status: 400 };
  }

  const details = normalizePlanDetails(input.challengeKey, input);
  if (!details) return { data: { error: 'MISSING_FIELDS' }, status: 400 };

  const id = await planRepository.create({ teamId, userId, challengeKey: input.challengeKey, ...details });
  return { data: { id }, status: 201 };
}

export async function replyToPlanService(
  userId: string,
  planId: string,
  input: PlanReplyType
): Promise<ServiceResult<{ replied: boolean }>> {
  const access = await loadTeamPlan(userId, planId);
  if (!access.ok) return access.error;

  await planRepository.addReply(planId, userId, input.text.trim());
  return { data: { replied: true }, status: 201 };
}

export async function togglePlanJoinService(userId: string, planId: string): Promise<ServiceResult<{ joined: boolean }>> {
  const access = await loadTeamPlan(userId, planId);
  if (!access.ok) return access.error;
  const { plan } = access;

  if (plan.userId.toString() === userId) return { data: { error: 'OWN_PLAN' }, status: 400 };
  if (!isJoinablePlan(plan.challengeKey)) return { data: { error: 'NOT_JOINABLE' }, status: 400 };

  if (plan.joiners.some((j) => j.toString() === userId)) {
    await planRepository.removeJoiner(planId, userId);
    return { data: { joined: false }, status: 200 };
  }
  await planRepository.addJoiner(planId, userId);
  return { data: { joined: true }, status: 200 };
}

export async function deletePlanService(userId: string, planId: string): Promise<ServiceResult<{ deleted: boolean }>> {
  const access = await loadTeamPlan(userId, planId);
  if (!access.ok) return access.error;
  if (access.plan.userId.toString() !== userId) return { data: { error: 'FORBIDDEN' }, status: 403 };

  await planRepository.deleteById(planId);
  return { data: { deleted: true }, status: 200 };
}
