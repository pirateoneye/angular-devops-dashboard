// batch-dialog.component.ts
// Modal: confirm batch builds with two-click arm + sequential progress.

import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BatchDialogData } from '../../../shared/service/jenkins/jenkins.models';

@Component({
  standalone: true,
  selector: 'app-batch-dialog',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Batch Build — {{ data.jobName }}</h2>
    <mat-dialog-content>
      <p>
        Triggering <strong>{{ data.projectNames.length }} project(s)</strong> on
        <em>{{ data.serverLabel }}</em>
      </p>

      <!-- Parameter summary -->
      @if (data.paramSummary.length) {
        <div class="param-summary">
          <h4>Parameters</h4>
          <div class="param-grid">
            @for (p of data.paramSummary; track p.key) {
              <span class="param-key">{{ p.key }}</span>
              <span class="param-val">{{ p.value }}</span>
            }
          </div>
        </div>
      }

      <!-- Build progress (post-arm) -->
      @if (running()) {
        <div class="progress-section">
          <mat-progress-bar
            mode="determinate"
            [value]="progressPct()"
            class="batch-progress">
          </mat-progress-bar>
          <p class="progress-label">{{ doneCount() }} / {{ total() }} complete</p>

          <div class="result-list">
            @for (r of results(); track r.name) {
              <div class="result-row" [class.result-error]="r.status === 'failed'">
                <mat-icon class="result-icon">
                  {{ r.status === 'success' ? 'check_circle' : r.status === 'failed' ? 'error' : 'hourglass_empty' }}
                </mat-icon>
                <span class="result-name">{{ r.name }}</span>
                @if (r.status === 'failed') {
                  <button mat-button color="warn" class="retry-btn" (click)="retry(r.name)">
                    <mat-icon>refresh</mat-icon> Retry
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!running()) {
        @if (!armed()) {
          <button mat-raised-button color="primary" (click)="arm()">
            <mat-icon>rocket_launch</mat-icon> Jalankan?
          </button>
        } @else {
          <button mat-raised-button color="warn" (click)="execute()">
            <mat-icon>warning</mat-icon> Confirm Build
          </button>
        }
      }
      <button mat-button mat-dialog-close [disabled]="running()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .param-summary { margin: 12px 0; }
      .param-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 12px;
        font-size: 0.85rem;
      }
      .param-key { color: var(--msv-text-muted); }
      .param-val { font-weight: 500; }
      .progress-section { margin-top: 16px; }
      .batch-progress { margin-bottom: 8px; }
      .progress-label { font-size: 0.85rem; color: var(--msv-text-muted); text-align: center; }
      .result-list { margin-top: 12px; max-height: 220px; overflow-y: auto; }
      .result-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid var(--msv-border);
      }
      .result-error { background: var(--msv-error-bg); border-radius: var(--msv-radius-sm); padding: 6px 8px; }
      .result-icon { font-size: 18px; width: 18px; height: 18px; }
      .result-name { flex: 1; font-size: 0.85rem; }
      .retry-btn { font-size: 0.8rem; line-height: 28px; min-width: 60px; }
    `,
  ],
})
export class BatchDialogComponent {
  readonly data = inject<BatchDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<BatchDialogComponent>>(MatDialogRef);

  readonly armed = signal(false);
  readonly running = signal(false);
  readonly total = signal(this.data.projectNames.length);
  readonly doneCount = signal(0);
  readonly progressPct = signal(0);

  private armTimer: ReturnType<typeof setTimeout> | null = null;

  protected results = signal<
    Array<{ name: string; status: 'queued' | 'success' | 'failed'; errorMessage?: string }>
  >([]);

  /** Called by parent component to push a build result. */
  pushResult(name: string, status: 'queued' | 'success' | 'failed', errorMessage?: string): void {
    this.results.update((arr) => {
      const idx = arr.findIndex((r) => r.name === name);
      if (idx >= 0) {
        const copy = [...arr];
        copy[idx] = { name, status, errorMessage };
        return copy;
      }
      return [...arr, { name, status, errorMessage }];
    });
    const done = this.results().filter((r) => r.status !== 'queued').length;
    this.doneCount.set(done);
    this.progressPct.set((done / this.total()) * 100);
  }

  arm(): void {
    this.armed.set(true);
    this.armTimer = setTimeout(() => this.armed.set(false), 5000);
  }

  execute(): void {
    if (this.armTimer) { clearTimeout(this.armTimer); this.armTimer = null; }
    this.armed.set(false);
    this.running.set(true);
    this.results.set(
      this.data.projectNames.map((n) => ({ name: n, status: 'queued' })),
    );
    // Parent calls runBatch() after detecting running toggle
  }

  retry(name: string): void {
    this.results.update((arr) =>
      arr.map((r) => (r.name === name ? { name: r.name, status: 'queued' } : r)),
    );
    const done = this.results().filter((r) => r.status !== 'queued').length;
    this.doneCount.set(done);
    this.progressPct.set((done / this.total()) * 100);
  }

  close(): void {
    this.ref.close();
  }
}
