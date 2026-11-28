import { NextRequest, NextResponse } from 'next/server';

import { createCheckoutService } from '@/features/billing/service/billing.service';
import { CheckoutSchema } from '@/features/billing/validations/billing.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

export async function POST(req: NextRequest) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, CheckoutSchema);
    if (validated instanceof NextResponse) return validated;

    const { data, status } = await createCheckoutService(userId, validated.data);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
