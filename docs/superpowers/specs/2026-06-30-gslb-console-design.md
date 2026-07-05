# GSLB / DNS Traffic Console — Design

**Project:** `01-Projects/angular-app` (`merchantservices.web.tools`, Angular 17.3, Material 17 + CDK + Bootstrap 5, `--msv-*` dark tokens, plain CSS component styles, HttpClient-direct, signals + OnPush).
**Date:** 2026-06-30
**Replaces:** `paimon-dupe` page (deleted). Archives `ProjectR/apps/devops-dashboard` (the other Angular repo) — angular-app becomes the only Angular repo.

---

## 1. Goal

One page, one route (`/tools-dev/gslb`), the single home of the GSLB/DNS traffic-control feature: monitor 100++ assigned FQDNs, drill into a FQDN's per-site pool members, and suspend / unsuspend services. Must stay **fast and informative even when the backend (`gege.com`) is slow.** Operator trust, not paperwork.

## 2. Real API contract (from `dns.txt`)

| Call | Method + URL | Body | Returns |
|------|--------------|------|---------|
| Login | `POST /api/login` | `multipart/form-data` `username`,`password` | JWT |
| My tasks | `GET /api/gslb/obj/get_task/user?show_expired=false` | — | operator's assigned FQDN list (shape inferred — defensive parse, log raw in dev) |
| FQDN detail | `POST /api/gslb/fqdn/detail?type=eksternal\|internal` | `{fqdn, position:'current'}` | `{gtm: boolean, data: [{svc_name, svr_ip, svr_port, state}]}` — states `UP`/`OUT OF SERVICE`/`DOWN` |
| Suspend | `POST /api/gslb/fun/suspend?type=…` | UPPER_CASE `{SVC_NAME, SVC_STATE:'DOWN', PORT, VS_NAME, FQDN, IP, GTM, requestbytesrate, ID}` | ack |
| Unsuspend | `POST /api/gslb/fun/unsuspend?type=…` | same, `SVC_STATE:'OUT OF SERVICE'` | ack |
| GTM detail | `POST /api/gslb/gtmpoolmemberdetail` | `{domain, pool_member_name, flag:'eksternal'}` | pool member detail |

Headers on every authed call: `Authorization: Bearer <jwt>` + `X-USER: <username>`. Misspelling `eksternal` is **preserved verbatim**.

**Key finding:** paimon-dupe's *working* detail call uses `?type=…` with **no `site`** param — one call per FQDN returns that FQDN's members. The 6-8 sites are a **UI grouping** parsed from `svc_name`/`VS_NAME` (e.g. `SRVC_namaapp_PILOT_WSA2` → site `WSA2`), **not** 6-8 separate calls. Worst-case detail calls ≈ number of *opened* FQDNs, not 700. (If a real probe shows the no-site call returns only one site, the cache key extends to `(fqdn, site)` and a bounded site-loop is added — the perf primitives below are unchanged.)

## 3. Performance strategy (the core)

**Instant first paint.** `get_task/user` is one cheap GET → renders all 100++ FQDN cards immediately. No detail call has fired. Useful before the slow server does anything.

**Virtualized list.** CDK `CdkVirtualScroll` (CDK already a dep). Only the ~10 visible cards live in the DOM. 137 cards == 10 cards cost. Filters just change the visible slice.

**Lazy expand — cached, stale-while-revalidate.** A card's `fqdn/detail` fires only on expand. On open: cached snapshot (even stale) shows **instantly** + a silent background refresh ("refreshing…" pulse); no cache → skeleton. Re-open is instant. Cache key `fqdn`, TTL 30s. In-flight dedup per key + cancel-on-close so rapid open/close never double-fires or dangles.

**Site grouping.** Flat `data[]` grouped by parsing `svc_name` → site chips. Each site = collapsible group with its own UP/OOS/DOWN pills. One call → full 6-8-site picture.

**Optimistic actions, never block.** Suspend/unsuspend flips the row to a local `SUSPENDED` label instantly, fires the call, rolls back + toast on failure. Two-click confirm (arm → confirm, auto-disarm 4.5s, Esc cancels). Bulk "Suspend all / Unsuspend all" per card.

**Bounded concurrency + resilience.** Semaphore caps concurrent detail calls at 4 — a "scan" can never hammer a slow server. Per-call 20s timeout + one retry; a failed site shows an error row with retry, the rest of the page unaffected. A "loading N" chip shows what's in flight.

**Client-side filters = the time reducer.** Sticky filter bar, all instant, zero network:
- 🔍 search (FQDN substring, live)
- zone toggle All / Internal / External
- sort by name | last-checked
- result count "showing X of Y"
- persisted to `localStorage`

The filter decides **what's even eligible to be fetched** — narrow to 3 cards, open all 3 = 3 calls.

## 4. Files

**Create** under `src/app/pages/tools-dev/gslb/`:
- `gslb.models.ts` — `GslbState = 'UP'|'OUT OF SERVICE'|'DOWN'|'SUSPENDED'` (SUSPENDED local-only); `GslbMember` (svc_name, svr_ip, svr_port, state, site?, gtm?, id?, vsName?, port?, fqdn?); `GslbSite` (name, members[]); `GslbCard` (fqdn, zone, expanded, snapshot?, loading, error, lastUpdated, stale); `GslbTask` (defensive); `SuspendPayload` (UPPER_CASE).
- `gslb.service.ts` — `@Injectable()` (component-provided). Signals: `authed`, `username`, `cards`, `filteredCards` (computed from search/zone/sort), `cache` Map, `inflight` Map, `loading`. Methods: `login`, `logout`, `loadTasks` (GET, defensive parse), `expand(fqdn)` (lazy + SWR), `refresh(fqdn)`, `suspend/unsuspend` (optimistic + rollback), `openGtmDetail`, `gtmpoolmemberdetail`. Mock short-circuit when `!environment.production` (canned data, ~120-340ms delay); prod → real `HttpClient` to `${environment.hostGslb}`. Persists `gslb.token/username` + filter prefs to `localStorage`.
- `gslb.component.ts` — standalone, `imports: [CommonModule, FormsModule, MaterialModule, ScrollingModule]`, OnPush. Thin view-model over service signals. Local-only: `armed` confirm state + auto-disarm, trackBy fns, helpers (stateClass/stateLabel).
- `gslb.component.html` — login gate → header (verdict + username + sign out) → filter bar (search/zone/sort/count) → `cdk-virtual-scroll-viewport` of cards. Card head: dot, fqdn, zone tag, pills (once loaded), last-updated, refresh. Body (expanded): site groups → member rows (state badge, ip:port, two-click suspend/unsuspend, bulk all). GTM slide-over.
- `gslb.component.css` — plain CSS, `--msv-*` tokens, shared utility classes from `styles.css`. Stay under 60kb warn / 150kb error.

**Modify:**
- `app-routing.module.ts` — replace `paimon-dupe` route with `tools-dev/gslb` → `GslbComponent`.
- `app.component.html` — add "GSLB" nav entry (UAT/DEV menu + mobile).
- `core/service/tool-catalog.service.ts` — register gslb in `devTools`.
- `environments/environment.ts` + `environment.prod.ts` — add `hostGslb: 'https://gege.com'`.

**Delete:** `src/app/pages/tools-dev/paimon-dupe/` (folder, route, nav, catalog entry).

**Archive + remove:** `01-Projects/ProjectR/apps/devops-dashboard` → `04-Archives/devops-dashboard-backup-20260630.tar.gz`, then delete the folder.

## 5. Verification

1. `cd 01-Projects/angular-app/angular && npm run build` — zero TS errors, no budget errors.
2. `npm start` → navigate to GSLB → login (mock) → assert instant 100+ card list (virtualized) → type search → assert live narrow → open a card → assert skeleton→site groups→rows → suspend (two-click) → assert optimistic SUSPENDED + toast → refresh → assert SWR (instant cache + background refresh).
3. Prod path: `ng build` uses `environment.prod.ts` `hostGslb` → real `gege.com`, mock off.

## 6. Risks

1. **`get_task/user` response shape inferred** — defensive parse (`any[] | {data} | {tasks}`), log raw in dev, adjust mapper on first real call. HIGH.
2. **LoginResponse JWT field inferred** — probe `jwt ?? token ?? access_token ?? data?.token`. LOW-MID.
3. **No-site detail call may return one site only** — cache key is `fqdn`; if real probe shows per-site, extend to `(fqdn, site)` + bounded site loop. Architecture unchanged. MID.
4. **SCSS/CSS budget** — validate at build; trim stats bars / raw-JSON styling first if it warns.
5. `requestbytesrate: "-"` — coerce to 0 for any pulse, pass through in suspend payload.

## 7. Out of scope

Real-backend CORS in prod (same-origin deploy or backend allow-origin — backend's concern). Auto-scan / "expand all" (Option B/C) — deferred; easy to add later.