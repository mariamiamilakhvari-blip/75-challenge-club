import { NextRequest, NextResponse } from 'next/server';

import { joinTeamService } from '@/features/team/service/team.service';
import { UserIdSchema } from '@/features/team/validations/team.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

export async function POST(req: NextRequest) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, UserIdSchema);
    if (validated instanceof NextResponse) return validated;

    const { data, status } = await joinTeamService(userId, validated.data.userId);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
