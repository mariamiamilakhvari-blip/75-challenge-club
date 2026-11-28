import { Button } from '@/shared/components/ui/button';

type PublishBarProps = {
  count: number;
  // why the user cannot submit yet; null when ready
  hint: string | null;
  busy: boolean;
  label: string;
};

export const PublishBar = ({ count, hint, busy, label }: PublishBarProps) => {
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-5 shadow-lg backdrop-blur">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground" aria-live="polite">
          {hint ?? (
            <>
              <span className="font-mono text-primary">{count}</span> selected
            </>
          )}
        </p>
        <Button
          type="submit"
          disabled={hint !== null || busy}
          className="h-11 shrink-0 rounded-full px-6 text-base font-semibold active:scale-95"
        >
          {busy ? 'Saving...' : label}
        </Button>
      </div>
    </div>
  );
};
