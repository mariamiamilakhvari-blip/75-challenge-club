import { NextRequest, NextResponse } from 'next/server';

import { deleteCheckInService } from '@/features/checkin/service/checkin.service';
import { sessionReader } from '@/shared/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { id } = await params;
    const { data, status } = await deleteCheckInService(userId, id);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
