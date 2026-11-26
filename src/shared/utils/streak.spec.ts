import { describe, expect, it } from 'vitest';

import { dayNumber, displayDay, evaluateStreak, scheduledKeysFor } from '@/shared/utils/streak';

const everyDay = [{ key: 'water', days: [0, 1, 2, 3, 4, 5, 6] }];

describe('streak', () => {
  it('lists scheduled keys for a date', () => {
    const challenges = [
      { key: 'water', days: [0, 1, 2, 3, 4, 5, 6] },
      { key: 'workout', days: [0, 2] },
    ];
    expect(scheduledKeysFor(challenges, '2026-11-23')).toEqual(['water', 'workout']);
    expect(scheduledKeysFor(challenges, '2026-11-24')).toEqual(['water']);
  });

  it('keeps streak when all scheduled days done', () => {
    const doneByDate = new Map([
      ['2026-11-25', new Set(['water'])],
      ['2026-11-26', new Set(['water'])],
    ]);
    const result = evaluateStreak({
      streakStart: '2026-11-25',
      lastEvaluated: '',
      today: '2026-11-27',
      challenges: everyDay,
      doneByDate,
    });
    expect(result).toEqual({ streakStart: '2026-11-25', lastEvaluated: '2026-11-26' });
  });

  it('resets to day after the last miss', () => {
    const doneByDate = new Map([['2026-11-24', new Set(['water'])]]);
    const result = evaluateStreak({
      streakStart: '2026-11-20',
      lastEvaluated: '2026-11-23',
      today: '2026-11-27',
      challenges: everyDay,
      doneByDate,
    });
    expect(result.streakStart).toBe('2026-11-27');
    expect(result.lastEvaluated).toBe('2026-11-26');
  });

  it('ignores unscheduled days', () => {
    const result = evaluateStreak({
      streakStart: '2026-11-24',
      lastEvaluated: '',
      today: '2026-11-27',
      challenges: [{ key: 'workout', days: [0] }],
      doneByDate: new Map(),
    });
    expect(result.streakStart).toBe('2026-11-24');
  });

  it('does not re-check already evaluated days', () => {
    const result = evaluateStreak({
      streakStart: '2026-11-20',
      lastEvaluated: '2026-11-26',
      today: '2026-11-27',
      challenges: everyDay,
      doneByDate: new Map(),
    });
    expect(result.streakStart).toBe('2026-11-20');
  });

  it('computes day numbers and caps display at 75', () => {
    expect(dayNumber('2026-11-27', '2026-11-27')).toBe(1);
    expect(dayNumber('2026-11-01', '2026-11-27')).toBe(27);
    expect(displayDay('2026-01-01', '2026-11-27')).toBe(75);
  });
});
