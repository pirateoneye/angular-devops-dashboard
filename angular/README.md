# MSV Tools

Angular 17 dashboard for internal dev operations — Jenkins batch builds, GitLab bulk tools, GSLB monitoring, SSL checks, and 30+ utility tools.

## Quick Start

```bash
cd angular
npm install
npx ng serve
# → http://localhost:4200
```

Production build:
```bash
npx ng build --configuration production
# output in dist/
```

---

## Jenkins Build (`/tools-dev/jenkins-build`)

Project-first batch build tool for 100+ project workflows.

### Architecture — Three Zones

```
┌─────────────────────────────────────────────────────────┐
│ Zone 1: Top Bar                                          │
│ [Demo Server] [Settings]  Preset: [▼ Release v3 to Prod] │
├──────────────────────┬──────────────────────────────────┤
│ Zone 2a: Project List │ Zone 2b: Parameter Form          │
│                       │                                  │
│ 🔍 Cari project       │ 🔵 GENERATE-svc-payment          │
│ [All] [team-alpha]    │                                  │
│ [team-beta] [critical]│ Branch:    [master        ]      │
│                       │ GIT_TAG:   [123           ]      │
│ ☑ GENERATE-svc-alpha  │ RELEASE_ID:[321           ]      │
│ ☆ GENERATE-svc-beta   │ ☑ image                         │
│ ☑ GENERATE-svc-gamma  │ ☐ CONFIG-PILOT (staging only)   │
│ ★ GENERATE-svc-payment│ ☐ CONFIG-PROD  (prod only)      │
│ ★ GENERATE-svc-auth   │ UAT oleh:  [UAT GSIT      ]     │
│ … (12 projects)       │ Tanggal:   [11-11-1111    ]     │
│                       │                                  │
│ 12 selected / 12 total│ 🚀 Build 12 Projects             │
│ [Select All] [Desel.] │                                  │
├──────────────────────┴──────────────────────────────────┤
│ Zone 3: Build History (collapsible)                      │
│ ▾ Build History (12)                          [Clear]    │
│ ✓ GENERATE-svc-gateway · GENERATE-svc-payment · …       │
│ ✓ GENERATE-svc-ingest  · GENERATE-svc-payment · …       │
└─────────────────────────────────────────────────────────┘
```

### Core Concepts

**Project-first, not job-first.** Select the projects you want to build (multi-select with group tags), configure parameters once, then batch-trigger across all selected.

**Presets.** Save any parameter configuration as a named preset. Load it with one click for future build cycles. Presets are job-aware — loading a preset for a different job applies only matching parameters.

**Smart Defaults.** After a build, parameter values are remembered per-project. Selecting that project again auto-loads the last-used parameters.

**Group Tags.** Freeform tags (team names, environments, criticality) for organizing 100+ projects. Tags are filter chips in the project list and persist in localStorage.

**Build History.** Every triggered build is logged with timestamp, status, parameters, and result URL. History drawer slides up from the bottom, capped at 200 entries.

### Demo Mode

When zero servers are configured (or `demo-server` is active), 12 `GENERATE-svc-*` projects are seeded with real GENERATE job parameters. Builds simulate success. Demo mode self-deactivates as soon as a real Jenkins server is added.

### Adding a Real Server

1. Click **Servers** → **Add Server**
2. Enter label and URL (e.g. `https://jenkins.example.com`)
3. Click **Test Connection** — verifies connectivity and shows job count
4. Optionally set a **Default Job** to pre-select on server switch
5. Close — the project list loads from the Jenkins API

### Services

| Service | File | Purpose |
|---|---|---|
| `JenkinsService` | `shared/service/jenkins/jenkins.service.ts` | REST API: crumb, jobs, params, build triggers |
| `ProjectRegistryService` | `shared/service/jenkins/project-registry.service.ts` | Project catalog, multi-select, groups, param memory |
| `PresetService` | `shared/service/jenkins/preset.service.ts` | Save/load/delete named parameter presets |
| `BuildHistoryService` | `shared/service/jenkins/build-history.service.ts` | FIFO-capped audit trail |

### localStorage Keys

| Key | Purpose |
|---|---|
| `jenkins-servers` | Server list |
| `jenkins-active-server` | Active server ID |
| `jenkins-favs-{serverId}` | Favorite jobs per server |
| `jenkins-project-groups:{serverId}` | Group tags per project |
| `jenkins-project-lastparams:{serverId}` | Per-project last build params |
| `jenkins-presets` | Named parameter presets |
| `jenkins-build-history` | Build audit trail |
| `jenkins-default-jobs` | Per-server default job |

---

## Other Dev Tools

| Tool | Route | Purpose |
|---|---|---|
| GitLab Tools | `/tools-dev/gitlab` | Bulk tag creation, MR management, branch operations |
| GSLB | `/tools-dev/gslb` | DNS-based load balancer monitoring and suspension |
| SSL Check | `/tools-dev/ssl-check` | Certificate expiration checker |
| Batch Runner | `/tools-dev/batch-runner` | UAT batch processing |
| File Server Manager | `/tools-dev/file-server-manager` | MinIO/S3 file operations |
| Push Notif FCM | `/tools-dev/push-notif-fcm` | Firebase Cloud Messaging push |
| Publish Kafka | `/tools-dev/publish-kafka` | Kafka message publishing |
| Crypto | `/tools-dev/crypto` | Encrypt/decrypt utilities |
| Check Data | `/tools-dev/check-data` | Data validation lookup |
| Delete Data | `/tools-dev/delete-data` | Data deletion tools |

---

## Project Structure

```
angular/src/app/
├── core/service/          # App-wide services (theme, catalog, auth)
├── shared/
│   ├── component/         # Reusable UI components
│   └── service/jenkins/   # Jenkins API + orchestration services
├── pages/
│   ├── home/              # Dashboard
│   ├── toolbox/           # 30+ utility tools
│   ├── tools-dev/         # Dev-specific tools (Jenkins, GitLab, GSLB, etc.)
│   └── piket/             # On-call shift tools
```

## Environment

- Angular 17 (standalone components, signals, new control flow)
- Material Design 3 (M3) theming with light/dark mode
- CSS custom properties (`--msv-*` tokens) for consistent design system
