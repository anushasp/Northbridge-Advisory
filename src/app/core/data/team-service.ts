import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, shareReplay } from 'rxjs';
import { TeamMember } from './models';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);

  /** Fetched once and shared by every subscriber (team rarely changes). */
  readonly members$: Observable<TeamMember[]> = this.http
    .get<TeamMember[]>('/api/team')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly members = toSignal(this.members$, { initialValue: [] as TeamMember[] });

  private readonly byId = computed(() => new Map(this.members().map((m) => [m.id, m])));

  readonly managers = computed(() => this.members().filter((m) => m.role === 'Manager'));

  member(id: string): TeamMember | undefined {
    return this.byId().get(id);
  }

  name(id: string): string {
    return this.byId().get(id)?.name ?? '—';
  }
}
