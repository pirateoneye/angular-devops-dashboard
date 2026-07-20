// server-dialog.component.ts
// Modal for managing Jenkins server profiles.

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { JenkinsServer, JenkinsJob } from '../../../shared/service/jenkins/jenkins.models';

interface DialogData {
  servers: JenkinsServer[];
  activeId: string | null;
  jobs: JenkinsJob[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-server-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatDialogModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './server-dialog.component.html',
  styleUrls: ['./server-dialog.component.css'],
})
export class ServerDialogComponent {
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ServerDialogComponent>>(MatDialogRef);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  servers: JenkinsServer[];
  activeId: string | null;
  newLabel = '';
  newUrl = '';
  loading = false;
  testingId: string | null = null;

  /** Per-server test results */
  testResults: Record<string, { ok: boolean; message?: string }> = {};
  /** Per-server job counts (from last test) */
  jobCounts: Record<string, number | undefined> = {};
  /** Per-server default job name */
  defaultJobs: Record<string, string | null> = {};

  constructor() {
    this.servers = this.data.servers.map((s) => ({ ...s }));
    this.activeId = this.data.activeId;

    // Load persisted default jobs
    try {
      const raw = localStorage.getItem('jenkins-default-jobs');
      if (raw) this.defaultJobs = JSON.parse(raw);
    } catch { /* ignore */ }
  }

  setActive(server: JenkinsServer): void {
    this.activeId = server.id;
    if (this.jobCounts[server.id] === undefined) {
      this.testServer(server);
    }
  }

  setDefaultJob(serverId: string, jobName: string | null): void {
    this.defaultJobs[serverId] = jobName;
    try {
      localStorage.setItem('jenkins-default-jobs', JSON.stringify(this.defaultJobs));
    } catch {
      /* ignore quota / private mode */
    }
  }

  testServer(server: JenkinsServer): void {
    this.testingId = server.id;
    this.http
      .get(`${server.url}/api/json?tree=jobs[name,url,color,displayName,_class]`, { responseType: 'text' })
      .subscribe({
        next: (raw: string) => {
          try {
            const parsed = JSON.parse(raw);
            const jobs = parsed.jobs ?? [];
            const count = Array.isArray(jobs) ? jobs.filter((j: { _class?: string }) => !j._class?.includes('Folder')).length : 0;
            this.jobCounts[server.id] = count;
            this.testResults[server.id] = { ok: true };
          } catch {
            this.jobCounts[server.id] = undefined;
            this.testResults[server.id] = { ok: false, message: 'Invalid JSON response' };
          }
          this.testingId = null;
        },
        error: (err: { status: number }) => {
          this.jobCounts[server.id] = undefined;
          this.testResults[server.id] = {
            ok: false,
            message: err.status === 0
              ? 'Cannot reach server — check URL'
              : `HTTP ${err.status}`,
          };
          this.testingId = null;
        },
      });
  }

  addServer(): void {
    const url = this.newUrl.trim().replace(/\/+$/, '');
    const label = this.newLabel.trim();
    if (!label || !url) return;
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      this.snackBar.open('URL must start with http:// or https://', 'Dismiss', { duration: 3000 });
      return;
    }

    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.servers = [...this.servers, { id, label, url }];
    this.activeId = id;
    this.newLabel = '';
    this.newUrl = '';
    this.testServer({ id, label, url });
  }

  deleteServer(server: JenkinsServer): void {
    this.servers = this.servers.filter((s) => s.id !== server.id);
    delete this.testResults[server.id];
    delete this.jobCounts[server.id];
    delete this.defaultJobs[server.id];
    try {
      localStorage.setItem('jenkins-default-jobs', JSON.stringify(this.defaultJobs));
    } catch {
      /* ignore quota / private mode */
    }
    if (this.activeId === server.id) {
      this.activeId = this.servers.length > 0 ? this.servers[0].id : null;
    }
  }

  close(): void {
    const connected = this.activeId
      ? this.testResults[this.activeId]?.ok ?? false
      : false;
    this.ref.close({
      servers: this.servers,
      activeId: this.activeId,
      connected,
    });
  }
}
