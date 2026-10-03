import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Role } from '../../core/auth/auth.models';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly visibleForRoles?: readonly Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSidebarComponent {
  @Input() currentRole: Role | null = null;
  @Output() readonly navigationSelected = new EventEmitter<void>();

  readonly navigationItems: readonly NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'space_dashboard' },
    { label: 'My Claims', route: '/claims', icon: 'description', visibleForRoles: [Role.Customer] },
    { label: 'Assigned Claims', route: '/claims', icon: 'fact_check', visibleForRoles: [Role.Surveyor] },
    { label: 'Claims for Review', route: '/claims', icon: 'rate_review', visibleForRoles: [Role.Adjuster] },
    { label: 'Assigned Repairs', route: '/claims', icon: 'handyman', visibleForRoles: [Role.Workshop] },
    { label: 'Create Claim', route: '/claims/create', icon: 'add_box', visibleForRoles: [Role.Customer] }
  ];

  isVisible(item: NavigationItem): boolean {
    return !item.visibleForRoles || (this.currentRole !== null && item.visibleForRoles.includes(this.currentRole));
  }
}
