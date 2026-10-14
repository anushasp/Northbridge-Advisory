import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth-service';
import { User } from '../../core/data/models';
import { Icon } from '../../shared/icon/icon';
import { ToastService } from '../../shared/toast/toast-service';

@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <form class="card panel" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 class="section-title">Personal information</h2>
      <p class="muted">Your profile helps colleagues identify you across engagements and activity.</p>

      <div class="photo">
        <span class="avatar big">{{ auth.user()?.initials }}</span>
        <div>
          <button type="button" class="btn btn-secondary" (click)="toast.show('Demo app: photo upload is not stored.', 'info')">
            <app-icon name="upload" /> Upload Photo
          </button>
          <p class="caption">JPG or PNG · Maximum 2 MB</p>
        </div>
      </div>

      <div class="field">
        <label for="p-name">Full Name</label>
        <input id="p-name" class="input" formControlName="name" autocomplete="name" [attr.aria-invalid]="invalid('name')" aria-describedby="p-name-err" />
        <span id="p-name-err" class="field-error">@if (invalid('name')) {Name is required.}</span>
      </div>
      <div class="field">
        <label for="p-email">Email</label>
        <input id="p-email" class="input" type="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="invalid('email')" aria-describedby="p-email-err" />
        <span id="p-email-err" class="field-error">@if (invalid('email')) {Enter a valid email address.}</span>
      </div>
      <div class="field">
        <label for="p-title">Job Title</label>
        <input id="p-title" class="input" formControlName="title" autocomplete="organization-title" />
      </div>

      <p class="caption">Changes apply to your Northbridge Advisory workspace profile.</p>
      <div>
        <button type="submit" class="btn btn-primary" [disabled]="saving() || form.pristine">
          {{ saving() ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './settings-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettings {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly auth = inject(AuthService);
  protected readonly toast = inject(ToastService);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: [this.auth.user()?.name ?? '', Validators.required],
    email: [this.auth.user()?.email ?? '', [Validators.required, Validators.email]],
    title: [this.auth.user()?.title ?? ''],
  });

  protected invalid(name: 'name' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.auth.user()?.id;
    const value = this.form.getRawValue();
    const initials = value.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

    this.saving.set(true);
    this.http.patch<User>(`/api/users/${id}`, { ...value, initials }).subscribe({
      next: (user) => {
        this.auth.updateUser(user);
        this.form.markAsPristine();
        this.saving.set(false);
        this.toast.show('Profile saved');
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Could not save your profile.', 'error');
      },
    });
  }
}
