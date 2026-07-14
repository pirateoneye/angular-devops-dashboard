import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService } from '../../../../shared/service/gitlab/gitlab.service';

@Component({
  standalone: true,
  selector: 'gl-connect',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectComponent {
  private readonly svc = inject(GitLabService);

  readonly token = signal('');
  readonly showPassword = signal(false);
  readonly connecting = signal(false);
  readonly error = signal('');

  get env() { return environment; }

  async connect(): Promise<void> {
    const t = this.token().trim();
    if (!t || t.length < 10) {
      this.error.set('Token must be at least 10 characters');
      return;
    }
    this.connecting.set(true);
    this.error.set('');
    try {
      await this.svc.login(t);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      this.error.set(`Invalid token — ${msg}. Check api scope.`);
      this.connecting.set(false);
      return;
    }
    this.connecting.set(false);
  }

  /** DEV ONLY: bypass auth to inspect the full UI without a real PAT. */
  devBypass(): void {
    this.svc.devBypass();
  }
}
