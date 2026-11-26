import { NextRequest, NextResponse } from 'next/server';

import { updateChallengesService } from '@/features/profile/service/profile.service';
import { UpdateChallengesSchema } from '@/features/profile/validations/profile.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

export async function PUT(req: NextRequest) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, UpdateChallengesSchema);
    if (validated instanceof NextResponse) return validated;

    const { data, status } = await updateChallengesService(userId, validated.data);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
