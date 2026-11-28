import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import {
  getMyProfileService,
  publishService,
  toProfile,
  updateAboutService,
  updateChallengesService,
} from '@/features/profile/service/profile.service';
import { syncStreak } from '@/features/profile/service/streak.service';
import { UserChallengeInput } from '@/features/profile/validations/profile.validation';

vi.mock('@/features/profile/repository/profile.repository');
vi.mock('@/features/profile/service/streak.service');

const userId = '507f1f77bcf86cd799439011';

const ALL = [0, 1, 2, 3, 4, 5, 6];

const validChallenges: UserChallengeInput[] = [
  { key: 'water', title: 'Water', custom: false, days: ALL },
  { key: 'read', title: 'Read', custom: false, days: ALL },
  { key: 'workout', title: 'Workout', custom: false, days: [0, 2, 4, 5] },
  { key: 'no-junk', title: 'No junk', custom: false, days: ALL },
  { key: 'custom-walk-ab12', title: 'Walk the dog', custom: true, days: [6] },
];

const savedChallenges = [
  { key: 'water', title: 'Drink 2 L of water', custom: false, days: ALL },
  { key: 'read', title: 'Read 10 pages', custom: false, days: ALL },
  { key: 'workout', title: 'Work out 45 min', custom: false, days: [0, 2, 4, 5] },
  { key: 'no-junk', title: 'No junk food', custom: false, days: ALL },
  { key: 'custom-walk-ab12', title: 'Walk the dog', custom: true, days: [6] },
];

const baseUser = {
  _id: new mongoose.Types.ObjectId(userId),
  name: 'Nino',
  email: 'n@x.io',
  age: 27,
  city: 'Tbilisi',
  interests: ['Yoga'],
  timezone: 'UTC',
  published: false,
  teamId: null,
  challenges: savedChallenges,
  streakStart: '',
  lastEvaluated: '',
} as UserDocument;

describe('profile.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'));
    vi.mocked(profileRepository.updateById).mockResolvedValue(true);
    vi.mocked(profileRepository.setChallenges).mockResolvedValue(true);
    vi.mocked(profileRepository.setAbout).mockResolvedValue(true);
  });

  describe('getMyProfileService', () => {
    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await getMyProfileService(userId);
      expect(result.status).toBe(404);
      expect(result.data).toEqual({ error: 'NOT_FOUND' });
    });

    it('returns profile with synced day', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(baseUser);
      vi.mocked(syncStreak).mockResolvedValueOnce({ user: baseUser, today: '2026-11-27', day: 4 });
      const result = await getMyProfileService(userId);
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({ id: userId, name: 'Nino', day: 4, teamId: null });
    });
  });

  describe('updateChallengesService', () => {
    const withChallenge = (index: number, challenge: UserChallengeInput) =>
      validChallenges.map((item, i) => (i === index ? challenge : item));

    it('rejects unknown preset keys', async () => {
      const result = await updateChallengesService(userId, {
        challenges: withChallenge(0, { key: 'flying', title: 'Fly', custom: false, days: [0] }),
      });
      expect(result).toEqual({ data: { error: 'INVALID_CHALLENGE' }, status: 400 });
      expect(profileRepository.setChallenges).not.toHaveBeenCalled();
    });

    it('rejects custom keys without custom- prefix', async () => {
      const result = await updateChallengesService(userId, {
        challenges: withChallenge(4, { key: 'walk-dog', title: 'Walk dog', custom: true, days: [0] }),
      });
      expect(result).toEqual({ data: { error: 'INVALID_CHALLENGE' }, status: 400 });
    });

    it('rejects scheduled challenges without the exact number of days', async () => {
      const result = await updateChallengesService(userId, {
        challenges: withChallenge(2, { key: 'workout', title: 'Workout', custom: false, days: [0, 2, 4] }),
      });
      expect(result).toEqual({ data: { error: 'INVALID_DAYS' }, status: 400 });
      expect(profileRepository.setChallenges).not.toHaveBeenCalled();
    });

    it('rejects custom challenges with no days', async () => {
      const result = await updateChallengesService(userId, {
        challenges: withChallenge(4, { key: 'custom-walk-ab12', title: 'Walk', custom: true, days: [] }),
      });
      expect(result).toEqual({ data: { error: 'INVALID_DAYS' }, status: 400 });
    });

    it('rejects when fewer than 5 unique challenges remain after dedupe', async () => {
      const result = await updateChallengesService(userId, {
        challenges: withChallenge(1, { key: 'water', title: 'Water', custom: false, days: ALL }),
      });
      expect(result).toEqual({ data: { error: 'NOT_ENOUGH_CHALLENGES' }, status: 400 });
    });

    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await updateChallengesService(userId, { challenges: validChallenges });
      expect(result.status).toBe(404);
    });

    it('forces canonical titles and days, sorts scheduled days and saves', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(baseUser);
      const result = await updateChallengesService(userId, {
        challenges: [
          { key: 'water', title: 'Hacked', custom: false, days: [1] },
          { key: 'read', title: 'Read', custom: false, days: [] },
          { key: 'workout', title: 'Workout', custom: false, days: [5, 4, 0, 2] },
          { key: 'no-junk', title: 'No junk', custom: false, days: [3] },
          { key: 'custom-walk-ab12', title: 'Walk the dog', custom: true, days: [6, 6] },
          { key: 'read', title: 'Read', custom: false, days: [2] },
        ],
      });
      expect(result.status).toBe(200);
      expect(profileRepository.setChallenges).toHaveBeenCalledWith(userId, savedChallenges);
    });
  });

  describe('publishService', () => {
    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await publishService(userId);
      expect(result.status).toBe(404);
    });

    it('returns 400 NOT_ENOUGH_CHALLENGES when fewer than 5 selected', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce({
        ...baseUser,
        challenges: savedChallenges.slice(0, 4),
      } as UserDocument);
      const result = await publishService(userId);
      expect(result.status).toBe(400);
      expect(result.data).toEqual({ error: 'NOT_ENOUGH_CHALLENGES' });
      expect(profileRepository.updateById).not.toHaveBeenCalled();
    });

    it('sets streakStart to today when empty', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(baseUser);
      const result = await publishService(userId);
      expect(result.status).toBe(200);
      expect(profileRepository.updateById).toHaveBeenCalledWith(userId, {
        published: true,
        streakStart: '2026-11-27',
        lastEvaluated: '',
      });
      expect(result.data).toMatchObject({ published: true, day: 1 });
    });

    it('keeps existing streak when re-publishing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce({
        ...baseUser,
        published: true,
        streakStart: '2026-11-20',
      } as UserDocument);
      await publishService(userId);
      expect(profileRepository.updateById).toHaveBeenCalledWith(userId, { published: true });
    });
  });

  describe('toProfile needsAbout', () => {
    it('is false when age, city and interests are set', () => {
      expect(toProfile(baseUser, 1).needsAbout).toBe(false);
    });

    it('is true when age is missing', () => {
      expect(toProfile({ ...baseUser, age: undefined } as UserDocument, 1).needsAbout).toBe(true);
    });

    it('is true when city is empty', () => {
      expect(toProfile({ ...baseUser, city: '  ' } as UserDocument, 1).needsAbout).toBe(true);
    });

    it('is true when interests are empty', () => {
      expect(toProfile({ ...baseUser, interests: [] as string[] } as UserDocument, 1).needsAbout).toBe(true);
    });
  });

  describe('updateAboutService', () => {
    const input = { age: 30, city: ' Batumi ', interests: ['Running', 'Running', 'Yoga'], timezone: 'Asia/Tbilisi' };

    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await updateAboutService(userId, input);
      expect(result.status).toBe(404);
      expect(profileRepository.setAbout).not.toHaveBeenCalled();
    });

    it('saves trimmed, deduped basics and clears needsAbout', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce({
        ...baseUser,
        age: undefined,
        city: '',
        interests: [] as string[],
      } as UserDocument);
      const result = await updateAboutService(userId, input);
      expect(result.status).toBe(200);
      expect(profileRepository.setAbout).toHaveBeenCalledWith(userId, {
        age: 30,
        city: 'Batumi',
        interests: ['Running', 'Yoga'],
        timezone: 'Asia/Tbilisi',
      });
      expect(result.data).toMatchObject({
        age: 30,
        city: 'Batumi',
        timezone: 'Asia/Tbilisi',
        needsAbout: false,
      });
    });
  });
});
