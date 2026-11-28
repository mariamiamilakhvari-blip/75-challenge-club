import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { dayProposalRepository } from '@/features/team/repository/day-proposal.repository';
import { loadTeamContext } from '@/features/team/service/team.service';
import { ProposeDaysType, RespondProposalType } from '@/features/team/validations/day-proposal.validation';
import { ObjectIdSchema } from '@/features/team/validations/team.validation';
import { ServiceResult } from '@/shared/types/common';
import { getPreset, normalizeDays } from '@/shared/utils/challenge-rules';

// Settle past days under the old schedule first, then switch to the shared days.
async function applySharedDays(user: UserDocument, challengeKey: string, days: number[]): Promise<void> {
  await syncStreak(user);
  await profileRepository.setChallengeDays(user._id.toString(), challengeKey, days);
}

export async function proposeDaysService(userId: string, input: ProposeDaysType): Promise<ServiceResult<{ id: string }>> {
  const loaded = await loadTeamContext(userId);
  if (!loaded.ok) return loaded.error;
  const { viewer, teamId, memberIds } = loaded.context;

  if (getPreset(input.challengeKey)?.kind !== 'scheduled') return { data: { error: 'NOT_SCHEDULED' }, status: 400 };

  const members = await profileRepository.findByIds(memberIds);
  if (!members.every((m) => m.challenges.some((c) => c.key === input.challengeKey))) {
    return { data: { error: 'NOT_SHARED' }, status: 400 };
  }

  const days = normalizeDays(input.challengeKey, input.days);
  if (!days) return { data: { error: 'INVALID_DAYS' }, status: 400 };

  // one open proposal per challenge: a new one replaces the old
  await dayProposalRepository.deleteByTeamAndChallenge(teamId, input.challengeKey);
  const id = await dayProposalRepository.create({ teamId, challengeKey: input.challengeKey, proposerId: userId, days });
  await applySharedDays(viewer, input.challengeKey, days);
  return { data: { id }, status: 201 };
}

export async function respondProposalService(
  userId: string,
  proposalId: string,
  input: RespondProposalType
): Promise<ServiceResult<{ accepted: boolean }>> {
  if (!ObjectIdSchema.safeParse(proposalId).success) return { data: { error: 'INVALID_ID' }, status: 400 };

  const loaded = await loadTeamContext(userId);
  if (!loaded.ok) return loaded.error;
  const { viewer, teamId } = loaded.context;

  const proposal = await dayProposalRepository.findById(proposalId);
  if (!proposal) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (proposal.teamId.toString() !== teamId) return { data: { error: 'NOT_TEAMMATE' }, status: 403 };

  if (!input.accept) {
    await dayProposalRepository.decline(proposalId, userId);
    return { data: { accepted: false }, status: 200 };
  }

  if (!viewer.challenges.some((c) => c.key === proposal.challengeKey)) {
    return { data: { error: 'NOT_YOUR_CHALLENGE' }, status: 400 };
  }
  await dayProposalRepository.accept(proposalId, userId);
  await applySharedDays(viewer, proposal.challengeKey, [...proposal.days]);
  return { data: { accepted: true }, status: 200 };
}
