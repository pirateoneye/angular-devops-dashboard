import { Injectable, signal, effect } from '@angular/core';
import { timer } from 'rxjs';
import { K8sPod, K8sNode } from '../../../models/devops.models';
@Injectable()
export class K8sService {
  private _pods = signal<K8sPod[]>([]);
  readonly pods = this._pods.asReadonly();
  private _nodes = signal<K8sNode[]>([]);
  readonly nodes = this._nodes.asReadonly();
  private _activeTab = signal<'pods' | 'nodes'>('pods');
  readonly activeTab = this._activeTab.asReadonly();
  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(10000, 10000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
  refresh() {
    this._pods.set([
      { uid: 'pod-1', name: 'api-deployment-7d9f4b8c5-x2v4m', namespace: 'production', status: 'Running', restarts: 0, ageSeconds: 3 * 86400, node: 'worker-1', containers: 2, ready: 2, phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }, { type: 'ContainersReady', status: 'True' }] },
      { uid: 'pod-2', name: 'web-app-5c4f9d2e1-a8k3p', namespace: 'production', status: 'Running', restarts: 1, ageSeconds: 5 * 86400, node: 'worker-2', containers: 1, ready: 1, phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] },
      { uid: 'pod-3', name: 'worker-9b2e1f8c4-m7n5q', namespace: 'production', status: 'Pending', restarts: 3, ageSeconds: 600, node: 'worker-1', containers: 1, ready: 0, phase: 'Pending', conditions: [{ type: 'Ready', status: 'False' }] },
      { uid: 'pod-4', name: 'data-cron-1627485900-ab12c', namespace: 'batch', status: 'Succeeded', restarts: 0, ageSeconds: 7200, node: 'worker-3', containers: 1, ready: 0, phase: 'Succeeded', conditions: [{ type: 'Ready', status: 'False' }] },
      { uid: 'pod-5', name: 'legacy-svc-4f8c2b1e9-d3x7z', namespace: 'production', status: 'Failed', restarts: 5, ageSeconds: 86400, node: 'worker-2', containers: 1, ready: 0, phase: 'Failed', conditions: [{ type: 'Ready', status: 'False' }] },
    ]);
    this._nodes.set([
      { name: 'master-1', status: 'Ready', cpuCores: { used: 4.2, total: 8 }, memoryBytes: { used: 12 * 1024 ** 3, total: 32 * 1024 ** 3 }, pods: 24, podCapacity: 110, ageSeconds: 45 * 86400, osImage: 'Ubuntu 22.04', kernelVersion: '5.15.0' },
      { name: 'worker-1', status: 'Ready', cpuCores: { used: 6.8, total: 16 }, memoryBytes: { used: 28 * 1024 ** 3, total: 64 * 1024 ** 3 }, pods: 42, podCapacity: 110, ageSeconds: 45 * 86400, osImage: 'Ubuntu 22.04', kernelVersion: '5.15.0' },
      { name: 'worker-2', status: 'Ready', cpuCores: { used: 5.1, total: 16 }, memoryBytes: { used: 22 * 1024 ** 3, total: 64 * 1024 ** 3 }, pods: 38, podCapacity: 110, ageSeconds: 30 * 86400, osImage: 'Ubuntu 22.04', kernelVersion: '5.15.0' },
      { name: 'worker-3', status: 'NotReady', cpuCores: { used: 0, total: 16 }, memoryBytes: { used: 0, total: 64 * 1024 ** 3 }, pods: 0, podCapacity: 110, ageSeconds: 30 * 86400, osImage: 'Ubuntu 22.04', kernelVersion: '5.15.0' },
    ]);
  }
  setTab(t: 'pods' | 'nodes') { this._activeTab.set(t); }
}
