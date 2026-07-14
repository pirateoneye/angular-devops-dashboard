import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GitlabActivityService } from '../gitlab-activity.service';

@Component({
  standalone: true,
  selector: 'gl-activity',
  imports: [CommonModule, MatIconModule, DatePipe],
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComponent {
  readonly logSvc = inject(GitlabActivityService);
  readonly collapsed = this.logSvc.collapsed;

  clear(): void {
    this.logSvc.clear();
  }

  toggle(): void {
    this.logSvc.toggle();
  }
}
