import { z } from 'zod';

export const AiSuggestionSchema = z.object({
  key: z.string(),
  days: z.array(z.number()),
  reason: z.string().catch(''),
});

export const AiSuggestionsSchema = z.object({
  suggestions: z
    .array(AiSuggestionSchema.nullable().catch(null))
    .transform((items) => items.filter((item): item is AiSuggestionType => item !== null)),
});

export type AiSuggestionType = z.infer<typeof AiSuggestionSchema>;
export type AiSuggestionsType = z.infer<typeof AiSuggestionsSchema>;
