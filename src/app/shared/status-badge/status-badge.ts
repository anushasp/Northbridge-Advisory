import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONES: Record<string, string> = {
  Planning: 'neutral',
  'In Progress': 'info',
  Review: 'warning',
  Completed: 'success',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
};

/** Pill for engagement/task statuses and task priorities. */
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-tone]="tone()">{{ status() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font: var(--font-label);
      white-space: nowrap;
    }
    [data-tone='neutral'] { background: var(--color-muted-surface); color: var(--color-text-secondary); }
    [data-tone='info'] { background: var(--color-blue-soft); color: var(--color-primary); }
    [data-tone='warning'] { background: var(--color-warning-soft); color: var(--color-text-warning); }
    [data-tone='success'] { background: var(--color-success-soft); color: var(--color-text-success); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly tone = computed(() => TONES[this.status()] ?? 'neutral');
}
