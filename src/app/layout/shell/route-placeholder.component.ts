import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-route-placeholder',
  standalone: true,
  imports: [MatCardModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="pageTitle()" [subtitle]="pageSubtitle()"></app-page-header>
    <mat-card class="placeholder-card">
      <mat-card-content>
        <p>{{ pageTitle() }} will be implemented in a later feature step.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .placeholder-card { color: #68778d; }
    mat-card-content { padding: 4px 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly pageTitle = toSignal(
    this.route.data.pipe(map((data) => data['title'] as string)),
    { initialValue: 'Workspace' }
  );

  readonly pageSubtitle = toSignal(
    this.route.data.pipe(map((data) => data['subtitle'] as string | undefined)),
    { initialValue: undefined }
  );
}
