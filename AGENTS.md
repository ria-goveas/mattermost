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

Standard build/lint/test/run commands live in `server/Makefile` and `webapp/Makefile` (`make help`); the notes below only capture non-obvious behavior.

- Running the app (dev): `cd server && make run` starts the Go server on `:8065` and the webapp webpack watch together. To run them separately, use `make run-server` (server) and `cd webapp && make run` (client watch). `make run-server` auto-starts the required Docker services and symlinks the compiled webapp into `server/client`, so run it from a session where the Docker daemon is already up.
- Only PostgreSQL is strictly required to boot the server. The default `ENABLED_DOCKER_SERVICES` (postgres, inbucket, redis, prometheus, grafana, loki, otel-collector) can be overridden, e.g. `ENABLED_DOCKER_SERVICES=postgres make start-docker`, to pull/start fewer images.
- A `"Mail server connection test failed"` error at startup is benign unless you are exercising email flows — start the `inbucket` Docker service for those.
- Without a sibling `enterprise` checkout the build is Team Edition (`BUILD_ENTERPRISE_READY=false`), which is expected and fine for most work; enterprise-only packages/tests are simply excluded.
- The first account created via the web signup (`/signup_user_complete`) becomes the system admin, and email verification is off by default in dev, so a new admin can be created without a mail server.
- `make golangci-lint` installs the pinned `golangci-lint` on demand before running, so the first lint invocation in a fresh session is slower.
