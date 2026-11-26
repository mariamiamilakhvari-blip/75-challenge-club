import { ChallengePicker } from '@/features/profile/components/challenge-picker';
import { PageHeader } from '@/shared/components/layout/page-header';

export default function OnboardingPage() {
  return (
    <>
      <PageHeader
        title="Pick your challenges"
        subtitle="Tap to select, then choose the days each one counts."
      />
      <ChallengePicker />
    </>
  );
}
