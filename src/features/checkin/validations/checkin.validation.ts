import { z } from 'zod';

import { MAX_COMMENT_LENGTH } from '@/shared/const/challenge.const';

export const CreateCheckInSchema = z.object({
  challengeKey: z.string().min(1).max(80),
  comment: z.string().trim().max(MAX_COMMENT_LENGTH).optional(),
});

export type CreateCheckInType = z.infer<typeof CreateCheckInSchema>;

export const CheckInCommentSchema = z.object({
  comment: z.string().max(MAX_COMMENT_LENGTH),
});

export type CheckInCommentType = z.infer<typeof CheckInCommentSchema>;
