'use client';
import { useState } from 'react';

import { http } from '@/shared/lib/http';

export const useLeaveTeam = (onLeft: () => Promise<void> | void) => {
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leave = async () => {
    setLeaving(true);
    setError(null);
    try {
      await http.post('/teams/leave');
      await onLeft();
    } catch {
      setError('Could not leave the team. Try again.');
    } finally {
      setLeaving(false);
    }
  };

  return { leave, leaving, error };
};
