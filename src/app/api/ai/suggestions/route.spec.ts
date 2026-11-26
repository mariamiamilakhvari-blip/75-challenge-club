import { beforeEach, describe, expect, it, vi } from 'vitest';

import { suggestChallengesService } from '@/features/ai/service/suggestion.service';
import { sessionReader } from '@/shared/lib/session';

import { GET } from './route';

vi.mock('@/features/ai/service/suggestion.service', () => ({ suggestChallengesService: vi.fn() }));
vi.mock('@/shared/lib/session', () => ({ sessionReader: { currentUserId: vi.fn() } }));

describe('GET /api/ai/suggestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without session', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' });
  });

  it('returns service result', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(suggestChallengesService).mockResolvedValueOnce({
      data: { suggestions: [], source: 'fallback' },
      status: 200,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [], source: 'fallback' });
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(sessionReader.currentUserId).mockResolvedValueOnce('507f1f77bcf86cd799439011');
    vi.mocked(suggestChallengesService).mockRejectedValueOnce(new Error('boom'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
