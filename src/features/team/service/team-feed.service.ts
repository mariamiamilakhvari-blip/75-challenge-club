import { UserDocument } from '@/features/auth/schema/user.schema';
import { checkInRepository } from '@/features/checkin/repository/checkin.repository';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { planRepository } from '@/features/team/repository/plan.repository';
import { TeamComment, TeamPlan } from '@/features/team/types/team.types';
import { PLAN_FEED_DAYS } from '@/shared/const/plan.const';
import { getPreset } from '@/shared/utils/challenge-rules';
import { isJoinablePlan } from '@/shared/utils/plan-rules';

const MS_PER_DAY = 86_400_000;

const FORMER_TEAMMATE = 'Former teammate';

export function challengeTitle(members: UserDocument[], key: string): string {
  if (getPreset(key)) return getPreset(key)?.title ?? key;
  for (const member of members) {
    const found = member.challenges.find((c) => c.key === key);
    if (found) return found.title;
  }
  return key;
}

export async function buildComments(viewerId: string, members: UserDocument[], since: string): Promise<TeamComment[]> {
  const nameById = new Map(members.map((m) => [m._id.toString(), m.name]));
  const checkIns = await checkInRepository.findCommentedByUsersSince([...nameById.keys()], since);

  const unknownJoiners = [...new Set(checkIns.flatMap((c) => c.joiners.map((j) => j.toString())))].filter(
    (id) => !nameById.has(id)
  );
  const extra = unknownJoiners.length > 0 ? await profileRepository.findByIds(unknownJoiners) : [];
  extra.forEach((u) => nameById.set(u._id.toString(), u.name));

  // exceptions (monthly cheat / drink) are never shown in the feed
  return checkIns
    .filter((c) => !c.exception)
    .map((c) => {
      const ownerId = c.userId.toString();
      const joinerIds = c.joiners.map((j) => j.toString());
      return {
        id: c._id.toString(),
        userId: ownerId,
        userName: nameById.get(ownerId) ?? 'Someone',
        challengeKey: c.challengeKey,
        challengeTitle: challengeTitle(members, c.challengeKey),
        comment: c.comment ?? '',
        date: c.date,
        joiners: joinerIds.map((id) => ({ id, name: nameById.get(id) ?? 'Someone' })),
        joinedByMe: joinerIds.includes(viewerId),
        isMine: ownerId === viewerId,
      };
    });
}

export async function buildPlans(viewerId: string, teamId: string, members: UserDocument[], now: Date): Promise<TeamPlan[]> {
  const since = new Date(now.getTime() - PLAN_FEED_DAYS * MS_PER_DAY);
  const plans = await planRepository.findByTeamSince(teamId, since);
  const nameById = new Map(members.map((m) => [m._id.toString(), m.name]));
  const nameOf = (id: string) => nameById.get(id) ?? FORMER_TEAMMATE;

  return plans.map((plan) => {
    const ownerId = plan.userId.toString();
    const joinerIds = plan.joiners.map((j) => j.toString());
    return {
      id: plan._id.toString(),
      userId: ownerId,
      userName: nameOf(ownerId),
      isMine: ownerId === viewerId,
      challengeKey: plan.challengeKey,
      challengeTitle: challengeTitle(members, plan.challengeKey),
      details: {
        place: plan.place ?? '',
        when: plan.when ?? '',
        activity: plan.activity ?? '',
        book: plan.book ?? '',
        author: plan.author ?? '',
        note: plan.note ?? '',
      },
      createdAt: new Date(plan.createdAt).toISOString(),
      joinable: isJoinablePlan(plan.challengeKey),
      joiners: joinerIds.map((id) => ({ id, name: nameOf(id) })),
      joinedByMe: joinerIds.includes(viewerId),
      replies: plan.replies.map((reply) => {
        const replierId = reply.userId.toString();
        return {
          id: reply._id.toString(),
          userId: replierId,
          userName: nameOf(replierId),
          text: reply.text,
          createdAt: new Date(reply.createdAt).toISOString(),
          isMine: replierId === viewerId,
        };
      }),
    };
  });
}
