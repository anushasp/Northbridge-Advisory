import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { ActivityService } from '../../core/data/activity-service';
import { EngagementService } from '../../core/data/engagement-service';
import { Engagement, ServiceLine } from '../../core/data/models';
import { TeamService } from '../../core/data/team-service';
import { addDays, parseDate, startOfToday } from '../../core/util/dates';
import { TimeAgoPipe } from '../../core/util/time-ago-pipe';
import { KpiCard } from '../../shared/kpi-card/kpi-card';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { HoursBar, HoursChart } from './hours-chart';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink, KpiCard, StatusBadge, HoursChart, TimeAgoPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly engagementService = inject(EngagementService);
  protected readonly team = inject(TeamService);

  protected readonly today = startOfToday();
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  /** Re-fetches whenever an engagement is created or changed elsewhere in the app. */
  private readonly engagements = toSignal(
    toObservable(this.engagementService.version).pipe(switchMap(() => this.engagementService.all())),
  );
  protected readonly activity = toSignal(inject(ActivityService).recent(4));
  protected readonly loading = computed(() => this.engagements() === undefined);

  private readonly active = computed(() =>
    (this.engagements() ?? []).filter((e) => e.status !== 'Completed'),
  );

  protected readonly dueThisWeek = computed(() => {
    const weekOut = addDays(this.today, 7);
    return this.active()
      .filter((e) => {
        const due = parseDate(e.dueDate);
        return due >= this.today && due <= weekOut;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  });

  protected readonly overBudget = computed(() =>
    this.active().filter((e) => e.actualHours > e.budgetHours),
  );

  protected readonly startedThisMonth = computed(
    () =>
      this.active().filter((e) => {
        const start = parseDate(e.startDate);
        return start.getMonth() === this.today.getMonth() && start.getFullYear() === this.today.getFullYear();
      }).length,
  );

  protected readonly hoursLogged = computed(() =>
    this.active().reduce((sum, e) => sum + e.actualHours, 0),
  );

  protected readonly chartBars = computed<HoursBar[]>(() =>
    (['Audit', 'Tax', 'Consulting'] as ServiceLine[]).map((line) => {
      const rows = this.active().filter((e) => e.serviceLine === line);
      return {
        label: line,
        budgeted: rows.reduce((s, e) => s + e.budgetHours, 0),
        actual: rows.reduce((s, e) => s + e.actualHours, 0),
      };
    }),
  );

  protected readonly totalBudget = computed(() =>
    this.chartBars().reduce((s, b) => s + b.budgeted, 0),
  );

  protected readonly upcoming = computed(() => this.dueThisWeek().slice(0, 3));

  protected readonly engagementById = computed(
    () => new Map((this.engagements() ?? []).map((e): [string, Engagement] => [e.id, e])),
  );
}
