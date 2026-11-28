import { ReactNode } from 'react';

type ChallengeSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const ChallengeSection = ({ title, description, children }: ChallengeSectionProps) => {
  return (
    <section className="space-y-2" aria-label={title}>
      <div className="px-1 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
};
