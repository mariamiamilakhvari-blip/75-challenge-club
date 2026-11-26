import { NextRequest, NextResponse } from 'next/server';

import { skipService } from '@/features/team/service/discover.service';
import { UserIdSchema } from '@/features/team/validations/team.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

export async function POST(req: NextRequest) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, UserIdSchema);
    if (validated instanceof NextResponse) return validated;

    const { data, status } = await skipService(userId, validated.data.userId);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
