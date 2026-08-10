---
name: solve-ticket
description: >-
  Solve a Mattermost React Router migration ticket the way I usually would:
  fetch the issue, restate AC, load the matching companion migration skill from
  the ticket content, implement narrowly, and verify with focused Jest. Invoke
  with "solve ticket", "/solve-ticket", "/solve ticket RIA-21", a ticket id, or
  a title. Use for React Router migration ticket implementation — not general
  bugs or planning-only briefings.
disable-model-invocation: true
---

# Solve a React Router migration ticket

When I say **`/solve ticket <id|title>`**, **`solve ticket …`**, or
**`/solve-ticket`**, implement that one ticket end-to-end. This is how I want
router-migration work done in `webapp/channels` — not a catalog of every open
issue.

Migration overview (status, landmines, companions):
[react-router-v6-migration](../react-router-v6-migration/SKILL.md).

## Workflow

### 1. Fetch the ticket

Parse the id or title from the invoke (e.g. `RIA-21`, or
`Add test support for v6 router hooks`).

- **Linear `RIA-*`:** `get_issue` with `includeRelations: true`.
- **Title only:** `list_issues` on project **Mattermost React Router v6 Migration
  Demo**, match by title.
- **Jira key:** fetch it the same way, then work from title + AC.

If nothing is specified, default to **RIA-21** (test harness — usually the
right next leaf-enabler).

Restate acceptance criteria, blockers, and related issues in a short paragraph
before editing. If the ticket is clearly blocked and the blocker is unfinished,
stop and say so unless I override.

### 2. Load the right companion skill

Read the ticket. Pick the companion from what it is actually about — do not
look up a ticket-id matrix:

| Ticket is about… | Load |
|------------------|------|
| `useHistory` / `useNavigate` / programmatic navigation | [react-router-navigation](../react-router-navigation/SKILL.md) |
| `Switch` / `Routes` / `Redirect` / `Navigate` / layouts | [react-router-routes](../react-router-routes/SKILL.md) |
| `withRouter` / `useRouteMatch` / `useMatch` / params | [react-router-hooks-params](../react-router-hooks-params/SKILL.md) |
| Test harness, mocks, spikes, audits, package plan | [react-router-v6-migration](../react-router-v6-migration/SKILL.md) only |

### 3. Constraints (keep these tight)

- **Leaf-first** — no drive-by rewrites of `app.tsx` / `root.tsx`.
- **One concern** — navigation, route trees, and HOC/params stay in separate PRs.
- **No package bump** of `react-router-dom` / `history` unless the ticket is
  explicitly the upgrade plan/execution.
- **Desktop history** — leave the push override in
  `utils/browser_history.tsx` intact.
- **Plugins** — keep `window.ReactRouterDom` / webpack externals until a
  dedicated plugin-impact + bump ticket says otherwise.
- Scope = AC only. No unrelated lint or refactors.

### 4. Implement

Explore only the files the ticket implies. Make the smallest change that meets
every acceptance criterion. Update tests in the same change when the code path
moves to v6 hooks.

### 5. Verify

Run the narrowest Jest targets under `webapp/channels` for what you touched.
Confirm the diff stayed inside AC.

### 6. Summarize

Tell me: ticket id, what changed, which companion skill you followed, what
tests ran. Do **not** mark Linear Done unless I ask.

---

## Worked example: test harness / v6 hooks support (RIA-21)

When the ticket is about **adding test support for v6 router hooks** (RIA-21 or
equivalent title), this is the shape of the work I expect.

**Goal:** keep existing v5 tests green, and let new tests exercise `useNavigate`,
`useParams`, `useLocation`, and `useMatch`.

**Touch:**

1. **`webapp/channels/src/tests/react-router-dom_mock.ts`**  
   Keep `useHistory` → `historyMock`. Add an optional `useNavigate` mock:
   `navigate(to)` → `historyMock.push`, `navigate(to, {replace: true})` →
   `replace`, `navigate(-1)` → `goBack`.

2. **`webapp/channels/src/tests/react_testing_utils.tsx`**  
   Extend `renderWithContext` with `routerVersion: 'v5' | 'v6'` (default
   `'v5'`). The v5 path stays `<Router history={…}>`. The v6 path should be the
   lightest local wrapper that provides v6 hooks **without** bumping the app
   dependency (MemoryRouter / Routes shim or a small dual-mode helper).

3. **One example test**  
   Migrate or add a small test that uses the v6 path so the pattern is
   demonstrated (a leaf that will move later, or an existing controller test).

**Done when:**

- Preferred helper pattern is documented (comment near `renderWithContext` or
  the PR description).
- Default `renderWithContext` still passes existing v5 suites.
- At least one test shows the v6 hook path.
- No `package.json` react-router bump.

**Verify roughly like:**

```bash
cd webapp/channels && npm test -- --testPathPattern=react_testing_utils
# plus the example test file you touched
```

For other migration tickets, apply the same workflow: fetch → AC → companion
skill from content → narrow implement → focused Jest → summarize. Use the
migration overview skill for landmines when you need broader context.
