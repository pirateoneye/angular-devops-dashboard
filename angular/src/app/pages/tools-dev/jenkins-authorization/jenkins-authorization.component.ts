import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { JenkinsService } from '../../../shared/service/jenkins/jenkins.service';

/**
 * Single login page for the Jenkins Build Console — reached via `/jenkins/login`
 * when `jenkinsGuard` rejects a navigation. Takes Jenkins username + password,
 * saves them via `JenkinsService.loginWithCredentials` and on success navigates
 * back to the originally requested URL (or the tool).
 */
@Component({
  standalone: true,
  selector: 'app-jenkins-authorization',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './jenkins-authorization.component.html',
  styleUrls: ['./jenkins-authorization.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JenkinsAuthorizationComponent implements OnInit {
  private readonly svc = inject(JenkinsService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  remember = true;
  submitting = false;
  loginError = '';
  readonly showPassword = signal(false);
  redirectPath = '';

  ngOnInit(): void {
    this.redirectPath = history.state ? history.state.redirectUrl : '';
  }

  async loginAction(): Promise<void> {
    if (!this.username.trim() || !this.password) {
      this.loginError = 'Username & password wajib diisi';
      return;
    }
    this.submitting = true;
    this.loginError = '';
    try {
      const ok = await this.svc.loginWithCredentials(
        this.username,
        this.password,
        this.remember,
      );
      if (ok) {
        this.router.navigateByUrl(this.redirectPath || '/tools-dev/jenkins-build');
      } else {
        this.loginError = 'Login gagal — periksa username & password';
      }
    } finally {
      this.submitting = false;
    }
  }
}
