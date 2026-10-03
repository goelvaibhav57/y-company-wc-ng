import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly visibleForRoles?: readonly string[];
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
  @Input() currentRole: string | null = null;
  @Output() readonly navigationSelected = new EventEmitter<void>();

  readonly navigationItems: readonly NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'space_dashboard' },
    { label: 'Claims', route: '/claims', icon: 'description' },
    { label: 'Create Claim', route: '/claims/create', icon: 'add_box' }
  ];

  isVisible(item: NavigationItem): boolean {
    return !item.visibleForRoles || !this.currentRole || item.visibleForRoles.includes(this.currentRole);
  }
}
