import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GslbService } from '../../../shared/service/gslb/gslb.service';

@Component({
  standalone: true,
  selector: 'app-gslb-auth-dialog',
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
  templateUrl: './gslb-auth-dialog.component.html',
  styleUrls: ['./gslb-auth-dialog.component.css'],
})
export class GslbAuthDialogComponent {
  private readonly svc = inject(GslbService);
  private readonly ref = inject<MatDialogRef<GslbAuthDialogComponent>>(MatDialogRef);

  username = '';
  password = '';
  submitting = false;
  error = '';
  readonly showPw = signal(false);

  async login(): Promise<void> {
    if (!this.username.trim() || !this.password) {
      this.error = 'Username & password wajib diisi';
      return;
    }
    this.submitting = true;
    this.error = '';
    const ok = await this.svc.loginWithCredentials(this.username, this.password, true);
    this.submitting = false;
    if (ok) {
      this.ref.close(true);
    } else {
      this.error = 'Login gagal — periksa username & password';
    }
  }

  close(): void {
    this.ref.close(false);
  }
}
