'use client';
import { AboutYouForm } from '@/features/profile/components/about-you-form';
import { ChallengePicker } from '@/features/profile/components/challenge-picker';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { PageHeader } from '@/shared/components/layout/page-header';

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
        subtitle="Five challenges everyone does together — set their days, then add more if you like."
      />
      <ChallengePicker />
    </>
  );
};
