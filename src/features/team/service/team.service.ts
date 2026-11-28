import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { teamRepository } from '@/features/team/repository/team.repository';
import { ObjectIdSchema } from '@/features/team/validations/team.validation';
import { MAX_TEAM_SIZE } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';

async function leaveCurrentTeam(userId: string, teamId: string): Promise<void> {
  const team = await teamRepository.findById(teamId);
  if (!team) {
    await profileRepository.setTeamForUsers([userId], null);
    return;
  }
  const remaining = team.members.map((m) => m.toString()).filter((id) => id !== userId);
  if (remaining.length <= 1) {
    await teamRepository.deleteById(teamId);
    await profileRepository.setTeamForUsers([userId, ...remaining], null);
    return;
  }
  await teamRepository.removeMember(teamId, userId);
  await profileRepository.setTeamForUsers([userId], null);
}

export async function joinTeamService(userId: string, targetId: string): Promise<ServiceResult<{ teamId: string }>> {
  if (userId === targetId) return { data: { error: 'INVALID_TARGET' }, status: 400 };

  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!viewer.published) return { data: { error: 'NOT_PUBLISHED' }, status: 403 };

  const target = await profileRepository.findById(targetId);
  if (!target || !target.published) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const viewerTeamId = viewer.teamId ? viewer.teamId.toString() : null;
  const targetTeamId = target.teamId ? target.teamId.toString() : null;
  if (targetTeamId && targetTeamId === viewerTeamId) return { data: { teamId: targetTeamId }, status: 200 };

  const targetTeam = targetTeamId ? await teamRepository.findById(targetTeamId) : null;
  if (targetTeam && targetTeam.members.length >= MAX_TEAM_SIZE) return { data: { error: 'TEAM_FULL' }, status: 409 };

  if (viewerTeamId) await leaveCurrentTeam(userId, viewerTeamId);

  if (targetTeam) {
    const teamId = targetTeam._id.toString();
    await teamRepository.addMember(teamId, userId);
    await profileRepository.setTeamForUsers([userId], teamId);
    return { data: { teamId }, status: 200 };
  }

  const teamId = await teamRepository.create([targetId, userId]);
  await profileRepository.setTeamForUsers([targetId, userId], teamId);
  return { data: { teamId }, status: 200 };
}

export async function leaveTeamService(userId: string): Promise<ServiceResult<{ left: boolean }>> {
  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!viewer.teamId) return { data: { error: 'NO_TEAM' }, status: 404 };
  await leaveCurrentTeam(userId, viewer.teamId.toString());
  return { data: { left: true }, status: 200 };
}

type TeamContext = { viewer: UserDocument; teamId: string; memberIds: string[] };

export type TeamContextResult = { ok: true; context: TeamContext } | { ok: false; error: ServiceResult<never> };

// Loads the viewer and their team; shared by board, plan and proposal services.
export async function loadTeamContext(userId: string): Promise<TeamContextResult> {
  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { ok: false, error: { data: { error: 'NOT_FOUND' }, status: 404 } };
  if (!viewer.teamId) return { ok: false, error: { data: { error: 'NO_TEAM' }, status: 404 } };

  const team = await teamRepository.findById(viewer.teamId.toString());
  if (!team) return { ok: false, error: { data: { error: 'NO_TEAM' }, status: 404 } };

  const memberIds = team.members.map((m) => m.toString());
  return { ok: true, context: { viewer, teamId: team._id.toString(), memberIds } };
}

export async function toggleJoinService(userId: string, checkInId: string): Promise<ServiceResult<{ joined: boolean }>> {
  if (!ObjectIdSchema.safeParse(checkInId).success) return { data: { error: 'INVALID_ID' }, status: 400 };

  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!viewer.teamId) return { data: { error: 'NOT_TEAMMATE' }, status: 403 };

  const checkIn = await checkInRepository.findById(checkInId);
  if (!checkIn) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const ownerId = checkIn.userId.toString();
  if (ownerId === userId) return { data: { error: 'OWN_CHECKIN' }, status: 400 };

  const owner = await profileRepository.findById(ownerId);
  if (!owner?.teamId || owner.teamId.toString() !== viewer.teamId.toString()) {
    return { data: { error: 'NOT_TEAMMATE' }, status: 403 };
  }

  if (checkIn.joiners.some((j) => j.toString() === userId)) {
    await checkInRepository.removeJoiner(checkInId, userId);
    return { data: { joined: false }, status: 200 };
  }
  await checkInRepository.addJoiner(checkInId, userId);
  return { data: { joined: true }, status: 200 };
}
