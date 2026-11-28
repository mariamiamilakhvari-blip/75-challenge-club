export const MIN_SUGGESTIONS = 5;

export const MAX_SUGGESTIONS = 6;

export const MAX_REASON_LENGTH = 80;

export const SUGGESTION_CACHE_TTL_MS = 10 * 60 * 1000;

export const ALWAYS_SUGGESTED_KEYS = ['water', 'sleep'];

export const FALLBACK_FILLER_KEYS = ['workout', 'read', 'meditate', 'doomscroll', 'skill'];

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

export const FALLBACK_REASONS: Record<string, string> = {
  water: 'An easy daily win that keeps your energy up.',
  workout: 'Fits your active interests — four sessions a week.',
  read: 'You love books — ten pages a day adds up fast.',
  'no-junk': 'Pairs well with cooking your own meals.',
  'no-alcohol': 'A clear head makes every other habit easier.',
  social: 'One offline plan a week keeps you connected.',
  sleep: 'Good sleep powers every other challenge.',
  doomscroll: 'Frees up time for the things you enjoy.',
  meditate: 'Fifteen minutes of body relaxation to unwind.',
  skill: 'Thirty focused minutes on what you are curious about.',
};
