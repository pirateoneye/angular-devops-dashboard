import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService, ExecConfig, PreviewResult, ExecResult } from '../../../../shared/service/gitlab/gitlab.service';
import { GitlabActivityService } from '../gitlab-activity.service';
type ActionId = 'tag' | 'merge';
type Step = number;

@Component({
  standalone: true,
  selector: 'gl-bulk',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './bulk.component.html',
  styleUrls: ['./bulk.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkComponent {
  readonly svc = inject(GitLabService);
  readonly activity = inject(GitlabActivityService);

  readonly preselectedIds = input<number[]>([]);
  readonly action = signal<ActionId | null>(null);
  readonly step = signal<Step>(1);

  // --- tag fields ---
  readonly tagName = signal('');
  readonly tagRef = signal('main');
  readonly tagMsg = signal('');

  // --- MR fields ---
  readonly mrSource = signal('');
  readonly mrTarget = signal('main');
  readonly mrTitle = signal('');
  readonly mrRemoveSource = signal(false);
  readonly mrSquash = signal(false);

  /** Two-click arm for execute safety. */
  readonly executeArmed = signal(false);
  private armTimer: ReturnType<typeof setTimeout> | null = null;

  // --- project selection (writable map keyed by project id) ---
  readonly selectedSet = signal<Map<number, boolean>>(new Map());

  // Sync preselectedIds into selectedSet when input changes
  constructor() {
    effect(() => {
      const ids = this.preselectedIds();
      const map = new Map<number, boolean>();
      for (const id of ids) map.set(id, true);
      this.selectedSet.set(map);
    });
  }

  readonly projectList = computed(() =>
    this.svc.projects().map((p) => ({
      id: p.id,
      name: p.name,
      namespace: p.path_with_namespace,
    })),
  );

  readonly searchFilter = signal('');

  readonly filteredProjects = computed(() => {
    const q = this.searchFilter().toLowerCase();
    const sel = this.selectedSet();
    const list = this.projectList();
    if (!q) return list.map((p) => ({ ...p, selected: sel.get(p.id) ?? false }));
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.namespace.toLowerCase().includes(q),
      )
      .map((p) => ({ ...p, selected: sel.get(p.id) ?? false }));
  });

  readonly selectedCount = computed(() => {
    let n = 0;
    this.selectedSet().forEach((v) => {
      if (v) n++;
    });
    return n;
  });

  readonly selectedIds = computed(() => {
    const ids: number[] = [];
    this.selectedSet().forEach((v, k) => {
      if (v) ids.push(k);
    });
    return ids;
  });

  // --- preview / execute state ---
  readonly previewing = signal(false);
  readonly executing = signal(false);
  readonly previewResults = signal<PreviewResult[]>([]);
  readonly execResults = signal<ExecResult[]>([]);

  readonly readyCount = computed(
    () => this.previewResults().filter((r) => r.ok).length,
  );
  readonly issueCount = computed(
    () => this.previewResults().filter((r) => !r.ok).length,
  );

  // --- actions ---

  selectAction(a: ActionId): void {
    this.action.set(a);
    this.step.set(1);
    this.previewResults.set([]);
    this.execResults.set([]);
    if (a === 'merge') {
      this.tagName.set('');
      this.tagMsg.set('');
    } else {
      this.mrSource.set('');
      this.mrTitle.set('');
    }
  }

  backToActions(): void {
    this.action.set(null);
    this.step.set(1);
    this.previewResults.set([]);
    this.execResults.set([]);
  }

  nextStep(): void {
    this.step.update((s) => Math.min(s + 1, this.maxStep()));
  }

  prevStep(): void {
    this.step.update((s) => Math.max(s - 1, 1));
    if (this.step() < this.maxStep()) {
      this.previewResults.set([]);
    }
  }

  maxStep(): number {
    return 3;
  }

  toggleProject(id: number): void {
    const map = new Map(this.selectedSet());
    map.set(id, !(map.get(id) ?? false));
    this.selectedSet.set(map);
  }

  toggleAll(select: boolean): void {
    const map = new Map(this.selectedSet());
    const q = this.searchFilter().toLowerCase();
    for (const p of this.projectList()) {
      if (!q || p.name.toLowerCase().includes(q) || p.namespace.toLowerCase().includes(q)) {
        map.set(p.id, select);
      }
    }
    this.selectedSet.set(map);
  }

  // --- preview ---

  async preview(): Promise<void> {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.previewing.set(true);
    this.execResults.set([]);
    const actionLabel = this.action();
    const projectCount = ids.length;
    this.activity.append(`Preview ${actionLabel} on ${projectCount} project(s)`, 'info');
    try {
      const cfg = this.buildConfig();
      const results = await this.svc.preview(actionLabel!, ids, cfg);
      this.previewResults.set(results);
      this.activity.append(`Preview ${actionLabel} complete — ${results.length} result(s)`, 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.activity.append(`Preview ${actionLabel} failed: ${msg}`, 'err');
    } finally {
      this.previewing.set(false);
    }
  }

  // --- execute ---

  /** Arm the execute button — must be clicked again within 5s to proceed. */
  armExecute(): void {
    if (this.executeArmed()) {
      this.executeArmed.set(false);
      if (this.armTimer) { clearTimeout(this.armTimer); this.armTimer = null; }
      this.execute();
      return;
    }
    this.executeArmed.set(true);
    if (this.armTimer) clearTimeout(this.armTimer);
    this.armTimer = setTimeout(() => {
      this.executeArmed.set(false);
      this.armTimer = null;
    }, 5000);
  }

  async execute(): Promise<void> {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.executing.set(true);
    const actionLabel = this.action();
    const projectCount = ids.length;
    this.activity.append(`Executing ${actionLabel} on ${projectCount} project(s)`, 'info');
    try {
      const cfg = this.buildConfig();
      const results = await this.svc.execute(actionLabel!, ids, cfg);
      this.execResults.set(results);
      const ok = results.filter((r) => !r.error).length;
      const errs = results.filter((r) => r.error).length;
      this.activity.append(`Execute ${actionLabel} finished — ${ok} ok${errs > 0 ? `, ${errs} error(s)` : ''}`, errs > 0 ? 'warn' : 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.activity.append(`Execute ${actionLabel} failed: ${msg}`, 'err');
    } finally {
      this.executing.set(false);
    }
  }

  private buildConfig(): ExecConfig {
    if (this.action() === 'tag') {
      return {
        tagName: this.tagName(),
        tagMsg: this.tagMsg(),
        ref: this.tagRef(),
      };
    }
    return {
      mrMode: 'single',
      source: this.mrSource(),
      target: this.mrTarget(),
      title: this.mrTitle(),
    };
  }

  canPreview(): boolean {
    if (this.action() === 'tag' && !this.tagName().trim()) return false;
    if (this.action() === 'merge' && (!this.mrSource().trim() || !this.mrTitle().trim())) return false;
    return this.selectedIds().length > 0;
  }

  canExecute(): boolean {
    return this.previewResults().length > 0 && this.previewResults().every((r) => r.ok);
  }
}
