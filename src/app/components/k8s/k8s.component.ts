import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevOpsService } from '../../services/devops.service';
import { K8sPod, K8sNode } from '../../models/devops.models';

@Component({
  selector: 'app-k8s',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './k8s.component.html',
  styleUrls: ['./k8s.component.scss']
})
export class K8sComponent implements OnInit {
  pods: K8sPod[] = [];
  nodes: K8sNode[] = [];
  loading = true;
  activeTab: 'pods' | 'nodes' = 'pods';

  constructor(private devops: DevOpsService) {}

  ngOnInit(): void {
    this.devops.getK8sPods().subscribe(p => {
      this.pods = p;
      this.loading = false;
    });
    this.devops.getK8sNodes().subscribe(n => this.nodes = n);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Running': return 'success';
      case 'Succeeded': return 'info';
      case 'Pending': return 'warning';
      case 'Failed': return 'danger';
      default: return 'neutral';
    }
  }

  nodeStatusClass(status: string): string {
    return status === 'Ready' ? 'success' : 'danger';
  }

  cpuPercent(node: K8sNode): number {
    return Math.round((node.cpu.used / node.cpu.total) * 100);
  }

  memPercent(node: K8sNode): number {
    return Math.round((node.memory.used / node.memory.total) * 100);
  }
}
