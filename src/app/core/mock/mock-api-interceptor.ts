import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import { MockBackend } from './mock-backend';

let backend: MockBackend | undefined;

/**
 * Answers /api/* requests in the browser instead of sending them to a server.
 * Only registered in production builds (see environment.ts), so the deployed
 * demo works with no backend. Requests outside /api pass through untouched.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  backend ??= new MockBackend();
  const params: Record<string, string> = {};
  for (const key of req.params.keys()) params[key] = req.params.get(key) ?? '';

  const res = backend.handle({
    method: req.method,
    path: req.url.slice('/api/'.length).split('?')[0],
    params,
    body: req.body,
    token: req.headers.get('Authorization')?.replace('Bearer ', '') ?? null,
  });

  const response$: Observable<HttpResponse<unknown>> =
    res.status < 400
      ? of(new HttpResponse({ status: res.status, body: res.body, headers: new HttpHeaders(res.headers ?? {}), url: req.url }))
      : throwError(() => new HttpErrorResponse({ status: res.status, error: res.body, url: req.url }));

  // A short delay keeps loading states visible, like the real mock server.
  // materialize/dematerialize lets the delay apply to errors too.
  return response$.pipe(materialize(), delay(300), dematerialize());
};
