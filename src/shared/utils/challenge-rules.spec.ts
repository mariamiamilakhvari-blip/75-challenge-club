import { describe, expect, it } from 'vitest';

import { challengeKind, exceptionNoun, initialDays, isMonthly, normalizeDays } from '@/shared/utils/challenge-rules';

describe('challenge rules', () => {
  it('classifies kinds', () => {
    expect(challengeKind('water')).toBe('daily');
    expect(challengeKind('workout')).toBe('scheduled');
    expect(challengeKind('no-junk')).toBe('monthly');
    expect(challengeKind('custom-guitar-ab12')).toBe('custom');
    expect(isMonthly('no-alcohol')).toBe(true);
    expect(isMonthly('read')).toBe(false);
  });

  it('forces daily and monthly to all 7 days', () => {
    expect(normalizeDays('water', [1])).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(normalizeDays('no-junk', [])).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('enforces exact count for scheduled', () => {
    expect(normalizeDays('workout', [4, 0, 2, 5])).toEqual([0, 2, 4, 5]);
    expect(normalizeDays('workout', [0, 2, 4])).toBeNull();
    expect(normalizeDays('sleep', [0, 1, 2, 3, 4])).toEqual([0, 1, 2, 3, 4]);
    expect(normalizeDays('sleep', [0, 1, 2, 3, 4, 5])).toBeNull();
    expect(normalizeDays('social', [6])).toEqual([6]);
    expect(normalizeDays('social', [5, 6])).toBeNull();
    expect(normalizeDays('skill', [1, 1, 2, 3])).toBeNull();
  });

  it('requires at least one day for custom', () => {
    expect(normalizeDays('custom-x', [3, 3])).toEqual([3]);
    expect(normalizeDays('custom-x', [])).toBeNull();
  });

  it('names monthly exceptions', () => {
    expect(exceptionNoun('no-junk')).toBe('cheat');
    expect(exceptionNoun('no-alcohol')).toBe('drink');
  });

  it('provides initial days', () => {
    expect(initialDays('workout')).toHaveLength(4);
    expect(initialDays('social')).toHaveLength(1);
    expect(initialDays('water')).toHaveLength(7);
    expect(initialDays('custom-x')).toHaveLength(7);
  });
});
