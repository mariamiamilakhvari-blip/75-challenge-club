import { NextRequest, NextResponse } from 'next/server';

import { handleDodoWebhookService } from '@/features/billing/service/billing.service';
import { dodo } from '@/shared/lib/dodo';

// Dodo signs webhooks with the Standard Webhooks scheme; the raw body must be verified as-is.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? '',
    };

    const event = dodo.verifyWebhook(rawBody, headers);
    if (!event) return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });

    const { data, status } = await handleDodoWebhookService(event);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
