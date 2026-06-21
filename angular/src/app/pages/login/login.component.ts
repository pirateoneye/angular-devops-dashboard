import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'msv-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  usernameInput: string = '';
  passwordInput: string = '';

  redirectPath: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.redirectPath = this.route.snapshot.queryParams['redirect'];
    console.log(this.redirectPath);
  }

  loginAction() {

    if (this.usernameInput == 'merchantbca' && this.passwordInput == 'bcabca01') {
      localStorage.setItem('user', 'GSIT MSE');
      localStorage.setItem('authorized', 'true');

      window.location.href = this.redirectPath;
    }
    else {
      alert('Username atau password salah');
    }
  }


}
