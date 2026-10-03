import { FormControl, FormGroup } from '@angular/forms';
import { repairDateRangeValidator } from './workshop.validators';

describe('repairDateRangeValidator', () => {
  it('rejects estimated or actual completion dates before repair start', () => {
    const form = new FormGroup({
      repairStartDate: new FormControl('2026-10-02'),
      estimatedCompletionDate: new FormControl('2026-10-01'),
      actualCompletionDate: new FormControl('2026-09-30')
    }, { validators: repairDateRangeValidator });

    expect(form.errors).toEqual({
      estimatedCompletionBeforeStart: true,
      actualCompletionBeforeStart: true
    });
  });

  it('accepts completion dates on or after repair start', () => {
    const form = new FormGroup({
      repairStartDate: new FormControl('2026-10-02'),
      estimatedCompletionDate: new FormControl('2026-10-02'),
      actualCompletionDate: new FormControl('2026-10-03')
    }, { validators: repairDateRangeValidator });

    expect(form.errors).toBeNull();
  });
});
