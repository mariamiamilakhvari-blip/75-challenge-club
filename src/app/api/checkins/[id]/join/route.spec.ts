import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/team.service', () => ({
  toggleJoinService: vi.fn(),
}));

vi.mock('@/shared/lib/session', () => ({
  sessionReader: { currentUserId: vi.fn() },
}));

import { toggleJoinService } from '@/features/team/service/team.service';
import { sessionReader } from '@/shared/lib/session';

import { POST } from './route';

const mockService = vi.mocked(toggleJoinService);
const mockSession = vi.mocked(sessionReader);
const ID = 'c'.repeat(24);
const req = () => new NextRequest(`http://localhost/api/checkins/${ID}/join`, { method: 'POST' });
const ctx = () => ({ params: Promise.resolve({ id: ID }) });

describe('POST /api/checkins/[id]/join', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    mockSession.currentUserId.mockResolvedValueOnce(null);
    expect((await POST(req(), ctx())).status).toBe(401);
  });

  it('toggles via service', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockService.mockResolvedValueOnce({ data: { joined: true }, status: 200 });
    const res = await POST(req(), ctx());
    expect(await res.json()).toEqual({ joined: true });
    expect(mockService).toHaveBeenCalledWith('me', ID);
  });
});
