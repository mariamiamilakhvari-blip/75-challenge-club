import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { CheckInDocument } from '@/features/checkin/schema/checkin.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';

vi.mock('@/features/checkin/repository/checkin.repository');
vi.mock('@/features/profile/repository/profile.repository');

const baseUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Nino',
  email: 'n@x.io',
  timezone: 'UTC',
  published: true,
  challenges: [{ key: 'water', title: 'Water', custom: false, days: [0, 1, 2, 3, 4, 5, 6] }],
  streakStart: '2026-11-20',
  lastEvaluated: '2026-11-24',
} as UserDocument;

describe('syncStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'));
    vi.mocked(profileRepository.updateById).mockResolvedValue(true);
  });

  it('resets streak start after a missed day', async () => {
    vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([
      { date: '2026-11-25', challengeKey: 'water' } as CheckInDocument,
    ]);
    const result = await syncStreak(baseUser);
    expect(result.user.streakStart).toBe('2026-11-27');
    expect(result.day).toBe(1);
    expect(profileRepository.updateById).toHaveBeenCalled();
  });

  it('skips DB when already evaluated', async () => {
    const result = await syncStreak({ ...baseUser, lastEvaluated: '2026-11-26' } as UserDocument);
    expect(result.day).toBe(8);
    expect(checkInRepository.findByUserBetween).not.toHaveBeenCalled();
  });
});
