---
name: respongo-v3-architecture
description: Define or revise Respongo OS V3 product ownership, cross-product contracts, and SaaS versus managed-service boundaries.
---

# Product architecture

Use for a new module, cross-product integration, or boundary change.

1. Read `v3/docs/architecture/README.md`, `v3/context/kararlar.md`, and only the relevant product/service documents and generated `modules.md`.
2. Assign one owner for the data and command. Connect other areas through versioned API/events; do not create shared mutable tables merely to join products.
3. Keep GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI distinct; GOAI Engine is a controlled shared capability. GOFACTORY is Respongo's managed service, Control Center is customer-facing, Respongo HQ is internal. GOHR/GORECRUIT are not products in V3.
4. Explicitly examine tenant, role, license/trial, audit, error, retention and data portability impacts. The beta is a modular monolith until measured scale or organization needs justify separation.
5. Update affected area docs, decision log when a decision changes, and module tracker in the same work. Verify repository state before saying a capability exists.
6. For language features, keep Respongo HQ as the package/licensing authority: TR/EN included, other locales tenant add-ons. Customer changes are sparse overlays; base upgrades inherit new keys and preserve customized values. Read `v3/docs/architecture/localization-white-label.md` before changing this boundary.
7. For AI features, read `v3/intelligence/goai-engine/product-architecture.md`. GOAI is embedded infrastructure and shared UI, not a standalone product. Tenant governance belongs to Control Center; provider secrets, global routing, cost, eval and rollout belong to Respongo HQ. Models use registered product tools and never write product tables directly.
