import {Component, Input, output, ChangeDetectionStrategy} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'omp-error-state',
  imports: [MatIconModule],
  template: `
    <div class="err" role="alert" aria-live="polite">
      <mat-icon>error_outline</mat-icon>
      <span>{{ message }}</span>
      @if (retryLabel) {
        <button class="link-btn" (click)="retry.emit()">{{ retryLabel }}</button>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .err { padding: 8px 14px; display: flex; align-items: center; gap: 8px; color: var(--msv-error); font-size: 13px; background: var(--msv-surface-1); border: 1px solid var(--msv-error); border-radius: 8px; }
    .link-btn { background: none; border: none; color: var(--msv-primary); font-size: 12px; cursor: pointer; padding: 0; }
    .link-btn:hover { text-decoration: underline; }
  `],
})
export class ErrorStateComponent {
  @Input({ required: true }) message!: string;
  @Input() retryLabel = '';
  readonly retry = output<void>();
}
