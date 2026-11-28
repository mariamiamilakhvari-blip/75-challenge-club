export type PlanFieldName = 'place' | 'when' | 'activity' | 'book' | 'author' | 'note';

export type PlanField = {
  name: PlanFieldName;
  label: string;
  placeholder: string;
  required?: boolean;
};

export type PlanPrompt = {
  question: string;
  fields: PlanField[];
  // teammates can tap "I'm in" on these plans
  joinable: boolean;
};

export const PLAN_FIELD_NAMES: PlanFieldName[] = ['place', 'when', 'activity', 'book', 'author', 'note'];

export const MAX_PLAN_FIELD_LENGTH = 80;

export const MAX_PLAN_NOTE_LENGTH = 140;

export const MAX_REPLY_LENGTH = 140;

// plans older than this drop out of the team board
export const PLAN_FEED_DAYS = 7;

const NOTE_FIELD: PlanField = { name: 'note', label: 'Note', placeholder: 'Anything teammates should know' };

export const PLAN_PROMPTS: Record<string, PlanPrompt> = {
  social: {
    question: 'Where are you planning to go?',
    joinable: true,
    fields: [
      { name: 'place', label: 'Place', placeholder: 'Café, cinema, hike, dinner…', required: true },
      { name: 'when', label: 'Day / time', placeholder: 'Sat 19:00' },
      NOTE_FIELD,
    ],
  },
  workout: {
    question: 'Where and what are you training?',
    joinable: true,
    fields: [
      { name: 'place', label: 'Place', placeholder: 'Gym, park, studio…', required: true },
      { name: 'activity', label: 'Workout', placeholder: 'Yoga, running, pilates…', required: true },
      { name: 'when', label: 'Day / time', placeholder: 'Mon 08:00' },
      NOTE_FIELD,
    ],
  },
  read: {
    question: 'What are you reading?',
    joinable: false,
    fields: [
      { name: 'book', label: 'Book title', placeholder: 'The Midnight Library', required: true },
      { name: 'author', label: 'Author (optional)', placeholder: 'Matt Haig' },
      NOTE_FIELD,
    ],
  },
};

export const DEFAULT_PLAN_PROMPT: PlanPrompt = {
  question: 'Share a note with your team',
  joinable: false,
  fields: [{ ...NOTE_FIELD, required: true }],
};
