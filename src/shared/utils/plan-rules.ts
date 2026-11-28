import { DEFAULT_PLAN_PROMPT, PLAN_PROMPTS, PlanFieldName, PlanPrompt } from '@/shared/const/plan.const';

export type PlanDetails = Record<PlanFieldName, string>;

export function planPrompt(challengeKey: string): PlanPrompt {
  return PLAN_PROMPTS[challengeKey] ?? DEFAULT_PLAN_PROMPT;
}

export function isJoinablePlan(challengeKey: string): boolean {
  return planPrompt(challengeKey).joinable;
}

/**
 * Keeps only the fields the challenge's prompt asks for (trimmed).
 * Returns null when a required field is empty.
 */
export function normalizePlanDetails(challengeKey: string, input: Partial<PlanDetails>): PlanDetails | null {
  const prompt = planPrompt(challengeKey);
  const details: PlanDetails = { place: '', when: '', activity: '', book: '', author: '', note: '' };
  for (const field of prompt.fields) {
    const value = (input[field.name] ?? '').trim();
    if (field.required && !value) return null;
    details[field.name] = value;
  }
  return details;
}
