import {
  ALL_DAYS,
  CHALLENGES,
  ChallengeKind,
  PresetChallenge,
  REQUIRED_CHALLENGE_KEYS,
} from '@/shared/const/challenge.const';

export function getPreset(key: string): PresetChallenge | undefined {
  return CHALLENGES.find((c) => c.key === key);
}

export function challengeKind(key: string): ChallengeKind | 'custom' {
  return getPreset(key)?.kind ?? 'custom';
}

export function isMonthly(key: string): boolean {
  return challengeKind(key) === 'monthly';
}

export function isRequired(key: string): boolean {
  return REQUIRED_CHALLENGE_KEYS.includes(key);
}

/** Required challenge keys absent from the given list, in display order. */
export function missingRequired(keys: string[]): string[] {
  return REQUIRED_CHALLENGE_KEYS.filter((key) => !keys.includes(key));
}

export function exceptionNoun(key: string): string {
  return getPreset(key)?.exceptionNoun ?? 'cheat';
}

export function initialDays(key: string): number[] {
  const preset = getPreset(key);
  if (!preset) return [...ALL_DAYS];
  if (preset.kind === 'scheduled') return [...(preset.defaultDays ?? [])];
  return [...ALL_DAYS];
}

/**
 * Returns the canonical sorted days for a challenge, or null when the
 * requested days break the challenge's rule.
 * daily / monthly → always all 7 days (input ignored)
 * scheduled → exactly requiredDays unique weekdays
 * custom → at least 1 unique weekday
 */
export function normalizeDays(key: string, days: number[]): number[] | null {
  const unique = [...new Set(days)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b);
  const preset = getPreset(key);
  if (preset && preset.kind !== 'scheduled') return [...ALL_DAYS];
  if (preset?.kind === 'scheduled') return unique.length === preset.requiredDays ? unique : null;
  return unique.length >= 1 ? unique : null;
}
