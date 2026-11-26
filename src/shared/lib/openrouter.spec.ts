import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openRouter } from './openrouter';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const messages = [{ role: 'user' as const, content: 'hi' }];

function makeResponse(body: object, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('openRouter.chat', () => {
  const originalKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  });

  it('returns message content on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ choices: [{ message: { content: ' hello ' } }] }));
    expect(await openRouter.chat(messages, { maxTokens: 50, temperature: 0.2 })).toBe('hello');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-key', 'X-Title': '75 Challenge Club' });
    expect(JSON.parse(init.body)).toMatchObject({
      max_tokens: 50,
      temperature: 0.2,
      reasoning: { enabled: false },
      messages,
    });
  });

  it('returns null on non-200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ error: 'rate' }, 429));
    expect(await openRouter.chat(messages)).toBeNull();
  });

  it('returns null on malformed body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ choices: [] }));
    expect(await openRouter.chat(messages)).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    expect(await openRouter.chat(messages)).toBeNull();
  });

  it('returns null without api key and skips fetch', async () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(await openRouter.chat(messages)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
