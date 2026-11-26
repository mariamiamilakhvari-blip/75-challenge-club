export type TodayItem = {
  key: string;
  title: string;
  done: boolean;
  checkInId: string | null;
  comment: string;
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
