// batch-dialog.component.ts
// Modal: confirm batch builds with two-click arm + sequential progress.

import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BatchDialogData } from '../../../shared/service/jenkins/jenkins.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-batch-dialog',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatDialogModule],
  templateUrl: './batch-dialog.component.html',
  styleUrls: ['./batch-dialog.component.css'],
})
export class BatchDialogComponent {
  readonly data = inject<BatchDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<BatchDialogComponent>>(MatDialogRef);

  readonly armed = signal(false);
  readonly running = signal(false);
  readonly total = signal(this.data.projectNames.length);
  readonly doneCount = signal(0);
  readonly progressPct = signal(0);

  private armTimer: number | null = null;

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
    this.armTimer = window.setTimeout(() => this.armed.set(false), 5000);
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
