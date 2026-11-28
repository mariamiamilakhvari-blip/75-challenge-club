'use client';
import { Check, Info, Lock, X } from 'lucide-react';

import { DayToggles } from '@/features/profile/components/day-toggles';
import { ALL_DAYS, ChallengeKind } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

const DAILY_HINT = 'Every day';

type ChallengeCardProps = {
  title: string;
  hint?: string;
  kind: ChallengeKind | 'custom';
  selected: boolean;
  // locked in: always selected, cannot be removed
  required?: boolean;
  days: number[];
  requiredDays?: number;
  suggested?: boolean;
  reason?: string;
  onToggleSelected: () => void;
  onToggleDay?: (day: number) => void;
  onSelectAllDays?: () => void;
};

type DayPickerProps = {
  kind: ChallengeKind | 'custom';
  days: number[];
  requiredDays?: number;
  onToggleDay?: (day: number) => void;
  onSelectAllDays?: () => void;
};

const DayPicker = ({ kind, days, requiredDays, onToggleDay, onSelectAllDays }: DayPickerProps) => {
  const scheduled = kind === 'scheduled' && requiredDays !== undefined;
  const valid = scheduled ? days.length === requiredDays : days.length > 0;
  const everyDay = days.length === ALL_DAYS.length;
  const hint = scheduled
    ? `Pick ${requiredDays} ${requiredDays === 1 ? 'day' : 'days'} (${days.length}/${requiredDays})`
    : 'Pick at least 1 day';

  return (
    <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Days of the week</p>
        {(scheduled || !valid) && (
          <p className={cn('text-xs font-medium', valid ? 'text-muted-foreground' : 'text-primary')}>{hint}</p>
        )}
      </div>
      <DayToggles days={days} max={scheduled ? requiredDays : undefined} onToggle={(day) => onToggleDay?.(day)} />
      {kind === 'custom' && (
        <button
          type="button"
          aria-pressed={everyDay}
          onClick={onSelectAllDays}
          className={cn(
            'h-9 w-full rounded-full text-xs font-bold transition-all active:scale-95',
            everyDay ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          )}
        >
          Every day
        </button>
      )}
    </div>
  );
};

export const ChallengeCard = ({
  title,
  hint,
  kind,
  selected,
  required = false,
  days,
  requiredDays,
  suggested = false,
  reason,
  onToggleSelected,
  onToggleDay,
  onSelectAllDays,
}: ChallengeCardProps) => {
  const custom = kind === 'custom';
  const showDays = selected && (kind === 'scheduled' || custom);
  // the "Every day" pill already says it for daily cards
  const visibleHint = kind === 'daily' && hint === DAILY_HINT ? undefined : hint;

  const header = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-foreground">{title}</span>
          {required && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
              <Lock className="size-3" aria-hidden="true" />
            Required
            </span>
          )}
          {!required && suggested && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            ✨ Suggested
            </span>
          )}
        </span>
        {kind === 'monthly' ? (
          <span className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>Follow every day · {hint}</span>
          </span>
        ) : (
          visibleHint && <span className="mt-0.5 block text-xs text-muted-foreground">{visibleHint}</span>
        )}
        {custom && <span className="mt-0.5 block text-xs text-muted-foreground">Custom · tap to remove</span>}
        {!required && suggested && reason && <span className="mt-1 block truncate text-xs italic text-muted-foreground">{reason}</span>}
      </span>
      {kind === 'daily' && (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        Every day
        </span>
      )}
      {custom && <X className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    </>
  );

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card shadow-sm transition-colors',
        selected ? 'border-primary' : 'border-border'
      )}
    >
      {required ? (
        <div className="flex w-full items-center gap-3 p-4 text-left">{header}</div>
      ) : (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          onClick={onToggleSelected}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-muted/40"
        >
          {header}
        </button>
      )}

      {showDays && (
        <DayPicker
          kind={kind}
          days={days}
          requiredDays={requiredDays}
          onToggleDay={onToggleDay}
          onSelectAllDays={onSelectAllDays}
        />
      )}
    </div>
  );
};
