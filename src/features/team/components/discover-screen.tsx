'use client';
import { DiscoverEmpty } from '@/features/team/components/discover-empty';
import { SwipeDeck } from '@/features/team/components/swipe-deck';
import { useDiscoverDeck } from '@/features/team/hooks/use-discover-deck';
import { useSwipeActions } from '@/features/team/hooks/use-swipe-actions';
import { PageHeader } from '@/shared/components/layout/page-header';
import { Button } from '@/shared/components/ui/button';

export const DiscoverScreen = () => {
  const { current, next, loading, error, advance, resetSkips, reload } = useDiscoverDeck();
  const { skip, join, pending, message } = useSwipeActions(advance);

  return (
    <>
      <PageHeader title="Discover" subtitle="Find people who share your challenges" />
      {message && (
        <p role="status" className="mb-4 rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {loading && <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-label="Loading people" />}
      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="rounded-full" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      )}
      {!loading && !error && !current && <DiscoverEmpty onReset={() => void resetSkips()} />}
      {!loading && !error && current && (
        <div className="animate-rise animate-rise-1">
          <SwipeDeck key={current.id} card={current} next={next} disabled={pending} onSkip={skip} onJoin={join} />
        </div>
      )}
    </>
  );
};
