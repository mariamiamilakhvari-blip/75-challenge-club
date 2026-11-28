'use client';
import { AlertCircle, CreditCard, LogOut, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { BillingStatusLine } from '@/features/billing/components/billing-status-line';
import { DayLetters } from '@/features/profile/components/day-letters';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { Button } from '@/shared/components/ui/button';
import { PLANS_ROUTE } from '@/shared/const/billing.const';
import { CHALLENGE_LENGTH_DAYS } from '@/shared/const/challenge.const';
import { ONBOARDING_ROUTE } from '@/shared/const/routes.const';

export const ProfileView = () => {
  const { profile, loading, error } = useMyProfile();
  const { logout } = useLogout();

  if (!profile) {
    return (
      <p className="animate-rise text-sm text-muted-foreground">
        {loading ? 'Loading your profile…' : (error ?? 'Profile not found')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-foreground">{profile.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          {profile.age !== null && <span>{profile.age}</span>}
          {profile.age !== null && profile.city && <span aria-hidden="true">·</span>}
          {profile.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {profile.city}
            </span>
          )}
        </p>
        {profile.interests.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <li key={interest} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {interest}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="animate-rise animate-rise-1 rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
        <p className="text-sm font-semibold opacity-90">{profile.published ? 'Your streak' : 'Not published yet'}</p>
        <p className="mt-1 font-mono text-4xl font-bold">
          Day {profile.published ? profile.day : 0}
          <span className="text-lg font-semibold opacity-80"> of {CHALLENGE_LENGTH_DAYS}</span>
        </p>
      </section>

      <section className="animate-rise animate-rise-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">My challenges</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-full font-semibold text-primary">
            <Link href={ONBOARDING_ROUTE}>
              <Pencil className="size-3.5" />
              Edit challenges
            </Link>
          </Button>
        </div>
        {profile.needsChallengeFix && profile.challenges.length > 0 && (
          <Link
            href={ONBOARDING_ROUTE}
            className="mb-3 flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/15"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {profile.missingRequired.length > 0
                ? 'Some required challenges are missing.'
                : 'Some challenges have the wrong number of days.'}{' '}
              <span className="font-semibold text-primary">Fix in Edit challenges</span>
            </span>
          </Link>
        )}
        {profile.challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No challenges yet — pick a few to get started.</p>
        ) : (
          <ul className="divide-y divide-border">
            {profile.challenges.map((challenge) => (
              <li key={challenge.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-semibold text-foreground">{challenge.title}</span>
                <DayLetters challengeKey={challenge.key} days={challenge.days} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="animate-rise animate-rise-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">Plan</h2>
          <BillingStatusLine billing={profile.billing} className="mt-0.5" />
        </div>
        <Button asChild variant={profile.billing.hasAccess ? 'outline' : 'default'} size="sm" className="shrink-0 rounded-full font-semibold">
          <Link href={PLANS_ROUTE}>
            <CreditCard className="size-3.5" />
            Plans
          </Link>
        </Button>
      </section>

      <Button
        type="button"
        variant="outline"
        onClick={logout}
        className="animate-rise animate-rise-3 h-12 w-full rounded-full text-base font-semibold active:scale-95"
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
};
