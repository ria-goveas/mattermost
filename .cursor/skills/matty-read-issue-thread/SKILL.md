---
name: matty-read-issue-thread
description: Reconstruct the user story from an issue-channel thread before editing code. Use when a Jira or Linear ticket references a Slack or Mattermost thread, or when the agent needs to understand what the user actually experienced.
disable-model-invocation: true
---

# Matty: read issue thread

Reconstruct the user story from an issue-channel thread before touching code. The goal is a clean intake summary that downstream subagents can act on, not a root-cause diagnosis.

## Instructions

1. **Read the full referenced thread**, not just the first message. Follow replies, quoted messages, edits, and any linked follow-up threads. The real report is often buried in later replies.
2. **Extract** the following from the thread:
   - User action (what the user did)
   - Expected behavior
   - Actual behavior
   - Affected surface (screen, feature, endpoint, component)
   - Environment/context (version, browser/app, server, config)
   - Role/permissions of the reporting user
   - Screenshots, logs, error messages, stack traces
   - Missing information needed to reproduce or understand the issue
3. **Separate facts from hypotheses.** Report what people observed distinctly from what they guessed. Attribute guesses to their source; never promote a guess to a fact.
4. **Do not assume the technical root cause yet.** No code investigation, no "this is probably caused by X." Intake only.
5. **Return a concise intake summary** using the output format below so downstream subagents can consume it directly.

## Output format

```
- User action:
- Expected behavior:
- Actual behavior:
- Affected surface:
- Environment/context:
- Evidence:
- Missing information:
- Source thread:
- Initial confidence:
```

## Notes

- Fold role/permissions into `Environment/context`.
- `Evidence` lists concrete artifacts: screenshots, logs, error text, links.
- `Missing information` is what you would need to ask the reporter to fully reproduce the issue.
- `Initial confidence` is a short qualitative read (e.g. Low / Medium / High) on how well the thread describes the problem — not a root-cause verdict.
- If a field has no information in the thread, write `Not stated` rather than guessing.
