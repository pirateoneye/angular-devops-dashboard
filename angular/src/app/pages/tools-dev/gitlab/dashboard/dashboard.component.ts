import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mapWithConcurrency } from '../../../../shared/service/gitlab/gitlab-batch';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService } from '../../../../shared/service/gitlab/gitlab.service';
import { tagAgeText, tagAgeColor } from '../types';
import { Project, GitLabTag, tagDate } from '../../../../shared/service/gitlab/gitlab-api';
import { FilterChip, SortKey, SortDir } from '../types';

interface ProjectRow {
  project: Project;
  latestTag: GitLabTag | null;
  tagDate: string | null;
}

@Component({
  standalone: true,
  selector: 'gl-dashboard',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly svc = inject(GitLabService);

  readonly searchQuery = signal('');
  readonly filterChip = signal<FilterChip>('all');
  readonly sortKey = signal<SortKey>('projectName');
  readonly sortDir = signal<SortDir>('asc');
  readonly visibleCount = signal(30);
  readonly tagMap = signal<Map<number, GitLabTag | null>>(new Map());
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly tagsLoading = signal(false);
  readonly projectSelected = output<number[]>();

  readonly projects = this.svc.projects;
  readonly loading = this.svc.loadingProjects;

  async ngOnInit(): Promise<void> {
    await this.loadTags();
  }

  async loadTags(): Promise<void> {
    this.tagsLoading.set(true);
    const projs = this.projects();
    const results = await mapWithConcurrency(
      projs,
      8,
      async (p: Project): Promise<[number, GitLabTag | null]> => {
        try {
          const tags = await this.svc.listProjectTags(p.id, { orderBy: 'updated_at', sort: 'desc', perPage: 1 });
          return [p.id, tags[0] ?? null];
        } catch { return [p.id, null]; }
      },
    );
    this.tagMap.set(new Map(results));
    this.tagsLoading.set(false);
  }

  readonly projectRows = computed(() => {
    const map = this.tagMap();
    return this.projects().map(p => {
      const t = map.get(p.id) ?? null;
      return { project: p, latestTag: t, tagDate: t ? tagDate(t) ?? null : null } as ProjectRow;
    });
  });

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const chip = this.filterChip();
    let list = this.projectRows();
    if (q) list = list.filter(r => r.project.name.toLowerCase().includes(q) || r.project.path_with_namespace.toLowerCase().includes(q));
    if (chip === 'tagged') list = list.filter(r => r.latestTag);
    else if (chip === 'untagged') list = list.filter(r => !r.latestTag);
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      let va: string | number = 0, vb: string | number = 0;
      if (key === 'projectName') { va = a.project.name; vb = b.project.name; }
      else if (a.tagDate && b.tagDate) { va = new Date(a.tagDate).getTime(); vb = new Date(b.tagDate).getTime(); }
      else if (a.tagDate) return dir === 'asc' ? -1 : 1;
      else if (b.tagDate) return dir === 'asc' ? 1 : -1;
      return dir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (vb < va ? -1 : vb > va ? 1 : 0);
    });
  });

  readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));

  readonly totalCount = computed(() => this.projectRows().length);
  readonly taggedCount = computed(() => this.projectRows().filter(r => r.latestTag).length);

  readonly tagAgeText = tagAgeText;
  readonly tagAgeColor = tagAgeColor;

  toggleSelect(pid: number): void {
    const s = new Set(this.selectedIds());
    if (s.has(pid)) s.delete(pid); else s.add(pid);
    this.selectedIds.set(s);
  }

  allSelected(): boolean {
    const f = this.filtered();
    return f.length > 0 && f.every(r => this.selectedIds().has(r.project.id));
  }

  onSelectAllChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAll(checked);
  }

  selectAll(select: boolean): void {
    if (select) this.selectedIds.set(new Set(this.filtered().map(r => r.project.id)));
    else this.selectedIds.set(new Set());
  }

  emitSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length) this.projectSelected.emit(ids);
  }

  setFilter(chip: FilterChip): void { this.filterChip.set(chip); this.visibleCount.set(30); }
  loadMore(): void { this.visibleCount.update(n => n + 20); }
  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(key); this.sortDir.set('asc'); }
  }
}
