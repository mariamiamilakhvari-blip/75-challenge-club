'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { DiscoverCard } from '@/features/team/types/team.types';
import { ONBOARDING_ROUTE } from '@/shared/const/routes.const';
import { http } from '@/shared/lib/http';

export const useDiscoverDeck = () => {
  const router = useRouter();
  const [cards, setCards] = useState<DiscoverCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCards(await http.get<DiscoverCard[]>('/discover'));
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN';
      if (code === 'NOT_PUBLISHED') {
        router.replace(ONBOARDING_ROUTE);
        return;
      }
      setError('Could not load people. Try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const advance = useCallback(() => setCards((prev) => prev.slice(1)), []);

  const resetSkips = useCallback(async () => {
    try {
      await http.post('/discover/reset');
      await load();
    } catch {
      setError('Could not reset skipped people.');
    }
  }, [load]);

  return { cards, current: cards[0] ?? null, next: cards[1] ?? null, loading, error, advance, resetSkips, reload: load };
};
