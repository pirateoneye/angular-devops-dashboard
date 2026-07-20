# MSV Tools — Project Context

## Stack
- Angular 17 **standalone components** — NO NgModules for MSV components
- Signals, `inject()`, new `@if/@for/@switch` control flow
- Angular Material 17 + MD3 theming
- `ChangeDetectionStrategy.OnPush` everywhere
- TypeScript ~5.4, ESLint, Prettier
- Jasmine + Karma
- Language: **Indonesian (id)** — UI text, comments, TODOs

## Project Structure (post-refactor)
- `src/app/app.routes.ts` — all 30+ routes, compact 1-liner `loadComponent` pattern
- `src/app/app-routing.module.ts` — 11-line NgModule wrapper for `RouterModule.forRoot`
- `src/app/shared/components/msv-forms/` — 35 standalone components, NO `msv-forms.module.ts`
- `src/app/shared/component/` — cross-cutting standalone components (copy-btn, skeleton, toast, command-palette, empty-state, error-state, activity-feed, quick-handle, etc.)
- `src/app/shared/service/` — all `@Injectable({ providedIn: 'root' })` (jenkins, gitlab, gslb, clipboard, user, activity, auth-guard)
- `src/styles/` — CSS split: `tokens.css`, `bootstrap-dark.css`, `material-dark.css`, `print.css`; all `@import`-ed from `styles.css`

## Design System
- CSS tokens: `--msv-*` in `src/styles/tokens.css` (light/dark via `[data-theme="dark"]`)
- Font: `"Open Sans", sans-serif`
- Tool page classes: `.tool-card`, `.tool-title`, `.tool-sub`, `.tool-divider`, `.tool-label`, `.tool-area`, `.tool-actions`, `.btn-primary`, `.btn-secondary`, `.icon-btn`
- Status badges: `.badge-available`, `.badge-info`, `.badge-unavailable`, `.badge-failed`, `.badge-notyet`
- `_variables.css` aliases legacy form tokens → canonical `--msv-*` tokens; prefer canonical tokens

## Patterns (ALWAYS)
- `inject()` DI, never constructor injection
- `signal()` + `computed()` for reactive state
- `readonly` on injected/derived fields
- Router: `loadComponent: () => import(...).then(m => m.X)`
- Standalone imports: every Material/CDK module explicitly listed; `CommonModule`, `FormsModule` as needed
- localStorage persistence, keys prefixed `jenkins-` or `msv-`; always try/catch
- `jenkinsGuard` / `piketGuard` / `gslbGuard` are `CanActivateFn`

## Patterns (AVOID)
- NEVER `*ngIf`/`*ngFor`/`[ngSwitch]` — `@if`/`@for`/`@switch` only
- NEVER inline styles in decorator — separate `.css` file
- NEVER `MaterialModule` aggregate — individual `Mat*Module` per component
- NEVER hardcode hex colors — `var(--msv-*)` tokens
- NEVER constructor injection — `inject()` at field level

## MSV Standalone Conversion Guide
- Each component under `msv-forms/` has `standalone: true` + explicit `imports: [...]`
- Form components (input, select, textarea, checkbox, radio, number, file-upload, checkbox-group): `imports: [CommonModule, FormsModule]`
- Display components (button, card, divider, modal, progress, spinner, table, tabs): `imports: [CommonModule]`
- Material: datepicker has `imports: [CommonModule, FormsModule, MatInputModule, MatDatepickerModule, MatNativeDateModule]`
- Cross-deps: accordion→accordion-item, list→list-item, menu→menu-item, response-panel→status-badge, table→pagination, tabs→tab, toast-container→toast
- `@Directive` decorators CANNOT have `imports` — removed from tooltip & menu-trigger directives
- Consumer import: `import { MsvSelectComponent } from '...msv-forms/msv-select/msv-select.component'`

## Jenkins Build (reference)
- `src/app/pages/tools-dev/jenkins-build/` — signals, localStorage, demo mode, batch builds, presets, 3-zone layout
- Services: `jenkins.service.ts`, `project-registry.service.ts`, `preset.service.ts`, `build-history.service.ts`, all `providedIn: 'root'`

## Test Conventions
- Standalone setup: `TestBed.configureTestingModule({ imports: [ComponentUnderTest, ...deps] })`
- NEVER `declarations: [StandaloneComponent]` — raises error
- Test host components (`TestHostComponent`, etc.): keep in `declarations`
- Spec co-located with source; Jasmine, `spyOn`, `describe/it/expect`
