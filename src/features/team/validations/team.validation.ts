import { z } from 'zod';

export const UserIdSchema = z.object({
  userId: z.string().min(24).max(24),
});

export type UserIdType = z.infer<typeof UserIdSchema>;

export const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);
