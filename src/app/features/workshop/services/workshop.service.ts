import { Injectable } from '@angular/core';
import { Observable, defer, map, of, switchMap, throwError } from 'rxjs';
import { Permission, Role, User } from '../../../core/auth/auth.models';
import { PermissionService } from '../../../core/auth/permission.service';
import { Claim, ClaimStatus } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { RepairStatus, WorkshopRepair, WorkshopRepairResult } from '../models/workshop-repair.model';

const PROCESSABLE_CLAIM_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.Approved,
  ClaimStatus.WorkshopAssigned,
  ClaimStatus.RepairInProgress
];

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly repairs = new Map<string, WorkshopRepair>();

  constructor(
    private readonly claimService: ClaimService,
    private readonly permissionService: PermissionService
  ) {}

  getRepairForClaim(claimId: string, user: User): Observable<{ readonly claim: Claim; readonly repair: WorkshopRepair }> {
    if (!this.canAccess(user, claimId)) {
      return throwError(() => new Error('You are not assigned to process this repair.'));
    }

    return this.claimService.getClaimById(claimId, user).pipe(
      switchMap((claim) => {
        if (!claim) {
          return throwError(() => new Error('The claim could not be found.'));
        }
        if (!this.isEligibleStatus(claim.status)) {
          return throwError(() => new Error('This claim is not eligible for workshop processing.'));
        }
        return of({ claim, repair: this.repairs.get(claimId) ?? this.createInitialRepair(claim) });
      })
    );
  }

  saveRepair(repair: WorkshopRepair, user: User): Observable<WorkshopRepairResult> {
    return defer(() => {
      if (!this.canAccess(user, repair.claimId)) {
        return throwError(() => new Error('You are not assigned to process this repair.'));
      }
      if (repair.repairEstimate < 0) {
        return throwError(() => new Error('Repair estimate cannot be negative.'));
      }
      if (repair.repairStatus === RepairStatus.Completed && !repair.actualCompletionDate) {
        return throwError(() => new Error('Actual completion date is required to complete repairs.'));
      }
      if (repair.repairStartDate && repair.estimatedCompletionDate
        && repair.estimatedCompletionDate < repair.repairStartDate) {
        return throwError(() => new Error('Estimated completion cannot be before the repair start date.'));
      }
      if (repair.repairStartDate && repair.actualCompletionDate
        && repair.actualCompletionDate < repair.repairStartDate) {
        return throwError(() => new Error('Actual completion cannot be before the repair start date.'));
      }

      return this.claimService.getClaimById(repair.claimId, user).pipe(
        switchMap((claim) => {
          if (!claim) {
            return throwError(() => new Error('The claim could not be found.'));
          }
          if (!this.isEligibleStatus(claim.status)) {
            return throwError(() => new Error('This claim is no longer eligible for workshop processing.'));
          }
          if (claim.status === ClaimStatus.RepairInProgress && repair.repairStatus === RepairStatus.Assigned) {
            return throwError(() => new Error('Repair status cannot be moved back to Assigned.'));
          }

          const claimStatus = this.toClaimStatus(repair.repairStatus);
          const action = repair.repairStatus === RepairStatus.Completed
            ? 'Repair completed'
            : repair.repairStatus === RepairStatus.InProgress
              ? 'Repair started'
              : 'Workshop repair updated';
          const remarks = repair.workshopRemarks.trim() || `Repair status updated to ${repair.repairStatus.replace('_', ' ')}.`;

          return this.claimService.updateClaimStatus(
            repair.claimId,
            claimStatus,
            user.name,
            action,
            remarks
          ).pipe(
            switchMap((updatedClaim) => {
              if (!updatedClaim) {
                return throwError(() => new Error('The claim could not be updated.'));
              }
              this.repairs.set(repair.claimId, repair);
              return of({ repair, claimStatus: updatedClaim.status });
            })
          );
        })
      );
    });
  }

  isEligibleStatus(status: ClaimStatus): boolean {
    return PROCESSABLE_CLAIM_STATUSES.includes(status);
  }

  private canAccess(user: User, claimId: string): boolean {
    return user.role === Role.Workshop
      && this.permissionService.hasPermission(Permission.ClaimWorkshopUpdate)
      && this.claimService.canProcessWorkshopClaim(claimId, user);
  }

  private createInitialRepair(claim: Claim): WorkshopRepair {
    return {
      id: `repair-${claim.id}`,
      claimId: claim.id,
      repairStartDate: '',
      estimatedCompletionDate: '',
      actualCompletionDate: '',
      repairStatus: claim.status === ClaimStatus.Approved ? RepairStatus.Assigned
        : claim.status === ClaimStatus.RepairInProgress ? RepairStatus.InProgress : RepairStatus.Assigned,
      repairEstimate: claim.claimAmount,
      workshopRemarks: ''
    };
  }

  private toClaimStatus(status: RepairStatus): ClaimStatus {
    switch (status) {
      case RepairStatus.Assigned: return ClaimStatus.WorkshopAssigned;
      case RepairStatus.InProgress: return ClaimStatus.RepairInProgress;
      case RepairStatus.Completed: return ClaimStatus.RepairCompleted;
    }
  }
}
