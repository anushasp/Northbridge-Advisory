/** Helpers for the date-only strings ('2026-10-30') used throughout the API. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses 'YYYY-MM-DD' as a local date (new Date('2026-10-30') would be UTC). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole days from a to b (negative when b is earlier). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfToday(b).getTime() - startOfToday(a).getTime()) / DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
