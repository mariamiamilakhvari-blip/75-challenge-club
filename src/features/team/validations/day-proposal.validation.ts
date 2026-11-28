import { z } from 'zod';

export const ProposeDaysSchema = z.object({
  challengeKey: z.string().min(1).max(80),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
});

export type ProposeDaysType = z.infer<typeof ProposeDaysSchema>;

export const RespondProposalSchema = z.object({
  accept: z.boolean(),
});

export type RespondProposalType = z.infer<typeof RespondProposalSchema>;
