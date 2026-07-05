import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GslbService } from 'src/app/shared/service/gslb/gslb.service';

/**
 * Front-door for the GSLB console. The route is reachable by URL, but entering
 * requires a valid session in the root `GslbService` (a bearer token obtained
 * from `POST /api/login` on the `/gslb/login` page). The service restores its
 * session from localStorage on construction, so `authed()` is correct at guard
 * time. No session → redirect to `/gslb/login`, passing the requested URL so the
 * login page can send the user back where they were going.
 */
export const gslbGuard: CanActivateFn = (_route, state) => {
  if (!inject(GslbService).authed()) {
    const router = inject(Router);
    router.navigate(['/gslb/login'], { state: { redirectUrl: state.url } });
    return false;
  }
  return true;
};
