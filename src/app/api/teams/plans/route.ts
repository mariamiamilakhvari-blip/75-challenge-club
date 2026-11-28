import { NextRequest, NextResponse } from 'next/server';

import { createPlanService } from '@/features/team/service/plan.service';
import { CreatePlanSchema } from '@/features/team/validations/plan.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

export async function POST(req: NextRequest) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, CreatePlanSchema);
    if (validated instanceof NextResponse) return validated;

    const { data, status } = await createPlanService(userId, validated.data);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
