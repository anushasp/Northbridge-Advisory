import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';
import { EngagementService } from '../../core/data/engagement-service';
import {
  Engagement,
  EngagementQuery,
  EngagementStatus,
  Page,
  ServiceLine,
  SortOption,
} from '../../core/data/models';
import { TeamService } from '../../core/data/team-service';
import { mediaQuery } from '../../core/util/media-query';
import { budgetState, percentOf } from '../../core/util/thresholds';
import { Icon } from '../../shared/icon/icon';
import { Modal } from '../../shared/modal/modal';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { ToastService } from '../../shared/toast/toast-service';
import { EngagementForm } from './engagement-form';

const PAGE_SIZE = 6;
const DEFAULT_SORT: SortOption = 'dueDate:asc';

/** Reads the list state from the URL so filters survive refresh, back/forward and sharing. */
function toQuery(params: ParamMap): EngagementQuery {
  return {
    search: params.get('q') ?? '',
    status: (params.get('status') ?? '') as EngagementStatus | '',
    serviceLine: (params.get('line') ?? '') as ServiceLine | '',
    managerId: params.get('manager') ?? '',
    sort: (params.get('sort') as SortOption) ?? DEFAULT_SORT,
    page: Number(params.get('page') ?? 1),
    pageSize: PAGE_SIZE,
  };
}

@Component({
  selector: 'app-engagements-list',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, RouterLink, Icon, Modal, ProgressBar, StatusBadge, EngagementForm],
  templateUrl: './engagements-list.html',
  styleUrl: './engagements-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'openMenuId.set(null)' },
})
export class EngagementsList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly engagements = inject(EngagementService);
  private readonly toast = inject(ToastService);
  protected readonly team = inject(TeamService);

  protected readonly isMobile = mediaQuery('(max-width: 767px)');
  protected readonly statuses: EngagementStatus[] = ['Planning', 'In Progress', 'Review', 'Completed'];
  protected readonly serviceLines: ServiceLine[] = ['Audit', 'Tax', 'Consulting'];
  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'dueDate:asc', label: 'Due Date (soonest)' },
    { value: 'dueDate:desc', label: 'Due Date (latest)' },
    { value: 'client:asc', label: 'Client (A–Z)' },
    { value: 'name:asc', label: 'Engagement (A–Z)' },
  ];

  protected readonly query = toSignal(this.route.queryParamMap.pipe(map(toQuery)), { requireSync: true });

  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  /**
   * The data pipeline: URL query or data version changes → fetch.
   * switchMap cancels an in-flight request if the user changes filters again.
   */
  protected readonly page = toSignal(
    combineLatest([toObservable(this.query), toObservable(this.engagements.version)]).pipe(
      switchMap(([query]) => {
        this.loading.set(true);
        this.error.set(false);
        return this.engagements.list(query).pipe(
          catchError(() => {
            this.error.set(true);
            return of<Page<Engagement>>({ items: [], total: 0 });
          }),
          finalize(() => this.loading.set(false)),
        );
      }),
    ),
    { initialValue: { items: [], total: 0 } as Page<Engagement> },
  );

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.page().total / PAGE_SIZE)));
  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  protected readonly rangeStart = computed(() => (this.page().total ? (this.query().page! - 1) * PAGE_SIZE + 1 : 0));
  protected readonly rangeEnd = computed(() => this.rangeStart() + this.page().items.length - (this.page().total ? 1 : 0));

  protected readonly hasFilters = computed(() => {
    const q = this.query();
    return !!(q.search || q.status || q.serviceLine || q.managerId);
  });

  protected readonly filterSummary = computed(() => {
    const q = this.query();
    return [
      q.status || 'All statuses',
      q.serviceLine || 'All service lines',
      q.managerId ? this.team.name(q.managerId) : 'All managers',
    ].join(' · ');
  });

  // Search: debounce typing, ignore repeats, then write to the URL (which triggers the fetch).
  protected readonly search = new FormControl(this.query().search ?? '', { nonNullable: true });

  // Row selection and bulk actions
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly allSelected = computed(
    () => this.page().items.length > 0 && this.page().items.every((e) => this.selected().has(e.id)),
  );
  protected readonly someSelected = computed(() => this.selected().size > 0 && !this.allSelected());

  // Menus and dialogs
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Engagement | null>(null);
  protected readonly archiving = signal<Engagement | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly showFilters = signal(false);

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.setParams({ q: q.trim() || null }));
  }

  protected budget(e: Engagement) {
    const pct = percentOf(e.actualHours, e.budgetHours);
    return { pct, ...budgetState(pct) };
  }

  /** Updates query params; any filter change sends you back to page 1. */
  protected setParams(params: Record<string, string | number | null>, resetPage = true): void {
    this.selected.set(new Set());
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: resetPage ? { ...params, page: null } : params,
      queryParamsHandling: 'merge',
    });
  }

  protected toggleDueDateSort(): void {
    this.setParams({ sort: this.query().sort === 'dueDate:asc' ? 'dueDate:desc' : 'dueDate:asc' });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.setParams({ page: page === 1 ? null : page }, false);
  }

  protected clearFilters(): void {
    this.search.setValue('', { emitEvent: false });
    this.setParams({ q: null, status: null, line: null, manager: null });
  }

  protected toggleRow(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.page().items.map((e) => e.id)));
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected markSelectedCompleted(): void {
    const ids = [...this.selected()];
    this.engagements.updateMany(ids, { status: 'Completed' }).subscribe(() => {
      this.toast.show(`${ids.length} engagement${ids.length === 1 ? '' : 's'} marked completed`);
      this.selected.set(new Set());
    });
  }

  protected toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.update((current) => (current === id ? null : id));
  }

  protected openNew(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(e: Engagement): void {
    this.editing.set(e);
    this.formOpen.set(true);
  }

  protected onSaved(e: Engagement): void {
    this.formOpen.set(false);
    this.toast.show(this.editing() ? `Saved changes to ${e.name}` : `Created ${e.name}`);
  }

  protected confirmArchive(e: Engagement): void {
    this.archiving.set(e);
    this.confirmOpen.set(true);
  }

  protected archive(): void {
    const e = this.archiving();
    if (!e) return;
    this.engagements.archive(e.id).subscribe(() => {
      this.confirmOpen.set(false);
      this.toast.show(`Archived ${e.name}`);
    });
  }
}
