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

vi.mock('@/features/profile/repository/profile.repository');
vi.mock('@/features/profile/service/streak.service');

const userId = '507f1f77bcf86cd799439011';

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
  challenges: [{ key: 'water', title: 'Drink 2 L of water', custom: false, days: [0, 1, 2] }],
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
    it('rejects unknown preset keys', async () => {
      const result = await updateChallengesService(userId, {
        challenges: [{ key: 'flying', title: 'Fly', custom: false, days: [0] }],
      });
      expect(result.status).toBe(400);
      expect(profileRepository.setChallenges).not.toHaveBeenCalled();
    });

    it('rejects custom keys without custom- prefix', async () => {
      const result = await updateChallengesService(userId, {
        challenges: [{ key: 'walk-dog', title: 'Walk dog', custom: true, days: [0] }],
      });
      expect(result.status).toBe(400);
    });

    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await updateChallengesService(userId, {
        challenges: [{ key: 'water', title: 'Water', custom: false, days: [0] }],
      });
      expect(result.status).toBe(404);
    });

    it('dedupes by key, sorts days and saves', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(baseUser);
      const result = await updateChallengesService(userId, {
        challenges: [
          { key: 'read', title: 'Read', custom: false, days: [4, 1] },
          { key: 'read', title: 'Read', custom: false, days: [2] },
          { key: 'custom-walk-ab12', title: 'Walk the dog', custom: true, days: [6] },
        ],
      });
      expect(result.status).toBe(200);
      expect(profileRepository.setChallenges).toHaveBeenCalledWith(userId, [
        { key: 'read', title: 'Read 10 pages', custom: false, days: [1, 4] },
        { key: 'custom-walk-ab12', title: 'Walk the dog', custom: true, days: [6] },
      ]);
    });
  });

  describe('publishService', () => {
    it('returns 404 when user missing', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
      const result = await publishService(userId);
      expect(result.status).toBe(404);
    });

    it('returns 400 NO_CHALLENGES when none selected', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValueOnce({ ...baseUser, challenges: baseUser.challenges.filter(() => false) } as UserDocument);
      const result = await publishService(userId);
      expect(result.status).toBe(400);
      expect(result.data).toEqual({ error: 'NO_CHALLENGES' });
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
