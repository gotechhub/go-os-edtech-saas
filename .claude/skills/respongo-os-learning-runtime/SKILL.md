---
name: respongo-os-learning-runtime
description: Implement and verify SCORM, xAPI/cmi5, assessments, program sequencing, assignments, and learning evidence in V3 GOLMS/GOAUTHOR AI.
---

# Learning runtime

Use for content packages, learner playback, program rules or outcome reporting.

1. Read `products/golms/modules.md`, `products/goauthor-ai/modules.md`, `standards/README.md`, and the affected implementation.
2. Parse and validate ZIP manifests in quarantine; reject traversal, dangerous paths, unsupported version, oversized expansion and untrusted active content. Isolate the player origin and scope its communication.
3. Model assignment, registration, attempt, activity, statement and package version separately. Completion, success, score, duration and progress are distinct facts. Preserve raw protocol evidence and derived state with a documented rule version.
4. Test against reference SCORM 1.2/2004 packages and xAPI/cmi5 fixtures, including resume, failed attempt, sequencing, duplicate and out-of-order events. External SCORM runtimes may not expose every GOAUTHOR interaction; report the measurable boundary honestly.
5. Validate admin create → publish → assign → learner launch → complete → report end to end with real role and tenant permissions.
