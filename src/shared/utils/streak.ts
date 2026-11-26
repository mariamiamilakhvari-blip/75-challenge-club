import { CHALLENGE_LENGTH_DAYS } from '@/shared/const/challenge.const';
import { addDays, diffDays, weekdayIndex } from '@/shared/utils/date';

type ScheduledChallenge = { key: string; days: number[] };

export type StreakInput = {
  streakStart: string;
  lastEvaluated: string;
  today: string;
  challenges: ScheduledChallenge[];
  doneByDate: Map<string, Set<string>>;
};

export type StreakResult = {
  streakStart: string;
  lastEvaluated: string;
};

export function scheduledKeysFor(challenges: ScheduledChallenge[], date: string): string[] {
  const weekday = weekdayIndex(date);
  return challenges.filter((c) => c.days.includes(weekday)).map((c) => c.key);
}

/**
 * Walks every fully-elapsed day (up to yesterday) not yet evaluated.
 * A missed scheduled challenge on day d restarts the streak on d + 1.
 */
export function evaluateStreak(input: StreakInput): StreakResult {
  const yesterday = addDays(input.today, -1);
  if (!input.streakStart) return { streakStart: input.today, lastEvaluated: yesterday };

  let streakStart = input.streakStart;
  const firstUnchecked = input.lastEvaluated ? addDays(input.lastEvaluated, 1) : streakStart;
  let cursor = firstUnchecked > streakStart ? firstUnchecked : streakStart;

  while (cursor <= yesterday) {
    const done = input.doneByDate.get(cursor) ?? new Set<string>();
    const missed = scheduledKeysFor(input.challenges, cursor).some((key) => !done.has(key));
    if (missed) streakStart = addDays(cursor, 1);
    cursor = addDays(cursor, 1);
  }

  const lastEvaluated = input.lastEvaluated > yesterday ? input.lastEvaluated : yesterday;
  return { streakStart, lastEvaluated };
}

export function dayNumber(streakStart: string, today: string): number {
  if (!streakStart) return 1;
  return Math.max(1, diffDays(streakStart, today) + 1);
}

export function displayDay(streakStart: string, today: string): number {
  return Math.min(CHALLENGE_LENGTH_DAYS, dayNumber(streakStart, today));
}
