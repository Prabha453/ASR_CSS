# Compliance Form Automation — Delivery Plan

Status: Active  
Started: 24-Aug-2026  
Specification: `docs/Compliance-Form-Auto-Mapping-Specification.md`  
Discovery record: `docs/Compliance-Form-Phase-0-Discovery.md`

## Delivery objective

Deliver one common document-generation implementation and canonical shortcode catalogue to every tenant. HTML and DOCX templates use the same implementation, while each tenant sees only forms and outputs stored in its own database. Forms are tenant-wide templates shared by all companies inside that tenant database; they are not owned by, or automatically linked to, compliance-event records. The pipeline must resolve current-database data, preserve immutable snapshots, generate and store outputs, and later provide batch generation and provider-neutral e-signature.

The global tenant form catalogue covers statutory and corporate transaction families including Form 45; AGM and annual return forms; director appointment/resignation forms; and shareholder/share forms such as allotment, transfer, UBO, buyback, and capital reduction. A generation run selects a company and any required transaction/person context, but the template remains global within that tenant.

The first production vertical slice is Share Allotment. Work on additional document families begins only after that slice passes source-to-output comparison and regeneration tests.

## Working rules

1. Database and actor identity always come from trusted authenticated context.
2. Published template versions and generation snapshots are immutable.
3. Shortcodes are registered canonical data keys, not presentation instructions.
4. HTML and DOCX use the same registry, resolver, schema, snapshot, storage, and history pipeline.
5. Unknown required fields block publication or generation; missing values are never silently replaced with empty strings.
6. External providers are accessed through interfaces and disabled capability flags until approved.
7. Each phase must satisfy its exit gate before dependent production work starts.
8. Generated forms are stored as company documents and generation artifacts; no automatic `company_event` or `company_event_documents` linkage is created.

## Phase construction

| Phase | Outcome | Depends on | Status |
|---|---|---|---|
| 0. Discovery and security | Trusted foundations and approved rendering direction | None | In progress |
| 1. Template and shortcode foundation | Governed, versioned HTML/DOCX templates | Phase 0 decisions | In progress |
| 2. Dynamic generation popup | One schema-driven selection and preview UI | Phase 1 schemas | Not started |
| 3. Share Allotment vertical slice | First end-to-end DOCX/PDF generation | Phases 1–2 | Not started |
| 4. Remaining tenant forms | Additional document families within each client DB | Phase 3 | Not started |
| 5. Batch operations | Observable multi-template packaging | Phase 3; queue ADR | Not started |
| 6. E-sign foundation | Generate-and-send envelope workflow | Phase 3; provider ADR | Not started |
| 7. E-sign operations | Operational workspace and recovery | Phase 6 | Not started |
| 8. Audit and production hardening | Complete compliance timeline and production readiness | All applicable phases | Not started |

## Phase 0 — Discovery, security, and rendering decisions

### Artifacts

- Current-state inventory and gap report.
- Threat model covering actor spoofing, tenant isolation, upload routing, document ingestion, template injection, and snapshot sensitivity.
- Database-context contract for HTTP requests.
- Tenant-context design for generation workers and webhooks without changing authentication/login.
- DOCX sample inventory and canonical field-mapping catalogue.
- ADR: DOCX template engine.
- ADR: HTML-to-DOCX renderer.
- ADR: DOCX-to-PDF converter and deployment fonts.
- Rendering proof-of-concept report with comparison fixtures.

### Work packages

1. Bind authentication tokens to their database and reject route/claim mismatches.
2. Remove payload actor and database-routing authority from Form Builder.
3. Move database connection selection behind safe token inspection.
4. Define non-HTTP routing envelopes and destination authorization.
5. Inspect all authoritative DOCX regions, fields, loops, tables, images, and signature anchors.
6. Evaluate renderer candidates against the authoritative samples.

### Exit gate

- Cross-database denial and actor-spoofing tests pass.
- Required sample documents and approved expected outputs are available.
- Renderer and converter ADRs are approved with visual evidence.
- Threat model has no unresolved critical finding.

## Phase 1 — Template and shortcode foundation

### Artifacts

- Shortcode registry, alias, and audit tables.
- Template-version, parsed-field, field-schema, source-file, and provenance tables.
- Migration/backfill report for legacy merge fields and popup fields.
- Administrator Shortcode Library API and UI.
- Universal editor updates for explicit `HTML` and `DOCX` source modes.
- DOCX upload analyser and publication validator.

### Work packages

1. Create canonical shortcode definitions with case-insensitive uniqueness.
2. Add allow-listed resolver domains and paths; prohibit SQL and executable expressions.
3. Implement duplicate and alias-collision detection.
4. Add draft, published, and retired template lifecycle.
5. Make published versions immutable and content-hashed.
6. Parse HTML and supported DOCX regions for placeholders and safe blocks.
7. Store versioned popup schemas and dependency graphs.
8. Preserve compatibility with existing Form Builder CRUD during migration.

### Exit gate

- An administrator can register and audit a non-duplicate shortcode.
- An author can reuse the shortcode in differently styled HTML and DOCX templates.
- Unknown or malformed required placeholders prevent publication.
- A published version cannot be mutated.

## Phase 2 — Schema-driven generation popup

### Artifacts

- `FormPopupSchemaService`.
- Allow-listed option-resolver registry.
- Common React generation modal/drawer.
- Preview and server-side validation APIs.
- Dependency-graph validator.

### Work packages

1. Render all supported controls from versioned field schemas.
2. Resolve directors, alternate directors, secretaries, shareholders, share classes, and events from the current authorized database.
3. Implement dependency loading such as shareholder to authorized shares.
4. Clear stale child selections and protect against stale responses.
5. Support server search, pagination, required/optional dates, sensitivity labels, and manual overrides.
6. Merge common canonical fields for multi-template selection.
7. Re-authorize and re-resolve all selections during preview and generation.

### Exit gate

- Different templates render through the same component without template-specific popup code.
- Manipulated, stale, or cross-company dependent IDs are rejected server-side.
- Required unresolved fields block submission with field-level messages.

## Phase 3 — Share Allotment vertical slice

### Artifacts

- Approved Share Allotment Version 4 template package.
- Generation run, generated-document, snapshot, and status-history tables.
- Server-side mapping and calculation profile.
- DOCX renderer and PDF conversion adapters.
- Preview, generate, download, save, tag, history, and retry APIs/UI.
- Golden source-to-output comparison fixtures.

### Work packages

1. Map company, directors, allottees, share class, quantity, issue price, consideration, dates, and signature roles.
2. Implement immutable selection and resolved-value snapshots with source labels.
3. Add idempotent generation state transitions and output hashing.
4. Generate DOCX and PDF through approved adapters.
5. Store both outputs in `document_store`.
6. Store outputs as company documents without linking them to `company_event` or `company_event_documents`.
7. Regenerate from the stored snapshot without reading changed master data.
8. Display the run in tenant-wide Generated Forms history.

### Exit gate

- Approved DOCX/PDF comparisons pass.
- Repeating allottees/shares and calculated money values are correct.
- The same idempotency key cannot create duplicate outputs.
- Stored-snapshot regeneration produces the expected content and hashes.

## Phase 4 — Remaining tenant-local forms

### Artifacts

- Remaining mapped form packages and comparison fixtures.
- Tenant-local mapping profiles and resolver coverage for each document family.
- Per-template migration and output-comparison reports.
- Tenant-local template management UI enhancements.

### Exit gate

- Each client database can independently publish and generate its own forms.
- No form, version, shortcode mapping, or generated output is shared between clients.
- Existing tenant templates remain locally editable according to their lifecycle and permissions.

## Phase 5 — Batch generation and operations

### Artifacts

- Durable job and database-routing envelope implementation.
- Multi-template runs, combined PDF, ZIP packaging, progress, cancellation, and retry.
- Readiness matrix, partial-failure report, cleanup policy, and metrics.

### Exit gate

- Batch runs remain database-isolated and observable.
- Successful outputs remain downloadable when sibling outputs fail.
- Retries do not duplicate documents or package entries.

## Phase 6 — E-sign foundation

### Artifacts

- Approved provider ADR and adapter implementation.
- Versioned settings profiles and rendered-message snapshots.
- Envelope, document, recipient, event, webhook, and reminder records.
- Verified idempotent webhook processing.
- Unsigned, signed, and certificate document storage and compliance linkage.

### Exit gate

- Users can generate, send, monitor, remind, cancel, and complete an envelope.
- Sequential and parallel signing flows pass.
- Duplicate and out-of-order callbacks cannot corrupt envelope state.

## Phase 7 — E-sign operations

### Artifacts

- E-sign Forms workspace and dashboard.
- Envelope detail timeline, downloads, filters, and recovery actions.
- Callback-health monitoring and reconciliation jobs.
- Optional notification-channel controls after consent/privacy approval.

### Exit gate

- Operations can identify and recover stuck or failed envelopes without direct database editing.

## Phase 8 — Compliance audit and production hardening

### Artifacts

- Append-only `compliance_event_activities` projection and activity writer.
- Event audit icon, timeline, table, journey, detail, summary, and export APIs/UI.
- Proven-facts-only backfill and reconciliation report.
- Security, isolation, accessibility, load, recovery, retention, scanning, and rendering test reports.
- Legacy retirement and migration completion report.

### Exit gate

- Every required event action appears in a readable, immutable, authorized timeline.
- Production acceptance suites pass at target load.
- Deprecated hard-coded merge arrays, template-specific popups, legacy e-sign copies, and unsafe routing/audit fallbacks are removed.

## Cross-phase dependency map

```text
Phase 0 security + renderer decisions
          |
          v
Phase 1 template/shortcode foundation
          |
          v
Phase 2 common popup
          |
          v
Phase 3 Share Allotment vertical slice
       /          |             \
      v           v              v
Phase 4       Phase 5         Phase 6
forms/library  batch           e-sign
                                  |
                                  v
                               Phase 7
       \          |             /
        \         |            /
         v        v           v
       Phase 8 audit and production hardening
```

## Current execution board

| ID | Work item | Status | Evidence/blocker |
|---|---|---|---|
| P0-01 | Inventory Form Builder and related storage/data paths | Done | Phase 0 discovery record |
| P0-02 | Remove client-controlled actor IDs | Done | Form actor security tests |
| P0-08 | Catalogue six authoritative DOCX samples | Blocked | Required samples are absent from repository |
| P0-09 | Renderer and converter experiments | Blocked | Depends on P0-08 |
| P0-10 | Threat-model review and Phase 0 gate | Queued | Depends on P0-08 and P0-09 |
| P1-01 | Add tenant-local shortcode registry schema and canonical normalization | Done | Migration, models, and domain tests |
| P1-02 | Add Shortcode Library service with alias/canonical collision protection | Done | Transactional service and normalization tests; not exposed by routes yet |
| P1-03 | Add administrator-only Shortcode Library API | Done | Read for authenticated users; writes limited to existing ADMIN/SUPER_ADMIN roles |
| P1-04 | Add common shortcode deployment catalogue | Done | 24 model-backed definitions and allow-listed resolver contracts; no tenant form data |
| P1-05 | Implement company/event scalar resolver execution | Done | Registry-backed current-tenant resolver with explicit unresolved reasons |
| P1-06 | Implement officials and shares resolver execution | Done | Current officials grouped by role and company share-capital snapshot |
| P1-07 | Add resolver preview API and field-level readiness results | Done | Read-only tenant form preview with blocking reasons and formatter checks |
| P1-08 | Add immutable template versions and parsed-field records | Done | Draft snapshots, stable hashes, parsed validation, publish/retire lifecycle |
| P1-09 | Make preview consume a published version snapshot | Done | Runtime preview requires the tenant-local published snapshot; explicit draft preview remains available to authors |
| P1-10 | Add versioned popup/generation field schema and dependency validation | Done | Canonical legacy conversion, immutable published schema, stable hash updates, and circular/missing dependency rejection |
| P2-01 | Add current-tenant popup option resolver API | Done | Published-schema-gated officials, shareholders, events, and dependent shareholder-ledger options with bounded search |
| P2-02 | Add popup submission validation and stale-selection rejection | Done | Published-schema validation re-authorizes remote IDs, types, required values, static options, and parent-child selections during preview |
| P2-03 | Build the reusable schema-driven generation popup UI | Done | One responsive modal renders published sections/controls, selects a company, loads dependent tenant options, clears descendants, and runs server preview |
| P2-04 | Add popup remote search, pagination, and multi-template schema merging | Done | Bounded server pages, remote search/load-more, conflict-safe schema merging, source-form tracking, and per-form batch preview validation |
| P3-01 | Add immutable generation runs and idempotency records | Done | Tenant-local READY runs persist published template/hash, validated selections, trusted resolved values, schema, actor, and replay-safe request identity |
| P3-02 | Add deterministic HTML snapshot rendering | Done | Integrity-checked run snapshots render escaped scalars, safe formatters, and collection blocks into one immutable hashed HTML artifact |
| P3-03 | Connect generation popup to run preparation and HTML artifact preview | Done | Single/batch UI creates replay-safe runs, renders one stored artifact per form, and previews selected artifacts in sandboxed iframes |
| P3-04 | Add PDF rendering and document-store persistence | Done | Claimed generation runs render through a controlled browser, hash raw PDF bytes, persist tenant-scoped files/document rows, and retain retryable failures |
| P3-05 | Add PDF generation/download actions and generation history UI | Done | The generation popup can render and download stored PDFs for single or batch runs, while the template list exposes safe run/artifact history without returning captured form data |
| P3-06 | Add tenant-authorized artifact downloads and audit events | Done | Authenticated tenant routes resolve only PDF artifacts in the current tenant database, hide raw storage paths, reject unsafe local paths, and audit generation/download success and failure without changing login behavior |
| P3-07 | Add deterministic DOCX artifact rendering and persistence | Done | Immutable HTML artifacts produce repeatable OOXML packages with fixed metadata, tenant document-store records, SHA-256 hashes, audited generation, protected storage paths, and authorized downloads |
| P3-08 | Add tenant-local Share Allotment mapping foundation | Done | Published schemas can select a company-authorized allotment and snapshot its date, repeating allottees, share class, quantity, issue price, consideration, currency, and trusted calculated totals |
| P3-09 | Validate Share Allotment V4 golden DOCX/PDF outputs | Blocked — input required | Requires the authoritative Share Allotment Version 4 DOCX plus approved expected DOCX/PDF outputs; these files are not present in the workspace |
| P3-10 | Regenerate outputs from immutable stored snapshots | Done | History can create an idempotent lineage-linked run, copy only captured template/selection/resolution snapshots, and rerender the source formats without reading changed master data |
| P3-11 | Expand global form-family transaction selectors | Done | Global tenant templates can use company-authorized share-transaction selectors with family allowlists and official-record selectors with role/current/ceased filters; resolved party, movement, UBO, appointment, resignation, share, and consideration values are snapshotted without compliance-event linkage |
| P3-12 | Expose global context-source filters in the template editor | Done | Popup rows now preserve legacy settings while authors configure modern controls, required values, dependencies, official roles/current-or-ceased status, and allowed share transaction families through the common editor |
| P3-13 | Replace hard-coded editor merge fields with the shortcode registry | Done | The common editor now loads active canonical definitions from the current tenant database, groups and searches them by source domain, identifies collection fields, and inserts canonical keys; existing saved legacy placeholders remain unchanged |
| P3-14 | Surface template shortcode validation in the editor | Done | Before any editor save, tenant-local registry validation blocks unknown, retired, and invalid-format placeholders while displaying compatible legacy aliases with their canonical replacements |
| P3-15 | Add draft-version publication controls to the editor | Done | Authenticated authors can create an immutable draft from the saved tenant form, review lifecycle state, field validation counts and snapshot hash, then publish a valid draft while prior published versions retire automatically |
| P3-16 | Complete tenant deployment readiness checks | Local gate passed; tenant execution pending | The backed-up local `asr_css` database has migrations 01-11, all seven required tables, 43 active common keys, no blocking drafts, and no orphan artifacts; it contains zero active forms, so form inventory/acceptance must still run independently in every real tenant database |

## Definition of done for every work item

- Implementation and migration are reviewed together.
- Authorization and database isolation are enforced server-side.
- Positive, negative, idempotency, and failure-path tests pass as applicable.
- Sensitive values are redacted from logs and bounded in snapshots.
- API/UI behavior and operational recovery are documented.
- The execution board and relevant architecture artifact are updated.
