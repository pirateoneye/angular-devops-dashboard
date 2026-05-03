import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevOpsService } from '../../services/devops.service';
import { Alert } from '../../models/devops.models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;
  filterSeverity = '';

  severities = ['critical', 'warning', 'info'];

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.devops.getAlerts().subscribe(a => {
      this.alerts = a;
      this.loading = false;
    });
  }

  get filteredAlerts(): Alert[] {
    if (!this.filterSeverity) return this.alerts;
    return this.alerts.filter(a => a.severity === this.filterSeverity);
  }

  get unacknowledgedCount(): number {
    return this.alerts.filter(a => !a.acknowledged).length;
  }

  severityClass(s: string): string {
    switch (s) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'neutral';
    }
  }

  severityIcon(s: string): string {
    switch (s) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  }

  acknowledge(alert: Alert): void {
    this.devops.acknowledgeAlert(alert.id);
  }
}
