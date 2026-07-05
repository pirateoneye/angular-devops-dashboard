# GSLB / DNS Console — Maintenance Guide

One source of truth for running, changing, and going live with the GSLB feature
in `angular-app`. Last updated 2026-07-01.

## 1. Where everything lives

```
src/app/pages/tools-dev/gslb/
  gslb.models.ts        # types: GslbCard, GslbMember, GslbSite, DnsPoolEntry, SuspendPayload…
  gslb.service.ts       # signal store + HTTP + cache + mock + DNS_POOL constant
  gslb.component.ts     # thin view-model + toasts + two-click confirm
  gslb.component.html   # two sections (Suspend/Unsuspend + DNS) sharing #cardTpl
  gslb.component.css    # plain CSS using --msv-* dark tokens
src/app/pages/tools-dev/gslb-authorization/   # secret password page at /gslb/login
src/app/shared/service/auth-guard/gslb.guard.ts   # functional CanActivateFn front-door
src/app/app-routing.module.ts                  # routes: tools-dev/gslb (guarded) + gslb/login
src/environments/environment.ts                # dev: gslbPassword, hostGslb
src/environments/environment.prod.ts           # prod: gslbPassword, hostGslb
```

The GSLB page is wired into: `app-routing.module.ts` (route), `app.component.html`
(nav menu + mobile), `core/service/tool-catalog.service.ts` (devTools entry +
Ctrl+K palette), `pages/home/dashboard.component.ts` (dashboard tile).

## 2. Run / build / what "green" means

```bash
npm run dev      # ng serve --open  → http://localhost:4200, hot reload
npm run build    # ng build --configuration production  → dist/merchantservices.web.tools
npm run start    # serve the built dist on :8080
```

- **"Green" = `npm run build` exits 0 with 0 errors and 0 warnings.** That build
  runs full AOT + template typecheck + bundle budgets, so it is the real gate.
  Always run it before claiming a change is done.
- `ng lint` exists in `angular.json` but **can't run today** — the
  `@angular-eslint/builder` package isn't installed. Install it only if you want
  lint enforced (it pulls several packages).
- `ng test` uses Karma with **real Chrome + autowatch** (not headless). There are
  43 specs, none for GSLB. To run: `ng test` then keep the Chrome window open.

## 3. The secret password (front-door)

GSLB is password-gated, mirroring the existing Piket pattern.

- **Change the password:** edit `gslbPassword` in **both**
  `src/environments/environment.ts` AND `src/environments/environment.prod.ts`,
  then rebuild. Default seeded value: `GslbOpsRahasia2026`.
- **How it works:** `gslbGuard` (`shared/service/auth-guard/gslb.guard.ts`)
  compares `localStorage['authorized-gslb']` to `environment.gslbPassword`. On
  mismatch it redirects to `/gslb/login` (`gslb-authorization` component), which
  caches the password on success and sends you through.
- **The nav link stays visible** (you chose "password gate only, like Piket").
  Clicking without the password bounces to the login page.
- **To re-lock** on your own browser: DevTools → Application → Local Storage →
  delete `authorized-gslb`. The page's "sign out" button only clears the gege.com
  API token, NOT this secret (same as Piket) — the gate persists per browser.
- Two layers of auth: env-password front door → then the gege.com bearer-token
  paste inside the page.

## 4. Go live with the real backend

Dev short-circuits every HTTP call with canned mock data (in the service, NOT a
global interceptor — angular-app uses `HttpClient` directly, no interceptors).

1. Set `hostGslb` in `environment.prod.ts` (already `https://gege.com`).
2. `npm run build` → the prod bundle uses `environment.prod.ts` and hits the real
   API; the mock is gated on `!environment.production` so it's off in prod.
3. Real-backend CORS is the backend's concern (same-origin deploy or allow-origin).

API contract is documented in `gslb.service.ts` and the design spec at
`docs/superpowers/specs/2026-06-30-gslb-console-design.md`. Misspelling `eksternal`
is intentional (the real API uses it) — don't "fix" it.

## 5. The DNS pool (the pickable list)

The DNS section's picker lists FQDNs from a **`DNS_POOL` constant** near the top
of `gslb.service.ts`. It's seeded with obviously-fake `*.example.test` names.

- **To use the real list:** replace the `DNS_POOL` array, or — better — replace
  it with a live fetch from a "list all GSLB FQDNs" endpoint and expose it as a
  signal. There is **no such endpoint** in the captured `dns.txt` today, so this
  is the one prod seam that still needs a real source.
- The picker also has an "Add custom" fallback for FQDNs not in the pool.
- Shown selection persists to `localStorage['gslb.monitoring']` as `{fqdn,zone}[]`
  and survives logout.

## 6. The two sections (don't merge them back)

- **Suspend / Unsuspend** — `kind:'task'` cards from `get_task/user?show_expired=false`
  (the operator's assigned tasks). Actionable: per-member suspend/unsuspend +
  two-click "Suspend/Unsuspend all" with optimistic rollback.
- **DNS** — `kind:'monitor'` cards, **view-only** (no suspend buttons; only
  refresh, GTM info, and ✕ stop-showing). Chosen from the searchable pool.

Both share one card template (`#cardTpl` via `ngTemplateOutlet`); actions are
gated on `card.kind === 'task'`. The shared filter bar (search/zone/sort) applies
to both. If an FQDN is both an assigned task and in the DNS pool, the task card
wins (loadTasks drops the colliding monitor card).

## 7. Performance shape (keep it lazy)

The whole point is "fast even when the backend is slow" for 100+ FQDNs × 6–8
sites. Don't regress these:

- **Lazy expand** — `fqdn/detail` fires only when a card is opened, not on list
  render. One call per FQDN (no `site` param); sites are parsed from `svc_name`.
- **30s cache + stale-while-revalidate** — cached snapshot shows instantly, a
  silent background refresh runs if stale.
- **In-flight dedup** per FQDN + **bounded-concurrency semaphore (4)** — never
  hammer a slow server.
- **Optimistic mutations** with rollback; **two-click confirm** on bulk; 20s
  timeout + one retry on fetches (never on mutations).
- **OnPush + signals + trackBy**, deliberately NO virtualization (fine at
  100–200 cards; CDK 17 has no stable autosize).

## 8. Common pitfalls (things that have bitten us)

- **`providers: [GslbService]` MUST stay on the `@Component` decorator.** The
  service is `@Injectable()` (component-scoped). Removing the provider causes
  `NG0203: No provider for GslbService` at runtime — and the build does NOT catch
  this. Always keep it.
- **Keep `optimization.fonts.inline: false`** in `angular.json` — prod font
  inlining hits a Windows TLS cert error fetching Google Fonts.
- **Mock data uses obviously-fake `*.example.test` names** on purpose. Don't put
  real-looking internal domains in the mock.
- **No template arrow functions / assignments** — Angular template bindings
  reject `m => m.state === 'UP'`. Precompute counts in `sitesOf()` instead
  (returns `GslbSite { up, oos, down, susp }`).
- **No Playwright** — there's a deny rule on it in this environment. Verify via
  green build + manual browser check; can't auto-smoke-test.
- **Don't touch** `node_modules/`, `dist/`, `.angular/` — generated.

## 9. Adding / removing a utility tool (toolbox)

Three places must stay in sync (else dead links / blank panels):

1. `core/service/tool-catalog.service.ts` → `tools` array (catalog entry).
2. `pages/toolbox/toolbox.component.ts` → `TOOL_LOADERS` map (slug → dynamic
   import). This is the source of truth for the `ToolSlug` union.
3. The component folder under `pages/tools-dev/<slug>/`.
4. If it's on the dashboard, update `pages/home/dashboard.component.ts` tile +
   the Utilities description count.

## 10. Verify-before-done checklist

- [ ] `npm run build` → exit 0, 0 errors, 0 warnings.
- [ ] No new `console.error` / runtime DI regressions (keep `providers:[GslbService]`).
- [ ] If you touched env: both `environment.ts` and `environment.prod.ts` updated.
- [ ] If you touched routing: lazy `loadComponent` path correct, guard attached.
- [ ] Manual browser check of the affected page (we can't auto-test).