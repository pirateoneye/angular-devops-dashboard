import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'pipelines', loadComponent: () => import('./components/pipelines/pipelines.component').then(m => m.PipelinesComponent) },
  { path: 'containers', loadComponent: () => import('./components/containers/containers.component').then(m => m.ContainersComponent) },
  { path: 'k8s', loadComponent: () => import('./components/k8s/k8s.component').then(m => m.K8sComponent) },
  { path: 'logs', loadComponent: () => import('./components/logs/logs.component').then(m => m.LogsComponent) },
  { path: 'alerts', loadComponent: () => import('./components/alerts/alerts.component').then(m => m.AlertsComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
