# GitLab Tools — UI/UX Redesign Plan v2

> Updated based on user requirements: connect gate simplified, dashboard for 100+ projects, tag management per-project, bulk limited to tag + MR only.

## Current State

| Aspect | Now | Problem |
|---|---|---|
| Architecture | Single monolith `GitlabComponent` (1017 TS / 1432 HTML / 1137 CSS) | Unmaintainable |
| Connect | Token + name + URL form with "Save account" flow | Over-engineered for single-GitLab use |
| Tags Monitor | Flat table of all projects with tag history | 100+ projects = endless scroll, no search/filter |
| Bulk Actions | 9 actions crammed into one scrollable wizard | Most actions unused, overwhelming UI |
| Dashboard | None — user lands on Tags tab | No overview, no project navigation |

## Requirements (from user)

1. **Connect**: Just the token. URL is hardcoded backend-side. No name, no URL field, no saved accounts.
2. **Dashboard**: Must handle 100+ projects per group. Fast scan, fast search, visual grouping.
3. **Tags**: Show last tag for each project. Add new tags to individual projects from the same view.
4. **Bulk**: Tag creation + MR creation only. Drop: branch, close MR, labels, protect, unprotect, pipeline, release, chain templates.

## Component Architecture

```
GitlabComponent (shell, 60 lines)
├─ ConnectComponent         token-only gate + modal
├─ DashboardComponent       project browser for 100+ items  ← NEW
├─ TagsComponent            last-tag viewer + per-project tag creation
├─ BulkComponent            2-action stepper (Tag + MR)
└─ ActivityComponent        collapsible log panel
```

## Screen 1: Connect Gate

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              🦊  GitLab Tools                       │
│                                                    │
│     Connect to access your projects                 │
│                                                    │
│     ┌──────────────────────────────────────┐       │
│     │ glpat-xxxxxxxxxxxxxxxxxxxxxx    [👁] │       │
│     └──────────────────────────────────────┘       │
│                                                    │
│              [ 🔑  Connect  ]                       │
│                                                    │
│     Token stays in memory. Never persisted.         │
│     Create one at: GitLab → Settings → Access Tokens│
│                                                    │
└──────────────────────────────────────────────────┘
```

- Only one input: token (password field with show/hide toggle)
- URL hardcoded in `GitLabService` → no input needed
- "Connect" button validates with a test API call
- Error state: "Invalid token — check api scope" inline message
- No save accounts, no multiple accounts — one session, one token

## Screen 2: Dashboard (100+ projects)

The hard problem. 100+ projects in one view. Solution: search-first with visual grouping.

```
┌──────────────────────────────────────────────────┐
│ 🦊 GitLab Tools     [Group: MSV ▼]  [📋] [🚪]   │
├──────────────────────────────────────────────────┤
│ 🔍 Search projects...                     [🔄]    │
├──────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────┐ │
│ │  97  │ │  72% │ │  25  │ │  Synced 5m ago   │ │
│ │Projects│ │Tagged│ │Untag.│ │                  │ │
│ └──────┘ └──────┘ └──────┘ └──────────────────┘ │
│                                                    │
│ ┌─── QUICK ACTIONS ─────────────────────────────┐ │
│ │ [📋 Tag Manager]                   [⚡ Bulk]  │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Filter: [All ▾] [Tagged ▾] [Untagged ▾] [Recent ▾] │
│                                                    │
│ Project                           Last Tag    Age  │
│ ──────────────────────────────────────────────── │
│ 🔍 ms-                                ← filtered │
│                                                    │
│ ms-acquirer                      v2.14.3     1d   │
│ ms-payment                       v1.8.0      12d ⚠│
│ ms-gateway                       —            —    │
│ ms-auth-service                  v3.1.0      3d   │
│ ms-notification                  v2.0.5      7d   │
│ ms-settlement                    —            —    │
│ ms-reconciliation                v1.5.2      30d 🔴│
│ ... 90 more items ...                              │
│                                                    │
│          [Load 20 more]  (97 of 97 shown)          │
└──────────────────────────────────────────────────┘
```

### How it handles 100+ projects

| Feature | Implementation |
|---|---|
| Search | Debounced text search across project name + namespace. Results show as you type. Filtered view updates instantly. |
| Filter chips | `[All]` `[Tagged]` `[Untagged]` `[Recent]` — toggle between filtered views |
| Tag age color | Green (≤7d) / Orange (8-30d) / Red (>30d) / Gray (no tag) |
| Pagination | "Load 20 more" button at bottom. Default shows first 30. |
| Visual grouping | Projects with no tags get a subtle highlight row (gray background). Recently tagged projects (≤24h) get a green dot. |
| Sort | Click column headers: name, last tag date, tag age |
| Empty state | If filter yields 0: "No projects match 'ms-xyz'. [Clear filter]" |

## Screen 3: Tag Manager (per-project)

User selects one or more projects from dashboard → opens Tag Manager.

```
┌──────────────────────────────────────────────────┐
│ ← Dashboard    Tag Manager                        │
├──────────────────────────────────────────────────┤
│                                                    │
│ [ms-acquirer] [ms-payment] [+ add project]  (3)   │
│                                                    │
├──────────────────────────────────────────────────┤
│ ms-acquirer                         [🏷 Add Tag]  │
│ ───────────────────────────────────────────────── │
│ Current: v2.14.3  ·  dgruzd  ·  2026-07-11       │
│                                                    │
│ ┌─ Tag History ─────────────────────────────────┐ │
│ │ v2.14.3    dgruzd     2026-07-11    release   │ │
│ │ v2.14.2    dgruzd     2026-07-08              │ │
│ │ v2.14.1    dgruzd     2026-07-05              │ │
│ └───────────────────────────────────────────────┘ │
│                                                    │
│ ───────────────────────────────────────────────── │
│ ms-payment                          [🏷 Add Tag]  │
│ ───────────────────────────────────────────────── │
│ Current: v1.8.0  ·  dgruzd  ·  2026-06-30  ⚠️     │
│                                                    │
│ ┌─ Tag History ─────────────────────── [Load 5] ┐ │
│ │ v1.8.0     dgruzd     2026-06-30              │ │
│ └───────────────────────────────────────────────┘ │
│                                                    │
│ ⚠ ms-payment hasn't been tagged in 12 days        │
│                                                    │
│ ───────────────────────────────────────────────── │
│ ms-gateway                          [🏷 Add Tag]  │
│ ───────────────────────────────────────────────── │
│ No tags yet. [Create first tag →]                 │
│                                                    │
├──────────────────────────────────────────────────┤
│ [Add tag to ALL 3 projects...]                     │
└──────────────────────────────────────────────────┘
```

### Add Tag modal (opens per-project or bulk)
```
┌──────────────────────────────┐
│ Add Tag — ms-acquirer        │
│                                │
│ Tag name: [          v2.14.4] │
│ Branch:   [main ▾]            │
│ Message:  [Release v2.14.4]  │
│                                │
│     [Cancel]   [Create Tag]   │
└──────────────────────────────┘
```

### Key interactions
- **Add Tag per-project**: Click `[🏷 Add Tag]` next to any project → modal with tag name + branch + message
- **Bulk tag button**: At bottom: "Add tag to ALL 3 projects..." opens Bulk view with tag pre-selected
- **Project chips at top**: Remove projects by clicking × on chip. Add more via `[+ add project]` search dropdown
- **Tag history**: Expandable, shows last 5 tags, "Load 5 more"
- **Stale warning**: Orange highlight when last tag >7 days old, red >30 days
- **No-tag state**: "No tags yet. [Create first tag →]" CTA

## Screen 4: Bulk Actions (Tag + MR only)

```
┌──────────────────────────────────────────────────┐
│ ← Dashboard    Bulk Actions                       │
├──────────────────────────────────────────────────┤
│                                                    │
│ What do you want to do?                            │
│                                                    │
│ ┌─────────────────┐  ┌─────────────────┐           │
│ │ 🏷              │  │ 🔀               │           │
│ │ Create Tags     │  │ Create Merge     │           │
│ │                 │  │ Requests         │           │
│ │ Create tags on  │  │ Create MRs from  │           │
│ │ multiple        │  │ source → target  │           │
│ │ projects        │  │ across projects  │           │
│ │                 │  │                  │           │
│ │ [Select →]      │  │ [Select →]       │           │
│ └─────────────────┘  └─────────────────┘           │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Create Tags flow (3 steps)
```
Step 1: Tag details
┌──────────────────────────────────┐
│ Tag name:    [v2.15.0          ] │
│ Branch ref:  [main ▾]           │
│ Message:     [Release v2.15.0  ] │
│                    [Next: Select projects →] │
└──────────────────────────────────┘

Step 2: Select projects
┌──────────────────────────────────┐
│ 🔍 Filter projects...            │
│                                    │
│ [Select All] [Select Tagged]      │
│                                    │
│ ☑ ms-acquirer     v2.14.3  1d    │
│ ☑ ms-payment      v1.8.0   12d   │
│ ☐ ms-gateway      —         —    │
│ ☑ ms-auth-service v3.1.0   3d    │
│ ... 12 selected / 97 total ...    │
│                                    │
│         [← Back]  [Preview →]     │
└──────────────────────────────────┘

Step 3: Preview + Execute
┌──────────────────────────────────┐
│ Creating tag "v2.15.0" on main   │
│                                    │
│ ✅ 10 projects ready              │
│ ⚠️ 2 projects: tag already exists │
│                                    │
│          [🚀 Execute on 10]       │
│                                    │
│ ── Results ────────────────────── │
│ ms-acquirer     ✅ Created        │
│ ms-payment      ✅ Created        │
│ ms-auth-service ✅ Created        │
│ ms-gateway      ⚠️ Skipped (exists)│
│ ... 10/10 complete ...            │
└──────────────────────────────────┘
```

### Create MRs flow (4 steps)
```
Step 1: Branch config
┌──────────────────────────────────┐
│ Source branch: [feature/x ▾]     │
│ Target branch: [main ▾]          │
│                                    │
│ MR title template:                │
│ [Release {source} → {target}    ]│
│                                    │
│ [ ] Remove source branch on merge │
│ [ ] Squash commits                │
│              [Next: Select →]     │
└──────────────────────────────────┘

Step 2: Select projects
(same project picker as tags — checkboxes + search)

Step 3: Configure per-project (optional)
┌──────────────────────────────────┐
│ Customize MR details:             │
│                                    │
│ ms-acquirer                       │
│   Title: [v2.15.0 → main        ]│
│   Assignee: [dgruzd ▾]           │
│   Labels: [release] [uat]        │
│                                    │
│ ms-payment                        │
│   (using defaults)                │
│                                    │
│       [← Back]   [Preview →]     │
└──────────────────────────────────┘

Step 4: Preview + Execute
(same pattern as tags — dry run then live results)
```

## Implementation Plan

| Phase | What | Lines |
|---|---|---|
| 1 | Create `connect.component.ts` — token-only gate, inline validation | ~80 |
| 2 | Create `dashboard.component.ts` — search, filter chips, KPIs, virtual scroll or paginated table | ~200 |
| 3 | Create `tags.component.ts` — per-project tag viewer + add-tag modal + project chips | ~250 |
| 4 | Create `bulk.component.ts` — 2-action picker + tag stepper + MR stepper + preview/execute | ~350 |
| 5 | Create `activity.component.ts` — collapsible log panel | ~60 |
| 6 | Refactor `gitlab.component.ts` → thin shell that routes between views | ~60 |
| 7 | Wire routing: `/tools-dev/gitlab` → shell, child routes for dashboard/tags/bulk | ~30 |
| 8 | Style everything with `--msv-*` tokens, skeleton loaders, transitions, a11y | ~400 CSS |
| 9 | Build + test + commit + tag | — |
| **Total** | | **~1430 lines** (down from 3600, well-structured) |

## Questions to confirm

1. ~~Connect: token only, URL hardcoded?~~ ✅ Confirmed
2. ~~Dashboard: search + filters + pagination for 100+ projects?~~ ✅ Confirmed
3. ~~Tags: last tag per selected project + add tag?~~ ✅ Confirmed
4. ~~Bulk: tag + MR only?~~ ✅ Confirmed
5. Per-project assignee/label selection for MRs — needed or skip for now?
6. Start building now?
