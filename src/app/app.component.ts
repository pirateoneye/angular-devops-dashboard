import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { ToastComponent } from './shared/components/toast/toast.component';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private theme = inject(ThemeService);
  private loading = inject(LoadingService);
  readonly isDark = this.theme.isDark;
  readonly loading$ = this.loading.loading;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '◈' },
    { path: '/pipelines', label: 'Pipelines', icon: '▶' },
    { path: '/containers', label: 'Containers', icon: '□' },
    { path: '/k8s', label: 'Kubernetes', icon: '☸' },
    { path: '/logs', label: 'Logs', icon: '≡' },
    { path: '/alerts', label: 'Alerts', icon: '⚠' },
  ];

  toggleTheme() { this.theme.toggle(); }
}
