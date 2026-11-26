import { PageHeader } from '@/shared/components/layout/page-header';

type TodayHeaderProps = {
  date: string;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export const TodayHeader = ({ date }: TodayHeaderProps) => {
  return (
    <div className="space-y-1">
      <PageHeader title="Today" subtitle={formatDate(date)} />
      <p className="-mt-4 mb-4 text-xs text-muted-foreground animate-rise">
        Miss a scheduled challenge by midnight and your counter restarts at Day 1
      </p>
    </div>
  );
};
