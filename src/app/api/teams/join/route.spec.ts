import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/team.service', () => ({
  joinTeamService: vi.fn(),
}));

vi.mock('@/shared/lib/session', () => ({
  sessionReader: { currentUserId: vi.fn() },
}));

vi.mock('@/shared/middleware/validate-body', () => ({
  validateBody: vi.fn(),
}));

import { joinTeamService } from '@/features/team/service/team.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { POST } from './route';

const mockService = vi.mocked(joinTeamService);
const mockSession = vi.mocked(sessionReader);
const mockValidate = vi.mocked(validateBody);
const TARGET = 'b'.repeat(24);

function makeRequest() {
  return new NextRequest('http://localhost/api/teams/join', { method: 'POST', body: JSON.stringify({ userId: TARGET }) });
}

describe('POST /api/teams/join', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    mockSession.currentUserId.mockResolvedValueOnce(null);
    expect((await POST(makeRequest())).status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockValidate.mockResolvedValueOnce(NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 }));
    expect((await POST(makeRequest())).status).toBe(400);
  });

  it('returns 409 when team is full', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockValidate.mockResolvedValueOnce({ data: { userId: TARGET } });
    mockService.mockResolvedValueOnce({ data: { error: 'TEAM_FULL' }, status: 409 });
    expect((await POST(makeRequest())).status).toBe(409);
    expect(mockService).toHaveBeenCalledWith('me', TARGET);
  });

  it('returns teamId on success', async () => {
    mockSession.currentUserId.mockResolvedValueOnce('me');
    mockValidate.mockResolvedValueOnce({ data: { userId: TARGET } });
    mockService.mockResolvedValueOnce({ data: { teamId: 'T' }, status: 200 });
    const res = await POST(makeRequest());
    expect(await res.json()).toEqual({ teamId: 'T' });
  });
});
