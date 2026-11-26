import { Button } from '@/shared/components/ui/button';

type PublishBarProps = {
  count: number;
  disabled: boolean;
  busy: boolean;
  label: string;
};

export const PublishBar = ({ count, disabled, busy, label }: PublishBarProps) => {
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-5 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-foreground">
          <span className="font-mono text-primary">{count}</span> selected
        </p>
        <Button
          type="submit"
          disabled={disabled || busy}
          className="h-11 rounded-full px-6 text-base font-semibold active:scale-95"
        >
          {busy ? 'Saving...' : label}
        </Button>
      </div>
    </div>
  );
};
