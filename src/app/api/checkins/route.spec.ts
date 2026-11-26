import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/checkin/service/checkin.service', () => ({
  createCheckInService: vi.fn(),
}));

vi.mock('@/shared/middleware/validate-body', () => ({
  validateBody: vi.fn(),
}));

vi.mock('@/shared/lib/session', () => ({
  sessionReader: { currentUserId: vi.fn() },
}));

import { createCheckInService } from '@/features/checkin/service/checkin.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { POST } from './route';

const mockCreate = vi.mocked(createCheckInService);
const mockValidate = vi.mocked(validateBody);
const mockUserId = vi.mocked(sessionReader.currentUserId);

const USER_ID = '507f1f77bcf86cd799439011';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/checkins', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/checkins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId.mockResolvedValue(USER_ID);
  });

  it('returns 401 when not signed in', async () => {
    mockUserId.mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ challengeKey: 'water' }));
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 201 on success', async () => {
    mockValidate.mockResolvedValueOnce({ data: { challengeKey: 'water', comment: 'Gym' } });
    mockCreate.mockResolvedValueOnce({ data: { id: 'abc' }, status: 201 });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(USER_ID, { challengeKey: 'water', comment: 'Gym' });
  });

  it('returns 400 when not scheduled today', async () => {
    mockValidate.mockResolvedValueOnce({ data: { challengeKey: 'social' } });
    mockCreate.mockResolvedValueOnce({ data: { error: 'NOT_SCHEDULED_TODAY' }, status: 400 });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 409 when already done', async () => {
    mockValidate.mockResolvedValueOnce({ data: { challengeKey: 'water' } });
    mockCreate.mockResolvedValueOnce({ data: { error: 'ALREADY_DONE' }, status: 409 });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(409);
  });

  it('returns validation error when body is invalid', async () => {
    mockValidate.mockResolvedValueOnce(
      NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    );
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when service throws', async () => {
    mockValidate.mockResolvedValueOnce({ data: { challengeKey: 'water' } });
    mockCreate.mockRejectedValueOnce(new Error('DB error'));
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(500);
  });
});
