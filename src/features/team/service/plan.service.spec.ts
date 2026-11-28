import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/profile/repository/profile.repository', () => ({
  profileRepository: { findById: vi.fn() },
}));
vi.mock('@/features/team/repository/team.repository', () => ({
  teamRepository: { findById: vi.fn() },
}));
vi.mock('@/features/team/repository/plan.repository', () => ({
  planRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    addReply: vi.fn(),
    addJoiner: vi.fn(),
    removeJoiner: vi.fn(),
    deleteById: vi.fn(),
  },
}));

import { profileRepository } from '@/features/profile/repository/profile.repository';
import { planRepository } from '@/features/team/repository/plan.repository';
import { teamRepository } from '@/features/team/repository/team.repository';
import {
  createPlanService,
  deletePlanService,
  replyToPlanService,
  togglePlanJoinService,
} from '@/features/team/service/plan.service';

const oid = (id: string) => ({ toString: () => id });
const PLAN_ID = 'c'.repeat(24);

function inTeam(teamId: string | null = 'T') {
  vi.mocked(profileRepository.findById).mockResolvedValueOnce({
    _id: oid('me'),
    teamId: teamId ? oid(teamId) : null,
    challenges: [{ key: 'workout', days: [0, 2, 4, 5] }, { key: 'read', days: [0, 1, 2, 3, 4, 5, 6] }],
  } as never);
  if (teamId) vi.mocked(teamRepository.findById).mockResolvedValueOnce({ _id: oid(teamId), members: [oid('me'), oid('mate')] } as never);
}

const plan = (overrides: Record<string, unknown> = {}) =>
  ({ _id: oid(PLAN_ID), teamId: oid('T'), userId: oid('mate'), challengeKey: 'workout', joiners: [], ...overrides }) as never;

describe('createPlanService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires a team', async () => {
    inTeam(null);
    expect(await createPlanService('me', { challengeKey: 'workout' })).toEqual({ data: { error: 'NO_TEAM' }, status: 404 });
  });

  it('rejects challenges the viewer does not have', async () => {
    inTeam();
    const result = await createPlanService('me', { challengeKey: 'social', place: 'Cinema' });
    expect(result).toEqual({ data: { error: 'NOT_YOUR_CHALLENGE' }, status: 400 });
  });

  it('rejects plans missing required fields', async () => {
    inTeam();
    const result = await createPlanService('me', { challengeKey: 'workout', place: 'Gym' });
    expect(result).toEqual({ data: { error: 'MISSING_FIELDS' }, status: 400 });
    expect(planRepository.create).not.toHaveBeenCalled();
  });

  it('saves only the fields the prompt asks for', async () => {
    inTeam();
    vi.mocked(planRepository.create).mockResolvedValueOnce('NEW');
    const result = await createPlanService('me', { challengeKey: 'read', book: 'Dune', author: 'Herbert', place: 'nope' });
    expect(result).toEqual({ data: { id: 'NEW' }, status: 201 });
    expect(planRepository.create).toHaveBeenCalledWith({
      teamId: 'T', userId: 'me', challengeKey: 'read',
      place: '', when: '', activity: '', book: 'Dune', author: 'Herbert', note: '',
    });
  });
});

describe('replyToPlanService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects malformed ids', async () => {
    expect((await replyToPlanService('me', 'bad', { text: 'hi' })).status).toBe(400);
  });

  it('rejects plans from another team', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan({ teamId: oid('OTHER') }));
    expect(await replyToPlanService('me', PLAN_ID, { text: 'hi' })).toEqual({ data: { error: 'NOT_TEAMMATE' }, status: 403 });
  });

  it('adds a trimmed reply', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan());
    expect((await replyToPlanService('me', PLAN_ID, { text: ' See you there ' })).status).toBe(201);
    expect(planRepository.addReply).toHaveBeenCalledWith(PLAN_ID, 'me', 'See you there');
  });
});

describe('togglePlanJoinService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects own plans', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan({ userId: oid('me') }));
    expect((await togglePlanJoinService('me', PLAN_ID)).data).toEqual({ error: 'OWN_PLAN' });
  });

  it('rejects non-joinable plans (reading)', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan({ challengeKey: 'read' }));
    expect((await togglePlanJoinService('me', PLAN_ID)).data).toEqual({ error: 'NOT_JOINABLE' });
  });

  it('joins then leaves a workout plan', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan());
    expect((await togglePlanJoinService('me', PLAN_ID)).data).toEqual({ joined: true });
    expect(planRepository.addJoiner).toHaveBeenCalledWith(PLAN_ID, 'me');

    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan({ joiners: [oid('me')] }));
    expect((await togglePlanJoinService('me', PLAN_ID)).data).toEqual({ joined: false });
    expect(planRepository.removeJoiner).toHaveBeenCalledWith(PLAN_ID, 'me');
  });
});

describe('deletePlanService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('only lets the author delete', async () => {
    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan());
    expect((await deletePlanService('me', PLAN_ID)).status).toBe(403);

    inTeam();
    vi.mocked(planRepository.findById).mockResolvedValueOnce(plan({ userId: oid('me') }));
    expect((await deletePlanService('me', PLAN_ID)).data).toEqual({ deleted: true });
    expect(planRepository.deleteById).toHaveBeenCalledWith(PLAN_ID);
  });
});
