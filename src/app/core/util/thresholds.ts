/** Business rules for the colored progress bars, kept pure so they're easy to test. */

export type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface Threshold {
  label: string;
  tone: Tone;
}

/** Budget used, as a percent of budgeted hours. */
export function budgetState(percent: number): Threshold {
  if (percent > 100) return { label: 'Over budget', tone: 'error' };
  if (percent === 100) return { label: 'At budget', tone: 'warning' };
  if (percent >= 75) return { label: 'Approaching', tone: 'warning' };
  return { label: '', tone: 'info' };
}

/** Monthly utilization: below 70% available, 70–90% healthy, above 90% high. */
export function utilizationState(percent: number): Threshold {
  if (percent > 90) return { label: 'High utilization', tone: 'error' };
  if (percent >= 70) return { label: 'Healthy utilization', tone: 'info' };
  return { label: 'Available', tone: 'success' };
}

export function percentOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
