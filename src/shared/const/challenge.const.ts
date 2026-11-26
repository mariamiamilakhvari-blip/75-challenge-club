export type PresetChallenge = {
  key: string;
  title: string;
  hint: string;
};

export const CHALLENGE_LENGTH_DAYS = 75;

export const MAX_TEAM_SIZE = 6;

export const MAX_CHALLENGES = 15;

export const MAX_COMMENT_LENGTH = 140;

export const CHALLENGES: PresetChallenge[] = [
  { key: 'water', title: 'Drink 2 L of water', hint: 'Spread it through the day' },
  { key: 'workout', title: 'Work out 30 min', hint: 'Gym, yoga, pilates, dancing, walking, jogging…' },
  { key: 'read', title: 'Read 10 pages', hint: 'Any book, paper or e-reader' },
  { key: 'no-junk', title: 'No junk food', hint: 'One cheat allowed per month' },
  { key: 'no-alcohol', title: 'No alcohol', hint: 'One exception allowed per month' },
  { key: 'social', title: 'One social activity per week', hint: 'Meet people offline' },
  { key: 'sleep', title: 'Sleep before 12 A.M.', hint: 'Lights out before midnight' },
  { key: 'doomscroll', title: 'Max 1 hour doomscrolling', hint: 'Per day, all apps combined' },
  { key: 'meditate', title: 'Meditate / relax 15 min', hint: 'Whole-body relaxation counts' },
  { key: 'skill', title: 'Learn a new skill 20 min', hint: 'Language, instrument, code…' },
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
