import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  notFutureDateValidator,
  phoneNumberValidator,
  policyDateRangeValidator,
  validIsoDateValidator
} from './claim-form.validators';

describe('claim form validators', () => {
  it('accepts valid phone numbers and rejects invalid formats or digit counts', () => {
    expect(phoneNumberValidator(new FormControl('+1 (555) 123-4567'))).toBeNull();
    expect(phoneNumberValidator(new FormControl('55512'))).toEqual({ phoneNumber: true });
    expect(phoneNumberValidator(new FormControl('phone-1234567'))).toEqual({ phoneNumber: true });
  });

  it('validates real ISO calendar dates, including leap years', () => {
    expect(validIsoDateValidator(new FormControl('2024-02-29'))).toBeNull();
    expect(validIsoDateValidator(new FormControl('2025-02-29'))).toEqual({ invalidDate: true });
    expect(validIsoDateValidator(new FormControl('2025/02/28'))).toEqual({ invalidDate: true });
  });

  it('rejects future incident dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const value = [futureDate.getFullYear(), String(futureDate.getMonth() + 1).padStart(2, '0'), String(futureDate.getDate()).padStart(2, '0')].join('-');

    expect(notFutureDateValidator(new FormControl(value))).toEqual({ futureDate: true });
    expect(notFutureDateValidator(new FormControl('2020-01-01'))).toBeNull();
    expect(notFutureDateValidator(new FormControl('not-a-date'))).toBeNull();
  });

  it('validates policy coverage ordering and incident coverage', () => {
    const form = new FormGroup({
      policy: new FormGroup({
        startDate: new FormControl('2026-01-01', Validators.required),
        endDate: new FormControl('2025-12-31', Validators.required)
      }),
      incident: new FormGroup({
        date: new FormControl('2026-02-01', Validators.required)
      })
    }, { validators: policyDateRangeValidator });

    expect(form.errors).toEqual({ policyDateRange: true, incidentOutsidePolicy: true });

    form.controls.policy.controls.endDate.setValue('2026-12-31');
    expect(form.errors).toBeNull();

    form.controls.incident.controls.date.setValue('2027-01-01');
    expect(form.errors).toEqual({ incidentOutsidePolicy: true });
  });
});
