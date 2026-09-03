# AGENTS.md

Explicitly import subdirectory instruction files that must always be in context:
@server/AGENTS.md

## Pull Requests

When creating a pull request, follow `.github/PULL_REQUEST_TEMPLATE.md` exactly:

- Remove all `<!-- -->` comments.
- Omit sections that are not applicable (Ticket Link, Screenshots) — do not write N/A, just remove the header.
- The `#### Release Note` header and its "```release-note" fenced code block **must always be present** (WITHOUT escaping the ``` characters). Write `NONE` if the change has no API, schema, UI, or breaking changes.

## Cursor Cloud Agents

This repository has a checked-in Cloud Agent environment under `.cursor/`. Docker is started by `.cursor/scripts/cloud-agent-start.sh`; if Docker is unavailable in Cloud, treat that as an environment failure rather than falling back to snapshot assumptions.

The environment declares `mattermost/enterprise` as a Cursor multi-repo dependency. Cursor clones the repositories as siblings, so `server/Makefile` can use its default `../../enterprise` path; the install hook does not clone or symlink enterprise.

## Cursor Cloud specific instructions

Full run/test/seed steps live in `.cursor/cursor.md` (materialized as `.cursor/AGENTS.md` by the start hook). Key non-obvious caveats:

- Dependencies are refreshed by `.cursor/scripts/cloud-agent-install.sh` (Go workspace + `go mod download`, webapp `make node_modules`, Playwright `npm ci`). Don't re-run these by hand unless deps changed.
- The baked toolchains in `.cursor/Dockerfile` must stay in sync with the repo: Go with `server/.go-version` / `go.mod` (currently 1.26.3) and Node with `.nvmrc` (24.11). If the baked Go is older than `go.mod`, `go build`/`go run` silently triggers a `GOTOOLCHAIN=auto` download at runtime, which depends on egress to the Go download servers.
- Reliable combined startup (server backgrounded, then webapp watch build): from `server/`, `ENABLED_DOCKER_SERVICES='postgres redis' RUN_SERVER_IN_BACKGROUND=true make run`. `make run` only reaches the webapp (`run-client`) if the server is backgrounded. Server is served at `http://localhost:8065`; health check: `curl http://127.0.0.1:8065/api/v4/system/ping`.
- If enterprise is absent, the server builds Team Edition (`BUILD_ENTERPRISE_READY=false`) — sufficient for core chat dev.
- If the first-user signup UI is flaky, seed an admin + team with `./bin/mmctl --local` (see `.cursor/cursor.md`) and log in through the browser.
