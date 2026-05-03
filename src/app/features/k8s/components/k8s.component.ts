import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { K8sService } from '../services/k8s.service';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
@Component({
  selector: 'app-k8s',
  standalone: true,
  imports: [CommonModule, BytesPipe, DurationPipe],
  providers: [K8sService],
  templateUrl: './k8s.component.html',
  styleUrls: ['./k8s.component.scss']
})
export class K8sComponent {
  private service = inject(K8sService);
  readonly pods = this.service.pods;
  readonly nodes = this.service.nodes;
  readonly activeTab = this.service.activeTab;
  statusClass(status: string): string { switch (status) { case 'Running': return 'success'; case 'Succeeded': return 'info'; case 'Pending': return 'warning'; case 'Failed': return 'danger'; default: return 'neutral'; } }
  nodeStatusClass(status: string): string { return status === 'Ready' ? 'success' : 'danger'; }
  cpuPercent(node: any): number { return Math.round((node.cpuCores.used / node.cpuCores.total) * 100); }
  memPercent(node: any): number { return Math.round((node.memoryBytes.used / node.memoryBytes.total) * 100); }
  setTab(t: 'pods' | 'nodes') { this.service.setTab(t); }
}
