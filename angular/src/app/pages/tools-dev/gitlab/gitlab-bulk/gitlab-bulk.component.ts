import {
    Component,
    signal,
    inject,
    computed,
    PLATFORM_ID,
    ChangeDetectionStrategy,
    effect,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GitLabClient } from './gitlab-api';
import { GitLabHttp } from './gitlab-api';
import {
    createMergeRequests,
    createTags,
    createBranches,
    deleteBranches,
    closeOrMergeMRs,
    updateMRLabelsBatch,
    protectBranches,
    unprotectBranches,
    triggerPipelines,
    createReleases,
    previewMergeRequests,
    summarize,
    type BatchResult,
    type CreateMrsOptions,
    type MrPreviewResult,
} from './gitlab-batch';
import { firstValueFrom } from 'rxjs';

// ============================================================================
// TYPES
// ============================================================================

interface Group {
    id: number;
    name: string;
}

interface Project {
    id: number;
    name: string;
    path_with_namespace: string;
    web_url: string;
}

interface Log {
    id: number;
    time: Date;
    msg: string;
    type: 'ok' | 'err' | 'info';
}

interface Member {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
}

interface Label {
    id: number;
    name: string;
    color: string;
}

interface Milestone {
    id: number;
    title: string;
    due_date: string | null;
}

interface Branch {
    name: string;
    protected: boolean;
}

interface MergeRequestResponse {
    iid: number;
    title: string;
    state: string;
    web_url: string;
    source_branch: string;
    target_branch: string;
}

interface MRResult {
    projectId: number;
    projectName: string;
    source: string;
    target: string;
    success: boolean;
    mrUrl?: string;
    mrIid?: number;
    error?: string;
}

interface ChainTemplate {
    name: string;
    branches: string[];
}

interface BranchValidation {
    valid: boolean;
    sourceValid: boolean;
    targetValid: boolean;
    error?: string;
}

interface PerProjectBranchConfig {
    source: string;
    target: string;
}

type Action = 'merge' | 'tag' | 'branch' | 'delete-branch' | 'close-mr' | 'update-labels' | 'protect-branch' | 'unprotect-branch' | 'trigger-pipeline' | 'release';

interface ActionDef {
    id: Action;
    name: string;
    icon: string;
    desc: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../module/material.module';
import { MsvFormsModule } from '../../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, MsvFormsModule, MatSlideToggleModule, InfiniteScrollModule],
    selector: 'app-gitlab-bulk',
    templateUrl: './gitlab-bulk.component.html',
    styleUrls: ['./gitlab-bulk.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitlabBulkComponent {
    private readonly http = inject(HttpClient);
    private readonly fb = inject(FormBuilder);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private logCounter = 0;

    // Config
    readonly BASE_URL = 'https://gitlab.com/api/v4';

    readonly GROUPS: Group[] = [
        { id: 991, name: 'task1' },
        { id: 27632, name: 'task2' },
        { id: 1413, name: 'task3' },
        { id: 762, name: 'task4' },
    ];

    readonly ACTIONS: ActionDef[] = [
        { id: 'merge', name: 'Merge Request', icon: '1', desc: 'Create MR from source to target' },
        { id: 'tag', name: 'Create Tag', icon: '2', desc: 'Tag a branch with version' },
        { id: 'branch', name: 'Create Branch', icon: '3', desc: 'Create new branch from ref' },
        { id: 'delete-branch', name: 'Delete Branch', icon: '4', desc: 'Remove branch from projects' },
        { id: 'close-mr', name: 'Close/Merge MR', icon: '5', desc: 'Close or merge open MRs' },
        { id: 'update-labels', name: 'Update Labels', icon: '6', desc: 'Add/remove labels on MRs' },
        { id: 'protect-branch', name: 'Protect Branch', icon: '7', desc: 'Protect a branch on projects' },
        { id: 'unprotect-branch', name: 'Unprotect Branch', icon: '8', desc: 'Remove branch protection' },
        { id: 'trigger-pipeline', name: 'Trigger Pipeline', icon: '9', desc: 'Run CI/CD pipeline on a ref' },
        { id: 'release', name: 'Create Release', icon: 'R', desc: 'Create a release from a ref/tag' },
    ];

    readonly CHAIN_TEMPLATES: ChainTemplate[] = [
        { name: 'UAT1 -> Staging -> Master', branches: ['UAT1', 'staging', 'master'] },
        { name: 'Develop -> Main', branches: ['develop', 'main'] },
        { name: 'Feature -> Develop -> Main', branches: ['feature', 'develop', 'main'] },
        { name: 'Hotfix -> Main -> Develop', branches: ['hotfix', 'main', 'develop'] },
    ];

    // ============================================================================
    // STATE - Core
    // ============================================================================

    readonly token = signal('');
    readonly loading = signal(false);
    readonly showLogin = signal(true);

    readonly groupId = signal<number | null>(null);
    readonly projects = signal<Project[]>([]);
    readonly search = signal('');
    readonly selected = signal<Set<number>>(new Set());
    readonly selectedAction = signal<Action>('merge');
    readonly logs = signal<Log[]>([]);

    // ============================================================================
    // STATE - Branch Configuration
    // ============================================================================

    readonly branchMode = signal<'same' | 'per-project'>('same');
    readonly projectBranches = signal<Map<number, Branch[]>>(new Map());
    readonly branchValidation = signal<Map<number, BranchValidation>>(new Map());
    readonly perProjectConfig = signal<Map<number, PerProjectBranchConfig>>(new Map());
    readonly validatingBranches = signal(false);

    // ============================================================================
    // STATE - Chained MRs
    // ============================================================================

    readonly mrMode = signal<'single' | 'chained'>('single');
    readonly chainSteps = signal<string[]>(['develop', 'main']);
    readonly newChainBranch = signal('');

    // ============================================================================
    // STATE - Results Popup
    // ============================================================================

    readonly mrResults = signal<MRResult[]>([]);
    readonly showResultsPopup = signal(false);
    readonly previewResults = signal<MrPreviewResult[]>([]);
    readonly showPreviewPopup = signal(false);
    readonly previewReadyCount = computed(() => this.previewResults().filter((r) => r.ok).length);
    readonly previewIssueCount = computed(() => this.previewResults().length - this.previewReadyCount());

    // ============================================================================
    // STATE - Single Project Metadata
    // ============================================================================

    readonly members = signal<Member[]>([]);
    readonly labels = signal<Label[]>([]);
    readonly milestones = signal<Milestone[]>([]);
    readonly branches = signal<Branch[]>([]);
    readonly openMRs = signal<MergeRequestResponse[]>([]);
    readonly loadingMetadata = signal(false);

    // Selected metadata for MR creation
    readonly selectedReviewers = signal<Set<number>>(new Set());
    readonly selectedAssignees = signal<Set<number>>(new Set());
    readonly selectedLabels = signal<Set<string>>(new Set());
    readonly selectedMilestone = signal<number | null>(null);
    readonly selectedTargetBranch = signal<string>('');

    // Dropdowns visibility
    readonly showReviewersDropdown = signal(false);
    readonly showAssigneesDropdown = signal(false);
    readonly showLabelsDropdown = signal(false);

    // ============================================================================
    // FORMS
    // ============================================================================

    readonly loginForm = this.fb.group({
        token: ['', [Validators.required, Validators.minLength(10)]],
    });

    readonly actionForm = this.fb.group({
        // MR fields
        source: ['develop'],
        target: ['main'],
        title: [''],
        desc: [''],
        // Tag fields
        tagName: [''],
        tagMsg: [''],
        // Branch fields
        branchName: [''],
        // Delete branch
        deleteBranchName: [''],
        // Close/Merge MR
        mrIid: [null as number | null],
        mrAction: ['merge' as 'close' | 'merge'],
        // Update labels
        labelAction: ['add' as 'add' | 'remove'],
    });

    // ============================================================================
    // COMPUTED
    // ============================================================================

    readonly isAuth = computed(() => this.token().length > 0);
    readonly group = computed(() => this.GROUPS.find((g) => g.id === this.groupId()));

    readonly filtered = computed(() => {
        const term = this.search().toLowerCase();
        return this.projects().filter(
            (p) => p.name.toLowerCase().includes(term) || p.path_with_namespace.toLowerCase().includes(term)
        );
    });

    readonly maskedToken = computed(() => {
        const t = this.token();
        return t.length > 8 ? '********' + t.slice(-4) : '********';
    });

    readonly isSingleProject = computed(() => this.selected().size === 1);

    readonly selectedProjectId = computed(() => {
        if (this.isSingleProject()) {
            return [...this.selected()][0];
        }
        return null;
    });

    readonly allBranchesValid = computed(() => {
        const v = this.branchValidation();
        if (v.size === 0) return false;
        return [...v.values()].every((x) => x.valid);
    });

    readonly chainPreview = computed(() => {
        const steps = this.chainSteps();
        const preview: { source: string; target: string }[] = [];
        for (let i = 0; i < steps.length - 1; i++) {
            preview.push({ source: steps[i], target: steps[i + 1] });
        }
        return preview;
    });

    readonly canExecute = computed(() => {
        if (this.loading()) return false;
        if (this.selected().size === 0) return false;

        const action = this.selectedAction();

        // For MR action, require branch validation in 'same' mode
        if (action === 'merge' && this.branchMode() === 'same') {
            if (this.mrMode() === 'single') {
                return this.allBranchesValid();
            } else {
                // Chained mode - need validation for all chain steps
                return this.allBranchesValid();
            }
        }

        return true;
    });

    readonly successfulResults = computed(() => this.mrResults().filter((r) => r.success));
    readonly failedResults = computed(() => this.mrResults().filter((r) => !r.success));

    // ============================================================================
    // CONSTRUCTOR & EFFECTS
    // ============================================================================

    constructor() {
        // Effect to load metadata when single project is selected
        effect(() => {
            const pid = this.selectedProjectId();
            if (pid && this.isAuth()) {
                this.loadProjectMetadata(pid);
            } else {
                this.clearMetadata();
            }
        });

        // Effect to load branches when projects are selected
        effect(() => {
            const selectedIds = this.selected();
            if (selectedIds.size > 0 && this.isAuth() && this.selectedAction() === 'merge') {
                this.loadBranchesForSelected();
            }
        });
    }

    // ============================================================================
    // AUTH - Session Only (No localStorage)
    // ============================================================================

    async login(): Promise<void> {
        if (!this.loginForm.valid) return;
        this.loading.set(true);

        try {
            const t = this.loginForm.value.token!;
            const h = new HttpHeaders({ 'PRIVATE-TOKEN': t });
            await firstValueFrom(this.http.get(`${this.BASE_URL}/user`, { headers: h }));

            this.token.set(t);
            this.showLogin.set(false);
            this.log('Connected to GitLab', 'ok');
        } catch {
            this.log('Invalid token', 'err');
        } finally {
            this.loading.set(false);
        }
    }

    logout(): void {
        this.token.set('');
        this.projects.set([]);
        this.selected.set(new Set());
        this.groupId.set(null);
        this.clearMetadata();
        this.showLogin.set(true);
        this.log('Logged out', 'info');
    }

    // ============================================================================
    // GROUPS & PROJECTS
    // ============================================================================

    async selectGroup(id: number): Promise<void> {
        this.groupId.set(id);
        this.selected.set(new Set());
        this.search.set('');
        this.branchValidation.set(new Map());
        this.projectBranches.set(new Map());
        await this.loadProjects(id);
    }

    async loadProjects(gid: number): Promise<void> {
        this.loading.set(true);
        this.projects.set([]);

        try {
            const h = new HttpHeaders({ 'PRIVATE-TOKEN': this.token() });
            const data = await firstValueFrom(
                this.http.get<Project[]>(`${this.BASE_URL}/groups/${gid}/projects?per_page=100`, { headers: h })
            );
            this.projects.set(data);
            this.log(`Loaded ${data.length} projects`, 'ok');
        } catch {
            this.log('Failed to load projects', 'err');
        } finally {
            this.loading.set(false);
        }
    }

    onSearch(term: string): void {
        this.search.set(term);
    }

    toggle(id: number): void {
        const s = new Set(this.selected());
        s.has(id) ? s.delete(id) : s.add(id);
        this.selected.set(s);
        // Clear validation when selection changes
        this.branchValidation.set(new Map());
    }

    isSelected(id: number): boolean {
        return this.selected().has(id);
    }

    selectAll(): void {
        this.selected.set(new Set(this.filtered().map((p) => p.id)));
        this.branchValidation.set(new Map());
    }

    clearSelection(): void {
        this.selected.set(new Set());
        this.branchValidation.set(new Map());
        this.clearMetadata();
    }

    // ============================================================================
    // ACTIONS
    // ============================================================================

    setAction(a: Action): void {
        this.selectedAction.set(a);
        this.branchValidation.set(new Map());
    }

    // ============================================================================
    // BRANCH CONFIGURATION
    // ============================================================================

    setBranchMode(mode: 'same' | 'per-project'): void {
        this.branchMode.set(mode);
        this.branchValidation.set(new Map());
    }

    setMrMode(mode: 'single' | 'chained'): void {
        this.mrMode.set(mode);
        this.branchValidation.set(new Map());
    }

    // ============================================================================
    // CHAIN MANAGEMENT
    // ============================================================================

    applyTemplate(template: ChainTemplate): void {
        this.chainSteps.set([...template.branches]);
        this.branchValidation.set(new Map());
    }

    addChainStep(): void {
        const branch = this.newChainBranch().trim();
        if (branch) {
            this.chainSteps.update((steps) => [...steps, branch]);
            this.newChainBranch.set('');
            this.branchValidation.set(new Map());
        }
    }

    removeLastChainStep(): void {
        this.chainSteps.update((steps) => {
            if (steps.length > 2) {
                return steps.slice(0, -1);
            }
            return steps;
        });
        this.branchValidation.set(new Map());
    }

    updateChainStep(index: number, value: string): void {
        this.chainSteps.update((steps) => {
            const newSteps = [...steps];
            newSteps[index] = value;
            return newSteps;
        });
        this.branchValidation.set(new Map());
    }

    // ============================================================================
    // BRANCH FETCHING & VALIDATION
    // ============================================================================

    async loadBranchesForSelected(): Promise<void> {
        const ids: number[] = Array.from(this.selected());
        if (ids.length === 0) return;

        const branchesMap = new Map<number, Branch[]>();

        for (const pid of ids) {
            try {
                const h = new HttpHeaders({ 'PRIVATE-TOKEN': this.token() });
                const data = await firstValueFrom(
                    this.http.get<Branch[]>(`${this.BASE_URL}/projects/${pid}/repository/branches?per_page=100`, {
                        headers: h,
                    })
                );
                branchesMap.set(pid, data);
            } catch {
                branchesMap.set(pid, []);
            }
        }

        this.projectBranches.set(branchesMap);
    }

    async validateBranches(): Promise<void> {
        this.validatingBranches.set(true);
        const validation = new Map<number, BranchValidation>();
        const branches = this.projectBranches();

        // If branches not loaded yet, load them first
        if (branches.size === 0) {
            await this.loadBranchesForSelected();
        }

        const updatedBranches = this.projectBranches();

        if (this.mrMode() === 'single') {
            // Single MR mode - validate source and target
            const source = this.actionForm.value.source || '';
            const target = this.actionForm.value.target || '';

            for (const [pid, branchList] of updatedBranches) {
                const branchNames = branchList.map((b) => b.name);
                const sourceValid = branchNames.includes(source);
                const targetValid = branchNames.includes(target);

                validation.set(pid, {
                    valid: sourceValid && targetValid,
                    sourceValid,
                    targetValid,
                    error: !sourceValid
                        ? `Source '${source}' not found`
                        : !targetValid
                          ? `Target '${target}' not found`
                          : undefined,
                });
            }
        } else {
            // Chained mode - validate all steps in the chain
            const steps = this.chainSteps();

            for (const [pid, branchList] of updatedBranches) {
                const branchNames = branchList.map((b) => b.name);
                const missingBranches = steps.filter((step) => !branchNames.includes(step));

                if (missingBranches.length > 0) {
                    validation.set(pid, {
                        valid: false,
                        sourceValid: false,
                        targetValid: false,
                        error: `Missing: ${missingBranches.join(', ')}`,
                    });
                } else {
                    validation.set(pid, {
                        valid: true,
                        sourceValid: true,
                        targetValid: true,
                    });
                }
            }
        }

        this.branchValidation.set(validation);
        this.validatingBranches.set(false);

        const allValid = [...validation.values()].every((v) => v.valid);
        if (allValid) {
            this.log('All branches validated successfully', 'ok');
        } else {
            const failCount = [...validation.values()].filter((v) => !v.valid).length;
            this.log(`Branch validation failed for ${failCount} project(s)`, 'err');
        }
    }

    // ============================================================================
    // SINGLE PROJECT METADATA
    // ============================================================================

    async loadProjectMetadata(pid: number): Promise<void> {
        this.loadingMetadata.set(true);

        try {
            const h = new HttpHeaders({ 'PRIVATE-TOKEN': this.token() });

            // Fetch all metadata in parallel
            const [membersData, labelsData, milestonesData, branchesData, mrsData] = await Promise.all([
                firstValueFrom(this.http.get<Member[]>(`${this.BASE_URL}/projects/${pid}/members/all?per_page=100`, { headers: h })).catch(() => []),
                firstValueFrom(this.http.get<Label[]>(`${this.BASE_URL}/projects/${pid}/labels?per_page=100`, { headers: h })).catch(() => []),
                firstValueFrom(this.http.get<Milestone[]>(`${this.BASE_URL}/projects/${pid}/milestones?state=active&per_page=100`, { headers: h })).catch(() => []),
                firstValueFrom(this.http.get<Branch[]>(`${this.BASE_URL}/projects/${pid}/repository/branches?per_page=100`, { headers: h })).catch(() => []),
                firstValueFrom(this.http.get<MergeRequestResponse[]>(`${this.BASE_URL}/projects/${pid}/merge_requests?state=opened&per_page=100`, { headers: h })).catch(() => []),
            ]);

            this.members.set(membersData);
            this.labels.set(labelsData);
            this.milestones.set(milestonesData);
            this.branches.set(branchesData);
            this.openMRs.set(mrsData);

            this.log(`Loaded metadata for project`, 'info');
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
        this.selectedTargetBranch.set('');
    }

    // Metadata selection toggles
    toggleReviewer(id: number): void {
        const s = new Set(this.selectedReviewers());
        s.has(id) ? s.delete(id) : s.add(id);
        this.selectedReviewers.set(s);
    }

    toggleAssignee(id: number): void {
        const s = new Set(this.selectedAssignees());
        s.has(id) ? s.delete(id) : s.add(id);
        this.selectedAssignees.set(s);
    }

    toggleLabel(name: string): void {
        const s = new Set(this.selectedLabels());
        s.has(name) ? s.delete(name) : s.add(name);
        this.selectedLabels.set(s);
    }

    // ============================================================================
    // EXECUTION (delegates to the tested gitlab-batch module)
    // ============================================================================

    async execute(): Promise<void> {
        const ids: number[] = Array.from(this.selected());
        if (!ids.length) {
            this.log('No projects selected', 'err');
            return;
        }

        const action = this.selectedAction();
        const f = this.actionForm.value;
        const client = this.glClient();
        const nameOf = (pid: number) => this.getProjectName(pid);

        if (action === 'delete-branch' && !f.deleteBranchName) {
            this.log('No branch selected', 'err');
            return;
        }
        if ((action === 'close-mr' || action === 'update-labels') && !f.mrIid) {
            this.log('No MR selected', 'err');
            return;
        }
        if (action === 'update-labels' && this.selectedLabels().size === 0) {
            this.log('No labels selected', 'err');
            return;
        }

        this.loading.set(true);
        this.mrResults.set([]);

        try {
            if (action === 'merge') {
                const results = await createMergeRequests(client, ids, nameOf, this.buildMrsOptions());
                this.mrResults.set(results);
                this.showResultsPopup.set(true);
                const s = summarize(results);
                this.log(`Created ${s.ok}/${s.total} MRs`, s.fail === 0 ? 'ok' : 'info');
            } else if (action === 'tag') {
                const results = await createTags(client, ids, nameOf, {
                    tag_name: f.tagName ?? '',
                    ref: f.source || 'main',
                    message: f.tagMsg || '',
                });
                this.reportBatch(results);
            } else if (action === 'branch') {
                const results = await createBranches(client, ids, nameOf, {
                    branch: f.branchName ?? '',
                    ref: f.source || 'main',
                });
                this.reportBatch(results);
            } else if (action === 'delete-branch') {
                const results = await deleteBranches(client, ids, nameOf, f.deleteBranchName ?? '');
                this.reportBatch(results);
            } else if (action === 'close-mr') {
                const mrIid = f.mrIid as number;
                const results = await closeOrMergeMRs(client, ids, nameOf, {
                    mrIid,
                    action: f.mrAction as 'close' | 'merge',
                });
                this.reportBatch(results);
            } else if (action === 'update-labels') {
                const mrIid = f.mrIid as number;
                const results = await updateMRLabelsBatch(client, ids, nameOf, {
                    mrIid,
                    action: f.labelAction as 'add' | 'remove',
                    labels: Array.from(this.selectedLabels()),
                });
                this.reportBatch(results);
            } else if (action === 'protect-branch') {
                const results = await protectBranches(client, ids, nameOf, { name: f.branchName ?? '', merge_access_level: 40, push_access_level: 40 });
                this.reportBatch(results);
            } else if (action === 'unprotect-branch') {
                const results = await unprotectBranches(client, ids, nameOf, f.branchName ?? '');
                this.reportBatch(results);
            } else if (action === 'trigger-pipeline') {
                const results = await triggerPipelines(client, ids, nameOf, { ref: f.source || 'main' });
                this.reportBatch(results);
            } else if (action === 'release') {
                const results = await createReleases(client, ids, nameOf, {
                    tag_name: f.tagName ?? '',
                    name: f.title || f.tagName || '',
                    description: f.desc || '',
                    ref: f.source || 'main',
                });
                this.reportBatch(results);
            }
        } finally {
            this.loading.set(false);
        }
    }

    private reportBatch(results: BatchResult[]): void {
        const s = summarize(results);
        for (const r of results) {
            if (r.success) {
                this.log(`${r.action}: ${r.projectName}${r.detail ? ' (' + r.detail + ')' : ''}`, 'ok');
            } else {
                this.log(`Failed: ${r.projectName} - ${r.error}`, 'err');
            }
        }
        this.log(`Done: ${s.ok}/${s.total} succeeded`, s.fail === 0 ? 'ok' : 'info');
    }
    async preview(): Promise<void> {
        const ids: number[] = Array.from(this.selected());
        if (!ids.length) { this.log('No projects selected', 'err'); return; }
        if (this.selectedAction() !== 'merge') { this.log('Preview is available for the Merge Request action', 'info'); return; }
        this.loading.set(true);
        try {
            const opts = this.buildMrsOptions();
            const previewOpts = opts.mode === 'chained'
                ? { mode: 'chained' as const, chainSteps: opts.chainSteps }
                : { mode: 'single' as const, source: opts.source, target: opts.target, perProject: opts.perProject };
            const results = await previewMergeRequests(this.glClient(), ids, (pid) => this.getProjectName(pid), previewOpts);
            this.previewResults.set(results);
            this.showPreviewPopup.set(true);
            const okCount = results.filter((r) => r.ok).length;
            this.log(`Preview: ${okCount}/${results.length} projects ready`, okCount === results.length ? 'ok' : 'info');
        } finally {
            this.loading.set(false);
        }
    }

    closePreviewPopup(): void {
        this.showPreviewPopup.set(false);
    }

    private buildMrsOptions(): CreateMrsOptions {
        const f = this.actionForm.value;
        const common = {
            title: f.title || '',
            description: f.desc || '',
            reviewer_ids: this.isSingleProject() ? Array.from(this.selectedReviewers()) : [],
            assignee_ids: this.isSingleProject() ? Array.from(this.selectedAssignees()) : [],
            labels: this.isSingleProject() ? Array.from(this.selectedLabels()) : [],
            milestone_id: this.isSingleProject() ? (this.selectedMilestone() ?? undefined) : undefined,
        };
        if (this.mrMode() === 'chained') {
            return { mode: 'chained', chainSteps: this.chainSteps(), ...common };
        }
        return {
            mode: 'single',
            branchMode: this.branchMode(),
            source: f.source || 'develop',
            target: f.target || 'main',
            perProject: this.perProjectConfig(),
            ...common,
        };
    }

    private glClient(): GitLabClient {
        const http: GitLabHttp = {
            get: <T>(url: string, headers?: Record<string, string>) =>
                firstValueFrom(this.http.get<T>(url, { headers })),
            post: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
                firstValueFrom(this.http.post<T>(url, body, { headers })),
            put: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
                firstValueFrom(this.http.put<T>(url, body, { headers })),
            delete: <T>(url: string, headers?: Record<string, string>) =>
                firstValueFrom(this.http.delete<T>(url, { headers })),
        };
        return new GitLabClient(http, this.BASE_URL, this.token());
    }

    // ============================================================================
    // RESULTS POPUP
    // ============================================================================

    closeResultsPopup(): void {
        this.showResultsPopup.set(false);
    }

    copyAllLinks(): void {
        const links = this.mrResults()
            .filter((r) => r.success && r.mrUrl)
            .map((r) => r.mrUrl)
            .join('\n');

        if (this.isBrowser && links) {
            navigator.clipboard.writeText(links).then(() => {
                this.log('Copied all MR links to clipboard', 'ok');
            });
        }
    }

    copyLink(url: string): void {
        if (this.isBrowser) {
            navigator.clipboard.writeText(url).then(() => {
                this.log('Copied link to clipboard', 'info');
            });
        }
    }

    // ============================================================================
    // PER-PROJECT CONFIGURATION
    // ============================================================================

    setPerProjectSource(pid: number, value: string): void {
        this.perProjectConfig.update((config) => {
            const newConfig = new Map(config);
            const existing = newConfig.get(pid) || { source: '', target: '' };
            newConfig.set(pid, { ...existing, source: value });
            return newConfig;
        });
    }

    setPerProjectTarget(pid: number, value: string): void {
        this.perProjectConfig.update((config) => {
            const newConfig = new Map(config);
            const existing = newConfig.get(pid) || { source: '', target: '' };
            newConfig.set(pid, { ...existing, target: value });
            return newConfig;
        });
    }

    // ============================================================================
    // LOGGING
    // ============================================================================

    private log(msg: string, type: 'ok' | 'err' | 'info'): void {
        const id = ++this.logCounter;
        this.logs.update((l) => [{ id, time: new Date(), msg, type }, ...l].slice(0, 50));
    }

    clearLogs(): void {
        this.logs.set([]);
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    getProjectName(pid: number): string {
        return this.projects().find((p) => p.id === pid)?.name || String(pid);
    }

    getBranchesForProject(pid: number): Branch[] {
        return this.projectBranches().get(pid) || [];
    }

    getValidation(pid: number): BranchValidation | undefined {
        return this.branchValidation().get(pid);
    }

    trackByProjectId(_: number, project: Project): number {
        return project.id;
    }
}



