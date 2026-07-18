import { Component, Input, signal, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'omp-copy-btn',
  imports: [MatIconModule],
  template: `
    <button class="copy-btn" (click)="doCopy()" [attr.aria-label]="'Copy ' + value">
      @if (copied()) {
        <mat-icon>check</mat-icon>
      } @else {
        <mat-icon>content_copy</mat-icon>
      }
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .copy-btn { background: none; border: none; cursor: pointer; color: var(--msv-text-muted); padding: 2px; font-size: 14px; }
    .copy-btn:hover { color: var(--msv-text); }
    .copy-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class CopyBtnComponent implements OnDestroy {
  @Input({ required: true }) value!: string;
  readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  doCopy(): void {
    navigator.clipboard.writeText(this.value).then(() => {
      this.copied.set(true);
      clearTimeout(this.timer ?? undefined);
      this.timer = setTimeout(() => {
        this.copied.set(false);
        this.timer = null;
      }, 1500);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer ?? undefined);
  }
}
