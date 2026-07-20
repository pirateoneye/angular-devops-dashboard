import { inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { environment } from 'src/environments/environment';

/**
 * Secret front-door for Piket pages — the modern functional-guard form.
 * The route is reachable by URL, but entering requires the password in
 * `environment.piketPassword`. Wrong/missing password redirects to
 * `/piket/login`; the authorized value is cached in
 * `localStorage['msv-authorized-piket']` so the gate persists for the browser.
 */
export const piketGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  if (localStorage.getItem('msv-authorized-piket') !== environment.piketPassword) {
    const router = inject(Router);
    router.navigate(['/piket/login'], { state: { redirectUrl: state.url } });
    return false;
  }
  return true;
};
