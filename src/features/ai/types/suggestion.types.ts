export type SuggestionSource = 'ai' | 'fallback';

export type ChallengeSuggestion = {
  key: string;
  title: string;
  days: number[];
  reason: string;
};

export type SuggestionsResult = {
  suggestions: ChallengeSuggestion[];
  source: SuggestionSource;
};
