'use client';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

import { useLeaveTeam } from '@/features/team/hooks/use-leave-team';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';

type LeaveTeamButtonProps = {
  onLeft: () => Promise<void> | void;
};

export const LeaveTeamButton = ({ onLeft }: LeaveTeamButtonProps) => {
  const [open, setOpen] = useState(false);
  const { leave, leaving, error } = useLeaveTeam(async () => {
    setOpen(false);
    await onLeft();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full rounded-full text-muted-foreground">
          <LogOut aria-hidden />
          Leave team
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Leave this team?</DialogTitle>
          <DialogDescription>Your streak stays. You can find a new team in Discover anytime.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Stay
          </Button>
          <Button variant="destructive" className="rounded-full" disabled={leaving} onClick={() => void leave()}>
            {leaving ? 'Leaving…' : 'Leave team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
