import { NextRequest, NextResponse } from 'next/server';

import { respondProposalService } from '@/features/team/service/day-proposal.service';
import { RespondProposalSchema } from '@/features/team/validations/day-proposal.validation';
import { sessionReader } from '@/shared/lib/session';
import { validateBody } from '@/shared/middleware/validate-body';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const validated = await validateBody(req, RespondProposalSchema);
    if (validated instanceof NextResponse) return validated;

    const { id } = await params;
    const { data, status } = await respondProposalService(userId, id, validated.data);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
