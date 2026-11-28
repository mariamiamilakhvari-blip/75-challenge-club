'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { CreatePlanSchema, CreatePlanType } from '@/features/team/validations/plan.validation';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { MAX_PLAN_FIELD_LENGTH, MAX_PLAN_NOTE_LENGTH } from '@/shared/const/plan.const';
import { planPrompt } from '@/shared/utils/plan-rules';

type PlanFormProps = {
  challengeKey: string;
  busy: boolean;
  onSubmit: (input: CreatePlanType) => Promise<boolean>;
};

const emptyValues = (challengeKey: string): CreatePlanType => ({
  challengeKey,
  place: '',
  when: '',
  activity: '',
  book: '',
  author: '',
  note: '',
});

export const PlanForm = ({ challengeKey, busy, onSubmit }: PlanFormProps) => {
  const prompt = planPrompt(challengeKey);
  const form = useForm<CreatePlanType>({ resolver: zodResolver(CreatePlanSchema), defaultValues: emptyValues(challengeKey) });

  useEffect(() => form.reset(emptyValues(challengeKey)), [challengeKey, form]);

  const submit = async (values: CreatePlanType) => {
    const missing = prompt.fields.filter((f) => f.required && !(values[f.name] ?? '').trim());
    if (missing.length > 0) {
      missing.forEach((f) => form.setError(f.name, { message: `${f.label} is required` }));
      return;
    }
    if (await onSubmit(values)) form.reset(emptyValues(challengeKey));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-3 rounded-2xl bg-muted/50 p-4">
        <p className="font-bold">{prompt.question}</p>
        {prompt.fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  {f.label}
                  {f.required && <span className="text-primary"> *</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={f.placeholder}
                    maxLength={f.name === 'note' ? MAX_PLAN_NOTE_LENGTH : MAX_PLAN_FIELD_LENGTH}
                    className="h-11 rounded-xl bg-card px-4"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-semibold active:scale-95">
          {busy ? 'Posting…' : 'Post to team'}
        </Button>
      </form>
    </Form>
  );
};
