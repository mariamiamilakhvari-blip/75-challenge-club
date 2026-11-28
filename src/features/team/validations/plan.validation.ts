import { z } from 'zod';

import { MAX_PLAN_FIELD_LENGTH, MAX_PLAN_NOTE_LENGTH, MAX_REPLY_LENGTH } from '@/shared/const/plan.const';

const field = z.string().trim().max(MAX_PLAN_FIELD_LENGTH, `Max ${MAX_PLAN_FIELD_LENGTH} characters`);

export const CreatePlanSchema = z.object({
  challengeKey: z.string().min(1).max(80),
  place: field.optional(),
  when: field.optional(),
  activity: field.optional(),
  book: field.optional(),
  author: field.optional(),
  note: z.string().trim().max(MAX_PLAN_NOTE_LENGTH, `Max ${MAX_PLAN_NOTE_LENGTH} characters`).optional(),
});

export type CreatePlanType = z.infer<typeof CreatePlanSchema>;

export const PlanReplySchema = z.object({
  text: z.string().trim().min(1, 'Write a reply').max(MAX_REPLY_LENGTH, `Max ${MAX_REPLY_LENGTH} characters`),
});

export type PlanReplyType = z.infer<typeof PlanReplySchema>;
