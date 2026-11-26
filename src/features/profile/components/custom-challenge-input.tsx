'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  CustomChallengeSchema,
  CustomChallengeType,
} from '@/features/profile/validations/profile.validation';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

type CustomChallengeInputProps = {
  disabled?: boolean;
  onAdd: (title: string) => void;
};

export const CustomChallengeInput = ({ disabled = false, onAdd }: CustomChallengeInputProps) => {
  const form = useForm<CustomChallengeType>({
    resolver: zodResolver(CustomChallengeSchema),
    defaultValues: { title: '' },
  });

  const submit = form.handleSubmit(({ title }) => {
    onAdd(title);
    form.reset({ title: '' });
  });

  return (
    <Form {...form}>
      <div className="rounded-2xl border border-dashed border-border bg-card p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Add custom challenge</p>
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="e.g. Walk the dog"
                    maxLength={60}
                    disabled={disabled}
                    className="h-11 rounded-full px-4"
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      void submit();
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={disabled}
            className="h-11 rounded-full px-4 font-semibold"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>
    </Form>
  );
};
