import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { teamRepository } from '@/features/team/repository/team.repository';

import { joinTeamService, leaveTeamService, loadTeamContext, toggleJoinService } from './team.service';

const mockProfile = vi.mocked(profileRepository);
const mockTeam = vi.mocked(teamRepository);
const mockCheckIn = vi.mocked(checkInRepository);

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

describe('loadTeamContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns NO_TEAM when the viewer has no team', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', null));
    const result = await loadTeamContext('me');
    expect(result).toEqual({ ok: false, error: { data: { error: 'NO_TEAM' }, status: 404 } });
  });

  it('returns the viewer, team id and member ids', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser('me', 'T'));
    mockTeam.findById.mockResolvedValueOnce(team('T', ['me', 'mate']));
    const result = await loadTeamContext('me');
    expect(result.ok && result.context.teamId).toBe('T');
    expect(result.ok && result.context.memberIds).toEqual(['me', 'mate']);
  });
});
