import { Injectable, signal, computed } from '@angular/core';

export type ActivitySource = 'jenkins' | 'gitlab' | 'gslb';

export interface ActivityEntry {
  ts: number;
  source: ActivitySource;
  message: string;
  kind: 'info' | 'ok' | 'warn' | 'err';
}

const ICON_BY_SOURCE: Record<ActivitySource, string> = {
  jenkins: 'build_circle',
  gitlab: 'merge_type',
  gslb: 'dns',
};

const COLOR_BY_KIND: Record<ActivityEntry['kind'], string> = {
  ok: 'var(--msv-success)',
  info: 'var(--msv-primary)',
  warn: 'var(--msv-warning)',
  err: 'var(--msv-error)',
};
/** Unified activity feed aggregating events from Jenkins, GitLab, and GSLB. */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly maxLen = 100;
  readonly entries = signal<ActivityEntry[]>([]);

  readonly count = computed(() => this.entries().length);
  readonly collapsed = signal(true);

  log(source: ActivitySource, message: string, kind: ActivityEntry['kind'] = 'info'): void {
    this.entries.update((arr) => [
      ...arr.slice(-(this.maxLen - 1)),
      { ts: Date.now(), source, message, kind },
    ]);
  }

  clear(): void {
    this.entries.set([]);
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  iconFor(source: ActivitySource): string {
    return ICON_BY_SOURCE[source];
  }

  colorFor(kind: ActivityEntry['kind']): string {
    return COLOR_BY_KIND[kind];
  }
}
