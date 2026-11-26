'use client';
import { useState } from 'react';

import { http } from '@/shared/lib/http';

export const useToggleJoin = (onDone: () => Promise<void> | void) => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = async (checkInId: string) => {
    setPendingId(checkInId);
    try {
      await http.post<{ joined: boolean }>(`/checkins/${checkInId}/join`);
      await onDone();
    } catch {
      // board reload keeps the UI truthful; nothing else to surface
    } finally {
      setPendingId(null);
    }
  };

  return { toggle, pendingId };
};
