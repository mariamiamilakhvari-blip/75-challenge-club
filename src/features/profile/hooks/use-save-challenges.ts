'use client';
import { useState } from 'react';

import { useProfileStore } from '@/features/profile/hooks/useProfileStore';
import { Profile } from '@/features/profile/types/profile.types';
import { UpdateChallengesType } from '@/features/profile/validations/profile.validation';
import { http } from '@/shared/lib/http';

export const useSaveChallenges = () => {
  const { setProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveChallenges = async (input: UpdateChallengesType): Promise<Profile | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await http.put<Profile>('/profile/challenges', input);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save challenges');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { saveChallenges, saving, error };
};
