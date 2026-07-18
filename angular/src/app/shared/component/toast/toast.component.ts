import {Component, Input, output, ChangeDetectionStrategy} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'omp-toast',
  imports: [MatIconModule],
  template: `
    <div class="toast-wrp" [class]="type" role="button" tabindex="0"
      [attr.aria-label]="'Dismiss: ' + message"
      (click)="dismiss.emit()"
      (keydown.enter)="dismiss.emit()">
      <span class="toast-ico">{{ type === 'ok' ? '\u2713' : type === 'err' ? '\u2715' : '\u2139' }}</span>
      {{ message }}
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .toast-wrp { padding: 8px 14px; border-radius: 8px; font-size: 13px; border-left: 3px solid; background: var(--msv-surface-1); cursor: pointer; animation: omp-slidein .2s ease; display: flex; align-items: center; gap: 6px; max-width: 340px; }
    .toast-wrp.ok   { border-left-color: var(--msv-success); }
    .toast-wrp.err  { border-left-color: var(--msv-error); }
    .toast-wrp.info { border-left-color: var(--msv-primary); }
    .toast-ico { font-weight: 700; }
    .toast-wrp.ok .toast-ico   { color: var(--msv-success); }
    .toast-wrp.err .toast-ico  { color: var(--msv-error); }
    @keyframes omp-slidein { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
  `],
})
export class ToastComponent {
  @Input({ required: true }) message!: string;
  @Input() type: 'ok' | 'err' | 'info' = 'info';
  readonly dismiss = output<void>();
}
