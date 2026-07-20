import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService } from '../../../shared/service/gitlab/gitlab.service';
import { ConnectComponent } from './connect/connect.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TagsComponent } from './tags/tags.component';
import { BulkComponent } from './bulk/bulk.component';
import { PipelinesComponent } from './pipelines/pipelines.component';
import { MergeRequestsComponent } from './merge-requests/merge-requests.component';
import { ActivityComponent } from './activity/activity.component';
import { ViewName } from './types';

@Component({
  standalone: true,
  selector: 'app-gitlab',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ConnectComponent,
    DashboardComponent,
    TagsComponent,
    BulkComponent,
    ActivityComponent,
    PipelinesComponent,
    MergeRequestsComponent,
  ],
  templateUrl: './gitlab.component.html',
  styleUrls: ['./gitlab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitlabComponent {
  private readonly svc = inject(GitLabService);

  readonly isAuth = computed(() => this.svc.token().length > 0);
  readonly maskedToken = this.svc.maskedToken;
  readonly loading = this.svc.loadingProjects;
  readonly groups = this.svc.groups;
  readonly loadingGroups = this.svc.loadingGroups;
  readonly view = signal<ViewName>('connect');
  readonly groupId = signal<number>(0);
  readonly selectedProjectIds = signal<number[]>([]);

  constructor() {
    effect(
      () => {
        if (this.isAuth()) {
          if (this.svc.token() !== 'bypass-dummy-token') {
            void this.svc.listGroups().then((g) => {
              if (g.length && this.groupId() === 0) {
                this.groupId.set(g[0].id);
                void this.svc.listGroupProjects(g[0].id);
              }
            });
          }
          this.view.set('dashboard');
        }
      },
      { allowSignalWrites: true },
    );
  }

  setProjectIds(ids: number[]): void {
    this.selectedProjectIds.set(ids);
    this.view.set('tags');
  }

  async onGroupChange(gid: number): Promise<void> {
    this.groupId.set(gid);
    await this.svc.listGroupProjects(gid);
  }

  async refresh(): Promise<void> {
    await this.svc.listGroupProjects(this.groupId());
  }

  goToView(v: ViewName): void {
    this.view.set(v);
  }

  logout(): void {
    this.svc.logout();
    this.view.set('connect');
  }
}
