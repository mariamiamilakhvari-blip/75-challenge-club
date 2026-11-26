'use client';
import { Check, Plus, Sparkles, X } from 'lucide-react';

import { useChallengeSuggestions } from '@/features/ai/hooks/use-challenge-suggestions';
import { ChallengeSuggestion } from '@/features/ai/types/suggestion.types';
import { DayLetters } from '@/features/profile/components/day-letters';
import { Button } from '@/shared/components/ui/button';

const SKELETON_ROWS = ['one', 'two', 'three'];

type SuggestionsPanelProps = {
  selectedKeys: string[];
  onApply: (suggestions: ChallengeSuggestion[]) => void;
  onClose: () => void;
};

export const SuggestionsPanel = ({ selectedKeys, onApply, onClose }: SuggestionsPanelProps) => {
  const { suggestions, source, loading, error, reload } = useChallengeSuggestions(true);
  const pending = suggestions.filter((item) => !selectedKeys.includes(item.key));

  return (
    <section
      aria-label="Suggested for you"
      aria-busy={loading}
      className="animate-rise rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground">Suggested for you</h2>
          {source === 'fallback' && <p className="text-xs text-muted-foreground">Based on your interests</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide suggestions"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted active:scale-90"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {loading && (
        <ul className="mt-3 space-y-2" aria-label="Loading suggestions">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </ul>
      )}

      {!loading && error && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load suggestions.</p>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <>
          <ul className="mt-3 space-y-2">
            {suggestions.map((item) => {
              const added = selectedKeys.includes(item.key);
              return (
                <li key={item.key} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-xs">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <DayLetters days={item.days} />
                    {item.reason && <p className="text-xs text-muted-foreground">{item.reason}</p>}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={added ? 'secondary' : 'outline'}
                    disabled={added}
                    onClick={() => onApply([item])}
                    className="rounded-full active:scale-95"
                    aria-label={added ? `${item.title} added` : `Add ${item.title}`}
                  >
                    {added ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                    {added ? 'Added' : 'Add'}
                  </Button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            disabled={pending.length === 0}
            onClick={() => onApply(pending)}
            className="mt-3 w-full rounded-full font-semibold active:scale-95"
          >
            {pending.length === 0 ? 'All added' : 'Apply all'}
          </Button>
        </>
      )}
    </section>
  );
};
