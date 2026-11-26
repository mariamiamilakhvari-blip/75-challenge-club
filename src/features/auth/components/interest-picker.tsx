'use client';
import { Plus, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { INTERESTS, MAX_INTERESTS } from '@/shared/const/interests.const';
import { cn } from '@/shared/lib/utils';

type InterestPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

const MAX_INTEREST_LENGTH = 30;

export const InterestPicker = ({ value, onChange }: InterestPickerProps) => {
  const [draft, setDraft] = useState('');
  const full = value.length >= MAX_INTERESTS;
  const customInterests = value.filter((interest) => !INTERESTS.includes(interest));

  const toggle = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter((item) => item !== interest));
      return;
    }
    if (!full) onChange([...value, interest]);
  };

  const addDraft = () => {
    const interest = draft.trim().slice(0, MAX_INTEREST_LENGTH);
    if (!interest || full) return;
    const exists = value.some((item) => item.toLowerCase() === interest.toLowerCase());
    if (!exists) onChange([...value, interest]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addDraft();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[...INTERESTS, ...customInterests].map((interest) => {
          const selected = value.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={selected}
              disabled={!selected && full}
              onClick={() => toggle(interest)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-40',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              )}
            >
              {interest}
              {selected && !INTERESTS.includes(interest) && <X className="size-3.5" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MAX_INTEREST_LENGTH}
          placeholder="Add your own"
          disabled={full}
          className="h-11 rounded-full px-4"
          aria-label="Add your own interest"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={addDraft}
          disabled={full || !draft.trim()}
          className="size-11 rounded-full"
          aria-label="Add interest"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_INTERESTS} picked
      </p>
    </div>
  );
};
