import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, guestGuard } from './auth-guard';
import { AuthService } from './auth-service';

describe('auth guards', () => {
  const isAuthenticated = signal(false);

  beforeEach(() => {
    isAuthenticated.set(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }],
    });
  });

  const run = (guard: typeof authGuard, url = '/engagements') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('authGuard redirects signed-out users to /login with a returnUrl', () => {
    const result = run(authGuard) as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fengagements');
  });

  it('authGuard lets signed-in users through', () => {
    isAuthenticated.set(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard sends signed-in users to the dashboard', () => {
    isAuthenticated.set(true);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(run(guestGuard) as UrlTree)).toBe('/dashboard');
  });
});
