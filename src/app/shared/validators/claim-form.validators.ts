import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const phoneNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, '');
  return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
    ? null
    : { phoneNumber: true };
};

export const validIsoDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value || isValidIsoDate(value)) {
    return null;
  }

  return { invalidDate: true };
};

export const notFutureDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value || !isValidIsoDate(value)) {
    return null;
  }

  const today = new Date();
  const todayIso = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  return value <= todayIso ? null : { futureDate: true };
};

export const policyDateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const policy = control.get('policy');
  const incident = control.get('incident');
  if (!policy || !incident) {
    return null;
  }

  const startDate = String(policy.get('startDate')?.value ?? '');
  const endDate = String(policy.get('endDate')?.value ?? '');
  const incidentDate = String(incident.get('date')?.value ?? '');
  const dateErrors: ValidationErrors = {};

  if (isValidIsoDate(startDate) && isValidIsoDate(endDate) && startDate > endDate) {
    dateErrors['policyDateRange'] = true;
  }

  if (isValidIsoDate(startDate) && isValidIsoDate(endDate) && isValidIsoDate(incidentDate)
    && (incidentDate < startDate || incidentDate > endDate)) {
    dateErrors['incidentOutsidePolicy'] = true;
  }

  return Object.keys(dateErrors).length > 0 ? dateErrors : null;
};

function isValidIsoDate(value: string): boolean {
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
