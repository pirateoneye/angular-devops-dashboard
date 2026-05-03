import { Injectable, signal, effect } from '@angular/core';
import { timer } from 'rxjs';
import { LogEntry } from '../../../models/devops.models';

@Injectable()
export class LogsService {
  private _logs = signal<LogEntry[]>([]);
  readonly logs = this._logs.asReadonly();

  private _filterService = signal<string>('');
  readonly filterService = this._filterService.asReadonly();

  private _filterLevel = signal<string>('');
  readonly filterLevel = this._filterLevel.asReadonly();

  private _searchText = signal<string>('');
  readonly searchText = this._searchText.asReadonly();

  readonly services = signal<string[]>(['api-gateway','web-app','worker-queue','postgres-db','redis-cache','data-processor','legacy-svc']);
  readonly levels = signal<string[]>(['ERROR','WARN','INFO','DEBUG']);

  constructor() {
    this.refresh();
    effect((onCleanup) => {
      const sub = timer(3000, 3000).subscribe(() => this.refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }

  refresh() {
    this._logs.set([
      { timestamp: new Date(Date.now()-12000).toISOString(), level: 'ERROR', service: 'api-gateway', message: 'Connection timeout to postgres-db:5432 after 30s', traceId: 'abc-123-xyz' },
      { timestamp: new Date(Date.now()-42000).toISOString(), level: 'WARN', service: 'worker-queue', message: 'Queue depth exceeding threshold: 1,247 jobs pending', traceId: 'def-456-uvw' },
      { timestamp: new Date(Date.now()-58000).toISOString(), level: 'INFO', service: 'api-gateway', message: 'Request processed: POST /api/v2/users 201 45ms', traceId: 'ghi-789-rst' },
      { timestamp: new Date(Date.now()-72000).toISOString(), level: 'INFO', service: 'redis-cache', message: 'Cache hit ratio: 94.2%' },
      { timestamp: new Date(Date.now()-108000).toISOString(), level: 'ERROR', service: 'data-processor', message: 'OutOfMemoryError: Java heap space during batch processing', traceId: 'jkl-012-opq' },
      { timestamp: new Date(Date.now()-142000).toISOString(), level: 'WARN', service: 'api-gateway', message: 'Rate limit approaching: 890/1000 req/min' },
      { timestamp: new Date(Date.now()-168000).toISOString(), level: 'DEBUG', service: 'web-app', message: 'Component re-render: AuthProvider state change' },
      { timestamp: new Date(Date.now()-198000).toISOString(), level: 'INFO', service: 'api-gateway', message: 'Health check passed: all deps reachable' },
      { timestamp: new Date(Date.now()-228000).toISOString(), level: 'ERROR', service: 'legacy-svc', message: 'Pod crashed: exit code 137 (OOMKilled)', traceId: 'mno-345-lmn' },
      { timestamp: new Date(Date.now()-258000).toISOString(), level: 'WARN', service: 'postgres-db', message: 'Slow query detected: 2.4s sequential scan on events table' },
    ]);
  }

  filteredLogs(): LogEntry[] {
    return this._logs().filter(l => {
      if (this._filterService() && l.service !== this._filterService()) return false;
      if (this._filterLevel() && l.level !== this._filterLevel()) return false;
      if (this._searchText()) {
        const q = this._searchText().toLowerCase();
        return l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q) || (l.traceId && l.traceId.toLowerCase().includes(q));
      }
      return true;
    });
  }

  setService(s: string) { this._filterService.set(s); }
  setLevel(l: string) { this._filterLevel.set(l); }
  setSearch(q: string) { this._searchText.set(q); }
  clearFilters() { this._filterService.set(''); this._filterLevel.set(''); this._searchText.set(''); }
}
