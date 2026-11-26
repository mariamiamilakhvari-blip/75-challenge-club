import { z } from 'zod';

import { MAX_INTERESTS } from '@/shared/const/interests.const';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type LoginType = z.infer<typeof LoginSchema>;

export const SignUpSchema = z.object({
  fullName: z.string().trim().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(13).max(100),
  city: z.string().trim().min(2).max(60),
  interests: z.array(z.string().trim().min(1).max(30)).min(1).max(MAX_INTERESTS),
  timezone: z.string().min(1).max(64),
});

export type SignUpType = z.infer<typeof SignUpSchema>;
