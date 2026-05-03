import { Injectable, signal, effect } from '@angular/core';
import { timer } from 'rxjs';
import { Pipeline } from '../../../models/devops.models';
@Injectable()
export class PipelineService {
  private _pipelines = signal<Pipeline[]>([]);
  readonly pipelines = this._pipelines.asReadonly();
  private _filter = signal<'' | 'success' | 'failed' | 'running' | 'pending'>('');
  readonly filter = this._filter.asReadonly();
  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(8000, 8000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
  refresh() {
    this._pipelines.set([
      { id: 'p1', name: 'Build & Test', status: 'success', branch: 'main', commit: 'a1b2c3d',
        stages: [{ name: 'Lint', status: 'success', duration: 45 }, { name: 'Unit Tests', status: 'success', duration: 120 }, { name: 'Build', status: 'success', duration: 180 }, { name: 'E2E Tests', status: 'success', duration: 240 }],
        startedAt: new Date(Date.now() - 3600000).toISOString(), duration: 585 },
      { id: 'p2', name: 'Deploy Staging', status: 'running', branch: 'main', commit: 'a1b2c3d',
        stages: [{ name: 'Build', status: 'success', duration: 180 }, { name: 'Deploy', status: 'running', duration: 45 }, { name: 'Smoke Tests', status: 'pending', duration: 0 }],
        startedAt: new Date(Date.now() - 300000).toISOString(), duration: 225 },
      { id: 'p3', name: 'Security Scan', status: 'failed', branch: 'feature/auth', commit: 'e4f5g6h',
        stages: [{ name: 'SAST', status: 'success', duration: 300 }, { name: 'Dependency Check', status: 'failed', duration: 120, logs: 'CVE-2024-1234 found in lodash@4.17.20' }],
        startedAt: new Date(Date.now() - 7200000).toISOString(), duration: 420 },
    ]);
  }
  filtered(): Pipeline[] { const f = this._filter(); return f ? this._pipelines().filter(p => p.status === f) : this._pipelines(); }
  setFilter(f: '' | 'success' | 'failed' | 'running' | 'pending') { this._filter.set(f); }
  stageWidth(s: { status: string; duration: number }, total: number): number { return total ? (s.duration / total) * 100 : 0; }
  stageClass(s: { status: string }): string {
    switch (s.status) { case 'success': return 'success'; case 'failed': return 'danger'; case 'running': return 'info'; case 'skipped': return 'neutral'; default: return 'neutral'; }
  }
}
