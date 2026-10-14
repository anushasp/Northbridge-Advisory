import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';

/**
 * Adds the Bearer token to API calls and signs the user out on a 401
 * (except for the login call itself, where 401 just means bad credentials).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isLogin = req.url.endsWith('/login');

  const authedReq =
    token && !isLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLogin) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
