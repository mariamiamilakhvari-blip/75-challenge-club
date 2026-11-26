'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { TodayItem } from '@/features/checkin/types/checkin.types';
import { CheckInCommentSchema, CheckInCommentType } from '@/features/checkin/validations/checkin.validation';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Textarea } from '@/shared/components/ui/textarea';
import { MAX_COMMENT_LENGTH } from '@/shared/const/challenge.const';

type CheckInSheetProps = {
  item: TodayItem | null;
  onClose: () => void;
  onSubmit: (challengeKey: string, comment?: string) => void;
};

export const CheckInSheet = ({ item, onClose, onSubmit }: CheckInSheetProps) => {
  const form = useForm<CheckInCommentType>({
    resolver: zodResolver(CheckInCommentSchema),
    defaultValues: { comment: '' },
  });
  const comment = useWatch({ control: form.control, name: 'comment' });

  useEffect(() => {
    if (item) form.reset({ comment: '' });
  }, [item, form]);

  const submit = (values: CheckInCommentType) => {
    if (!item) return;
    onSubmit(item.key, values.comment);
    onClose();
  };

  const submitWithoutNote = () => {
    if (!item) return;
    onSubmit(item.key);
    onClose();
  };

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="text-xl font-extrabold">{item?.title}</SheetTitle>
          <SheetDescription>Add a note so teammates can join you — or just tick it off.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4 px-4">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={MAX_COMMENT_LENGTH}
                      placeholder="Where / what? e.g. Pilates at FitHub 18:00 — teammates can join"
                      className="rounded-2xl"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {comment.length}/{MAX_COMMENT_LENGTH}
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full rounded-full font-bold">
              Check off
            </Button>
            <Button type="button" variant="ghost" size="lg" className="w-full rounded-full" onClick={submitWithoutNote}>
              Check off without note
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
