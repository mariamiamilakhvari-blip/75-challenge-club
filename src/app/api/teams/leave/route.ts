import { NextResponse } from 'next/server';

import { leaveTeamService } from '@/features/team/service/team.service';
import { sessionReader } from '@/shared/lib/session';

export async function POST() {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { data, status } = await leaveTeamService(userId);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
