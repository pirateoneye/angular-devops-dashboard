import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JenkinsService } from '../jenkins/jenkins.service';

/**
 * Front-door for the Jenkins Build console. Requires saved credentials in
 * `JenkinsService` (restored from localStorage on construction). No session →
 * redirect to `/jenkins/login`, passing the requested URL so the login page
 * can send the user back where they were going.
 */
export const jenkinsGuard: CanActivateFn = (_route, state) => {
  if (!inject(JenkinsService).authed()) {
    const router = inject(Router);
    router.navigate(['/jenkins/login'], { state: { redirectUrl: state.url } });
    return false;
  }
  return true;
};
