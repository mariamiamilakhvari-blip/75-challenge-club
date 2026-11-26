import { type ReactNode } from 'react';

import { Header } from '@/shared/components/layout/header';

type AuthPageShellProps = {
  children: ReactNode;
};

export const AuthPageShell = ({ children }: AuthPageShellProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-12 pt-4">
        {children}
      </main>
    </div>
  );
};
