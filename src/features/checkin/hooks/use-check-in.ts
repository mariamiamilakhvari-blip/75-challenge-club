'use client';
import { useState } from 'react';

import { TodayUpdater } from '@/features/checkin/hooks/use-today';
import { TodayItem } from '@/features/checkin/types/checkin.types';
import { http } from '@/shared/lib/http';

type CreateCheckInResponse = { id: string };

function patchItem(key: string, patch: Partial<TodayItem>) {
  return (item: TodayItem) => (item.key === key ? { ...item, ...patch } : item);
}

export const useCheckIn = (update: TodayUpdater, reload: () => Promise<void>) => {
  const [error, setError] = useState<string | null>(null);

  const checkIn = async (challengeKey: string, comment?: string) => {
    const note = comment?.trim() ?? '';
    setError(null);
    update((view) => ({ ...view, items: view.items.map(patchItem(challengeKey, { done: true, comment: note })) }));
    try {
      const { id } = await http.post<CreateCheckInResponse>('/checkins', {
        challengeKey,
        ...(note ? { comment: note } : {}),
      });
      update((view) => ({ ...view, items: view.items.map(patchItem(challengeKey, { checkInId: id })) }));
    } catch {
      setError('Could not save that check-in. Try again.');
      await reload();
    }
  };

  return { checkIn, error };
};
