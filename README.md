# EngageTrack

An engagement tracking app for a fictional professional services firm, **Northbridge Advisory** (audit, tax, consulting). Consultants and managers use it to track client engagements, deadlines, budgets, tasks, documents, and team capacity.

Built with Angular 22 (standalone components, signals, zoneless change detection), RxJS, reactive forms, and a json-server mock REST API. Designed in Figma first, then implemented from the design tokens.

## Run it

```bash
npm install
npm start
```

| Process | URL | What it is |
|---|---|---|
| `web` | http://localhost:4200 | Angular dev server (proxies `/api` to the mock API) |
| `api` | http://localhost:3000 | json-server mock API with login, token check, and server-assigned engagement codes |

**Demo login:** the seeded user is in `mock-api/db.json` under `users`.

```bash
npm test        # unit tests (Vitest)
npm run build   # production build
npm run seed    # reset mock data (stop npm start first, then start it again)
```

## Deployed demo (no backend)

Production builds (`npm run build`, e.g. on AWS Amplify) have no server, so `mockApiInterceptor` answers every `/api` call in the browser using a copy of the seed data (`src/app/core/mock/demo-data.json`). It supports the same filters, search, sorting, paging, login, and create/edit as json-server. Changes are kept in sessionStorage until the tab closes. Local development (`npm start`) still uses json-server through the proxy.

The switch is `useInBrowserApi` in `src/environments/`. After changing `mock-api/seed.js`, run `DEMO_ONLY=1 npm run seed` to refresh the bundled copy without resetting your local data.

## Pages

| Page | Highlights |
|---|---|
| **Login** | Reactive form, inline validation, API error alert, remember me, `returnUrl` redirect |
| **Dashboard** | KPI cards computed with `computed()` signals, plain SVG bar chart (with a screen reader table), recent activity with a `timeAgo` pipe, upcoming deadlines, loading skeletons |
| **Engagements** | Filters, sort, search and page all live in the URL; debounced search (`debounceTime` → `distinctUntilChanged` → `switchMap`); server-side paging via `X-Total-Count`; row selection with indeterminate "select all" and a bulk action; row menu (View, Edit, Archive with confirm); stacked cards on mobile |
| **New / Edit Engagement** | One form component for both; cross-field validator (due date ≥ start date); native `<dialog>` modal (focus trap and Escape for free) |
| **Engagement Detail** | Accessible tabs (WAI-ARIA pattern with arrow keys) synced to `?tab=`; Overview with budget bar and computed milestone timeline; Tasks with optimistic checkbox updates (`linkedSignal`), overdue banner, assignee filter, Add Task; Team; Documents with mock upload (type and size validation) |
| **Team** | Client-side search and role filter with `computed()`; utilization bars; side panel with assigned engagements |
| **Settings** | Child routes (`/settings/profile`, `/preferences`, `/security`); profile save updates the session; light/dark theme saved to localStorage; change password with a "passwords match" validator |

## Project structure

```
mock-api/
  server.js              json-server + POST /login, POST /change-password, Bearer check, engagement codes
  seed.js                generates db.json (npm run seed)
src/
  styles/tokens.css      design tokens from Figma (light + dark)
  styles.css             base styles and shared classes (.card, .btn, .data-table, .tabs, ...)
  app/
    app.routes.ts        lazy-loaded routes, auth guard, settings child routes
    core/
      auth/              AuthService (signals), guards, interceptor
      data/              models, EngagementService, TeamService, ActivityService
      prefs/             PreferencesService (theme + notification settings)
      util/              dates, thresholds, milestones, validators, timeAgo pipe, mediaQuery signal
    layout/shell/        sidebar, top bar search, mobile drawer, user menu
    shared/              Icon, Modal, ProgressBar, StatusBadge, KpiCard, Toast
    features/
      login/  dashboard/  engagements/ (list, form, detail + tabs)  team/  settings/
```

## Patterns worth talking about

- **Signals + RxJS together.** RxJS for async streams (HTTP, debounced search, cancelling stale requests with `switchMap`); signals for UI state and derived values. `toSignal` / `toObservable` bridge them.
- **A version signal for cache invalidation.** `EngagementService.version` increments after every write; the list, detail, dashboard, and sidebar badge re-fetch when it changes.
- **URL as state.** Engagements filters and the detail tab live in query params, so refresh, back/forward, and shared links all work.
- **Performance.** `OnPush` everywhere, zoneless change detection, lazy routes, `track` in every `@for`, and animations that only use `transform`/`opacity` (the progress bars use `scaleX`, not `width`).
- **Accessibility.** Labels on every control, `aria-invalid` + `aria-describedby` errors, `aria-sort`, `aria-current`, skip link, native `<dialog>`, keyboard tabs, checkbox switches with `role="switch"`, reduced-motion support.

## Tests (46)

Guards, interceptor, login form, engagement service (query params, total count, version bump, archive), validators, thresholds, milestones, `timeAgo` pipe, status badge.
