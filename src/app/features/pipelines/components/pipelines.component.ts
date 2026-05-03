import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PipelineService } from '../services/pipeline.service';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [CommonModule, DurationPipe, RelativeTimePipe],
  providers: [PipelineService],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss']
})
export class PipelinesComponent {
  private svc = inject(PipelineService);
  readonly pipelines = this.svc.pipelines;
  readonly filter = this.svc.filter;
  readonly filtered = this.svc.filtered;
  statusClass(s: string): string { switch (s) { case 'success': return 'success'; case 'failed': return 'danger'; case 'running': return 'info'; default: return 'neutral'; } }
  stageWidth(s: any, total: number) { return this.svc.stageWidth(s, total); }
  stageClass(s: any) { return this.svc.stageClass(s); }
  setFilter(f: any) { this.svc.setFilter(f); }
}
