import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Engagement } from '../../../core/data/models';
import { TeamService } from '../../../core/data/team-service';
import { buildMilestones } from '../../../core/util/milestones';
import { budgetState, percentOf } from '../../../core/util/thresholds';
import { Icon } from '../../../shared/icon/icon';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-overview-tab',
  imports: [DatePipe, DecimalPipe, Icon, ProgressBar],
  template: `
    @let e = engagement();
    <div class="grid">
      <section class="card panel" aria-labelledby="ov-title">
        <h2 id="ov-title" class="section-title">Engagement Overview</h2>
        <dl class="details">
          <div><dt>Client</dt><dd>{{ e.client }}</dd></div>
          <div><dt>Service Line</dt><dd>{{ e.serviceLine }}</dd></div>
          <div><dt>Partner</dt><dd>{{ team.name(e.partnerId) }}</dd></div>
          <div><dt>Engagement Manager</dt><dd>{{ team.name(e.managerId) }}</dd></div>
          <div><dt>Start Date</dt><dd>{{ e.startDate | date: 'MMM dd, y' }}</dd></div>
          <div><dt>Due Date</dt><dd>{{ e.dueDate | date: 'MMM dd, y' }}</dd></div>
          <div><dt>Budget Hours</dt><dd>{{ e.budgetHours | number }} hours</dd></div>
          <div><dt>Actual Hours</dt><dd>{{ e.actualHours | number: '1.0-1' }} hours</dd></div>
          @if (e.description) {
            <div class="full"><dt>Description</dt><dd>{{ e.description }}</dd></div>
          }
        </dl>
      </section>

      <section class="card panel" aria-labelledby="budget-title">
        <h2 id="budget-title" class="section-title">Budget utilization</h2>
        <p class="big">{{ e.actualHours | number: '1.0-1' }}</p>
        <p class="muted">of {{ e.budgetHours | number }} budgeted hours</p>
        <app-progress-bar class="bar" [percent]="budget().pct" [label]="budget().label" [tone]="budget().tone" ariaLabel="Budget used" />
        <p class="caption">{{ budgetNote() }}</p>
      </section>
    </div>

    <section class="card panel milestones-card" aria-labelledby="ms-title">
      <h2 id="ms-title" class="section-title">Milestone timeline</h2>
      <ol class="milestones">
        @for (m of milestones(); track m.name) {
          <li [attr.data-state]="m.state">
            <app-icon [name]="m.state === 'Completed' ? 'checkCircle' : m.state === 'In Progress' ? 'dotCircle' : 'circle'" [size]="18" />
            <div>
              <strong>{{ m.name }}</strong>
              <p class="caption">{{ m.start | date: 'MMM dd' }}–{{ m.end | date: 'MMM dd, y' }}</p>
              <p class="state">{{ m.state }}</p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: var(--space-6); align-items: start; }
    .panel { padding: var(--space-6); }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4) var(--space-6); margin: var(--space-6) 0 0; }
    .details .full { grid-column: 1 / -1; }
    dt { font: var(--font-label); color: var(--color-text-secondary); }
    dd { margin: 2px 0 0; font-weight: 500; }
    .big { margin-top: var(--space-6); font: 600 28px/1.1 var(--font-family); }
    .bar { margin: var(--space-6) 0 var(--space-4); }
    .milestones-card { margin-top: var(--space-6); }
    .milestones { list-style: none; margin: var(--space-6) 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-4); }
    .milestones li { display: flex; gap: var(--space-3); color: var(--color-text-secondary); }
    .milestones strong { color: var(--color-text-primary); font-weight: 500; }
    .state { font: var(--font-label); }
    [data-state='Completed'] app-icon, [data-state='Completed'] .state { color: var(--color-success); }
    [data-state='In Progress'] app-icon, [data-state='In Progress'] .state { color: var(--color-primary); }
    @media (max-width: 1100px) {
      .grid { grid-template-columns: 1fr; }
      .milestones { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) { .details { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTab {
  protected readonly team = inject(TeamService);
  readonly engagement = input.required<Engagement>();

  protected readonly budget = computed(() => {
    const e = this.engagement();
    const pct = percentOf(e.actualHours, e.budgetHours);
    return { pct, ...budgetState(pct) };
  });

  protected readonly budgetNote = computed(() => {
    const e = this.engagement();
    const remaining = Math.round((e.budgetHours - e.actualHours) * 10) / 10;
    if (remaining < 0) return `${Math.abs(remaining)} hours over budget. Flag for partner review.`;
    if (this.budget().pct >= 75) return `${remaining} hours remaining. Review allocations before final fieldwork.`;
    return `${remaining} hours remaining.`;
  });

  protected readonly milestones = computed(() => buildMilestones(this.engagement()));
}
