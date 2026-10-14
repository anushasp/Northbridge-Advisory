import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { matchValidator } from '../../core/util/validators';
import { ToastService } from '../../shared/toast/toast-service';

/** At least 8 characters with a letter and a number. */
const STRONG = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-security-settings',
  imports: [ReactiveFormsModule],
  template: `
    <form class="card panel" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 class="section-title">Change password</h2>
      <p class="muted">Use at least 8 characters with a mix of letters and numbers.</p>

      @if (serverError(); as message) {
        <div class="alert-banner error" role="alert"><p>{{ message }}</p></div>
      }

      <div class="field">
        <label for="s-current">Current password</label>
        <input id="s-current" class="input" type="password" formControlName="currentPassword" autocomplete="current-password"
          [attr.aria-invalid]="show('currentPassword')" aria-describedby="s-current-err" />
        <span id="s-current-err" class="field-error">@if (show('currentPassword')) {Enter your current password.}</span>
      </div>
      <div class="field">
        <label for="s-new">New password</label>
        <input id="s-new" class="input" type="password" formControlName="newPassword" autocomplete="new-password"
          [attr.aria-invalid]="show('newPassword')" aria-describedby="s-new-err" />
        <span id="s-new-err" class="field-error">@if (show('newPassword')) {Use 8+ characters with a letter and a number.}</span>
      </div>
      <div class="field">
        <label for="s-confirm">Confirm new password</label>
        <input id="s-confirm" class="input" type="password" formControlName="confirmPassword" autocomplete="new-password"
          [attr.aria-invalid]="mismatch()" aria-describedby="s-confirm-err" />
        <span id="s-confirm-err" class="field-error">@if (mismatch()) {Passwords don't match.}</span>
      </div>

      <div>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Updating…' : 'Update Password' }}</button>
      </div>
    </form>
  `,
  styleUrl: './settings-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuritySettings {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(STRONG)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('newPassword', 'confirmPassword') },
  );

  protected show(name: 'currentPassword' | 'newPassword'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  protected mismatch(): boolean {
    return this.form.controls.confirmPassword.touched && this.form.hasError('mismatch');
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set(null);
    this.http.post('/api/change-password', { currentPassword, newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.toast.show('Password updated');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverError.set(err.error?.message ?? 'Could not update your password.');
      },
    });
  }
}
