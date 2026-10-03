import { Directive, effect, EmbeddedViewRef, inject, Input, TemplateRef, ViewContainerRef, signal } from '@angular/core';
import { Permission } from '../../core/auth/auth.models';
import { PermissionService } from '../../core/auth/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private readonly requiredPermissions = signal<readonly Permission[]>([]);
  private embeddedView: EmbeddedViewRef<unknown> | null = null;

  @Input()
  set appHasPermission(value: Permission | readonly Permission[]) {
    this.requiredPermissions.set(typeof value === 'string' ? [value] : value);
  }

  constructor() {
    effect(() => {
      const permissions = this.requiredPermissions();
      const allowed = permissions.length > 0 && this.permissionService.hasAnyPermission(permissions);

      if (allowed && !this.embeddedView) {
        this.embeddedView = this.viewContainer.createEmbeddedView(this.templateRef);
      } else if (!allowed && this.embeddedView) {
        this.viewContainer.clear();
        this.embeddedView = null;
      }
    });
  }
}
