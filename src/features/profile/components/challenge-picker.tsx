'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { useChallengeSuggestions } from '@/features/ai/hooks/use-challenge-suggestions';
import { ChallengeSuggestion } from '@/features/ai/types/suggestion.types';
import { ChallengeCard } from '@/features/profile/components/challenge-card';
import { ChallengeSection } from '@/features/profile/components/challenge-section';
import { CustomChallengeInput } from '@/features/profile/components/custom-challenge-input';
import { PublishBar } from '@/features/profile/components/publish-bar';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { usePublish } from '@/features/profile/hooks/use-publish';
import { useSaveChallenges } from '@/features/profile/hooks/use-save-challenges';
import { UserChallenge } from '@/features/profile/types/profile.types';
import {
  UpdateChallengesSchema,
  UpdateChallengesType,
} from '@/features/profile/validations/profile.validation';
import {
  ALL_DAYS,
  CHALLENGE_KIND_LABELS,
  CHALLENGES,
  ChallengeKind,
  MAX_CHALLENGES,
  MIN_CHALLENGES,
  PresetChallenge,
} from '@/shared/const/challenge.const';
import { getPreset, initialDays, normalizeDays } from '@/shared/utils/challenge-rules';

const SLUG_MAX_LENGTH = 40;

const SECTION_DESCRIPTIONS: Record<ChallengeKind, string> = {
  daily: 'Every day, all 75 days.',
  scheduled: 'Choose which days of the week they count.',
  monthly: 'Follow every day — one exception allowed each month.',
};

const SECTION_ORDER: ChallengeKind[] = ['daily', 'scheduled', 'monthly'];

const customKey = (title: string): string => {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX_LENGTH) || 'challenge';
  const rand = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
  return `custom-${slug}-${rand}`;
};

// Bring saved challenges in line with the current rules (fixed days, canonical titles).
// Scheduled challenges with an outdated day count are kept as-is so the user can fix them.
const toFormChallenge = (challenge: UserChallenge): UserChallenge => ({
  ...challenge,
  title: getPreset(challenge.key)?.title ?? challenge.title,
  days: normalizeDays(challenge.key, challenge.days) ?? [...challenge.days],
});

const startingDays = (preset: PresetChallenge, suggestion?: ChallengeSuggestion): number[] => {
  if (preset.kind === 'scheduled' && suggestion && suggestion.days.length === preset.requiredDays) {
    return normalizeDays(preset.key, suggestion.days) ?? initialDays(preset.key);
  }
  return initialDays(preset.key);
};

const submitHint = (challenges: UserChallenge[]): string | null => {
  if (challenges.length < MIN_CHALLENGES) {
    return `Select at least ${MIN_CHALLENGES} challenges (${challenges.length}/${MIN_CHALLENGES})`;
  }
  const invalid = challenges.find((challenge) => normalizeDays(challenge.key, challenge.days) === null);
  return invalid ? `Pick days for ${invalid.title}` : null;
};

export const ChallengePicker = () => {
  const router = useRouter();
  const { profile, loading, error: loadError } = useMyProfile();
  const { saveChallenges, saving, error: saveError } = useSaveChallenges();
  const { publish, publishing, error: publishError } = usePublish();
  const { suggestions, error: suggestionsError } = useChallengeSuggestions(true);

  const form = useForm<UpdateChallengesType>({
    resolver: zodResolver(UpdateChallengesSchema),
    defaultValues: { challenges: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'challenges' });
  const values = useWatch({ control: form.control, name: 'challenges' }) ?? [];

  useEffect(() => {
    if (profile) form.reset({ challenges: profile.challenges.map(toFormChallenge) });
  }, [profile, form]);

  const suggestionByKey = new Map(
    (suggestionsError ? [] : suggestions).map((suggestion) => [suggestion.key, suggestion])
  );
  const published = profile?.published ?? false;
  const full = fields.length >= MAX_CHALLENGES;
  const hint = submitHint(values);
  const customFields = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.custom);

  const indexOfKey = (key: string) => values.findIndex((challenge) => challenge.key === key);

  const setDays = (index: number, days: number[]) => {
    form.setValue(`challenges.${index}.days`, days, { shouldDirty: true });
  };

  const togglePreset = (preset: PresetChallenge) => {
    const index = indexOfKey(preset.key);
    if (index >= 0) {
      remove(index);
      return;
    }
    if (full) return;
    append({
      key: preset.key,
      title: preset.title,
      custom: false,
      days: startingDays(preset, suggestionByKey.get(preset.key)),
    });
  };

  const toggleDay = (index: number, day: number, max?: number) => {
    const days = values[index]?.days ?? [];
    if (days.includes(day)) {
      setDays(index, days.filter((item) => item !== day));
      return;
    }
    if (max !== undefined && days.length >= max) return;
    setDays(index, [...days, day].sort((a, b) => a - b));
  };

  const addCustom = (title: string) => {
    if (full) return;
    append({ key: customKey(title), title: title.trim(), custom: true, days: [...ALL_DAYS] });
  };

  const onSubmit = async (data: UpdateChallengesType) => {
    const saved = await saveChallenges(data);
    if (!saved) return;
    if (saved.published) {
      router.push('/profile');
      return;
    }
    const result = await publish();
    if (result) router.push('/discover');
  };

  if (loading && !profile) {
    return <p className="animate-rise text-sm text-muted-foreground">Loading your challenges…</p>;
  }

  const error = loadError ?? saveError ?? publishError;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-24">
      {SECTION_ORDER.map((kind) => (
        <ChallengeSection key={kind} title={CHALLENGE_KIND_LABELS[kind]} description={SECTION_DESCRIPTIONS[kind]}>
          {CHALLENGES.filter((preset) => preset.kind === kind).map((preset) => {
            const index = indexOfKey(preset.key);
            const suggestion = suggestionByKey.get(preset.key);
            return (
              <ChallengeCard
                key={preset.key}
                title={preset.title}
                hint={preset.hint}
                kind={preset.kind}
                selected={index >= 0}
                days={values[index]?.days ?? []}
                requiredDays={preset.requiredDays}
                suggested={Boolean(suggestion)}
                reason={suggestion?.reason}
                onToggleSelected={() => togglePreset(preset)}
                onToggleDay={(day) => toggleDay(index, day, preset.requiredDays)}
              />
            );
          })}
        </ChallengeSection>
      ))}

      <ChallengeSection title="Custom" description="Your own challenges — pick any days you like.">
        {customFields.map(({ field, index }) => (
          <ChallengeCard
            key={field.id}
            title={field.title}
            kind="custom"
            selected
            days={values[index]?.days ?? []}
            onToggleSelected={() => remove(index)}
            onToggleDay={(day) => toggleDay(index, day)}
            onSelectAllDays={() => setDays(index, [...ALL_DAYS])}
          />
        ))}
        <CustomChallengeInput disabled={full} onAdd={addCustom} />
      </ChallengeSection>

      {full && (
        <p className="text-xs text-muted-foreground">You can pick up to {MAX_CHALLENGES} challenges.</p>
      )}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <PublishBar
        count={values.length}
        hint={hint}
        busy={saving || publishing}
        label={published ? 'Save changes' : 'Publish'}
      />
    </form>
  );
};
