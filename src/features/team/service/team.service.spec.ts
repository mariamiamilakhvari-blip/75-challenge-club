import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/profile/repository/profile.repository', () => ({
  profileRepository: {
    findById: vi.fn(),
    findByIds: vi.fn(),
    setTeamForUsers: vi.fn(),
  },
}));

vi.mock('@/features/team/repository/team.repository', () => ({
  teamRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock('@/features/checkin/repository/checkin.repository', () => ({
  checkInRepository: {
    findById: vi.fn(),
    findCommentedByUsersSince: vi.fn(),
    addJoiner: vi.fn(),
    removeJoiner: vi.fn(),
  },
}));

vi.mock('@/features/profile/service/streak.service', () => ({
  syncStreak: vi.fn(),
}));

import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { teamRepository } from '@/features/team/repository/team.repository';

import { getTeamBoardService, joinTeamService, leaveTeamService, toggleJoinService } from './team.service';

const mockProfile = vi.mocked(profileRepository);
const mockTeam = vi.mocked(teamRepository);
const mockCheckIn = vi.mocked(checkInRepository);
const mockSync = vi.mocked(syncStreak);

const oid = (id: string) => ({ toString: () => id });
const CHECKIN_ID = 'a'.repeat(24);

function fakeUser(id: string, teamId: string | null, challenges: { key: string; days: number[] }[] = [], published = true) {
  return {
    _id: oid(id),
    name: id,
    timezone: 'UTC',
    published,
    teamId: teamId ? oid(teamId) : null,
    challenges: challenges.map((c) => ({ ...c, title: `T-${c.key}`, custom: false })),
  } as never;
}

const team = (id: string, members: string[]) => ({ _id: oid(id), members: members.map(oid) }) as never;

describe('joinTeamService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 409 TEAM_FULL when target team has 6 members', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null)).mockResolvedValueOnce(fakeUser('t', 'T'));
    mockTeam.findById.mockResolvedValueOnce(team('T', ['a', 'b', 'c', 'd', 'e', 'f']));
    const result = await joinTeamService('me', 't');
    expect(result).toEqual({ data: { error: 'TEAM_FULL' }, status: 409 });
    expect(mockTeam.addMember).not.toHaveBeenCalled();
  });

  it('returns 404 when target is unpublished', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null)).mockResolvedValueOnce(fakeUser('t', null, [], false));
    expect((await joinTeamService('me', 't')).status).toBe(404);
  });

  it('creates a new team when target is solo', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null)).mockResolvedValueOnce(fakeUser('t', null));
    mockTeam.create.mockResolvedValueOnce('NEW');
    const result = await joinTeamService('me', 't');
    expect(mockTeam.create).toHaveBeenCalledWith(['t', 'me']);
    expect(mockProfile.setTeamForUsers).toHaveBeenCalledWith(['t', 'me'], 'NEW');
    expect(result).toEqual({ data: { teamId: 'NEW' }, status: 200 });
  });

  it('leaves old team (deleting it when one member remains) and joins target team', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'OLD')).mockResolvedValueOnce(fakeUser('t', 'T'));
    mockTeam.findById.mockResolvedValueOnce(team('T', ['t', 'x'])).mockResolvedValueOnce(team('OLD', ['me', 'buddy']));
    const result = await joinTeamService('me', 't');
    expect(mockTeam.deleteById).toHaveBeenCalledWith('OLD');
    expect(mockProfile.setTeamForUsers).toHaveBeenCalledWith(['me', 'buddy'], null);
    expect(mockTeam.addMember).toHaveBeenCalledWith('T', 'me');
    expect(mockProfile.setTeamForUsers).toHaveBeenCalledWith(['me'], 'T');
    expect(result.data).toEqual({ teamId: 'T' });
  });
});

describe('leaveTeamService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 NO_TEAM when user has no team', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null));
    expect(await leaveTeamService('me')).toEqual({ data: { error: 'NO_TEAM' }, status: 404 });
  });

  it('removes member when team keeps 2+ members', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T'));
    mockTeam.findById.mockResolvedValueOnce(team('T', ['me', 'a', 'b']));
    const result = await leaveTeamService('me');
    expect(mockTeam.removeMember).toHaveBeenCalledWith('T', 'me');
    expect(mockTeam.deleteById).not.toHaveBeenCalled();
    expect(mockProfile.setTeamForUsers).toHaveBeenCalledWith(['me'], null);
    expect(result.status).toBe(200);
  });
});

describe('getTeamBoardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns 404 NO_TEAM without a team', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null));
    expect((await getTeamBoardService('me')).status).toBe(404);
  });

  it('builds members, intersection grid, and comments', async () => {
    const everyDay = [0, 1, 2, 3, 4, 5, 6];
    const me = fakeUser('me', 'T', [
      { key: 'water', days: everyDay },
      { key: 'read', days: everyDay },
      { key: 'workout', days: [0, 1, 2, 4] },
      { key: 'no-junk', days: everyDay },
      { key: 'my-own', days: [0] },
    ]);
    const mate = fakeUser('mate', 'T', [
      { key: 'water', days: everyDay },
      { key: 'workout', days: [1, 2, 4, 5] },
      { key: 'no-junk', days: everyDay },
      { key: 'my-own', days: [0, 3] },
    ]);
    mockProfile.findById.mockResolvedValueOnce(me);
    mockTeam.findById.mockResolvedValueOnce(team('T', ['me', 'mate']));
    mockProfile.findByIds.mockResolvedValueOnce([me, mate]);
    mockSync.mockImplementation(async (user) => ({ user, today: '2026-11-25', day: 7 }));
    mockCheckIn.findCommentedByUsersSince.mockResolvedValueOnce([
      { _id: oid('c1'), userId: oid('mate'), challengeKey: 'water', comment: 'Park 7pm', date: '2026-11-25', joiners: [oid('me')] },
      { _id: oid('c2'), userId: oid('mate'), challengeKey: 'no-junk', comment: 'Pizza', date: '2026-11-25', exception: true, joiners: [] },
    ] as never);

    const result = await getTeamBoardService('me');
    expect(result.status).toBe(200);
    const board = result.data;
    expect(board).toMatchObject({
      teamId: 'T',
      todayIndex: 2,
      grid: [
        { key: 'water', title: 'Drink 2 L of water', kind: 'daily', label: 'Every day', counts: [2, 2, 2, 2, 2, 2, 2] },
        { key: 'workout', title: 'Work out 45 min', kind: 'scheduled', label: null, counts: [1, 2, 2, 0, 2, 1, 0] },
        { key: 'no-junk', title: 'No junk food', kind: 'monthly', label: 'Every day · 1/month allowance' },
        { key: 'my-own', title: 'T-my-own', kind: 'custom', label: null, counts: [2, 0, 0, 1, 0, 0, 0] },
      ],
      members: [
        { id: 'me', day: 7, isMe: true },
        { id: 'mate', day: 7, isMe: false },
      ],
      comments: [{ id: 'c1', userName: 'mate', challengeTitle: 'Drink 2 L of water', joinedByMe: true, isMine: false, joiners: [{ id: 'me', name: 'me' }] }],
    });
    const memberChallenges = 'memberChallenges' in board ? board.memberChallenges : [];
    expect(memberChallenges[0]?.challenges[0]).toMatchObject({ key: 'water', title: 'Drink 2 L of water' });
    expect(mockCheckIn.findCommentedByUsersSince).toHaveBeenCalledWith(['me', 'mate'], '2026-11-23');
  });
});

describe('toggleJoinService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects malformed ids', async () => {
    expect((await toggleJoinService('me', 'short')).status).toBe(400);
  });

  it('rejects own check-in', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T'));
    mockCheckIn.findById.mockResolvedValueOnce({ userId: oid('me'), joiners: [] } as never);
    expect((await toggleJoinService('me', CHECKIN_ID)).data).toEqual({ error: 'OWN_CHECKIN' });
  });

  it('rejects non-teammates', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T')).mockResolvedValueOnce(fakeUser('o', 'OTHER'));
    mockCheckIn.findById.mockResolvedValueOnce({ userId: oid('o'), joiners: [] } as never);
    expect((await toggleJoinService('me', CHECKIN_ID)).status).toBe(403);
  });

  it('adds then removes the viewer', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T')).mockResolvedValueOnce(fakeUser('o', 'T'));
    mockCheckIn.findById.mockResolvedValueOnce({ userId: oid('o'), joiners: [] } as never);
    expect((await toggleJoinService('me', CHECKIN_ID)).data).toEqual({ joined: true });
    expect(mockCheckIn.addJoiner).toHaveBeenCalledWith(CHECKIN_ID, 'me');

    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T')).mockResolvedValueOnce(fakeUser('o', 'T'));
    mockCheckIn.findById.mockResolvedValueOnce({ userId: oid('o'), joiners: [oid('me')] } as never);
    expect((await toggleJoinService('me', CHECKIN_ID)).data).toEqual({ joined: false });
    expect(mockCheckIn.removeJoiner).toHaveBeenCalledWith(CHECKIN_ID, 'me');
  });
});
