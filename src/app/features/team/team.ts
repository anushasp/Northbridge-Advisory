import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EngagementService } from '../../core/data/engagement-service';
import { TeamMember, TeamRole } from '../../core/data/models';
import { TeamService } from '../../core/data/team-service';
import { utilizationState } from '../../core/util/thresholds';
import { Modal } from '../../shared/modal/modal';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';
import { StatusBadge } from '../../shared/status-badge/status-badge';

/**
 * Team list is small, so search and role filtering happen client-side with
 * computed signals (compare: Engagements filters server-side through the URL).
 */
@Component({
  selector: 'app-team',
  imports: [DatePipe, DecimalPipe, RouterLink, Modal, ProgressBar, StatusBadge],
  templateUrl: './team.html',
  styleUrl: './team.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team {
  protected readonly team = inject(TeamService);
  private readonly engagements = toSignal(inject(EngagementService).all(), { initialValue: [] });

  protected readonly roles: TeamRole[] = ['Partner', 'Manager', 'Senior', 'Staff'];
  protected readonly now = new Date();
  protected readonly search = signal('');
  protected readonly role = signal<TeamRole | ''>('');

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const role = this.role();
    return this.team
      .members()
      .filter((m) => !role || m.role === role)
      .filter((m) => !term || `${m.name} ${m.title} ${m.email}`.toLowerCase().includes(term));
  });

  /** Active (not completed) engagements per member. */
  private readonly assignments = computed(() => {
    const map = new Map<string, ReturnType<typeof this.engagements>>();
    for (const e of this.engagements()) {
      if (e.status === 'Completed') continue;
      for (const id of e.teamIds) map.set(id, [...(map.get(id) ?? []), e]);
    }
    return map;
  });

  protected readonly selectedId = signal<string | null>(null);
  protected readonly panelOpen = signal(false);
  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.team.member(id) : undefined;
  });
  protected readonly selectedAssignments = computed(() => this.assignmentsFor(this.selectedId() ?? ''));

  protected util(m: TeamMember) {
    return utilizationState(m.utilization);
  }

  protected assignmentsFor(id: string) {
    return this.assignments().get(id) ?? [];
  }

  protected open(m: TeamMember): void {
    this.selectedId.set(m.id);
    this.panelOpen.set(true);
  }
}
