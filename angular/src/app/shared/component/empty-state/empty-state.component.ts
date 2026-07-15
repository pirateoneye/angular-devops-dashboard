import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'omp-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty" role="status" aria-live="polite">
      @if (icon) {
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      }
      <p>{{ message }}</p>
      @if (actionLabel && actionFn) {
        <button class="link-btn" (click)="actionFn()">{{ actionLabel }}</button>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .empty { padding: 80px 16px; text-align: center; color: var(--msv-text-dim); font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; opacity: .3; }
    .link-btn { background: none; border: none; color: var(--msv-primary); font-size: 13px; cursor: pointer; padding: 4px 12px; }
    .link-btn:hover { text-decoration: underline; }
  `],
})
export class EmptyStateComponent {
  @Input() message = 'Tidak ada data.';
  @Input() icon = '';
  @Input() actionLabel = '';
  @Input() actionFn: (() => void) | null = null;
}
