'use client';
import { useState } from 'react';

import { useProfileStore } from '@/features/profile/hooks/useProfileStore';
import { Profile } from '@/features/profile/types/profile.types';
import { MIN_CHALLENGES } from '@/shared/const/challenge.const';
import { http } from '@/shared/lib/http';

const ERROR_MESSAGES: Record<string, string> = {
  NOT_ENOUGH_CHALLENGES: `Pick at least ${MIN_CHALLENGES} challenges first`,
};

export const usePublish = () => {
  const { setProfile } = useProfileStore();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = async (): Promise<Profile | null> => {
    setPublishing(true);
    setError(null);
    try {
      const data = await http.post<Profile>('/profile/publish');
      setProfile(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not publish';
      setError(ERROR_MESSAGES[message] ?? message);
      return null;
    } finally {
      setPublishing(false);
    }
  };

  return { publish, publishing, error };
};
