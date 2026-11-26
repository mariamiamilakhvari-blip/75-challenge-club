import { beforeEach, describe, expect, it, vi } from 'vitest';

import { publishService } from '@/features/profile/service/profile.service';
import { sessionReader } from '@/shared/lib/session';

import { POST } from './route';

vi.mock('@/features/profile/service/profile.service', () => ({ publishService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));

describe('POST /api/profile/publish', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 400 NO_CHALLENGES from service', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(publishService).mockResolvedValueOnce({ data: { error: 'NO_CHALLENGES' }, status: 400 });
    const res = await POST();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'NO_CHALLENGES' });
  });
});
