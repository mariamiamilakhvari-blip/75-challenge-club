import { type ReactNode } from 'react';

import { BottomNav } from '@/shared/components/layout/bottom-nav';

type AppShellProps = {
  children: ReactNode;
  showNav?: boolean;
};

export const AppShell = ({ children, showNav = true }: AppShellProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={showNav ? 'mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-6' : 'mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-6'}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
