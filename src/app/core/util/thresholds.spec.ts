import { budgetState, percentOf, utilizationState } from './thresholds';

describe('budgetState', () => {
  it.each([
    [45, '', 'info'],
    [75, 'Approaching', 'warning'],
    [99, 'Approaching', 'warning'],
    [100, 'At budget', 'warning'],
    [105, 'Over budget', 'error'],
  ])('%i%% → "%s" (%s)', (pct, label, tone) => {
    expect(budgetState(pct)).toEqual({ label, tone });
  });
});

describe('utilizationState', () => {
  it.each([
    [62, 'Available', 'success'],
    [70, 'Healthy utilization', 'info'],
    [90, 'Healthy utilization', 'info'],
    [94, 'High utilization', 'error'],
  ])('%i%% → "%s" (%s)', (pct, label, tone) => {
    expect(utilizationState(pct)).toEqual({ label, tone });
  });
});

describe('percentOf', () => {
  it('rounds to a whole percent', () => {
    expect(percentOf(187.2, 240)).toBe(78);
  });

  it('returns 0 when the whole is 0 instead of dividing by zero', () => {
    expect(percentOf(10, 0)).toBe(0);
  });
});
