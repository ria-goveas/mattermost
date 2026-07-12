---
name: react-router-hooks-params
description: >-
  Conventions for reading routing state in the Mattermost webapp during the
  React Router v5 -> v6 migration. Covers replacing the withRouter HOC and
  RouteComponentProps typing with hooks, and migrating useRouteMatch/matchPath to
  useMatch. Use when a component reads route params, match, or location, uses
  withRouter or RouteComponentProps, or when the user mentions useParams,
  useRouteMatch, useMatch, useLocation, withRouter, or RouteComponentProps.
---

# React Router hooks & params conventions (v5 -> v6)

Part of the [react-router-v6-migration](../react-router-v6-migration/SKILL.md)
effort. This skill covers **reading routing state** (params, match, location) and
retiring the `withRouter` HOC. Navigation and route definitions are in the
sibling skills.

## Current state

Three v5 patterns for reading routing state coexist:

- `withRouter` HOC + `RouteComponentProps` (class components / connect wrappers, ~13/27 files).
- `useParams()` / `useLocation()` hooks (newer function components).
- `useRouteMatch()` and `matchPath()` for active-link detection and URL matching.

v6 removes `withRouter`, `RouteComponentProps`, and `useRouteMatch`. Everything
becomes a hook.

## Rules

### Retire `withRouter` / `RouteComponentProps` -> hooks
Function components should read routing state via hooks instead of injected props.

```tsx
// v5 (old)
import {withRouter} from 'react-router-dom';
import type {RouteComponentProps} from 'react-router-dom';

type Props = RouteComponentProps<{team: string}>;
function MyComp({match, history, location}: Props) {
    const team = match.params.team;
    // ...
}
export default withRouter(MyComp);

// v6 (new)
import {useParams, useNavigate, useLocation} from 'react-router-dom';

function MyComp() {
    const {team} = useParams<{team: string}>();
    const navigate = useNavigate();
    const location = useLocation();
    // ...
}
export default MyComp;
```

- `match.params` -> `useParams()`
- `history` -> `useNavigate()` (see [react-router-navigation](../react-router-navigation/SKILL.md))
- `location` -> `useLocation()`

### `connect` + `withRouter` wrappers
Many `index.ts` files do `export default withRouter(connector(Comp))`. When
migrating:

- If the component only needs params/location/navigation, drop `withRouter` and
  read them with hooks **inside** the component.
- Keep `connect` for Redux; only the `withRouter` layer goes away.
- If a Redux `mapStateToProps` needs `ownProps.match`, move that derivation into
  the component (read `useParams()` and select from the store with `useSelector`),
  since v6 won't inject `match`.

### Class components
Hooks can't be used in class components. Options, in order of preference:

1. Convert the class to a function component, then use hooks.
2. If conversion is too large for this change, wrap it in a small function
   component that reads the hooks and passes them as props.

Don't reintroduce a `withRouter` shim.

### `useRouteMatch` / `matchPath` -> `useMatch`
For active-link detection (e.g. NavLink styling):

```tsx
// v5 (old)
import {useRouteMatch} from 'react-router-dom';
const match = useRouteMatch('/:team/drafts');

// v6 (new)
import {useMatch} from 'react-router-dom';
const match = useMatch('/:team/drafts');
```

`useMatch` takes a path pattern and returns the match or `null`. For matching a
URL string outside of render, `matchPath(pattern, pathname)` still exists in v6
but its **argument order/shape changed** — verify the signature when you migrate
each call. Reuse patterns from `webapp/channels/src/utils/path.ts`.

### `NavLink` active state
v6 `NavLink` provides `isActive` via a render/className callback, so many
`useRouteMatch`-for-styling cases can be dropped in favor of `NavLink`'s built-in
active handling.

## Migration checklist (per component)

- [ ] Replace `match.params` -> `useParams()`, `location` -> `useLocation()`.
- [ ] Replace injected `history` -> `useNavigate()`.
- [ ] Remove the `withRouter` wrapper; keep `connect` if present.
- [ ] Move any `ownProps.match`-based Redux derivation into the component.
- [ ] Replace `useRouteMatch()` -> `useMatch()`; re-check `matchPath` signatures.
- [ ] Convert class components to function components where feasible.
- [ ] Update tests to render under a v6 router (see the overview skill's landmines).

## Anti-patterns

- Don't keep `RouteComponentProps` typing on migrated components.
- Don't write a custom `withRouter` replacement.
- Don't assume `matchPath`'s v5 signature carried over — confirm it.
