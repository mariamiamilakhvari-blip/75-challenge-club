import { APP_NAME } from '@/shared/const/app.const';

export const Footer = () => {
  return (
    <footer className="mx-auto w-full max-w-md px-4 py-8">
      <p className="text-center text-xs text-muted-foreground">
        {APP_NAME} · 75 days, one habit stack, a team that shows up.
      </p>
    </footer>
  );
};
