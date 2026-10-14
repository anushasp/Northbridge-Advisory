import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { EngagementService } from '../../core/data/engagement-service';
import { mediaQuery } from '../../core/util/media-query';
import { Icon } from '../../shared/icon/icon';

interface NavItem {
  label: string;
  path: string;
  badge?: number;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly engagements = inject(EngagementService);

  protected readonly collapsed = signal(false);
  private readonly isMobile = mediaQuery('(max-width: 767px)');
  /** The mobile drawer always shows full labels, even if the desktop sidebar was collapsed. */
  protected readonly compact = computed(() => this.collapsed() && !this.isMobile());
  protected readonly mobileNavOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  /** Live count for the sidebar badge; refreshes after creates and archives. */
  private readonly engagementCount = toSignal(
    toObservable(this.engagements.version).pipe(
      switchMap(() => this.engagements.list({ pageSize: 1 })),
      map((page) => page.total),
    ),
  );

  protected readonly nav = computed<NavItem[]>(() => [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Engagements', path: '/engagements', badge: this.engagementCount() },
    { label: 'Team', path: '/team' },
    { label: 'Settings', path: '/settings' },
  ]);

  /** Top bar search jumps to the engagements list with the term applied. */
  protected globalSearch(term: string): void {
    const q = term.trim();
    this.router.navigate(['/engagements'], { queryParams: q ? { q } : {} });
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
