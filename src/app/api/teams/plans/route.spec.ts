import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/plan.service', () => ({ createPlanService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));
vi.mock('@/shared/middleware/validate-body', () => ({ validateBody: vi.fn() }));

import { createPlanService } from '@/features/team/service/plan.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { POST } from './route';

const req = () => new NextRequest('http://localhost/api/teams/plans', { method: 'POST', body: '{}' });

describe('POST /api/teams/plans', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    expect((await POST(req())).status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce(NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 }));
    expect((await POST(req())).status).toBe(400);
    expect(createPlanService).not.toHaveBeenCalled();
  });

  it('passes validated data to the service', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: { challengeKey: 'read', book: 'Dune' } } as never);
    vi.mocked(createPlanService).mockResolvedValueOnce({ data: { id: 'P' }, status: 201 });
    const res = await POST(req());
    expect(res.status).toBe(201);
    expect(createPlanService).toHaveBeenCalledWith('me', { challengeKey: 'read', book: 'Dune' });
  });

  it('returns 500 when the service throws', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: { challengeKey: 'read' } } as never);
    vi.mocked(createPlanService).mockRejectedValueOnce(new Error('boom'));
    expect((await POST(req())).status).toBe(500);
  });
});
