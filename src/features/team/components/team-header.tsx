import { TeamMember } from '@/features/team/types/team.types';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

type TeamHeaderProps = {
  members: TeamMember[];
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const TeamHeader = ({ members }: TeamHeaderProps) => {
  return (
    <ul className="flex gap-4 overflow-x-auto pb-2 animate-rise animate-rise-1" aria-label="Team members">
      {members.map((m) => (
        <li key={m.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
          <Avatar size="lg" className={cn('size-14 ring-2 ring-offset-2 ring-offset-background', m.isMe ? 'ring-primary' : 'ring-border')}>
            <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">{initials(m.name)}</AvatarFallback>
          </Avatar>
          <span className="w-full truncate text-xs font-semibold">{m.isMe ? 'You' : m.name.split(' ')[0]}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">Day {m.day}</span>
        </li>
      ))}
    </ul>
  );
};
