import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group-level validator: the end date must be on or after the start date.
 * Sets the error on the group so both fields stay individually valid.
 */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as string | undefined;
    const end = group.get(endKey)?.value as string | undefined;
    if (!start || !end) return null;
    return end >= start ? null : { dateRange: true };
  };
}

/** Group-level validator: two fields must match (e.g. new + confirm password). */
export function matchValidator(key: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(key)?.value;
    const b = group.get(confirmKey)?.value;
    if (!a || !b) return null;
    return a === b ? null : { mismatch: true };
  };
}
