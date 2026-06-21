// gitlab-batch.ts
// Multi-project orchestration built on GitLabClient. Pure / async / no Angular.
// Each batch returns one result per project so callers can render a report.

import {
    GitLabClient,
    GitLabApiError,
    CreateMrOptions,
    LabelAction,
    MrAction,
    ProtectBranchOptions,
    TriggerPipelineOptions,
    CreateReleaseOptions,
    extractErrorMessage,
} from './gitlab-api';

export type ProjectNameResolver = (pid: number) => string;

export interface MrResult {
    projectId: number;
    projectName: string;
    source: string;
    target: string;
    success: boolean;
    mrUrl?: string;
    mrIid?: number;
    error?: string;
}

export interface BatchResult {
    projectId: number;
    projectName: string;
    success: boolean;
    action: string;
    error?: string;
    detail?: string;
}

export interface MrPreviewResult {
    projectId: number;
    projectName: string;
    ok: boolean;
    reasons: string[];
    detail: string;
}

export type MrMode = 'single' | 'chained';
export type BranchMode = 'same' | 'per-project';

export const DEFAULT_CONCURRENCY = 3;

export interface SingleMrOptions {
    mode: 'single';
    branchMode: BranchMode;
    source: string;
    target: string;
    title: string;
    description?: string;
    perProject?: Map<number, { source: string; target: string }>;
    reviewer_ids?: number[];
    assignee_ids?: number[];
    labels?: string[];
    milestone_id?: number;
}
export interface ChainedMrOptions {
    mode: 'chained';
    chainSteps: string[];
    title: string;
    description?: string;
    reviewer_ids?: number[];
    assignee_ids?: number[];
    labels?: string[];
    milestone_id?: number;
}
export type CreateMrsOptions = SingleMrOptions | ChainedMrOptions;
export interface BatchOptions { concurrency?: number; }

// --- helpers ---------------------------------------------------------------

/** Run `fn` over `items` with a max in-flight limit, preserving input order in the output. */
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;
    const n = Math.max(1, Math.floor(limit) || 1);
    async function worker(): Promise<void> {
        while (true) {
            const i = cursor++;
            if (i >= items.length) return;
            results[i] = await fn(items[i], i);
        }
    }
    const workers: Promise<void>[] = [];
    for (let w = 0; w < Math.min(n, items.length); w++) workers.push(worker());
    await Promise.all(workers);
    return results;
}

// --- Merge requests --------------------------------------------------------

export async function createMergeRequests(
    client: GitLabClient,
    projectIds: number[],
    nameOf: ProjectNameResolver,
    opts: CreateMrsOptions,
    batch: BatchOptions = {},
): Promise<MrResult[]> {
    const limit = batch.concurrency ?? DEFAULT_CONCURRENCY;
    const singleProject = projectIds.length === 1;
    const base: Pick<CreateMrOptions, 'reviewer_ids' | 'assignee_ids' | 'labels' | 'milestone_id'> = {
        reviewer_ids: opts.reviewer_ids,
        assignee_ids: opts.assignee_ids,
        labels: opts.labels,
        milestone_id: opts.milestone_id,
    };

    const perProject = mapWithConcurrency(projectIds, limit, async (pid): Promise<MrResult[]> => {
        if (opts.mode === 'single') {
            let source = opts.source;
            let target = opts.target;
            if (opts.branchMode === 'per-project') {
                const cfg = opts.perProject?.get(pid);
                if (!cfg) return []; // unconfigured project is skipped
                source = cfg.source;
                target = cfg.target;
            }
            return [await createOneMr(client, pid, nameOf(pid), source, target, opts.title, opts.description, singleProject, base)];
        }
        // chained: sequential within the project (each step may depend on the previous)
        const results: MrResult[] = [];
        const steps = opts.chainSteps;
        for (let i = 0; i < steps.length - 1; i++) {
            const r = await createOneMr(client, pid, nameOf(pid), steps[i], steps[i + 1], opts.title, opts.description, singleProject, base);
            results.push(r);
            if (!r.success) break;
        }
        return results;
    });
    return (await perProject).flat();
}

async function createOneMr(
    client: GitLabClient,
    pid: number,
    projectName: string,
    source: string,
    target: string,
    title: string,
    description: string | undefined,
    singleProject: boolean,
    base: Pick<CreateMrOptions, 'reviewer_ids' | 'assignee_ids' | 'labels' | 'milestone_id'>,
): Promise<MrResult> {
    try {
        const opts: CreateMrOptions = {
            source_branch: source,
            target_branch: target,
            title: title || `Merge ${source} into ${target}`,
            description,
            ...(singleProject ? base : {}),
        };
        const mr = await client.createMergeRequest(pid, opts);
        return { projectId: pid, projectName, source, target, success: true, mrUrl: mr.web_url, mrIid: mr.iid };
    } catch (e) {
        return { projectId: pid, projectName, source, target, success: false, error: extractErrorMessage(e) };
    }
}

// --- Generic simple-action batch ------------------------------------------

async function runSimple(
    projectIds: number[],
    nameOf: ProjectNameResolver,
    action: string,
    fn: (pid: number) => Promise<unknown>,
    detailFor?: (pid: number) => string,
    batch: BatchOptions = {},
): Promise<BatchResult[]> {
    const limit = batch.concurrency ?? DEFAULT_CONCURRENCY;
    return mapWithConcurrency(projectIds, limit, async (pid): Promise<BatchResult> => {
        try {
            await fn(pid);
            return { projectId: pid, projectName: nameOf(pid), success: true, action, detail: detailFor?.(pid) };
        } catch (e) {
            return { projectId: pid, projectName: nameOf(pid), success: false, action, error: extractErrorMessage(e) };
        }
    });
}

export interface CreateTagBatchOptions { tag_name: string; ref: string; message?: string; }
export function createTags(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: CreateTagBatchOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'tag', (pid) => client.createTag(pid, opts), () => `${opts.tag_name} @ ${opts.ref}`, batch);
}

export interface CreateBranchBatchOptions { branch: string; ref: string; }
export function createBranches(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: CreateBranchBatchOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'branch', (pid) => client.createBranch(pid, opts), () => `${opts.branch} @ ${opts.ref}`, batch);
}

export function deleteBranches(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, branch: string, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'delete-branch', (pid) => client.deleteBranch(pid, branch), () => branch, batch);
}

export function protectBranches(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: ProtectBranchOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'protect-branch', (pid) => client.protectBranch(pid, opts), () => opts.name, batch);
}

export function unprotectBranches(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, branch: string, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'unprotect-branch', (pid) => client.unprotectBranch(pid, branch), () => branch, batch);
}

export function triggerPipelines(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: TriggerPipelineOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(
        ids, nameOf, 'trigger-pipeline',
        async (pid) => { const p = await client.triggerPipeline(pid, opts); return p; },
        () => opts.ref,
        batch,
    );
}

export function createReleases(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: CreateReleaseOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(ids, nameOf, 'release', (pid) => client.createRelease(pid, opts), () => opts.tag_name, batch);
}

export interface CloseOrMergeOptions { mrIid: number; action: MrAction; }
export function closeOrMergeMRs(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: CloseOrMergeOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    const fn = opts.action === 'merge'
        ? (pid: number) => client.mergeMR(pid, opts.mrIid)
        : (pid: number) => client.closeMR(pid, opts.mrIid);
    return runSimple(ids, nameOf, `close-mr:${opts.action}`, fn, () => `MR !${opts.mrIid}`, batch);
}

export interface UpdateLabelsOptions { mrIid: number; action: LabelAction; labels: string[]; }
export function updateMRLabelsBatch(client: GitLabClient, ids: number[], nameOf: ProjectNameResolver, opts: UpdateLabelsOptions, batch: BatchOptions = {}): Promise<BatchResult[]> {
    return runSimple(
        ids, nameOf, 'update-labels',
        (pid) => client.updateMRLabels(pid, opts.mrIid, opts.action, opts.labels),
        () => `${opts.action} ${opts.labels.join(',')}`,
        batch,
    );
}

// --- Dry-run preview for MR creation --------------------------------------

export interface MrPreviewOptions {
    mode: MrMode;
    source?: string;
    target?: string;
    perProject?: Map<number, { source: string; target: string }>;
    chainSteps?: string[];
}

/** For each project, check that the required branches exist and (for single mode)
 *  whether an open MR source->target already exists. Does NOT create anything. */
export async function previewMergeRequests(
    client: GitLabClient,
    projectIds: number[],
    nameOf: ProjectNameResolver,
    opts: MrPreviewOptions,
    batch: BatchOptions = {},
): Promise<MrPreviewResult[]> {
    const limit = batch.concurrency ?? DEFAULT_CONCURRENCY;
    return mapWithConcurrency(projectIds, limit, async (pid): Promise<MrPreviewResult> => {
        const reasons: string[] = [];
        let detail = '';
        try {
            const [branches, openMrs] = await Promise.all([
                client.listProjectBranches(pid).catch(() => [] as { name: string }[]),
                client.listOpenMergeRequests(pid).catch(() => [] as { source_branch: string; target_branch: string }[]),
            ]);
            const branchNames = new Set(branches.map((b) => b.name));

            if (opts.mode === 'single') {
                let source = opts.source ?? '';
                let target = opts.target ?? '';
                if (opts.perProject?.has(pid)) {
                    source = opts.perProject.get(pid)!.source;
                    target = opts.perProject.get(pid)!.target;
                }
                detail = `${source} -> ${target}`;
                if (!branchNames.has(source)) reasons.push(`source branch '${source}' not found`);
                if (!branchNames.has(target)) reasons.push(`target branch '${target}' not found`);
                const dup = openMrs.some((m) => m.source_branch === source && m.target_branch === target);
                if (dup) reasons.push(`open MR ${source} -> ${target} already exists`);
            } else {
                const steps = opts.chainSteps ?? [];
                detail = steps.join(' -> ');
                const missing = steps.filter((s) => !branchNames.has(s));
                if (missing.length) reasons.push(`missing branches: ${missing.join(', ')}`);
            }
        } catch (e) {
            reasons.push(extractErrorMessage(e));
        }
        return { projectId: pid, projectName: nameOf(pid), ok: reasons.length === 0, reasons, detail };
    });
}

// --- helpers used by tests + component ------------------------------------

export function summarize(results: { success: boolean }[]): { ok: number; fail: number; total: number } {
    const ok = results.filter((r) => r.success).length;
    return { ok, fail: results.length - ok, total: results.length };
}

export { GitLabApiError };
