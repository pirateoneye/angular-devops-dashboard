import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../module/material.module';
import { MsvFormsModule } from '../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, MsvFormsModule, MatSlideToggleModule, InfiniteScrollModule],
  selector: 'msv-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  usernameInput: string = '';
  passwordInput: string = '';

  redirectPath: string = '';
  loginError: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.redirectPath = this.route.snapshot.queryParams['redirect'];
  }

  loginAction() {

    if (this.usernameInput == 'merchantbca' && this.passwordInput == 'bcabca01') {
      localStorage.setItem('user', 'GSIT MSE');
      localStorage.setItem('authorized', 'true');

      window.location.href = this.safeRedirectPath(this.redirectPath);
    }
    else {
      this.loginError = 'Username atau password salah';
    }
  }

  private safeRedirectPath(path: string): string {
    const p = (path || '').trim();
    if (p === '') {
      return '/dashboard';
    }
    // Reject anything that looks like an absolute URL or another origin.
    if (p.startsWith('//') || /^https?:/i.test(p) || p.includes('@') || /^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(p)) {
      return '/dashboard';
    }
    // Only allow relative in-app paths.
    if (p.startsWith('/') || p.startsWith('./') || p.startsWith('#')) {
      return p;
    }
    return '/dashboard';
  }


}
