import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Settings shell. Each tab is a child route (/settings/profile, ...), unlike the detail page's ?tab= approach. */
@Component({
  selector: 'app-settings',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your account and workspace preferences.</p>
      </div>
    </header>

    <nav class="tabs" aria-label="Settings sections">
      @for (tab of tabs; track tab.path) {
        <a class="tab" [routerLink]="tab.path" routerLinkActive="active" ariaCurrentWhenActive="page">{{ tab.label }}</a>
      }
    </nav>

    <div class="content"><router-outlet /></div>
  `,
  styles: `.content { max-width: 760px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected readonly tabs = [
    { path: 'profile', label: 'Profile' },
    { path: 'preferences', label: 'Preferences' },
    { path: 'security', label: 'Security' },
  ];
}
