import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { AppShell } from '@/shared/components/layout/app-shell';
import { auth } from '@/shared/lib/auth';
import { SessionProvider } from '@/shared/providers/session-provider';
import { StoreProvider } from '@/shared/providers/store-provider';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <SessionProvider>
      <StoreProvider>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </SessionProvider>
  );
}
