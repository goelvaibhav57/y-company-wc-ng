import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const repairDateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDate = String(control.get('repairStartDate')?.value ?? '');
  const estimatedDate = String(control.get('estimatedCompletionDate')?.value ?? '');
  const actualDate = String(control.get('actualCompletionDate')?.value ?? '');
  const errors: ValidationErrors = {};

  if (isValidDate(startDate) && isValidDate(estimatedDate) && estimatedDate < startDate) {
    errors['estimatedCompletionBeforeStart'] = true;
  }
  if (isValidDate(startDate) && isValidDate(actualDate) && actualDate < startDate) {
    errors['actualCompletionBeforeStart'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const [, yearValue, monthValue, dayValue] = match;
  const date = new Date(Number(yearValue), Number(monthValue) - 1, Number(dayValue));
  return date.getFullYear() === Number(yearValue)
    && date.getMonth() === Number(monthValue) - 1
    && date.getDate() === Number(dayValue);
}
