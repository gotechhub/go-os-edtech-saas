---
name: respongo-os-data-security
description: Design or review Supabase migrations, RLS, tenant isolation, trial enforcement, private S3 files, and HQ support access in Respongo OS.
---

# Data and security changes

Use when a schema, command, auth, storage, trial or HQ support route changes.

1. Read `docs/architecture/data-contracts.md` and `security-operations.md`; inspect the real migration and every affected caller. Do not rely on the planning graph as a database schema.
2. Give each resource tenant and owner context. Test two tenants, normal/customer-admin/HQ roles, expired trial, revoked access, and replay. API authorization and RLS must agree; UI hiding does not authorize.
3. The 14-day tenant trial starts at first customer activation, excludes internal demos, covers released SaaS products, and after expiry preserves authorized reads but denies writes in all command paths. GOFACTORY and third-party licenses have separate rights.
4. Private S3 uploads require scoped short-lived signatures, size/type checks, scan/quarantine, versioning and permission-checked downloads. Log intervention without exposing secrets or document content.
5. Distinguish a local migration/test from hosted application. Record rollback and evidence before marking acceptance.
6. For locale packs, verify HQ publish permission separately from tenant add-on entitlement and Control Center `localization.manage`. Test revoked/expired grants, cross-tenant overlays, unpublished drafts, protected labels and upgrade/rollback. Customer-facing language selection never grants product permissions.
