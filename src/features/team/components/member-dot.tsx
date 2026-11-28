import { initials } from '@/features/team/components/team-header';
import { CellStatus } from '@/features/team/types/team.types';
import { cn } from '@/shared/lib/utils';

type MemberDotProps = {
  name: string;
  status: CellStatus;
  isMe?: boolean;
};

// Filled = done; outlined = not yet (faded when the day is still ahead).
export const MemberDot = ({ name, status, isMe = false }: MemberDotProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 items-center justify-center rounded-full text-xs font-bold leading-none',
        status === 'done' ? 'bg-success text-white' : 'border border-muted-foreground/50 text-muted-foreground',
        status === 'upcoming' && 'opacity-50',
        isMe && status !== 'done' && 'border-primary text-primary'
      )}
    >
      {initials(name).slice(0, 1)}
    </span>
  );
};
