import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
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
    MaterialModule,
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
      localStorage.setItem('authorized-piket', this.passwordInput);
      window.location.href = this.redirectPath;
    } else {
      this.loginError = 'Password salah';
    }
  }
}
