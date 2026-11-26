import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/discover.service', () => ({
  getDiscoverDeckService: vi.fn(),
}));

vi.mock('@/shared/lib/session', () => ({
  sessionReader: { currentUserId: vi.fn() },
}));

import { getDiscoverDeckService } from '@/features/team/service/discover.service';
import { sessionReader } from '@/shared/lib/session';

import { GET } from './route';

const mockService = vi.mocked(getDiscoverDeckService);
const mockSession = vi.mocked(sessionReader);

describe('GET /api/discover', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    mockSession.currentUserId.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);
  });

  it('passes service status through', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockService.mockResolvedValueOnce({ data: { error: 'NOT_PUBLISHED' }, status: 403 });
    const res = await GET();
    expect(res.status).toBe(403);
    expect(mockService).toHaveBeenCalledWith('me');
  });

  it('returns 500 when service throws', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockService.mockRejectedValueOnce(new Error('boom'));
    expect((await GET()).status).toBe(500);
  });
});
