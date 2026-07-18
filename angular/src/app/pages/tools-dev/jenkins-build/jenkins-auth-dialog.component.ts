import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { JenkinsService } from '../../../shared/service/jenkins/jenkins.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-jenkins-auth-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './jenkins-auth-dialog.component.html',
  styleUrls: ['./jenkins-auth-dialog.component.css'],
})
export class JenkinsAuthDialogComponent {
  private readonly svc = inject(JenkinsService);
  private readonly ref = inject<MatDialogRef<JenkinsAuthDialogComponent>>(MatDialogRef);

  username = '';
  token = '';
  submitting = false;
  error = '';
  readonly showToken = signal(false);

  async login(): Promise<void> {
    if (!this.username.trim() || !this.token) {
      this.error = 'Username & token wajib diisi';
      return;
    }
    this.submitting = true;
    this.error = '';
    const ok = await this.svc.loginWithCredentials(this.username, this.token, true);
    this.submitting = false;
    if (ok) {
      this.ref.close(true);
    } else {
      this.error = 'Login gagal — periksa username & token';
    }
  }

  close(): void {
    this.ref.close(false);
  }
}
