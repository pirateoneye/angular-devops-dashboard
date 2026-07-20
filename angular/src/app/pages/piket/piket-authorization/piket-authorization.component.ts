import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MsvFormsModule,
    MatSlideToggleModule,
    InfiniteScrollDirective,
  ],
  selector: 'app-piket-authorization',
  templateUrl: './piket-authorization.component.html',
  styleUrls: ['./piket-authorization.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiketAuthorizationComponent implements OnInit {
  passwordInput: string = '';
  redirectPath: string = '';
  loginError: string = '';

  constructor() {}

  ngOnInit(): void {
    this.redirectPath = history.state ? history.state.redirectUrl : null;
  }

  loginAction() {
    if (this.passwordInput == environment.piketPassword) {
      try {
      localStorage.setItem('msv-authorized-piket', this.passwordInput);
      } catch {
        /* ignore quota / private mode */
      }
    } else {
      this.loginError = 'Password salah';
    }
  }
}
