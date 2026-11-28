import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { teamRepository } from '@/features/team/repository/team.repository';
import { toUserChallenges } from '@/features/team/service/discover.service';
import { TeamBoard, TeamComment, TeamGridRow } from '@/features/team/types/team.types';
import { ObjectIdSchema } from '@/features/team/validations/team.validation';
import { ALL_DAYS, MAX_TEAM_SIZE, MONTHLY_EXCEPTIONS_ALLOWED } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';
import { challengeKind, getPreset } from '@/shared/utils/challenge-rules';
import { addDays, todayInTimezone, weekdayIndex } from '@/shared/utils/date';

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

function rowLabel(key: string): string | null {
  const kind = challengeKind(key);
  if (kind === 'daily') return 'Every day';
  if (kind === 'monthly') return `Every day · ${MONTHLY_EXCEPTIONS_ALLOWED}/month allowance`;
  return null;
}

export function buildGrid(viewer: UserDocument, members: UserDocument[]): TeamGridRow[] {
  return viewer.challenges
    .filter((c) => members.every((m) => m.challenges.some((mc) => mc.key === c.key)))
    .map((c) => ({
      key: c.key,
      title: getPreset(c.key)?.title ?? c.title,
      kind: challengeKind(c.key),
      label: rowLabel(c.key),
      counts: ALL_DAYS.map(
        (d) => members.filter((m) => m.challenges.some((mc) => mc.key === c.key && mc.days.includes(d))).length
      ),
    }));
}

function challengeTitle(owner: UserDocument | undefined, key: string): string {
  return getPreset(key)?.title ?? owner?.challenges.find((c) => c.key === key)?.title ?? key;
}

async function buildComments(viewerId: string, members: UserDocument[], since: string): Promise<TeamComment[]> {
  const memberById = new Map(members.map((m) => [m._id.toString(), m]));
  const checkIns = await checkInRepository.findCommentedByUsersSince([...memberById.keys()], since);

  const nameById = new Map(members.map((m) => [m._id.toString(), m.name]));
  const unknownJoiners = [...new Set(checkIns.flatMap((c) => c.joiners.map((j) => j.toString())))].filter(
    (id) => !nameById.has(id)
  );
  const extra = unknownJoiners.length > 0 ? await profileRepository.findByIds(unknownJoiners) : [];
  extra.forEach((u) => nameById.set(u._id.toString(), u.name));

  // exceptions (monthly cheat / drink) are never shown in the feed
  return checkIns.filter((c) => !c.exception).map((c) => {
    const ownerId = c.userId.toString();
    const joinerIds = c.joiners.map((j) => j.toString());
    return {
      id: c._id.toString(),
      userId: ownerId,
      userName: nameById.get(ownerId) ?? 'Someone',
      challengeKey: c.challengeKey,
      challengeTitle: challengeTitle(memberById.get(ownerId), c.challengeKey),
      comment: c.comment ?? '',
      date: c.date,
      joiners: joinerIds.map((id) => ({ id, name: nameById.get(id) ?? 'Someone' })),
      joinedByMe: joinerIds.includes(viewerId),
      isMine: ownerId === viewerId,
    };
  });
}

export async function getTeamBoardService(userId: string): Promise<ServiceResult<TeamBoard>> {
  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!viewer.teamId) return { data: { error: 'NO_TEAM' }, status: 404 };

  const team = await teamRepository.findById(viewer.teamId.toString());
  if (!team) return { data: { error: 'NO_TEAM' }, status: 404 };

  const docs = await profileRepository.findByIds(team.members.map((m) => m.toString()));
  const synced = await Promise.all(docs.map((doc) => syncStreak(doc)));
  const members = synced.map((s) => s.user);
  const today = todayInTimezone(viewer.timezone);

  const board: TeamBoard = {
    teamId: team._id.toString(),
    members: synced.map((s) => ({
      id: s.user._id.toString(),
      name: s.user.name,
      day: s.day,
      isMe: s.user._id.toString() === userId,
    })),
    memberChallenges: members.map((m) => ({ userId: m._id.toString(), name: m.name, challenges: toUserChallenges(m) })),
    grid: buildGrid(viewer, members),
    today,
    todayIndex: weekdayIndex(today),
    comments: await buildComments(userId, members, addDays(today, -2)),
  };
  return { data: board, status: 200 };
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
