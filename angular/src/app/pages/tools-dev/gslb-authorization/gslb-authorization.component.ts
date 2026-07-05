import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { GslbService } from '../../../shared/service/gslb/gslb.service';

/**
 * Single login page for the GSLB console — reached via `/gslb/login` when
 * `gslbGuard` rejects a navigation. Takes a gege.com username + password,
 * POSTs them to `/api/login` (via `GslbService.loginWithCredentials`) and on
 * success navigates back to the originally requested URL (or the console).
 */
@Component({
  standalone: true,
  selector: 'app-gslb-authorization',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './gslb-authorization.component.html',
  styleUrls: ['./gslb-authorization.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GslbAuthorizationComponent implements OnInit {
  private readonly svc = inject(GslbService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  remember = true;
  submitting = false;
  loginError = '';
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
        this.router.navigateByUrl(this.redirectPath || '/tools-dev/gslb');
      } else {
        this.loginError = 'Login gagal — periksa username & password';
      }
    } finally {
      this.submitting = false;
    }
  }
}
