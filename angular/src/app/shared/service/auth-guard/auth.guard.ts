import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Generic login gate — the modern functional-guard form. Redirects to
 * `/login` when `localStorage['authorized']` is missing. (Currently unused
 * in routing; kept here as a ready-made guard for any future protected page.)
 */
export const authGuard: CanActivateFn = () => {
  if (!localStorage.getItem('authorized')) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }
  return true;
};
