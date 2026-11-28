export type ChallengeKind = 'daily' | 'scheduled' | 'monthly';

export type PresetChallenge = {
  key: string;
  title: string;
  hint: string;
  kind: ChallengeKind;
  // scheduled only: exact number of weekdays the user must pick
  requiredDays?: number;
  // scheduled only: days preselected when the card is selected
  defaultDays?: number[];
  // monthly only: word for the allowed exception ("cheat", "drink")
  exceptionNoun?: string;
};

export const CHALLENGE_LENGTH_DAYS = 75;

export const MAX_TEAM_SIZE = 6;

export const MIN_CHALLENGES = 5;

export const MAX_CHALLENGES = 15;

export const MAX_COMMENT_LENGTH = 140;

export const MONTHLY_EXCEPTIONS_ALLOWED = 1;

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const CHALLENGES: PresetChallenge[] = [
  { key: 'water', title: 'Drink 2 L of water', hint: 'Every day', kind: 'daily' },
  { key: 'read', title: 'Read 10 pages', hint: 'Every day', kind: 'daily' },
  {
    key: 'doomscroll',
    title: 'Max 1 hour of doomscrolling',
    hint: 'Social media, every day',
    kind: 'daily',
  },
  { key: 'meditate', title: 'Body relaxation 15 min', hint: 'Every day', kind: 'daily' },
  {
    key: 'workout',
    title: 'Work out 45 min',
    hint: '4 days per week — gym, yoga, pilates, dancing, walking, jogging…',
    kind: 'scheduled',
    requiredDays: 4,
    defaultDays: [0, 2, 4, 5],
  },
  {
    key: 'sleep',
    title: 'Sleep before 12 AM',
    hint: '5 days per week',
    kind: 'scheduled',
    requiredDays: 5,
    defaultDays: [0, 1, 2, 3, 6],
  },
  {
    key: 'skill',
    title: 'Learn a new skill 30 min',
    hint: '4 days per week',
    kind: 'scheduled',
    requiredDays: 4,
    defaultDays: [0, 1, 3, 4],
  },
  {
    key: 'social',
    title: 'Social activity',
    hint: 'Once per week',
    kind: 'scheduled',
    requiredDays: 1,
    defaultDays: [5],
  },
  { key: 'no-junk', title: 'No junk food', hint: 'One cheat allowed per month', kind: 'monthly', exceptionNoun: 'cheat' },
  { key: 'no-alcohol', title: 'No alcohol', hint: 'One drink allowed per month', kind: 'monthly', exceptionNoun: 'drink' },
];

export const CHALLENGE_KIND_LABELS: Record<ChallengeKind, string> = {
  daily: 'Daily',
  scheduled: 'Scheduled',
  monthly: 'Monthly allowance',
};

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
