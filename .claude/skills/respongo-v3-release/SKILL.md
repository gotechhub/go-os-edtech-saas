---
name: respongo-v3-release
description: Verify V3 module acceptance, CI, hosted migration, customer UAT, observability and release evidence without overstating completion.
---

# Acceptance and release

Use for tracker status changes, release preparation or readiness reviews.

1. Read `v3/docs/architecture/release-gates.md`, `v3/project-tracker.json`, and the affected tests/code.
2. Separate definition, implementation and acceptance. A successful build is not user acceptance; local tests are not hosted migration; deployment is not live workflow verification.
3. Before `verified`, record dated, reproducible evidence in the affected gate. Run `corepack pnpm v3:tracker:update` and `v3:tracker:check`; inspect generated Markdown/HTML.
4. Include role/tenant/trial negative tests, accessibility, migration/rollback, observability, backup/restore and representative customer UAT as applicable to the release.
5. Report remaining risk with owner and next action. AI review is helpful but cannot approve its own implementation alone.
