'use client';
import { useState } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: 'Fill in the required fields',
  INVALID_DAYS: 'Pick the right number of days',
  NOT_SHARED: 'Not everyone on the team has this challenge',
  NOT_YOUR_CHALLENGE: "You don't have this challenge",
  NOT_TEAMMATE: 'This belongs to another team',
};

/**
 * Runs one team-board mutation at a time, then reloads the board.
 * `pending` holds the key of the running action so only that button shows busy.
 */
export const useTeamAction = (onDone: () => Promise<void> | void) => {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<unknown>): Promise<boolean> => {
    setPending(key);
    setError(null);
    try {
      await action();
      await onDone();
      return true;
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setError(ERROR_MESSAGES[code] ?? 'Something went wrong. Try again.');
      return false;
    } finally {
      setPending(null);
    }
  };

  return { run, pending, error };
};
