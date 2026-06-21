import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PiketGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot,state: RouterStateSnapshot): any {
    const userLocalStorage = localStorage.getItem('authorized-piket');
    if (userLocalStorage != environment.piketPassword) {
      let redirectUrl = {redirectUrl : state.url};
      this.router.navigate(['/piket/login'], {state : redirectUrl});
      return false;
    }
    return true;
  }
  
}