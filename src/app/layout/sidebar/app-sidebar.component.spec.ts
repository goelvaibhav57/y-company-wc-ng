import { Role } from '../../core/auth/auth.models';
import { AppSidebarComponent } from './app-sidebar.component';

describe('AppSidebarComponent', () => {
  let component: AppSidebarComponent;

  beforeEach(() => {
    component = new AppSidebarComponent();
  });

  it('shows only the workspace links available to each authenticated role', () => {
    const labelsFor = (role: Role): string[] => {
      component.currentRole = role;
      return component.navigationItems.filter((item) => component.isVisible(item)).map((item) => item.label);
    };

    expect(labelsFor(Role.Customer)).toEqual(['Dashboard', 'My Claims', 'Create Claim']);
    expect(labelsFor(Role.Surveyor)).toEqual(['Dashboard', 'Assigned Claims']);
    expect(labelsFor(Role.Adjuster)).toEqual(['Dashboard', 'Claims for Review']);
    expect(labelsFor(Role.Workshop)).toEqual(['Dashboard', 'Assigned Repairs']);
  });

  it('fails closed for role-specific navigation while no role is available', () => {
    component.currentRole = null;
    expect(component.navigationItems.filter((item) => component.isVisible(item)).map((item) => item.label))
      .toEqual(['Dashboard']);
  });
});
