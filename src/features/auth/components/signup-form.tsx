'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { InterestPicker } from '@/features/auth/components/interest-picker';
import { OrDivider } from '@/features/auth/components/or-divider';
import { useRegister } from '@/features/auth/hooks/use-register';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { SignUpSchema, SignUpType } from '@/features/auth/validations/auth.validation';
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

const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const SignUpForm = () => {
  const { register } = useRegister();
  const { loading, error } = useAuthStore();

  const form = useForm<SignUpType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      age: undefined,
      city: '',
      interests: [],
      timezone: 'UTC',
    },
  });

  const onSubmit = (data: SignUpType) => register({ ...data, timezone: browserTimezone() });

  return (
    <div className="w-full">
      <div className="animate-rise mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Join the club</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few basics so teammates know who they&apos;re cheering for.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="animate-rise animate-rise-1 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <GoogleSignInButton />
          <OrDivider />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Nino" autoComplete="name" className="h-12 rounded-xl px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="h-12 rounded-xl px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={13}
                      max={100}
                      placeholder="25"
                      className="h-12 rounded-xl px-4"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isFinite(field.value) ? field.value : ''}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Tbilisi" autoComplete="address-level2" className="h-12 rounded-xl px-4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interests</FormLabel>
                <InterestPicker value={field.value} onChange={field.onChange} />
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>

      <p className="animate-rise animate-rise-2 mt-6 text-center text-sm text-muted-foreground">
        Already a member?{' '}
        <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};
