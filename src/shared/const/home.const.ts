export type HowItWorksStep = {
  step: string;
  title: string;
  description: string;
  icon: 'list' | 'users' | 'flame';
};

export const HOME_HERO = {
  eyebrow: '75-day group challenge',
  titleLead: '75 days.',
  titleMiddle: 'Your habits.',
  titleAccent: 'Your team.',
  description:
    'Pick the habits you want to build, match with people on the same schedule, and keep each other going until day 75.',
};

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: '1',
    title: 'Pick your challenges',
    description: 'Water, workouts, reading, sleep — choose presets or add your own, and set which days they count.',
    icon: 'list',
  },
  {
    step: '2',
    title: 'Find your team',
    description: 'Swipe through people with overlapping habits and form a crew of up to 6.',
    icon: 'users',
  },
  {
    step: '3',
    title: 'Check in daily',
    description: 'Tick off today, cheer teammates on, and watch your streak climb to 75.',
    icon: 'flame',
  },
];
