import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/auth/auth-interceptor';
import { mockApiInterceptor } from './core/mock/mock-api-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding lets route params like :id arrive as component inputs.
    provideRouter(routes, withComponentInputBinding()),
    // In production there's no server, so the last interceptor answers /api calls in the browser.
    provideHttpClient(
      withInterceptors(environment.useInBrowserApi ? [authInterceptor, mockApiInterceptor] : [authInterceptor]),
    ),
  ],
};
