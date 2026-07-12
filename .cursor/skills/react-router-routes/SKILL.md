---
name: react-router-routes
description: >-
  Conventions for defining routes in the Mattermost webapp during the React
  Router v5 -> v6 migration. Covers migrating Switch to Routes, <Route component>
  / <Route render> to <Route element>, nested routes, Redirect to Navigate, and
  the existing route-wrapper components (LoggedInRoute, HFRoute, HFTRoute). Use
  when adding, removing, or restructuring routes under webapp/, or when the user
  mentions Switch, Routes, Route element, Redirect, Navigate, or route wrappers.
---

# React Router route-definition conventions (v5 -> v6)

Part of the [react-router-v6-migration](../react-router-v6-migration/SKILL.md)
effort. This skill covers **how routes are declared**. Navigation and params are
in the sibling skills.

## Current state

Routing is nested `<Switch>` trees, starting at
`webapp/channels/src/components/root/root.tsx`, with reusable wrapper components
for cross-cutting concerns:

| Wrapper | Path | Purpose |
|---------|------|---------|
| `LoggedInRoute` | `webapp/channels/src/components/logged_in_route/index.tsx` | auth + onboarding guard |
| `HFRoute` | `webapp/channels/src/components/header_footer_route/header_footer_route.tsx` | public header/footer layout |
| `HFTRoute` / `LoggedInHFTRoute` | `webapp/channels/src/components/header_footer_template_route.tsx` | template layout (+ optional guard) |

Shared path patterns live in `webapp/channels/src/utils/path.ts`
(`ID_PATH_PATTERN`, `TEAM_NAME_PATH_PATTERN`, `IDENTIFIER_PATH_PATTERN`). Reuse
these constants; don't hand-write the same regex.

## Rules

### `Switch` -> `Routes`, `component`/`render` -> `element`

```tsx
// v5 (old)
<Switch>
    <Route path='/error' component={ErrorPage}/>
    <Route path='/login' render={(props) => <Login {...props}/>}/>
</Switch>

// v6 (new)
<Routes>
    <Route path='/error' element={<ErrorPage/>}/>
    <Route path='/login' element={<Login/>}/>
</Routes>
```

Key differences to apply:

- `element` takes a **rendered element** (`<Comp/>`), not a component type or a
  render function.
- v6 matches by **best match**, not source order, and paths are **relative** by
  default. Drop `exact` — it no longer exists (v6 is exact by default; use `/*`
  to match sub-paths).
- Route params inside `element` are read via hooks (`useParams`), since there are
  no injected `props`. See [react-router-hooks-params](../react-router-hooks-params/SKILL.md).

### `Redirect` -> `Navigate`

```tsx
// v5 (old)
<Redirect to='/login'/>

// v6 (new)
<Navigate to='/login' replace/>
```

Use `replace` for default/fallback redirects so they don't add history entries.
Outside of the element tree (e.g. in an action) navigate imperatively instead —
see [react-router-navigation](../react-router-navigation/SKILL.md).

### Route wrappers: migrate the wrapper, keep the call sites tidy
The wrappers currently use `<Route render={...}>` to inject layout/guards:

```19:34:webapp/channels/src/components/logged_in_route/index.tsx
export default function LoggedInRoute(props: Props) {
    const {component: Component, ...rest} = props;

    return (
        <Route
            {...rest}
            render={(routeProps) => (
                <LoggedIn {...routeProps}>
                    <OnBoardingTaskList/>
                    <CloudPreviewModalController/>
                    <Component {...(routeProps)}/>
                </LoggedIn>
            )}
        />
    );
}
```

In v6, prefer expressing cross-cutting layout/guards as **layout routes** (a
parent `<Route element={<Guard/>}>` whose child renders `<Outlet/>`) instead of a
render-prop wrapper. Migrate one wrapper + its whole subtree together so the
`<Switch>`/`<Routes>` boundary stays consistent.

### Nesting and `Outlet`
When a parent route renders child routes, render `<Outlet/>` where children
should appear, and define children as nested `<Route>` elements. Don't nest a
separate `<Routes>` inside another unless you intentionally want an isolated
match tree.

## Migration checklist (per route subtree)

- [ ] Convert the whole `<Switch>` to `<Routes>` in one change (don't leave a
      `<Switch>` with `element` routes inside).
- [ ] Replace every `component=`/`render=` with `element={<Comp/>}`.
- [ ] Remove `exact`; add `/*` where a route must match sub-paths.
- [ ] Replace `<Redirect>` with `<Navigate ... replace/>`.
- [ ] Reuse path constants from `utils/path.ts`.
- [ ] Update route-wrapper usages to layout routes + `<Outlet/>` where applicable.
- [ ] Run the affected component tests.

## Anti-patterns

- Don't mix `<Switch>` and `<Routes>` in the same subtree.
- Don't pass a component type to `element` (`element={Comp}`); pass `<Comp/>`.
- Don't keep `exact` — it's a no-op / error in v6.
