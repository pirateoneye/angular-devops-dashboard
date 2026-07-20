// gitlab-api.ts
// Framework-agnostic GitLab REST v4 client. All HTTP access goes through the
// injected GitLabHttp interface so it can be unit-tested with a mock and also
// used from Angular (via the adapter in GitLabService) without changes.

export interface GitLabHttp {
  get<T = unknown>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T>;
  put<T = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T>;
  delete<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<T>;
}

/** Typed error. The batch layer catches it and records a readable `.message`. */
export class GitLabApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'GitLabApiError';
    this.status = status;
    this.body = body;
  }
}

// --- Domain shapes ---------------------------------------------------------

export interface Group {
  id: number;
  name: string;
}
export interface Project {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
}
export interface Branch {
  name: string;
  protected: boolean;
}
export interface Member {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
}
export interface Label {
  id: number;
  name: string;
  color: string;
}
export interface Milestone {
  id: number;
  title: string;
  due_date: string | null;
}
export interface MergeRequestResponse {
  iid: number;
  title: string;
  state: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
  description?: string;
  author?: { id: number; name: string; username: string };
  assignees?: { id: number; name: string; username: string }[];
  reviewers?: { id: number; name: string; username: string }[];
  labels?: string[];
  milestone?: { id: number; title: string };
  created_at?: string;
  updated_at?: string;
  merged_at?: string | null;
  draft?: boolean;
  user_notes_count?: number;
  upvotes?: number;
  downvotes?: number;
  merge_status?: string;
  has_conflicts?: boolean;
  blocking_discussions_resolved?: boolean;
  approvals_before_merge?: number;
  approved_by?: { id: number; name: string; username: string }[];
  changes_count?: string;
  head_pipeline?: {
    id: number;
    status: string;
    web_url: string;
    ref: string;
  };
}

/** Human-readable MR state → label mapping (Indonesian). */
export function mrStateLabel(state: string): string {
  const map: Record<string, string> = {
    opened: 'Terbuka',
    closed: 'Ditutup',
    merged: 'Digabung',
    locked: 'Terkunci',
  };
  return map[state] ?? state;
}
export interface Pipeline {
  id: number;
  status: string;
  web_url: string;
  ref: string;
  sha?: string;
  created_at?: string;
  updated_at?: string;
  duration?: number;
  user?: { name: string; username: string };
  source?: string;
}

/** Human-readable pipeline status → color token mapping. */
export const PIPELINE_STATUS_COLORS: Record<string, string> = {
  success: 'var(--msv-success)',
  failed: 'var(--msv-error)',
  running: 'var(--msv-primary)',
  pending: 'var(--msv-warning)',
  canceled: 'var(--msv-text-muted)',
  skipped: 'var(--msv-text-muted)',
  manual: 'var(--msv-warning)',
  created: 'var(--msv-text-muted)',
};

/** Map a pipeline status to a human-readable Indonesian label. */
export function pipelineStatusLabel(status: string): string {
  const map: Record<string, string> = {
    success: 'Sukses',
    failed: 'Gagal',
    running: 'Berjalan',
    pending: 'Menunggu',
    canceled: 'Dibatalkan',
    skipped: 'Dilewati',
    manual: 'Manual',
    created: 'Dibuat',
  };
  return map[status] ?? status;
}
interface Release {
  tag_name: string;
  name: string;
  description: string;
  assets: { links: { name: string; url: string }[] };
}

/** Repository tag. Date lives on `commit.committed_date`; `created_at` is the tag's own timestamp. */
export interface GitLabTag {
  name: string;
  message: string | null;
  target: string;
  created_at: string;
  commit: {
    id: string;
    short_id: string;
    message: string;
    author_name: string;
    authored_date: string;
    committed_date?: string;
    created_at?: string;
  };
}

const PER_PAGE = 100;

export type MrAction = 'merge' | 'close';
export type LabelAction = 'add' | 'remove';

export interface CreateMrOptions {
  source_branch: string;
  target_branch: string;
  title: string;
  description?: string;
  reviewer_ids?: number[];
  assignee_ids?: number[];
  labels?: string[];
  milestone_id?: number;
}
export interface CreateTagOptions {
  tag_name: string;
  ref: string;
  message?: string;
}
export interface CreateBranchOptions {
  branch: string;
  ref: string;
}
export interface ProtectBranchOptions {
  name: string;
  merge_access_level?: number; // default 40 (Maintainer)
  push_access_level?: number; // default 40
  allow_force_push?: boolean;
}
export interface TriggerPipelineOptions {
  ref: string;
  variables?: Record<string, string>;
}
export interface CreateReleaseOptions {
  tag_name: string;
  name: string;
  description?: string;
  ref?: string;
}
export interface ListTagsOptions {
  orderBy?: 'version' | 'created_at' | 'updated_at';
  sort?: 'desc' | 'asc';
  perPage?: number;
}

// --- Error message extraction ----------------------------------------------

/** GitLab error bodies are `{ message: string | string[] }` or `{ error: string }`. */
function gitLabMessageFromBody(
  status: number,
  body: unknown,
): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const msg = b['message'] ?? b['error'];
  if (typeof msg === 'string') return `${status}: ${msg}`;
  if (Array.isArray(msg) && msg.length) return `${status}: ${msg.join('; ')}`;
  return undefined;
}

/** Convert any thrown error into a readable string. Works for GitLabApiError,
 *  Angular HttpErrorResponse (duck-typed: has `.status` + `.error`), and plain Errors. */
export function extractErrorMessage(e: unknown): string {
  if (e instanceof GitLabApiError) {
    return gitLabMessageFromBody(e.status, e.body) ?? e.message;
  }
  if (e && typeof e === 'object' && 'status' in e) {
    const status = (e as { status: number }).status;
    const body = (e as { error?: unknown }).error;
    const parsed = gitLabMessageFromBody(status, body);
    if (parsed) return parsed;
  }
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}

/** Best-effort "when" date for a tag: prefer commit.committed_date, fall back to created_at. */
export function tagDate(tag: GitLabTag | null | undefined): string | null {
  if (!tag) return null;
  return (
    tag.commit?.committed_date ??
    tag.commit?.created_at ??
    tag.created_at ??
    null
  );
}

// --- Client ----------------------------------------------------------------

export class GitLabClient {
  private readonly authHeaders: () => Record<string, string>;

  constructor(
    private readonly http: GitLabHttp,
    private readonly baseUrl: string,
    token: string,
  ) {
    this.authHeaders = () => ({ 'PRIVATE-TOKEN': token });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** Walk `?per_page=100&page=N` until a page returns fewer than PER_PAGE items. */
  private async paginate<T>(path: string): Promise<T[]> {
    const sep = path.includes('?') ? '&' : '?';
    const out: T[] = [];
    let page = 1;
    for (;;) {
      const data = await this.http.get<T[]>(
        this.url(`${path}${sep}per_page=${PER_PAGE}&page=${page}`),
        this.authHeaders(),
      );
      out.push(...data);
      if (!Array.isArray(data) || data.length < PER_PAGE) break;
      page++;
    }
    return out;
  }

  // -- auth
  validateToken(): Promise<unknown> {
    return this.http.get(this.url('/user'), this.authHeaders());
  }

  // -- groups discovery (top-level groups visible to the current token)
  listGroups(
    opts: { topLevel?: boolean; search?: string } = {},
  ): Promise<Group[]> {
    const params = new URLSearchParams({ per_page: String(PER_PAGE) });
    if (opts.topLevel) params.set('top_level_only', 'true');
    if (opts.search) params.set('search', opts.search);
    return this.paginate<Group>(`/groups?${params.toString()}`);
  }

  // -- groups / projects (paginated)
  listGroupProjects(
    gid: number,
    opts: { includeSubgroups?: boolean } = {},
  ): Promise<Project[]> {
    const params = opts.includeSubgroups ? '?include_subgroups=true' : '';
    return this.paginate<Project>(`/groups/${gid}/projects${params}`);
  }

  // -- per-project metadata (paginated)
  listProjectBranches(pid: number): Promise<Branch[]> {
    return this.paginate<Branch>(`/projects/${pid}/repository/branches`);
  }
  listProjectTags(
    pid: number,
    opts: ListTagsOptions = {},
  ): Promise<GitLabTag[]> {
    const orderBy = opts.orderBy ?? 'version';
    const sort = opts.sort ?? 'desc';
    const perPage = opts.perPage ?? 20;
    // order_by=version sorts semver-style; per_page capped at 100 by GitLab.
    return this.http.get<GitLabTag[]>(
      this.url(
        `/projects/${pid}/repository/tags?order_by=${orderBy}&sort=${sort}&per_page=${perPage}`,
      ),
      this.authHeaders(),
    );
  }
  listProjectMembers(pid: number): Promise<Member[]> {
    return this.paginate<Member>(`/projects/${pid}/members/all`);
  }
  listProjectLabels(pid: number): Promise<Label[]> {
    return this.paginate<Label>(`/projects/${pid}/labels`);
  }
  listProjectMilestones(pid: number): Promise<Milestone[]> {
    return this.paginate<Milestone>(`/projects/${pid}/milestones?state=active`);
  }
  listProjectMergeRequests(
    pid: number,
    opts: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      perPage?: number;
      sort?: 'asc' | 'desc';
      orderBy?: 'created_at' | 'updated_at' | 'title';
      labels?: string[];
    } = {},
  ): Promise<MergeRequestResponse[]> {
    const params = new URLSearchParams();
    params.set('state', opts.state ?? 'all');
    params.set('per_page', String(opts.perPage ?? 20));
    params.set('order_by', opts.orderBy ?? 'updated_at');
    params.set('sort', opts.sort ?? 'desc');
    if (opts.labels?.length) params.set('labels', opts.labels.join(','));
    return this.http.get<MergeRequestResponse[]>(
      this.url(`/projects/${pid}/merge_requests?${params.toString()}`),
      this.authHeaders(),
    );
  }

  /** Get a single MR with full details (approvals, labels, pipeline). */
  getMergeRequest(pid: number, iid: number): Promise<MergeRequestResponse> {
    return this.http.get<MergeRequestResponse>(
      this.url(`/projects/${pid}/merge_requests/${iid}`),
      this.authHeaders(),
    );
  }

  /** List approvals for an MR. */
  listMergeRequestApprovals(
    pid: number,
    iid: number,
  ): Promise<{ id: number; iid: number; user_ids: number[]; approved_by: { user: { id: number; name: string; username: string } }[]; approved?: boolean; approvals_required?: number; approvals_left?: number }> {
    return this.http.get(
      this.url(`/projects/${pid}/merge_requests/${iid}/approvals`),
      this.authHeaders(),
    );
  }

  /** Approve an MR (optionally with a SHA pin). */
  approveMergeRequest(
    pid: number,
    iid: number,
    sha?: string,
  ): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (sha) body['sha'] = sha;
    return this.http.post(
      this.url(`/projects/${pid}/merge_requests/${iid}/approve`),
      body,
      this.authHeaders(),
    );
  }

  /** Revoke approval on an MR. */
  unapproveMergeRequest(pid: number, iid: number): Promise<unknown> {
    return this.http.delete(
      this.url(`/projects/${pid}/merge_requests/${iid}/unapprove`),
      this.authHeaders(),
    );
  }

  // -- mutations
  createMergeRequest(
    pid: number,
    opts: CreateMrOptions,
  ): Promise<MergeRequestResponse> {
    const body: Record<string, unknown> = {
      source_branch: opts.source_branch,
      target_branch: opts.target_branch,
      title: opts.title,
      description: opts.description ?? '',
    };
    if (opts.reviewer_ids && opts.reviewer_ids.length)
      body['reviewer_ids'] = opts.reviewer_ids;
    if (opts.assignee_ids && opts.assignee_ids.length)
      body['assignee_ids'] = opts.assignee_ids;
    if (opts.labels && opts.labels.length)
      body['labels'] = opts.labels.join(',');
    if (opts.milestone_id) body['milestone_id'] = opts.milestone_id;
    return this.http.post<MergeRequestResponse>(
      this.url(`/projects/${pid}/merge_requests`),
      body,
      this.authHeaders(),
    );
  }

  createTag(pid: number, opts: CreateTagOptions): Promise<unknown> {
    const body = {
      tag_name: opts.tag_name,
      ref: opts.ref,
      message: opts.message ?? '',
    };
    return this.http.post(
      this.url(`/projects/${pid}/repository/tags`),
      body,
      this.authHeaders(),
    );
  }

  createBranch(pid: number, opts: CreateBranchOptions): Promise<unknown> {
    const body = { branch: opts.branch, ref: opts.ref };
    return this.http.post(
      this.url(`/projects/${pid}/repository/branches`),
      body,
      this.authHeaders(),
    );
  }

  deleteBranch(pid: number, name: string): Promise<unknown> {
    return this.http.delete(
      this.url(
        `/projects/${pid}/repository/branches/${encodeURIComponent(name)}`,
      ),
      this.authHeaders(),
    );
  }

  protectBranch(pid: number, opts: ProtectBranchOptions): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('name', opts.name);
    params.set('merge_access_level', String(opts.merge_access_level ?? 40));
    params.set('push_access_level', String(opts.push_access_level ?? 40));
    if (opts.allow_force_push !== undefined)
      params.set('allow_force_push', String(opts.allow_force_push));
    return this.http.post(
      this.url(`/projects/${pid}/protected_branches?${params.toString()}`),
      {},
      this.authHeaders(),
    );
  }

  unprotectBranch(pid: number, name: string): Promise<unknown> {
    return this.http.delete(
      this.url(
        `/projects/${pid}/protected_branches/${encodeURIComponent(name)}`,
      ),
      this.authHeaders(),
    );
  }

  triggerPipeline(
    pid: number,
    opts: TriggerPipelineOptions,
  ): Promise<Pipeline> {
    const body: Record<string, unknown> = { ref: opts.ref };
    if (opts.variables) {
      body['variables'] = Object.entries(opts.variables).map(
        ([key, value]) => ({ key, value }),
      );
    }
    return this.http.post<Pipeline>(
      this.url(`/projects/${pid}/pipeline`),
      body,
      this.authHeaders(),
    );
  }

  createRelease(pid: number, opts: CreateReleaseOptions): Promise<Release> {
    const body: Record<string, unknown> = {
      tag_name: opts.tag_name,
      name: opts.name,
      description: opts.description ?? '',
    };
    if (opts.ref) body['ref'] = opts.ref;
    return this.http.post<Release>(
      this.url(`/projects/${pid}/releases`),
      body,
      this.authHeaders(),
    );
  }

  mergeMR(pid: number, iid: number): Promise<unknown> {
    return this.http.put(
      this.url(`/projects/${pid}/merge_requests/${iid}/merge`),
      {},
      this.authHeaders(),
    );
  }

  closeMR(pid: number, iid: number): Promise<unknown> {
    return this.http.put(
      this.url(`/projects/${pid}/merge_requests/${iid}`),
      { state_event: 'close' },
      this.authHeaders(),
    );
  }

  updateMRLabels(
    pid: number,
    iid: number,
    action: LabelAction,
    labels: string[],
  ): Promise<unknown> {
    if (!iid) throw new Error('No MR selected');
    if (!labels.length) throw new Error('No labels selected');
    const body: Record<string, string> =
      action === 'add'
        ? { add_labels: labels.join(',') }
        : { remove_labels: labels.join(',') };
    return this.http.put(
      this.url(`/projects/${pid}/merge_requests/${iid}`),
      body,
      this.authHeaders(),
    );
  }
  // -- pipelines (per-project, paginated)
  listProjectPipelines(
    pid: number,
    opts: { perPage?: number; ref?: string; sort?: 'asc' | 'desc' } = {},
  ): Promise<Pipeline[]> {
    const params = new URLSearchParams({ per_page: String(opts.perPage ?? 20) });
    if (opts.ref) params.set('ref', opts.ref);
    params.set('sort', opts.sort ?? 'desc');
    return this.http.get<Pipeline[]>(
      this.url(`/projects/${pid}/pipelines?${params.toString()}`),
      this.authHeaders(),
    );
  }
}
