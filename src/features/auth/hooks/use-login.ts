'use client';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { User } from '@/features/auth/types/auth.types';
import { LoginType } from '@/features/auth/validations/auth.validation';
import { HOME_AFTER_LOGIN } from '@/shared/const/routes.const';

export const useLogin = () => {
  const { setUser, setLoading, setError } = useAuthStore();
  const router = useRouter();

  const login = async (data: LoginType) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        return;
      }

      const session = await getSession();
      const sessionUser = session?.user as User | undefined;
      if (sessionUser) {
        setUser({
          id: sessionUser.id ?? '',
          name: sessionUser.name ?? '',
          email: sessionUser.email ?? '',
          role: sessionUser.role ?? 'user',
          avatar: sessionUser.avatar ?? '',
        });
      }
      router.push(HOME_AFTER_LOGIN);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return { login };
};
