export type BottomNavItem = {
  href: string;
  label: string;
  icon: 'today' | 'team' | 'discover' | 'profile';
};

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/team', label: 'Team', icon: 'team' },
  { href: '/discover', label: 'Discover', icon: 'discover' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];
