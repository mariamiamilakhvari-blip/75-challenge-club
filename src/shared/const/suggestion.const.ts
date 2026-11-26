export const MIN_SUGGESTIONS = 3;

export const MAX_SUGGESTIONS = 5;

export const MAX_REASON_LENGTH = 80;

export const SUGGESTION_CACHE_TTL_MS = 10 * 60 * 1000;

export const ALWAYS_SUGGESTED_KEYS = ['water', 'sleep'];

export const FALLBACK_FILLER_KEYS = ['workout', 'read', 'meditate'];

export const INTEREST_CHALLENGE_MAP: Record<string, string> = {
  Fitness: 'workout',
  Yoga: 'workout',
  Running: 'workout',
  Dancing: 'workout',
  Books: 'read',
  Mindfulness: 'meditate',
  Languages: 'skill',
  Tech: 'skill',
  Art: 'skill',
  Music: 'skill',
  Movies: 'doomscroll',
  Cooking: 'no-junk',
  Travel: 'social',
  Volunteering: 'social',
  Nature: 'meditate',
};

export const DEFAULT_SUGGESTION_DAYS: Record<string, number[]> = {
  water: [0, 1, 2, 3, 4, 5, 6],
  workout: [0, 2, 4, 5],
  read: [0, 1, 2, 3, 4, 5, 6],
  'no-junk': [0, 1, 2, 3, 4, 5, 6],
  'no-alcohol': [0, 1, 2, 3, 4, 5, 6],
  social: [5],
  sleep: [0, 1, 2, 3, 4, 5, 6],
  doomscroll: [0, 1, 2, 3, 4, 5, 6],
  meditate: [0, 1, 2, 3, 4, 5, 6],
  skill: [0, 1, 2, 3, 4],
};

export const FALLBACK_REASONS: Record<string, string> = {
  water: 'An easy daily win that keeps your energy up.',
  workout: 'Fits your active interests — a few sessions a week.',
  read: 'You love books — ten pages a day adds up fast.',
  'no-junk': 'Pairs well with cooking your own meals.',
  'no-alcohol': 'A clear head makes every other habit easier.',
  social: 'One offline plan a week keeps you connected.',
  sleep: 'Good sleep powers every other challenge.',
  doomscroll: 'Frees up time for the things you enjoy.',
  meditate: 'A calm 15 minutes that matches your mindful side.',
  skill: 'Twenty focused minutes on what you are curious about.',
};
