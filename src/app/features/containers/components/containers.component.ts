import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerService } from '../services/container.service';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
@Component({
  selector: 'app-containers',
  standalone: true,
  imports: [CommonModule, BytesPipe, RelativeTimePipe],
  providers: [ContainerService],
  templateUrl: './containers.component.html',
  styleUrls: ['./containers.component.scss']
})
export class ContainersComponent {
  private svc = inject(ContainerService);
  readonly containers = this.svc.containers;
  statusClass(s: string): string { switch (s) { case 'running': return 'success'; case 'exited': return 'danger'; case 'paused': return 'warning'; default: return 'neutral'; } }
  healthClass(h?: string): string { switch (h) { case 'healthy': return 'success'; case 'unhealthy': return 'danger'; case 'starting': return 'info'; default: return 'neutral'; } }
  memPercent(c: any): number { return Math.round((c.memoryBytes / c.memoryLimit) * 100); }
}
