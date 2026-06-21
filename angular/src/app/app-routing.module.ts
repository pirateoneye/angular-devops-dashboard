import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { BatchRunnerComponent } from './pages/tools-dev/batch-runner/batch-runner.component';
import { LoginComponent } from './pages/login/login.component';
import { RouterModule } from '@angular/router';
import { CryptoComponent } from './pages/tools-dev/crypto/crypto.component';
import { FixDataUserComponent } from './pages/piket/fix-data-user/fix-data-user.component';
import { CheckDataComponent } from './pages/tools-dev/check-data/check-data.component';
import { DeleteDataComponent } from './pages/tools-dev/delete-data/delete-data.component';
import { PiketGuard } from './shared/service/auth-guard/piket.guard';
// import { GitlabGuard } from './service/auth-guard/gitlab.guard';
import { PiketAuthorizationComponent } from './pages/piket/piket-authorization/piket-authorization.component';
import { KeluhanListComponent } from './pages/piket/keluhan-list/keluhan-list.component';
// import { GitlabAuthComponent } from './pages/gitlab/gitlab-auth/gitlab-auth.component';
import { GitlabTaskComponent } from './pages/tools-dev/gitlab/gitlab-task/gitlab-task.component';
import { GitlabBulkComponent } from './pages/tools-dev/gitlab/gitlab-bulk/gitlab-bulk.component';
import { GitlabTagsMonitorComponent } from './pages/tools-dev/gitlab/gitlab-tags-monitor/gitlab-tags-monitor.component';
import { PaimonDupeComponent } from './pages/tools-dev/paimon-dupe/paimon-dupe.component';
import { FixAfterMergeCisComponent } from './pages/piket/fix-after-merge-cis/fix-after-merge-cis.component';

import { FileServerManagerComponent } from './pages/tools-dev/file-server-manager/file-server-manager.component';
import { PushNotifFcmComponent } from './pages/tools-dev/push-notif-fcm/push-notif-fcm.component';
import { PublishKafkaComponent } from './pages/tools-dev/publish-kafka/publish-kafka.component';
import { MsvTestComponent } from './pages/tools-dev/msv-test/msv-test.component';
import { MsvDocsComponent } from './pages/tools-dev/msv-docs/msv-docs.component';
import { CalendarPiketComponent } from './pages/piket/calendar-piket/calendar-piket.component';

const routes: Routes = [
  { path: 'tools-dev/gitlab/tags-monitor', component: GitlabTagsMonitorComponent },
  { path: 'tools-dev/gitlab/task', component: GitlabTaskComponent },
  { path: 'tools-dev/gitlab/bulk', component: GitlabBulkComponent },
  { path: 'tools-dev/paimon-dupe', component: PaimonDupeComponent },
  { path: 'tools-dev/batch-runner', component: BatchRunnerComponent },
  {
    path: 'tools-dev/crypto',
    component: CryptoComponent,
    canActivate: [PiketGuard],
  },
  { path: 'tools-dev/delete-data', component: DeleteDataComponent },
  { path: 'tools-dev/check-data', component: CheckDataComponent },
  {
    path: 'tools-dev/file-server-manager',
    component: FileServerManagerComponent,
  },
  { path: 'tools-dev/push-notif-fcm', component: PushNotifFcmComponent },
  { path: 'tools-dev/publish-kafka', component: PublishKafkaComponent },
  { path: 'tools-dev/msv-test', component: MsvTestComponent },
  { path: 'tools-dev/msv-docs', component: MsvDocsComponent },
  { path: 'piket/login', component: PiketAuthorizationComponent },
  {
    path: 'piket/keluhan-list',
    component: KeluhanListComponent,
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/fix-data-user',
    component: FixDataUserComponent,
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/fix-after-merge-cis',
    component: FixAfterMergeCisComponent,
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/calendar',
    component: CalendarPiketComponent,
    canActivate: [PiketGuard],
  },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'tools-dev/batch-runner', pathMatch: 'full' },
  { path: '**', redirectTo: 'tools-dev/batch-runner', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}


