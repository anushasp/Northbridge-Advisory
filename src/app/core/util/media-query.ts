import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * Signal that tracks a CSS media query, e.g. isMobile = mediaQuery('(max-width: 767px)').
 * Call it in an injection context (a field initializer or constructor).
 */
export function mediaQuery(query: string): Signal<boolean> {
  const mql = window.matchMedia(query);
  const matches = signal(mql.matches);
  const onChange = (e: MediaQueryListEvent) => matches.set(e.matches);
  mql.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', onChange));
  return matches.asReadonly();
}
