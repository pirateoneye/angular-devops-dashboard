import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-piket-authorization',
  templateUrl: './piket-authorization.component.html',
  styleUrls: ['./piket-authorization.component.css']
})
export class PiketAuthorizationComponent {

  passwordInput: string = '';
  redirectPath: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.redirectPath = history.state ? history.state.redirectUrl : null;
    console.log(this.redirectPath);
  }

  loginAction() {
    if (this.passwordInput == environment.piketPassword) {
      localStorage.setItem('authorized-piket', this.passwordInput);
      window.location.href = this.redirectPath;
    }
    else {
      alert('Password salah');
    }
  }
}
