import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../services/alerts.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  providers: [AlertsService],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent {
  private service = inject(AlertsService);
  readonly alerts = this.service.alerts;
  readonly severities = this.service.severities;
  readonly filterSeverity = this.service.filterSeverity;
  filteredAlerts() { return this.service.filteredAlerts(); }
  unacknowledgedCount() { return this.service.unacknowledgedCount(); }
  severityClass(s: string): string { switch (s) { case 'critical': return 'danger'; case 'warning': return 'warning'; case 'info': return 'info'; default: return 'neutral'; } }
  severityIcon(s: string): string { switch (s) { case 'critical': return '🔴'; case 'warning': return '🟡'; case 'info': return '🔵'; default: return '⚪'; } }
  acknowledge(id: string) { this.service.acknowledge(id); }
  setFilter(s: string) { this.service.setFilter(s); }
}
