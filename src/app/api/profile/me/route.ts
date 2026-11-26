import { NextResponse } from 'next/server';

import { getMyProfileService } from '@/features/profile/service/profile.service';
import { sessionReader } from '@/shared/lib/session';

export async function GET() {
  try {
    const userId = await sessionReader.currentUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { data, status } = await getMyProfileService(userId);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
