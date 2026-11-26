import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { UserChallenge } from '@/features/profile/types/profile.types';
import { teamRepository } from '@/features/team/repository/team.repository';
import { DiscoverCard } from '@/features/team/types/team.types';
import { MAX_TEAM_SIZE } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';

type ScheduledChallenge = { key: string; days: number[] };

export type Overlap = {
  sharedChallengeKeys: string[];
  sharedDays: number;
  score: number;
};

/**
 * Pure overlap math: shared keys, weekdays where at least one shared
 * challenge is scheduled for both, and the ranking score.
 */
export function computeOverlap(mine: ScheduledChallenge[], theirs: ScheduledChallenge[]): Overlap {
  const theirsByKey = new Map(theirs.map((c) => [c.key, c.days]));
  const sharedChallengeKeys: string[] = [];
  const days = new Set<number>();

  for (const challenge of mine) {
    const theirDays = theirsByKey.get(challenge.key);
    if (!theirDays) continue;
    sharedChallengeKeys.push(challenge.key);
    challenge.days.filter((d) => theirDays.includes(d)).forEach((d) => days.add(d));
  }

  return {
    sharedChallengeKeys,
    sharedDays: days.size,
    score: sharedChallengeKeys.length * 10 + days.size,
  };
}

export function toUserChallenges(user: UserDocument): UserChallenge[] {
  return user.challenges.map((c) => ({ key: c.key, title: c.title, custom: c.custom, days: [...c.days] }));
}

function createdAtMs(user: UserDocument): number {
  return user.createdAt ? new Date(user.createdAt).getTime() : 0;
}

export async function getDiscoverDeckService(userId: string): Promise<ServiceResult<DiscoverCard[]>> {
  const viewer = await profileRepository.findById(userId);
  if (!viewer) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (!viewer.published) return { data: { error: 'NOT_PUBLISHED' }, status: 403 };

  const viewerTeam = viewer.teamId ? await teamRepository.findById(viewer.teamId.toString()) : null;
  const teammateIds = (viewerTeam?.members ?? []).map((m) => m.toString());
  const skippedIds = viewer.skipped.map((s) => s.toString());
  const candidates = await profileRepository.findPublishedExcept([userId, ...skippedIds, ...teammateIds]);

  const teamIds = [...new Set(candidates.flatMap((c) => (c.teamId ? [c.teamId.toString()] : [])))];
  const teams = teamIds.length > 0 ? await teamRepository.findByIds(teamIds) : [];
  const sizeByTeam = new Map(teams.map((t) => [t._id.toString(), t.members.length]));

  const ranked = candidates
    .map((candidate) => {
      const teamSize = candidate.teamId ? (sizeByTeam.get(candidate.teamId.toString()) ?? 0) : 0;
      const overlap = computeOverlap(viewer.challenges, candidate.challenges);
      return { candidate, teamSize, overlap };
    })
    .filter((entry) => entry.teamSize < MAX_TEAM_SIZE)
    .sort((a, b) => b.overlap.score - a.overlap.score || createdAtMs(b.candidate) - createdAtMs(a.candidate));

  const cards: DiscoverCard[] = ranked.map(({ candidate, teamSize, overlap }) => ({
    id: candidate._id.toString(),
    name: candidate.name,
    age: candidate.age ?? null,
    city: candidate.city ?? '',
    interests: [...candidate.interests],
    challenges: toUserChallenges(candidate),
    sharedChallengeKeys: overlap.sharedChallengeKeys,
    sharedChallenges: overlap.sharedChallengeKeys.length,
    sharedDays: overlap.sharedDays,
    teamSize,
  }));

  return { data: cards, status: 200 };
}

export async function skipService(userId: string, targetId: string): Promise<ServiceResult<{ skipped: boolean }>> {
  if (userId === targetId) return { data: { error: 'INVALID_TARGET' }, status: 400 };
  await profileRepository.addSkipped(userId, targetId);
  return { data: { skipped: true }, status: 200 };
}

export async function resetSkipsService(userId: string): Promise<ServiceResult<{ reset: boolean }>> {
  await profileRepository.clearSkipped(userId);
  return { data: { reset: true }, status: 200 };
}
