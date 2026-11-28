import { ChallengeCard } from '@/features/profile/components/challenge-card';
import { ChallengeSection } from '@/features/profile/components/challenge-section';
import { UserChallenge } from '@/features/profile/types/profile.types';
import { REQUIRED_CHALLENGE_KEYS } from '@/shared/const/challenge.const';
import { getPreset } from '@/shared/utils/challenge-rules';

const REQUIRED_PRESETS = REQUIRED_CHALLENGE_KEYS.flatMap((key) => {
  const preset = getPreset(key);
  return preset ? [preset] : [];
});

type RequiredChallengesSectionProps = {
  // current form values; required challenges are always present in them
  challenges: UserChallenge[];
  onToggleDay: (index: number, day: number, max?: number) => void;
};

export const RequiredChallengesSection = ({ challenges, onToggleDay }: RequiredChallengesSectionProps) => {
  return (
    <ChallengeSection title="Required" description="Everyone does these five. Set the days where asked.">
      {REQUIRED_PRESETS.map((preset) => {
        const index = challenges.findIndex((challenge) => challenge.key === preset.key);
        return (
          <ChallengeCard
            key={preset.key}
            title={preset.title}
            hint={preset.hint}
            kind={preset.kind}
            selected
            required
            days={challenges[index]?.days ?? []}
            requiredDays={preset.requiredDays}
            onToggleSelected={() => undefined}
            onToggleDay={(day) => onToggleDay(index, day, preset.requiredDays)}
          />
        );
      })}
    </ChallengeSection>
  );
};
