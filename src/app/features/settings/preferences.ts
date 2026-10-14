import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PreferencesService, Theme } from '../../core/prefs/preferences-service';
import { Icon } from '../../shared/icon/icon';
import { ToastService } from '../../shared/toast/toast-service';

@Component({
  selector: 'app-preferences-settings',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <fieldset class="card panel">
        <legend class="section-title">Notifications</legend>
        @for (t of toggles; track t.key) {
          <div class="toggle-row">
            <label [for]="'pref-' + t.key">
              <strong>{{ t.label }}</strong>
              <span class="caption">{{ t.hint }}</span>
            </label>
            <input [id]="'pref-' + t.key" type="checkbox" role="switch" class="switch" [formControlName]="t.key" />
          </div>
        }
      </fieldset>

      <fieldset class="card panel">
        <legend class="section-title">Workspace appearance</legend>
        <div class="field">
          <label for="pref-view">Default dashboard view</label>
          <select id="pref-view" class="select" formControlName="defaultView">
            <option value="my">My engagements</option>
            <option value="all">All engagements</option>
          </select>
        </div>

        <div class="field">
          <span id="theme-label" class="label">Theme</span>
          <div class="themes" role="radiogroup" aria-labelledby="theme-label">
            @for (t of themes; track t.value) {
              <label class="theme" [class.on]="form.controls.theme.value === t.value">
                <input type="radio" formControlName="theme" [value]="t.value" class="visually-hidden" />
                <app-icon [name]="t.icon" /> {{ t.label }}
                @if (form.controls.theme.value === t.value) { <app-icon name="check" [size]="14" /> }
              </label>
            }
          </div>
          <p class="caption">Your appearance preference applies only to your account.</p>
        </div>
      </fieldset>

      <button type="submit" class="btn btn-primary">Save Preferences</button>
    </form>
  `,
  styleUrl: './settings-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesSettings {
  private readonly prefs = inject(PreferencesService);
  private readonly toast = inject(ToastService);

  protected readonly toggles = [
    { key: 'emailNotifications', label: 'Email notifications', hint: 'Receive engagement updates and team activity.' },
    { key: 'deadlineReminders', label: 'Deadline reminders', hint: 'Get reminders 3 days before an engagement is due.' },
    { key: 'budgetAlerts', label: 'Budget alerts', hint: 'Be notified when an engagement reaches 80% of budget.' },
  ] as const;

  protected readonly themes = [
    { value: 'light' as Theme, label: 'Light', icon: 'sun' as const },
    { value: 'dark' as Theme, label: 'Dark', icon: 'moon' as const },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({ ...this.prefs.prefs() });

  protected save(): void {
    this.prefs.save(this.form.getRawValue());
    this.toast.show('Preferences saved');
  }
}
