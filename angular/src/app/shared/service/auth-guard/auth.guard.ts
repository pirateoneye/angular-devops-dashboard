import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Generic login gate — the modern functional-guard form. Redirects to
 * `/login` when `localStorage['authorized']` is missing.
 *
 * UNUSED in current routing (piket uses piketGuard, GSLB uses gslbGuard).
 * Kept here for future protected pages that need a simple pass-through gate.
 *
 * @deprecated Use domain-specific guards like piketGuard/gslbGuard instead.
 */
export const authGuard: CanActivateFn = () => {
  if (!localStorage.getItem('authorized')) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }
  return true;
};
