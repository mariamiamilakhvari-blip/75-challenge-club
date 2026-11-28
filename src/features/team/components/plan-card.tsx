'use client';
import { Hand, Trash2 } from 'lucide-react';

import { ReplyForm } from '@/features/team/components/reply-form';
import { TeamPlan } from '@/features/team/types/team.types';
import { PlanReplyType } from '@/features/team/validations/plan.validation';
import { Button } from '@/shared/components/ui/button';
import { PlanFieldName } from '@/shared/const/plan.const';
import { planPrompt } from '@/shared/utils/plan-rules';

type PlanCardProps = {
  plan: TeamPlan;
  pending: string | null;
  onToggleJoin: (id: string) => void;
  onReply: (id: string, input: PlanReplyType) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function postedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

// "Running · Vake park · Sat 9:00" style headline from the plan's fields
function headline(plan: TeamPlan): string {
  const order: PlanFieldName[] = ['book', 'activity', 'place', 'when'];
  const parts = order.map((name) => plan.details[name]).filter(Boolean);
  if (plan.details.book && plan.details.author) parts.splice(1, 0, `by ${plan.details.author}`);
  return parts.join(' · ');
}

export const PlanCard = ({ plan, pending, onToggleJoin, onReply, onDelete }: PlanCardProps) => {
  const title = headline(plan);
  const question = planPrompt(plan.challengeKey).question;

  return (
    <li className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{plan.isMine ? 'You' : plan.userName}</span>
          {' · '}
          {postedAt(plan.createdAt)}
        </p>
        {plan.isMine && (
          <button
            type="button"
            aria-label="Delete plan"
            disabled={pending === `delete:${plan.id}`}
            onClick={() => onDelete(plan.id)}
            className="-m-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {title && <p className="mt-1.5 text-base font-semibold" title={question}>{title}</p>}
      {plan.details.note && <p className="mt-1 text-sm text-muted-foreground">“{plan.details.note}”</p>}

      {plan.joinable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!plan.isMine && (
            <Button
              size="sm"
              variant={plan.joinedByMe ? 'default' : 'outline'}
              className="rounded-full active:scale-95"
              aria-pressed={plan.joinedByMe}
              disabled={pending === `join:${plan.id}`}
              onClick={() => onToggleJoin(plan.id)}
            >
              <Hand aria-hidden />
              {plan.joinedByMe ? "I'm in ✓" : "I'm in"}
            </Button>
          )}
          {plan.joiners.length > 0 && <span className="text-xs text-muted-foreground">Joining: {plan.joiners.map((j) => j.name).join(', ')}</span>}
        </div>
      )}

      {plan.replies.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3">
          {plan.replies.map((reply) => (
            <li key={reply.id} className="text-sm">
              <span className="font-semibold">{reply.isMine ? 'You' : reply.userName}</span> <span className="text-foreground">{reply.text}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <ReplyForm busy={pending === `reply:${plan.id}`} onReply={(input) => onReply(plan.id, input)} />
      </div>
    </li>
  );
};
