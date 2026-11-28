import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/dodo', () => ({ dodo: { verifyWebhook: vi.fn() } }));
vi.mock('@/features/billing/service/billing.service', () => ({ handleDodoWebhookService: vi.fn() }));

import { handleDodoWebhookService } from '@/features/billing/service/billing.service';
import { dodo } from '@/shared/lib/dodo';

import { POST } from './route';

const body = JSON.stringify({ type: 'subscription.active', data: {} });
const req = () =>
  new NextRequest('http://localhost/api/webhooks/dodo', {
    method: 'POST',
    body,
    headers: { 'webhook-id': 'msg_1', 'webhook-timestamp': '1700000000', 'webhook-signature': 'v1,abc' },
  });

describe('POST /api/webhooks/dodo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('verifies the raw body with the Standard Webhooks headers', async () => {
    vi.mocked(dodo.verifyWebhook).mockReturnValueOnce(null);
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(dodo.verifyWebhook).toHaveBeenCalledWith(body, {
      'webhook-id': 'msg_1',
      'webhook-timestamp': '1700000000',
      'webhook-signature': 'v1,abc',
    });
    expect(handleDodoWebhookService).not.toHaveBeenCalled();
  });

  it('hands verified events to the service', async () => {
    const event = { type: 'subscription.active', timestamp: 't', data: {} };
    vi.mocked(dodo.verifyWebhook).mockReturnValueOnce(event);
    vi.mocked(handleDodoWebhookService).mockResolvedValueOnce({ data: { handled: true }, status: 200 });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(handleDodoWebhookService).toHaveBeenCalledWith(event);
  });

  it('returns 500 when processing throws so Dodo retries', async () => {
    vi.mocked(dodo.verifyWebhook).mockReturnValueOnce({ type: 'subscription.active', timestamp: 't', data: {} });
    vi.mocked(handleDodoWebhookService).mockRejectedValueOnce(new Error('db down'));
    expect((await POST(req())).status).toBe(500);
  });
});
