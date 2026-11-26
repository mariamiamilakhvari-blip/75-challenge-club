import { createStore } from 'zustand/vanilla';

import { ProfileState, ProfileStore } from '@/features/profile/types/profile.types';

export const createProfileStore = (initState: Partial<ProfileState> = {}) => {
  const DEFAULT_STATE: ProfileState = {
    profile: null,
    loading: false,
    error: null,
  };

  return createStore<ProfileStore>()((set) => ({
    ...DEFAULT_STATE,
    ...initState,
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }));
};
