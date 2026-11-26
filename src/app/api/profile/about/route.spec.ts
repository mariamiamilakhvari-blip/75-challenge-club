import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateAboutService } from '@/features/profile/service/profile.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { PUT } from './route';

vi.mock('@/features/profile/service/profile.service', () => ({ updateAboutService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));
vi.mock('@/shared/middleware/validate-body', () => ({ validateBody: vi.fn() }));

const body = { age: 27, city: 'Tbilisi', interests: ['Yoga'], timezone: 'Asia/Tbilisi' };

function makeRequest() {
  return new NextRequest('http://localhost/api/profile/about', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PUT /api/profile/about', () => {
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
    vi.mocked(updateAboutService).mockResolvedValueOnce({ data: { error: 'NOT_FOUND' }, status: 404 });
    const res = await PUT(makeRequest());
    expect(updateAboutService).toHaveBeenCalledWith('507f1f77bcf86cd799439011', body);
    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: body });
    vi.mocked(updateAboutService).mockRejectedValueOnce(new Error('boom'));
    const res = await PUT(makeRequest());
    expect(res.status).toBe(500);
  });
});
