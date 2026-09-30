---
name: respongo-os-context
description: Resume Respongo OS work across Codex and Claude, update shared decisions, handoff, and the source-backed project tracker.
---

# Shared context and handoff

Use when resuming V3 work, changing scope, or handing work between Codex and Claude.

1. Read `context/README.md`, then `proje-ozeti.md`, `kurallar-ve-sinirlar.md`, and the relevant area document. Read `.ai_memory/session_state.md` when resuming after a gap. Never treat it as code truth.
2. Check `context/kararlar.md` before changing a settled boundary. Record a new dated decision rather than silently rewriting history.
3. Update `project-tracker.json` only for the affected module and gate. `verified` requires a date and concrete evidence. In the clean Respongo OS repository, regenerate outputs with `corepack pnpm tracker:update`, then run `corepack pnpm tracker:check`.
4. Keep the handoff in `.ai_memory/session_state.md` short: active objective, completed work, open blockers, next action, and local/hosted validation distinction.
5. If both agents can edit the workspace, coordinate file ownership or use separate branches before overlapping changes; inspect the current diff and preserve the other's work.

Do not copy entire chats into context files. Sources and hypotheses belong in `research/`, decisions in the decision log, and implementation truth in code/tests/migrations.
