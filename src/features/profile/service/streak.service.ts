import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { addDays, todayInTimezone } from '@/shared/utils/date';
import { displayDay, evaluateStreak } from '@/shared/utils/streak';

export type SyncedStreak = {
  user: UserDocument;
  today: string;
  day: number;
};

/**
 * Lazily evaluates missed days since last evaluation and persists the
 * new streak start. Never touches team membership.
 */
export async function syncStreak(user: UserDocument): Promise<SyncedStreak> {
  const today = todayInTimezone(user.timezone);
  const yesterday = addDays(today, -1);

  if (!user.published || !user.streakStart || (user.lastEvaluated ?? '') >= yesterday) {
    return { user, today, day: displayDay(user.streakStart ?? '', today) };
  }

  const from = user.lastEvaluated ? addDays(user.lastEvaluated, 1) : user.streakStart;
  const checkIns = await checkInRepository.findByUserBetween(user._id.toString(), from, yesterday);
  const doneByDate = new Map<string, Set<string>>();
  for (const c of checkIns) {
    const set = doneByDate.get(c.date) ?? new Set<string>();
    set.add(c.challengeKey);
    doneByDate.set(c.date, set);
  }

  const result = evaluateStreak({
    streakStart: user.streakStart,
    lastEvaluated: user.lastEvaluated ?? '',
    today,
    challenges: user.challenges,
    doneByDate,
  });

  await profileRepository.updateById(user._id.toString(), result);
  const updated = { ...user, ...result };
  return { user: updated, today, day: displayDay(result.streakStart, today) };
}
