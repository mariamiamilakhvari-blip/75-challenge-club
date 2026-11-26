'use client';
import { useCallback, useEffect, useState } from 'react';

import { TeamBoard } from '@/features/team/types/team.types';
import { http } from '@/shared/lib/http';

export const useTeamBoard = () => {
  const [board, setBoard] = useState<TeamBoard | null>(null);
  const [noTeam, setNoTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setBoard(await http.get<TeamBoard>('/teams/me'));
      setNoTeam(false);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN';
      setBoard(null);
      if (code === 'NO_TEAM') setNoTeam(true);
      else setError('Could not load your team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { board, noTeam, loading, error, reload: load };
};
