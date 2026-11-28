import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/billing/service/billing.service', () => ({ createCheckoutService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));
vi.mock('@/shared/middleware/validate-body', () => ({ validateBody: vi.fn() }));

import { createCheckoutService } from '@/features/billing/service/billing.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { POST } from './route';

const req = () => new NextRequest('http://localhost/api/billing/checkout', { method: 'POST', body: '{}' });

describe('POST /api/billing/checkout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    expect((await POST(req())).status).toBe(401);
  });

  it('returns 400 for an unknown plan', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce(NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 }));
    expect((await POST(req())).status).toBe(400);
  });

  it('returns the checkout url', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: { plan: 'yearly' } } as never);
    vi.mocked(createCheckoutService).mockResolvedValueOnce({ data: { checkoutUrl: 'https://checkout' }, status: 200 });
    const res = await POST(req());
    expect(await res.json()).toEqual({ checkoutUrl: 'https://checkout' });
    expect(createCheckoutService).toHaveBeenCalledWith('me', { plan: 'yearly' });
  });
});
