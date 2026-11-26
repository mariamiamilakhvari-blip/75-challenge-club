'use client';
import { useState } from 'react';

import { TodayUpdater } from '@/features/checkin/hooks/use-today';
import { TodayItem } from '@/features/checkin/types/checkin.types';
import { http } from '@/shared/lib/http';

export const useUncheck = (update: TodayUpdater, reload: () => Promise<void>) => {
  const [error, setError] = useState<string | null>(null);

  const uncheck = async (item: TodayItem) => {
    if (!item.checkInId) return;
    const id = item.checkInId;
    setError(null);
    update((view) => ({
      ...view,
      items: view.items.map((i) => (i.key === item.key ? { ...i, done: false, checkInId: null, comment: '' } : i)),
    }));
    try {
      await http.delete(`/checkins/${id}`);
    } catch {
      setError('Could not undo that check-in. Try again.');
      await reload();
    }
  };

  return { uncheck, error };
};
