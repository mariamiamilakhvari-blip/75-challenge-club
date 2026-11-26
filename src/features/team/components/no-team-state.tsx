import { Compass, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

export const NoTeamState = () => {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card px-6 py-12 text-center animate-rise">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="size-7" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-extrabold">You're not in a team yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Find people who share your challenges and team up.</p>
      </div>
      <Button asChild size="lg" className="rounded-full font-bold">
        <Link href="/discover">
          <Compass aria-hidden />
          Find teammates
        </Link>
      </Button>
    </div>
  );
};
