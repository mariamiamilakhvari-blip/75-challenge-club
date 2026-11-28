import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { Profile, UserChallenge } from '@/features/profile/types/profile.types';
import { AboutYouType, UpdateChallengesType } from '@/features/profile/validations/profile.validation';
import { MIN_CHALLENGES } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';
import { getPreset, normalizeDays } from '@/shared/utils/challenge-rules';
import { todayInTimezone } from '@/shared/utils/date';
import { displayDay } from '@/shared/utils/streak';

const CUSTOM_PREFIX = 'custom-';

function needsAbout(user: UserDocument): boolean {
  const ageMissing = user.age === null || user.age === undefined;
  const cityMissing = !user.city || user.city.trim() === '';
  return ageMissing || cityMissing || user.interests.length === 0;
}

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
    needsAbout: needsAbout(user),
  };
}

function currentDay(user: UserDocument): number {
  return displayDay(user.streakStart ?? '', todayInTimezone(user.timezone));
}

type NormalizeError = 'INVALID_CHALLENGE' | 'INVALID_DAYS' | 'NOT_ENOUGH_CHALLENGES';

type NormalizeResult = { ok: true; challenges: UserChallenge[] } | { ok: false; error: NormalizeError };

function normalizeChallenges(input: UpdateChallengesType): NormalizeResult {
  const seen = new Set<string>();
  const challenges: UserChallenge[] = [];

  for (const challenge of input.challenges) {
    if (seen.has(challenge.key)) continue;

    const preset = challenge.custom ? undefined : getPreset(challenge.key);
    if (challenge.custom ? !challenge.key.startsWith(CUSTOM_PREFIX) : !preset) {
      return { ok: false, error: 'INVALID_CHALLENGE' };
    }

    const days = normalizeDays(challenge.key, challenge.days);
    if (!days) return { ok: false, error: 'INVALID_DAYS' };

    challenges.push({ key: challenge.key, title: preset?.title ?? challenge.title, custom: !preset, days });
    seen.add(challenge.key);
  }

  if (challenges.length < MIN_CHALLENGES) return { ok: false, error: 'NOT_ENOUGH_CHALLENGES' };
  return { ok: true, challenges };
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
  const normalized = normalizeChallenges(input);
  if (!normalized.ok) return { data: { error: normalized.error }, status: 400 };
  const { challenges } = normalized;

  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  await profileRepository.setChallenges(userId, challenges);
  return { data: { ...toProfile(user, currentDay(user)), challenges }, status: 200 };
}

export async function publishService(userId: string): Promise<ServiceResult<Profile>> {
  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (user.challenges.length < MIN_CHALLENGES) {
    return { data: { error: 'NOT_ENOUGH_CHALLENGES' }, status: 400 };
  }

  const changes = user.streakStart
    ? { published: true }
    : { published: true, streakStart: todayInTimezone(user.timezone), lastEvaluated: '' };

  await profileRepository.updateById(userId, changes);
  const updated: UserDocument = { ...user, ...changes };
  return { data: toProfile(updated, currentDay(updated)), status: 200 };
}

export async function updateAboutService(
  userId: string,
  input: AboutYouType
): Promise<ServiceResult<Profile>> {
  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const about = {
    age: input.age,
    city: input.city.trim(),
    interests: Array.from(new Set(input.interests.map((interest) => interest.trim()))),
    timezone: input.timezone,
  };

  await profileRepository.setAbout(userId, about);
  const updated: UserDocument = { ...user, ...about };
  return { data: toProfile(updated, currentDay(updated)), status: 200 };
}
