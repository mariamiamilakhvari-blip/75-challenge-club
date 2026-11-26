'use client';
import { useCallback, useEffect, useState } from 'react';

import { SuggestionsResult } from '@/features/ai/types/suggestion.types';
import { http } from '@/shared/lib/http';

export const useChallengeSuggestions = (enabled: boolean) => {
  const [result, setResult] = useState<SuggestionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await http.get<SuggestionsResult>('/ai/suggestions');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !result && !loading && !error) void load();
  }, [enabled, result, loading, error, load]);

  return {
    suggestions: result?.suggestions ?? [],
    source: result?.source ?? null,
    loading,
    error,
    reload: load,
  };
};
