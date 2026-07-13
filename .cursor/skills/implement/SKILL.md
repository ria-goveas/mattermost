---
name: implement
description: Implements scoped Mattermost bugs and feature requests with focused exploration, subagent delegation, minimal changes, and proportional verification. Invoke explicitly when solving a Linear issue or implementing a defined engineering task.
disable-model-invocation: true
---

# Implement

Use this workflow for one issue at a time. The parent agent owns scope, integration, and the final result.

## 1. Establish the contract

1. Read the issue, repository instructions, and relevant nearby code and tests.
2. Restate the observable current behavior, expected behavior, and acceptance criteria.
3. Identify ambiguities that materially affect the implementation. If the issue is unsafe or underspecified, stop and escalate with evidence.
4. Keep the change limited to the issue. Do not include drive-by cleanup.

## 2. Delegate investigation

Launch independent subagents in parallel when the work can be separated:

- An `explore` subagent traces the implementation path, existing patterns, and likely files.
- A second read-only subagent finds relevant tests, edge cases, and the narrowest verification commands.
- For a larger but still well-scoped issue, delegate one isolated implementation slice to a general-purpose subagent. Give it exact ownership boundaries and acceptance criteria.

Ask each subagent to return evidence with file paths and concrete recommendations. Do not delegate the final scope decision, integration, or user-facing summary.

## 3. Implement narrowly

1. Follow existing patterns in the nearest production code and tests.
2. Prefer the smallest change that satisfies every acceptance criterion.
3. Add or update focused tests for changed behavior. New API endpoints must include API test coverage.
4. Preserve compatibility unless the issue explicitly authorizes a breaking change.
5. Never run `go mod tidy` directly; use `make modules-tidy`.
6. After editing `server/i18n/en.json`, run `make -C server i18n-extract`.

## 4. Verify

1. Run the narrowest relevant tests first.
2. Run formatting, linting, type checking, or broader tests in proportion to risk.
3. If a check cannot run, record the exact blocker. Do not claim it passed.
4. Review the final diff against the issue and remove unrelated changes.
5. Delegate a final read-only review when the change crosses components or has non-obvious edge cases. Resolve concrete findings before finishing.

## 5. Finish or escalate

Finish only when the acceptance criteria are met and verification is green. Summarize:

- What changed and why
- Tests and checks run
- Remaining risks or skipped checks

Escalate instead of guessing when requirements conflict, required access is unavailable, reproduction fails, or the safe fix exceeds the issue's scope. Include the evidence gathered, attempted approaches, and the smallest decision needed from a human.
