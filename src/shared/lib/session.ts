import { auth } from '@/shared/lib/auth';

type SessionUser = { id?: string };

class SessionReader {
  async currentUserId(): Promise<string | null> {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    return user?.id ?? null;
  }
}

export const sessionReader = new SessionReader();
export { SessionReader };
