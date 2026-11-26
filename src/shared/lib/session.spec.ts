import { describe, expect, it, vi } from 'vitest';

import { auth } from '@/shared/lib/auth';
import { sessionReader } from '@/shared/lib/session';

vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));

describe('sessionReader', () => {
  it('returns user id from session', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'abc' }, expires: '' } as never);
    expect(await sessionReader.currentUserId()).toBe('abc');
  });

  it('returns null without session', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await sessionReader.currentUserId()).toBeNull();
  });
});
