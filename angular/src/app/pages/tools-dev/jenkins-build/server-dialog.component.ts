// server-dialog.component.ts
// Modal for managing Jenkins server profiles.

import { Component, Inject, inject } from '@angular/core';
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
  template: `
    <h2 mat-dialog-title>Jenkins Servers</h2>
    <mat-dialog-content>
      <!-- Server list -->
      @if (servers.length > 0) {
        <div class="server-cards">
          @for (s of servers; track s.id) {
            <div class="server-card" [class.active]="s.id === activeId">
              <div class="server-card-header">
                <div class="server-card-info">
                  <strong>{{ s.label }}</strong>
                  <span class="server-url">{{ s.url }}</span>
                  @if (jobCounts[s.id] !== undefined) {
                    <span class="job-badge">{{ jobCounts[s.id] }} jobs loaded</span>
                  } @else {
                    <span class="job-badge muted">Not connected</span>
                  }
                </div>
                <div class="server-card-actions">
                  <button mat-icon-button
                    matTooltip="Test connection"
                    [disabled]="testingId === s.id"
                    (click)="testServer(s)">
                    <mat-icon>{{ testingId === s.id ? 'hourglass_empty' : 'wifi' }}</mat-icon>
                  </button>
                  @if (s.id !== activeId) {
                    <button mat-icon-button color="primary"
                      matTooltip="Set as active"
                      (click)="setActive(s)">
                      <mat-icon>radio_button_unchecked</mat-icon>
                    </button>
                  } @else {
                    <mat-icon class="active-star" matTooltip="Active">radio_button_checked</mat-icon>
                  }
                  <button mat-icon-button color="warn"
                    matTooltip="Delete server"
                    (click)="deleteServer(s)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Default job selector -->
              <div class="server-card-body">
                <mat-form-field appearance="outline" class="full-width compact">
                  <mat-label>Default Job</mat-label>
                  <mat-select
                    [value]="defaultJobs[s.id] || null"
                    (selectionChange)="setDefaultJob(s.id, $event.value)">
                    <mat-option [value]="null">None</mat-option>
                    @for (j of data.jobs; track j.name) {
                      <mat-option [value]="j.name">{{ j.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Test result per server -->
              @if (testResults[s.id]) {
                <p class="test-result" [class.test-error]="!testResults[s.id].ok">
                  {{ testResults[s.id].ok ? 'Connected successfully' : '✗ ' + testResults[s.id].message }}
                </p>
              }
            </div>
          }
        </div>
      } @else {
        <p class="empty-hint">No servers configured. Add your first Jenkins server below.</p>
      }

      <mat-divider class="dialog-divider"></mat-divider>

      <!-- Add new server form -->
      <h3 class="section-label">Add Server</h3>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Label</mat-label>
        <input matInput [(ngModel)]="newLabel" placeholder="Production Jenkins" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>URL</mat-label>
        <input matInput [(ngModel)]="newUrl" placeholder="https://jenkins.example.com" />
      </mat-form-field>

      <button mat-stroked-button color="primary" (click)="addServer()"
        [disabled]="!newLabel || !newUrl || loading">
        <mat-icon>add</mat-icon> Add Server
      </button>

      @if (loading) {
        <mat-progress-spinner diameter="20" mode="indeterminate" class="inline-spinner"></mat-progress-spinner>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .server-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .server-card {
        border: 1px solid var(--msv-border);
        border-radius: var(--msv-radius-md);
        padding: 12px;
        transition: border-color var(--msv-transition-fast), background var(--msv-transition-fast);
      }
      .server-card.active {
        border-color: var(--msv-primary);
        background: var(--msv-accent-bg);
      }
      .server-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .server-card-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .server-url {
        font-size: 0.75rem;
        color: var(--msv-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .job-badge {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 8px;
        border-radius: var(--msv-radius-pill);
        background: var(--msv-success-bg);
        color: var(--msv-success);
        font-size: 0.7rem;
        font-weight: 500;
        width: fit-content;
      }
      .job-badge.muted {
        background: var(--msv-border);
        color: var(--msv-text-muted);
      }
      .server-card-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
      }
      .server-card-body {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--msv-border);
      }
      .active-star {
        color: var(--msv-primary);
      }
      .empty-hint {
        color: var(--msv-text-muted);
        font-style: italic;
      }
      .dialog-divider {
        margin: 16px 0;
      }
      .section-label {
        margin-bottom: 12px;
      }
      .full-width {
        width: 100%;
      }
      .full-width.compact {
        margin-bottom: 0;
      }
      .test-result {
        margin-top: 8px;
        font-size: 0.85rem;
      }
      .test-error {
        color: var(--msv-error);
      }
      .inline-spinner {
        display: inline-block;
        margin-left: 8px;
        vertical-align: middle;
      }
    `,
  ],
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
    localStorage.setItem('jenkins-default-jobs', JSON.stringify(this.defaultJobs));
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
    localStorage.setItem('jenkins-default-jobs', JSON.stringify(this.defaultJobs));
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
