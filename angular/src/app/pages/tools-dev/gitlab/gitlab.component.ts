/* prettier-ignore */
/* eslint-disable */
import { Component, signal, inject, computed, ChangeDetectionStrategy, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe, CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mapWithConcurrency } from '../../../shared/service/gitlab/gitlab-batch';
import {
  GitLabService,
  GitlabAction,
  ExecConfig,
  ExecResult,
  PreviewResult,
} from '../../../shared/service/gitlab/gitlab.service';
import {
  GitLabTag,
  tagDate,
  Project,
} from '../../../shared/service/gitlab/gitlab-api';

interface ActionDef {
  id: GitlabAction;
  name: string;
  icon: string;
  desc: string;
  danger?: boolean;
}
interface ChainTemplate {
  name: string;
  branches: string[];
}
interface TagRow {
  projectId: number;
  projectName: string;
  path: string;
  webUrl: string;
  tags: GitLabTag[];
  latestTag: GitLabTag | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: string;
}
interface LogEntry {
  id: number;
  time: Date;
  msg: string;
  type: 'ok' | 'err' | 'info';
}
type Member = { id: number; username: string; name: string };
type Label = { id: number; name: string; color: string };
type Milestone = { id: number; title: string };
type Branched = { name: string; protected: boolean };
type MrData = {
  iid: number;
  title: string;
  source_branch: string;
  target_branch: string;
};
type PerProjCfg = Map<number, { source: string; target: string }>;
type SortKey = 'projectName' | 'latestTag' | 'tagDate';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-gitlab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './gitlab.component.html',
  styleUrls: ['./gitlab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitlabComponent {
  private readonly svc = inject(GitLabService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly datePipe = new DatePipe('en-US');
  private logCounter = 0;

  // -- auth --
  readonly tab = signal<'tags' | 'bulk'>('tags');
  readonly showLogin = signal(false);
  readonly showAccounts = signal(false);
  readonly loginForm = this.fb.group({
    name: ['', [Validators.minLength(3)]],
    url: [this.svc.baseUrl(), [Validators.required]],
    token: ['', [Validators.required, Validators.minLength(10)]],
  });

  // -- group / projects --
  readonly GROUPS = this.svc.GROUPS;
  readonly groupId = signal<number>(991);
  readonly group = computed(() =>
    this.GROUPS.find((g) => g.id === this.groupId()),
  );
  readonly groupName = computed(() => this.group()?.name ?? 'this group');
  readonly projects = this.svc.projects;
  readonly loadingProjects = this.svc.loadingProjects;

  // -- tags monitor --
  readonly tagData = signal<TagRow[]>([]);
  readonly tagsLoading = signal(false);
  readonly tagsSearch = signal('');
  readonly sortKey = signal<SortKey>('tagDate');
  readonly sortDir = signal<SortDir>('desc');
  readonly autoRefresh = signal(false);
  readonly refreshIntervalSec = signal(60);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  readonly lastUpdated = signal<Date | null>(null);
  readonly expanded = signal<Set<number>>(new Set());

  readonly filteredTags = computed(() => {
    const term = this.tagsSearch().toLowerCase().trim();
    let list = this.tagData();
    if (term)
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(term) ||
          p.path.toLowerCase().includes(term) ||
          (p.latestTag?.name || '').toLowerCase().includes(term),
      );
    return this.applyTagSort(list);
  });

  readonly tagStats = computed(() => {
    const d = this.tagData();
    return {
      total: d.length,
      withTags: d.filter((p) => p.latestTag).length,
      noTags: d.filter((p) => !p.latestTag && p.status === 'loaded').length,
      errors: d.filter((p) => p.status === 'error').length,
    };
  });

  readonly latestOverall = computed(() => {
    const all = this.tagData()
      .filter((p) => p.latestTag)
      .map((p) => ({
        project: p.projectName,
        tag: p.latestTag!,
        date: tagDate(p.latestTag),
      }))
      .sort(
        (a, b) =>
          new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
      );
    return all[0] ?? null;
  });

  // -- bulk actions --
  readonly ACTIONS: ActionDef[] = [
    {
      id: 'merge',
      name: 'Merge Request',
      icon: 'merge_type',
      desc: 'Create MR source -> target',
    },
    {
      id: 'tag',
      name: 'Create Tag',
      icon: 'label',
      desc: 'Tag a branch with a version',
    },
    {
      id: 'branch',
      name: 'Create Branch',
      icon: 'call_split',
      desc: 'New branch from a ref',
    },
    {
      id: 'delete-branch',
      name: 'Delete Branch',
      icon: 'delete_sweep',
      desc: 'Remove a branch',
      danger: true,
    },
    {
      id: 'close-mr',
      name: 'Merge / Close MR',
      icon: 'done_all',
      desc: 'Merge or close an MR',
      danger: true,
    },
    {
      id: 'update-labels',
      name: 'Update Labels',
      icon: 'style',
      desc: 'Add / remove MR labels',
    },
    {
      id: 'protect',
      name: 'Protect Branch',
      icon: 'shield',
      desc: 'Protect a branch',
    },
    {
      id: 'unprotect',
      name: 'Unprotect Branch',
      icon: 'lock_open',
      desc: 'Unprotect a branch',
      danger: true,
    },
    {
      id: 'pipeline',
      name: 'Trigger Pipeline',
      icon: 'bolt',
      desc: 'Run a pipeline on a ref',
    },
    {
      id: 'release',
      name: 'Create Release',
      icon: 'new_releases',
      desc: 'Release off a tag/ref',
    },
  ];

  readonly CHAIN_TEMPLATES: ChainTemplate[] = [
    {
      name: 'UAT1 -> Staging -> Master',
      branches: ['UAT1', 'staging', 'master'],
    },
    { name: 'Develop -> Main', branches: ['develop', 'main'] },
    {
      name: 'Feature -> Develop -> Main',
      branches: ['feature', 'develop', 'main'],
    },
    {
      name: 'Hotfix -> Main -> Develop',
      branches: ['hotfix', 'main', 'develop'],
    },
  ];

  // -- selection state --
  readonly selected = signal<Set<number>>(new Set());
  readonly bulkSearch = signal('');
  readonly selectedAction = signal<GitlabAction>('merge');
  readonly mrMode = signal<'single' | 'chained'>('single');
  readonly branchMode = signal<'same' | 'per-project'>('same');
  readonly chainSteps = signal<string[]>(['develop', 'main']);
  readonly newChainStep = signal('');
  readonly perProjectConfig = signal<PerProjCfg>(new Map());

  // -- metadata --
  readonly members = signal<Member[]>([]);
  readonly labels = signal<Label[]>([]);
  readonly milestones = signal<Milestone[]>([]);
  readonly branches = signal<Branched[]>([]);
  readonly openMRs = signal<MrData[]>([]);
  readonly loadingMetadata = signal(false);
  readonly selectedReviewers = signal<Set<number>>(new Set());
  readonly selectedAssignees = signal<Set<number>>(new Set());
  readonly selectedLabels = signal<Set<string>>(new Set());
  readonly selectedMilestone = signal<number | null>(null);

  // -- preview + execute --
  readonly previewResults = signal<Map<number, PreviewResult>>(new Map());
  readonly liveResults = signal<ExecResult[]>([]);
  readonly executing = signal(false);
  readonly showResults = signal(false);
  readonly previewing = signal(false);

  readonly actionForm = this.fb.group({
    source: ['develop'],
    target: ['main'],
    title: [''],
    desc: [''],
    tagName: [''],
    tagMsg: [''],
    branchName: [''],
    deleteBranchName: [''],
    protectName: [''],
    allowForcePush: [false],
    pipelineRef: ['main'],
    releaseName: [''],
    releaseDesc: [''],
    releaseRef: [''],
    mrIid: [null as number | null],
    mrAction: ['merge' as 'merge' | 'close'],
    labelAction: ['add' as 'add' | 'remove'],
  });

  // -- computeds --
  readonly isAuth = this.svc.authed;
  readonly maskedToken = this.svc.maskedToken;
  readonly accounts = this.svc.accounts;
  readonly currentAccount = this.svc.currentAccount;

  readonly filteredProjects = computed(() => {
    const term = this.bulkSearch().toLowerCase().trim(),
      list = this.projects();
    return term
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.path_with_namespace.toLowerCase().includes(term),
        )
      : list;
  });

  readonly selectedCount = computed(() => this.selected().size);
  readonly isSingleProject = computed(() => this.selected().size === 1);
  readonly selectedProjectId = computed(() =>
    this.isSingleProject() ? [...this.selected()][0] : null,
  );

  readonly previewReady = computed(() => {
    const m = this.previewResults();
    return m.size === 0 ? 0 : [...m.values()].filter((r) => r.ok).length;
  });
  readonly previewIssue = computed(() => {
    const m = this.previewResults();
    return m.size === 0 ? 0 : [...m.values()].filter((r) => !r.ok).length;
  });

  readonly progress = computed(() => {
    const r = this.liveResults(),
      done = r.filter((x) => x.status === 'done').length,
      failed = r.filter((x) => x.status === 'done' && !x.success).length;
    return {
      done,
      total: r.length,
      failed,
      pct: r.length ? Math.round((done / r.length) * 100) : 0,
    };
  });

  readonly resultSummary = computed(() => {
    const r = this.liveResults();
    return {
      ok: r.filter((x) => x.status === 'done' && x.success).length,
      fail: r.filter((x) => x.status === 'done' && !x.success).length,
      total: r.length,
      elapsed: this.elapsedTime() || null,
    };
  });

  readonly canExecute = computed(() => {
    if (this.executing() || this.selected().size === 0) return false;
    const f = this.actionForm.value;
    const c: Record<string, () => boolean> = {
      merge: () =>
        this.mrMode() === 'chained'
          ? this.chainSteps().length >= 2
          : this.branchMode() === 'per-project'
            ? this.selected().size > 0
            : !!(f.source && f.target),
      tag: () => !!(f.tagName && f.source),
      branch: () => !!(f.branchName && f.source),
      'delete-branch': () => !!f.deleteBranchName,
      protect: () => !!f.protectName,
      unprotect: () => !!f.protectName,
      pipeline: () => !!f.pipelineRef,
      release: () => !!(f.tagName && f.releaseName),
      'close-mr': () => !!f.mrIid && !!f.mrAction,
      'update-labels': () =>
        !!f.mrIid && this.selectedLabels().size > 0 && !!f.labelAction,
    };
    return c[this.selectedAction()]?.() ?? false;
  });

  readonly logs = signal<LogEntry[]>([]);
  readonly activityOpen = signal(false);
  readonly elapsedTime = signal(0);
  private execStart = 0;

  quickFilter(key: string): void {
    if (key === 'errors') {
      this.tagsSearch.set('error');
    } else if (key === 'notags') {
      if (this.tagsSearch() === '!notags') {
        this.tagsSearch.set('');
      } else {
        this.tagsSearch.set('!notags');
      }
    } else if (key === 'withtags') {
      if (this.tagsSearch() === '!withtags') {
        this.tagsSearch.set('');
      } else {
        this.tagsSearch.set('!withtags');
      }
    } else {
      this.tagsSearch.set('');
    }
  }

  toggleActivity(): void {
    this.activityOpen.set(!this.activityOpen());
  }

  constructor() {
    const qp = this.route.snapshot.queryParamMap.get('tab');
    if (qp === 'bulk' || qp === 'tags') this.tab.set(qp);
    effect(
      () => {
        const pid = this.selectedProjectId();
        if (pid && this.isAuth()) this.loadProjectMetadata(pid);
        else this.clearMetadata();
      },
      { allowSignalWrites: true },
    );
  }

  // === tabs / auth ===

  setTab(t: 'tags' | 'bulk'): void {
    this.tab.set(t);
    this.router.navigate([], {
      queryParams: { tab: t },
      queryParamsHandling: 'merge',
    });
  }

  openLogin(): void {
    this.loginForm.reset({ url: this.svc.baseUrl(), token: '', name: '' });
    this.showLogin.set(true);
  }

  async login(): Promise<void> {
    if (!this.loginForm.valid) return;
    const { token, url, name } = this.loginForm.value;
    try {
      await this.svc.login(token!, url ?? undefined);
      this.showLogin.set(false);
      this.log(`Connected to GitLab${name ? ' as ' + name : ''}`, 'ok');
      await this.onGroupChange(this.groupId());
    } catch {
      this.log('Invalid token or unreachable URL', 'err');
    }
  }

  logout(): void {
    this.svc.logout();
    this.tagData.set([]);
    this.selected.set(new Set());
    this.previewResults.set(new Map());
    this.liveResults.set([]);
    this.stopAutoRefresh();
    this.log('Logged out', 'info');
  }

  async saveAccount(): Promise<void> {
    if (!this.loginForm.valid) return;
    const { name, url, token } = this.loginForm.value;
    if (!name || !url || !token) return;
    try {
      await this.svc.saveAccount(name, url, token);
      this.log(`Account "${name}" saved`, 'ok');
      this.loginForm.reset({ url: this.svc.baseUrl(), token: '', name: '' });
    } catch {
      this.log('Account token invalid or unreachable', 'err');
    }
  }

  switchAccount(id: string): void {
    this.svc.switchAccount(id);
    this.showAccounts.set(false);
    this.showLogin.set(false);
    this.tagData.set([]);
    this.selected.set(new Set());
    this.log('Switched account', 'info');
    this.onGroupChange(this.groupId());
  }

  deleteAccount(id: string): void {
    const acc = this.svc.accounts().find((a) => a.id === id);
    if (acc && confirm(`Delete account "${acc.name}"?`)) {
      this.svc.deleteAccount(id);
      this.log(`Account "${acc.name}" deleted`, 'info');
    }
  }

  // === group / projects ===

  async onGroupChange(gid: number): Promise<void> {
    this.groupId.set(gid);
    this.selected.set(new Set());
    this.previewResults.set(new Map());
    this.perProjectConfig.set(new Map());
    if (!this.isAuth()) return;
    try {
      await this.svc.listGroupProjects(gid, true);
      this.log(`Loaded ${this.svc.projects().length} projects`, 'ok');
      if (this.tab() === 'tags') await this.fetchAllTags();
    } catch {
      this.log('Failed to load projects', 'err');
    }
  }

  refreshProjects(): void {
    this.onGroupChange(this.groupId());
  }

  // === tags monitor ===

  async fetchAllTags(): Promise<void> {
    const projects = this.svc.projects();
    if (!projects.length) {
      this.log('No projects to fetch tags for', 'info');
      return;
    }
    this.tagsLoading.set(true);
    this.tagData.set(
      projects.map((p) => ({
        projectId: p.id,
        projectName: p.name,
        path: p.path_with_namespace,
        webUrl: p.web_url,
        tags: [],
        latestTag: null,
        status: 'loading' as const,
      })),
    );
    await Promise.all(projects.map((p) => this.fetchTagsForProject(p)));
    this.lastUpdated.set(new Date());
    const withTags = this.tagData().filter((p) => p.latestTag).length;
    this.log(`Tags fetched: ${withTags}/${projects.length} have tags`, 'ok');
    this.tagsLoading.set(false);
  }

  private async fetchTagsForProject(p: Project): Promise<void> {
    try {
      const tags = await this.svc.listProjectTags(p.id, {
        orderBy: 'version',
        sort: 'desc',
        perPage: 20,
      });
      const latest = tags.length > 0 ? tags[0] : null;
      this.tagData.update((list) =>
        list.map((row) =>
          row.projectId === p.id
            ? { ...row, tags, latestTag: latest, status: 'loaded' as const }
            : row,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fetch failed';
      this.tagData.update((list) =>
        list.map((row) =>
          row.projectId === p.id
            ? { ...row, status: 'error' as const, error: msg }
            : row,
        ),
      );
    }
  }

  async refreshSingleTag(pid: number): Promise<void> {
    const p = this.svc.projects().find((x) => x.id === pid);
    if (!p) return;
    this.tagData.update((list) =>
      list.map((r) =>
        r.projectId === pid ? { ...r, status: 'loading' as const } : r,
      ),
    );
    await this.fetchTagsForProject(p);
    this.lastUpdated.set(new Date());
    this.log(`Refreshed tags: ${p.name}`, 'info');
  }

  toggleAutoRefresh(): void {
    this.autoRefresh() ? this.stopAutoRefresh() : this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    this.autoRefresh.set(true);
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => {
      if (!this.tagsLoading()) this.fetchAllTags();
    }, this.refreshIntervalSec() * 1000);
    this.log(`Auto-refresh ON (every ${this.refreshIntervalSec()}s)`, 'info');
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.autoRefresh.set(false);
  }
  onIntervalChange(sec: number): void {
    this.refreshIntervalSec.set(sec);
    if (this.autoRefresh()) this.startAutoRefresh();
  }

  setSort(key: SortKey): void {
    if (this.sortKey() === key)
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  private applyTagSort(list: TagRow[]): TagRow[] {
    const key = this.sortKey(),
      dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (key === 'projectName')
        cmp = a.projectName.localeCompare(b.projectName);
      else if (key === 'latestTag')
        cmp = (a.latestTag?.name || '').localeCompare(
          b.latestTag?.name || '',
          undefined,
          { numeric: true },
        );
      else if (key === 'tagDate')
        cmp =
          new Date(tagDate(a.latestTag) ?? 0).getTime() -
          new Date(tagDate(b.latestTag) ?? 0).getTime();
      return cmp * dir;
    });
  }

  toggleExpand(pid: number): void {
    const s = new Set(this.expanded());
    s.has(pid) ? s.delete(pid) : s.add(pid);
    this.expanded.set(s);
  }
  isExpanded(pid: number): boolean {
    return this.expanded().has(pid);
  }

  // === bulk selection ===

  toggleProject(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
    this.previewResults.set(new Map());
  }
  isProjectSelected(id: number): boolean {
    return this.selected().has(id);
  }
  selectAllFiltered(): void {
    this.selected.set(new Set(this.filteredProjects().map((p) => p.id)));
    this.previewResults.set(new Map());
  }
  clearSelection(): void {
    this.selected.set(new Set());
    this.previewResults.set(new Map());
  }

  headerState(): 'all' | 'none' | 'some' {
    const visible = this.filteredProjects();
    if (!visible.length) return 'none';
    const sel = visible.filter((p) => this.selected().has(p.id)).length;
    return sel === 0 ? 'none' : sel === visible.length ? 'all' : 'some';
  }

  toggleHeaderSelect(): void {
    if (this.headerState() === 'all') {
      const visible = new Set(this.filteredProjects().map((p) => p.id)),
        s = new Set(this.selected());
      visible.forEach((id) => s.delete(id));
      this.selected.set(s);
    } else {
      this.selectAllFiltered();
    }
  }

  // === action config ===

  setAction(a: GitlabAction): void {
    this.selectedAction.set(a);
    this.previewResults.set(new Map());
  }
  selectedActionName(): string {
    return this.ACTIONS.find((a) => a.id === this.selectedAction())?.name ?? '';
  }
  setMrMode(m: 'single' | 'chained'): void {
    this.mrMode.set(m);
    this.previewResults.set(new Map());
  }
  setBranchMode(m: 'same' | 'per-project'): void {
    this.branchMode.set(m);
    this.previewResults.set(new Map());
  }
  applyTemplate(t: ChainTemplate): void {
    this.chainSteps.set([...t.branches]);
    this.previewResults.set(new Map());
  }

  addChainStep(): void {
    const v = this.newChainStep().trim();
    if (v) {
      this.chainSteps.update((s) => [...s, v]);
      this.newChainStep.set('');
      this.previewResults.set(new Map());
    }
  }

  removeLastChainStep(): void {
    this.chainSteps.update((s) => (s.length > 2 ? s.slice(0, -1) : s));
    this.previewResults.set(new Map());
  }

  updateChainStep(i: number, value: string): void {
    this.chainSteps.update((s) => {
      const n = [...s];
      n[i] = value;
      return n;
    });
    this.previewResults.set(new Map());
  }

  setPerProject(pid: number, field: 'source' | 'target', value: string): void {
    this.perProjectConfig.update((m) => {
      const nm = new Map(m),
        ex = nm.get(pid) ?? { source: '', target: '' };
      nm.set(pid, { ...ex, [field]: value });
      return nm;
    });
    this.previewResults.set(new Map());
  }

  toggleReviewer(id: number): void {
    this.mutateSet(this.selectedReviewers, id);
  }
  toggleAssignee(id: number): void {
    this.mutateSet(this.selectedAssignees, id);
  }
  toggleLabel(name: string): void {
    this.mutateSet(this.selectedLabels, name);
  }

  private mutateSet<T>(sig: ReturnType<typeof signal<Set<T>>>, v: T): void {
    sig.update((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  }

  // === metadata ===

  private async loadProjectMetadata(pid: number): Promise<void> {
    this.loadingMetadata.set(true);
    try {
      const [m, l, mi, b, mr] = await Promise.all([
        this.svc.listProjectMembers(pid).catch(() => []),
        this.svc.listProjectLabels(pid).catch(() => []),
        this.svc.listProjectMilestones(pid).catch(() => []),
        this.svc.listProjectBranches(pid).catch(() => []),
        this.svc.listOpenMergeRequests(pid).catch(() => []),
      ]);
      this.members.set(m as Member[]);
      this.labels.set(l as Label[]);
      this.milestones.set(mi as Milestone[]);
      this.branches.set(b as Branched[]);
      this.openMRs.set(mr as MrData[]);
    } catch {
      this.log('Failed to load project metadata', 'err');
    } finally {
      this.loadingMetadata.set(false);
    }
  }

  clearMetadata(): void {
    this.members.set([]);
    this.labels.set([]);
    this.milestones.set([]);
    this.branches.set([]);
    this.openMRs.set([]);
    this.selectedReviewers.set(new Set());
    this.selectedAssignees.set(new Set());
    this.selectedLabels.set(new Set());
    this.selectedMilestone.set(null);
  }

  setMilestone(v: string): void {
    this.selectedMilestone.set(v ? +v : null);
  }

  // === preview + execute ===

  private buildCfg(): ExecConfig {
    const f = this.actionForm.value;
    return {
      mrMode: this.mrMode(),
      branchMode: this.branchMode(),
      source: f.source ?? '',
      target: f.target ?? '',
      perProject: this.perProjectConfig(),
      chainSteps: this.chainSteps(),
      title: f.title ?? '',
      description: f.desc ?? '',
      reviewer_ids: [...this.selectedReviewers()],
      assignee_ids: [...this.selectedAssignees()],
      labels: [...this.selectedLabels()],
      milestone_id: this.selectedMilestone() ?? undefined,
      tagName: f.tagName ?? '',
      tagMsg: f.tagMsg ?? '',
      ref: f.source ?? '',
      branchName: f.branchName ?? '',
      deleteBranchName: f.deleteBranchName ?? '',
      protectName: f.protectName ?? '',
      allowForcePush: !!f.allowForcePush,
      pipelineRef: f.pipelineRef ?? '',
      releaseName: f.releaseName ?? '',
      releaseDesc: f.releaseDesc ?? '',
      releaseRef: f.releaseRef ?? '',
      mrIid: f.mrIid ?? undefined,
      mrAction: f.mrAction ?? 'merge',
      labelAction: f.labelAction ?? 'add',
    };
  }

  async runPreview(): Promise<void> {
    const ids = [...this.selected()];
    if (!ids.length) return;
    this.previewing.set(true);
    try {
      const results = await this.svc.preview(
        this.selectedAction(),
        ids,
        this.buildCfg(),
      );
      const m = new Map<number, PreviewResult>();
      results.forEach((r) => m.set(r.projectId, r));
      this.previewResults.set(m);
      const ok = results.filter((r) => r.ok).length;
      this.log(
        `Preview: ${ok}/${results.length} ready`,
        ok === results.length ? 'ok' : 'info',
      );
    } catch (e) {
      this.log(
        `Preview failed: ${e instanceof Error ? e.message : 'error'}`,
        'err',
      );
    } finally {
      this.previewing.set(false);
    }
  }

  previewFor(pid: number): PreviewResult | undefined {
    return this.previewResults().get(pid);
  }
  liveResultFor(pid: number): ExecResult | undefined {
    return this.liveResults().find((r) => r.projectId === pid);
  }

  async execute(): Promise<void> {
    const action = this.selectedAction();
    if (this.ACTIONS.find((a) => a.id === action)?.danger) {
      if (
        !confirm(
          `This action (${action}) is destructive and will run on ${this.selected().size} project(s). Continue?`,
        )
      )
        return;
    }
    const ids = [...this.selected()];
    if (!ids.length) return;
    this.execStart = Date.now();
    this.elapsedTime.set(0);
    const cfg = this.buildCfg(),
      nameOf = (pid: number) => this.svc.projectName(pid);

    const rows: ExecResult[] = ids.map((pid) => ({
      projectId: pid,
      projectName: nameOf(pid),
      success: false,
      action,
      status: 'pending' as const,
    }));
    this.liveResults.set(rows);
    this.executing.set(true);
    this.showResults.set(true);

    const updateRow = (pid: number, patch: Partial<ExecResult>) => {
      this.liveResults.update((rs) =>
        rs.map((r) => (r.projectId === pid ? { ...r, ...patch } : r)),
      );
    };

    try {
      await mapWithConcurrency(ids, 3, async (pid) => {
        updateRow(pid, { status: 'running' });
        try {
          const res = await this.svc.execute(action, [pid], cfg, 1);
          const first = res[0],
            ok = res.length > 0 && res.every((r) => r.success);
          updateRow(pid, {
            status: 'done',
            success: ok,
            action: first?.action ?? action,
            detail: res.length > 1 ? `${res.length} ops` : first?.detail,
            error: ok
              ? undefined
              : (res.find((r) => !r.success)?.error ?? 'failed'),
            mrUrl: first?.mrUrl,
            mrIid: first?.mrIid,
            source: first?.source,
            target: first?.target,
          });
        } catch (e) {
          updateRow(pid, {
            status: 'done',
            success: false,
            error: e instanceof Error ? e.message : 'failed',
          });
        }
      });
      const s = this.resultSummary();
      this.log(
        `Done: ${s.ok}/${s.total} succeeded${s.fail ? `, ${s.fail} failed` : ''}`,
        s.fail ? 'info' : 'ok',
      );
    } finally {
      this.executing.set(false);
      this.elapsedTime.set(Math.round((Date.now() - this.execStart) / 1000));
    }
  }

  getAnimDelay(i: number): string {
    return i * 50 + 'ms';
  }

  retryFailed(): void {
    const failedIds = this.liveResults()
      .filter((r) => r.status === 'done' && !r.success)
      .map((r) => r.projectId);
    if (!failedIds.length) return;
    this.selected.set(new Set(failedIds));
    this.previewResults.set(new Map());
    this.execute();
  }

  copyAllLinks(): void {
    const links = this.liveResults()
      .filter((r) => r.success && r.mrUrl)
      .map((r) => r.mrUrl!) as string[];
    if (!links.length) return;
    this.writeClipboard(links.join('\n'));
    this.snack.open(`Copied ${links.length} MR link(s)`, 'Dismiss', {
      duration: 2000,
    });
  }

  copyLink(url: string): void {
    this.writeClipboard(url);
    this.snack.open('Link copied', 'Dismiss', { duration: 1500 });
  }

  private writeClipboard(text: string): void {
    if (this.isBrowser) navigator.clipboard?.writeText(text).catch(() => {});
  }

  closeResults(): void {
    this.showResults.set(false);
  }

  // === utilities ===

  timeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const sec = Math.floor(diff / 1000),
      min = Math.floor(sec / 60),
      hr = Math.floor(min / 60),
      day = Math.floor(hr / 24);
    if (day > 30)
      return this.datePipe.transform(new Date(dateStr), 'dd MMM yyyy') ?? '-';
    if (day > 0) return `${day}d ago`;
    if (hr > 0) return `${hr}h ago`;
    if (min > 0) return `${min}m ago`;
    return 'just now';
  }

  formatDate(dateStr: string | null | undefined): string {
    return dateStr
      ? (this.datePipe.transform(new Date(dateStr), 'dd MMM yyyy HH:mm') ?? '-')
      : '-';
  }

  trackByProjectId(_: number, p: { projectId: number } | Project): number {
    return 'id' in p
      ? (p as Project).id
      : (p as { projectId: number }).projectId;
  }

  tagClass(name: string): string {
    if (/^v\d+\.\d+\.\d+$/.test(name)) return 'release';
    if (/-(rc|beta|alpha|pre)/.test(name)) return 'prerelease';
    if (/hotfix/i.test(name)) return 'hotfix';
    return '';
  }

  copyText(text: unknown): void {
    const s = String(text ?? '');
    if (this.isBrowser)
      navigator.clipboard?.writeText(s).then(
        () => this.snack.open('Copied', 'Dismiss', { duration: 1500 }),
        () => {},
      );
  }

  private log(msg: string, type: 'ok' | 'err' | 'info'): void {
    const id = ++this.logCounter;
    this.logs.update((l) =>
      [{ id, time: new Date(), msg, type }, ...l].slice(0, 50),
    );
  }

  clearLogs(): void {
    this.logs.set([]);
  }
}
