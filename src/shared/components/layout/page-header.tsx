import { type ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 animate-rise">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};
