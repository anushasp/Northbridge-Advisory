import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../../core/util/thresholds';

@Component({
  selector: 'app-kpi-card',
  template: `
    <p class="label"><span class="dot" [attr.data-tone]="tone()"></span>{{ label() }}</p>
    <p class="value">{{ value() }}</p>
    <p class="hint" [class.warn]="tone() === 'warning'">{{ hint() }}</p>
  `,
  styles: `
    :host {
      display: block; padding: var(--space-5, 20px) var(--space-6);
      background: var(--color-card); border: 1px solid var(--color-border);
      border-radius: var(--radius-card); box-shadow: var(--shadow-card);
    }
    .label { display: flex; align-items: center; gap: var(--space-2); font: var(--font-label); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); }
    .dot[data-tone='warning'] { background: var(--color-warning); }
    .value { margin-top: var(--space-4); font: 600 28px/1.1 var(--font-family); }
    .hint { margin-top: var(--space-1); font: var(--font-label); color: var(--color-text-secondary); }
    .hint.warn { color: var(--color-text-warning); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly tone = input<Tone>('info');
}
