import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevOpsService } from '../../services/devops.service';
import { Pipeline } from '../../models/devops.models';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss']
})
export class PipelinesComponent implements OnInit {
  pipelines: Pipeline[] = [];
  loading = true;
  expandedPipeline: string | null = null;

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.devops.getPipelines().subscribe(p => {
      this.pipelines = p;
      this.loading = false;
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'running': return 'info';
      case 'failed': return 'danger';
      case 'pending': return 'neutral';
      case 'cancelled': return 'warning';
      default: return 'neutral';
    }
  }

  toggleExpand(id: string): void {
    this.expandedPipeline = this.expandedPipeline === id ? null : id;
  }
}
