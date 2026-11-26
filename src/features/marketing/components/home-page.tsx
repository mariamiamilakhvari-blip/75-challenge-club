import { ArrowRight, Flame, ListChecks, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Footer } from '@/shared/components/layout/footer';
import { Header } from '@/shared/components/layout/header';
import { Button } from '@/shared/components/ui/button';
import { HOME_HERO, HOW_IT_WORKS, type HowItWorksStep } from '@/shared/const/home.const';
import { cn } from '@/shared/lib/utils';

const STEP_ICON_MAP: Record<HowItWorksStep['icon'], LucideIcon> = {
  list: ListChecks,
  users: Users,
  flame: Flame,
};

const STAGGER = ['animate-rise-1', 'animate-rise-2', 'animate-rise-3'];

export const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-md flex-1 px-4">
        <section className="pb-10 pt-8">
          <p className="animate-rise inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Flame className="size-3.5" aria-hidden="true" />
            {HOME_HERO.eyebrow}
          </p>

          <h1 className="animate-rise animate-rise-1 mt-5 text-5xl font-extrabold leading-tight">
            {HOME_HERO.titleLead}
            <br />
            {HOME_HERO.titleMiddle}
            <br />
            <span className="text-primary">{HOME_HERO.titleAccent}</span>
          </h1>

          <p className="animate-rise animate-rise-2 mt-5 text-base leading-relaxed text-muted-foreground">
            {HOME_HERO.description}
          </p>

          <div className="animate-rise animate-rise-3 mt-8 flex flex-col gap-3">
            <Button asChild className="h-12 rounded-full text-base font-semibold shadow-sm active:scale-95">
              <Link href="/sign-up">
                Sign up — it&apos;s free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full text-base font-semibold active:scale-95">
              <Link href="/sign-in">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="pb-12">
          <h2 id="how-it-works" className="animate-rise text-xl font-extrabold">
            How it works
          </h2>

          <ol className="mt-4 space-y-3">
            {HOW_IT_WORKS.map((item, index) => {
              const Icon = STEP_ICON_MAP[item.icon];
              return (
                <li
                  key={item.step}
                  className={cn('animate-rise flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm', STAGGER[index])}
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-mono text-xs font-semibold text-muted-foreground">Step {item.step}</p>
                    <h3 className="mt-0.5 text-base font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
};
