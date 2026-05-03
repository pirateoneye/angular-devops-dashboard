import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/components/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'pipelines', loadComponent: () => import('./features/pipelines/components/pipelines.component').then(m => m.PipelinesComponent) },
  { path: 'containers', loadComponent: () => import('./features/containers/components/containers.component').then(m => m.ContainersComponent) },
  { path: 'k8s', loadComponent: () => import('./features/k8s/components/k8s.component').then(m => m.K8sComponent) },
  { path: 'logs', loadComponent: () => import('./features/logs/components/logs.component').then(m => m.LogsComponent) },
  { path: 'alerts', loadComponent: () => import('./features/alerts/components/alerts.component').then(m => m.AlertsComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
