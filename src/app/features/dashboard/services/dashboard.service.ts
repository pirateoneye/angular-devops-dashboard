import { Injectable, signal, computed, effect } from '@angular/core';
import { timer } from 'rxjs';
import { DashboardMetric, Environment } from '../../../models/devops.models';
@Injectable()
export class DashboardService {
  private _metrics = signal<DashboardMetric[]>([]);
  readonly metrics = this._metrics.asReadonly();
  private _environments = signal<Environment[]>([]);
  readonly environments = this._environments.asReadonly();
  readonly totalPipelines = computed(() => 12);
  readonly successRate = computed(() => 87);
  readonly activeAlerts = computed(() => 5);
  readonly runningContainers = computed(() => 24);
  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(5000, 5000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
  refresh() {
    this._metrics.set([
      { label: 'CPU', value: 42 + Math.random() * 10, max: 100, unit: '%', color: '#58a6ff' },
      { label: 'RAM', value: 58 + Math.random() * 8, max: 100, unit: '%', color: '#a371f7' },
      { label: 'Disk', value: 34, max: 100, unit: '%', color: '#3fb950' },
      { label: 'Network', value: 67 + Math.random() * 15, max: 100, unit: 'Mb/s', color: '#d29922' },
    ]);
    this._environments.set([
      { name: 'Production', region: 'us-east-1', status: 'healthy', uptime: 99.99, lastDeploy: new Date(Date.now() - 3600000).toISOString(), version: 'v2.4.1', errorRate: 0.02 },
      { name: 'Staging', region: 'us-west-2', status: 'healthy', uptime: 99.95, lastDeploy: new Date(Date.now() - 7200000).toISOString(), version: 'v2.5.0-rc.1', errorRate: 0.15 },
      { name: 'Dev', region: 'eu-central-1', status: 'degraded', uptime: 98.50, lastDeploy: new Date(Date.now() - 86400000).toISOString(), version: 'v2.5.0-dev.42', errorRate: 1.20 },
    ]);
  }
}
