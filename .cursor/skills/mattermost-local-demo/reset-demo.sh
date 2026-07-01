#!/usr/bin/env bash
#
# Mattermost local demo — single self-contained reset tool.
#
# Strategy: restore the dedicated demo branch to repository HEAD, remove
# non-ignored untracked files, restore a checksummed Acme Demo database dump,
# and rebuild the client. Ignored local environment, dependency, and cache paths
# are left alone.
#
# Commands:
#   reset-demo.sh            # default: prepare (source + DB + bundle) THEN run server (foreground)
#   reset-demo.sh prepare    # stop server, reset scoped source, restore DB, build webapp
#   reset-demo.sh dry-run    # report exactly what source reset would change
#   reset-demo.sh build      # reset scoped source and rebuild webapp/channels/dist
#   reset-demo.sh serve      # run the server in the foreground with demo env (no DB changes)
#   reset-demo.sh wait       # poll the API until it is up (prints DEMO_READY)
#   reset-demo.sh watch      # incremental webpack watch into dist (no reset/build/install/restart)
#   reset-demo.sh watch-wait # block until webpack has rebuilt dist to match source (prints WATCH_FRESH)
#   reset-demo.sh watch-stop # stop the webpack watch process
#   reset-demo.sh watch-status # show watch process + dist freshness + recent watch log
#   reset-demo.sh stop       # stop the demo server (leaves Docker + DB up)
#   reset-demo.sh status     # show source drift, baseline integrity, docker/API/seed
#
# AGENT FLOW (reliable): the server MUST run as a long-lived background shell job,
# otherwise it gets reaped when a foreground tool call returns. So:
#   1) run `prepare` (foreground; restores source + DB and builds the webapp — allow a few
#      minutes the first time, ~30s when the webpack cache is warm)
#   2) start `serve` as a BACKGROUND shell  (block_until_ms: 0)
#   3) run `wait`    (foreground; blocks until DEMO_READY)
#   4) open the demo in Glass, print credentials
# HUMAN FLOW: just run `reset-demo.sh` in a terminal (prepare + serve in foreground).
#
# FAST FEATURE ITERATION (no reset): once the demo is up, start the incremental
# frontend rebuild ONCE and leave it running; edits then land in dist without any
# reset, dependency install, production build, or server restart:
#   1) start `watch` as a BACKGROUND shell (block_until_ms: 0); leave it running
#   2) edit webapp source
#   3) run `watch-wait` (foreground; blocks until WATCH_FRESH) BEFORE telling the
#      user to refresh — this confirms the changed chunks are in dist
#   4) hard-refresh http://localhost:8065 (no server restart)

set -euo pipefail

# --- paths -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
WEBAPP_DIR="$REPO_ROOT/webapp"
CHANNELS_DIR="$WEBAPP_DIR/channels"
DIST_DIR="$CHANNELS_DIR/dist"
BASELINE_FILE="$SCRIPT_DIR/baseline/mattermost_baseline.sql.gz"
BASELINE_SHA256="393c7b7335cfacebff2111c5bb308d7e3b3bb2e25b34ca6841eef423b1d2cc5e"
BASELINE_BRANCH="demo/channel-header-baseline"
RESET_HTML_SRC="$SCRIPT_DIR/demo-reset.html"
SERVER_LOG="$SERVER_DIR/logs/demo-server.log"
WATCH_LOG="$SERVER_DIR/logs/demo-webpack-watch.log"

# --- config ------------------------------------------------------------------
PG_CONTAINER="mattermost-postgres"
PG_USER="mmuser"
PG_PASSWORD="mostest"
PG_DB="mattermost_test"
SITE_URL="http://localhost:8065"
PING_URL="http://127.0.0.1:8065/api/v4/system/ping"
PING_TIMEOUT="${MM_DEMO_PING_TIMEOUT:-300}"   # seconds to wait for the API
NODE_HEAP="${MM_DEMO_NODE_HEAP:-8192}"        # webpack can be memory-hungry

log()  { printf '\033[36m[demo]\033[0m %s\n' "$*"; }
err()  { printf '\033[31m[demo] ERROR:\033[0m %s\n' "$*" >&2; }
die()  { err "$*"; exit 1; }

psql_db()   { docker exec -i -e PGPASSWORD="$PG_PASSWORD" "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" "$@"; }
psql_admin(){ docker exec -i -e PGPASSWORD="$PG_PASSWORD" "$PG_CONTAINER" psql -U "$PG_USER" -d postgres "$@"; }

# --- source baseline ---------------------------------------------------------
baseline_checksum() {
  shasum -a 256 "$BASELINE_FILE" | awk '{print $1}'
}

verify_baseline_file() {
  [ -f "$BASELINE_FILE" ] || die "baseline not found: $BASELINE_FILE"
  gzip -t "$BASELINE_FILE" || die "baseline gzip is corrupt: $BASELINE_FILE"
  local actual
  actual="$(baseline_checksum)"
  [ "$actual" = "$BASELINE_SHA256" ] \
    || die "baseline checksum mismatch (expected $BASELINE_SHA256, got $actual); refusing destructive DB restore"
}

verify_repo_root() {
  local actual branch
  actual="$(git -C "$REPO_ROOT" rev-parse --show-toplevel 2>/dev/null)" \
    || die "repository not found at $REPO_ROOT"
  [ "$actual" = "$REPO_ROOT" ] || die "unexpected repository root: $actual"
  branch="$(git -C "$REPO_ROOT" branch --show-current)"
  [ "$branch" = "$BASELINE_BRANCH" ] \
    || die "reset requires branch $BASELINE_BRANCH (current: ${branch:-detached})"
}

source_status() {
  local status_output
  status_output="$(git -C "$REPO_ROOT" status --short --untracked-files=all --ignored=no)"
  if [ -z "$status_output" ]; then
    echo "  clean"
    return 0
  fi
  printf '%s\n' "$status_output"
  return 1
}

restore_source_baseline() {
  verify_repo_root
  log "Restoring the checked-out source baseline..."
  git -C "$REPO_ROOT" restore --source=HEAD --staged --worktree -- .
  while IFS= read -r -d '' path; do
    rm -rf -- "$REPO_ROOT/$path"
  done < <(git -C "$REPO_ROOT" ls-files -z --others --exclude-standard)
  log "Source baseline restored."
}

# --- docker / postgres -------------------------------------------------------
ensure_docker() {
  log "Ensuring Postgres + Redis are up..."
  ( cd "$SERVER_DIR" && ENABLED_DOCKER_SERVICES='postgres redis' make start-docker >/dev/null 2>&1 ) \
    || die "make start-docker failed (is Docker running?)"
  log "Waiting for Postgres..."
  local i=0
  until docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; do
    i=$((i + 1)); [ "$i" -gt 60 ] && die "Postgres did not become ready"
    sleep 1
  done
  log "Postgres ready."
}

# --- server lifecycle --------------------------------------------------------
stop_server() {
  log "Stopping any running Mattermost server..."
  ( cd "$SERVER_DIR" && make stop-server >/dev/null 2>&1 ) || true
  local pids; pids="$(lsof -ti :8065 2>/dev/null || true)"
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  sleep 1
}

install_reset_page() {
  # Serve the cookie/storage-clearing page at /static/demo-reset.html so a stale
  # browser session after a wipe lands on a clean login instead of a spinner.
  if [ -f "$RESET_HTML_SRC" ] && [ -d "$DIST_DIR" ]; then
    cp "$RESET_HTML_SRC" "$DIST_DIR/demo-reset.html" && log "Installed demo-reset.html into client dist."
  else
    log "Skipping demo-reset.html (dist or source missing); login URL fallback will be used."
  fi
}

# --- webapp build ------------------------------------------------------------
build_webapp() {
  # Compile dist only after the scoped source has been restored. Webpack cleans
  # dist so the bundle always matches the checked-out source.
  command -v npm >/dev/null 2>&1 || die "npm not found; cannot build the webapp (install Node)"
  if watch_running; then
    log "Stopping webpack watch before a full build (two webpack writers on dist would clash)..."
    stop_watch
  fi
  log "Building webapp (channels, production). First run is slow; cached runs ~30s..."
  ( cd "$CHANNELS_DIR" && NODE_OPTIONS="--max-old-space-size=$NODE_HEAP" npm run build ) \
    || die "webapp build failed (see output above)"
  install_reset_page   # webpack cleans dist, so (re)install the reset page after
  log "Webapp build complete."
}

# --- webapp watch (incremental dev rebuilds; NO reset / build / install) ------
# `webpack --progress --watch` (npm run run) recompiles edited webapp source into
# dist automatically. Deliberately does NOT reset source, reinstall dependencies,
# run a production build, or restart the server. dist stays the source of truth's
# generated output; never hand-edit dist.
# The long-running webpack worker reports its command as just "webpack" (no
# --watch in argv), so anchor detection on the unique `npm run run` parent and
# kill the worker by exact process name.
WATCH_MATCH='npm run run'

watch_running() { pgrep -f "$WATCH_MATCH" >/dev/null 2>&1; }
watch_pids()    { pgrep -f "$WATCH_MATCH" | tr '\n' ' '; }

stop_watch() {
  pkill -f "$WATCH_MATCH" 2>/dev/null || true
  pkill -x webpack 2>/dev/null || true
  sleep 1
  if watch_running; then
    pkill -9 -f "$WATCH_MATCH" 2>/dev/null || true
    pkill -9 -x webpack 2>/dev/null || true
  fi
}

# Newest file mtime (epoch seconds) under the bundled webapp source, ignoring
# files webpack never bundles (tests, stories, snapshots). Empty when none found.
# awk (not `sort | head`) computes the max so an early-closed pipe cannot raise
# SIGPIPE, which pipefail would otherwise turn into a fatal assignment failure.
newest_src_mtime() {
  find "$CHANNELS_DIR/src" -type f \
    ! -name '*.test.ts' ! -name '*.test.tsx' ! -name '*.test.js' ! -name '*.test.jsx' \
    ! -name '*.stories.ts' ! -name '*.stories.tsx' ! -name '*.snap' \
    ! -path '*/__snapshots__/*' \
    -exec stat -f '%m' {} + 2>/dev/null \
    | awk 'NR==1 || $1>max {max=$1} END {if (max != "") print max}'
}

# Newest emitted asset mtime (epoch seconds) under dist. Empty when none found.
newest_dist_mtime() {
  find "$DIST_DIR" -type f -exec stat -f '%m' {} + 2>/dev/null \
    | awk 'NR==1 || $1>max {max=$1} END {if (max != "") print max}'
}

watch_foreground() {
  command -v npm >/dev/null 2>&1 || die "npm not found; cannot start webpack watch"
  if watch_running; then
    log "webpack watch already running (pid $(watch_pids)). Reusing it; not starting another."
    exit 0
  fi
  [ -d "$DIST_DIR" ] || log "warning: $DIST_DIR is missing; run 'prepare' (or 'serve') first. The server serves dist."
  mkdir -p "$SERVER_DIR/logs"
  : > "$WATCH_LOG"
  log "Starting incremental webpack watch from $CHANNELS_DIR -> $DIST_DIR."
  log "No source reset, no dependency install, no production build, no server restart."
  log "Watch log: $WATCH_LOG"
  cd "$CHANNELS_DIR"
  # Foreground pipeline (blocks); the agent launches this as a background shell.
  NODE_OPTIONS="--max-old-space-size=$NODE_HEAP" npm run run 2>&1 | tee -a "$WATCH_LOG"
}

cmd_watch_wait() {
  [ -d "$DIST_DIR" ] || die "dist missing: $DIST_DIR (run prepare/serve first)"
  watch_running || die "no webpack watch running; start it first: reset-demo.sh watch (as a background shell)"
  local timeout="${MM_DEMO_WATCH_TIMEOUT:-120}"
  # Source is static while we wait (edits already happened), so scan it once.
  local s; s="$(newest_src_mtime)"
  log "Waiting up to ${timeout}s for webpack to rebuild dist to match source..."
  local i=0
  while :; do
    local d; d="$(newest_dist_mtime)"
    if [ -n "$d" ] && { [ -z "$s" ] || [ "$d" -ge "$s" ]; }; then
      # Confirm webpack stopped writing, so we do not read a partial mid-emit dist.
      sleep 1
      local d2; d2="$(newest_dist_mtime)"
      if [ "$d2" = "$d" ]; then
        install_reset_page >/dev/null 2>&1 || true   # webpack clean drops it each emit
        log "dist is up to date and stable (src=${s:-none} dist=$d)."
        echo "WATCH_FRESH"
        return 0
      fi
    fi
    i=$((i + 1))
    if [ "$i" -gt "$timeout" ]; then
      err "Timed out after ${timeout}s waiting for an up-to-date dist. Recent watch log:"
      tail -n 20 "$WATCH_LOG" >&2 2>/dev/null || true
      die "webpack did not refresh dist (is the watch compiling without errors?)"
    fi
    sleep 1
  done
}

cmd_watch_stop() {
  if watch_running; then
    log "Stopping webpack watch..."
    stop_watch
    log "webpack watch stopped."
  else
    log "No webpack watch running."
  fi
}

cmd_watch_status() {
  if watch_running; then
    echo "watch: running (pid $(watch_pids))"
  else
    echo "watch: not running"
  fi
  echo "dist: $DIST_DIR"
  if [ -d "$DIST_DIR" ]; then
    local d s; d="$(newest_dist_mtime)"; s="$(newest_src_mtime)"
    echo "  newest bundled src mtime: ${s:-none}"
    echo "  newest dist mtime:        ${d:-none}"
    if [ -n "$d" ] && { [ -z "$s" ] || [ "$d" -ge "$s" ]; }; then
      echo "  freshness: up-to-date"
    else
      echo "  freshness: STALE (rebuild pending)"
    fi
  else
    echo "  (dist missing)"
  fi
  if [ -f "$WATCH_LOG" ]; then
    echo "recent watch log ($WATCH_LOG):"
    tail -n 8 "$WATCH_LOG" 2>/dev/null | sed 's/^/  /'
  fi
}

serve_foreground() {
  # Runs in the foreground and BLOCKS. Intended to be launched as a background
  # shell job by the agent, or directly in a terminal by a human.
  # Demo-only env: stable SiteURL, no desktop landing interstitial, plugins off
  # (plugin webapp bundles are not built in this tree and would hang the SPA).
  mkdir -p "$SERVER_DIR/logs"
  log "Running Mattermost server (foreground, demo env). Ctrl+C to stop."
  cd "$SERVER_DIR"
  exec env \
    MM_SERVICESETTINGS_SITEURL="$SITE_URL" \
    MM_SERVICESETTINGS_ENABLEDESKTOPLANDINGPAGE=false \
    MM_PLUGINSETTINGS_ENABLE=false \
    ENABLED_DOCKER_SERVICES='postgres redis' \
    RUN_SERVER_IN_BACKGROUND=false \
    make run-server
}

wait_for_api() {
  log "Waiting for API at $PING_URL (timeout ${PING_TIMEOUT}s; first run compiles Go)..."
  local i=0
  until curl -fsS --max-time 5 "$PING_URL" 2>/dev/null | grep -q '"status":"OK"'; do
    i=$((i + 1))
    if [ "$i" -gt "$PING_TIMEOUT" ]; then
      err "API never came up. Last 30 server log lines ($SERVER_LOG):"
      tail -n 30 "$SERVER_LOG" >&2 2>/dev/null || true
      die "server did not start"
    fi
    sleep 1
  done
  log "API is up."
}

# --- database baseline restore ----------------------------------------------
restore_baseline() {
  verify_baseline_file
  log "Restoring baseline DB from $(basename "$BASELINE_FILE")..."
  psql_admin -v ON_ERROR_STOP=1 -q \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$PG_DB' AND pid<>pg_backend_pid();" \
    -c "DROP DATABASE IF EXISTS $PG_DB WITH (FORCE);" \
    -c "CREATE DATABASE $PG_DB OWNER $PG_USER;" >/dev/null
  gunzip -c "$BASELINE_FILE" | psql_db -v ON_ERROR_STOP=1 -q >/dev/null
  verify_db_baseline || die "restored DB is not the original channel metadata baseline"
  log "Baseline restored."
}

verify_db_baseline() {
  local mismatches
  mismatches="$(psql_db -v ON_ERROR_STOP=1 -tAc "
    WITH expected(displayname) AS (VALUES
      ('Engineering'),
      ('Launch Planning'),
      ('Off-Topic'),
      ('Product'),
      ('Random'),
      ('Town Square')
    ), actual AS (
      SELECT c.displayname, COALESCE(c.header, '') AS header, COALESCE(c.purpose, '') AS purpose
      FROM channels c
      JOIN teams t ON t.id = c.teamid
      WHERE t.name = 'acme-demo' AND c.type = 'O' AND c.deleteat = 0
    )
    SELECT count(*)
    FROM expected e
    FULL JOIN actual a USING (displayname)
    WHERE e.displayname IS NULL OR a.displayname IS NULL OR a.header <> '' OR a.purpose <> '';
  ")"
  if [ "$mismatches" != "0" ]; then
    err "DB failed channel header/purpose baseline validation ($mismatches mismatches)"
    return 1
  fi
}

print_counts() {
  psql_db -tAc "select format('  users=%s teams=%s channels=%s posts=%s acme_demo=%s riagoveas=%s',
    (select count(*) from users),(select count(*) from teams),(select count(*) from channels),
    (select count(*) from posts),(select count(*) from teams where name='acme-demo'),
    (select count(*) from users where username='riagoveas'));" 2>/dev/null || true
}

# --- commands ----------------------------------------------------------------
cmd_prepare() {
  log "=== Preparing demo (restore scoped source + DB + bundle) ==="
  stop_server
  restore_source_baseline
  ensure_docker
  restore_baseline
  build_webapp
  log "Seed:"; print_counts
  echo "PREPARE_OK"
}

cmd_build() {
  restore_source_baseline
  build_webapp
  echo "DEMO_BUILD_OK"
}

cmd_wait() {
  wait_for_api
  log "Seed:"; print_counts
  echo "DEMO_READY"
}

cmd_stop() {
  stop_server
  log "Server stopped (Docker + DB left running)."
}

cmd_status() {
  verify_repo_root
  echo "source baseline:"
  source_status || true
  echo "baseline file:"
  if [ -f "$BASELINE_FILE" ]; then
    local actual
    actual="$(baseline_checksum)"
    if [ "$actual" = "$BASELINE_SHA256" ] && gzip -t "$BASELINE_FILE" 2>/dev/null; then
      echo "  OK $BASELINE_FILE ($actual)"
    else
      echo "  INVALID $BASELINE_FILE ($actual)"
    fi
  else
    echo "  missing $BASELINE_FILE"
  fi
  echo "docker:"
  docker ps --format '  {{.Names}}\t{{.Status}}' | grep -i mattermost || echo "  (no mattermost containers running)"
  echo "api:"
  if curl -fsS --max-time 5 "$PING_URL" 2>/dev/null | grep -q '"status":"OK"'; then
    echo "  OK ($SITE_URL)"
  else
    echo "  down"
  fi
  if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    echo "seed:"; print_counts
    if verify_db_baseline 2>/dev/null; then echo "  channel metadata=baseline"; else echo "  channel metadata=DRIFTED"; fi
  fi
}

cmd_dry_run() {
  verify_repo_root
  echo "Dry run only; no files, DB, build output, or processes changed."
  source_status || true
  echo "Preserved: ignored local paths, including .env/secrets, node_modules, caches, user config, and this skill."
}

case "${1:-reset}" in
  reset)    cmd_prepare; serve_foreground ;;   # human/terminal: prepare then run server here
  prepare)  cmd_prepare ;;
  build)    cmd_build ;;
  dry-run)  cmd_dry_run ;;
  serve)    serve_foreground ;;                # agent: run this as a background shell job
  wait)     cmd_wait ;;
  watch)        watch_foreground ;;            # agent: run this as a background shell job
  watch-wait)   cmd_watch_wait ;;              # foreground: blocks until dist rebuilt (prints WATCH_FRESH)
  watch-stop)   cmd_watch_stop ;;
  watch-status) cmd_watch_status ;;
  stop)     cmd_stop ;;
  status)   cmd_status ;;
  *) die "unknown command: $1 (use: reset | prepare | dry-run | build | serve | wait | watch | watch-wait | watch-stop | watch-status | stop | status)" ;;
esac
