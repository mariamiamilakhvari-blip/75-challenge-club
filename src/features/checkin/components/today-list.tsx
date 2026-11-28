'use client';
import { useState } from 'react';

import { CheckInSheet } from '@/features/checkin/components/check-in-sheet';
import { ExceptionDialog } from '@/features/checkin/components/exception-dialog';
import { allowanceUsed, TodayItem } from '@/features/checkin/components/today-item';
import { UncheckDialog } from '@/features/checkin/components/uncheck-dialog';
import { TodayItem as TodayItemType } from '@/features/checkin/types/checkin.types';
import { Card } from '@/shared/components/ui/card';

type TodayListProps = {
  items: TodayItemType[];
  onCheckIn: (challengeKey: string, comment?: string, exception?: boolean) => void;
  onUncheck: (item: TodayItemType) => void;
};

export const TodayList = ({ items, onCheckIn, onUncheck }: TodayListProps) => {
  const [checking, setChecking] = useState<TodayItemType | null>(null);
  const [undoing, setUndoing] = useState<TodayItemType | null>(null);
  const [excepting, setExcepting] = useState<TodayItemType | null>(null);

  if (items.length === 0) {
    return (
      <Card className="items-center rounded-2xl px-6 py-10 text-center animate-rise animate-rise-2">
        <p className="text-4xl">🎉</p>
        <p className="text-lg font-extrabold">Rest day 🎉</p>
        <p className="text-sm text-muted-foreground">Nothing scheduled today</p>
      </Card>
    );
  }

  const doneCount = items.filter((i) => i.done).length;
  const select = (item: TodayItemType) => {
    if (item.done) {
      if (item.checkInId) setUndoing(item);
      return;
    }
    setChecking(item);
  };
  const logException = (item: TodayItemType) => {
    // first exception of the month is free; a further one needs explicit confirmation
    if (allowanceUsed(item)) {
      setExcepting(item);
      return;
    }
    onCheckIn(item.key, undefined, true);
  };

  return (
    <section className="space-y-3 animate-rise animate-rise-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold">My challenges</h2>
        <span className="font-mono text-sm text-muted-foreground">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key}>
            <TodayItem item={item} onSelect={select} onException={logException} />
          </li>
        ))}
      </ul>
      <CheckInSheet item={checking} onClose={() => setChecking(null)} onSubmit={onCheckIn} />
      <ExceptionDialog
        item={excepting}
        onClose={() => setExcepting(null)}
        onConfirm={(item) => onCheckIn(item.key, undefined, true)}
      />
      <UncheckDialog item={undoing} onClose={() => setUndoing(null)} onConfirm={onUncheck} />
    </section>
  );
};
