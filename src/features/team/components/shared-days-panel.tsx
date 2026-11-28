'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { DayToggles } from '@/features/profile/components/day-toggles';
import { TeamGridRow, TeamMember } from '@/features/team/types/team.types';
import { ProposeDaysSchema, ProposeDaysType } from '@/features/team/validations/day-proposal.validation';
import { Button } from '@/shared/components/ui/button';
import { Form } from '@/shared/components/ui/form';
import { WEEKDAYS } from '@/shared/const/challenge.const';

type SharedDaysPanelProps = {
  row: TeamGridRow;
  members: TeamMember[];
  pending: string | null;
  onPropose: (input: ProposeDaysType) => Promise<boolean>;
  onRespond: (proposalId: string, accept: boolean) => void;
};

export const SharedDaysPanel = ({ row, members, pending, onPropose, onRespond }: SharedDaysPanelProps) => {
  const required = row.requiredDays ?? 1;
  const form = useForm<ProposeDaysType>({ resolver: zodResolver(ProposeDaysSchema), defaultValues: { challengeKey: row.key, days: [] } });
  const days = useWatch({ control: form.control, name: 'days' }) ?? [];
  const proposal = row.proposal;

  useEffect(() => form.reset({ challengeKey: row.key, days: proposal?.days ?? [] }), [row.key, proposal, form]);

  const toggle = (day: number) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
    form.setValue('days', next, { shouldDirty: true });
  };

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Someone';

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <p className="flex items-center gap-2 font-bold">
        <CalendarCheck className="size-4 text-primary" aria-hidden />
        Shared days
      </p>

      {proposal && (
        <div className="space-y-2 rounded-xl bg-primary/10 p-3">
          <p className="text-sm">
            <span className="font-semibold">{proposal.isMine ? 'You' : proposal.proposerName}</span> proposed{' '}
            <span className="font-semibold">{proposal.days.map((d) => WEEKDAYS[d]).join(', ')}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            In: {proposal.acceptedIds.map(nameOf).join(', ') || 'nobody yet'}
            {proposal.declinedIds.length > 0 && ` · Declined: ${proposal.declinedIds.map(nameOf).join(', ')}`}
          </p>
          {proposal.myResponse !== 'accepted' && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-full active:scale-95" disabled={pending !== null} onClick={() => onRespond(proposal.id, true)}>
                Accept
              </Button>
              {proposal.myResponse !== 'declined' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full active:scale-95"
                  disabled={pending !== null}
                  onClick={() => onRespond(proposal.id, false)}
                >
                  Decline
                </Button>
              )}
            </div>
          )}
          {proposal.myResponse === 'accepted' && <p className="text-xs font-semibold text-success">Your schedule follows these days.</p>}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => void onPropose(values))} className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{proposal ? 'Suggest different days' : `${row.title} together on…`}</span>
            <span className={days.length === required ? 'text-muted-foreground' : 'text-primary'}>
              Pick {required} ({days.length}/{required})
            </span>
          </div>
          <DayToggles days={days} max={required} onToggle={toggle} />
          <Button
            type="submit"
            variant="outline"
            disabled={days.length !== required || pending === 'propose'}
            className="h-10 w-full rounded-full font-semibold active:scale-95"
          >
            {pending === 'propose' ? 'Sending…' : 'Propose to team'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
