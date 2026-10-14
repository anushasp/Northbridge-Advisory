import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · EngageTrack',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · EngageTrack',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'engagements',
        title: 'Engagements · EngageTrack',
        loadComponent: () =>
          import('./features/engagements/engagements-list').then((m) => m.EngagementsList),
      },
      {
        path: 'engagements/:id',
        title: 'Engagement · EngageTrack',
        loadComponent: () =>
          import('./features/engagements/engagement-detail').then((m) => m.EngagementDetail),
      },
      {
        path: 'team',
        title: 'Team · EngageTrack',
        loadComponent: () => import('./features/team/team').then((m) => m.Team),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          {
            path: 'profile',
            title: 'Profile · Settings · EngageTrack',
            loadComponent: () => import('./features/settings/profile').then((m) => m.ProfileSettings),
          },
          {
            path: 'preferences',
            title: 'Preferences · Settings · EngageTrack',
            loadComponent: () => import('./features/settings/preferences').then((m) => m.PreferencesSettings),
          },
          {
            path: 'security',
            title: 'Security · Settings · EngageTrack',
            loadComponent: () => import('./features/settings/security').then((m) => m.SecuritySettings),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
