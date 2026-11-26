'use client';
import { useState } from 'react';

import { useProfileStore } from '@/features/profile/hooks/useProfileStore';
import { Profile } from '@/features/profile/types/profile.types';
import { AboutYouType } from '@/features/profile/validations/profile.validation';
import { http } from '@/shared/lib/http';

export const useSaveAbout = () => {
  const { setProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAbout = async (input: AboutYouType): Promise<Profile | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await http.put<Profile>('/profile/about', input);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { saveAbout, saving, error };
};
