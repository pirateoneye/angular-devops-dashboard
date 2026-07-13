// project-registry.service.ts
// Project-first catalog: multi-select projects, group tags, per-project parameter memory.

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JenkinsService } from './jenkins.service';
import { ProjectEntry, JenkinsJob } from './jenkins.models';

const LS_GROUPS = 'jenkins-project-groups';
const LS_LASTPARAMS = 'jenkins-project-lastparams';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

@Injectable({ providedIn: 'root' })
export class ProjectRegistryService {
  private readonly jenkins = inject(JenkinsService);

  readonly projects = signal<ProjectEntry[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly activeGroup = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Map of jobName → string[] of group tags. Persisted in localStorage. */
  private groupTags: Record<string, string[]> = {};

  /** Map of jobName → last-used params. Persisted in localStorage. */
  private lastParams: Record<string, Record<string, string | boolean>> = {};

  readonly groups = computed(() => {
    const set = new Set<string>();
    for (const p of this.projects()) {
      for (const g of p.groups) set.add(g);
    }
    return Array.from(set).sort();
  });

  readonly filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const g = this.activeGroup();
    let all = this.projects();
    if (g) all = all.filter((p) => p.groups.includes(g));
    if (q) all = all.filter((p) => p.name.toLowerCase().includes(q));
    return all;
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  private serverKey = '';

  loadFromServer(serverUrl: string): Observable<void> {
    this.loading.set(true);
    this.error.set('');
    this.serverKey = serverUrl || 'demo-server';
    this.groupTags = loadJson<Record<string, string[]>>(LS_GROUPS + ':' + this.serverKey, {});
    this.lastParams = loadJson<Record<string, Record<string, string | boolean>>>(
      LS_LASTPARAMS + ':' + this.serverKey,
      {},
    );

    return this.jenkins.fetchJobs(serverUrl).pipe(
      map((jobs) => {
        const seen = new Set<string>();
        const entries: ProjectEntry[] = [];
        for (const j of jobs) {
          if (seen.has(j.name)) {
            console.warn(`[ProjectRegistry] Duplicate job name: ${j.name}, keeping last`);
            continue;
          }
          seen.add(j.name);
          entries.push(this.jobToEntry(j));
        }
        this.projects.set(entries);
        this.selectedIds.set(new Set());
        this.activeGroup.set(null);
        this.searchQuery.set('');
        this.loading.set(false);
      }),
      catchError((err: Error) => {
        this.error.set(err.message);
        this.projects.set([]);
        this.loading.set(false);
        return of(void 0);
      }),
    );
  }

  /** Seed projects from JenkinsJob[] for demo mode. */
  seedProjects(jobs: JenkinsJob[], groups?: Record<string, string[]>): void {
    this.serverKey = 'demo-server';
    this.groupTags = groups ?? loadJson<Record<string, string[]>>(LS_GROUPS + ':demo-server', {});
    this.lastParams = loadJson<Record<string, Record<string, string | boolean>>>(
      LS_LASTPARAMS + ':demo-server',
      {},
    );
    this.projects.set(jobs.map((j) => this.jobToEntry(j)));
    this.selectedIds.set(new Set());
    this.error.set('');
    this.loading.set(false);
  }

  toggleProject(jobName: string): void {
    this.selectedIds.update((s) => {
      const next = new Set(s);
      if (next.has(jobName)) next.delete(jobName);
      else next.add(jobName);
      return next;
    });
  }

  selectAll(): void {
    const all = this.filteredProjects().map((p) => p.name);
    this.selectedIds.set(new Set(all));
  }

  deselectAll(): void {
    this.selectedIds.set(new Set());
  }

  addGroupTag(jobName: string, tag: string): void {
    if (!tag) return;
    const current = this.groupTags[jobName] ?? [];
    if (current.includes(tag)) return;
    this.groupTags[jobName] = [...current, tag];
    this.persistGroups();
    this.syncProjectGroups(jobName);
  }

  removeGroupTag(jobName: string, tag: string): void {
    const current = this.groupTags[jobName];
    if (!current) return;
    this.groupTags[jobName] = current.filter((t) => t !== tag);
    this.persistGroups();
    this.syncProjectGroups(jobName);
  }

  recordBuildParams(projectName: string, params: Record<string, string | boolean>): void {
    this.lastParams[projectName] = { ...params };
    saveJson(LS_LASTPARAMS + ':' + this.serverKey, this.lastParams);
    this.projects.update((arr) =>
      arr.map((p) => (p.name === projectName ? { ...p, lastParams: params, lastBuiltAt: Date.now() } : p)),
    );
  }

  getLastParams(projectName: string): Record<string, string | boolean> | null {
    return this.lastParams[projectName] ?? null;
  }

  private jobToEntry(j: JenkinsJob): ProjectEntry {
    return {
      name: j.name,
      url: j.url,
      color: j.color,
      groups: this.groupTags[j.name] ?? [],
      lastParams: this.lastParams[j.name],
    };
  }

  private syncProjectGroups(jobName: string): void {
    this.projects.update((arr) =>
      arr.map((p) => (p.name === jobName ? { ...p, groups: this.groupTags[jobName] ?? [] } : p)),
    );
  }

  private persistGroups(): void {
    saveJson(LS_GROUPS + ':' + this.serverKey, this.groupTags);
  }
}
