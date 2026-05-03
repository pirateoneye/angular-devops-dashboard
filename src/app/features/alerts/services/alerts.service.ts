import { Injectable, signal, effect } from '@angular/core';
import { timer } from 'rxjs';
import { Alert } from '../../../models/devops.models';
@Injectable()
export class AlertsService {
  private _alerts = signal<Alert[]>([]);
  readonly alerts = this._alerts.asReadonly();
  private _filterSeverity = signal<string>('');
  readonly filterSeverity = this._filterSeverity.asReadonly();
  readonly severities = signal<string[]>(['critical', 'warning', 'info']);
  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(15000, 15000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
  refresh() {
    this._alerts.set([
      { id: 'a1', fingerprint: 'fp1', severity: 'critical', title: 'Database Connection Failure', message: 'api-gateway cannot connect to postgres-db. Check network policy.', service: 'api-gateway', timestamp: new Date(Date.now()-12000).toISOString(), acknowledged: false, silenced: false, runbookUrl: '#', generatorUrl: '#' },
      { id: 'a2', fingerprint: 'fp2', severity: 'critical', title: 'Worker Queue Backpressure', message: 'Queue depth >1000. Scaling not triggered.', service: 'worker-queue', timestamp: new Date(Date.now()-42000).toISOString(), acknowledged: false, silenced: false, runbookUrl: '#', generatorUrl: '#' },
      { id: 'a3', fingerprint: 'fp3', severity: 'warning', title: 'High Memory Usage', message: 'data-processor JVM heap at 92%. Consider increasing Xmx.', service: 'data-processor', timestamp: new Date(Date.now()-108000).toISOString(), acknowledged: false, silenced: false, runbookUrl: '#', generatorUrl: '#' },
      { id: 'a4', fingerprint: 'fp4', severity: 'warning', title: 'Node NotReady', message: 'worker-3 has been NotReady for 15m. Check kubelet.', service: 'k8s-cluster', timestamp: new Date(Date.now()-900000).toISOString(), acknowledged: false, silenced: false, runbookUrl: '#', generatorUrl: '#' },
      { id: 'a5', fingerprint: 'fp5', severity: 'info', title: 'Deployment Successful', message: 'api-service v2.4.1 deployed to production.', service: 'api-gateway', timestamp: new Date(Date.now()-3600000).toISOString(), acknowledged: true, acknowledgedBy: 'sugma', acknowledgedAt: new Date(Date.now()-3000000).toISOString(), silenced: false },
    ]);
  }
  filteredAlerts(): Alert[] {
    const f = this._filterSeverity();
    return f ? this._alerts().filter(a => a.severity === f) : this._alerts();
  }
  unacknowledgedCount(): number { return this._alerts().filter(a => !a.acknowledged).length; }
  acknowledge(id: string) {
    this._alerts.update(arr => arr.map(a => a.id === id ? { ...a, acknowledged: true, acknowledgedBy: 'user', acknowledgedAt: new Date().toISOString() } : a));
  }
  setFilter(s: string) { this._filterSeverity.set(s === this._filterSeverity() ? '' : s); }
}
