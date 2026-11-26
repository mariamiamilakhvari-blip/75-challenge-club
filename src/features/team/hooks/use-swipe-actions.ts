'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DiscoverCard } from '@/features/team/types/team.types';
import { ONBOARDING_ROUTE } from '@/shared/const/routes.const';
import { http } from '@/shared/lib/http';

const JOIN_ERRORS: Record<string, string> = {
  TEAM_FULL: 'That team just filled up.',
  NOT_FOUND: 'That person is no longer available.',
};

export const useSwipeActions = (advance: () => void) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const skip = async (card: DiscoverCard) => {
    setMessage(null);
    advance();
    try {
      await http.post('/discover/skip', { userId: card.id });
    } catch {
      setMessage('Could not save that skip.');
    }
  };

  const join = async (card: DiscoverCard) => {
    setMessage(null);
    setPending(true);
    try {
      await http.post<{ teamId: string }>('/teams/join', { userId: card.id });
      router.push('/team');
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN';
      if (code === 'NOT_PUBLISHED') {
        router.replace(ONBOARDING_ROUTE);
        return;
      }
      setMessage(JOIN_ERRORS[code] ?? 'Could not join. Try again.');
      advance();
      setPending(false);
    }
  };

  return { skip, join, pending, message };
};
