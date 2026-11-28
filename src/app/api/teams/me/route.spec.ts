import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/team-board.service', () => ({
  getTeamBoardService: vi.fn(),
}));

vi.mock('@/shared/lib/session', () => ({
  sessionReader: { currentUserId: vi.fn() },
}));

import { getTeamBoardService } from '@/features/team/service/team-board.service';
import { sessionReader } from '@/shared/lib/session';

import { GET } from './route';

const mockService = vi.mocked(getTeamBoardService);
const mockSession = vi.mocked(sessionReader);

describe('GET /api/teams/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    mockSession.currentUserId.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);
  });

  it('returns 404 NO_TEAM from service', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockService.mockResolvedValueOnce({ data: { error: 'NO_TEAM' }, status: 404 });
    const res = await GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'NO_TEAM' });
  });
});
