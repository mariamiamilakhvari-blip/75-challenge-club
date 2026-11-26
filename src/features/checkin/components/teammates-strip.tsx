import { Users } from 'lucide-react';
import Link from 'next/link';

import { TeammateProgress } from '@/features/checkin/types/checkin.types';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/lib/utils';

type TeammatesStripProps = {
  teammates: TeammateProgress[];
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const TeammatesStrip = ({ teammates }: TeammatesStripProps) => {
  if (teammates.length === 0) {
    return (
      <Link href="/discover" className="block animate-rise animate-rise-3">
        <Card className="flex-row items-center gap-4 rounded-2xl px-5 py-5 transition-all hover:border-primary/40 active:scale-95">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Join a team to see their progress</span>
            <span className="block text-sm text-muted-foreground">Find challenge buddies in Discover</span>
          </span>
        </Card>
      </Link>
    );
  }

  return (
    <section className="space-y-3 animate-rise animate-rise-3">
      <h2 className="text-lg font-extrabold">Team today</h2>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {teammates.map((mate) => {
          const percent = mate.total === 0 ? 100 : Math.round((mate.done / mate.total) * 100);
          const allDone = mate.done >= mate.total;
          return (
            <li key={mate.id} className="w-28 shrink-0">
              <Card className="items-center gap-2 rounded-2xl px-3 py-4 text-center">
                <Avatar size="lg">
                  <AvatarFallback className={cn('font-bold', allDone && 'bg-success text-success-foreground')}>
                    {initials(mate.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="w-full truncate text-sm font-semibold">{mate.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {mate.total === 0 ? 'Rest day' : `${mate.done}/${mate.total}`}
                </span>
                <Progress value={percent} className="h-1.5" />
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
