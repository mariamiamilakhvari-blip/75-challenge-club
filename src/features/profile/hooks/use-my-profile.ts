'use client';
import { useCallback, useEffect } from 'react';

import { useProfileStore } from '@/features/profile/hooks/useProfileStore';
import { Profile } from '@/features/profile/types/profile.types';
import { http } from '@/shared/lib/http';

export const useMyProfile = () => {
  const { profile, loading, error, setProfile, setLoading, setError } = useProfileStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await http.get<Profile>('/profile/me');
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [setProfile, setLoading, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, reload: load };
};
