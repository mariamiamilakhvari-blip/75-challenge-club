'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TodayView } from '@/features/checkin/types/checkin.types';
import { http } from '@/shared/lib/http';

export type TodayUpdater = (updater: (view: TodayView) => TodayView) => void;

export const useToday = () => {
  const router = useRouter();
  const [view, setView] = useState<TodayView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await http.get<TodayView>('/today');
      setView(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'LOAD_FAILED';
      if (message === 'NOT_PUBLISHED') {
        router.replace('/onboarding');
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

  return { view, loading, error, reload: load, update };
};
