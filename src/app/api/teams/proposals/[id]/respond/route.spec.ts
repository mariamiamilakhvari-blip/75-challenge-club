import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/team/service/day-proposal.service', () => ({ respondProposalService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));
vi.mock('@/shared/middleware/validate-body', () => ({ validateBody: vi.fn() }));

import { respondProposalService } from '@/features/team/service/day-proposal.service';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

import { POST } from './route';

const ID = 'd'.repeat(24);
const call = () =>
  POST(new NextRequest(`http://localhost/api/teams/proposals/${ID}/respond`, { method: 'POST', body: '{}' }), {
    params: Promise.resolve({ id: ID }),
  });

describe('POST /api/teams/proposals/[id]/respond', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    expect((await call()).status).toBe(401);
  });

  it('forwards id and accept flag to the service', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('me');
    vi.mocked(validateBody).mockResolvedValueOnce({ data: { accept: true } } as never);
    vi.mocked(respondProposalService).mockResolvedValueOnce({ data: { accepted: true }, status: 200 });
    const res = await call();
    expect(res.status).toBe(200);
    expect(respondProposalService).toHaveBeenCalledWith('me', ID, { accept: true });
  });
});
