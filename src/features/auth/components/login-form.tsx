'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/features/auth/hooks/use-login';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { LoginSchema, LoginType } from '@/features/auth/validations/auth.validation';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

export const LoginForm = () => {
  const { login } = useLogin();
  const { loading, error } = useAuthStore();

  const form = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className="w-full pt-6">
      <div className="animate-rise mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your team is waiting. Let&apos;s keep the streak alive.</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(login)}
          className="animate-rise animate-rise-1 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 rounded-xl px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 rounded-xl px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full text-base font-semibold shadow-sm active:scale-95"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="animate-rise animate-rise-2 mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};
