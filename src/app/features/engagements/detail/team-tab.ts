import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Engagement } from '../../../core/data/models';
import { TeamService } from '../../../core/data/team-service';
import { utilizationState } from '../../../core/util/thresholds';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-team-tab',
  imports: [ProgressBar],
  template: `
    <div class="head">
      <h2 class="section-title">Engagement team</h2>
      <p class="caption">{{ members().length }} people assigned · Partner and manager included</p>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Engagement Role</th>
            <th scope="col">Title</th>
            <th scope="col">Monthly Utilization</th>
          </tr>
        </thead>
        <tbody>
          @for (row of members(); track row.member.id) {
            <tr>
              <td>
                <div class="person">
                  <span class="avatar">{{ row.member.initials }}</span>
                  <div>
                    <strong>{{ row.member.name }}</strong>
                    <a class="caption" [href]="'mailto:' + row.member.email">{{ row.member.email }}</a>
                  </div>
                </div>
              </td>
              <td>{{ row.role }}</td>
              <td>{{ row.member.title }}</td>
              <td>
                <app-progress-bar [percent]="row.member.utilization" [label]="row.util.label" [tone]="row.util.tone"
                  [ariaLabel]="row.member.name + ' utilization'" />
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .head { margin-bottom: var(--space-6); }
    .person { display: flex; align-items: center; gap: var(--space-3); }
    .person strong { display: block; font-weight: 500; }
    .person a { text-decoration: none; color: var(--color-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamTab {
  private readonly team = inject(TeamService);
  readonly engagement = input.required<Engagement>();

  protected readonly members = computed(() => {
    const e = this.engagement();
    return e.teamIds
      .map((id) => this.team.member(id))
      .filter((m) => m !== undefined)
      .map((member) => ({
        member,
        role: member.id === e.partnerId ? 'Partner' : member.id === e.managerId ? 'Engagement Manager' : 'Team Member',
        util: utilizationState(member.utilization),
      }));
  });
}
