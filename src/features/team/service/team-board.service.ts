import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { CheckInDocument } from '@/features/checkin/schema/checkin.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { syncStreak } from '@/features/profile/service/streak.service';
import { dayProposalRepository } from '@/features/team/repository/day-proposal.repository';
import { DayProposalDocument } from '@/features/team/schema/day-proposal.schema';
import { toUserChallenges } from '@/features/team/service/discover.service';
import { buildComments, buildPlans } from '@/features/team/service/team-feed.service';
import { loadTeamContext } from '@/features/team/service/team.service';
import {
  CellStatus,
  DayProposalView,
  TeamBoard,
  TeamGridRow,
  TeamMember,
} from '@/features/team/types/team.types';
import { ALL_DAYS, MONTHLY_EXCEPTIONS_ALLOWED } from '@/shared/const/challenge.const';
import { ServiceResult } from '@/shared/types/common';
import { challengeKind, getPreset } from '@/shared/utils/challenge-rules';
import { addDays, todayInTimezone, weekdayIndex } from '@/shared/utils/date';
import { buildDoneByDate, firstOfMonth, scheduledKeysFor } from '@/shared/utils/streak';

type DoneByMember = Map<string, Map<string, Set<string>>>;

function rowLabel(key: string): string | null {
  const kind = challengeKind(key);
  if (kind === 'daily') return 'Every day';
  if (kind === 'monthly') return `Every day · ${MONTHLY_EXCEPTIONS_ALLOWED}/month allowance`;
  return null;
}

export function weekDatesFor(today: string): string[] {
  const monday = addDays(today, -weekdayIndex(today));
  return ALL_DAYS.map((d) => addDays(monday, d));
}

export function cellStatus(done: boolean, date: string, today: string): CellStatus {
  if (done) return 'done';
  if (date === today) return 'pending';
  return date < today ? 'missed' : 'upcoming';
}

export function buildDoneByMember(memberIds: string[], checkIns: CheckInDocument[]): DoneByMember {
  return new Map(memberIds.map((id) => [id, buildDoneByDate(checkIns.filter((c) => c.userId.toString() === id))]));
}

export function toProposalView(proposal: DayProposalDocument, viewerId: string, members: UserDocument[]): DayProposalView {
  const acceptedIds = proposal.accepted.map((id) => id.toString());
  const declinedIds = proposal.declined.map((id) => id.toString());
  const proposerId = proposal.proposerId.toString();
  const myResponse = acceptedIds.includes(viewerId) ? 'accepted' : declinedIds.includes(viewerId) ? 'declined' : null;
  return {
    id: proposal._id.toString(),
    days: [...proposal.days].sort((a, b) => a - b),
    proposerId,
    proposerName: members.find((m) => m._id.toString() === proposerId)?.name ?? 'A teammate',
    acceptedIds,
    declinedIds,
    myResponse,
    isMine: proposerId === viewerId,
  };
}

type GridInput = {
  viewer: UserDocument;
  members: UserDocument[];
  weekDates: string[];
  today: string;
  doneByMember: DoneByMember;
  comments: Map<string, string>;
  proposals: DayProposalDocument[];
};

export const commentKey = (userId: string, date: string, key: string) => `${userId}|${date}|${key}`;

export function buildGrid({ viewer, members, weekDates, today, doneByMember, comments, proposals }: GridInput): TeamGridRow[] {
  const viewerId = viewer._id.toString();
  return viewer.challenges
    .filter((c) => members.every((m) => m.challenges.some((mc) => mc.key === c.key)))
    .map((c) => {
      const preset = getPreset(c.key);
      const proposal = proposals.find((p) => p.challengeKey === c.key);
      return {
        key: c.key,
        title: preset?.title ?? c.title,
        kind: challengeKind(c.key),
        label: rowLabel(c.key),
        requiredDays: preset?.kind === 'scheduled' ? (preset.requiredDays ?? null) : null,
        proposal: proposal ? toProposalView(proposal, viewerId, members) : null,
        cells: weekDates.map((date, d) => ({
          date,
          members: members
            .filter((m) => m.challenges.some((mc) => mc.key === c.key && mc.days.includes(d)))
            .map((m) => {
              const id = m._id.toString();
              const done = doneByMember.get(id)?.get(date)?.has(c.key) ?? false;
              return { userId: id, status: cellStatus(done, date, today), comment: comments.get(commentKey(id, date, c.key)) ?? '' };
            }),
        })),
      };
    });
}

function memberProgress(member: UserDocument, doneByMember: DoneByMember): Pick<TeamMember, 'todayDone' | 'todayTotal'> {
  const date = todayInTimezone(member.timezone);
  const scheduled = scheduledKeysFor(member.challenges, date);
  const done = doneByMember.get(member._id.toString())?.get(date) ?? new Set<string>();
  return { todayDone: scheduled.filter((key) => done.has(key)).length, todayTotal: scheduled.length };
}

export async function getTeamBoardService(userId: string, now: Date = new Date()): Promise<ServiceResult<TeamBoard>> {
  const loaded = await loadTeamContext(userId);
  if (!loaded.ok) return loaded.error;
  const { viewer, teamId, memberIds } = loaded.context;

  const docs = await profileRepository.findByIds(memberIds);
  const synced = await Promise.all(docs.map((doc) => syncStreak(doc)));
  const members = synced.map((s) => s.user);
  const today = todayInTimezone(viewer.timezone, now);
  const weekDates = weekDatesFor(today);
  // members can be a day ahead of the viewer; month start keeps monthly allowances right
  const to = [weekDates[6], ...members.map((m) => todayInTimezone(m.timezone, now))].sort().at(-1) ?? today;

  const [checkIns, proposals, comments, plans] = await Promise.all([
    checkInRepository.findByUsersBetween(memberIds, firstOfMonth(weekDates[0]), to),
    dayProposalRepository.findByTeam(teamId),
    buildComments(userId, members, addDays(today, -2)),
    buildPlans(userId, teamId, members, now),
  ]);
  const doneByMember = buildDoneByMember(memberIds, checkIns);
  const commentMap = new Map(
    checkIns.filter((c) => !c.exception && c.comment).map((c) => [commentKey(c.userId.toString(), c.date, c.challengeKey), c.comment ?? ''])
  );

  const board: TeamBoard = {
    teamId,
    members: synced.map((s) => ({
      id: s.user._id.toString(),
      name: s.user.name,
      day: s.day,
      isMe: s.user._id.toString() === userId,
      ...memberProgress(s.user, doneByMember),
    })),
    memberChallenges: members.map((m) => ({ userId: m._id.toString(), name: m.name, challenges: toUserChallenges(m) })),
    grid: buildGrid({ viewer, members, weekDates, today, doneByMember, comments: commentMap, proposals }),
    today,
    todayIndex: weekdayIndex(today),
    weekDates,
    comments,
    plans,
  };
  return { data: board, status: 200 };
}
