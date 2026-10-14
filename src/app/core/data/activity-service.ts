import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity } from './models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);

  recent(limit = 4): Observable<Activity[]> {
    return this.http.get<Activity[]>('/api/activity', {
      params: { _sort: 'timestamp', _order: 'desc', _limit: limit },
    });
  }
}
