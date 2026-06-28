import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { PiketGuard } from './shared/service/auth-guard/piket.guard';

const routes: Routes = [
  { path: 'tools-dev/gitlab/tags-monitor', loadComponent: () => import('./pages/tools-dev/gitlab/gitlab-tags-monitor/gitlab-tags-monitor.component').then(m => m.GitlabTagsMonitorComponent) },
  { path: 'tools-dev/gitlab/task', loadComponent: () => import('./pages/tools-dev/gitlab/gitlab-task/gitlab-task.component').then(m => m.GitlabTaskComponent) },
  { path: 'tools-dev/gitlab/bulk', loadComponent: () => import('./pages/tools-dev/gitlab/gitlab-bulk/gitlab-bulk.component').then(m => m.GitlabBulkComponent) },
  { path: 'tools-dev/paimon-dupe', loadComponent: () => import('./pages/tools-dev/paimon-dupe/paimon-dupe.component').then(m => m.PaimonDupeComponent) },
  { path: 'tools-dev/batch-runner', loadComponent: () => import('./pages/tools-dev/batch-runner/batch-runner.component').then(m => m.BatchRunnerComponent) },
  {
    path: 'tools-dev/crypto',
    loadComponent: () => import('./pages/tools-dev/crypto/crypto.component').then(m => m.CryptoComponent),
    canActivate: [PiketGuard],
  },
  { path: 'tools-dev/delete-data', loadComponent: () => import('./pages/tools-dev/delete-data/delete-data.component').then(m => m.DeleteDataComponent) },
  { path: 'tools-dev/check-data', loadComponent: () => import('./pages/tools-dev/check-data/check-data.component').then(m => m.CheckDataComponent) },
  {
    path: 'tools-dev/file-server-manager',
    loadComponent: () => import('./pages/tools-dev/file-server-manager/file-server-manager.component').then(m => m.FileServerManagerComponent),
  },
  { path: 'tools-dev/push-notif-fcm', loadComponent: () => import('./pages/tools-dev/push-notif-fcm/push-notif-fcm.component').then(m => m.PushNotifFcmComponent) },
  { path: 'tools-dev/publish-kafka', loadComponent: () => import('./pages/tools-dev/publish-kafka/publish-kafka.component').then(m => m.PublishKafkaComponent) },
  { path: 'tools-dev/msv-test', loadComponent: () => import('./pages/tools-dev/msv-test/msv-test.component').then(m => m.MsvTestComponent) },
  { path: 'tools-dev/msv-docs', loadComponent: () => import('./pages/tools-dev/msv-docs/msv-docs.component').then(m => m.MsvDocsComponent) },
  { path: 'piket/login', loadComponent: () => import('./pages/piket/piket-authorization/piket-authorization.component').then(m => m.PiketAuthorizationComponent) },
  {
    path: 'piket/keluhan-list',
    loadComponent: () => import('./pages/piket/keluhan-list/keluhan-list.component').then(m => m.KeluhanListComponent),
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/fix-data-user',
    loadComponent: () => import('./pages/piket/fix-data-user/fix-data-user.component').then(m => m.FixDataUserComponent),
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/fix-after-merge-cis',
    loadComponent: () => import('./pages/piket/fix-after-merge-cis/fix-after-merge-cis.component').then(m => m.FixAfterMergeCisComponent),
    canActivate: [PiketGuard],
  },
  {
    path: 'piket/calendar',
    loadComponent: () => import('./pages/piket/calendar-piket/calendar-piket.component').then(m => m.CalendarPiketComponent),
    canActivate: [PiketGuard],
  },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'demo', loadComponent: () => import('./pages/demo/demo.component').then(m => m.DemoComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/home/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'utilities', loadComponent: () => import('./pages/toolbox/toolbox.component').then(m => m.ToolboxComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
