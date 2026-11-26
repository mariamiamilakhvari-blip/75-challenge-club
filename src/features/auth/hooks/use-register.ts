'use client';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { SignUpType } from '@/features/auth/validations/auth.validation';
import { ONBOARDING_ROUTE } from '@/shared/const/routes.const';
import { http } from '@/shared/lib/http';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: 'Email already in use',
  VALIDATION_ERROR: 'Please check the highlighted fields',
};

export const useRegister = () => {
  const { setLoading, setError } = useAuthStore();
  const router = useRouter();

  const register = async (data: SignUpType) => {
    setLoading(true);
    setError(null);
    try {
      await http.post('/auth/register', data);
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        router.push('/sign-in');
        return;
      }
      router.push(ONBOARDING_ROUTE);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(ERROR_MESSAGES[message] ?? message);
    } finally {
      setLoading(false);
    }
  };

  return { register };
};
