import { UserChallenge } from '@/features/profile/types/profile.types';
import { ChallengeKind } from '@/shared/const/challenge.const';
import { PlanDetails } from '@/shared/utils/plan-rules';

export type DiscoverCard = {
  id: string;
  name: string;
  age: number | null;
  city: string;
  interests: string[];
  challenges: UserChallenge[];
  sharedChallengeKeys: string[];
  sharedChallenges: number;
  sharedDays: number;
  teamSize: number;
};

export type TeamMember = {
  id: string;
  name: string;
  day: number;
  isMe: boolean;
  // today's progress in the member's own timezone
  todayDone: number;
  todayTotal: number;
};

// done: checked in · pending: today, not yet · missed: past day, not done · upcoming: later this week
export type CellStatus = 'done' | 'pending' | 'missed' | 'upcoming';

export type TeamCellMember = {
  userId: string;
  status: CellStatus;
  comment: string;
};

export type TeamCell = {
  date: string;
  // members who have this challenge on this weekday
  members: TeamCellMember[];
};

export type DayProposalView = {
  id: string;
  days: number[];
  proposerId: string;
  proposerName: string;
  acceptedIds: string[];
  declinedIds: string[];
  myResponse: 'accepted' | 'declined' | null;
  isMine: boolean;
};

export type TeamGridRow = {
  key: string;
  title: string;
  kind: ChallengeKind | 'custom';
  // daily / monthly rows: fixed every-day label shown under the title
  label: string | null;
  // scheduled presets: exact day count a shared-days proposal must have
  requiredDays: number | null;
  cells: TeamCell[];
  proposal: DayProposalView | null;
};

export type PlanReply = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isMine: boolean;
};

export type TeamPlan = {
  id: string;
  userId: string;
  userName: string;
  isMine: boolean;
  challengeKey: string;
  challengeTitle: string;
  details: PlanDetails;
  createdAt: string;
  joinable: boolean;
  joiners: { id: string; name: string }[];
  joinedByMe: boolean;
  replies: PlanReply[];
};

export type TeamComment = {
  id: string;
  userId: string;
  userName: string;
  challengeKey: string;
  challengeTitle: string;
  comment: string;
  date: string;
  joiners: { id: string; name: string }[];
  joinedByMe: boolean;
  isMine: boolean;
};

export type TeamBoard = {
  teamId: string;
  members: TeamMember[];
  memberChallenges: { userId: string; name: string; challenges: UserChallenge[] }[];
  grid: TeamGridRow[];
  today: string;
  todayIndex: number;
  // Mon..Sun dates of the viewer's current week
  weekDates: string[];
  comments: TeamComment[];
  plans: TeamPlan[];
};
