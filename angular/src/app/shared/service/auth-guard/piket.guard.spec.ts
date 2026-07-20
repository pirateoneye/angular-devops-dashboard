import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { piketGuard } from './piket.guard';
import { environment } from 'src/environments/environment';

describe('piketGuard', () => {
  let router: Router;
  const route = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should deny access when piket password is missing', () => {
  localStorage.removeItem('msv-authorized-piket');
    const state = { url: '/piket/keluhan-list' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      piketGuard(route, state),
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/piket/login'], {
      state: { redirectUrl: '/piket/keluhan-list' },
    });
  });

  it('should deny access when piket password is wrong', () => {
    localStorage.setItem('msv-authorized-piket', 'wrong-password');
    const state = { url: '/piket/keluhan-list' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      piketGuard(route, state),
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should allow access when piket password matches', () => {
    localStorage.setItem('msv-authorized-piket', environment.piketPassword);
    const state = { url: '/piket/keluhan-list' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      piketGuard(route, state),
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
