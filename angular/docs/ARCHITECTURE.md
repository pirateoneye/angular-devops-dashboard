# MSV Tools Dashboard — Architecture

## 1. GitLab Tools (Paling Detail)

### Component Hierarchy

```mermaid
flowchart TB
    subgraph SHELL["GitlabComponent (Shell)"]
        AUTH["ConnectComponent\nToken input + login"]
        GROUP["GroupSelector (inline)\nGroup dropdown"]
        TABS["TabNav (inline)\nDashboard | Tags | Pipelines | MRs | Bulk"]
        ACTIVITY["ActivityComponent\nLog ring buffer"]
    end

    subgraph VIEWS["5 Tab Views"]
        DASH["DashboardComponent\nProject list + tag badge\nSearch | Filter | Sort | Multi-select"]
        TAGS["TagsComponent\nTag viewer per project\nCreate new tags"]
        PIPES["PipelinesComponent\nLatest 10 pipelines\nRef filter | Expand/collapse"]
        MRS["MergeRequestsComponent\nBy state filter\nDetail panel + approve"]
        BULK["BulkComponent\n10 bulk ops\nSelect → Preview → Execute"]
    end

    subgraph SERVICE["Service Layer"]
        SVC["GitLabService\nState: token, accounts, groups, projects\nAuth: login/logout/devBypass\nRead/Mutate delegates"]
    end

    subgraph API["API Layer (framework-agnostic)"]
        CLIENT["GitLabClient\nREST v4, PRIVATE-TOKEN header\nPagination 100/page, 25+ methods"]
        BATCH["gitlab-batch.ts\nmapWithConcurrency (default 3)\n10 batch functions"]
    end

    subgraph EXT["External"]
        GITLAB["GitLab API\nhttps://asui/api/v4"]
    end

    SHELL --> VIEWS
    SHELL --> SERVICE
    SERVICE --> API
    CLIENT --> GITLAB
    BATCH --> CLIENT
```

### Data Flow — Login → Dashboard → Bulk

```mermaid
sequenceDiagram
    actor User
    participant Connect as ConnectComponent
    participant Svc as GitLabService
    participant Client as GitLabClient
    participant GitLab as GitLab API v4

    Note over User,GitLab: 1. Login
    User->>Connect: Masukkan PAT token
    Connect->>Svc: login(token)
    Svc->>Client: validateToken()
    Client->>GitLab: GET /user (PRIVATE-TOKEN header)
    GitLab-->>Client: 200 + user object
    Client-->>Svc: valid → token signal set

    Note over User,GitLab: 2. Load Groups
    Svc->>Client: listGroups()
    Client->>GitLab: GET /groups?top_level_only=true&per_page=100
    GitLab-->>Client: Group[]
    Client-->>Svc: groups signal populated
    Svc-->>User: Group dropdown muncul

    Note over User,GitLab: 3. Pilih Group → Load Projects
    User->>Svc: select group
    Svc->>Client: listGroupProjects(gid)
    Client->>GitLab: GET /groups/:gid/projects?include_subgroups=true
    GitLab-->>Client: Project[]
    Client-->>Svc: projects signal populated

    Note over User,GitLab: 4. Dashboard load tags (concurrency=8)
    Svc->>Client: listProjectTags(pid) × N projects
    Client->>GitLab: GET /projects/:pid/repository/tags (parallel, max 8)
    GitLab-->>Client: Tag[]
    Client-->>User: Tag badges per project

    Note over User,GitLab: 5. Bulk Action (select → preview → execute)
    User->>Svc: preview(action, ids, config)
    Svc->>Client: read preconditions per project
    Client->>GitLab: GET branches/tags/MRs...
    GitLab-->>Client: current state
    Client-->>Svc: PreviewResult[]
    Svc-->>User: Preview ditampilkan
    User->>Svc: execute(action, ids, config)
    Svc->>BATCH: batch function (createTags, createMRs, ...)
    BATCH->>Client: N parallel requests (limit=3)
    Client->>GitLab: POST/DELETE per project
    GitLab-->>Client: responses
    Client-->>BATCH: results
    BATCH-->>Svc: ExecResult[]
    Svc-->>User: Hasil + activity log
```

### GitLab API Endpoints

| Method | Endpoint | Digunakan Oleh |
|--------|----------|---------------|
| `GET` | `/user` | validateToken (login) |
| `GET` | `/groups?top_level_only=true&per_page=100` | listGroups |
| `GET` | `/groups/:gid/projects?include_subgroups=true` | listGroupProjects |
| `GET` | `/projects/:pid/repository/branches` | listProjectBranches |
| `GET` | `/projects/:pid/repository/tags?order_by&sort&per_page` | listProjectTags |
| `GET` | `/projects/:pid/members/all` | listProjectMembers |
| `GET` | `/projects/:pid/labels` | listProjectLabels |
| `GET` | `/projects/:pid/milestones?state=active` | listProjectMilestones |
| `GET` | `/projects/:pid/merge_requests?state&per_page` | listProjectMergeRequests |
| `GET` | `/projects/:pid/merge_requests/:iid` | getMergeRequest |
| `GET` | `/projects/:pid/merge_requests/:iid/approvals` | listMergeRequestApprovals |
| `GET` | `/projects/:pid/pipelines?per_page&ref&sort` | listProjectPipelines |
| `POST` | `/projects/:pid/merge_requests/:iid/approve` | approveMergeRequest |
| `DELETE` | `/projects/:pid/merge_requests/:iid/unapprove` | unapproveMergeRequest |
| `POST` | `/projects/:pid/merge_requests` | createMergeRequest (bulk) |
| `POST` | `/projects/:pid/repository/tags` | createTag (bulk) |
| `POST` | `/projects/:pid/repository/branches` | createBranch (bulk) |
| `DELETE` | `/projects/:pid/repository/branches/:name` | deleteBranch (bulk) |
| `POST` | `/projects/:pid/protected_branches` | protectBranch (bulk) |
| `DELETE` | `/projects/:pid/protected_branches/:name` | unprotectBranch (bulk) |
| `POST` | `/projects/:pid/pipeline` | triggerPipeline (bulk) |
| `POST` | `/projects/:pid/releases` | createRelease (bulk) |
| `PUT` | `/projects/:pid/merge_requests/:iid/merge` | mergeMR (bulk) |
| `PUT` | `/projects/:pid/merge_requests/:iid` | closeMR / updateLabels (bulk) |

### File Tree

```
pages/tools-dev/gitlab/
├── gitlab.component.ts              Shell: auth state, 6-view routing, group selector
├── gitlab.component.html            Header + tab nav + conditional views + activity footer
├── gitlab.component.css             Shell styling
├── types.ts                         Shared: ViewName, SortKey, FilterChip, tagAge helpers
├── gitlab-activity.service.ts       Ring buffer (max 200), kind: info|ok|warn|err
├── connect/
│   └── connect.component.ts         Token input, devBypass(), min 10 char validation
├── dashboard/
│   └── dashboard.component.ts       Project list, tag badge, concurrency=8, multi-select
├── tags/
│   └── tags.component.ts            Tag viewer + create, per-project
├── pipelines/
│   └── pipelines.component.ts       Pipeline viewer, ref filter, status colors
├── merge-requests/
│   └── merge-requests.component.ts  MR list, state filter, detail + approve
├── bulk/
│   └── bulk.component.ts            10 actions, 3-step wizard, two-click arm safety
└── activity/
    └── activity.component.ts        Activity log display

shared/service/gitlab/
├── gitlab-api.ts                    GitLabClient (framework-agnostic), all domain types
├── gitlab.service.ts                Angular facade: signals, auth, delegation
└── gitlab-batch.ts                  Pure async batch orchestration (10 operations)
```

---

## 2. GSLB Manager

```mermaid
flowchart TB
    subgraph GSLB_PAGE["GslbComponent"]
        STATS["Stats Bar\nUP | OOS | DOWN | SUSPENDED counts"]
        FILTER["Filter Bar\nSearch | Zone toggle | Sort toggle"]
        CARDS["Card Grid\nFQDN cards + member tables"]
        BULKGSLB["Two-click Arm\nBulk suspend/unsuspend per card"]
        GTM["GTM Detail Slide-over\nPool member detail"]
    end

    subgraph GSLB_SVC["GslbService"]
        AUTHG["Auth: login/logout/session restore"]
        TASKS["Tasks: GET /obj/get_task/{user}"]
        DETAIL["Detail: POST /fqdn/detail (cache 30s, max 4 concurrent)"]
        MUTATE["Mutate: suspend/unsuspend (optimistic UI)"]
        MONITOR["Monitor: add/remove custom FQDNs"]
    end

    subgraph GSLB_API["GSLB API"]
        LOGIN["POST /api/login\n(FormData)"]
        TASKAPI["GET /api/gslb/obj/get_task/{user}"]
        FQDNAPI["POST /api/gslb/fqdn/detail"]
        SUSPEND["POST /api/gslb/fun/suspend\nSVC_STATE: DOWN"]
        UNSUSPEND["POST /api/gslb/fun/unsuspend\nSVC_STATE: OUT_OF_SERVICE"]
        GTMDETAIL["POST /api/gslb/gtmpoolmemberdetail"]
    end

    GSLB_PAGE --> GSLB_SVC
    GSLB_SVC --> GSLB_API

    style SUSPEND fill:#d32f2f,color:#fff
    style UNSUSPEND fill:#388e3c,color:#fff
```

### Suspend/Resume Flow

```mermaid
sequenceDiagram
    actor User
    participant Comp as GslbComponent
    participant Svc as GslbService
    participant API as GSLB API

    Note over User,API: Suspend member (optimistic)
    User->>Comp: Klik suspend per member
    Comp->>Svc: suspend(member, fqdn)
    Svc->>Svc: Optimistic: state → SUSPENDED
    Svc->>API: POST /fun/suspend?type=zone (SVC_STATE: DOWN)
    alt Success
        API-->>Svc: 200 OK
        Svc->>Svc: Trigger background refresh
    else Failure
        API-->>Svc: Error
        Svc->>Svc: Revert: state → previous
    end

    Note over User,API: Bulk suspend (two-click arm)
    User->>Comp: Klik "Suspend All" (arm, 5s timeout)
    User->>Comp: Klik "Confirm" dalam 5s
    Comp->>Svc: suspendAll(fqdn)
    Svc->>Svc: Optimistic all members → SUSPENDED
    loop Per member (max 4 concurrent)
        Svc->>API: POST /fun/suspend
    end
```

### Card Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Auth: Buka halaman
    Auth --> LoadingTasks: Login berhasil
    LoadingTasks --> TaskCards: GET /obj/get_task/{user}
    TaskCards --> Detailed: toggleExpand / refresh
    LoadingTasks --> MonitorCards: User add FQDN manual
    MonitorCards --> Detailed: loadAllMonitoring
    Detailed --> Mutating: User suspend/unsuspend
    Mutating --> Detailed: Success + background refresh
    Mutating --> Detailed: Failure + revert state
    Detailed --> MonitorCards: User remove FQDN
```

---

## 3. Full Dashboard Architecture

```mermaid
flowchart TB
    subgraph BROWSER["🖥 Browser — Angular 15+ SPA"]
        subgraph SHELL["Shell Layer"]
            APP["AppModule\nHTTP_INTERCEPTORS: ErrorInterceptor\nLocale: id"]
            ROUTER["AppRoutingModule\nLazy-loaded routes\nPreloadAllModules"]
        end

        subgraph AUTH["Auth (per-tool, no centralized interceptor)"]
            GA["GitLab: PRIVATE-TOKEN header\nSession-only, never persisted"]
            GS["GSLB: POST /api/login → token\nlocalStorage persistence"]
            JA["Jenkins: Basic btoa(user:token)\nlocalStorage persistence"]
            PA["Piket: password guard\nenvironment.piketPassword"]
        end

        subgraph CORE["Core Services"]
            CATALOG["ToolCatalogService\n15 utils + 15 dev tools + Piket\nFavorites/recents localStorage"]
            THEME["ThemeService\ndata-theme on html\nOS preference default"]
            ACTIVITY["ActivityService\nUnified event feed (max 100)\nSources: gitlab, gslb, jenkins"]
        end

        subgraph TOOLS["Dev Tools (lazy-loaded)"]
            GITLABP["GitLab Manager\n5 tabs + batch wizard"]
            GSLBP["GSLB Manager\nDNS monitor + suspend"]
            JENKINSP["Jenkins Build\nJob params + presets"]
            KAFKAP["Publish Kafka\nMessage publisher"]
            SSLCHECKP["SSL Check\nCert expiry checker"]
            DNSQP["DNS Query\nCloudflare DNS"]
            OTHER["+16 more tools"]
        end

        subgraph UTILS["Utilities (lazy-loaded)"]
            JSON["JSON Formatter"]
            DECODER["Decoder"]
            HASH["Hash Generator"]
            JWT["JWT Debugger"]
            SSLCONV["SSL Converter"]
            OTHERU["+10 more"]
        end
    end

    subgraph API["🌐 External APIs"]
        GITLABAPI["GitLab REST v4\nasui/api/v4"]
        GSLBAPI["GSLB API\ngege.com"]
        JENKINSAPI["Jenkins Server"]
        KAFKAAPI["Kafka Broker"]
        CLOUDFLARE["Cloudflare DNS"]
        MESSI["Messi SSO\nasis.com"]
        MAGENTA["Magenta\nasiss.com"]
        MCB["Tools MCB\nasil.com"]
    end

    GITLABP --> GITLABAPI
    GSLBP --> GSLBAPI
    JENKINSP --> JENKINSAPI
    KAFKAP --> KAFKAAPI
    DNSQP --> CLOUDFLARE
    SSLCHECKP --> MCB
    OTHER --> MESSI
    OTHER --> MAGENTA

    style SHELL fill:#1a237e,color:#fff
    style AUTH fill:#4a148c,color:#fff
    style CORE fill:#004d40,color:#fff
    style TOOLS fill:#01579b,color:#fff
    style UTILS fill:#33691e,color:#fff
    style API fill:#bf360c,color:#fff
```

### Service Dependency Graph

```mermaid
flowchart LR
    subgraph HTTP["HTTP Layer"]
        HC["HttpClient"]
        ERR["HttpErrorInterceptor\ncatches all → ActivityService"]
    end

    subgraph DOMAIN["Domain Services"]
        GSVC["GitLabService\nsignals, auth, delegation"]
        GCLIENT["GitLabClient\nframework-agnostic REST"]
        GBATCH["gitlab-batch\nconcurrency=3"]
        GSLBSVC["GslbService\nsignals, cache 30s, max 4 concurrent"]
        JENKINSSVC["JenkinsService\nObservable, crumb + Basic auth"]
    end

    subgraph SHARED["Shared Primitives"]
        CLIP["ClipboardService\nasync write + fallback"]
        TOAST["MsvToastService\nsuccess/error/warn/info"]
        MODAL["MsvModalService\nCDK Overlay, confirm dialogs"]
        USER["UserService\nBehaviorSubject, legacy migration"]
    end

    HC --> ERR
    GSVC --> GCLIENT
    GSVC --> GBATCH
    GCLIENT --> HC
    GSLBSVC --> HC
    JENKINSSVC --> HC
    ERR --> ACTIVITY["ActivityService\nunified feed"]
```

### Base URLs (Environment Config)

| Key | Purpose | Tools |
|-----|---------|-------|
| `hostToolsMcb` | File server, data mgmt, keluhan, QRIS, Kafka, batch | Check Data, Delete Data, File Server, Push Notif, Publish Kafka, Keluhan List |
| `hostMessiProd` | Messi SSO / user lookup | Fix Data User, Fix After Merge |
| `hostMagentaProd` | Magenta IndukCicilan / Pemilik | Check Data, Fix Data User |
| `hostBatchRunner` | Batch runner endpoint | Batch Runner |
| `hostGslb` | GSLB login + API | GSLB Manager |

---

## 4. Utility Tools (Pure Client-Side)

Semua 15 utility tools **tidak memanggil API eksternal**. Mereka pure frontend, hanya menggunakan:

- `ClipboardService` — copy-to-clipboard dengan fallback `execCommand`
- `MsvToastService` — notifikasi sukses/gagal

| Tool | Dependensi Berat | Notes |
|------|-----------------|-------|
| JSON Formatter | — | |
| Decoder (Base64/URL/Hex) | — | |
| Regex Tester | — | |
| Hash Generator (MD5/SHA) | `crypto-js` | |
| Text Diff | — | |
| Text Transforms | — | |
| Cron Explainer | — | |
| Image ↔ Base64 | — | FileReader API |
| Timestamp Converter | — | |
| Text Sort/Dedupe | — | |
| Character Counter | — | |
| chmod Calculator | — | |
| Random Picker | — | |
| JWT Debugger | — | Base64 decode JWT segments |
| SSL Converter | `node-forge`, `jsrsasign` | Parsing + convert cert/key/PFX |

---

## 5. New Tools (Recently Added)

| Tool | Path | Function |
|------|------|----------|
| SSL Converter | `/tools-dev/ssl-converter` | Upload/paste cert → detect type → convert format (PEM/DER/PKCS/JWK) + metadata |
| Env Var Converter | `/tools-dev/env-var-converter` | Convert .env ↔ JSON/YAML/docker-compose |
| cURL Converter | `/tools-dev/curl-converter` | Parse cURL command → code snippet (Python/JS/Go/etc) |
| Postman Viewer | `/tools-dev/postman-viewer` | View/explore Postman collection JSON |

---

## 6. Testing Strategy

| Scope | Command |
|-------|---------|
| Full suite | `npx ng test --watch=false --browsers=ChromeHeadless` |
| Single tool | `npx ng test --watch=false --browsers=ChromeHeadless --include="**/component-name.component.spec.ts"` |
| Logic only | `npx ng test --watch=false --browsers=ChromeHeadless --include="**/*.logic.spec.ts"` |

**Catatan:** Untuk test isolated tools dengan `--include`, pastikan spec tidak meng-import component yang punya `templateUrl`/`styleUrl` — webpack entry minimal tidak punya CSS/HTML loader. Solusi: extract pure logic ke `*.logic.ts` (seperti `ssl-converter.logic.ts`).
