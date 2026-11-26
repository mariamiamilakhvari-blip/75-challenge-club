import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/profile/repository/profile.repository', () => ({
  profileRepository: {
    findById: vi.fn(),
    findPublishedExcept: vi.fn(),
    addSkipped: vi.fn(),
    clearSkipped: vi.fn(),
  },
}));

vi.mock('@/features/team/repository/team.repository', () => ({
  teamRepository: {
    findById: vi.fn(),
    findByIds: vi.fn(),
  },
}));

import { profileRepository } from '@/features/profile/repository/profile.repository';
import { teamRepository } from '@/features/team/repository/team.repository';

import { computeOverlap, getDiscoverDeckService, resetSkipsService, skipService } from './discover.service';

const mockProfile = vi.mocked(profileRepository);
const mockTeam = vi.mocked(teamRepository);

const oid = (id: string) => ({ toString: () => id });

type FakeUserInput = {
  id: string;
  published?: boolean;
  teamId?: string | null;
  skipped?: string[];
  challenges?: { key: string; days: number[] }[];
  createdAt?: string;
};

function fakeUser(input: FakeUserInput) {
  return {
    _id: oid(input.id),
    name: `User ${input.id}`,
    age: 28,
    city: 'Tbilisi',
    interests: ['yoga'],
    published: input.published ?? true,
    teamId: input.teamId ? oid(input.teamId) : null,
    skipped: (input.skipped ?? []).map(oid),
    challenges: (input.challenges ?? []).map((c) => ({ ...c, title: c.key, custom: false })),
    createdAt: new Date(input.createdAt ?? '2026-01-01'),
  } as never;
}

describe('computeOverlap', () => {
  it('counts shared keys and weekdays scheduled for both', () => {
    const result = computeOverlap(
      [
        { key: 'water', days: [0, 1, 2] },
        { key: 'read', days: [5] },
        { key: 'sleep', days: [6] },
      ],
      [
        { key: 'water', days: [1, 2, 3] },
        { key: 'read', days: [4] },
      ]
    );
    expect(result.sharedChallengeKeys).toEqual(['water', 'read']);
    expect(result.sharedDays).toBe(2);
    expect(result.score).toBe(22);
  });

  it('returns zero when nothing is shared', () => {
    expect(computeOverlap([{ key: 'a', days: [0] }], [{ key: 'b', days: [0] }])).toEqual({
      sharedChallengeKeys: [],
      sharedDays: 0,
      score: 0,
    });
  });
});

describe('getDiscoverDeckService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when viewer is not published', async () => {
    mockProfile.findById.mockResolvedValueOnce(fakeUser({ id: 'me', published: false }));
    const result = await getDiscoverDeckService('me');
    expect(result).toEqual({ data: { error: 'NOT_PUBLISHED' }, status: 403 });
  });

  it('returns 404 when viewer is missing', async () => {
    mockProfile.findById.mockResolvedValueOnce(null);
    expect((await getDiscoverDeckService('me')).status).toBe(404);
  });

  it('excludes self, skipped and teammates; drops full teams; ranks by score then newest', async () => {
    mockProfile.findById.mockResolvedValueOnce(
      fakeUser({ id: 'me', teamId: 't1', skipped: ['s1'], challenges: [{ key: 'water', days: [0, 1] }, { key: 'read', days: [2] }] })
    );
    mockTeam.findById.mockResolvedValueOnce({ _id: oid('t1'), members: [oid('me'), oid('mate')] } as never);
    mockProfile.findPublishedExcept.mockResolvedValueOnce([
      fakeUser({ id: 'low', challenges: [{ key: 'water', days: [5] }], createdAt: '2026-03-01' }),
      fakeUser({ id: 'full', teamId: 't9', challenges: [{ key: 'water', days: [0] }] }),
      fakeUser({ id: 'high', teamId: 't2', challenges: [{ key: 'water', days: [0] }, { key: 'read', days: [2] }] }),
      fakeUser({ id: 'tieOld', challenges: [{ key: 'water', days: [6] }], createdAt: '2026-01-01' }),
    ]);
    mockTeam.findByIds.mockResolvedValueOnce([
      { _id: oid('t9'), members: [1, 2, 3, 4, 5, 6].map((n) => oid(`m${n}`)) },
      { _id: oid('t2'), members: [oid('high'), oid('x')] },
    ] as never);

    const result = await getDiscoverDeckService('me');

    expect(mockProfile.findPublishedExcept).toHaveBeenCalledWith(['me', 's1', 'me', 'mate']);
    expect(result.status).toBe(200);
    const cards = result.data as { id: string; teamSize: number; sharedChallenges: number; sharedDays: number }[];
    expect(cards.map((c) => c.id)).toEqual(['high', 'low', 'tieOld']);
    expect(cards[0]).toMatchObject({ teamSize: 2, sharedChallenges: 2, sharedDays: 2 });
    expect(cards[1].teamSize).toBe(0);
  });
});

describe('skipService / resetSkipsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds the target to skipped', async () => {
    const result = await skipService('me', 'other');
    expect(mockProfile.addSkipped).toHaveBeenCalledWith('me', 'other');
    expect(result.status).toBe(200);
  });

  it('rejects skipping self', async () => {
    expect((await skipService('me', 'me')).status).toBe(400);
    expect(mockProfile.addSkipped).not.toHaveBeenCalled();
  });

  it('clears skipped', async () => {
    const result = await resetSkipsService('me');
    expect(mockProfile.clearSkipped).toHaveBeenCalledWith('me');
    expect(result.data).toEqual({ reset: true });
  });
});
