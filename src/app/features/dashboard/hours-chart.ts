import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface HoursBar {
  label: string;
  budgeted: number;
  actual: number;
}

/**
 * Grouped bar chart in plain SVG (no chart library). Bars grow in with a
 * transform animation. A visually hidden table gives screen readers the numbers.
 */
@Component({
  selector: 'app-hours-chart',
  imports: [DecimalPipe],
  template: `
    <div class="legend" aria-hidden="true">
      <span><i class="swatch budget"></i>Budgeted</span>
      <span><i class="swatch actual"></i>Actual</span>
    </div>

    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="summary()">
      @for (tick of ticks(); track tick) {
        <g>
          <line [attr.x1]="PAD_L" [attr.x2]="W" [attr.y1]="y(tick)" [attr.y2]="y(tick)" class="grid" />
          <text [attr.x]="PAD_L - 12" [attr.y]="y(tick) + 4" text-anchor="end" class="axis">{{ tick | number }}</text>
        </g>
      }
      @for (bar of bars(); track bar.label; let i = $index) {
        <g [attr.transform]="'translate(' + groupX(i) + ',0)'">
          <rect class="bar budget" [attr.x]="0" [attr.y]="y(bar.budgeted)" [attr.width]="BAR_W" [attr.height]="h(bar.budgeted)" />
          <text class="value" [attr.x]="BAR_W / 2" [attr.y]="y(bar.budgeted) - 6" text-anchor="middle">{{ bar.budgeted | number: '1.0-0' }}</text>
          <rect class="bar actual" [attr.x]="BAR_W + 4" [attr.y]="y(bar.actual)" [attr.width]="BAR_W" [attr.height]="h(bar.actual)" />
          <text class="value actual-text" [attr.x]="BAR_W * 1.5 + 4" [attr.y]="y(bar.actual) - 6" text-anchor="middle">{{ bar.actual | number: '1.0-0' }}</text>
          <text class="axis label" [attr.x]="BAR_W + 2" [attr.y]="H - 4" text-anchor="middle">{{ bar.label }}</text>
        </g>
      }
    </svg>

    <table class="visually-hidden">
      <caption>Hours by service line</caption>
      <tr><th>Service line</th><th>Budgeted</th><th>Actual</th></tr>
      @for (bar of bars(); track bar.label) {
        <tr><td>{{ bar.label }}</td><td>{{ bar.budgeted | number: '1.0-0' }}</td><td>{{ bar.actual | number: '1.0-0' }}</td></tr>
      }
    </table>
  `,
  styles: `
    :host { display: block; position: relative; }
    .legend { position: absolute; top: -32px; right: 0; display: flex; gap: var(--space-4); font: var(--font-caption); }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .swatch { width: 10px; height: 10px; border-radius: 2px; }
    svg { width: 100%; height: auto; display: block; overflow: visible; }
    .grid { stroke: var(--color-border); }
    .axis { font: var(--font-caption); fill: var(--color-text-secondary); }
    .label { fill: var(--color-text-primary); font-size: 13px; }
    .value { font: var(--font-caption); fill: var(--color-text-secondary); }
    .actual-text { fill: var(--color-primary); }
    .budget, .swatch.budget { fill: #cbd5e1; background: #cbd5e1; }
    .actual, .swatch.actual { fill: var(--color-primary); background: var(--color-primary); }
    .bar { transform-box: fill-box; transform-origin: bottom; animation: grow 600ms ease-out both; }
    @keyframes grow { from { transform: scaleY(0); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoursChart {
  readonly bars = input.required<HoursBar[]>();

  protected readonly W = 720;
  protected readonly H = 260;
  protected readonly PAD_L = 44;
  protected readonly PAD_B = 32;
  protected readonly BAR_W = 26;

  /** Round the top of the axis up to a tidy number. */
  protected readonly max = computed(() => {
    const top = Math.max(1, ...this.bars().flatMap((b) => [b.budgeted, b.actual]));
    const step = top > 2000 ? 1000 : top > 1000 ? 500 : 200;
    return Math.ceil(top / step) * step;
  });

  protected readonly ticks = computed(() => {
    const max = this.max();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  });

  protected readonly summary = computed(
    () =>
      'Budgeted vs actual hours: ' +
      this.bars().map((b) => `${b.label} ${Math.round(b.actual)} of ${Math.round(b.budgeted)}`).join(', '),
  );

  protected y(value: number): number {
    const plot = this.H - this.PAD_B - 16;
    return 16 + plot - (value / this.max()) * plot;
  }

  protected h(value: number): number {
    return this.H - this.PAD_B - this.y(value);
  }

  protected groupX(i: number): number {
    const slot = (this.W - this.PAD_L) / this.bars().length;
    return this.PAD_L + slot * i + slot / 2 - this.BAR_W;
  }
}
