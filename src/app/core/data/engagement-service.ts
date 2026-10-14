import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';
import {
  Engagement,
  EngagementDocument,
  EngagementDraft,
  EngagementQuery,
  Page,
  Task,
} from './models';

@Injectable({ providedIn: 'root' })
export class EngagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/engagements';

  /**
   * Bumped after every create/update/archive. Screens that show engagement
   * data read this signal and re-fetch when it changes, so the list, the
   * detail page, the dashboard and the sidebar count all stay in sync.
   */
  readonly version = signal(0);

  /**
   * Paged, filtered, sorted list. json-server returns the total count
   * in the X-Total-Count header when _page is set.
   */
  list(query: EngagementQuery = {}): Observable<Page<Engagement>> {
    let params = new HttpParams()
      .set('archived', false)
      .set('_page', query.page ?? 1)
      .set('_limit', query.pageSize ?? 6);

    if (query.search) params = params.set('q', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.serviceLine) params = params.set('serviceLine', query.serviceLine);
    if (query.managerId) params = params.set('managerId', query.managerId);
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      params = params.set('_sort', field).set('_order', order);
    }

    return this.http
      .get<Engagement[]>(this.baseUrl, { params, observe: 'response' })
      .pipe(
        map((res: HttpResponse<Engagement[]>) => ({
          items: res.body ?? [],
          total: Number(res.headers.get('X-Total-Count') ?? 0),
        })),
      );
  }

  /** Every active engagement, used for dashboard totals and team assignments. */
  all(): Observable<Engagement[]> {
    return this.http.get<Engagement[]>(this.baseUrl, { params: { archived: false } });
  }

  /** Distinct client names, for the client picker in the engagement form. */
  clients(): Observable<string[]> {
    return this.all().pipe(map((list) => [...new Set(list.map((e) => e.client))].sort()));
  }

  getById(id: string): Observable<Engagement> {
    return this.http.get<Engagement>(`${this.baseUrl}/${id}`);
  }

  create(draft: EngagementDraft, partnerId: string): Observable<Engagement> {
    const body: Omit<Engagement, 'id'> = {
      ...draft,
      code: '',
      partnerId,
      actualHours: 0,
      status: 'Planning',
      teamIds: [...new Set([draft.managerId, partnerId])],
      archived: false,
    };
    // The API assigns the id and the readable code (e.g. AUD-2026-038).
    return this.http.post<Engagement>(this.baseUrl, body).pipe(tap(() => this.bump()));
  }

  update(id: string, changes: Partial<Engagement>): Observable<Engagement> {
    return this.http
      .patch<Engagement>(`${this.baseUrl}/${id}`, changes)
      .pipe(tap(() => this.bump()));
  }

  /** Archived engagements are hidden from every list but kept in the data. */
  archive(id: string): Observable<Engagement> {
    return this.update(id, { archived: true });
  }

  updateMany(ids: string[], changes: Partial<Engagement>): Observable<Engagement[]> {
    return forkJoin(ids.map((id) => this.http.patch<Engagement>(`${this.baseUrl}/${id}`, changes))).pipe(
      tap(() => this.bump()),
    );
  }

  tasksFor(engagementId: string): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks', {
      params: { engagementId, _sort: 'dueDate', _order: 'asc' },
    });
  }

  addTask(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http.post<Task>('/api/tasks', task);
  }

  updateTask(id: string, changes: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`/api/tasks/${id}`, changes);
  }

  documentsFor(engagementId: string): Observable<EngagementDocument[]> {
    return this.http.get<EngagementDocument[]>('/api/documents', {
      params: { engagementId, _sort: 'uploadedAt', _order: 'desc' },
    });
  }

  addDocument(doc: Omit<EngagementDocument, 'id'>): Observable<EngagementDocument> {
    return this.http.post<EngagementDocument>('/api/documents', doc);
  }

  private bump(): void {
    this.version.update((v) => v + 1);
  }
}
