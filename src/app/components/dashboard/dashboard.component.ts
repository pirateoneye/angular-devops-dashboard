import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevOpsService } from '../../services/devops.service';
import { SystemMetric, Environment } from '../../models/devops.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  metrics: SystemMetric[] = [];
  environments: Environment[] = [];
  loading = true;

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.devops.getMetrics().subscribe(m => {
      this.metrics = m;
      this.loading = false;
    });
    this.devops.getEnvironments().subscribe(e => this.environments = e);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'danger';
      default: return 'neutral';
    }
  }
}
