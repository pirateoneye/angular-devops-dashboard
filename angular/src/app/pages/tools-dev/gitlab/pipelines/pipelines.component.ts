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
  Pipeline,
  PIPELINE_STATUS_COLORS,
  pipelineStatusLabel,
} from '../../../../shared/service/gitlab/gitlab-api';
import { GitlabActivityService } from '../gitlab-activity.service';
import { mapWithConcurrency } from '../../../../shared/service/gitlab/gitlab-batch';
import { tagAgeText } from '../types';

interface PipelineRow {
  project: { id: number; name: string; path_with_namespace: string };
  pipelines: Pipeline[];
  latest: Pipeline | null;
  error: string | null;
}

interface PipelineResult {
  pid: number;
  proj: { id: number; name: string; path_with_namespace: string };
  pipelines: Pipeline[];
  error: string | null;
}

@Component({
  standalone: true,
  selector: 'gl-pipelines',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelinesComponent implements OnInit {
  readonly svc = inject(GitLabService);
  readonly activity = inject(GitlabActivityService);
  readonly selectedIds = input.required<number[]>();

  readonly rows = signal<PipelineRow[]>([]);
  readonly loading = signal(false);
  readonly expandAll = signal(false);
  readonly refFilter = signal('');

  readonly statusColors = PIPELINE_STATUS_COLORS;
  readonly statusLabel = pipelineStatusLabel;
  readonly ageText = tagAgeText;

  async ngOnInit(): Promise<void> {
    await this.loadPipelines();
  }

  async loadPipelines(): Promise<void> {
    this.loading.set(true);
    const ids = this.selectedIds();
    if (ids.length === 0) {
      this.rows.set([]);
      this.loading.set(false);
      return;
    }
    this.activity.append(`Loading pipelines for ${ids.length} project(s)`, 'info');

    const results: PipelineResult[] = await mapWithConcurrency<number, PipelineResult>(
      ids,
      8,
      async (pid: number): Promise<PipelineResult> => {
        const proj = this.svc.projects().find((p) => p.id === pid) ?? {
          id: pid,
          name: `#${pid}`,
          path_with_namespace: '',
        };
        try {
          const pipelines = await this.svc.listProjectPipelines(pid, {
            perPage: 10,
            ref: this.refFilter().trim() || undefined,
          });
          return { pid, proj, pipelines, error: null };
        } catch (e) {
          return {
            pid,
            proj,
            pipelines: [],
            error: e instanceof Error ? e.message : 'Failed to load pipelines',
          };
        }
      },
    );

    const pipelineRows = results.map(
      (r: PipelineResult): PipelineRow => ({
        project: r.proj,
        pipelines: r.pipelines,
        latest: r.pipelines[0] ?? null,
        error: r.error,
      }),
    );
    this.rows.set(pipelineRows);
    this.loading.set(false);

    const errors = results.filter((r) => r.error).length;
    const total = pipelineRows.reduce((n, r) => n + r.pipelines.length, 0);
    this.activity.append(
      `Loaded ${total} pipeline(s) across ${pipelineRows.length} project(s)${errors > 0 ? `, ${errors} error(s)` : ''}`,
      errors > 0 ? 'warn' : 'ok',
    );
  }

  readonly hasSelection = computed(() => this.selectedIds().length > 0);

  /** Status color token, falling back to muted. */
  statusColor(status: string): string {
    return this.statusColors[status] ?? 'var(--msv-text-muted)';
  }

  /** Format pipeline duration (seconds) to a readable form. */
  formatDuration(seconds?: number): string {
    if (!seconds || seconds < 0) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }

  applyRefFilter(): void {
    void this.loadPipelines();
  }

  clearRefFilter(): void {
    this.refFilter.set('');
    void this.loadPipelines();
  }
}