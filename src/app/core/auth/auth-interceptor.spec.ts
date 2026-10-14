import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const logout = vi.fn();

  beforeEach(() => {
    logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: signal('demo-token-u1'), logout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the Bearer token to API requests', () => {
    http.get('/api/engagements').subscribe();
    const req = backend.expectOne('/api/engagements');
    expect(req.request.headers.get('Authorization')).toBe('Bearer demo-token-u1');
    req.flush([]);
  });

  it('does not add the token to the login call', () => {
    http.post('/api/login', {}).subscribe();
    const req = backend.expectOne('/api/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('signs the user out on a 401', () => {
    http.get('/api/engagements').subscribe({ error: () => {} });
    backend.expectOne('/api/engagements').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalledOnce();
  });
});
