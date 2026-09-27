---
name: respongo-v3-context
description: Resume Respongo OS V3 work across Codex and Claude, update shared decisions, handoff, and the source-backed project tracker.
---

# Shared context and handoff

Use when resuming V3 work, changing scope, or handing work between Codex and Claude.

1. Read `v3/context/README.md`, then `proje-ozeti.md`, `kurallar-ve-sinirlar.md`, and the relevant area document. Read `v3/.ai_memory/session_state.md` when resuming after a gap. Never treat it as code truth.
2. Check `v3/context/kararlar.md` before changing a settled boundary. Record a new dated decision rather than silently rewriting history.
3. Update `v3/project-tracker.json` only for the affected module and gate. `verified` requires a date and concrete evidence. Regenerate outputs with `corepack pnpm v3:tracker:update`, then run `corepack pnpm v3:tracker:check`.
4. Keep the handoff in `v3/.ai_memory/session_state.md` short: active objective, completed work, open blockers, next action, and local/hosted validation distinction.
5. If both agents can edit the workspace, coordinate file ownership or use separate branches before overlapping changes; inspect the current diff and preserve the other's work.

Do not copy entire chats into context files. Sources and hypotheses belong in `v3/research/`, decisions in the decision log, and implementation truth in code/tests/migrations.
