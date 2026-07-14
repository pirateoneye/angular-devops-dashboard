// gitlab.service.ts
// Single Angular stateful facade over the framework-agnostic GitLabClient +
// batch layer. Holds auth/accounts/projects state so every GitLab view shares
// one login, one client, one project list. Session-only (no localStorage) so no
// token is ever persisted.

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  GitLabClient,
  GitLabApiError,
  GitLabHttp,
  Project,
  Group,
  Branch,
  Member,
  Label,
  Milestone,
  MergeRequestResponse,
  GitLabTag,
  ListTagsOptions,
  extractErrorMessage,
} from './gitlab-api';
import {
  createMergeRequests,
  createTags,
  createBranches,
  deleteBranches,
  protectBranches,
  unprotectBranches,
  triggerPipelines,
  createReleases,
  closeOrMergeMRs,
  updateMRLabelsBatch,
  previewMergeRequests,
  MrResult,
  BatchResult,
  MrPreviewResult,
  DEFAULT_CONCURRENCY,
} from './gitlab-batch';

export interface GitLabAccount {
  id: string;
  name: string;
  url: string;
  token: string;
}

export type GitlabAction =
  | 'merge'
  | 'tag'
  | 'branch'
  | 'delete-branch'
  | 'close-mr'
  | 'update-labels'
  | 'protect'
  | 'unprotect'
  | 'pipeline'
  | 'release';

/** One normalized result row regardless of action. Drives the live results table. */
export interface ExecResult {
  projectId: number;
  projectName: string;
  success: boolean;
  action: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
  error?: string;
  mrUrl?: string;
  mrIid?: number;
  source?: string;
  target?: string;
}

export interface PreviewResult {
  projectId: number;
  projectName: string;
  ok: boolean;
  reasons: string[];
  detail: string;
}

/** Bag of every field any action might need. The component fills only the
 *  relevant ones; `execute`/`preview` read what they need per action. */
export interface ExecConfig {
  mrMode?: 'single' | 'chained';
  branchMode?: 'same' | 'per-project';
  source?: string;
  target?: string;
  perProject?: Map<number, { source: string; target: string }>;
  chainSteps?: string[];
  title?: string;
  description?: string;
  reviewer_ids?: number[];
  assignee_ids?: number[];
  labels?: string[];
  milestone_id?: number;
  tagName?: string;
  tagMsg?: string;
  ref?: string;
  branchName?: string;
  deleteBranchName?: string;
  protectName?: string;
  mergeAccessLevel?: number;
  pushAccessLevel?: number;
  allowForcePush?: boolean;
  pipelineRef?: string;
  pipelineVariables?: Record<string, string>;
  releaseName?: string;
  releaseDesc?: string;
  releaseRef?: string;
  mrIid?: number;
  mrAction?: 'merge' | 'close';
  labelAction?: 'add' | 'remove';
}

@Injectable({ providedIn: 'root' })
export class GitLabService {
  private readonly http = inject(HttpClient);

  // Predefined internal groups (curated list — matches the operator's reality).
  readonly GROUPS: Group[] = [
    { id: 991, name: 'Merchant Service' },
    { id: 27632, name: 'Merchant Service - POS' },
    { id: 1413, name: 'Messi' },
    { id: 762, name: 'QRMS' },
  ];

  // --- Auth / account state (session only) ---------------------------------
  readonly token = signal('');
  readonly baseUrl = signal('https://asui/api/v4');
  readonly accounts = signal<GitLabAccount[]>([]);
  readonly currentAccountId = signal<string | null>(null);
  readonly authed = computed(() => this.token().length > 0);
  readonly maskedToken = computed(() => {
    const t = this.token();
    return t.length > 8 ? '********' + t.slice(-4) : t ? '********' : '';
  });
  readonly currentAccount = computed(
    () => this.accounts().find((a) => a.id === this.currentAccountId()) ?? null,
  );

  // --- Project state (shared by Tags Monitor + Bulk) ----------------------
  readonly projects = signal<Project[]>([]);
  readonly loadingProjects = signal(false);

  // Cached client, rebuilt when token/baseUrl change.
  private clientCache: {
    token: string;
    baseUrl: string;
    client: GitLabClient;
  } | null = null;

  /** Current GitLabClient (rebuilds if token/baseUrl changed). Throws if not authed. */
  private client(): GitLabClient {
    const t = this.token();
    const b = this.baseUrl();
    if (!t) throw new Error('Not authenticated');
    if (
      !this.clientCache ||
      this.clientCache.token !== t ||
      this.clientCache.baseUrl !== b
    ) {
      this.clientCache = {
        token: t,
        baseUrl: b,
        client: new GitLabClient(this.adapter, b, t),
      };
    }
    return this.clientCache.client;
  }

  /** Angular → GitLabHttp adapter. Non-2xx responses throw HttpErrorResponse;
   *  we convert those into GitLabApiError so the batch layer reads a clean message. */
  private readonly adapter: GitLabHttp = {
    get: <T>(url: string, headers?: Record<string, string>) =>
      firstValueFrom(this.http.get<T>(url, { headers })).catch((e) => {
        throw this.toApiError(e);
      }),
    post: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
      firstValueFrom(this.http.post<T>(url, body, { headers })).catch((e) => {
        throw this.toApiError(e);
      }),
    put: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
      firstValueFrom(this.http.put<T>(url, body, { headers })).catch((e) => {
        throw this.toApiError(e);
      }),
    delete: <T>(url: string, headers?: Record<string, string>) =>
      firstValueFrom(this.http.delete<T>(url, { headers })).catch((e) => {
        throw this.toApiError(e);
      }),
  };

  private toApiError(e: unknown): GitLabApiError {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      const body = (e as { error?: unknown }).error;
      return new GitLabApiError(status, extractErrorMessage(e), body);
    }
    return new GitLabApiError(0, extractErrorMessage(e));
  }

  // --- Auth ----------------------------------------------------------------

  async login(token: string, baseUrl?: string): Promise<void> {
    if (baseUrl) this.baseUrl.set(baseUrl);
    // Build a temp client to validate the token before committing it.
    const probeClient = new GitLabClient(this.adapter, this.baseUrl(), token);
    await probeClient.validateToken(); // throws on invalid token
    this.token.set(token);
  }

  logout(): void {
    this.token.set('');
    this.projects.set([]);
    this.currentAccountId.set(null);
    this.clientCache = null;
  }

  /** DEV ONLY: seed dummy token + mock projects so the full UI can be inspected. */
  devBypass(): void {
    this.token.set('bypass-dummy-token');
    this.projects.set([
      { id: 1, name: 'proj-a', path_with_namespace: 'grp/proj-a', web_url: 'https://asui/grp/proj-a' },
      { id: 2, name: 'proj-b', path_with_namespace: 'grp/proj-b', web_url: 'https://asui/grp/proj-b' },
      { id: 3, name: 'proj-c', path_with_namespace: 'grp/proj-c', web_url: 'https://asui/grp/proj-c' },
    ]);
  }

  private get bypass(): boolean {
    return this.token() === 'bypass-dummy-token';
  }

  async saveAccount(name: string, url: string, token: string): Promise<void> {
    // Validate token against the given URL before storing.
    const probe = new GitLabClient(this.adapter, url, token);
    await probe.validateToken();
    const account: GitLabAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name,
      url,
      token,
    };
    this.accounts.update((a) => [...a, account]);
  }

  switchAccount(id: string): void {
    const acc = this.accounts().find((a) => a.id === id);
    if (!acc) return;
    this.currentAccountId.set(id);
    this.baseUrl.set(acc.url);
    this.token.set(acc.token);
    this.projects.set([]);
  }

  deleteAccount(id: string): void {
    this.accounts.update((a) => a.filter((x) => x.id !== id));
    if (this.currentAccountId() === id) this.logout();
  }

  // --- Reads ---------------------------------------------------------------

  async listGroupProjects(
    gid: number,
    includeSubgroups = true,
  ): Promise<Project[]> {
    this.loadingProjects.set(true);
    try {
      const data = await this.client().listGroupProjects(gid, {
        includeSubgroups: includeSubgroups,
      });
      this.projects.set(data);
      return data;
    } finally {
      this.loadingProjects.set(false);
    }
  }

  async listProjectTags(pid: number, _opts?: ListTagsOptions): Promise<GitLabTag[]> {
    if (this.bypass) return [];
    return this.client().listProjectTags(pid, _opts);
  }
  async listProjectBranches(pid: number): Promise<Branch[]> {
    if (this.bypass) return [{ name: `feature/example-${pid}`, protected: false }];
    return this.client().listProjectBranches(pid);
  }
  listProjectMembers(pid: number): Promise<Member[]> {
    return this.client().listProjectMembers(pid);
  }
  async listProjectLabels(pid: number): Promise<Label[]> {
    if (this.bypass) return [{ id: pid, name: 'dev-label', color: '#36f' } as Label];
    return this.client().listProjectLabels(pid);
  }
  async listProjectMilestones(pid: number): Promise<Milestone[]> {
    if (this.bypass) return [];
    return this.client().listProjectMilestones(pid);
  }
  listOpenMergeRequests(pid: number): Promise<MergeRequestResponse[]> {
    if (this.bypass) return Promise.resolve([]);
    return this.client().listOpenMergeRequests(pid);
  }

  /** Resolve a project id to its name for the batch layer's nameOf resolver. */
  projectName(pid: number): string {
    return this.projects().find((p) => p.id === pid)?.name ?? String(pid);
  }

  // --- Preview (dry-run) ---------------------------------------------------

  /** Per-project readiness check without writing anything. Concurrency-limited. */
  async preview(
    action: GitlabAction,
    projectIds: number[],
    cfg: ExecConfig,
  ): Promise<PreviewResult[]> {
    // Dev bypass: return all-ok for every project without touching the API.
    if (this.bypass) {
      return projectIds.map((pid) => ({
        projectId: pid,
        projectName: this.projectName(pid),
        ok: true,
        reasons: [],
        detail: cfg.tagName ?? cfg.source ?? '',
      }));
    }
    const client = this.client();
    const nameOf = (pid: number) => this.projectName(pid);

    if (action === 'merge') {
      const r: MrPreviewResult[] = await previewMergeRequests(
        client,
        projectIds,
        nameOf,
        {
          mode: cfg.mrMode ?? 'single',
          source: cfg.source,
          target: cfg.target,
          perProject: cfg.perProject,
          chainSteps: cfg.chainSteps,
        },
      );
      return r.map((x) => ({
        projectId: x.projectId,
        projectName: x.projectName,
        ok: x.ok,
        reasons: x.reasons,
        detail: x.detail,
      }));
    }

    // For ref-based actions, verify the source/ref branch exists per project.
    const refBased: GitlabAction[] = ['tag', 'branch', 'pipeline', 'release'];
    const out: PreviewResult[] = [];
    for (const pid of projectIds) {
      try {
        const branches = await client
          .listProjectBranches(pid)
          .catch(() => [] as Branch[]);
        const names = new Set(branches.map((b) => b.name));
        const reasons: string[] = [];
        let detail = '';
        if (action === 'delete-branch') {
          const b = cfg.deleteBranchName ?? '';
          detail = b;
          if (!b) reasons.push('no branch name set');
          else if (!names.has(b)) reasons.push(`branch '${b}' not found`);
        } else if (action === 'protect') {
          const b = cfg.protectName ?? '';
          detail = b;
          const existing = branches.find((x) => x.name === b);
          if (!b) reasons.push('no branch name set');
          else if (!existing) reasons.push(`branch '${b}' not found`);
          else if (existing.protected)
            reasons.push(`branch '${b}' already protected`);
        } else if (action === 'unprotect') {
          const b = cfg.protectName ?? '';
          detail = b;
          const existing = branches.find((x) => x.name === b);
          if (!b) reasons.push('no branch name set');
          else if (!existing) reasons.push(`branch '${b}' not found`);
          else if (!existing.protected)
            reasons.push(`branch '${b}' not protected`);
        } else if (refBased.includes(action)) {
          const ref = cfg.ref ?? '';
          detail = ref;
          if (!ref) reasons.push('no ref set');
          else if (!names.has(ref)) reasons.push(`ref '${ref}' not found`);
        } else if (action === 'close-mr' || action === 'update-labels') {
          const iid = cfg.mrIid ?? 0;
          detail = `MR !${iid}`;
          if (!iid) {
            reasons.push('no MR selected');
          } else {
            const mrs = await client
              .listOpenMergeRequests(pid)
              .catch(() => [] as MergeRequestResponse[]);
            if (!mrs.some((m) => m.iid === iid))
              reasons.push(`MR !${iid} not open`);
          }
        }
        out.push({
          projectId: pid,
          projectName: nameOf(pid),
          ok: reasons.length === 0,
          reasons,
          detail,
        });
      } catch (e) {
        out.push({
          projectId: pid,
          projectName: nameOf(pid),
          ok: false,
          reasons: [extractErrorMessage(e)],
          detail: '',
        });
      }
    }
    return out;
  }

  // --- Execute -------------------------------------------------------------

  /** Run an action across `projectIds` with bounded concurrency. Returns one
   *  ExecResult per project (merge may return multiple for chained mode). */
  async execute(
    action: GitlabAction,
    projectIds: number[],
    cfg: ExecConfig,
    concurrency = DEFAULT_CONCURRENCY,
  ): Promise<ExecResult[]> {
    // Dev bypass: return dummy success results.
    if (this.bypass) {
      return projectIds.map((pid) => ({
        projectId: pid,
        projectName: this.projectName(pid),
        success: true,
        action,
        status: 'done' as const,
        detail: cfg.tagName ?? cfg.source ?? '',
      }));
    }
    const client = this.client();
    const nameOf = (pid: number) => this.projectName(pid);
    const batch = { concurrency };

    const mapBatch = (r: BatchResult[]): ExecResult[] =>
      r.map((x) => ({
        projectId: x.projectId,
        projectName: x.projectName,
        success: x.success,
        action: x.action,
        status: 'done' as const,
        detail: x.detail,
        error: x.error,
      }));
    const mapMr = (r: MrResult[]): ExecResult[] =>
      r.map((x) => ({
        projectId: x.projectId,
        projectName: x.projectName,
        success: x.success,
        action: 'merge',
        status: 'done' as const,
        source: x.source,
        target: x.target,
        mrUrl: x.mrUrl,
        mrIid: x.mrIid,
        error: x.error,
      }));

    switch (action) {
      case 'merge': {
        const opts =
          cfg.mrMode === 'chained'
            ? {
                mode: 'chained' as const,
                chainSteps: cfg.chainSteps ?? [],
                title: cfg.title ?? '',
                description: cfg.description,
                reviewer_ids: cfg.reviewer_ids,
                assignee_ids: cfg.assignee_ids,
                labels: cfg.labels,
                milestone_id: cfg.milestone_id,
              }
            : {
                mode: 'single' as const,
                branchMode: cfg.branchMode ?? 'same',
                source: cfg.source ?? '',
                target: cfg.target ?? '',
                perProject: cfg.perProject,
                title: cfg.title ?? '',
                description: cfg.description,
                reviewer_ids: cfg.reviewer_ids,
                assignee_ids: cfg.assignee_ids,
                labels: cfg.labels,
                milestone_id: cfg.milestone_id,
              };
        return mapMr(
          await createMergeRequests(client, projectIds, nameOf, opts, batch),
        );
      }
      case 'tag':
        return mapBatch(
          await createTags(
            client,
            projectIds,
            nameOf,
            {
              tag_name: cfg.tagName ?? '',
              ref: cfg.ref ?? 'main',
              message: cfg.tagMsg,
            },
            batch,
          ),
        );
      case 'branch':
        return mapBatch(
          await createBranches(
            client,
            projectIds,
            nameOf,
            { branch: cfg.branchName ?? '', ref: cfg.ref ?? 'main' },
            batch,
          ),
        );
      case 'delete-branch':
        return mapBatch(
          await deleteBranches(
            client,
            projectIds,
            nameOf,
            cfg.deleteBranchName ?? '',
            batch,
          ),
        );
      case 'protect':
        return mapBatch(
          await protectBranches(
            client,
            projectIds,
            nameOf,
            {
              name: cfg.protectName ?? '',
              merge_access_level: cfg.mergeAccessLevel,
              push_access_level: cfg.pushAccessLevel,
              allow_force_push: cfg.allowForcePush,
            },
            batch,
          ),
        );
      case 'unprotect':
        return mapBatch(
          await unprotectBranches(
            client,
            projectIds,
            nameOf,
            cfg.protectName ?? '',
            batch,
          ),
        );
      case 'pipeline':
        return mapBatch(
          await triggerPipelines(
            client,
            projectIds,
            nameOf,
            {
              ref: cfg.pipelineRef ?? cfg.ref ?? 'main',
              variables: cfg.pipelineVariables,
            },
            batch,
          ),
        );
      case 'release':
        return mapBatch(
          await createReleases(
            client,
            projectIds,
            nameOf,
            {
              tag_name: cfg.tagName ?? '',
              name: cfg.releaseName ?? cfg.tagName ?? '',
              description: cfg.releaseDesc,
              ref: cfg.releaseRef ?? cfg.ref,
            },
            batch,
          ),
        );
      case 'close-mr':
        return mapBatch(
          await closeOrMergeMRs(
            client,
            projectIds,
            nameOf,
            { mrIid: cfg.mrIid ?? 0, action: cfg.mrAction ?? 'merge' },
            batch,
          ),
        );
      case 'update-labels':
        return mapBatch(
          await updateMRLabelsBatch(
            client,
            projectIds,
            nameOf,
            {
              mrIid: cfg.mrIid ?? 0,
              action: cfg.labelAction ?? 'add',
              labels: cfg.labels ?? [],
            },
            batch,
          ),
        );
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
