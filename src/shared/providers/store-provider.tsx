'use client';
import { type ReactNode, useState } from 'react';
import { type StoreApi } from 'zustand';

import { AuthStoreContext } from '@/features/auth/hooks/useAuthStore';
import { createAuthStore } from '@/features/auth/store/auth-store';
import { AuthStore } from '@/features/auth/types/auth.types';
import { ProfileStoreContext } from '@/features/profile/hooks/useProfileStore';
import { createProfileStore } from '@/features/profile/store/profile-store';
import { ProfileStore } from '@/features/profile/types/profile.types';

export type StoreProviderProps = { children: ReactNode };

export const StoreProvider = ({ children }: StoreProviderProps) => {
  const [authStore] = useState<StoreApi<AuthStore>>(() => createAuthStore());
  const [profileStore] = useState<StoreApi<ProfileStore>>(() => createProfileStore());

  return (
    <AuthStoreContext.Provider value={authStore}>
      <ProfileStoreContext.Provider value={profileStore}>{children}</ProfileStoreContext.Provider>
    </AuthStoreContext.Provider>
  );
};
