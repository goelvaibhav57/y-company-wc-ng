import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission, Role } from './auth.models';

const ROLE_PERMISSIONS: Readonly<Record<Role, ReadonlySet<Permission>>> = {
  [Role.Customer]: new Set([Permission.ClaimRead, Permission.ClaimCreate, Permission.ClaimUpdate]),
  [Role.Surveyor]: new Set([Permission.ClaimRead, Permission.ClaimSurvey]),
  [Role.Adjuster]: new Set([
    Permission.ClaimRead,
    Permission.ClaimReview,
    Permission.ClaimApprove,
    Permission.ClaimReject
  ]),
  [Role.Workshop]: new Set([Permission.ClaimRead, Permission.ClaimWorkshopUpdate])
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private readonly authService: AuthService) {}

  hasPermission(permission: Permission): boolean {
    const role = this.authService.getCurrentRole();
    return role !== null && ROLE_PERMISSIONS[role].has(permission);
  }

  hasAnyPermission(permissions: readonly Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: readonly Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  hasRole(role: Role): boolean {
    return this.authService.getCurrentRole() === role;
  }
}
