import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/profile/repository/profile.repository', () => ({
  profileRepository: { findById: vi.fn(), findByIds: vi.fn() },
}));
vi.mock('@/features/team/repository/team.repository', () => ({
  teamRepository: { findById: vi.fn() },
}));
vi.mock('@/features/team/repository/day-proposal.repository', () => ({
  dayProposalRepository: { findByTeam: vi.fn() },
}));
vi.mock('@/features/team/repository/plan.repository', () => ({
  planRepository: { findByTeamSince: vi.fn() },
}));
vi.mock('@/features/checkin/repository/checkin.repository', () => ({
  checkInRepository: { findByUsersBetween: vi.fn(), findCommentedByUsersSince: vi.fn() },
}));
vi.mock('@/features/profile/service/streak.service', () => ({ syncStreak: vi.fn() }));

import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { dayProposalRepository } from '@/features/team/repository/day-proposal.repository';
import { planRepository } from '@/features/team/repository/plan.repository';
import { teamRepository } from '@/features/team/repository/team.repository';
import { cellStatus, getTeamBoardService, weekDatesFor } from '@/features/team/service/team-board.service';
import { TeamBoard } from '@/features/team/types/team.types';

const oid = (id: string) => ({ toString: () => id });
const EVERY = [0, 1, 2, 3, 4, 5, 6];

function fakeUser(id: string, teamId: string | null, challenges: { key: string; days: number[] }[] = []) {
  return {
    _id: oid(id),
    name: id,
    timezone: 'UTC',
    published: true,
    teamId: teamId ? oid(teamId) : null,
    challenges: challenges.map((c) => ({ ...c, title: `T-${c.key}`, custom: false })),
  } as never;
}

const checkIn = (userId: string, date: string, challengeKey: string, comment = '', exception = false) => ({
  _id: oid(`${userId}-${date}-${challengeKey}`),
  userId: oid(userId),
  date,
  challengeKey,
  comment,
  exception,
  joiners: [],
});

describe('board helpers', () => {
  it('returns Mon..Sun dates of the current week', () => {
    expect(weekDatesFor('2026-11-25')).toEqual([
      '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29',
    ]);
    expect(weekDatesFor('2026-11-29')[0]).toBe('2026-11-23');
  });

  it('classifies cell status', () => {
    expect(cellStatus(true, '2026-11-20', '2026-11-25')).toBe('done');
    expect(cellStatus(false, '2026-11-25', '2026-11-25')).toBe('pending');
    expect(cellStatus(false, '2026-11-24', '2026-11-25')).toBe('missed');
    expect(cellStatus(false, '2026-11-26', '2026-11-25')).toBe('upcoming');
  });
});

describe('getTeamBoardService', () => {
  const NOW = new Date('2026-11-25T12:00:00Z'); // Wednesday

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns 404 NO_TEAM without a team', async () => {
    vi.mocked(profileRepository.findById).mockResolvedValueOnce(fakeUser('me', null));
    expect((await getTeamBoardService('me')).status).toBe(404);
  });

  it('builds per-cell member status, today progress, proposals and plans', async () => {
    const me = fakeUser('me', 'T', [
      { key: 'water', days: EVERY },
      { key: 'read', days: EVERY },
      { key: 'workout', days: [0, 1, 2, 4] },
      { key: 'no-junk', days: EVERY },
      { key: 'my-own', days: [0] },
    ]);
    const mate = fakeUser('mate', 'T', [
      { key: 'water', days: EVERY },
      { key: 'workout', days: [1, 2, 4, 5] },
      { key: 'no-junk', days: EVERY },
      { key: 'my-own', days: [0, 3] },
    ]);
    vi.mocked(profileRepository.findById).mockResolvedValueOnce(me);
    vi.mocked(teamRepository.findById).mockResolvedValueOnce({ _id: oid('T'), members: [oid('me'), oid('mate')] } as never);
    vi.mocked(profileRepository.findByIds).mockResolvedValueOnce([me, mate]);
    vi.mocked(syncStreak).mockImplementation(async (user) => ({ user, today: '2026-11-25', day: 7 }));
    vi.mocked(checkInRepository.findByUsersBetween).mockResolvedValueOnce([
      checkIn('me', '2026-11-23', 'water'),
      checkIn('me', '2026-11-25', 'water', 'Hydrated'),
      checkIn('mate', '2026-11-24', 'workout', 'Yoga at Fit'),
      checkIn('mate', '2026-11-25', 'water'),
      checkIn('mate', '2026-11-25', 'no-junk', 'Pizza', true),
    ] as never);
    vi.mocked(checkInRepository.findCommentedByUsersSince).mockResolvedValueOnce([
      { ...checkIn('mate', '2026-11-25', 'water', 'Park 7pm'), joiners: [oid('me')] },
    ] as never);
    vi.mocked(dayProposalRepository.findByTeam).mockResolvedValueOnce([
      { _id: oid('p1'), challengeKey: 'workout', proposerId: oid('mate'), days: [6, 0, 2, 4], accepted: [oid('mate')], declined: [] },
    ] as never);
    vi.mocked(planRepository.findByTeamSince).mockResolvedValueOnce([
      {
        _id: oid('plan1'),
        userId: oid('mate'),
        challengeKey: 'workout',
        place: 'Vake park',
        activity: 'Running',
        when: 'Sat 9:00',
        note: '',
        createdAt: new Date('2026-11-25T08:00:00Z'),
        joiners: [oid('me')],
        replies: [{ _id: oid('r1'), userId: oid('me'), text: 'Count me in', createdAt: new Date('2026-11-25T09:00:00Z') }],
      },
    ] as never);

    const result = await getTeamBoardService('me');
    expect(result.status).toBe(200);
    const board = result.data as TeamBoard;

    expect(board.weekDates[0]).toBe('2026-11-23');
    expect(board.todayIndex).toBe(2);
    expect(board.members).toEqual([
      { id: 'me', name: 'me', day: 7, isMe: true, todayDone: 1, todayTotal: 4 },
      // the second no-junk exception still counts: it's the first one this month
      { id: 'mate', name: 'mate', day: 7, isMe: false, todayDone: 2, todayTotal: 3 },
    ]);
    expect(board.grid.map((row) => row.key)).toEqual(['water', 'workout', 'no-junk', 'my-own']);

    const water = board.grid[0];
    expect(water).toMatchObject({ label: 'Every day', requiredDays: null, proposal: null });
    expect(water.cells[0].members).toEqual([
      { userId: 'me', status: 'done', comment: '' },
      { userId: 'mate', status: 'missed', comment: '' },
    ]);
    expect(water.cells[2].members).toEqual([
      { userId: 'me', status: 'done', comment: 'Hydrated' },
      { userId: 'mate', status: 'done', comment: '' },
    ]);
    expect(water.cells[3].members.map((m) => m.status)).toEqual(['upcoming', 'upcoming']);

    const workout = board.grid[1];
    expect(workout.requiredDays).toBe(4);
    expect(workout.cells[1].members).toEqual([
      { userId: 'me', status: 'missed', comment: '' },
      { userId: 'mate', status: 'done', comment: 'Yoga at Fit' },
    ]);
    expect(workout.cells[3].members).toEqual([]);
    expect(workout.proposal).toEqual({
      id: 'p1',
      days: [0, 2, 4, 6],
      proposerId: 'mate',
      proposerName: 'mate',
      acceptedIds: ['mate'],
      declinedIds: [],
      myResponse: null,
      isMine: false,
    });

    // monthly exceptions never expose their comment
    expect(board.grid[2].cells[2].members[1]).toEqual({ userId: 'mate', status: 'done', comment: '' });

    expect(board.comments).toHaveLength(1);
    expect(board.plans).toEqual([
      {
        id: 'plan1',
        userId: 'mate',
        userName: 'mate',
        isMine: false,
        challengeKey: 'workout',
        challengeTitle: 'Work out 45 min',
        details: { place: 'Vake park', when: 'Sat 9:00', activity: 'Running', book: '', author: '', note: '' },
        createdAt: '2026-11-25T08:00:00.000Z',
        joinable: true,
        joiners: [{ id: 'me', name: 'me' }],
        joinedByMe: true,
        replies: [{ id: 'r1', userId: 'me', userName: 'me', text: 'Count me in', createdAt: '2026-11-25T09:00:00.000Z', isMine: true }],
      },
    ]);
    expect(checkInRepository.findByUsersBetween).toHaveBeenCalledWith(['me', 'mate'], '2026-11-01', '2026-11-29');
    expect(planRepository.findByTeamSince).toHaveBeenCalledWith('T', new Date('2026-11-18T12:00:00Z'));
  });
});
