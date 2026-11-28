'use client';
import { AboutYouForm } from '@/features/profile/components/about-you-form';
import { ChallengePicker } from '@/features/profile/components/challenge-picker';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { PageHeader } from '@/shared/components/layout/page-header';
import { MIN_CHALLENGES } from '@/shared/const/challenge.const';

export const OnboardingFlow = () => {
  const { profile, loading } = useMyProfile();

  if (loading && !profile) {
    return <p className="animate-rise text-sm text-muted-foreground">Loading…</p>;
  }

  if (profile?.needsAbout) {
    return (
      <>
        <PageHeader
          title="About you"
          subtitle="A few basics so teammates know who they're cheering for."
        />
        <AboutYouForm profile={profile} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pick your challenges"
        subtitle={`Pick at least ${MIN_CHALLENGES}. Daily ones run every day; scheduled ones count on the days you choose.`}
      />
      <ChallengePicker />
    </>
  );
};
