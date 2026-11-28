import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { CheckInDocument } from '@/features/checkin/schema/checkin.schema';
import { TeammateProgress, TodayItem, TodayView } from '@/features/checkin/types/checkin.types';
import { CreateCheckInType } from '@/features/checkin/validations/checkin.validation';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { teamRepository } from '@/features/team/repository/team.repository';
import { CHALLENGE_LENGTH_DAYS, MONTHLY_EXCEPTIONS_ALLOWED } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';
import { subscriptionGuard } from '@/shared/utils/access';
import { challengeKind, getPreset, isMonthly } from '@/shared/utils/challenge-rules';
import { todayInTimezone, weekdayIndex } from '@/shared/utils/date';
import { buildDoneByDate, exceptionsUsedInMonth, firstOfMonth, scheduledKeysFor } from '@/shared/utils/streak';

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

type PublishedUserResult = { user: UserDocument } | { error: ServiceResult<never> };

async function loadPublishedUser(userId: string): Promise<PublishedUserResult> {
  const user = await profileRepository.findById(userId);
  if (!user) return { error: { data: { error: 'NOT_FOUND' }, status: 404 } };
  if (!user.published) return { error: { data: { error: 'NOT_PUBLISHED' }, status: 403 } };
  const locked = subscriptionGuard(user);
  if (locked) return { error: locked };
  return { user };
}

/**
 * monthCheckIns: the user's check-ins from the 1st of the month to today,
 * so monthly exception usage can be reported.
 */
function buildItems(user: UserDocument, today: string, monthCheckIns: CheckInDocument[]): TodayItem[] {
  const weekday = weekdayIndex(today);
  const byKey = new Map(monthCheckIns.filter((c) => c.date === today).map((c) => [c.challengeKey, c]));
  return user.challenges
    .filter((c) => c.days.includes(weekday))
    .map((c) => {
      const checkIn = byKey.get(c.key);
      const item: TodayItem = {
        key: c.key,
        title: getPreset(c.key)?.title ?? c.title,
        kind: challengeKind(c.key),
        done: Boolean(checkIn),
        exception: Boolean(checkIn?.exception),
        checkInId: checkIn ? checkIn._id.toString() : null,
        comment: checkIn?.comment ?? '',
      };
      if (!isMonthly(c.key)) return item;
      return {
        ...item,
        exceptionsUsed: exceptionsUsedInMonth(monthCheckIns, c.key, today),
        exceptionsAllowed: MONTHLY_EXCEPTIONS_ALLOWED,
      };
    });
}

async function buildTeammates(user: UserDocument): Promise<TeammateProgress[]> {
  if (!user.teamId) return [];
  const team = await teamRepository.findById(user.teamId.toString());
  if (!team) return [];

  const selfId = user._id.toString();
  const memberIds = team.members.map((m) => m.toString()).filter((id) => id !== selfId);
  if (memberIds.length === 0) return [];

  const members = await profileRepository.findByIds(memberIds);
  const todayById = new Map(members.map((m) => [m._id.toString(), todayInTimezone(m.timezone)]));
  const dates = [...todayById.values()].sort();
  // month-to-date so a monthly exception only counts as done within the allowance
  const from = firstOfMonth(dates[0] ?? '');
  const to = dates[dates.length - 1] ?? '';
  const checkIns = await checkInRepository.findByUsersBetween(memberIds, from, to);

  return members.map((member) => {
    const id = member._id.toString();
    const date = todayById.get(id) ?? '';
    const scheduled = scheduledKeysFor(member.challenges, date);
    const own = checkIns.filter((c) => c.userId.toString() === id && c.date >= firstOfMonth(date) && c.date <= date);
    const doneKeys = buildDoneByDate(own).get(date) ?? new Set<string>();
    return {
      id,
      name: member.name,
      done: scheduled.filter((key) => doneKeys.has(key)).length,
      total: scheduled.length,
    };
  });
}

export async function getTodayService(userId: string): Promise<ServiceResult<TodayView>> {
  const loaded = await loadPublishedUser(userId);
  if ('error' in loaded) return loaded.error;

  const { user, today, day } = await syncStreak(loaded.user);
  const [monthCheckIns, teammates] = await Promise.all([
    checkInRepository.findByUserBetween(userId, firstOfMonth(today), today),
    buildTeammates(user),
  ]);

  return {
    data: {
      day,
      date: today,
      weekday: weekdayIndex(today),
      completed: day >= CHALLENGE_LENGTH_DAYS,
      items: buildItems(user, today, monthCheckIns),
      teammates,
    },
    status: 200,
  };
}

export async function createCheckInService(
  userId: string,
  input: CreateCheckInType
): Promise<ServiceResult<{ id: string }>> {
  const loaded = await loadPublishedUser(userId);
  if ('error' in loaded) return loaded.error;
  const { user } = loaded;

  const exception = input.exception ?? false;
  if (exception && !isMonthly(input.challengeKey)) {
    return { data: { error: 'NOT_MONTHLY' }, status: 400 };
  }

  const today = todayInTimezone(user.timezone);
  if (!scheduledKeysFor(user.challenges, today).includes(input.challengeKey)) {
    return { data: { error: 'NOT_SCHEDULED_TODAY' }, status: 400 };
  }

  const existing = await checkInRepository.findByUserAndDate(userId, today);
  if (existing.some((c) => c.challengeKey === input.challengeKey)) {
    return { data: { error: 'ALREADY_DONE' }, status: 409 };
  }

  const id = await checkInRepository.create({
    userId,
    teamId: user.teamId ? user.teamId.toString() : null,
    date: today,
    challengeKey: input.challengeKey,
    comment: (input.comment ?? '').trim(),
    // a 2nd+ exception in the same month is still stored; the streak sync counts it as a miss
    exception,
  });
  return { data: { id }, status: 201 };
}

export async function deleteCheckInService(
  userId: string,
  id: string
): Promise<ServiceResult<{ ok: true }>> {
  if (!OBJECT_ID_PATTERN.test(id)) return { data: { error: 'NOT_FOUND' }, status: 404 };
  const checkIn = await checkInRepository.findById(id);
  if (!checkIn) return { data: { error: 'NOT_FOUND' }, status: 404 };
  if (checkIn.userId.toString() !== userId) return { data: { error: 'FORBIDDEN' }, status: 403 };

  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };
  const locked = subscriptionGuard(user);
  if (locked) return locked;
  if (checkIn.date !== todayInTimezone(user.timezone)) {
    return { data: { error: 'FORBIDDEN' }, status: 403 };
  }

  await checkInRepository.deleteById(id);
  return { data: { ok: true }, status: 200 };
}
