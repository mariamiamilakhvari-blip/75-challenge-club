'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { PlanReplySchema, PlanReplyType } from '@/features/team/validations/plan.validation';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { MAX_REPLY_LENGTH } from '@/shared/const/plan.const';

type ReplyFormProps = {
  busy: boolean;
  onReply: (input: PlanReplyType) => Promise<boolean>;
};

export const ReplyForm = ({ busy, onReply }: ReplyFormProps) => {
  const form = useForm<PlanReplyType>({ resolver: zodResolver(PlanReplySchema), defaultValues: { text: '' } });

  const submit = async (values: PlanReplyType) => {
    if (await onReply(values)) form.reset({ text: '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input aria-label="Reply" placeholder="Reply…" maxLength={MAX_REPLY_LENGTH} className="h-10 rounded-full px-4" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={busy} aria-label="Send reply" className="size-10 shrink-0 rounded-full active:scale-95">
          <Send aria-hidden />
        </Button>
      </form>
    </Form>
  );
};
