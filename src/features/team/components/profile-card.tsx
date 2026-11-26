import { Check, MapPin, Users } from 'lucide-react';

import { DiscoverCard } from '@/features/team/types/team.types';
import { Badge } from '@/shared/components/ui/badge';
import { WEEKDAY_LETTERS } from '@/shared/const/challenge.const';
import { cn } from '@/shared/lib/utils';

type ProfileCardProps = {
  card: DiscoverCard;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const overlapLabel = (card: DiscoverCard) =>
  `${plural(card.sharedChallenges, 'challenge')} · ${plural(card.sharedDays, 'day')} match`;

export const ProfileCard = ({ card }: ProfileCardProps) => {
  const shared = new Set(card.sharedChallengeKeys);
  const challenges = [...card.challenges].sort((a, b) => Number(shared.has(b.key)) - Number(shared.has(a.key)));

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-extrabold">
            {card.name}
            {card.age !== null && <span className="font-semibold text-muted-foreground">, {card.age}</span>}
          </h2>
          {card.city && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {card.city}
            </p>
          )}
        </div>
        <Badge variant="outline" className="gap-1">
          <Users aria-hidden />
          {card.teamSize > 0 ? `Team of ${card.teamSize}` : 'Solo'}
        </Badge>
      </div>

      <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{overlapLabel(card)}</p>

      {card.interests.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
          {card.interests.map((interest) => (
            <li key={interest}>
              <Badge variant="secondary">{interest}</Badge>
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-col gap-2" aria-label="Challenges">
        {challenges.map((c) => {
          const isShared = shared.has(c.key);
          return (
            <li
              key={c.key}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm',
                isShared ? 'border-primary/40 bg-primary/10 font-semibold text-primary' : 'text-foreground'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {isShared && <Check className="size-4 shrink-0" aria-label="Shared" />}
                <span className="truncate">{c.title}</span>
              </span>
              <span className="flex shrink-0 gap-0.5 font-mono text-xs" aria-hidden>
                {WEEKDAY_LETTERS.map((letter, d) => (
                  <span key={d} className={c.days.includes(d) ? 'opacity-100' : 'opacity-25'}>
                    {letter}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
