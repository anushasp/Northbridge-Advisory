import { DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, switchMap } from 'rxjs';
import { EngagementService } from '../../../core/data/engagement-service';
import { Engagement, Task, TaskPriority } from '../../../core/data/models';
import { TeamService } from '../../../core/data/team-service';
import { daysBetween, parseDate, startOfToday } from '../../../core/util/dates';
import { Icon } from '../../../shared/icon/icon';
import { Modal } from '../../../shared/modal/modal';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { ToastService } from '../../../shared/toast/toast-service';

@Component({
  selector: 'app-tasks-tab',
  imports: [DatePipe, LowerCasePipe, ReactiveFormsModule, Icon, Modal, StatusBadge],
  templateUrl: './tasks-tab.html',
  styleUrl: './tasks-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksTab {
  private readonly engagements = inject(EngagementService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly team = inject(TeamService);

  readonly engagement = input.required<Engagement>();

  private readonly reload = signal(0);
  private readonly loaded = toSignal(
    combineLatest([toObservable(this.engagement), toObservable(this.reload)]).pipe(
      switchMap(([e]) => this.engagements.tasksFor(e.id)),
    ),
  );

  /**
   * Writable copy of the server data. linkedSignal resets it whenever `loaded`
   * changes, but lets us edit it locally in between (for optimistic updates).
   */
  protected readonly tasks = linkedSignal(() => this.loaded() ?? []);

  protected readonly assigneeFilter = signal('');
  protected readonly bannerDismissed = signal(false);
  protected readonly addOpen = signal(false);
  protected readonly priorities: TaskPriority[] = ['High', 'Medium', 'Low'];

  private readonly today = startOfToday();

  protected readonly visible = computed(() => {
    const id = this.assigneeFilter();
    return id ? this.tasks().filter((t) => t.assigneeId === id) : this.tasks();
  });

  protected readonly completedCount = computed(() => this.tasks().filter((t) => t.status === 'Completed').length);
  protected readonly overdue = computed(() => this.tasks().filter((t) => this.daysOverdue(t) > 0));
  protected readonly assignees = computed(() => this.engagement().teamIds.map((id) => this.team.member(id)).filter((m) => m !== undefined));

  protected readonly addForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    assigneeId: ['', Validators.required],
    dueDate: ['', Validators.required],
    priority: ['Medium' as TaskPriority],
  });

  protected daysOverdue(t: Task): number {
    if (t.status === 'Completed') return 0;
    return daysBetween(parseDate(t.dueDate), this.today);
  }

  protected toggleDone(task: Task): void {
    const status = task.status === 'Completed' ? 'In Progress' : 'Completed';
    const previous = this.tasks();
    // Show the change right away, then sync with the server; roll back if it fails.
    this.tasks.update((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    this.engagements.updateTask(task.id, { status }).subscribe({
      error: () => {
        this.tasks.set(previous);
        this.toast.show('Could not update the task. Please try again.', 'error');
      },
    });
  }

  protected openAdd(): void {
    this.addForm.reset({ priority: 'Medium' });
    this.addOpen.set(true);
  }

  protected addTask(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const value = this.addForm.getRawValue();
    this.engagements
      .addTask({ ...value, engagementId: this.engagement().id, status: 'Planning' })
      .subscribe((task) => {
        this.addOpen.set(false);
        this.reload.update((v) => v + 1);
        this.toast.show(`Added "${task.title}"`);
      });
  }

  protected showError(name: 'title' | 'assigneeId' | 'dueDate'): boolean {
    const c = this.addForm.controls[name];
    return c.touched && c.invalid;
  }
}
