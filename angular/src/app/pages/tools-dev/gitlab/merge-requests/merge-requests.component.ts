import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService } from '../../../../shared/service/gitlab/gitlab.service';
import {
  MergeRequestResponse,
  mrStateLabel,
} from '../../../../shared/service/gitlab/gitlab-api';
import { GitlabActivityService } from '../gitlab-activity.service';
import { mapWithConcurrency } from '../../../../shared/service/gitlab/gitlab-batch';
import { tagAgeText } from '../types';

type MrStateFilter = 'opened' | 'merged' | 'closed' | 'all';

interface MrRow {
  project: { id: number; name: string; path_with_namespace: string };
  mergeRequests: MergeRequestResponse[];
  error: string | null;
}

interface MrResult {
  pid: number;
  proj: { id: number; name: string; path_with_namespace: string };
  mergeRequests: MergeRequestResponse[];
  error: string | null;
}

@Component({
  standalone: true,
  selector: 'gl-mrs',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './merge-requests.component.html',
  styleUrls: ['./merge-requests.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MergeRequestsComponent implements OnInit {
  readonly svc = inject(GitLabService);
  readonly activity = inject(GitlabActivityService);
  readonly selectedIds = input.required<number[]>();

  readonly rows = signal<MrRow[]>([]);
  readonly loading = signal(false);
  readonly stateFilter = signal<MrStateFilter>('opened');
  readonly titleFilter = signal('');
  readonly expandedProject = signal<number | null>(null);
  readonly selectedMr = signal<{ pid: number; mr: MergeRequestResponse } | null>(null);
  readonly approving = signal(false);
  readonly approvalsCache = signal<Map<string, { approved_by: { user: { name: string; username: string } }[]; approvals_left?: number; approvals_required?: number }>>(new Map());

  readonly stateLabel = mrStateLabel;
  readonly ageText = tagAgeText;

  readonly hasSelection = computed(() => this.selectedIds().length > 0);

  async ngOnInit(): Promise<void> {
    await this.loadMergeRequests();
  }

  async loadMergeRequests(): Promise<void> {
    this.loading.set(true);
    const ids = this.selectedIds();
    if (ids.length === 0) {
      this.rows.set([]);
      this.loading.set(false);
      return;
    }
    this.activity.append(`Loading MRs for ${ids.length} project(s)`, 'info');

    const results: MrResult[] = await mapWithConcurrency<number, MrResult>(
      ids,
      8,
      async (pid: number): Promise<MrResult> => {
        const proj = this.svc.projects().find((p) => p.id === pid) ?? {
          id: pid,
          name: `#${pid}`,
          path_with_namespace: '',
        };
        try {
          const mergeRequests = await this.svc.listProjectMergeRequests(pid, {
            state: this.stateFilter(),
            perPage: 50,
            orderBy: 'updated_at',
            sort: 'desc',
          });
          return { pid, proj, mergeRequests, error: null };
        } catch (e) {
          return {
            pid,
            proj,
            mergeRequests: [],
            error: e instanceof Error ? e.message : 'Failed to load MRs',
          };
        }
      },
    );

    const mrRows = results.map(
      (r: MrResult): MrRow => ({
        project: r.proj,
        mergeRequests: r.mergeRequests,
        error: r.error,
      }),
    );
    this.rows.set(mrRows);
    this.loading.set(false);

    const errors = results.filter((r) => r.error).length;
    const total = mrRows.reduce((n, r) => n + r.mergeRequests.length, 0);
    this.activity.append(
      `Loaded ${total} MR(s) across ${mrRows.length} project(s)${errors > 0 ? `, ${errors} error(s)` : ''}`,
      errors > 0 ? 'warn' : 'ok',
    );
  }

  readonly filteredRows = computed<MrRow[]>(() => {
    const q = this.titleFilter().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().map((r) => ({
      ...r,
      mergeRequests: r.mergeRequests.filter(
        (m) => m.title.toLowerCase().includes(q) || String(m.iid).includes(q),
      ),
    }));
  });

  readonly totalMrCount = computed(() =>
    this.filteredRows().reduce((n, r) => n + r.mergeRequests.length, 0),
  );

  /** Count MRs by state across all rows (KPI chips). */
  readonly openedCount = computed(() =>
    this.rows().reduce((n, r) => n + r.mergeRequests.filter((m) => m.state === 'opened').length, 0),
  );
  readonly mergedCount = computed(() =>
    this.rows().reduce((n, r) => n + r.mergeRequests.filter((m) => m.state === 'merged').length, 0),
  );

  setStateFilter(state: MrStateFilter): void {
    this.stateFilter.set(state);
    void this.loadMergeRequests();
  }

  toggleProject(pid: number): void {
    this.expandedProject.update((cur) => (cur === pid ? null : pid));
  }

  selectMr(pid: number, mr: MergeRequestResponse): void {
    this.selectedMr.set({ pid, mr });
    void this.loadApprovals(pid, mr.iid);
  }

  closeMrDetail(): void {
    this.selectedMr.set(null);
  }

  async loadApprovals(pid: number, iid: number): Promise<void> {
    const key = `${pid}:${iid}`;
    try {
      const approvals = await this.svc.listMergeRequestApprovals(pid, iid);
      this.approvalsCache.update((m) => {
        const next = new Map(m);
        next.set(key, approvals);
        return next;
      });
    } catch {
      /* approval API may be disabled — ignore */
    }
  }

  approvalsFor(pid: number, iid: number): { user: { name: string; username: string } }[] {
    return this.approvalsCache().get(`${pid}:${iid}`)?.approved_by ?? [];
  }

  async approveMr(): Promise<void> {
    const sel = this.selectedMr();
    if (!sel) return;
    this.approving.set(true);
    const { pid, mr } = sel;
    const projLabel = this.svc.projects().find((p) => p.id === pid)?.name ?? `#${pid}`;
    try {
      await this.svc.approveMergeRequest(pid, mr.iid);
      this.activity.append(`Approved MR !${mr.iid} on ${projLabel}`, 'ok');
      await this.loadApprovals(pid, mr.iid);
    } catch (e) {
      this.activity.append(
        `Approve failed on MR !${mr.iid}: ${e instanceof Error ? e.message : 'Unknown'}`,
        'err',
      );
    }
    this.approving.set(false);
  }

  /** Comma-joined names from a { name } array — used in template to avoid arrow functions in interpolation. */
  namesOf(list?: { name: string }[]): string {
    return list?.map((p) => p.name).join(', ') ?? '—';
  }

  async unapproveMr(): Promise<void> {
    const sel = this.selectedMr();
    if (!sel) return;
    this.approving.set(true);
    const { pid, mr } = sel;
    const projLabel = this.svc.projects().find((p) => p.id === pid)?.name ?? `#${pid}`;
    try {
      await this.svc.unapproveMergeRequest(pid, mr.iid);
      this.activity.append(`Unapproved MR !${mr.iid} on ${projLabel}`, 'info');
      await this.loadApprovals(pid, mr.iid);
    } catch (e) {
      this.activity.append(
        `Unapprove failed on MR !${mr.iid}: ${e instanceof Error ? e.message : 'Unknown'}`,
        'err',
      );
    }
    this.approving.set(false);
  }

  /** State → color token. */
  stateColor(state: string): string {
    const map: Record<string, string> = {
      opened: 'var(--msv-primary)',
      merged: 'var(--msv-success)',
      closed: 'var(--msv-text-muted)',
      locked: 'var(--msv-warning)',
    };
    return map[state] ?? 'var(--msv-text-muted)';
  }

  /** Pipeline status → color token. */
  pipelineColor(status?: string): string {
    if (!status) return 'var(--msv-text-muted)';
    const map: Record<string, string> = {
      success: 'var(--msv-success)',
      failed: 'var(--msv-error)',
      running: 'var(--msv-primary)',
      pending: 'var(--msv-warning)',
      canceled: 'var(--msv-text-muted)',
    };
    return map[status] ?? 'var(--msv-text-muted)';
  }
}