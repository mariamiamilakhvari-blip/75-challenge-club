import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateChallengesService } from '@/features/profile/service/profile.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { PUT } from './route';

vi.mock('@/features/profile/service/profile.service', () => ({ updateChallengesService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));
vi.mock('@/shared/middleware/validate-body', () => ({ validateBody: vi.fn() }));

const body = { challenges: [{ key: 'water', title: 'Water', custom: false, days: [0] }] };

function makeRequest() {
  return new NextRequest('http://localhost/api/profile/challenges', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PUT /api/profile/challenges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    const res = await PUT(makeRequest());
    expect(res.status).toBe(401);
    expect(validateBody).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid body', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(validateBody).mockResolvedValueOnce(NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 }));
    const res = await PUT(makeRequest());
    expect(res.status).toBe(400);
  });

  it('passes userId and body to service', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: body });
    vi.mocked(updateChallengesService).mockResolvedValueOnce({ data: { error: 'NOT_FOUND' }, status: 404 });
    const res = await PUT(makeRequest());
    expect(updateChallengesService).toHaveBeenCalledWith('507f1f77bcf86cd799439011', body);
    expect(res.status).toBe(404);
  });
});
