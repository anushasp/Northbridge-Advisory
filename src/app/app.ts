import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService } from './core/prefs/preferences-service';
import { ToastOutlet } from './shared/toast/toast-outlet';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastOutlet],
  template: '<router-outlet /><app-toast-outlet />',
})
export class App {
  // Created at startup so the saved theme is applied before any page renders.
  private readonly prefs = inject(PreferencesService);
}
