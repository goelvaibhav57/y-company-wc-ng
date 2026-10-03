import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/auth.models';
import { ClaimService } from '../../claims/services/claim.service';

export const surveyAssignmentGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const claimService = inject(ClaimService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  const claimId = route.paramMap.get('id');

  if (user?.role === Role.Surveyor && claimId && claimService.isSurveyorAssigned(claimId, user)) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};
