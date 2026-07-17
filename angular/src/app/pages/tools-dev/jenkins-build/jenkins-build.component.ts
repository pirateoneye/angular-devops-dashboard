// jenkins-build.component.ts
// Project-first three-zone layout: project list | parameter form | build history.
// Orchestrates JenkinsService + 3 new services for 100-project workflows.

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ActivityService } from '../../../shared/service/activity.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import {
  JenkinsService,
  JenkinsCrumbExpiredError,
} from '../../../shared/service/jenkins/jenkins.service';
import {
  JenkinsJob,
  JenkinsParamDef,
  JenkinsServer,
  BuildStatus,
  BatchDialogData,
  ParamPreset,
} from '../../../shared/service/jenkins/jenkins.models';
import { ProjectRegistryService } from '../../../shared/service/jenkins/project-registry.service';
import { PresetService } from '../../../shared/service/jenkins/preset.service';
import { BuildHistoryService } from '../../../shared/service/jenkins/build-history.service';
import { ServerDialogComponent } from './server-dialog.component';
import { BatchDialogComponent } from './batch-dialog.component';
import { JenkinsAuthDialogComponent } from './jenkins-auth-dialog.component';
// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------
const LS_SERVERS = 'jenkins-servers';
const LS_ACTIVE = 'jenkins-active-server';
const LS_FAVS_PREFIX = 'jenkins-favs-';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Demo params — updated with real GENERATE parameters from curl command
// ---------------------------------------------------------------------------
const DEMO_PARAMS: Record<string, JenkinsParamDef[]> = {
  GENERATE: [
    { name: 'Branch', type: 'StringParameterDefinition', description: 'Git branch to build from', defaultValue: 'master' },
    { name: 'GIT_TAG', type: 'StringParameterDefinition', description: 'Specific tag to checkout', defaultValue: '123' },
    { name: 'RELEASE_ID', type: 'StringParameterDefinition', defaultValue: '321' },
    { name: 'image', type: 'BooleanParameterDefinition', defaultValue: 'true' },
    { name: 'CONFIG-PILOT', type: 'BooleanParameterDefinition', description: 'HANYA DICENTANG JIKA BRANCH STAGING', defaultValue: 'false' },
    { name: 'CONFIG-PROD', type: 'BooleanParameterDefinition', description: 'HANYA DICENTANG JIKA BRANCH PROD', defaultValue: 'false' },
    { name: 'Dengan ini saya menyatakan bahwa UAT telah dilakukan oleh', type: 'StringParameterDefinition', defaultValue: 'UAT GSIT' },
    { name: 'Tanggal', type: 'StringParameterDefinition', defaultValue: '11-11-1111' },
  ],
};

/** Resolve demo params for GENERATE-svc-* project names back to the GENERATE job. */
function getDemoParams(jobName: string): JenkinsParamDef[] {
  if (DEMO_PARAMS[jobName]) return DEMO_PARAMS[jobName];
  if (jobName.startsWith('GENERATE')) return DEMO_PARAMS['GENERATE'] ?? [];
  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  selector: 'app-jenkins-build',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  templateUrl: './jenkins-build.component.html',
  styleUrls: ['./jenkins-build.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JenkinsBuildComponent {
  private readonly feed = inject(ActivityService);
  readonly jenkins = inject(JenkinsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly projectReg = inject(ProjectRegistryService);
  readonly presetSvc = inject(PresetService);
  readonly historySvc = inject(BuildHistoryService);

  // ---- Persisted state ----
  readonly servers = signal<JenkinsServer[]>(loadJson(LS_SERVERS, []));
  readonly activeServerId = signal<string | null>(loadJson<string | null>(LS_ACTIVE, null));
  readonly favorites = signal<string[]>([]);

  // ---- Job list (for job selector — jobs are canonical list, projects are augmented) ----
  readonly jobs = signal<JenkinsJob[]>([]);
  readonly jobSearch = signal('');
  readonly selectedJob = signal<JenkinsJob | null>(null);

  readonly filteredJobs = computed(() => {
    const q = this.jobSearch().toLowerCase();
    const all = this.jobs();
    const favs = this.favoriteSet();
    const filtered = q ? all.filter((j) => j.name.toLowerCase().includes(q)) : all;
    const pinned: JenkinsJob[] = [];
    const rest: JenkinsJob[] = [];
    for (const j of filtered) {
      (favs.has(j.name) ? pinned : rest).push(j);
    }
    return [...pinned, ...rest];
  });

  readonly favoriteSet = computed(() => new Set(this.favorites()));

  // ---- Derived server ----
  readonly activeServer = computed<JenkinsServer | null>(() => {
    const id = this.activeServerId();
    return this.servers().find((s) => s.id === id) ?? null;
  });

  // ---- Params & build ----
  readonly paramDefs = signal<JenkinsParamDef[]>([]);
  readonly paramValues = signal<Record<string, string | boolean>>({});
  readonly status = signal<BuildStatus>('idle');
  readonly statusMessage = signal('');
  readonly buildResultUrl = signal('');

  // ---- Preset UI ----
  readonly presetName = signal('');
  readonly showPresetSave = signal(false);
  readonly presetsForJob = computed(() => {
    const job = this.selectedJob();
    return job ? this.presetSvc.forJob(job.name) : [];
  });

  // ---- Service signal aliases for strict template checking ----
  readonly projList = computed(() => this.projectReg.projects());
  readonly projFiltered = computed(() => this.projectReg.filteredProjects());
  readonly projGroups = computed(() => this.projectReg.groups());
  readonly projLoading = computed(() => this.projectReg.loading());
  readonly projError = computed(() => this.projectReg.error());
  readonly projSelectedCount = computed(() => this.projectReg.selectedCount());
  readonly projSelectedIds = computed(() => this.projectReg.selectedIds());
  readonly projSearchQ = computed(() => this.projectReg.searchQuery());
  readonly projActiveGroup = computed(() => this.projectReg.activeGroup());
  readonly historyRecords = computed(() => this.historySvc.records());
  readonly historyCollapsed = computed(() => this.historySvc.collapsed());
  readonly presetActiveId = computed(() => this.presetSvc.activePresetId());
  readonly presets = computed(() => this.presetSvc.presets());

  // Forwarded writable signals + methods for strict template access
  setSearchQuery(v: string) { this.projectReg.searchQuery.set(v); }
  setActiveGroup(g: string | null) { this.projectReg.activeGroup.set(g); }
  toggleProject(name: string) { this.projectReg.toggleProject(name); }
  selectAllProjects() { this.projectReg.selectAll(); }
  deselectAllProjects() { this.projectReg.deselectAll(); }
  addGroupTag(name: string, tag: string) { this.projectReg.addGroupTag(name, tag); }
  removeGroupTag(name: string, tag: string) { this.projectReg.removeGroupTag(name, tag); }
  clearHistory() { this.historySvc.clear(); }
  toggleHistory() { this.historySvc.toggle(); }

  // ---- Batch build ----
  readonly batchArmed = signal(false);
  private armTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Smart defaults ----
  readonly smartDefaultProject = signal<string | null>(null);
  readonly smartDefaultTime = signal<number | null>(null);
  constructor() {
    const id = this.activeServerId();
    if (id) this.favorites.set(loadJson<string[]>(LS_FAVS_PREFIX + id, []));

    effect(() => saveJson(LS_SERVERS, this.servers()));
    effect(() => saveJson(LS_ACTIVE, this.activeServerId()));
    effect(() => {
      const id = this.activeServerId();
      if (id) this.favorites.set(loadJson<string[]>(LS_FAVS_PREFIX + id, []));
    });

    if (!this.jenkins.authed()) {
      this.openAuthDialog();
    }
  }

  // ---- Auth ----
  openAuthDialog(): void {
    const ref = this.dialog.open(JenkinsAuthDialogComponent, { width: '400px', disableClose: true });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) {
        // User cancelled auth — stay on page, but they can't build
        return;
      }
      // Auth succeeded; if a server is active, refresh jobs
      const server = this.activeServer();
      if (server) this.loadJobs();
    });
  }

  // ---- Server actions ----
  openServerDialog(): void {
    const ref = this.dialog.open(ServerDialogComponent, {
      width: '560px',
      data: {
        servers: this.servers(),
        activeId: this.activeServerId(),
        jobs: this.jobs(),
      },
    });
    ref.afterClosed().subscribe((result: ServerDialogResult | null) => {
      if (!result) return;
      this.servers.set(result.servers);
      if (result.activeId !== this.activeServerId()) {
        this.activeServerId.set(result.activeId);
        this.resetAll();
      }
      if (result.activeId && result.connected) {
        this.loadJobs();
      }
    });
  }

  selectServer(server: JenkinsServer): void {
    if (server.id === this.activeServerId()) return;
    this.activeServerId.set(server.id);
    this.resetAll();
    this.loadJobs();
  }

  // ---- Jobs ----
  loadJobs(): void {
    const server = this.activeServer();
    if (!server) return;
    if (server.id === 'demo-server') {
      this.status.set('idle');
      return;
    }
    this.status.set('loading-jobs');
    this.jobs.set([]);
    this.projectReg.loadFromServer(server.url).subscribe({
      next: () => {
        this.jobs.set(this.projectReg.projects().map((p) => ({
          name: p.name, url: p.url, color: p.color,
        })));
        this.status.set('idle');
      },
      error: (err: Error) => {
        this.status.set('error');
        this.statusMessage.set(err.message);
      },
    });
  }

  selectJob(job: JenkinsJob): void {
    this.selectedJob.set(job);
    this.paramDefs.set([]);
    this.paramValues.set({});
    this.presetSvc.activePresetId.set(null);
    this.smartDefaultProject.set(null);
    this.smartDefaultTime.set(null);

    // Smart defaults: single project selected with lastParams?
    const selCount = this.projectReg.selectedCount();
    if (selCount === 1) {
      const selName = [...this.projectReg.selectedIds()][0];
      const lastParams = this.projectReg.getLastParams(selName);
      if (lastParams) {
        this.status.set('loading-params');
        this.loadParamsWithSmartDefaults(job, lastParams, selName);
        return;
      }
    }

    // Load most recent preset or fetch from server
    this.status.set('loading-params');
    const recentPresets = this.presetSvc.forJob(job.name);
    if (recentPresets.length > 0) {
      this.applyPreset(recentPresets[0].id);
      return;
    }

    this.fetchParams(job);
  }

  private fetchParams(job: JenkinsJob): void {
    const server = this.activeServer();
    if (!server) return;

    if (server.id === 'demo-server') {
      const defs = getDemoParams(job.name);
      this.applyParams(defs);
      return;
    }

    this.jenkins.fetchJobParams(server.url, job.name).subscribe({
      next: (defs) => this.applyParams(defs),
      error: (err: Error) => {
        this.status.set('error');
        this.statusMessage.set(err.message);
      },
    });
  }

  private loadParamsWithSmartDefaults(
    job: JenkinsJob,
    lastParams: Record<string, string | boolean>,
    projectName: string,
  ): void {
    const server = this.activeServer();
    if (!server) return;

    if (server.id === 'demo-server') {
      const defs = getDemoParams(job.name);
      this.applyParams(defs, lastParams);
      this.smartDefaultProject.set(projectName);
      return;
    }

    this.jenkins.fetchJobParams(server.url, job.name).subscribe({
      next: (defs) => {
        this.applyParams(defs, lastParams);
        this.smartDefaultProject.set(projectName);
      },
      error: (err: Error) => {
        this.status.set('error');
        this.statusMessage.set(err.message);
      },
    });
  }

  // ---- Preset operations ----
  applyPreset(presetId: string): void {
    const preset = this.presetSvc.load(presetId);
    if (!preset) return;

    const defs = this.paramDefs();
    if (defs.length === 0) {
      // Params not loaded yet — fetch then apply
      const job = this.selectedJob();
      if (!job) return;
      const server = this.activeServer();
      if (!server) return;

      if (server.id === 'demo-server') {
        const loaded = getDemoParams(job.name);
        this.paramDefs.set(loaded);
        this.applyCrossJobPreset(preset, loaded);
        this.presetSvc.activePresetId.set(presetId);
        this.status.set('idle');
        return;
      }

      this.jenkins.fetchJobParams(server.url, job.name).subscribe({
        next: (loaded) => {
          this.paramDefs.set(loaded);
          this.applyCrossJobPreset(preset, loaded);
          this.presetSvc.activePresetId.set(presetId);
          this.status.set('idle');
        },
        error: (err: Error) => {
          this.status.set('error');
          this.statusMessage.set(err.message);
        },
      });
    } else {
      this.applyCrossJobPreset(preset, defs);
      this.presetSvc.activePresetId.set(presetId);
    }
  }

  private applyCrossJobPreset(preset: ParamPreset, defs: JenkinsParamDef[]): void {
    const targetNames = new Set(defs.map((d) => d.name));
    const vals: Record<string, string | boolean> = {};
    let matched = 0;
    let total = 0;

    for (const [key, value] of Object.entries(preset.params)) {
      total++;
      if (targetNames.has(key)) {
        vals[key] = value;
        matched++;
      }
    }

    this.paramValues.set(vals);

    if (preset.jobName !== this.selectedJob()?.name && total > 0) {
      const msg = matched === total
        ? `Preset "${preset.name}" applied (${matched} params)`
        : `${matched} of ${total} parameters matched from preset "${preset.name}"`;
      this.snackBar.open(msg, 'Dismiss', { duration: 3000 });
    }
  }

  clearPreset(): void {
    this.presetSvc.activePresetId.set(null);
    const defs = this.paramDefs();
    const vals: Record<string, string | boolean> = {};
    for (const d of defs) {
      if (d.defaultValue !== undefined) {
        if (d.type === 'BooleanParameterDefinition') {
          vals[d.name] = d.defaultValue === 'true';
        } else {
          vals[d.name] = d.defaultValue;
        }
      }
    }
    this.paramValues.set(vals);
  }

  saveCurrentAsPreset(): void {
    const name = this.presetName().trim();
    if (!name) return;
    const job = this.selectedJob();
    if (!job) return;
    this.presetSvc.save(name, job.name, { ...this.paramValues() });
    this.presetName.set('');
    this.showPresetSave.set(false);
    this.snackBar.open(`Preset "${name}" saved`, 'Dismiss', { duration: 3000 });
  }

  // ---- Dynamic form helpers ----
  getParamChoices(def: JenkinsParamDef): string[] {
    return def.choices ?? [];
  }

  getParamValue(defName: string): string | boolean {
    return this.paramValues()[defName] ?? '';
  }

  setTextParam(defName: string, value: string): void {
    this.paramValues.update((v) => ({ ...v, [defName]: value }));
  }

  setCheckParam(defName: string, checked: boolean): void {
    this.paramValues.update((v) => ({ ...v, [defName]: checked }));
  }

  // ---- Favorites ----
  toggleFavorite(job: JenkinsJob): void {
    const name = job.name;
    this.favorites.update((arr) => {
      const idx = arr.indexOf(name);
      if (idx >= 0) return arr.filter((_, i) => i !== idx);
      return [...arr, name];
    });
  }

  // ---- Build flow ----
  readonly buildButtonLabel = computed(() => {
    const count = this.projectReg.selectedCount();
    if (count > 1) return `Build ${count} Project`;
    if (count === 1) return 'Build';
    return 'Build (job saat ini)';
  });

  build(): void {
    const selCount = this.projectReg.selectedCount();
    if (selCount > 1) {
      this.openBatchDialog();
      return;
    }

    // Single build
    const server = this.activeServer();
    const job = this.selectedJob();
    if (!server || !job) return;

    if (server.id === 'demo-server') {
      this.simulateBuild(job.name);
      return;
    }

    this.doRealBuild(server, job, () => {});
  }

  // ---- Batch build ----
  private openBatchDialog(): void {
    const job = this.selectedJob();
    if (!job || !this.activeServer()) return;

    const projectNames = [...this.projectReg.selectedIds()];
    const paramSummary = this.paramDefs().map((d) => ({
      key: d.name,
      value: this.formatParamValue(this.paramValues()[d.name]),
    }));

    const ref = this.dialog.open(BatchDialogComponent, {
      width: '520px',
      data: {
        projectNames,
        jobName: job.name,
        serverLabel: this.activeServer()!.label,
        paramSummary,
      } as BatchDialogData,
      disableClose: false,
    });

    ref.afterOpened().subscribe(() => {
      // Start the batch loop when user clicks "Confirm Build"
      this.runBatchLoop(ref.componentInstance, projectNames, job);
    });
  }

  private runBatchLoop(
    dialog: BatchDialogComponent,
    projectNames: string[],
    job: JenkinsJob,
  ): void {
    const server = this.activeServer();
    if (!server) return;

    let index = 0;

    const processNext = () => {
      if (index >= projectNames.length) return;
      const name = projectNames[index];

      if (server.id === 'demo-server') {
        dialog.pushResult(name, 'queued');
        setTimeout(() => {
          dialog.pushResult(name, 'success');
          this.projectReg.recordBuildParams(name, { ...this.paramValues() });
          this.historySvc.append({
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            serverLabel: server.label,
            projectName: name,
            jobName: job.name,
            presetName: this.presetSvc.activePresetId()
              ? this.presetSvc.load(this.presetSvc.activePresetId()!)?.name
              : undefined,
            params: { ...this.paramValues() },
            status: 'success',
            resultUrl: '#demo-build',
          });
          index++;
          processNext();
        }, 400);
        return;
      }

      // Real Jenkins build
      this.doRealBuild(server, job, () => {
        index++;
        processNext();
      }, name);
    };

    // Wait for running signal
    const check = setInterval(() => {
      if (dialog.running()) {
        clearInterval(check);
        processNext();
      }
    }, 50);
  }

  private doRealBuild(
    server: JenkinsServer,
    job: JenkinsJob,
    onDone: () => void,
    projectName?: string,
  ): void {
    this.status.set('fetching-crumb');
    this.statusMessage.set('');
    this.buildResultUrl.set('');

    this.jenkins.fetchCrumb(server.url).subscribe({
      next: (crumb) => {
        this.status.set('building');
        const defs = this.paramDefs();
        const params = this.paramValues();
        if (defs.length > 0) {
          const sendParams: Record<string, string | boolean> = {};
          for (const d of defs) {
            const v = params[d.name];
            if (d.type === 'BooleanParameterDefinition') {
              if (v === true) sendParams[d.name] = 'on';
            } else if (v !== undefined && v !== null && v !== '') {
              sendParams[d.name] = String(v);
            }
          }
          this.jenkins.triggerBuild(server.url, job.name, crumb.crumb, sendParams).subscribe({
            next: (r) => {
              this.handleBuildSuccess(
                r.headers.get('Location') ?? '',
                projectName || job.name,
                server,
              );
              onDone();
            },
            error: (e) => {
              this.handleBuildError(e, server, job, onDone, projectName);
            },
          });
        } else {
          this.jenkins.triggerBuildNoParams(server.url, job.name, crumb.crumb).subscribe({
            next: (r) => {
              this.handleBuildSuccess(
                r.headers.get('Location') ?? '',
                projectName || job.name,
                server,
              );
              onDone();
            },
            error: (e) => {
              this.handleBuildError(e, server, job, onDone, projectName);
            },
          });
        }
      },
      error: (err: Error) => {
        this.status.set('error');
        this.statusMessage.set(err.message);
        onDone();
      },
    });
  }
  private handleBuildSuccess(location: string, projectName: string, server: JenkinsServer): void {
    this.status.set('success');
    this.statusMessage.set('Build triggered successfully');
    this.buildResultUrl.set(location);
    this.snackBar.open(`Build queued: ${projectName}`, 'Dismiss', { duration: 3000 });
    this.projectReg.recordBuildParams(projectName, { ...this.paramValues() });
    this.historySvc.append({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      serverLabel: server.label,
      projectName,
      jobName: this.selectedJob()?.name ?? '',
      presetName: this.presetSvc.activePresetId()
        ? this.presetSvc.load(this.presetSvc.activePresetId()!)?.name
        : undefined,
      params: { ...this.paramValues() },
      status: 'success',
      resultUrl: location,
    });
    this.feed.log('jenkins', `Build ${projectName} queued`, 'ok');
  }
  private handleBuildError(
    err: unknown,
    server: JenkinsServer,
    job: JenkinsJob,
    onDone: () => void,
    projectName?: string,
  ): void {
    if (err instanceof JenkinsCrumbExpiredError) {
      this.jenkins.fetchCrumb(server.url).subscribe({
        next: (crumb) => {
          this.doRealBuild(server, job, onDone, projectName);
        },
        error: (e: Error) => {
          this.status.set('error');
          this.statusMessage.set(e.message);
          if (projectName) {
            this.historySvc.append({
              id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              serverLabel: server.label,
              projectName,
              jobName: job.name,
              presetName: this.presetSvc.activePresetId()
                ? this.presetSvc.load(this.presetSvc.activePresetId()!)?.name
                : undefined,
              params: { ...this.paramValues() },
              status: 'failed',
              errorMessage: e.message,
            });
          }
          this.feed.log('jenkins', `Build ${projectName || job.name} failed: ${e.message}`, 'err');
          onDone();
        },
      });
      return;
    }
    this.status.set('error');
    const msg = err instanceof Error ? err.message : 'Unknown error';
    this.statusMessage.set(msg);
    if (projectName) {
      this.historySvc.append({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        serverLabel: server.label,
        projectName,
        jobName: job.name,
        params: { ...this.paramValues() },
        status: 'failed',
        errorMessage: msg,
      });
    }
    this.feed.log('jenkins', `Build ${projectName || job.name} failed: ${msg}`, 'err');
    onDone();
  }

  // ---- Helpers ----
  private formatParamValue(v: string | boolean | undefined): string {
    if (v === undefined || v === null || v === '') return '(empty)';
    if (typeof v === 'boolean') return v ? '✓' : '✗';
    return String(v);
  }

  private resetAll(): void {
    this.jobs.set([]);
    this.selectedJob.set(null);
    this.paramDefs.set([]);
    this.paramValues.set({});
    this.status.set('idle');
    this.statusMessage.set('');
    this.buildResultUrl.set('');
    this.projectReg.selectedIds.set(new Set());
    this.projectReg.projects.set([]);
    this.presetSvc.activePresetId.set(null);
  }

  private applyParams(defs: JenkinsParamDef[], override?: Record<string, string | boolean>): void {
    this.paramDefs.set(defs);
    const vals: Record<string, string | boolean> = {};
    for (const d of defs) {
      if (override && override[d.name] !== undefined) {
        vals[d.name] = override[d.name];
      } else if (d.defaultValue !== undefined) {
        if (d.type === 'BooleanParameterDefinition') {
          vals[d.name] = d.defaultValue === 'true';
        } else {
          vals[d.name] = d.defaultValue;
        }
      }
    }
    this.paramValues.set(vals);
    this.status.set('idle');
  }

  jobColorIcon(color: string): string {
    if (color.startsWith('blue')) return 'check_circle';
    if (color.startsWith('red')) return 'error';
    if (color.startsWith('yellow')) return 'warning';
    if (color === 'disabled') return 'block';
    return 'radio_button_unchecked';
  }

  jobColorClass(color: string): string {
    if (color.startsWith('blue')) return 'color-success';
    if (color.startsWith('red')) return 'color-error';
    if (color.startsWith('yellow')) return 'color-warning';
    if (color === 'disabled') return 'color-muted';
    return 'color-muted';
  }

  isLoading(): boolean {
    return this.status() === 'loading-jobs' ||
      this.status() === 'loading-params' ||
      this.status() === 'fetching-crumb' ||
      this.status() === 'building';
  }

  // ---- Group management ----
  getGroupCount(group: string): number {
    return this.projectReg.projects().filter((p) => p.groups.includes(group)).length;
  }

  addGroupToSelected(tag: string): void {
    for (const name of [...this.projectReg.selectedIds()]) {
      this.projectReg.addGroupTag(name, tag);
    }
    this.snackBar.open(`Added tag "${tag}" to ${this.projectReg.selectedCount()} project(s)`, 'Dismiss', { duration: 2000 });
  }

  // ---- Demo mode ----
  private simulateBuild(jobName: string): void {
    const selCount = this.projectReg.selectedCount();
    const names = selCount > 0
      ? [...this.projectReg.selectedIds()]
      : [jobName];

    this.status.set('success');
    this.statusMessage.set('Build triggered (demo)');
    this.buildResultUrl.set('#demo-build');

    for (const n of names) {
      this.projectReg.recordBuildParams(n, { ...this.paramValues() });
      this.historySvc.append({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        serverLabel: this.activeServer()!.label,
        projectName: n,
        jobName,
        params: { ...this.paramValues() },
        status: 'success',
        resultUrl: '#demo-build',
      });
    }
    this.snackBar.open(
      `Demo build queued for ${names.length} project(s)`,
      'Dismiss',
      { duration: 4000 },
    );
  }

  private seedDemoData(): void {
    this.servers.set([{ id: 'demo-server', label: 'Demo Server', url: '' }]);
    this.activeServerId.set('demo-server');

    const demoProjects: JenkinsJob[] = [
      { name: 'GENERATE-svc-alpha', url: '/job/GENERATE-svc-alpha', color: 'blue' },
      { name: 'GENERATE-svc-beta', url: '/job/GENERATE-svc-beta', color: 'blue' },
      { name: 'GENERATE-svc-gamma', url: '/job/GENERATE-svc-gamma', color: 'yellow' },
      { name: 'GENERATE-svc-payment', url: '/job/GENERATE-svc-payment', color: 'blue' },
      { name: 'GENERATE-svc-auth', url: '/job/GENERATE-svc-auth', color: 'red' },
      { name: 'GENERATE-svc-notif', url: '/job/GENERATE-svc-notif', color: 'blue' },
      { name: 'GENERATE-svc-report', url: '/job/GENERATE-svc-report', color: 'notbuilt' },
      { name: 'GENERATE-svc-cache', url: '/job/GENERATE-svc-cache', color: 'blue' },
      { name: 'GENERATE-svc-search', url: '/job/GENERATE-svc-search', color: 'yellow' },
      { name: 'GENERATE-svc-audit', url: '/job/GENERATE-svc-audit', color: 'notbuilt' },
      { name: 'GENERATE-svc-ingest', url: '/job/GENERATE-svc-ingest', color: 'blue' },
      { name: 'GENERATE-svc-gateway', url: '/job/GENERATE-svc-gateway', color: 'red' },
    ];

    const groups: Record<string, string[]> = {};
    for (const name of ['GENERATE-svc-alpha', 'GENERATE-svc-beta', 'GENERATE-svc-gamma', 'GENERATE-svc-payment']) {
      groups[name] = (groups[name] || []).concat('team-alpha');
    }
    for (const name of ['GENERATE-svc-notif', 'GENERATE-svc-report', 'GENERATE-svc-cache', 'GENERATE-svc-search']) {
      groups[name] = (groups[name] || []).concat('team-beta');
    }
    for (const name of ['GENERATE-svc-payment', 'GENERATE-svc-auth', 'GENERATE-svc-gateway']) {
      groups[name] = (groups[name] || []).concat('critical');
    }

    this.jobs.set(demoProjects);
    this.projectReg.seedProjects(demoProjects, groups);
    this.favorites.set(['GENERATE-svc-payment', 'GENERATE-svc-auth', 'GENERATE-svc-gateway']);
  }

  logout(): void {
    this.jenkins.logout();
    this.openAuthDialog();
  }
}

// ---------------------------------------------------------------------------
// Server dialog result interface
// ---------------------------------------------------------------------------
export interface ServerDialogResult {
  servers: JenkinsServer[];
  activeId: string | null;
  connected?: boolean;
}
