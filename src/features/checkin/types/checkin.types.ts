import { ChallengeKind } from '@/shared/const/challenge.const';

export type TodayItemKind = ChallengeKind | 'custom';

export type TodayItem = {
  key: string;
  title: string;
  kind: TodayItemKind;
  done: boolean;
  // today's check-in used the monthly allowance (cheat / drink)
  exception: boolean;
  checkInId: string | null;
  comment: string;
  // monthly only: exceptions logged this calendar month (user tz)
  exceptionsUsed?: number;
  exceptionsAllowed?: number;
};

export type TeammateProgress = {
  id: string;
  name: string;
  done: number;
  total: number;
};

export type TodayView = {
  day: number;
  date: string;
  weekday: number;
  completed: boolean;
  items: TodayItem[];
  teammates: TeammateProgress[];
};
