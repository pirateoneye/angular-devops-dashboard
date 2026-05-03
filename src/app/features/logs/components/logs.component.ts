import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  providers: [LogsService],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent {
  service = inject(LogsService);
  readonly logs = this.service.logs;
  readonly services = this.service.services;
  readonly levels = this.service.levels;
  filterService = this.service.filterService;
  filterLevel = this.service.filterLevel;
  searchText = this.service.searchText;

  filteredLogs() { return this.service.filteredLogs(); }
  levelClass(level: string): string {
    switch (level) { case 'ERROR': return 'level-error'; case 'WARN': return 'level-warn'; case 'INFO': return 'level-info'; case 'DEBUG': return 'level-debug'; default: return ''; }
  }
  clearFilters() { this.service.clearFilters(); }
}
