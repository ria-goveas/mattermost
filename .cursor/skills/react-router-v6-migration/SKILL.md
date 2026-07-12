---
name: react-router-v6-migration
description: >-
  Overview and conventions for the in-progress React Router v5 -> v6 migration
  in the Mattermost webapp (webapp/channels). Explains current status, the
  incremental migration strategy, compatibility landmines (plugin
  window.ReactRouterDom external, the custom browser_history desktop shim, Jest
  router mocks), and how to delegate planning or implementation work to subagents.
  Use when touching routing code under webapp/, adding or changing routes,
  migrating a component off react-router v5 APIs, planning or prioritizing
  migration tickets (including Linear), producing migration briefings with mermaid
  diagrams, or when the user mentions react-router, v6, Switch/Routes,
  useHistory/useNavigate, or the router migration.
---

# React Router v5 -> v6 migration (Mattermost webapp)

Mattermost's web client (`webapp/channels`) is migrating from **React Router v5**
to **v6**. This skill is the entry point; three companion skills hold the
per-area rules:

- **[react-router-navigation](../react-router-navigation/SKILL.md)** — programmatic navigation (`getHistory()` / `useHistory()` -> `useNavigate()`).
- **[react-router-routes](../react-router-routes/SKILL.md)** — route trees (`Switch` / `<Route component>` -> `Routes` / `element`, `Redirect` -> `Navigate`).
- **[react-router-hooks-params](../react-router-hooks-params/SKILL.md)** — reading routing state (`withRouter` / `RouteComponentProps` -> hooks; `useRouteMatch` -> `useMatch`).

## Current status (source of truth: the code)

- Declared version: `react-router-dom@5.3.4`, `history@4.10.1` in `webapp/channels/package.json`.
- The app boots a **custom `<Router>`** (not `<BrowserRouter>`) with a shared
  history instance in `webapp/channels/src/components/app.tsx`.
- Routing is a set of nested `<Switch>` trees starting at
  `webapp/channels/src/components/root/root.tsx`.
- Navigation is split between `getHistory()` (Redux actions / non-React code) and
  the `useHistory()` hook (components) — this split is explicitly flagged as a
  cleanup target in `webapp/STYLE_GUIDE.md`.

Treat any v6 API you add as **net-new**: the bulk of the tree is still v5, so do
not assume v6 primitives already exist app-wide.

## Migration strategy

1. **Migrate leaf-first.** Convert self-contained components and their tests
   before shared route wrappers. Do not rewrite `app.tsx` / `root.tsx` in a
   drive-by change.
2. **One concern per PR.** Keep navigation, route-definition, and params/HOC
   changes in separate commits/PRs so reviews stay small and reversible.
3. **Keep the shared history working.** The desktop app depends on the custom
   push behavior in `browser_history.tsx` (see landmines). Route it through the
   existing helper rather than calling `history` directly.
4. **Update the test harness with the code.** Components migrated to v6 hooks
   must be rendered under a v6 router in tests (see landmines).
5. **Don't break plugins.** The plugin SDK re-exports the app's react-router; a
   version bump is an API change for every plugin (see landmines).

## Compatibility landmines (read before large changes)

### 1. Plugins consume our react-router as a webpack external
`react-router-dom` is exposed to plugins as `window.ReactRouterDom`:

```129:129:webapp/channels/src/plugins/export.ts
window.ReactRouterDom = require('react-router-dom');
```

```15:15:webapp/platform/shared/build/webpack-web-app-externals.cjs
    'react-router-dom': 'ReactRouterDom',
```

Bumping the major version changes the API surface plugins compile against.
Coordinate the actual `package.json` bump separately from component migrations,
and call it out as a breaking change in the release note.

### 2. Custom `browser_history` desktop shim
`getHistory()` returns a wrapped history whose `push` is overridden for the
desktop app:

```35:37:webapp/channels/src/utils/browser_history.tsx
export function getHistory() {
    return getModule<History>('utils/browser_history') ?? browserHistory;
}
```

In v6 the top-level router no longer takes a `history` prop the same way. Any
migration of `app.tsx` must preserve this desktop push override; don't drop it.

### 3. Jest router mocks and the render helper
Tests rely on a global `useHistory` mock (`webapp/channels/src/tests/react-router-dom_mock.ts`)
and on `renderWithContext` wrapping components in a router. When you migrate a
component to `useNavigate`, update its tests to the v6 equivalents rather than
leaving them on the `useHistory` mock.

## Quick reference

| Concern | v5 (old) | v6 (new) | Skill |
|---------|----------|----------|-------|
| Navigate in code | `getHistory().push(x)` / `useHistory()` | `useNavigate()` | [navigation](../react-router-navigation/SKILL.md) |
| Route tree | `<Switch>` + `<Route component/render>` | `<Routes>` + `<Route element>` | [routes](../react-router-routes/SKILL.md) |
| Redirect | `<Redirect to>` | `<Navigate to replace>` | [routes](../react-router-routes/SKILL.md) |
| Inject router props | `withRouter` / `RouteComponentProps` | `useNavigate` / `useParams` / `useLocation` | [hooks-params](../react-router-hooks-params/SKILL.md) |
| Match current URL | `useRouteMatch()` | `useMatch()` | [hooks-params](../react-router-hooks-params/SKILL.md) |

## Out of scope

- Bumping the `react-router-dom` dependency itself (do that as its own coordinated PR).
- Server-side Go routing.
- Rewriting `app.tsx` / `root.tsx` as part of an unrelated feature change.

## Agent delegation

When the user asks for a migration **briefing**, **audit**, **ticket prioritization**,
or **implementation** on a specific ticket, follow this split. Do not put codebase
exploration, Linear lookups, and synthesis in a single subagent.

### Who does what

| Work | Agent | Notes |
|------|-------|-------|
| Read this skill + companion skills | **Parent** | Canonical constraints; load before delegating |
| Count v5 APIs, hotspots, landmines | **`explore`** (`readonly: true`) | Scope: `webapp/channels` only |
| Pull Linear tickets + relations | **Parent** (Linear MCP) | `assignee=me`, search `react router` / `router migration`; `get_issue` with `includeRelations: true` for sequencing tickets |
| Mermaid diagrams + priority order | **Parent** | Needs both codebase report and ticket metadata |
| Spike / design tickets | **`generalPurpose`** or **`best-of-n-runner`** | Design doc only; no drive-by rewrites |
| Leaf or route-tree code migrations | **`generalPurpose`** | One ticket, one concern; attach the matching companion skill |

Do **not** delegate Linear queries or final mermaid synthesis to subagents.

### Briefing workflow (planning only — no code changes)

**Wave 1 — parallel**

1. Parent reads this skill and companion skills.
2. Launch **`explore`** (readonly) with the audit prompt below.
3. Parent queries Linear in parallel (`list_issues` with varied queries; dedupe results).

**Wave 2 — parent only**

1. Merge explore report + Linear issues.
2. Produce 2–3 mermaid diagrams: current v5 architecture, landmines vs safe workstreams, ticket priority DAG.
3. Output recommended waves with rationale and "what not to start with" (see Migration strategy above).

**Explore subagent prompt** (copy and adapt):

```text
Audit React Router v5→v6 migration status in webapp/channels under
/Users/ria/Documents/cursor/mattermost.

Count remaining v5 usage: useHistory, getHistory().push, withRouter,
RouteComponentProps, Switch, Redirect, Route component=, useRouteMatch.
Check for any v6 APIs already present (useNavigate, Routes, Navigate, useMatch).

Identify landmines: window.ReactRouterDom (plugins/export.ts), browser_history
desktop shim, Jest react-router-dom_mock.ts and renderWithContext.

Return structured report:
## Done vs remaining
## Counts table (pattern → ~files)
## Hotspot directories
## Landmines (file paths)
## Suggested leaf-first migration sequence

Read-only. Do not modify files.
```

**Briefing deliverables**

- Summary of current state (deps, bootstrap files, v5 surface area).
- Mermaid: today (v5) → target (v6) incremental path.
- Mermaid: landmines vs parallel workstreams vs do-last items.
- Linear ticket table + recommended priority waves.
- Optional: suggest Linear `blockedBy` relations (e.g. test harness before leaf migrations; wrapper design before route-tree rewrites).

### Implementation delegation (by work type)

| Work type | Subagent | Scope guardrails |
|-----------|----------|------------------|
| Audit write-up (RIA-17-style) | Parent or short **`explore`** | Inventory only; no code |
| Plugin / desktop history spikes | **`generalPurpose`** | Spike doc; no `app.tsx` / `root.tsx` rewrite |
| Test harness (v6 Jest helpers) | **`generalPurpose`** | Tests only under `webapp/channels/src/tests/` |
| `useHistory` → `useNavigate` leaves | **`generalPurpose`** | Named leaf files only; no Redux `getHistory()` in same PR |
| `withRouter` removal | **`generalPurpose`** | Barrel exports only; keep Redux `connect` |
| Public auth `Switch` → `Routes` | **`generalPurpose`** | Contained subtree only; requires prior wrapper/Outlet design |
| Package bump plan | **Parent** | After landmine spikes + sufficient leaf progress |

Attach the relevant companion skill to implementation subagents:
navigation work → [react-router-navigation](../react-router-navigation/SKILL.md);
route trees → [react-router-routes](../react-router-routes/SKILL.md);
params/HOCs → [react-router-hooks-params](../react-router-hooks-params/SKILL.md).

### Parallel explore agents (optional)

Only when scopes do not overlap:

- Agent A: navigation (`useHistory`, `getHistory().push`)
- Agent B: route definitions (`Switch`, wrappers like `LoggedInRoute`, `HFRoute`)

Otherwise use one explore agent for the full audit.
