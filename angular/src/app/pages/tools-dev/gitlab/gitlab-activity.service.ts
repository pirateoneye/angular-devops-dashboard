import { Injectable, signal, computed } from '@angular/core';

export interface LogEntry {
  ts: number;
  message: string;
  kind: 'info' | 'ok' | 'warn' | 'err';
}

@Injectable({ providedIn: 'root' })
export class GitlabActivityService {
  private readonly maxLen = 200;
  readonly entries = signal<LogEntry[]>([]);

  readonly count = computed(() => this.entries().length);
  readonly errorCount = computed(() => this.entries().filter((e) => e.kind === 'err').length);
  readonly collapsed = signal(true);

  append(message: string, kind: LogEntry['kind'] = 'info'): void {
    this.entries.update((arr) => [...arr.slice(-(this.maxLen - 1)), { ts: Date.now(), message, kind }]);
  }

  clear(): void {
    this.entries.set([]);
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
