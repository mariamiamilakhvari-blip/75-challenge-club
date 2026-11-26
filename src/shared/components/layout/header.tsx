'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { ThemeToggle } from '@/shared/components/layout/theme-toggle';
import { Button } from '@/shared/components/ui/button';
import { APP_NAME } from '@/shared/const/app.const';
import { HOME_AFTER_LOGIN } from '@/shared/const/routes.const';

export const Header = () => {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  return (
    <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
      <Link href="/" className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-xl bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm"
        >
          75
        </span>
        <span className="text-base font-extrabold tracking-tight text-foreground">{APP_NAME}</span>
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {signedIn ? (
          <Button size="sm" asChild className="rounded-full px-4 font-semibold">
            <Link href={HOME_AFTER_LOGIN}>Open app</Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild className="rounded-full font-semibold text-muted-foreground hover:text-foreground">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
