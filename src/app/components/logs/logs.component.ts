import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DevOpsService } from '../../services/devops.service';
import { LogEntry } from '../../models/devops.models';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  loading = true;
  filterService = '';
  filterLevel = '';
  searchText = '';

  services = ['api-gateway', 'web-app', 'worker-queue', 'postgres-db', 'redis-cache', 'data-processor', 'legacy-svc'];
  levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.devops.getLogs(this.filterService || undefined, this.filterLevel || undefined).subscribe(l => {
      this.logs = l;
      this.applySearch();
      this.loading = false;
    });
  }

  applySearch(): void {
    if (!this.searchText) {
      this.filteredLogs = this.logs;
      return;
    }
    const q = this.searchText.toLowerCase();
    this.filteredLogs = this.logs.filter(l =>
      l.message.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q) ||
      l.traceId?.toLowerCase().includes(q)
    );
  }

  levelClass(level: string): string {
    switch (level) {
      case 'ERROR': return 'level-error';
      case 'WARN': return 'level-warn';
      case 'INFO': return 'level-info';
      case 'DEBUG': return 'level-debug';
      default: return '';
    }
  }

  clearFilters(): void {
    this.filterService = '';
    this.filterLevel = '';
    this.searchText = '';
    this.loadLogs();
  }
}
