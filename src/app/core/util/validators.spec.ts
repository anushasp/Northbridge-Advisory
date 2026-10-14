import { FormControl, FormGroup } from '@angular/forms';
import { dateRangeValidator, matchValidator } from './validators';

describe('dateRangeValidator', () => {
  const form = (start: string, end: string) =>
    new FormGroup(
      { start: new FormControl(start), end: new FormControl(end) },
      { validators: dateRangeValidator('start', 'end') },
    );

  it('passes when the end is after the start', () => {
    expect(form('2026-10-01', '2026-10-30').valid).toBe(true);
  });

  it('passes when both dates are the same day', () => {
    expect(form('2026-10-01', '2026-10-01').valid).toBe(true);
  });

  it('fails when the end is before the start', () => {
    expect(form('2026-10-30', '2026-10-01').hasError('dateRange')).toBe(true);
  });

  it('ignores the rule until both dates are filled in', () => {
    expect(form('2026-10-30', '').valid).toBe(true);
  });
});

describe('matchValidator', () => {
  const form = (a: string, b: string) =>
    new FormGroup(
      { password: new FormControl(a), confirm: new FormControl(b) },
      { validators: matchValidator('password', 'confirm') },
    );

  it('passes when the values match', () => {
    expect(form('Secret123!', 'Secret123!').valid).toBe(true);
  });

  it('fails when they differ', () => {
    expect(form('Secret123!', 'Secret124!').hasError('mismatch')).toBe(true);
  });
});
