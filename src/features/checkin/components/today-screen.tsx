'use client';
import { Loader2 } from 'lucide-react';

import { SubscribeWall } from '@/features/billing/components/subscribe-wall';
import { TrialBanner } from '@/features/billing/components/trial-banner';
import { DayCounter } from '@/features/checkin/components/day-counter';
import { TeammatesStrip } from '@/features/checkin/components/teammates-strip';
import { TodayHeader } from '@/features/checkin/components/today-header';
import { TodayList } from '@/features/checkin/components/today-list';
import { useCheckIn } from '@/features/checkin/hooks/use-check-in';
import { useToday } from '@/features/checkin/hooks/use-today';
import { useUncheck } from '@/features/checkin/hooks/use-uncheck';
import { Button } from '@/shared/components/ui/button';

export const TodayScreen = () => {
  const { view, loading, error, locked, reload, update } = useToday();
  const { checkIn, error: checkInError } = useCheckIn(update, reload);
  const { uncheck, error: uncheckError } = useUncheck(update, reload);

  if (locked) return <SubscribeWall />;

  if (loading || (!view && !error)) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button className="rounded-full" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const actionError = checkInError ?? uncheckError;

  return (
    <div className="space-y-6">
      <TodayHeader date={view.date} />
      <TrialBanner />
      <DayCounter day={view.day} completed={view.completed} />
      {actionError && <p className="text-sm font-medium text-destructive">{actionError}</p>}
      <TodayList
        items={view.items}
        onCheckIn={(key, comment, exception) => void checkIn(key, comment, exception)}
        onUncheck={(item) => void uncheck(item)}
      />
      <TeammatesStrip teammates={view.teammates} />
    </div>
  );
};
