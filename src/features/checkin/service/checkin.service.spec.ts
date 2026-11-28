import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { CheckInDocument } from '@/features/checkin/schema/checkin.schema';
import {
  createCheckInService,
  deleteCheckInService,
  getTodayService,
} from '@/features/checkin/service/checkin.service';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { teamRepository } from '@/features/team/repository/team.repository';
import { TeamDocument } from '@/features/team/schema/team.schema';

vi.mock('@/features/checkin/repository/checkin.repository');
vi.mock('@/features/profile/repository/profile.repository');
vi.mock('@/features/team/repository/team.repository');
vi.mock('@/features/profile/service/streak.service');

// 2026-11-27 is a Friday (weekday index 4)
const TODAY = '2026-11-27';
const userId = new mongoose.Types.ObjectId();
const teamId = new mongoose.Types.ObjectId();
const mateId = new mongoose.Types.ObjectId();

const user = {
  _id: userId,
  name: 'Mariam',
  timezone: 'UTC',
  published: true,
  teamId: null,
  streakStart: '2026-11-20',
  lastEvaluated: '2026-11-26',
  challenges: [
    { key: 'water', title: 'Drink water', custom: false, days: [0, 1, 2, 3, 4, 5, 6] },
    { key: 'read', title: 'Read', custom: false, days: [4] },
    { key: 'social', title: 'Social', custom: false, days: [5] },
    { key: 'no-junk', title: 'Old junk title', custom: false, days: [0, 1, 2, 3, 4, 5, 6] },
    { key: 'yoga-x', title: 'Yoga', custom: true, days: [4] },
  ],
} as UserDocument;

const mate = {
  _id: mateId,
  name: 'Nino',
  timezone: 'UTC',
  published: true,
  challenges: [
    { key: 'water', title: 'Water', custom: false, days: [4] },
    { key: 'sleep', title: 'Sleep', custom: false, days: [4] },
  ],
} as UserDocument;

function checkIn(overrides: Partial<CheckInDocument>): CheckInDocument {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId,
    date: TODAY,
    challengeKey: 'water',
    comment: '',
    exception: false,
    ...overrides,
  } as CheckInDocument;
}

describe('checkin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'));
    vi.mocked(syncStreak).mockImplementation(async (u) => ({ user: u, today: TODAY, day: 8 }));
  });

  describe('getTodayService', () => {
    it('returns 403 when user is not published', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue({ ...user, published: false } as UserDocument);
      const res = await getTodayService(userId.toString());
      expect(res.status).toBe(403);
      expect(res.data).toEqual({ error: 'NOT_PUBLISHED' });
    });

    it('returns only challenges scheduled today with done state', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      const done = checkIn({ challengeKey: 'water', comment: 'Gym' });
      vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([done]);
      const res = await getTodayService(userId.toString());
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({
        day: 8,
        date: TODAY,
        completed: false,
        teammates: [],
        items: [
          { key: 'water', kind: 'daily', done: true, exception: false, checkInId: done._id.toString(), comment: 'Gym' },
          { key: 'read', kind: 'daily', done: false, checkInId: null, comment: '' },
          { key: 'no-junk', title: 'No junk food', kind: 'monthly', done: false, exceptionsUsed: 0, exceptionsAllowed: 1 },
          { key: 'yoga-x', title: 'Yoga', kind: 'custom', done: false },
        ],
      });
      expect(checkInRepository.findByUserBetween).toHaveBeenCalledWith(userId.toString(), '2026-11-01', TODAY);
    });

    it('reports monthly exceptions used this month and today exception state', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([
        checkIn({ challengeKey: 'no-junk', date: '2026-11-03', exception: true }),
        checkIn({ challengeKey: 'no-junk', exception: true }),
        checkIn({ challengeKey: 'water', date: '2026-11-03' }),
      ]);
      const res = await getTodayService(userId.toString());
      const items = 'items' in res.data ? res.data.items : [];
      expect(items.find((i) => i.key === 'no-junk')).toMatchObject({
        done: true,
        exception: true,
        exceptionsUsed: 2,
        exceptionsAllowed: 1,
      });
      expect(items.find((i) => i.key === 'water')).toMatchObject({ done: false });
      expect(items.find((i) => i.key === 'water')).not.toHaveProperty('exceptionsUsed');
    });

    it('marks completed on day 75', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      vi.mocked(syncStreak).mockResolvedValue({ user, today: TODAY, day: 75 });
      vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([]);
      const res = await getTodayService(userId.toString());
      expect(res.data).toMatchObject({ completed: true });
    });

    it('computes teammate progress for their own today', async () => {
      const teamed = { ...user, teamId } as UserDocument;
      vi.mocked(profileRepository.findById).mockResolvedValue(teamed);
      vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([]);
      vi.mocked(teamRepository.findById).mockResolvedValue({
        _id: teamId,
        members: [userId, mateId],
      } as TeamDocument);
      vi.mocked(profileRepository.findByIds).mockResolvedValue([mate]);
      vi.mocked(checkInRepository.findByUsersBetween).mockResolvedValue([
        checkIn({ userId: mateId, challengeKey: 'water' }),
        checkIn({ userId: mateId, challengeKey: 'water', date: '2026-11-26' }),
      ]);
      const res = await getTodayService(userId.toString());
      expect(profileRepository.findByIds).toHaveBeenCalledWith([mateId.toString()]);
      expect(checkInRepository.findByUsersBetween).toHaveBeenCalledWith([mateId.toString()], '2026-11-01', TODAY);
      expect(res.data).toMatchObject({
        teammates: [{ id: mateId.toString(), name: 'Nino', done: 1, total: 2 }],
      });
    });

    it('counts a teammate monthly exception as done only within the allowance', async () => {
      const teamed = { ...user, teamId } as UserDocument;
      const monthlyMate = {
        ...mate,
        challenges: [
          { key: 'no-junk', title: 'No junk', custom: false, days: [0, 1, 2, 3, 4, 5, 6] },
          { key: 'no-alcohol', title: 'No alcohol', custom: false, days: [0, 1, 2, 3, 4, 5, 6] },
        ],
      } as UserDocument;
      vi.mocked(profileRepository.findById).mockResolvedValue(teamed);
      vi.mocked(checkInRepository.findByUserBetween).mockResolvedValue([]);
      vi.mocked(teamRepository.findById).mockResolvedValue({ _id: teamId, members: [userId, mateId] } as TeamDocument);
      vi.mocked(profileRepository.findByIds).mockResolvedValue([monthlyMate]);
      vi.mocked(checkInRepository.findByUsersBetween).mockResolvedValue([
        // no-junk: cheat already used earlier this month → today's cheat is a miss
        checkIn({ userId: mateId, challengeKey: 'no-junk', date: '2026-11-10', exception: true }),
        checkIn({ userId: mateId, challengeKey: 'no-junk', exception: true }),
        // no-alcohol: first drink this month → counts as done
        checkIn({ userId: mateId, challengeKey: 'no-alcohol', exception: true }),
      ]);
      const res = await getTodayService(userId.toString());
      expect(res.data).toMatchObject({
        teammates: [{ id: mateId.toString(), done: 1, total: 2 }],
      });
    });
  });

  describe('createCheckInService', () => {
    it('returns 403 when not published', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue({ ...user, published: false } as UserDocument);
      const res = await createCheckInService(userId.toString(), { challengeKey: 'water' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when challenge is not scheduled today', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      const res = await createCheckInService(userId.toString(), { challengeKey: 'social' });
      expect(res).toEqual({ data: { error: 'NOT_SCHEDULED_TODAY' }, status: 400 });
    });

    it('returns 409 when already checked in', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      vi.mocked(checkInRepository.findByUserAndDate).mockResolvedValue([checkIn({ challengeKey: 'water' })]);
      const res = await createCheckInService(userId.toString(), { challengeKey: 'water' });
      expect(res).toEqual({ data: { error: 'ALREADY_DONE' }, status: 409 });
      expect(checkInRepository.create).not.toHaveBeenCalled();
    });

    it('creates with team id and trimmed comment', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue({ ...user, teamId } as UserDocument);
      vi.mocked(checkInRepository.findByUserAndDate).mockResolvedValue([]);
      vi.mocked(checkInRepository.create).mockResolvedValue('abc');
      const res = await createCheckInService(userId.toString(), {
        challengeKey: 'read',
        comment: '  Pilates 18:00  ',
      });
      expect(res).toEqual({ data: { id: 'abc' }, status: 201 });
      expect(checkInRepository.create).toHaveBeenCalledWith({
        userId: userId.toString(),
        teamId: teamId.toString(),
        date: TODAY,
        challengeKey: 'read',
        comment: 'Pilates 18:00',
        exception: false,
      });
    });

    it('returns 400 NOT_MONTHLY for an exception on a non-monthly challenge', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      const res = await createCheckInService(userId.toString(), { challengeKey: 'water', exception: true });
      expect(res).toEqual({ data: { error: 'NOT_MONTHLY' }, status: 400 });
      expect(checkInRepository.create).not.toHaveBeenCalled();
    });

    it('stores a monthly exception even when the allowance is used', async () => {
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      vi.mocked(checkInRepository.findByUserAndDate).mockResolvedValue([]);
      vi.mocked(checkInRepository.create).mockResolvedValue('ex1');
      const res = await createCheckInService(userId.toString(), { challengeKey: 'no-junk', exception: true });
      expect(res).toEqual({ data: { id: 'ex1' }, status: 201 });
      expect(checkInRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ challengeKey: 'no-junk', exception: true, comment: '' })
      );
    });
  });

  describe('deleteCheckInService', () => {
    it('returns 404 when check-in is missing', async () => {
      vi.mocked(checkInRepository.findById).mockResolvedValue(null);
      const res = await deleteCheckInService(userId.toString(), new mongoose.Types.ObjectId().toString());
      expect(res.status).toBe(404);
    });

    it('returns 404 for a malformed id', async () => {
      const res = await deleteCheckInService(userId.toString(), 'nope');
      expect(res.status).toBe(404);
      expect(checkInRepository.findById).not.toHaveBeenCalled();
    });

    it('returns 403 when not the owner', async () => {
      vi.mocked(checkInRepository.findById).mockResolvedValue(checkIn({ userId: mateId }));
      const res = await deleteCheckInService(userId.toString(), new mongoose.Types.ObjectId().toString());
      expect(res).toEqual({ data: { error: 'FORBIDDEN' }, status: 403 });
    });

    it('returns 403 when the check-in is not from today', async () => {
      vi.mocked(checkInRepository.findById).mockResolvedValue(checkIn({ date: '2026-11-26' }));
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      const res = await deleteCheckInService(userId.toString(), new mongoose.Types.ObjectId().toString());
      expect(res.status).toBe(403);
      expect(checkInRepository.deleteById).not.toHaveBeenCalled();
    });

    it('deletes own check-in from today', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      vi.mocked(checkInRepository.findById).mockResolvedValue(checkIn({}));
      vi.mocked(profileRepository.findById).mockResolvedValue(user);
      const res = await deleteCheckInService(userId.toString(), id);
      expect(res).toEqual({ data: { ok: true }, status: 200 });
      expect(checkInRepository.deleteById).toHaveBeenCalledWith(id);
    });
  });
});
