'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { HOME_AFTER_LOGIN } from '@/shared/const/routes.const';

export const useGoogleSignIn = () => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setPending(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: HOME_AFTER_LOGIN });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setPending(false);
    }
  };

  return { signInWithGoogle, pending, error };
};
