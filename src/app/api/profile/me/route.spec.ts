import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyProfileService } from '@/features/profile/service/profile.service';
import { sessionReader } from '@/shared/lib/session';

import { GET } from './route';

vi.mock('@/features/profile/service/profile.service', () => ({ getMyProfileService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));

describe('GET /api/profile/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' });
  });

  it('returns service result', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(getMyProfileService).mockResolvedValueOnce({ data: { error: 'NOT_FOUND' }, status: 404 });
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(getMyProfileService).mockRejectedValueOnce(new Error('DB'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
