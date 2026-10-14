import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EngagementService } from './engagement-service';
import { Engagement, Page } from './models';

describe('EngagementService', () => {
  let service: EngagementService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EngagementService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('maps list options to json-server query params', () => {
    service
      .list({ search: 'acme', status: 'Review', serviceLine: 'Audit', managerId: 'u1', sort: 'dueDate:desc', page: 2, pageSize: 6 })
      .subscribe();

    const req = backend.expectOne((r) => r.url === '/api/engagements');
    const p = req.request.params;
    expect(p.get('archived')).toBe('false');
    expect(p.get('q')).toBe('acme');
    expect(p.get('status')).toBe('Review');
    expect(p.get('serviceLine')).toBe('Audit');
    expect(p.get('managerId')).toBe('u1');
    expect(p.get('_sort')).toBe('dueDate');
    expect(p.get('_order')).toBe('desc');
    expect(p.get('_page')).toBe('2');
    expect(p.get('_limit')).toBe('6');
    req.flush([]);
  });

  it('leaves out empty filters', () => {
    service.list({ search: '', status: '' }).subscribe();
    const req = backend.expectOne((r) => r.url === '/api/engagements');
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('reads the total from the X-Total-Count header', () => {
    let result: Page<Engagement> | undefined;
    service.list().subscribe((page) => (result = page));

    backend
      .expectOne((r) => r.url === '/api/engagements')
      .flush([{ id: '1' }], { headers: { 'X-Total-Count': '24' } });

    expect(result?.total).toBe(24);
    expect(result?.items.length).toBe(1);
  });

  it('bumps the version after an update so screens re-fetch', () => {
    const before = service.version();
    service.update('1', { status: 'Completed' }).subscribe();
    backend.expectOne('/api/engagements/1').flush({ id: '1' });
    expect(service.version()).toBe(before + 1);
  });

  it('archives instead of deleting', () => {
    service.archive('3').subscribe();
    const req = backend.expectOne('/api/engagements/3');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ archived: true });
    req.flush({ id: '3' });
  });
});
