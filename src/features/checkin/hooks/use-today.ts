'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TodayView } from '@/features/checkin/types/checkin.types';
import { SUBSCRIPTION_REQUIRED } from '@/shared/const/billing.const';
import { http } from '@/shared/lib/http';

export type TodayUpdater = (updater: (view: TodayView) => TodayView) => void;

export const useToday = () => {
  const router = useRouter();
  const [view, setView] = useState<TodayView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // trial over and no subscription: show the paywall (data is kept server-side)
  const [locked, setLocked] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await http.get<TodayView>('/today');
      setView(data);
      setLocked(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'LOAD_FAILED';
      if (message === 'NOT_PUBLISHED') {
        router.replace('/onboarding');
        return;
      }
      if (message === SUBSCRIPTION_REQUIRED) {
        setLocked(true);
        return;
      }
      setError('Could not load today.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const update: TodayUpdater = useCallback((updater) => {
    setView((current) => (current ? updater(current) : current));
  }, []);

  return { view, loading, error, locked, reload: load, update };
};
