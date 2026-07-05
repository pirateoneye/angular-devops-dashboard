import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardService } from '../../service/clipboard/clipboard.service';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      class="copy-btn"
      [class.copied]="isCopied()"
      (click)="onCopy()"
      [attr.aria-label]="isCopied() ? 'Copied' : 'Copy ' + (label || '')"
    >
      <mat-icon>{{ isCopied() ? 'check' : 'content_copy' }}</mat-icon>
      <span>{{ isCopied() ? 'Copied' : label || 'Copy' }}</span>
    </button>
  `,
  styles: [
    `
      .copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: 1px solid var(--msv-border);
        border-radius: var(--msv-radius-sm);
        color: var(--msv-text-muted);
        cursor: pointer;
        font:
          12px 'Open Sans',
          sans-serif;
        padding: 4px 8px;
        transition: all 0.15s ease;
      }
      .copy-btn:hover {
        color: var(--msv-primary);
        border-color: var(--msv-primary);
      }
      .copy-btn.copied {
        color: var(--msv-success);
        border-color: var(--msv-success);
      }
      .copy-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .copy-btn:focus-visible {
        outline: 2px solid var(--msv-primary);
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .copy-btn {
          transition: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  @Input() text = '';
  @Input() label = 'Copy';
  private clipboard = inject(ClipboardService);

  // Track local copied state (auto-resets via ClipboardService signal)
  private lastText = '';
  get isCopied(): boolean {
    return this.clipboard.lastCopied() === this.text;
  }

  async onCopy(): Promise<void> {
    await this.clipboard.copy(this.text);
  }
}
