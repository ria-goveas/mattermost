---
name: react-router-navigation
description: >-
  Conventions for programmatic navigation in the Mattermost webapp during the
  React Router v5 -> v6 migration. Covers migrating getHistory().push /
  useHistory() to useNavigate(), preserving the custom browser_history desktop
  push shim, and navigating from non-React code (Redux actions, utils). Use when
  changing how code navigates between routes under webapp/, or when the user
  mentions useHistory, useNavigate, history.push, getHistory, or browser_history.
---

# React Router navigation conventions (v5 -> v6)

Part of the [react-router-v6-migration](../react-router-v6-migration/SKILL.md)
effort. This skill covers **imperative navigation only** (route definitions and
params live in the sibling skills).

## Current state

Two navigation styles coexist, and `webapp/STYLE_GUIDE.md` flags the split as a
cleanup target:

- **`getHistory()`** from `utils/browser_history` — used by Redux actions, utils,
  and other non-React code (~88 files).
- **`useHistory()`** hook — used inside components (~38 files).

## Rules

### In React components: use `useNavigate()`
Replace the v5 `useHistory()` hook with v6 `useNavigate()`.

```tsx
// v5 (old)
import {useHistory} from 'react-router-dom';
const history = useHistory();
history.push('/error?type=team_not_found');
history.replace(`/${teamName}/channels/${channelName}`);

// v6 (new)
import {useNavigate} from 'react-router-dom';
const navigate = useNavigate();
navigate('/error?type=team_not_found');
navigate(`/${teamName}/channels/${channelName}`, {replace: true});
```

Mapping:

| v5 | v6 |
|----|----|
| `history.push(to)` | `navigate(to)` |
| `history.replace(to)` | `navigate(to, {replace: true})` |
| `history.goBack()` | `navigate(-1)` |
| `history.go(n)` | `navigate(n)` |
| `history.push({pathname, search, state})` | `navigate({pathname, search}, {state})` |

### In non-React code: keep going through `getHistory()`
Redux actions, thunks, and utility modules **cannot** call hooks. Keep using the
shared history helper — do not import `history` and create a second instance:

```ts
import {getHistory} from 'utils/browser_history';
getHistory().push('/');
```

Reason: `getHistory()` returns the desktop-aware wrapper. A parallel history
instance would bypass the desktop push override and desync navigation.

```35:37:webapp/channels/src/utils/browser_history.tsx
export function getHistory() {
    return getModule<History>('utils/browser_history') ?? browserHistory;
}
```

### Prefer passing state/handlers over navigating from deep utils
When practical, let the component own navigation (via `useNavigate`) and have
actions return a result, rather than importing `getHistory()` into more modules.
This shrinks the non-hook navigation surface over time.

## Migration checklist (per component)

- [ ] Swap `useHistory()` -> `useNavigate()` and update every `.push`/`.replace`/`.goBack`.
- [ ] Convert `replace` calls to the `{replace: true}` option form.
- [ ] Leave genuine non-React callers on `getHistory()`.
- [ ] Update the component's tests: stop relying on the global `useHistory` mock
      (`webapp/channels/src/tests/react-router-dom_mock.ts`) and assert on the v6
      navigation instead.
- [ ] Run the component's tests (`webapp/channels`, `npm run test`) after the change.

## Anti-patterns

- Don't call `createBrowserHistory()` yourself in app code — always `getHistory()`.
- Don't mix `useHistory()` and `useNavigate()` in the same component.
- Don't reach for `window.location` to route within the SPA; use `navigate`.
