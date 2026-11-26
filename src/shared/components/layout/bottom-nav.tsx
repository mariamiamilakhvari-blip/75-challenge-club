'use client';
import { CalendarCheck, Compass, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BOTTOM_NAV_ITEMS, BottomNavItem } from '@/shared/const/navigation.const';
import { cn } from '@/shared/lib/utils';

const ICONS: Record<BottomNavItem['icon'], typeof CalendarCheck> = {
  today: CalendarCheck,
  team: Users,
  discover: Compass,
  profile: User,
};

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
