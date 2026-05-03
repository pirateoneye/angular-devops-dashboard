import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  providers: [DashboardService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private svc = inject(DashboardService);
  readonly metrics = this.svc.metrics;
  readonly environments = this.svc.environments;
  readonly totalPipelines = this.svc.totalPipelines;
  readonly successRate = this.svc.successRate;
  readonly activeAlerts = this.svc.activeAlerts;
  readonly runningContainers = this.svc.runningContainers;
  statusClass(s: string): string {
    switch (s) { case 'healthy': return 'success'; case 'degraded': return 'warning'; case 'down': return 'danger'; default: return 'neutral'; }
  }
}
