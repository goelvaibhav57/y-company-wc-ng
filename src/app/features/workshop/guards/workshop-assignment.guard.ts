import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { ClaimService } from '../../claims/services/claim.service';

export const workshopAssignmentGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const claimService = inject(ClaimService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  const claimId = route.paramMap.get('id');

  if (user?.role === Role.Workshop && claimId && claimService.canProcessWorkshopClaim(claimId, user)) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};
