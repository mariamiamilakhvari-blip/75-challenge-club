'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { InterestPicker } from '@/features/auth/components/interest-picker';
import { useSaveAbout } from '@/features/profile/hooks/use-save-about';
import { Profile } from '@/features/profile/types/profile.types';
import { AboutYouSchema, AboutYouType } from '@/features/profile/validations/profile.validation';
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

type AboutYouFormProps = {
  profile: Profile;
};

const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const AboutYouForm = ({ profile }: AboutYouFormProps) => {
  const { saveAbout, saving, error } = useSaveAbout();

  const form = useForm<AboutYouType>({
    resolver: zodResolver(AboutYouSchema),
    defaultValues: {
      age: profile.age ?? undefined,
      city: profile.city,
      interests: profile.interests,
      timezone: profile.timezone || 'UTC',
    },
  });

  const onSubmit = async (data: AboutYouType) => {
    await saveAbout({ ...data, timezone: browserTimezone() });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="animate-rise animate-rise-1 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
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
          disabled={saving}
          className="h-12 w-full rounded-full text-base font-semibold shadow-sm active:scale-95"
        >
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
};
