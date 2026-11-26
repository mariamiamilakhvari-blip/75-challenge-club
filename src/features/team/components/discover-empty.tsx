import { RotateCcw, Sparkles } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

type DiscoverEmptyProps = {
  onReset: () => void;
};

export const DiscoverEmpty = ({ onReset }: DiscoverEmptyProps) => {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card px-6 py-12 text-center animate-rise">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-7" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-extrabold">No more people right now</h2>
        <p className="mt-1 text-sm text-muted-foreground">Check back later, or take another look at people you skipped.</p>
      </div>
      <Button variant="outline" className="rounded-full" onClick={onReset}>
        <RotateCcw aria-hidden />
        Show skipped again
      </Button>
    </div>
  );
};
