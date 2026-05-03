import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  Pipeline, Container, K8sPod, K8sNode, LogEntry,
  Alert, SystemMetric, Environment
} from '../models/devops.models';

@Injectable({ providedIn: 'root' })
export class DevOpsService {
  private alerts$ = new BehaviorSubject<Alert[]>(this.generateAlerts());

  getPipelines(): Observable<Pipeline[]> {
    return of(this.generatePipelines()).pipe(delay(300));
  }

  getContainers(): Observable<Container[]> {
    return of(this.generateContainers()).pipe(delay(300));
  }

  getK8sPods(): Observable<K8sPod[]> {
    return of(this.generatePods()).pipe(delay(300));
  }

  getK8sNodes(): Observable<K8sNode[]> {
    return of(this.generateNodes()).pipe(delay(300));
  }

  getLogs(service?: string, level?: string): Observable<LogEntry[]> {
    const logs = this.generateLogs();
    const filtered = logs.filter(l => {
      if (service && l.service !== service) return false;
      if (level && l.level !== level) return false;
      return true;
    });
    return of(filtered).pipe(delay(200));
  }

  getAlerts(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  acknowledgeAlert(id: string): void {
    const current = this.alerts$.value;
    const updated = current.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    this.alerts$.next(updated);
  }

  getMetrics(): Observable<SystemMetric[]> {
    return of(this.generateMetrics()).pipe(delay(200));
  }

  getEnvironments(): Observable<Environment[]> {
    return of(this.generateEnvironments()).pipe(delay(200));
  }

  private generatePipelines(): Pipeline[] {
    return [
      {
        id: 'pipe-1', name: 'api-service', status: 'success', branch: 'main',
        commit: 'a3f7d2e', author: 'sugma', duration: '4m 12s',
        startedAt: '2026-05-03T14:23:00Z',
        stages: [
          { name: 'build', status: 'success', duration: '1m 30s' },
          { name: 'test', status: 'success', duration: '2m 10s' },
          { name: 'deploy-staging', status: 'success', duration: '32s' }
        ]
      },
      {
        id: 'pipe-2', name: 'frontend-app', status: 'running', branch: 'feat/auth',
        commit: 'b8e1c4a', author: 'sugma', duration: '2m 05s',
        startedAt: '2026-05-03T14:30:00Z',
        stages: [
          { name: 'build', status: 'success', duration: '1m 45s' },
          { name: 'test', status: 'running', duration: '20s' },
          { name: 'deploy-staging', status: 'pending', duration: '-' }
        ]
      },
      {
        id: 'pipe-3', name: 'data-processor', status: 'failed', branch: 'main',
        commit: 'c5d9f1b', author: 'sugma', duration: '5m 44s',
        startedAt: '2026-05-03T13:15:00Z',
        stages: [
          { name: 'build', status: 'success', duration: '2m 10s' },
          { name: 'test', status: 'failed', duration: '3m 34s' },
          { name: 'deploy-staging', status: 'skipped', duration: '-' }
        ]
      },
      {
        id: 'pipe-4', name: 'notification-service', status: 'pending', branch: 'hotfix/memory',
        commit: 'd2a7e9f', author: 'sugma', duration: '-',
        startedAt: '2026-05-03T14:35:00Z',
        stages: [
          { name: 'build', status: 'pending', duration: '-' },
          { name: 'test', status: 'pending', duration: '-' },
          { name: 'deploy-staging', status: 'pending', duration: '-' }
        ]
      }
    ];
  }

  private generateContainers(): Container[] {
    return [
      {
        id: 'abc123', name: 'api-gateway', image: 'api:v2.4.1',
        status: 'running', ports: ['8080:8080', '8443:8443'],
        cpu: 12.5, memory: 256, memoryLimit: 512,
        uptime: '3d 14h', health: 'healthy'
      },
      {
        id: 'def456', name: 'postgres-db', image: 'postgres:15-alpine',
        status: 'running', ports: ['5432:5432'],
        cpu: 8.2, memory: 420, memoryLimit: 1024,
        uptime: '7d 2h', health: 'healthy'
      },
      {
        id: 'ghi789', name: 'redis-cache', image: 'redis:7-alpine',
        status: 'running', ports: ['6379:6379'],
        cpu: 3.1, memory: 64, memoryLimit: 256,
        uptime: '7d 2h', health: 'healthy'
      },
      {
        id: 'jkl012', name: 'worker-queue', image: 'worker:v1.2.0',
        status: 'restarting', ports: [],
        cpu: 0, memory: 0, memoryLimit: 512,
        uptime: '2m', health: 'starting'
      },
      {
        id: 'mno345', name: 'old-nginx', image: 'nginx:1.18',
        status: 'exited', ports: ['80:80'],
        cpu: 0, memory: 0, memoryLimit: 128,
        uptime: '-', health: undefined
      }
    ];
  }

  private generatePods(): K8sPod[] {
    return [
      {
        name: 'api-deployment-7d9f4b8c5-x2v4m', namespace: 'production',
        status: 'Running', restarts: 0, age: '3d', node: 'worker-1',
        containers: 2, ready: 2
      },
      {
        name: 'web-app-5c4f9d2e1-a8k3p', namespace: 'production',
        status: 'Running', restarts: 1, age: '5d', node: 'worker-2',
        containers: 1, ready: 1
      },
      {
        name: 'worker-9b2e1f8c4-m7n5q', namespace: 'production',
        status: 'Pending', restarts: 3, age: '10m', node: 'worker-1',
        containers: 1, ready: 0
      },
      {
        name: 'data-cron-1627485900-ab12c', namespace: 'batch',
        status: 'Succeeded', restarts: 0, age: '2h', node: 'worker-3',
        containers: 1, ready: 0
      },
      {
        name: 'legacy-svc-4f8c2b1e9-d3x7z', namespace: 'production',
        status: 'Failed', restarts: 5, age: '1d', node: 'worker-2',
        containers: 1, ready: 0
      }
    ];
  }

  private generateNodes(): K8sNode[] {
    return [
      {
        name: 'master-1', status: 'Ready',
        cpu: { used: 4.2, total: 8 },
        memory: { used: 12, total: 32 },
        pods: 24, age: '45d'
      },
      {
        name: 'worker-1', status: 'Ready',
        cpu: { used: 6.8, total: 16 },
        memory: { used: 28, total: 64 },
        pods: 42, age: '45d'
      },
      {
        name: 'worker-2', status: 'Ready',
        cpu: { used: 5.1, total: 16 },
        memory: { used: 22, total: 64 },
        pods: 38, age: '30d'
      },
      {
        name: 'worker-3', status: 'NotReady',
        cpu: { used: 0, total: 16 },
        memory: { used: 0, total: 64 },
        pods: 0, age: '30d'
      }
    ];
  }

  private generateLogs(): LogEntry[] {
    return [
      { timestamp: '2026-05-03T14:35:12Z', level: 'ERROR', service: 'api-gateway', message: 'Connection timeout to postgres-db:5432 after 30s', traceId: 'abc-123-xyz' },
      { timestamp: '2026-05-03T14:34:58Z', level: 'WARN', service: 'worker-queue', message: 'Queue depth exceeding threshold: 1,247 jobs pending', traceId: 'def-456-uvw' },
      { timestamp: '2026-05-03T14:34:45Z', level: 'INFO', service: 'api-gateway', message: 'Request processed: POST /api/v2/users 201 45ms', traceId: 'ghi-789-rst' },
      { timestamp: '2026-05-03T14:34:30Z', level: 'INFO', service: 'redis-cache', message: 'Cache hit ratio: 94.2%', traceId: undefined },
      { timestamp: '2026-05-03T14:34:12Z', level: 'ERROR', service: 'data-processor', message: 'OutOfMemoryError: Java heap space during batch processing', traceId: 'jkl-012-opq' },
      { timestamp: '2026-05-03T14:33:55Z', level: 'WARN', service: 'api-gateway', message: 'Rate limit approaching: 890/1000 req/min', traceId: undefined },
      { timestamp: '2026-05-03T14:33:40Z', level: 'DEBUG', service: 'web-app', message: 'Component re-render: AuthProvider state change', traceId: undefined },
      { timestamp: '2026-05-03T14:33:22Z', level: 'INFO', service: 'api-gateway', message: 'Health check passed: all deps reachable', traceId: undefined },
      { timestamp: '2026-05-03T14:33:10Z', level: 'ERROR', service: 'legacy-svc', message: 'Pod crashed: exit code 137 (OOMKilled)', traceId: 'mno-345-lmn' },
      { timestamp: '2026-05-03T14:32:48Z', level: 'WARN', service: 'postgres-db', message: 'Slow query detected: 2.4s sequential scan on events table', traceId: undefined }
    ];
  }

  private generateAlerts(): Alert[] {
    return [
      {
        id: 'alert-1', severity: 'critical', title: 'Database Connection Failure',
        message: 'api-gateway cannot connect to postgres-db. Check network policy.',
        service: 'api-gateway', timestamp: '2026-05-03T14:35:12Z', acknowledged: false
      },
      {
        id: 'alert-2', severity: 'critical', title: 'Worker Queue Backpressure',
        message: 'Queue depth >1000. Scaling not triggered.',
        service: 'worker-queue', timestamp: '2026-05-03T14:34:58Z', acknowledged: false
      },
      {
        id: 'alert-3', severity: 'warning', title: 'High Memory Usage',
        message: 'data-processor JVM heap at 92%. Consider increasing Xmx.',
        service: 'data-processor', timestamp: '2026-05-03T14:34:12Z', acknowledged: false
      },
      {
        id: 'alert-4', severity: 'warning', title: 'Node NotReady',
        message: 'worker-3 has been NotReady for 15m. Check kubelet.',
        service: 'k8s-cluster', timestamp: '2026-05-03T14:30:00Z', acknowledged: false
      },
      {
        id: 'alert-5', severity: 'info', title: 'Deployment Successful',
        message: 'api-service v2.4.1 deployed to production.',
        service: 'api-gateway', timestamp: '2026-05-03T14:23:00Z', acknowledged: true
      }
    ];
  }

  private generateMetrics(): SystemMetric[] {
    return [
      { name: 'CPU Usage', value: 42, unit: '%', change: 5, changeType: 'up' },
      { name: 'Memory', value: 68, unit: '%', change: 12, changeType: 'up' },
      { name: 'Disk I/O', value: 23, unit: '%', change: -3, changeType: 'down' },
      { name: 'Network In', value: 156, unit: 'Mbps', change: 24, changeType: 'up' },
      { name: 'Network Out', value: 89, unit: 'Mbps', change: -8, changeType: 'down' },
      { name: 'Active Connections', value: 2847, unit: '', change: 156, changeType: 'up' }
    ];
  }

  private generateEnvironments(): Environment[] {
    return [
      {
        name: 'Production', status: 'degraded', version: 'v2.4.1',
        uptime: '45d 12h', requestsPerMin: 2847, errorRate: 2.3,
        latency: 145, lastDeploy: '2026-05-03T14:23:00Z'
      },
      {
        name: 'Staging', status: 'healthy', version: 'v2.5.0-rc1',
        uptime: '7d 3h', requestsPerMin: 342, errorRate: 0.1,
        latency: 78, lastDeploy: '2026-05-03T12:00:00Z'
      },
      {
        name: 'Development', status: 'healthy', version: 'v2.5.0-dev',
        uptime: '2d 8h', requestsPerMin: 56, errorRate: 0.5,
        latency: 42, lastDeploy: '2026-05-02T09:15:00Z'
      }
    ];
  }
}
