import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { Profile, UserChallenge } from '@/features/profile/types/profile.types';
import { UpdateChallengesType } from '@/features/profile/validations/profile.validation';
import { CHALLENGES } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';
import { todayInTimezone } from '@/shared/utils/date';
import { displayDay } from '@/shared/utils/streak';

const CUSTOM_PREFIX = 'custom-';

export function toProfile(user: UserDocument, day: number): Profile {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    age: user.age ?? null,
    city: user.city ?? '',
    interests: [...user.interests],
    timezone: user.timezone,
    challenges: user.challenges.map((challenge) => ({
      key: challenge.key,
      title: challenge.title,
      custom: challenge.custom,
      days: [...challenge.days],
    })),
    published: user.published,
    teamId: user.teamId ? user.teamId.toString() : null,
    day,
  };
}

function currentDay(user: UserDocument): number {
  return displayDay(user.streakStart ?? '', todayInTimezone(user.timezone));
}

function normalizeChallenges(input: UpdateChallengesType): UserChallenge[] | null {
  const seen = new Set<string>();
  const result: UserChallenge[] = [];

  for (const challenge of input.challenges) {
    if (seen.has(challenge.key)) continue;
    const days = Array.from(new Set(challenge.days)).sort((a, b) => a - b);

    if (challenge.custom) {
      if (!challenge.key.startsWith(CUSTOM_PREFIX)) return null;
      result.push({ key: challenge.key, title: challenge.title, custom: true, days });
    } else {
      const preset = CHALLENGES.find((item) => item.key === challenge.key);
      if (!preset) return null;
      result.push({ key: preset.key, title: preset.title, custom: false, days });
    }
    seen.add(challenge.key);
  }

  return result;
}

export async function getMyProfileService(userId: string): Promise<ServiceResult<Profile>> {
  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const synced = await syncStreak(user);
  return { data: toProfile(synced.user, synced.day), status: 200 };
}

export async function updateChallengesService(
  userId: string,
  input: UpdateChallengesType
): Promise<ServiceResult<Profile>> {
  const challenges = normalizeChallenges(input);
  if (!challenges) return { data: { error: 'INVALID_CHALLENGE' }, status: 400 };

  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  await profileRepository.setChallenges(userId, challenges);
  return { data: { ...toProfile(user, currentDay(user)), challenges }, status: 200 };
}

export async function publishService(userId: string): Promise<ServiceResult<Profile>> {
  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (user.challenges.length === 0) return { data: { error: 'NO_CHALLENGES' }, status: 400 };

  const changes = user.streakStart
    ? { published: true }
    : { published: true, streakStart: todayInTimezone(user.timezone), lastEvaluated: '' };

  await profileRepository.updateById(userId, changes);
  const updated: UserDocument = { ...user, ...changes };
  return { data: toProfile(updated, currentDay(updated)), status: 200 };
}
