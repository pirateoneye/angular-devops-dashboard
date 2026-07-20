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
import { GitLabService, ExecConfig, PreviewResult, ExecResult, GitlabAction } from '../../../../shared/service/gitlab/gitlab.service';
import { GitlabActivityService } from '../gitlab-activity.service';
type Step = number;

interface ActionDef {
  id: GitlabAction;
  name: string;
  icon: string;
  desc: string;
  danger?: boolean;
}

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
  readonly action = signal<GitlabAction | null>(null);
  readonly step = signal<Step>(1);

  /** Catalog of every available bulk action. */
  readonly ACTIONS: ActionDef[] = [
    { id: 'tag', name: 'Bulk Tag', icon: 'label', desc: 'Create a tag on selected projects.' },
    { id: 'branch', name: 'Create Branch', icon: 'call_split', desc: 'Create a branch on selected projects.' },
    { id: 'delete-branch', name: 'Delete Branch', icon: 'delete', desc: 'Delete a branch across projects.', danger: true },
    { id: 'merge', name: 'Bulk Merge Request', icon: 'merge', desc: 'Open MRs across selected projects.' },
    { id: 'protect', name: 'Protect Branch', icon: 'shield', desc: 'Protect a branch across projects.' },
    { id: 'unprotect', name: 'Unprotect Branch', icon: 'shield_off', desc: 'Remove branch protection.', danger: true },
    { id: 'pipeline', name: 'Trigger Pipeline', icon: 'play_arrow', desc: 'Trigger CI/CD pipeline on selected projects.' },
    { id: 'release', name: 'Create Release', icon: 'new_releases', desc: 'Create a release across projects.' },
    { id: 'close-mr', name: 'Close / Merge MR', icon: 'check', desc: 'Close or merge an open MR across projects.' },
    { id: 'update-labels', name: 'Update MR Labels', icon: 'style', desc: 'Add/remove labels on an MR across projects.' },
  ];

  // --- tag fields ---
  readonly tagName = signal('');
  readonly tagRef = signal('main');
  readonly tagMsg = signal('');

  // --- branch fields ---
  readonly branchName = signal('');
  readonly branchRef = signal('main');

  // --- delete-branch fields ---
  readonly deleteBranchName = signal('');

  // --- MR fields ---
  readonly mrSource = signal('');
  readonly mrTarget = signal('main');
  readonly mrTitle = signal('');

  // --- protect/unprotect fields ---
  readonly protectName = signal('main');
  readonly mergeAccessLevel = signal(40);
  readonly pushAccessLevel = signal(40);
  readonly allowForcePush = signal(false);

  // --- pipeline fields ---
  readonly pipelineRef = signal('main');
  readonly pipelineVars = signal('');

  // --- release fields ---
  readonly releaseName = signal('');
  readonly releaseDesc = signal('');
  readonly releaseRef = signal('main');

  // --- close-mr / update-labels fields ---
  readonly mrIid = signal(0);
  readonly mrAction = signal<'merge' | 'close'>('close');
  readonly labelAction = signal<'add' | 'remove'>('add');
  readonly labelList = signal('');

  /** Two-click arm for execute safety. */
  readonly executeArmed = signal(false);
  private armTimer: ReturnType<typeof setTimeout> | null = null;

  // --- project selection (writable map keyed by project id) ---
  readonly selectedSet = signal<Map<number, boolean>>(new Map());

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

  selectAction(a: GitlabAction): void {
    this.action.set(a);
    this.step.set(1);
    this.previewResults.set([]);
    this.execResults.set([]);
    this.resetFields();
  }

  backToActions(): void {
    this.action.set(null);
    this.step.set(1);
    this.previewResults.set([]);
    this.execResults.set([]);
  }

  private resetFields(): void {
    this.tagName.set('');
    this.tagMsg.set('');
    this.mrSource.set('');
    this.mrTitle.set('');
    this.branchName.set('');
    this.deleteBranchName.set('');
    this.releaseName.set('');
    this.releaseDesc.set('');
    this.mrIid.set(0);
    this.labelList.set('');
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
    const actionLabel = this.action()!;
    this.activity.append(`Preview ${actionLabel} on ${ids.length} project(s)`, 'info');
    try {
      const cfg = this.buildConfig();
      const results = await this.svc.preview(actionLabel, ids, cfg);
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
    const actionLabel = this.action()!;
    this.activity.append(`Executing ${actionLabel} on ${ids.length} project(s)`, 'info');
    try {
      const cfg = this.buildConfig();
      const results = await this.svc.execute(actionLabel, ids, cfg);
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
    const a = this.action();
    switch (a) {
      case 'tag':
        return { tagName: this.tagName(), tagMsg: this.tagMsg(), ref: this.tagRef() };
      case 'branch':
        return { branchName: this.branchName(), ref: this.branchRef() };
      case 'delete-branch':
        return { deleteBranchName: this.deleteBranchName() };
      case 'merge':
        return {
          mrMode: 'single',
          source: this.mrSource(),
          target: this.mrTarget(),
          title: this.mrTitle(),
        };
      case 'protect':
        return {
          protectName: this.protectName(),
          mergeAccessLevel: this.mergeAccessLevel(),
          pushAccessLevel: this.pushAccessLevel(),
          allowForcePush: this.allowForcePush(),
        };
      case 'unprotect':
        return { protectName: this.protectName() };
      case 'pipeline': {
        const vars: Record<string, string> = {};
        for (const line of this.pipelineVars().split('\n')) {
          const m = line.match(/^(\w+)=(.*)$/);
          if (m) vars[m[1]] = m[2];
        }
        return { pipelineRef: this.pipelineRef(), pipelineVariables: vars };
      }
      case 'release':
        return {
          tagName: this.tagName(),
          releaseName: this.releaseName(),
          releaseDesc: this.releaseDesc(),
          releaseRef: this.releaseRef(),
        };
      case 'close-mr':
        return { mrIid: this.mrIid(), mrAction: this.mrAction() };
      case 'update-labels':
        return {
          mrIid: this.mrIid(),
          labelAction: this.labelAction(),
          labels: this.labelList().split(',').map((s) => s.trim()).filter(Boolean),
        };
      default:
        return {};
    }
  }

  canPreview(): boolean {
    const a = this.action();
    if (!a) return false;
    if (this.selectedIds().length === 0) return false;
    switch (a) {
      case 'tag': return !!this.tagName().trim();
      case 'branch': return !!this.branchName().trim();
      case 'delete-branch': return !!this.deleteBranchName().trim();
      case 'merge': return !!this.mrSource().trim() && !!this.mrTitle().trim();
      case 'protect':
      case 'unprotect': return !!this.protectName().trim();
      case 'pipeline': return !!this.pipelineRef().trim();
      case 'release': return !!this.tagName().trim();
      case 'close-mr':
      case 'update-labels': return this.mrIid() > 0;
      default: return false;
    }
  }

  canExecute(): boolean {
    return this.previewResults().length > 0 && this.previewResults().every((r) => r.ok);
  }
}