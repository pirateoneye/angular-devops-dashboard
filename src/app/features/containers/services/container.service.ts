import { Injectable, signal, effect } from '@angular/core';
import { timer } from 'rxjs';
import { Container } from '../../../models/devops.models';
@Injectable()
export class ContainerService {
  private _containers = signal<Container[]>([]);
  readonly containers = this._containers.asReadonly();
  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(6000, 6000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
  refresh() {
    this._containers.set([
      { id: 'c1', name: 'api-gateway', image: 'api-v2.4.1', status: 'running', cpuPercent: 12.5, memoryBytes: 256 * 1024 ** 2, memoryLimit: 512 * 1024 ** 2, ports: [{ host: 8080, container: 80 }], restarts: 0, health: 'healthy', startedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'c2', name: 'web-app', image: 'web-v2.4.1', status: 'running', cpuPercent: 8.2, memoryBytes: 128 * 1024 ** 2, memoryLimit: 256 * 1024 ** 2, ports: [{ host: 3000, container: 3000 }], restarts: 1, health: 'healthy', startedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: 'c3', name: 'postgres', image: 'postgres-15-alpine', status: 'running', cpuPercent: 45.8, memoryBytes: 1024 * 1024 ** 2, memoryLimit: 2048 * 1024 ** 2, ports: [{ host: 5432, container: 5432 }], restarts: 0, health: 'healthy', startedAt: new Date(Date.now() - 604800000).toISOString() },
      { id: 'c4', name: 'redis-cache', image: 'redis-7-alpine', status: 'running', cpuPercent: 3.1, memoryBytes: 64 * 1024 ** 2, memoryLimit: 128 * 1024 ** 2, ports: [{ host: 6379, container: 6379 }], restarts: 0, health: 'healthy', startedAt: new Date(Date.now() - 604800000).toISOString() },
      { id: 'c5', name: 'legacy-svc', image: 'legacy-v1.2.0', status: 'exited', cpuPercent: 0, memoryBytes: 0, memoryLimit: 512 * 1024 ** 2, ports: [], restarts: 5, startedAt: new Date(Date.now() - 259200000).toISOString() },
    ]);
  }
}
