'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { SuggestionsPanel } from '@/features/ai/components/suggestions-panel';
import { ChallengeSuggestion } from '@/features/ai/types/suggestion.types';
import { ChallengeCard } from '@/features/profile/components/challenge-card';
import { CustomChallengeInput } from '@/features/profile/components/custom-challenge-input';
import { PublishBar } from '@/features/profile/components/publish-bar';
import { useMyProfile } from '@/features/profile/hooks/use-my-profile';
import { usePublish } from '@/features/profile/hooks/use-publish';
import { useSaveChallenges } from '@/features/profile/hooks/use-save-challenges';
import {
  UpdateChallengesSchema,
  UpdateChallengesType,
} from '@/features/profile/validations/profile.validation';
import { Button } from '@/shared/components/ui/button';
import { ALL_DAYS, CHALLENGES, MAX_CHALLENGES } from '@/shared/const/challenge.const';

const SLUG_MAX_LENGTH = 40;

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

export const ChallengePicker = () => {
  const router = useRouter();
  const { profile, loading, error: loadError } = useMyProfile();
  const { saveChallenges, saving, error: saveError } = useSaveChallenges();
  const { publish, publishing, error: publishError } = usePublish();
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean | null>(null);

  const form = useForm<UpdateChallengesType>({
    resolver: zodResolver(UpdateChallengesSchema),
    defaultValues: { challenges: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'challenges' });
  const values = useWatch({ control: form.control, name: 'challenges' }) ?? [];

  useEffect(() => {
    if (profile) form.reset({ challenges: profile.challenges });
  }, [profile, form]);

  const published = profile?.published ?? false;
  const full = fields.length >= MAX_CHALLENGES;
  const canSubmit = values.length > 0 && values.every((challenge) => challenge.days.length > 0);
  const customFields = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.custom);

  const indexOfKey = (key: string) => values.findIndex((challenge) => challenge.key === key);

  const togglePreset = (key: string, title: string) => {
    const index = indexOfKey(key);
    if (index >= 0) {
      remove(index);
      return;
    }
    if (!full) append({ key, title, custom: false, days: [...ALL_DAYS] });
  };

  const toggleDay = (index: number, day: number) => {
    const days = values[index]?.days ?? [];
    const next = days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort((a, b) => a - b);
    form.setValue(`challenges.${index}.days`, next, { shouldDirty: true });
  };

  const applySuggestions = (suggestions: ChallengeSuggestion[]) => {
    let count = values.length;
    for (const suggestion of suggestions) {
      const preset = CHALLENGES.find((item) => item.key === suggestion.key);
      if (!preset) continue;
      const days = [...suggestion.days];
      const index = indexOfKey(preset.key);
      if (index >= 0) {
        form.setValue(`challenges.${index}.days`, days, { shouldDirty: true });
        continue;
      }
      if (count >= MAX_CHALLENGES) break;
      append({ key: preset.key, title: preset.title, custom: false, days });
      count += 1;
    }
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
  const showSuggestions = suggestionsOpen ?? (profile?.challenges.length ?? 0) === 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pb-24">
      {showSuggestions ? (
        <SuggestionsPanel
          selectedKeys={values.map((challenge) => challenge.key)}
          onApply={applySuggestions}
          onClose={() => setSuggestionsOpen(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setSuggestionsOpen(true)}
          className="w-full rounded-full border-primary/40 font-semibold text-primary active:scale-95"
        >
          ✨ Suggest for me
        </Button>
      )}

      {CHALLENGES.map((preset) => {
        const index = indexOfKey(preset.key);
        return (
          <ChallengeCard
            key={preset.key}
            title={preset.title}
            hint={preset.hint}
            selected={index >= 0}
            days={values[index]?.days ?? []}
            onToggleSelected={() => togglePreset(preset.key, preset.title)}
            onToggleDay={(day) => toggleDay(index, day)}
          />
        );
      })}

      {customFields.map(({ field, index }) => (
        <ChallengeCard
          key={field.id}
          title={field.title}
          selected
          custom
          days={values[index]?.days ?? []}
          onToggleSelected={() => remove(index)}
          onToggleDay={(day) => toggleDay(index, day)}
        />
      ))}

      <CustomChallengeInput disabled={full} onAdd={addCustom} />

      {full && (
        <p className="text-xs text-muted-foreground">You can pick up to {MAX_CHALLENGES} challenges.</p>
      )}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <PublishBar
        count={values.length}
        disabled={!canSubmit}
        busy={saving || publishing}
        label={published ? 'Save changes' : 'Publish'}
      />
    </form>
  );
};
