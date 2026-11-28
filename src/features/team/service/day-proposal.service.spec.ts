import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/profile/repository/profile.repository', () => ({
  profileRepository: { findById: vi.fn(), findByIds: vi.fn(), setChallengeDays: vi.fn() },
}));
vi.mock('@/features/team/repository/team.repository', () => ({
  teamRepository: { findById: vi.fn() },
}));
vi.mock('@/features/team/repository/day-proposal.repository', () => ({
  dayProposalRepository: {
    findById: vi.fn(),
    deleteByTeamAndChallenge: vi.fn(),
    create: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
  },
}));
vi.mock('@/features/profile/service/streak.service', () => ({ syncStreak: vi.fn() }));

import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { dayProposalRepository } from '@/features/team/repository/day-proposal.repository';
import { teamRepository } from '@/features/team/repository/team.repository';
import { proposeDaysService, respondProposalService } from '@/features/team/service/day-proposal.service';

const oid = (id: string) => ({ toString: () => id });
const PROPOSAL_ID = 'd'.repeat(24);

const user = (id: string, keys: string[]) =>
  ({ _id: oid(id), teamId: oid('T'), challenges: keys.map((key) => ({ key, days: [0] })) }) as never;

function inTeam(viewerKeys = ['workout', 'social', 'water']) {
  vi.mocked(profileRepository.findById).mockResolvedValueOnce(user('me', viewerKeys));
  vi.mocked(teamRepository.findById).mockResolvedValueOnce({ _id: oid('T'), members: [oid('me'), oid('mate')] } as never);
}

describe('proposeDaysService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects daily challenges', async () => {
    inTeam();
    expect((await proposeDaysService('me', { challengeKey: 'water', days: [0] })).data).toEqual({ error: 'NOT_SCHEDULED' });
  });

  it('rejects challenges not every member has', async () => {
    inTeam();
    vi.mocked(profileRepository.findByIds).mockResolvedValueOnce([user('me', ['workout']), user('mate', ['social'])]);
    expect((await proposeDaysService('me', { challengeKey: 'workout', days: [0, 2, 4, 6] })).data).toEqual({ error: 'NOT_SHARED' });
  });

  it('enforces the day-count rule', async () => {
    inTeam();
    vi.mocked(profileRepository.findByIds).mockResolvedValueOnce([user('me', ['workout']), user('mate', ['workout'])]);
    const result = await proposeDaysService('me', { challengeKey: 'workout', days: [0, 2, 4] });
    expect(result).toEqual({ data: { error: 'INVALID_DAYS' }, status: 400 });
    expect(dayProposalRepository.create).not.toHaveBeenCalled();
  });

  it('replaces the old proposal and moves the proposer onto the shared days', async () => {
    inTeam();
    vi.mocked(profileRepository.findByIds).mockResolvedValueOnce([user('me', ['social']), user('mate', ['social'])]);
    vi.mocked(dayProposalRepository.create).mockResolvedValueOnce('P');
    const result = await proposeDaysService('me', { challengeKey: 'social', days: [6] });
    expect(result).toEqual({ data: { id: 'P' }, status: 201 });
    expect(dayProposalRepository.deleteByTeamAndChallenge).toHaveBeenCalledWith('T', 'social');
    expect(dayProposalRepository.create).toHaveBeenCalledWith({ teamId: 'T', challengeKey: 'social', proposerId: 'me', days: [6] });
    expect(syncStreak).toHaveBeenCalled();
    expect(profileRepository.setChallengeDays).toHaveBeenCalledWith('me', 'social', [6]);
  });
});

describe('respondProposalService', () => {
  beforeEach(() => vi.clearAllMocks());

  const proposal = { _id: oid(PROPOSAL_ID), teamId: oid('T'), challengeKey: 'workout', days: [0, 2, 4, 6] };

  it('rejects proposals from another team', async () => {
    inTeam();
    vi.mocked(dayProposalRepository.findById).mockResolvedValueOnce({ ...proposal, teamId: oid('X') } as never);
    expect((await respondProposalService('me', PROPOSAL_ID, { accept: true })).status).toBe(403);
  });

  it('declines without touching the schedule', async () => {
    inTeam();
    vi.mocked(dayProposalRepository.findById).mockResolvedValueOnce(proposal as never);
    expect((await respondProposalService('me', PROPOSAL_ID, { accept: false })).data).toEqual({ accepted: false });
    expect(dayProposalRepository.decline).toHaveBeenCalledWith(PROPOSAL_ID, 'me');
    expect(profileRepository.setChallengeDays).not.toHaveBeenCalled();
  });

  it('accepts and updates the personal schedule to the shared days', async () => {
    inTeam();
    vi.mocked(dayProposalRepository.findById).mockResolvedValueOnce(proposal as never);
    expect((await respondProposalService('me', PROPOSAL_ID, { accept: true })).data).toEqual({ accepted: true });
    expect(dayProposalRepository.accept).toHaveBeenCalledWith(PROPOSAL_ID, 'me');
    expect(profileRepository.setChallengeDays).toHaveBeenCalledWith('me', 'workout', [0, 2, 4, 6]);
  });
});
