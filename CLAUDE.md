# MSV Tools — Claude Code project memory

## Stack
- Angular 17 with **standalone components**, signals, `inject()`, new `@if/@for/@switch` control flow
- Angular Material 17 + Material Design 3 theming
- `ChangeDetectionStrategy.OnPush` everywhere (default)
- TypeScript ~5.4, ESLint, Prettier
- Jasmine + Karma for tests
- Language: **Indonesian (id)** — UI text, comments, TODOs
- Proxy config at `proxy.conf.json` for local dev

## Design System
- CSS custom properties: `--msv-*` tokens defined in `angular/src/styles.css` (light/dark via `[data-theme="dark"]`)
- Font: `"Open Sans", sans-serif` project-wide
- MSV Forms library: 30+ custom components at `angular/src/app/shared/components/msv-forms/` (input, select, modal, toast, alert, table, badge, card, button, tooltip, etc.)
- Legacy form tokens alias canonical `--msv-*` tokens via `_variables.css` — prefer canonical tokens for new code

## Patterns (ALWAYS)
- `inject()` DI, never constructor injection
- `signal()` + `computed()` for local reactive state
- `readonly` on all injected/derived fields
- Router: `{ path, loadComponent: () => import(...).then(m => m.X) }` — nested or no-component routes use `loadChildren`
- Standalone component import lists: declare every Material module explicitly (CommonModule, FormsModule, RouterModule, each MatIconModule/MatButtonModule/etc.)
- LocalStorage for all persistence — keys prefixed with `jenkins-` or `msv-`; always try/catch parse/write
- `jenkinsGuard` / `piketGuard` / `gslbGuard` are CanActivateFn functions; redirect to `/<tool>/login` with `redirectUrl` in `history.state`

## Patterns (AVOID)
- Never inject Router/HttpClient in constructors — use `inject()` at field level
- Never use `*ngIf` / `*ngFor` / `[ngSwitch]` — new `@if` / `@for` / `@switch` only
- Never put styles in component decorator as inline array — always separate `.css` file
- Never import MaterialModule (NgModule aggregate) — import each Mat*Module individually in standalone components
- Never hardcode hex colors — always use `var(--msv-*)` tokens
- Never bypass the pre-flight scan when generating new UI for existing tools

## Jenkins Build (reference implementation)
- `angular/src/app/pages/tools-dev/jenkins-build/jenkins-build.component.*` — showcase component: signals, localStorage, demo mode, batch builds, presets, 3-zone layout
- Services at `angular/src/app/shared/service/jenkins/`:
  - `jenkins.service.ts` — REST API (crumb, jobs, params, build triggers)
  - `project-registry.service.ts` — project catalog, multi-select, groups, param memory
  - `preset.service.ts` — named parameter presets
  - `build-history.service.ts` — FIFO-capped audit trail (200 entries)
- All 4 services are `@Injectable({ providedIn: 'root' })`
- `server-dialog.component.ts` — modal for adding/testing Jenkins servers (fetch jobs count via live API)
- `batch-dialog.component.ts` — confirm batch builds with two-click arm + sequential progress
- Demo mode: 12 `GENERATE-svc-*` projects seeded with real GENERATE params; builds simulate success

## Activity Feed
- `angular/src/app/shared/service/activity.service.ts` — global event bus for jenkins/gitlab/gslb (namespaced)
- `activity-feed.component.ts` — fixed-bottom notification bar, auto-collapsed, log-centric
- Pattern: `this.feed.log('jenkins', 'Build X queued', 'ok')` — 4 arguments: source, message, kind: info|ok|warn|err

## Routing
- `angular/src/app/app-routing.module.ts` — all routes defined here
- 30+ lazily-loaded standalone components
- `{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }` + `{ path: '**', redirectTo: 'dashboard' }`
- Route guards: `jenkinsGuard`, `piketGuard`, `gslbGuard` at `angular/src/app/shared/service/auth-guard/`

## Test conventions
- Component tests: standalone setup with `TestBed.configureTestingModule({ imports: [...] })` for each under-test component + its dependencies
- Service tests: `TestBed` with real service instance, test localStorage interactions
- Spec file co-located with source
- Karma + Jasmine, no Jest — use `spyOn`, `describe/it/expect`

## Hallmark design skill (when generating new UI)
- This project has a `CLAUDE.md` — pre-flight is implicitly done
- Only use Hallmark when generating **new standalone pages**, not existing tool UIs
- When generating new UI: state macrostructure pick out loud, apply design-context-gate, prefer editorial genre for tools
- Never change existing `--msv-*` tokens, font stack, or component library conventions
- Generated pages must use existing `tool-title`, `tool-sub`, `tool-label`, `tool-actions`, `btn-primary`, `btn-secondary` classes from `angular/src/styles.css`
- For tool pages, follow the JSON Formatter pattern: narrow layout (max ~880px), sidebar tabs, reactive form with signals
