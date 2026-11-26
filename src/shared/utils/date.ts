const MS_PER_DAY = 86_400_000;

export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(time).toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

// 0 = Monday ... 6 = Sunday
export function weekdayIndex(date: string): number {
  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (jsDay + 6) % 7;
}
