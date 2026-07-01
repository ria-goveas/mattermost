---
name: mattermost-local-demo
description: >-
  Fast full reset of the local Mattermost Acme Demo for screen-share. Restores
  the scoped demo source files and DB to their original pre-demo baselines,
  rebuilds the original bundle, runs the server on :8065, then opens the demo in
  the Glass / Cursor embedded browser. Use for demo workspace, Acme Demo,
  riagoveas, reset the demo, true full reset, or local Mattermost demo.
---

# Mattermost local demo (reset + Glass embedded browser)

**Everything for this skill lives in this folder** (`.cursor/skills/mattermost-local-demo/`, gitignored):

| File | Purpose |
|------|---------|
| `reset-demo.sh` | The one script. `reset` (default), `prepare`, `dry-run`, `build`, `serve`, `wait`, `watch`, `watch-wait`, `watch-stop`, `watch-status`, `stop`, `status`. |
| `baseline/mattermost_baseline.sql.gz` | Gitignored, checksummed demo DB dump. |
| `demo-reset.html` | Cookie/storage clear page → served at `/static/demo-reset.html`. |

## How reset works

The reset uses the dedicated demo branch plus a **checksummed Postgres dump**:

1. `prepare` stops any running server.
2. It restores tracked source from repository `HEAD` and removes non-ignored untracked files.
3. It ensures Docker (`postgres` + `redis`) is up, verifies the DB snapshot checksum, **drops & recreates** `mattermost_test`, and restores `baseline/mattermost_baseline.sql.gz`.
4. It verifies that all six original public channels and their baseline metadata exist.
5. It rebuilds `webapp/channels/dist` from the restored source and installs `demo-reset.html`.
6. `serve` runs the server with demo env; `wait` polls the API.

Run this only on `demo/channel-header-baseline`. It discards tracked changes and non-ignored untracked files across the checkout. Ignored local environment files, dependencies, caches, server configuration, and this skill remain untouched.

The build is mandatory during a full reset so `dist` always matches the checked-out source.

Inspect the reset without changing anything:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh dry-run
```

## Fastest agent path

The server must run as a **long-lived background shell job** (otherwise it gets reaped when a foreground tool call returns). So the agent uses three steps:

1. Prepare (restore scoped source + DB baseline + original webapp bundle) — foreground. Wait for `PREPARE_OK`. Allow a few minutes the first time (webpack); cached runs are faster:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh prepare
```

2. Start the server as a **background shell** (`block_until_ms: 0`); leave it running:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh serve
```

3. Wait for the API — foreground, blocks until `DEMO_READY`:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh wait
```

4. Open the demo **once** in Glass via the **`cursor-app-control`** MCP tool **`open_resource`**:

`http://localhost:8065/static/demo-reset.html`

(Fallback if that 404s: `http://localhost:8065/login?extra=signin_change`.)

5. Reply with **exactly** the three-line credentials block below — nothing else.

> Humans can instead run `bash .cursor/skills/mattermost-local-demo/reset-demo.sh` (no arg) in a terminal — it prepares, then runs the server in the foreground of that terminal.

### Final message format (mandatory)

```
Username: riagoveas
Password: Password123!
Open: http://localhost:8065
```

Only this in the chat reply (no tables, channel lists, token dumps, or "how to reset"). If the run **failed**, one short error line is OK instead.

## Open / login policy (mandatory)

- **DO** open the demo **only** in the **Glass / Cursor embedded browser** via `cursor-app-control` → `open_resource`.
- **Preferred URL after reset:** `http://localhost:8065/static/demo-reset.html` (clears stale cookies/storage, then `/login?extra=signin_change`).
- **DO NOT** use `cursor-ide-browser` / browser-fill automation MCP.
- **DO NOT** use AppleScript / `open` targeting Chrome/Safari for success criteria.

## Baseline (Acme Demo)

| Item | Value |
|------|-------|
| URL | http://localhost:8065 |
| Team | **Acme Demo** (`acme-demo`) |
| Login | `riagoveas` / `Password123!` (all demo users share this password) |
| Friends / DMs | `simonlackowski`, `jackkelley`, `mollysmith`, `alexzakoor`, `anastasiatkachuk` |
| Content | ~19 users, 5 seeded channels (10 posts each), empty DMs |

Don't add extra posts/channels/DMs — the reset restores this baseline.

## Incremental feature work (mandatory for agents)

The reset script is **only** for returning to baseline. **Never** tell the user to run `prepare`, `build`, or a full reset just to see a small feature tweak.

While implementing features on the demo branch, the running server serves `webapp/channels/dist` (read from disk per request). Use the **webpack watch fast path** so changed chunks land in `dist` automatically. `dist` is generated output; never hand-edit it.

1. Ensure the demo server is already up (`serve` + `wait`, or an existing `:8065` process).
2. Start the watch **once** as a **long-lived background shell** (`block_until_ms: 0`); leave it running for the whole feature session. It does not reset source, reinstall dependencies, run a production build, or restart the server:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch
```

(Wraps `NODE_OPTIONS=--max-old-space-size=8192 npm run run` → `webpack --progress --watch`, teeing to `server/logs/demo-webpack-watch.log`.)

3. Edit source; webpack recompiles affected chunks into `dist`.
4. **Before telling the user to refresh**, block until the rebuild is on disk (prints `WATCH_FRESH`). This is a foreground call:

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch-wait
```

(First compile on a cold cache can take a while; the 120s wait is overridable via `MM_DEMO_WATCH_TIMEOUT`.)

5. Hard-refresh the Glass browser at `http://localhost:8065` (or open `/static/demo-reset.html` once if the session is stale). No server restart needed.

**Agent rules during feature work:**
- **DO** start the watch once and keep a single watch process across edits (`watch` reuses an existing one and refuses to start a second).
- **DO** run `watch-wait` after edits and only tell the user to refresh once it prints `WATCH_FRESH`. Use `watch-status` to inspect the watcher, dist freshness, and the recent compile log.
- **DO NOT** run `reset-demo.sh prepare` or `reset-demo.sh build` to preview UI changes — those restore `HEAD` and wipe uncommitted work.
- **DO NOT** run `npm run build` (production) for routine tweaks unless watch is unavailable or you need a one-off production bundle.
- **DO NOT** edit `webapp/channels/dist` by hand; let webpack regenerate it.
- Reserve `prepare` / full reset for explicit baseline restore only (demo start, screen-share reset, or user asks to discard local changes). A full build auto-stops the watch first to avoid two webpack writers clashing on `dist`.

## Other commands

```bash
bash .cursor/skills/mattermost-local-demo/reset-demo.sh dry-run      # report source reset actions
bash .cursor/skills/mattermost-local-demo/reset-demo.sh build        # baseline only: restore HEAD + rebuild dist (not for feature tweaks)
bash .cursor/skills/mattermost-local-demo/reset-demo.sh status       # source / snapshot / DB / Docker / API status
bash .cursor/skills/mattermost-local-demo/reset-demo.sh stop         # stop demo server (keeps Docker + DB)
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch        # start incremental webpack watch (run as a background shell)
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch-wait   # block until dist rebuilt (prints WATCH_FRESH)
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch-status # watch process + dist freshness + recent compile log
bash .cursor/skills/mattermost-local-demo/reset-demo.sh watch-stop   # stop the webpack watch (leaves server + DB up)
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Infinite spinner; 401 on `/api/v4/users/me*` after reset | Stale browser session cookie | Open `/static/demo-reset.html` (or `/login?extra=signin_change`); hard-refresh |
| "View in Desktop App" | Desktop landing page | Reset sets `EnableDesktopLandingPage=false`; click "View in Browser" once if needed |
| API never comes up | First run compiles Go / Docker down | Check `server/logs/demo-server.log`; ensure Docker is running |
| `baseline not found` or checksum mismatch | Fixed snapshot is missing or was changed | Recover the original skill-local snapshot; do not capture the current demo DB over it |
| Restored DB fails channel metadata validation | Snapshot metadata differs or an expected channel is missing | Recover the skill-local snapshot; reset refuses to report success |
| `webapp build failed` during `prepare`/`build` | Node/webpack error in restored `HEAD` source or dependencies | Read the build output; correct the environment/dependency issue, then re-run reset only if returning to baseline |
| Code change still showing | Browser cached an old bundle, or webpack watch not running / mid-compile | Run `reset-demo.sh watch-status`; if not running start `reset-demo.sh watch` (background shell); run `reset-demo.sh watch-wait` for `WATCH_FRESH`, then hard-refresh (or `/static/demo-reset.html`). Do **not** run reset/build for this |

## Out of scope

- Re-seeding from code or overwriting the fixed baseline from the live DB.
- Enterprise repo, production deploy, E2E.
- `cursor-ide-browser` automation; Chrome/Safari as success criteria.
