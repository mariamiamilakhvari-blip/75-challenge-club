import { UserChallenge } from '@/features/profile/types/profile.types';
import { ChallengeKind } from '@/shared/const/challenge.const';

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
};

export type TeamGridRow = {
  key: string;
  title: string;
  kind: ChallengeKind | 'custom';
  // daily / monthly rows: fixed every-day label instead of per-weekday counts
  label: string | null;
  counts: number[];
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
  comments: TeamComment[];
};
