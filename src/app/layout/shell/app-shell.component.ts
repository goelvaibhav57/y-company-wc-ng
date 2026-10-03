import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AppHeaderComponent } from '../header/app-header.component';
import { AppSidebarComponent } from '../sidebar/app-sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [AppHeaderComponent, AppSidebarComponent, MatSidenavModule, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  readonly authService = inject(AuthService);

  readonly isMobile = signal(false);
  readonly mobileNavigationOpen = signal(false);
  readonly currentUserName = computed(() => this.authService.currentUser()?.name ?? 'Alex Morgan');
  readonly currentRoleName = computed(() => {
    const role = this.authService.currentRole();
    return role ? `${role[0]}${role.slice(1).toLowerCase()}` : 'Claims Administrator';
  });

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 767px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ matches }) => {
        this.isMobile.set(matches);
        if (!matches) {
          this.mobileNavigationOpen.set(false);
        }
      });
  }

  toggleNavigation(): void {
    this.mobileNavigationOpen.update((isOpen) => !isOpen);
  }

  closeMobileNavigation(): void {
    if (this.isMobile()) {
      this.mobileNavigationOpen.set(false);
    }
  }
}
