'use client';
import { createContext, useContext } from 'react';
import { useStore, StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { ProfileStore } from '@/features/profile/types/profile.types';

export const ProfileStoreContext = createContext<StoreApi<ProfileStore> | null>(null);

export const useProfileStore = () => {
  const store = useContext(ProfileStoreContext);
  if (!store) throw new Error('useProfileStore must be used within StoreProvider');
  return useStore(
    store,
    useShallow((state: ProfileStore) => ({
      profile: state.profile,
      loading: state.loading,
      error: state.error,
      setProfile: state.setProfile,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );
};
