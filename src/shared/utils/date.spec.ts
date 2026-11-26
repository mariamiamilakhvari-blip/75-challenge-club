import { describe, expect, it } from 'vitest';

import { addDays, diffDays, todayInTimezone, weekdayIndex } from '@/shared/utils/date';

describe('date utils', () => {
  it('formats today in a timezone', () => {
    const now = new Date('2026-11-27T23:30:00Z');
    expect(todayInTimezone('UTC', now)).toBe('2026-11-27');
    expect(todayInTimezone('Asia/Tbilisi', now)).toBe('2026-11-28');
  });

  it('falls back to UTC for invalid timezone', () => {
    const now = new Date('2026-11-27T10:00:00Z');
    expect(todayInTimezone('Not/AZone', now)).toBe('2026-11-27');
  });

  it('adds and diffs days across months', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-11-01', '2026-11-27')).toBe(26);
  });

  it('maps weekday with Monday = 0', () => {
    expect(weekdayIndex('2026-11-23')).toBe(0);
    expect(weekdayIndex('2026-11-29')).toBe(6);
  });
});
