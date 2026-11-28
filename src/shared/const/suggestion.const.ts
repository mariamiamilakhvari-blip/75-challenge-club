// suggestions cover optional challenges only; the 5 required ones are always included
export const MIN_SUGGESTIONS = 2;

export const MAX_SUGGESTIONS = 3;

export const MAX_REASON_LENGTH = 80;

export const SUGGESTION_CACHE_TTL_MS = 10 * 60 * 1000;

export const ALWAYS_SUGGESTED_KEYS = ['sleep'];

export const FALLBACK_FILLER_KEYS = ['meditate', 'doomscroll', 'skill', 'no-alcohol'];

export const INTEREST_CHALLENGE_MAP: Record<string, string> = {
  Fitness: 'sleep',
  Running: 'sleep',
  Yoga: 'meditate',
  Dancing: 'meditate',
  Mindfulness: 'meditate',
  Nature: 'meditate',
  Books: 'doomscroll',
  Movies: 'doomscroll',
  Languages: 'skill',
  Tech: 'skill',
  Art: 'skill',
  Music: 'skill',
  Cooking: 'no-alcohol',
  Travel: 'skill',
  Volunteering: 'doomscroll',
};

export const FALLBACK_REASONS: Record<string, string> = {
  water: 'An easy daily win that keeps your energy up.',
  workout: 'Fits your active interests — four sessions a week.',
  read: 'You love books — ten pages a day adds up fast.',
  'no-junk': 'Pairs well with cooking your own meals.',
  'no-alcohol': 'A clear head makes every other habit easier.',
  social: 'One offline plan a week keeps you connected.',
  sleep: 'Good sleep powers every other challenge — and your workouts.',
  doomscroll: 'Less scrolling, more time for the things you enjoy.',
  meditate: 'Fifteen minutes of body relaxation to unwind.',
  skill: 'Thirty focused minutes on what you are curious about.',
};
