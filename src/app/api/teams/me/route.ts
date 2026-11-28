import { NextResponse } from 'next/server';

import { getTeamBoardService } from '@/features/team/service/team-board.service';
import { sessionReader } from '@/shared/lib/session';

export async function GET() {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { data, status } = await getTeamBoardService(userId);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
