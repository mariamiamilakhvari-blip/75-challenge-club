'use client';
import { Check, X } from 'lucide-react';
import { type PointerEvent, useRef, useState } from 'react';

import { ProfileCard } from '@/features/team/components/profile-card';
import { DiscoverCard } from '@/features/team/types/team.types';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type Direction = 'left' | 'right';

type SwipeDeckProps = {
  card: DiscoverCard;
  next: DiscoverCard | null;
  disabled: boolean;
  onSkip: (card: DiscoverCard) => void;
  onJoin: (card: DiscoverCard) => void;
};

const COMMIT_THRESHOLD = 110;
const EXIT_MS = 280;

const DRAG_STEPS = [
  { min: 128, right: 'translate-x-24 motion-safe:rotate-6', left: '-translate-x-24 motion-safe:-rotate-6' },
  { min: 88, right: 'translate-x-16 motion-safe:rotate-3', left: '-translate-x-16 motion-safe:-rotate-3' },
  { min: 48, right: 'translate-x-8 motion-safe:rotate-2', left: '-translate-x-8 motion-safe:-rotate-2' },
  { min: 16, right: 'translate-x-4 motion-safe:rotate-1', left: '-translate-x-4 motion-safe:-rotate-1' },
];

const EXIT_CLASS: Record<Direction, string> = {
  right: 'translate-x-full motion-safe:rotate-12 opacity-0',
  left: '-translate-x-full motion-safe:-rotate-12 opacity-0',
};

function dragClass(dx: number): string {
  const step = DRAG_STEPS.find((s) => Math.abs(dx) >= s.min);
  if (!step) return 'translate-x-0 rotate-0';
  return dx > 0 ? step.right : step.left;
}

function stampOpacity(distance: number): string {
  if (distance >= 80) return 'opacity-100';
  if (distance >= 32) return 'opacity-50';
  return 'opacity-0';
}

export const SwipeDeck = ({ card, next, disabled, onSkip, onJoin }: SwipeDeckProps) => {
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [exit, setExit] = useState<Direction | null>(null);
  const locked = disabled || exit !== null;

  const commit = (direction: Direction) => {
    if (locked) return;
    setExit(direction);
    window.setTimeout(() => (direction === 'right' ? onJoin(card) : onSkip(card)), EXIT_MS);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };

  const onPointerEnd = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (Math.abs(dx) >= COMMIT_THRESHOLD) commit(dx > 0 ? 'right' : 'left');
    setDx(0);
  };

  const motionClass = exit ? EXIT_CLASS[exit] : dragClass(dx);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-x-clip py-2">
        {next && (
          <div className="pointer-events-none absolute inset-x-0 top-2 scale-95 opacity-50" aria-hidden>
            <ProfileCard card={next} />
          </div>
        )}
        <div
          role="group"
          aria-label={`${card.name}. Swipe right to join, left to skip.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className={cn(
            'relative cursor-grab touch-pan-y select-none active:cursor-grabbing',
            'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
            motionClass
          )}
        >
          <ProfileCard card={card} />
          <span
            className={cn(
              'pointer-events-none absolute left-5 top-5 -rotate-12 rounded-lg border-4 border-success px-3 py-1',
              'text-2xl font-extrabold tracking-widest text-success transition-opacity',
              exit === 'right' ? 'opacity-100' : stampOpacity(dx)
            )}
            aria-hidden
          >
            JOIN
          </span>
          <span
            className={cn(
              'pointer-events-none absolute right-5 top-5 rotate-12 rounded-lg border-4 border-destructive px-3 py-1',
              'text-2xl font-extrabold tracking-widest text-destructive transition-opacity',
              exit === 'left' ? 'opacity-100' : stampOpacity(-dx)
            )}
            aria-hidden
          >
            SKIP
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-rise animate-rise-2">
        <Button variant="outline" size="lg" className="h-14 rounded-full text-base" onClick={() => commit('left')} disabled={locked}>
          <X className="size-5" aria-hidden />
          Skip
        </Button>
        <Button
          size="lg"
          className="h-14 rounded-full text-base font-bold shadow-md active:scale-95"
          onClick={() => commit('right')}
          disabled={locked}
        >
          <Check className="size-5" aria-hidden />
          Join
        </Button>
      </div>
    </div>
  );
};
