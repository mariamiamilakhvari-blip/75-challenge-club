import { z } from 'zod';

import { SignUpSchema } from '@/features/auth/validations/auth.validation';
import { MAX_CHALLENGES, MIN_CHALLENGES } from '@/shared/const/challenge.const';

export const UserChallengeInputSchema = z.object({
  key: z.string().min(1).max(80),
  title: z.string().trim().min(2).max(60),
  custom: z.boolean(),
  days: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .refine((days) => new Set(days).size === days.length, 'Days must be unique'),
});

export const UpdateChallengesSchema = z.object({
  challenges: z.array(UserChallengeInputSchema).min(MIN_CHALLENGES).max(MAX_CHALLENGES),
});

export type UserChallengeInput = z.infer<typeof UserChallengeInputSchema>;
export type UpdateChallengesType = z.infer<typeof UpdateChallengesSchema>;

export const CustomChallengeSchema = z.object({
  title: z.string().trim().min(2, 'At least 2 characters').max(60, 'Max 60 characters'),
});

export type CustomChallengeType = z.infer<typeof CustomChallengeSchema>;

export const AboutYouSchema = SignUpSchema.pick({
  age: true,
  city: true,
  interests: true,
  timezone: true,
});

export type AboutYouType = z.infer<typeof AboutYouSchema>;
