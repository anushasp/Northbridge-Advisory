import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal, viewChildren } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { EngagementService } from '../../core/data/engagement-service';
import { Engagement } from '../../core/data/models';
import { Icon } from '../../shared/icon/icon';
import { Modal } from '../../shared/modal/modal';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { ToastService } from '../../shared/toast/toast-service';
import { DocumentsTab } from './detail/documents-tab';
import { OverviewTab } from './detail/overview-tab';
import { TasksTab } from './detail/tasks-tab';
import { TeamTab } from './detail/team-tab';
import { EngagementForm } from './engagement-form';

type TabId = 'overview' | 'tasks' | 'team' | 'documents';

@Component({
  selector: 'app-engagement-detail',
  imports: [RouterLink, Icon, Modal, StatusBadge, EngagementForm, OverviewTab, TasksTab, TeamTab, DocumentsTab],
  templateUrl: './engagement-detail.html',
  styleUrl: './engagement-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementDetail {
  private readonly engagements = inject(EngagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Bound from the :id route param via withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'team', label: 'Team' },
    { id: 'documents', label: 'Documents' },
  ];

  /** The active tab lives in the URL (?tab=tasks) so it can be linked and survives refresh. */
  protected readonly activeTab = toSignal(
    this.route.queryParamMap.pipe(map((p) => (p.get('tab') as TabId) ?? 'overview')),
    { initialValue: 'overview' as TabId },
  );

  /** undefined = loading, null = not found. Re-fetches after edits (version bump). */
  protected readonly engagement = toSignal<Engagement | null | undefined>(
    combineLatest([toObservable(this.id), toObservable(this.engagements.version)]).pipe(
      switchMap(([id]) => this.engagements.getById(id).pipe(catchError(() => of(null)))),
    ),
  );

  protected readonly title = computed(() => this.engagement()?.name ?? 'Engagement');
  protected readonly editOpen = signal(false);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  constructor() {
    const pageTitle = inject(Title);
    effect(() => {
      const e = this.engagement();
      if (e) pageTitle.setTitle(`${e.name} · EngageTrack`);
    });
  }

  protected selectTab(tab: TabId): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'overview' ? null : tab },
      replaceUrl: true,
    });
  }

  /** WAI-ARIA tabs pattern: Left/Right/Home/End move between tabs. */
  protected onTabKeydown(event: KeyboardEvent, index: number): void {
    const last = this.tabs.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    this.selectTab(this.tabs[next].id);
    this.tabButtons()[next].nativeElement.focus();
  }

  protected onSaved(e: Engagement): void {
    this.editOpen.set(false);
    this.toast.show(`Saved changes to ${e.name}`);
  }
}
