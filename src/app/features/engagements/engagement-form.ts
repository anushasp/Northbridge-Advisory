import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EngagementService } from '../../core/data/engagement-service';
import { Engagement, EngagementDraft, ServiceLine } from '../../core/data/models';
import { TeamService } from '../../core/data/team-service';
import { dateRangeValidator } from '../../core/util/validators';

const PARTNER_FOR: Record<ServiceLine, string> = { Audit: 'u8', Tax: 'u8', Consulting: 'u4' };

/** Create or edit an engagement. Pass [engagement] to edit; leave it empty to create. */
@Component({
  selector: 'app-engagement-form',
  imports: [ReactiveFormsModule],
  templateUrl: './engagement-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly engagements = inject(EngagementService);
  protected readonly team = inject(TeamService);

  readonly engagement = input<Engagement | null>(null);
  readonly saved = output<Engagement>();
  readonly cancelled = output<void>();

  protected readonly clients = toSignal(this.engagements.clients(), { initialValue: [] });
  protected readonly serviceLines: ServiceLine[] = ['Audit', 'Tax', 'Consulting'];
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      client: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(80)]],
      serviceLine: ['' as ServiceLine | '', Validators.required],
      managerId: ['', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      budgetHours: [null as number | null, [Validators.required, Validators.min(1), Validators.max(5000)]],
      description: ['', Validators.maxLength(500)],
    },
    { validators: dateRangeValidator('startDate', 'dueDate') },
  );

  ngOnInit(): void {
    const e = this.engagement();
    if (e) {
      this.form.patchValue(e);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const draft = this.form.getRawValue() as EngagementDraft;
    const existing = this.engagement();
    this.saving.set(true);
    this.serverError.set(null);

    const request = existing
      ? this.engagements.update(existing.id, draft)
      : this.engagements.create(draft, PARTNER_FOR[draft.serviceLine]);

    request.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.saved.emit(result);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverError.set(err.error?.message ?? 'Could not save the engagement. Please try again.');
      },
    });
  }

  protected showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }
}
