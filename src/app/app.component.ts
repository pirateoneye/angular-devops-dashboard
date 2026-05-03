import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '◈' },
    { path: '/pipelines', label: 'Pipelines', icon: '▶' },
    { path: '/containers', label: 'Containers', icon: '□' },
    { path: '/k8s', label: 'Kubernetes', icon: '☸' },
    { path: '/logs', label: 'Logs', icon: '≡' },
    { path: '/alerts', label: 'Alerts', icon: '⚠' },
  ];
}
