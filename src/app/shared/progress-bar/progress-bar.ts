import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../../core/util/thresholds';

/**
 * Labeled bar used for budget and utilization. The fill animates with
 * transform: scaleX() instead of width, so the browser only composites
 * (no layout or paint), which keeps animations smooth.
 */
@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="label" [attr.data-tone]="tone()">
      {{ percent() }}%@if (label()) {<span> · {{ label() }}</span>}
    </div>
    <div
      class="track"
      role="progressbar"
      [attr.aria-valuenow]="percent()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-valuetext]="percent() + '%' + (label() ? ', ' + label() : '')"
    >
      <div class="fill" [attr.data-tone]="tone()" [style.transform]="'scaleX(' + fill() + ')'"></div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 6px; min-width: 120px; }
    .label { font: var(--font-label); }
    .track { height: 4px; border-radius: 2px; background: var(--color-border); overflow: hidden; }
    .fill { height: 100%; transform-origin: left; transition: transform 400ms ease-out; }
    [data-tone='info'] { color: var(--color-primary); }
    [data-tone='success'] { color: var(--color-success); }
    [data-tone='warning'] { color: var(--color-text-warning); }
    [data-tone='error'] { color: var(--color-error); }
    .fill[data-tone='info'] { background: var(--color-primary); }
    .fill[data-tone='success'] { background: var(--color-success); }
    .fill[data-tone='warning'] { background: var(--color-warning); }
    .fill[data-tone='error'] { background: var(--color-error); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  readonly percent = input.required<number>();
  readonly label = input('');
  readonly tone = input<Tone>('info');
  readonly ariaLabel = input('');

  /** Bar is capped at full width even when over 100%. */
  protected readonly fill = computed(() => Math.min(Math.max(this.percent(), 0), 100) / 100);
}
