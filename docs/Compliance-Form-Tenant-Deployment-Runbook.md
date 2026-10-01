# Compliance Form Automation — Tenant Deployment Runbook

## Scope and invariants

Run this process separately for every client database. Forms are global only inside that tenant database. Do not copy runtime form rows between tenants, create shared-form references, or link forms to compliance events. The application code and shortcode meanings are common; each tenant controls which forms exist in its own database.

Authentication, login, token handling, Redis sessions, and tenant database routing are outside this deployment change and must remain unchanged.

## Release inputs

- Application build containing Phase 3 work through P3-15.
- Tenant database backup and tested restore procedure.
- Migrations `20260824000001` through `20260824000011`, applied in filename order.
- Tenant-specific form inventory approved for deployment.
- Writable tenant artifact storage for `form_generation/pdf` and `form_generation/docx`.

Share Allotment V4 golden-output approval remains a separate blocked acceptance item until the authoritative source DOCX and approved DOCX/PDF fixtures are supplied.

## Pre-deployment

1. Record the exact tenant database name and expected number/list of forms. Never use a master or another client's form count as the expected inventory.
2. Back up that exact database and record backup location, timestamp, checksum, and restore owner.
3. Confirm application and migration configuration resolve to the same tenant database.
4. Stop form-authoring changes for that tenant during migration and verification.
5. Run the normal backend and frontend build/test gates.

## Migration and seed order

Apply migrations using the project's Sequelize migration command against the exact tenant database. The sequence creates the shortcode registry, deploys common definitions, creates immutable versions and generation storage, adds PDF/DOCX/lineage support, then deploys allotment, share-transaction, and selected-official definitions.

Do not run a form-data seed from another tenant. The shortcode migrations contain application-owned definitions only; they do not contain tenant forms or company values.

## Read-only readiness gate

From `css_backend` run:

```powershell
npm run readiness:forms -- --db exact_tenant_database_name
```

The command requires an explicit database name, performs no writes, emits JSON, and exits non-zero when required migrations/tables/catalogue keys are absent, a draft contains blocking shortcode fields, or generation artifacts are orphaned.

Record its complete JSON output in the deployment evidence for each tenant. Counts are informational and must be compared with that tenant's approved inventory.

## Tenant acceptance

For representative forms already loaded in the tenant database, verify:

1. Only that tenant's forms appear in the library.
2. Insert Field shows active definitions from that tenant database.
3. Existing legacy aliases open unchanged and show canonical replacement warnings.
4. Unknown or retired placeholders cannot be saved/published.
5. A saved form can create a draft, and a valid draft can publish.
6. One company-only form generates deterministic HTML, PDF, and DOCX.
7. One director appointment/resignation form resolves the selected tenant official without an event link.
8. One allotment/transfer/shareholder form resolves only tenant-local transaction data.
9. Artifact history, authorized download, and stored-snapshot regeneration work for the same tenant.
10. A user routed to a different tenant cannot discover the first tenant's forms, versions, runs, or artifacts.

## Rollback and recovery

- Prefer application rollback plus database restore when a migration has completed and tenant writes have resumed.
- Do not blindly execute all migration `down` operations after generation data exists; later downs remove version/run/artifact structures and may make stored outputs unreachable.
- Before restore, retain deployment logs and failed readiness output. Restore the exact tenant backup, restore the matching application release, then rerun the read-only gate.
- Artifact files created after the backup must be reconciled with restored `document_store` and artifact rows. Do not bulk-delete shared upload roots.

## Sign-off evidence

Capture tenant name, release identifier, migration output, readiness JSON, form inventory comparison, representative form IDs, generated artifact hashes, cross-tenant isolation result, rollback owner, and business approver. A tenant is ready only after every mandatory check passes; passing one tenant does not approve another.
