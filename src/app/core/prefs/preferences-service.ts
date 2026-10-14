import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

export interface Preferences {
  emailNotifications: boolean;
  deadlineReminders: boolean;
  budgetAlerts: boolean;
  defaultView: 'my' | 'all';
  theme: Theme;
}

const STORAGE_KEY = 'engagetrack.preferences';

const DEFAULTS: Preferences = {
  emailNotifications: true,
  deadlineReminders: true,
  budgetAlerts: true,
  defaultView: 'my',
  theme: 'light',
};

/** Per-user preferences kept in localStorage. The theme is applied to <html> as data-theme. */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);

  readonly prefs = signal<Preferences>(this.load());

  constructor() {
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.prefs().theme;
    });
  }

  save(prefs: Preferences): void {
    this.prefs.set(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage can be unavailable (private mode); the in-memory value still applies.
    }
  }

  private load(): Preferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  }
}
