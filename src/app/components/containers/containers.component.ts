import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevOpsService } from '../../services/devops.service';
import { Container } from '../../models/devops.models';

@Component({
  selector: 'app-containers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './containers.component.html',
  styleUrls: ['./containers.component.scss']
})
export class ContainersComponent implements OnInit {
  containers: Container[] = [];
  loading = true;

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.devops.getContainers().subscribe(c => {
      this.containers = c;
      this.loading = false;
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'running': return 'success';
      case 'restarting': return 'warning';
      case 'paused': return 'info';
      case 'exited': return 'danger';
      default: return 'neutral';
    }
  }

  memPercent(c: Container): number {
    return c.memoryLimit ? Math.round((c.memory / c.memoryLimit) * 100) : 0;
  }
}
