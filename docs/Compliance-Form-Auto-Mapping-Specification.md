# Compliance Form Auto-Mapping and Document Generation

> **Implementation scope clarification — 24-Aug-2026:** Every client has its
> own database and owns its own forms. The application code, canonical
> shortcode catalogue, and resolver behavior are common and deployed
> consistently to every tenant. Each tenant sees only the forms, template
> versions, mappings, and generated outputs stored in its own database; there
> is no runtime cross-database access. Existing authentication, login, Redis, port, and
> database-selection functionality must remain unchanged. References below to
> a Base Library, Master Library, cross-database form distribution, or copying
> templates between databases are excluded from the approved implementation
> scope. Locally prepared forms may be deployed to selected tenant databases;
> deployment does not create a live shared library or cross-database reference.

Status: Proposed implementation specification  
Scope: Form Builder, company/event data mapping, document generation, batch download, e-signature, and compliance tagging

## 1. Objective

Extend the existing Form Builder into a production document automation module that can:

1. Build and version reusable form templates.
2. Insert registered shortcodes (merge fields) into HTML or DOCX templates.
3. Store and operate templates inside the current entity database, with no redundant `entity_id` column on `forms`.
4. Copy reusable published templates from a controlled Base Library into one or many entity databases.
5. Open one common schema-driven popup to select the event, directors, secretary, shareholders, transaction values, and other dynamic inputs.
6. Resolve shortcodes from current-database records and show a preview before generation.
7. Generate DOCX, PDF, or both.
8. Download individual or packaged documents, or send the same generated output for e-signature.
9. Track e-sign recipients, delivery, reminders, signing sequence, completion, signed files, and certificates.
10. Store generated and signed documents in the existing document store and tag them to the applicable compliance event.
11. Preserve the exact source-data snapshot, template version, origin-library version, and audit history used for every generated document.
12. Present a complete, understandable audit timeline for every compliance event from creation through filing and completion.
13. Provide an administrator-managed shortcode library where canonical shortcodes are manually registered, tagged to trusted data domains, searched, reused, and protected from semantic duplicates.
14. Support two form-authoring modes through the same mapping and generation engine: HTML Editor templates rendered to DOCX/PDF, and uploaded DOCX templates mapped directly to dynamic data for high-fidelity output.

## 2. Current implementation assessment

### 2.1 Available today

- The React template editor supports rich HTML content, merge-field insertion, layout/orientation/margins, categories, assigned users, popup-field sections, manual file upload, duplication, Save As, and a basic E-sign copy type.
- The backend persists templates in `forms`, including `form_content`, `popup_fields`, `form_type`, `template_id`, layout settings, country, and document metadata.
- Popup fields are separately configurable through `form_pop_up_fields`.
- Template create, update, get, list, and soft-delete APIs exist under `/form-template`.
- Company, official, event, compliance checklist, and document tables already provide most source data and final document linkage.
- `document_store` already supports tenant scoping, entity links, versioning, hashes, local/S3 storage, and `company_event_id`.

### 2.2 Important gaps

| Area | Current state | Required state |
|---|---|---|
| Shortcodes | Hard-coded frontend arrays; inconsistent casing | Database registry with stable canonical keys, data types, resolver names, and aliases |
| Template versions | Save As/duplicate creates related rows informally | Immutable published versions with draft/published/retired lifecycle |
| Real-data mapping | No central resolver | Server-side mapping engine that reads company, officials, shares, and event data |
| Generation | No generation API or run record | Idempotent generation pipeline with preview, validation, and output records |
| DOCX/PDF | No rendering dependency is installed | Add a reviewed DOCX engine and PDF conversion/rendering service |
| Batch/ZIP | Not implemented | Asynchronous batch job with progress and downloadable ZIP |
| E-sign | `form_type=1` only creates a template copy | Provider-neutral envelope, recipient, event, callback, and signed-document workflow |
| Compliance link | Possible through existing columns but not orchestrated | Generated/signed document creates or updates `company_event_documents` and links `document_store.company_event_id` |
| Audit | Template timestamps only | Snapshot of resolved values, selected records, output hash, status history, and actor |
| Actor identity | Current form controller helper reads IDs from request body despite its `req.user` comment | Actor must come only from authenticated server context; ignore client-supplied audit IDs |
| Database scope | Templates are already stored in the request-selected entity database | Keep `forms` database-scoped; do not add `entity_id` merely for template ownership |
| Base Library | `default_library` exists but there is no governed distribution lifecycle | Publish once and copy an immutable template package into one or many authorized entity databases |
| Generation popup | Existing `popup_fields` can display configured inputs but generation is template-specific and inconsistent | One reusable schema-driven popup for every template and output action |
| E-sign settings | Legacy settings/screens exist conceptually but are not a provider-neutral workflow | Versioned profiles for notifications, reminders, signing order, messages, provider settings, and audit |
| Shortcode administration | Fields are embedded in hard-coded frontend lists | Administrators manually create canonical definitions, select a trusted source domain/path, and reuse existing definitions instead of creating duplicates |
| Template authoring | HTML editing and uploaded documents are mixed with workflow type | Two explicit source modes—`HTML` and `DOCX`—using the same shortcode registry, popup schema, resolver, validation, snapshot, and generation history |

The existing template editor should be retained and evolved. The generation and e-sign functions should be new bounded services rather than added to the existing `FormService` save method.

`form_type` currently mixes template source and intended workflow (`Form Builder`, `E-Sign`, `Manual`). In the new model these must be separate: `source_type` describes HTML/DOCX, while e-signature is an action/status applied to a generated document.

### 2.3 Database-scoped template ownership

Each entity operates in its own database. The authenticated request context selects that database before Form Builder services execute. Therefore:

- `forms` does not require an `entity_id` column for ownership.
- `form_slug` may remain unique within a database; the same slug may exist in another entity database.
- All template, generation, document, and e-sign queries use models from the trusted current-database context.
- A client-supplied `port_name`, database name, `created_by`, or `updated_by` must never independently determine database or actor scope.
- Cross-database foreign keys are prohibited.

Reusable templates live in a controlled **Base Library** database. Publishing to entities means copying a complete, checksummed template package into each authorized destination database. It is a copy operation, not a destructive move and not a live cross-database reference.

The copied package includes the logical template, published version, parsed fields, popup schema, event mappings, e-sign profile defaults, source DOCX/HTML, referenced assets, and a manifest. Destination rows receive local primary keys while preserving a stable `library_template_key`, source version, and content hash.

## 3. Terminology and lifecycle

- **Template**: Logical form, for example “AGM Notice”.
- **Template version**: Immutable published content used for generation.
- **Shortcode definition**: Registered field such as `{{company.name}}`.
- **Mapping profile**: Optional event/jurisdiction-specific defaults and required selections.
- **Generation run**: One user request in one trusted database context against one or more template versions. Cross-database bulk work is an orchestration of separate runs.
- **Generated document**: One output for the current database/company context, event, template version, and format.
- **Envelope**: E-signature transaction containing one or more documents and recipients.
- **Compliance tag**: Link from a generated/signed output to `company_event` and optionally to a `company_event_documents` checklist row.

Recommended template lifecycle:

`DRAFT -> PUBLISHED -> RETIRED`

Recommended generation lifecycle:

`DRAFT -> VALIDATING -> READY -> GENERATING -> GENERATED -> SENT_FOR_SIGNATURE -> PARTIALLY_SIGNED -> SIGNED`

Failure/cancellation states: `VALIDATION_FAILED`, `GENERATION_FAILED`, `SIGNATURE_DECLINED`, `EXPIRED`, `CANCELLED`.

## 4. Proposed user experience

### 4.1 Database-scoped Template Library

The Template Library lists templates stored in the current entity database. A separate privileged Base Library view manages reusable templates and distribution to entity databases.

Recommended columns:

| Column | Purpose |
|---|---|
| Select | Select local templates for a package or generation run |
| Template | Name, template code, version |
| Origin | Local or Base Library, source version, update available |
| Applies to | Country, jurisdiction, event types, company types |
| Type | HTML builder or uploaded DOCX |
| Output | DOCX/PDF availability |
| Mapping health | Valid fields, warnings, missing fields |
| Last published | Version/date/user |
| Actions | Generate, Preview, Edit draft, Versions, More |

Primary toolbar actions:

- `Generate forms`
- `New template`
- `Import from Base Library`
- `Generation history`
- `E-sign status`

Every active/published local template row must have a clearly visible **Generate** button. Base Library administrators additionally receive `Copy to databases`, distribution status, retry, and version comparison actions. Copying never overwrites a locally customized published version silently.

### 4.2 One common dynamic Generate Form popup

Use one reusable large modal on desktop and a full-screen drawer/page on smaller screens. The UI is generated from the selected published template version's `form_template_fields` schema. Do not implement a separate React popup for each document type.

The popup supports `select`, `multi_select`, `radio`, `checkbox`, `date`, `datetime`, `text`, `textarea`, `number`, `money`, `email`, `address`, `file_reference`, and read-only calculated controls. A field definition includes its canonical key, label, help text, control type, required status, option source, selection limits, default rule, dependency rule, sensitivity, display order, and validation rules.

#### Dependent fields and remote option loading

A `select`, `multi_select`, `radio`, or checkbox group may control another field whose options are loaded asynchronously from the backend. The child field declares its parent dependencies and an allow-listed `option_source`; a template must never contain its own URL, SQL statement, or executable callback.

For example, after a user selects a shareholder, load only the shares related to that shareholder and display them using the configured child control: single select, multi-select, radio group, or checkbox group.

```json
{
  "key": "selected.shareholder_id",
  "label": "Shareholder",
  "control": "select",
  "option_source": "CURRENT_SHAREHOLDERS",
  "required": true
},
{
  "key": "selected.share_ids",
  "label": "Related shares",
  "control": "checkbox_group",
  "option_source": "SHARES_BY_SHAREHOLDER",
  "depends_on": ["selected.shareholder_id"],
  "multiple": true,
  "required": true
}
```

Required behavior:

1. Keep the child field disabled until every required parent has a value.
2. When a parent changes, clear the child's previous selection immediately so stale shares cannot be submitted for another shareholder.
3. Load child options through `POST /form-generations/resolve-options`, passing the template version, child field key, event context when applicable, and selected parent values. Database scope comes only from trusted server context.
4. The backend re-authorizes and validates every parent ID and returns only records belonging to the current authorized database/company context.
5. Display distinct loading, empty, and failure states, with a retry action after failure.
6. Debounce searchable requests, cancel or ignore superseded requests, and prevent an older response from replacing options for the latest parent value.
7. Support server search and pagination for large option sets. Cache only non-sensitive options during the open popup and invalidate dependent caches whenever a parent changes.
8. Re-resolve and validate all dependent selections during preview and generation. Frontend filtering is never the final authorization or integrity check.
9. Multi-level dependency chains are allowed, but circular dependencies must block template validation/publication.

Option sources are allow-listed backend resolvers such as `CURRENT_DIRECTORS`, `ACTIVE_AND_INACTIVE_DIRECTORS`, `CURRENT_SECRETARIES`, `CURRENT_SHAREHOLDERS`, `SHARE_CLASSES`, and `COMPANY_EVENTS`. Templates never provide SQL or executable resolver code.

Dependent controls are supported. For example, `Director or Shareholder` determines which official list is loaded. Empty result sets display a clear message such as `No active alternate directors found`; they are never represented as a selectable fake value.

#### Step 1 — Forms and context

- Preselect the row’s template or allow several templates.
- Show version, event applicability, available formats, and mapping-health warnings.
- Use the authenticated current database as the entity scope; do not ask the user to select the same entity again for ordinary generation.

#### Step 2 — Compliance event

- Event selection is mandatory when a template has an event scope or when `Tag to compliance` is enabled.
- Filter events in the current database using the template’s allowed event types.
- Display event name, period/FYE, due date, extended due date, status, and event ID.
- Auto-select an unambiguous matching event by event slug and period; require correction for missing or ambiguous matches.

#### Step 3 — People and dynamic data

- Auto-load current directors, secretary, shareholders, representatives, and company contacts from the current authorized database/company context.
- Apply template selection rules, for example all current directors or one selected secretary.
- Allow generation-only overrides without changing master data; record every override in the selection/resolved snapshot with its actor and source.
- Render existing `popup_fields` here as structured manual inputs.
- Clearly mark each value as `Master data`, `Event data`, `Calculated`, or `Manual override`.
- Treat dates as actual date controls. `Blank` is not valid for a required date; an optional date uses a separate `Leave blank` choice.
- For multiple templates, merge fields by canonical key, show common fields once, and group template-specific fields by template.

#### Step 4 — Validate and preview

- Show a template-by-output readiness matrix for the current database/company context. Cross-database orchestration shows a separate row per database-scoped run.
- Block generation for required unresolved fields.
- Warn, but allow generation, for optional unresolved fields.
- Preview each output and show the resolved-value source.
- Never silently replace a missing field with an empty string.

#### Step 5 — Output and action

- Format: DOCX, PDF, or both.
- Package: separate files, one company folder, combined PDF, or ZIP.
- Within an ordinary database-scoped run, package by template/format. `ZIP_BY_COMPANY` is used only by an authorized cross-database orchestrator that assembles already-isolated run outputs.
- File name preview, for example `2027_AGM_ACME_PTE_LTD_Notice_v2.pdf`.
- Action: Download only, Save to company documents, Tag to compliance, or Send for e-signature.
- `Send for e-signature` expands recipient, signing-order, subject/message, reminder, expiry, and authentication fields without creating an e-sign copy of the template.

The popup footer uses explicit actions: `Preview`, `Generate & Download`, `Generate & Save`, and `Generate & Send for e-sign`. Disable submission until required fields validate and protect every submission with an idempotency key.

### 4.3 History pages

Add two screens:

1. **Generated Forms** — run status, company, template version, event, formats, creator, output links, retry, and audit details.
2. **E-sign Forms** — envelope status, recipients, sent/viewed/signed dates, reminders, expiry, signed file, certificate, and compliance tag.

### 4.4 Universal Form Editor and source modes

One Form Editor manages all form families. At template creation, the author selects a source mode:

1. **HTML Editor** — create rich HTML content, insert registered shortcodes/blocks, configure page layout, preview it, and render it to DOCX and/or PDF.
2. **Uploaded DOCX Template** — upload a high-fidelity DOCX, detect its placeholders, map them to registered shortcodes, validate loops/conditions/signature anchors, preview with sample data, and generate a mapped DOCX and/or converted PDF.

Use uploaded DOCX for statutory forms, constitutions, certificates, or other documents whose tables, headers/footers, text boxes, pagination, and precise Word formatting are difficult to reproduce reliably in the HTML editor.

Both modes use the same canonical shortcode definitions, aliases, formatters, popup field schema, resolver context, validation rules, resolved-data snapshot, generation records, document storage, and e-sign flow. `source_type` changes rendering behavior only; it must not create separate business-data mappings.

The editor's shortcode browser provides group and text search, shows data type/source/sensitivity/example, and inserts only registered keys. It also provides collection/condition block insertion without requiring authors to type syntax manually. Formatting remains template-local: font, size, capitalization, bold, alignment, spacing, table layout, and page breaks are not encoded by creating a new shortcode.

## 5. Canonical shortcode design

Use lowercase dotted canonical keys wrapped in double braces:

```text
{{company.name}}
{{company.registration_number}}
{{event.due_date|date:DD-MMM-YYYY}}
{{selected.secretary.name}}
```

Do not create new mixed-case keys such as `Company_name`. Preserve current keys only as aliases during migration.

### 5.1 Shortcode Library administration

The **Shortcode Library** is the controlled catalogue used by both source modes. Authorized administrators manually create and maintain shortcode definitions through UI/API. A form author may search and reuse a definition but cannot create an unregistered key merely by typing it into a template.

When creating a shortcode, the administrator must provide:

- canonical lowercase dotted key and human-readable label
- source domain: `COMPANY`, `OFFICIAL`, `SHARE`, `EVENT`, `COMMON`, `TRANSACTION`, `MANUAL`, `CALCULATED`, `DOCUMENT`, or `SYSTEM`
- resolver and allow-listed resolver path; never SQL or executable expressions
- value type, collection flag, sensitivity, description, example value, and allowed format options
- selection behavior where applicable, such as all current directors, select one secretary, or select many shareholders
- lifecycle status and aliases for proven legacy keys

Official definitions are further tagged by role/capability, for example director, alternate director, secretary, shareholder, representative, auditor, or contact. Share definitions identify share/allotment/capital sources. Event definitions identify company-event fields. Common definitions cover reusable safe values such as current date or formatted address. Transaction/manual definitions represent values collected by the dynamic generation popup and stored in its snapshot.

Duplicate prevention rules:

1. Canonical `key` is unique, case-insensitively, after trimming and normalization.
2. Alias is unique, case-insensitively, across both canonical keys and all aliases.
3. Before save, search for the same normalized label, resolver/path, source domain, role, and data type and warn about likely semantic duplicates.
4. If the same data already exists under another key, reuse that definition and add a justified alias when required.
5. Referenced definitions cannot be hard-deleted or have their resolver/type changed incompatibly. Deprecate them and create a replacement/migration rule.
6. Creating or changing a definition writes an audit record with actor and old/new values.

Shortcode identity is independent of visual presentation. For example, `{{company.name}}` remains one definition whether a template renders it uppercase, bold, 10 pt, 18 pt, centered, or inside a table. Presentation is expressed by HTML/DOCX styling or an allow-listed formatter, not by duplicate keys such as `company_name_bold` or `CompanyNameUppercase`.

Collections follow the same rule. One `directors` collection supports many designs:

```handlebars
{{#each directors}}
  {{name}}
{{/each}}
```

The HTML editor may style that block as a list or table. A DOCX template may place the loop markers around a styled Word table row. The resolver supplies the same collection data in both cases. A loop never carries executable UI code; its registered metadata tells the editor which safe block controls and selection inputs to display.

### 5.2 Supported value types

- `text`, `number`, `money`, `date`, `boolean`
- `entity_reference`, `official_reference`, `event_reference`
- `image`, `signature`, `rich_text`
- `collection` for repeated directors/shareholders/agenda rows

### 5.3 Field examples and real sources

| Canonical shortcode | Source |
|---|---|
| `company.id` | `entities.entity_id` |
| `company.name` | `entities.name` |
| `company.former_name` | `entities.former_name` |
| `company.client_number` | `entities.client_no` |
| `company.type` | `entities.company_type_id` plus company-type master |
| `company.registration_number` | Preferred active registration identification; resolver must define precedence |
| `company.incorporation_date` | `entity_company_details.company_incorporation_date` |
| `company.financial_year_end` | `entity_company_details.company_fin_date` |
| `company.country` | `entity_company_details.country` |
| `company.jurisdiction` | `entity_company_details.jurisdiction_id` plus jurisdiction master |
| `company.ssic.primary.description` | `entity_company_details.ssic_user_description` or SSIC master |
| `event.id` | `company_event.company_event_id` |
| `event.name` | `company_event.event_id` plus event-name master |
| `event.slug` | `company_event.event_slug` |
| `event.period_start` | `company_event.period_start` |
| `event.period_end` | `company_event.period_end` |
| `event.fye` | `company_event.fye_date`/`actual_fye`, using documented precedence |
| `event.due_date` | Effective date: extended due date when applicable, otherwise due date |
| `event.original_due_date` | `company_event.due_date` |
| `event.extended_due_date` | `company_event.extended_due_date` |
| `event.held_date` | `company_event.held_date` |
| `event.venue` | `company_event.venue` |
| `event.chairman` | `company_event.meeting_chairman` |
| `directors` | Current, non-deleted `officials` whose official-master role is Director |
| `secretaries` | Current, non-deleted `officials` whose official-master role is Secretary |
| `shareholders` | Current, non-deleted `officials` whose role is Shareholder, enriched by individual/contact/identification data |
| `shares` | Active `entity_shares`, enriched with share-class master |
| `selected.director` | Wizard selection stored in the generation snapshot |
| `selected.secretary` | Wizard selection stored in the generation snapshot |
| `input.*` | User-entered popup/manual values stored in the generation snapshot |

The final registration-number, address, identification, and role joins must be implemented in resolver classes and covered by integration tests. Templates must never contain SQL or direct table/column expressions.

### 5.4 Collections and conditions

Support safe template constructs, not arbitrary JavaScript:

```handlebars
{{#each directors}}
  {{sequence}}. {{name}} — {{identification.masked}}
{{/each}}

{{#if event.extended_due_date}}
  Extended due date: {{event.extended_due_date|date:DD-MMM-YYYY}}
{{/if}}
```

Required helpers: date, uppercase/lowercase, title case, money, number-to-words, masked identifier, address formatting, join, and sequence.

## 6. Proposed database changes

Keep `forms` temporarily as the logical template table, then add normalized tables.

Do not add `entity_id` to `forms`. Add database-local provenance columns instead:

- `library_template_key` UUID/string nullable; stable across copied databases
- `library_version_no` nullable
- `library_content_hash` nullable
- `copied_from_library` boolean
- `copied_at`, `copied_by` nullable
- `local_customized` boolean

The Base Library and every destination database use the same migrations. Local integer primary keys are not portable identifiers.

### 6.1 `form_template_versions`

- `template_version_id` PK
- `form_id` FK/logical parent
- `version_no`
- `status` (`DRAFT`, `PUBLISHED`, `RETIRED`)
- `source_type` (`HTML`, `DOCX`)
- `source_doc_id` nullable
- `content_html` nullable
- `content_schema` JSON nullable
- layout/margin fields
- `content_hash`
- `published_by`, `published_at`, audit timestamps
- unique `(form_id, version_no)`

### 6.2 `form_shortcode_definitions`

- `shortcode_id`, `key` unique under case-insensitive normalized comparison, `normalized_key`, `label`, `normalized_label`, `group_name`, `source_domain`
- `data_type`, `resolver`, `resolver_path`, `role_tag` nullable
- `is_collection`, `is_sensitive`, `is_active`
- `selection_mode` nullable, `format_options` JSON, `description`, `example_value`
- `replaced_by_shortcode_id` nullable for deprecation/migration
- audit actor/timestamps; referenced rows are deprecated rather than deleted

### 6.3 `form_shortcode_aliases`

- Maps old keys such as `Company_name` to `company.name`.
- Alias resolution is allowed during migration; new templates only insert canonical keys.
- Store `normalized_alias` with a case-insensitive unique constraint covering aliases. The service must additionally reject collisions with canonical normalized keys in the same transaction.

To guarantee uniqueness across the two tables under concurrent requests, add `form_shortcode_names` as the namespace guard:

- `shortcode_name_id`, `shortcode_id`, `name`, `normalized_name`
- `name_type` (`CANONICAL`, `ALIAS`)
- unique `normalized_name`

Creating or changing a canonical key/alias first reserves its normalized name in this table within the same transaction. Application-only pre-save checks are useful for feedback but are not sufficient duplicate protection.

### 6.4 `form_template_fields`

- Links a template version to every parsed shortcode.
- Stores canonical key, section, label, help text, control type, required/optional status, default rule, option source, selection mode/limits, dependency rules, sensitivity, display order, and validation rules.
- Remote/dependent option metadata includes `depends_on`, allow-listed `option_source`, searchability, minimum search length, page size, empty-state text, and cache policy. It never stores an arbitrary endpoint URL.
- Template validation builds a dependency graph, rejects missing parent keys and circular dependencies, and verifies that the child option source accepts the declared parent value types.
- Rebuilt automatically whenever a draft is saved.

### 6.5 `form_template_event_mappings`

- `form_id`, `event_master_id`, country/jurisdiction/company-type constraints
- `checklist_template_id` nullable
- `selection_rules` JSON, for example `{ "directors": "ALL_CURRENT", "secretary": "SELECT_ONE" }`
- priority/status columns to resolve overlapping mappings predictably

### 6.6 `form_generation_runs`

- Run-level request: trusted database/tenant context, requested formats, packaging mode, action, status, progress, counts, error summary, actor/timestamps.
- Include an idempotency key to prevent duplicate documents when a request is retried.

### 6.7 `form_generated_documents`

- `generated_document_id`, `generation_run_id`
- `template_version_id`, `entity_id`, `company_event_id` nullable
- `event_document_id` nullable
- `format`, `status`, `doc_id` nullable
- `selection_snapshot` JSON
- `resolved_data_snapshot` JSON
- `unresolved_fields` JSON
- `output_hash`, `error_code`, `error_message`
- `supersedes_generated_document_id` nullable
- audit timestamps

The snapshot is essential: later master-data changes must not alter the meaning of an already generated or signed document.

### 6.8 E-sign tables

- `esign_envelopes`: provider, external ID, generated-document link, status, expiry, subject/message, certificate document, signed document, audit fields.
- `esign_recipients`: entity/official reference, name/email, role, signing order, status, authentication mode, sent/viewed/signed dates.
- `esign_events`: immutable provider callback/event log with unique provider event ID, payload hash, received/processed dates, and processing result.
- `esign_setting_profiles`: named, versioned settings profiles with provider, sender notification, post-sign receipt audience, CC policy, sequential-signing default, message-channel flags, reminder rule, expiry rule, and status.
- `esign_message_templates`: channel (`EMAIL`, `WHATSAPP`), subject/body, registered merge fields, locale, active/version metadata. These configure messages only; credentials are not stored here.

### 6.9 Base Library distribution tables

The Base Library database stores `form_library_distributions`:

- `distribution_id`, `library_template_key`, `library_version_no`
- trusted destination database identifier/reference
- status (`PENDING`, `COPYING`, `COPIED`, `FAILED`, `SKIPPED_CUSTOMIZED`)
- package hash, destination local `form_id` when returned
- requested/processed actor and timestamps
- error code/message, correlation ID, idempotency key

Each destination database stores `form_library_installations`:

- `installation_id`, `library_template_key`, installed library version/hash
- local `form_id` and installed template-version ID
- installed/updated actor and timestamps
- `local_customized`, latest-known library version, update status

Distribution is idempotent on destination database plus library template key plus version. Import validates the manifest and hashes before committing. Partial multi-database failures are reported per destination and are independently retryable.

The package identifies shortcodes by canonical normalized key, never by database-local `shortcode_id`. During import, each key must resolve to a compatible active destination definition. Missing definitions may be installed only from reviewed definitions included in the signed package. A conflicting destination definition with a different source domain, resolver path, data type, collection flag, or sensitivity blocks import and produces a field-level compatibility report; it must never be overwritten automatically.

All new tables must use the project’s database-scoping and audit conventions. Immutable versions, webhook events, generation snapshots, and distribution history must not be soft-deleted as a substitute for historical correction.

## 7. Backend architecture

Create services with narrow responsibilities:

- `FormTemplateVersionService` — draft, publish, clone, retire, validate fields.
- `FormLibraryDistributionService` — export signed manifests, copy published packages to authorized databases, verify/import, compare versions, and retry per destination.
- `ShortcodeRegistryService` — definitions, aliases, parsing, formatter allow-list.
- `FormSourceMappingService` — HTML insertion/validation plus DOCX placeholder detection, canonical mapping, loop/condition/signature-anchor validation, and source-mode-neutral field extraction.
- `FormPopupSchemaService` — build the common popup schema, merge multi-template fields, enforce dependencies, and resolve allow-listed option sources.
- `FormDataResolverService` — builds the real-data context for one company/event.
- Resolver modules: `CompanyResolver`, `OfficialResolver`, `ShareResolver`, `ComplianceEventResolver`, `ManualInputResolver`.
- `FormGenerationService` — validation, snapshots, rendering orchestration, document persistence, compliance linking.
- `DocumentRenderService` — provider interface for HTML/DOCX to DOCX/PDF.
- `FormBatchService` — background batch progress and ZIP assembly.
- `EsignService` and provider adapters — envelope creation/status/cancel/download.
- `EsignSettingsService` — versioned notification, reminder, channel, message-template, signing-order, expiry, and provider-profile settings.
- `EsignWebhookService` — signature verification, idempotent callbacks, final document ingestion.

Rendering and ZIP creation can be CPU/IO heavy. Do not perform a large multi-template or cross-database batch inside one HTTP request. The API should create database-scoped runs and return `202 Accepted`; workers process them and the UI polls or receives socket updates. A durable queue is recommended before production scale. The existing Redis dependency can support a queue, but queue technology should be selected during implementation.

## 8. Proposed APIs

All endpoints require authentication, trusted database/tenant scoping, permissions, validation, and audit logging.

### Templates and fields

- `GET /form-template/list`
- `POST /form-template/create`
- `PUT /form-template/update/:form_id`
- `GET /form-templates/:id/versions`
- `POST /form-templates/:id/versions/:version/publish`
- `GET /form-shortcodes?group=company&source_domain=COMPANY&search=name`
- `POST /form-shortcodes` — administrator-only manual registration with duplicate analysis
- `GET /form-shortcodes/:id`
- `PUT /form-shortcodes/:id` — compatibility validation required when referenced
- `POST /form-shortcodes/:id/deprecate`
- `POST /form-shortcodes/:id/aliases`
- `POST /form-shortcodes/check-duplicate` — exact and likely-semantic matches before save
- `POST /form-templates/:id/validate`
- `POST /form-templates/:id/docx/analyze` — detects placeholders, loops, conditions, unmapped tokens, and unsupported structures
- `PUT /form-templates/:id/docx/mappings`
- `PUT /form-templates/:id/event-mappings`
- `GET /form-templates/:id/generation-schema`
- `GET /form-templates/generation-schema?ids=12,18` — merged schema for the common popup

### Base Library

- `POST /form-library/templates/:id/publish-package`
- `POST /form-library/templates/:id/distribute` — privileged, authorized destination database references only
- `GET /form-library/distributions/:distribution_id`
- `POST /form-library/distributions/:distribution_id/retry`
- `GET /form-library/updates` — compares local installations with published library versions
- `POST /form-library/templates/:library_template_key/import` — internal trusted distribution endpoint, not a general client database switch

### Generation

- `POST /form-generations/resolve-options` — returns valid event, official, share, and dynamic-field selections from the current database.
  - Request: `template_version_id`, `field_key`, `parent_values`, optional event context, `search`, `page`, and `limit`.
  - Response: normalized `options`, pagination metadata, and dependency context echo/version used to reject stale UI responses.
- `POST /form-generations/preview` — resolves data and returns validation plus preview; does not persist output.
- `POST /form-generations` — creates an idempotent run and returns `202`.
- `GET /form-generations/:run_id`
- `GET /form-generations/:run_id/documents`
- `POST /form-generations/:run_id/retry`
- `GET /form-generated-documents/:id/download`
- `GET /form-generations/:run_id/download?package=zip`

Example generation request:

```json
{
  "template_ids": [12, 18],
  "company_event_id": 9001,
  "selected_officials": { "chairman": 41, "secretary": 52, "directors": [41, 44] },
  "inputs": { "meeting_resolution_number": "ORD-01" },
  "formats": ["DOCX", "PDF"],
  "package_mode": "ZIP_FLAT",
  "action": "TAG_TO_COMPLIANCE",
  "idempotency_key": "client-generated-uuid"
}
```

### E-sign

- `GET /esign/settings`
- `POST /esign/settings/profiles`
- `PUT /esign/settings/profiles/:id`
- `POST /esign/settings/profiles/:id/publish`
- `GET /esign/message-templates`
- `POST /esign/message-templates`
- `POST /esign/envelopes`
- `GET /esign/envelopes/:id`
- `POST /esign/envelopes/:id/remind`
- `POST /esign/envelopes/:id/cancel`
- `POST /esign/webhooks/:provider` — public callback with provider signature validation, rate limiting, and replay protection.

## 9. Generation transaction and compliance tagging

For every current-database/template combination:

1. Authorize access to the current database/company context and event.
2. Load the exact published template version.
3. Load real data in one resolver context.
4. Apply aliases, calculate derived values, and validate required fields.
5. Persist the selection and resolved-data snapshots.
6. Render the requested format(s).
7. Hash and store each output through the existing document helper.
8. Set `document_store` links:
   - `entity_id = current company/entity record when required by the existing document schema`
   - `entity_type = company`
   - `module_name = compliance` when tagged, otherwise `form_generation`
   - `sub_module_name = generated_form` or `signed_form`
   - `module_record_id = generated_document_id`
   - `company_event_id = selected event`
9. When a checklist mapping exists, create/find the matching `company_event_documents` row and set its `doc_id`.
10. Recommended status handling:
    - Generated but unsigned: checklist status `RECEIVED` only when business policy permits; otherwise remain `REQUESTED`/`REQUIRED`.
    - Signed output received: checklist status `RECEIVED`.
    - Compliance reviewer approval: checklist status `APPROVED` using the existing review fields.
11. Never automatically mark the entire company event `COMPLETED` merely because one form was signed. Event completion must use the event checklist/business rules.

If file storage succeeds but the database transaction fails, delete/quarantine the orphan. If the database commits but packaging fails, retain individual generated files and allow package retry.

## 10. E-signature behavior

The competitor screens are functional reference only. Implement a cleaner workflow integrated with the Template Library and the common generation popup; do not reproduce the competitor layout or labels verbatim.

### 10.1 E-sign workspace

Provide one **E-sign Forms** workspace with:

- summary cards for awaiting signatures, partially signed, completed, declined/expired, and failed
- searchable list/table with sent date, document/template, current database/company display name, event, recipients/progress, status, sender, expiry, and last activity
- filters for date range, document/template, status, settings profile, sender, recipient, event, and important/failure state
- row actions for view document, view envelope timeline, download unsigned/signed/certificate, remind, cancel, retry failed ingestion, and open compliance event
- a responsive table/card switch only when it materially helps smaller screens

The screen must not expose provider tokens, storage paths, or unauthorized recipient identity details.

### 10.2 Settings

Settings are grouped into understandable sections rather than one unbounded page:

1. **Delivery and receipts** — sender notification, post-sign receipt audience (`SELF`, `SIGNATORIES`, `ALL_PARTICIPANTS`), optional CC policy, and completion certificate delivery.
2. **Signing workflow** — sequential or parallel signing, default recipient roles/order, expiry, authentication mode, and reassignment policy.
3. **Reminders** — enabled flag, first reminder delay, repeat interval/unit, maximum count, quiet hours, and stop conditions. A recurring reminder must have a maximum count or be bounded by envelope expiry.
4. **Message templates** — email subject/body and optional WhatsApp message using registered merge fields and sanitized rich text.
5. **Provider configuration** — active adapter, connection status, callback health, and non-secret account metadata. Secrets are encrypted and managed through deployment secret storage, not rich-text settings.

Settings use draft/published versions. An envelope stores the exact settings-profile version and rendered message snapshot used when it was sent so later settings changes do not rewrite history.

WhatsApp is an optional notification channel, not the signing authority. It is enabled only when an approved provider, consent/opt-out policy, delivery logging, and jurisdictional requirements are implemented. Failure to send a secondary WhatsApp notification must not falsely mark the e-sign envelope as failed when the authoritative provider accepted it.

### 10.3 Provider workflow

The first implementation should use one provider adapter behind a common interface:

```text
createEnvelope()
getEnvelope()
sendReminder()
cancelEnvelope()
downloadSignedDocuments()
verifyWebhook()
normalizeWebhookEvent()
```

Required rules:

- Recipient email must come from the selected official/contact or an explicit audited override.
- Signing order and role are defined by the template mapping.
- Webhooks are the authoritative status source; UI polling is secondary.
- Callback processing must be idempotent and accept out-of-order events.
- Store the final signed PDF and completion certificate as separate `document_store` records.
- Preserve the unsigned original. The signed file becomes a new version/child document, not an overwrite.
- Encrypt secrets, verify webhook signatures, and never log provider tokens or unmasked identity data.
- Resolve the current database from trusted envelope routing metadata created by the server. Public webhook routes must not accept an arbitrary client database name.
- Record recipient-level delivery, viewed, signed, declined, and authentication-failure events.
- Permit manual reminders only for eligible recipients and enforce rate limits/cooldowns.
- Cancellation requires permission, a reason, provider confirmation when available, and an immutable audit event.
- Out-of-order callbacks may advance state only according to an explicit monotonic transition policy; terminal-state corrections require a compensating event.

### 10.4 Generate and send flow

`Generate & Send for e-sign` performs these logical steps:

1. Validate template fields and selected recipients in the common popup.
2. Generate and store the immutable unsigned output and snapshots.
3. Create a local envelope and recipient rows in `DRAFT`/`PENDING` state.
4. Submit through the provider adapter using an idempotency/correlation key.
5. On provider acceptance, store the external ID and mark it `SENT`; on failure retain the generated unsigned output and expose a safe retry.
6. Process verified webhooks idempotently.
7. When complete, download and scan the signed PDF and completion certificate, store them as separate document records, link them to the event/checklist, and close the envelope.

## 11. File formats and packages

### DOCX

- Best for editable client documents.
- Use a DOCX template engine capable of loops, conditions, images, tables, headers/footers, and page breaks.
- Uploaded DOCX should be the source for high-fidelity statutory forms.

### PDF

- Best for final review, filing, and signature.
- For HTML templates, render server-side using a controlled print stylesheet.
- For DOCX templates, convert with a stable server-side conversion service and test font availability.

### Packaging

- `SEPARATE`: direct individual downloads.
- `COMBINED_PDF`: merge PDFs in selected order; unavailable for DOCX-only output.
- `ZIP_BY_COMPANY`: one folder per company, then one file per template/format.
- `ZIP_FLAT`: all files in one ZIP with collision-safe names.

ZIP layout example:

```text
AGM_2027_forms.zip
  ACME_PTE_LTD_UEN123/
    AGM_Notice_v2.docx
    AGM_Notice_v2.pdf
    AGM_Minutes_v3.pdf
  NORTHSTAR_PTE_LTD_UEN456/
    AGM_Notice_v2.docx
    AGM_Notice_v2.pdf
```

## 12. Validation, security, and privacy

- Sanitize template HTML on save and again before rendering.
- For uploaded DOCX, validate MIME/signature and archive structure, reject encrypted/corrupt/oversized or macro-enabled inputs unless a separately reviewed policy permits them, limit expanded archive size/entry count, and block external relationships or unsafe embedded objects.
- Scan shortcode tokens across the DOCX main body, tables, headers, footers, footnotes/endnotes, and text boxes supported by the selected engine; publishing fails when a required region contains an unknown or malformed token.
- Allow only registered helpers and shortcodes; prohibit executable expressions.
- Enforce company/event access for every selected record, not only the first record.
- Mask NRIC/passport values by default. Full identifiers require an explicit sensitive-field permission and must be audited.
- Prevent spreadsheet/formula injection in exported metadata and path traversal in output names.
- Limit template size, templates per run, cross-database destinations per orchestration, output count, image size, and ZIP size.
- Virus-scan uploaded DOCX/assets and signed-provider downloads in production.
- Use signed/authorized download endpoints rather than exposing storage paths directly.
- Log generation, download, preview of sensitive data, e-sign send/remind/cancel, webhook transitions, and compliance approval.
- Define retention rules for preview artifacts, failed outputs, signed forms, and certificates.

## 13. Migration from the old method

1. Add the shortcode registry and seed canonical definitions.
2. Seed aliases for every existing hard-coded slug (`Company_name`, `Registration_Num`, and others).
3. Parse every existing `forms.form_content`; produce a migration report containing recognized aliases, unknown fields, and invalid syntax.
4. Create version 1 for each valid existing template without changing its visible template ID.
5. Convert current `popup_fields` JSON to versioned template-field/input definitions. Preserve the original JSON during the transition.
6. Treat `form_type=1` records as legacy e-sign templates; do not assume they have a working provider envelope.
7. Keep current CRUD routes temporarily and introduce version/generation routes alongside them.
8. Change the editor to load field definitions from the API. Remove hard-coded merge arrays only after migrated templates pass comparison tests.
9. Run old-versus-new sample rendering for selected templates and obtain business approval.
10. After adoption, make published versions immutable and retire legacy generation paths.
11. Keep templates in their current databases; do not backfill a template `entity_id`.
12. Assign stable `library_template_key` values only to governed Base Library templates and proven copies. Do not infer lineage only from matching names.
13. Convert existing `popup_fields` into the common generation schema and compare old-versus-new option lists, defaults, required rules, and generated outputs.
14. Migrate legacy e-sign settings into a draft settings profile. Treat old e-sign logs as historical reference and never invent provider/recipient events that cannot be proven.

## 14. Development phases

Each phase has a usable exit condition and builds on the same version, schema, resolver, snapshot, and document records. E-sign work must not create a second generation pipeline.

### 14.1 Development entry gates and tracked decisions

The functional scope is ready for phased development, but the following technology/provider choices must be completed in the stated phase and recorded as architecture decisions before production implementation of the affected component:

| Decision | Required by | Minimum proof |
|---|---|---|
| HTML→DOCX renderer and DOCX template engine | End of Phase 0 | Sample loops, tables, images, headers/footers, page breaks, and formatting comparison |
| DOCX→PDF conversion service and fonts | End of Phase 0 | Approved visual comparison for supplied samples in the deployment environment |
| Queue/job technology and database-routing envelope | Before Phase 5 | Durable retry, idempotency, cancellation, per-database isolation, and worker recovery test |
| First e-sign provider | Before Phase 6 | API/webhook capability, signature verification, sandbox, signed PDF/certificate retrieval, rate limits, data residency, and commercial review |
| Malware scanning/quarantine service | Before production file ingestion | Uploaded DOCX and provider-download scanning, timeout/failure policy, and quarantine recovery |
| Base Library package signing and destination authorization | Before Phase 4 distribution | Manifest authenticity, allow-listed destinations, idempotent copy, conflict report, and compromised-package rejection |
| Optional WhatsApp provider and consent policy | Before Phase 7 channel enablement | Approved templates, opt-in/opt-out, delivery callbacks, retention, and jurisdiction/privacy review |

No unresolved choice permits parallel incompatible implementations. Until a decision is approved, depend on the documented provider interface and keep the feature behind a disabled capability flag.

### Phase 0 — Discovery, security correction, and sample mapping

- Inventory current Form Builder routes, tables, document storage, database-context middleware, popup-field types, and legacy e-sign behavior.
- Correct actor resolution to authenticated context only.
- Remove database-selection authority from ordinary client payloads; document the trusted routing mechanism for requests, workers, distribution jobs, and webhooks.
- Parse the supplied share certificate, constitution, change-name, share-allotment, adoption, and capital-reduction DOCX samples, including tables, headers/footers, text boxes, repeaters, and signature locations.
- Produce a field catalogue and source mapping report for the samples.

Exit: architecture decisions, threat model, sample mapping catalogue, and rendering proof-of-concept are reviewed.

### Phase 1 — Template and shortcode foundation

- Build the administrator Shortcode Library with manual registration, source-domain/role/path tagging, exact and semantic duplicate detection, alias management, deprecation, reference protection, and audit history.
- Add safe helpers, template versions, content hashes, parsed fields, publish validation, and library provenance columns.
- Extend the universal editor with a searchable API-provided shortcode browser and safe loop/condition block insertion.
- Support HTML and uploaded DOCX as distinct source types using the same definitions and mappings.
- Add DOCX upload analysis, placeholder-to-canonical mapping, unmapped-token report, and safe archive/relationship validation.
- Store versioned popup/generation field definitions and dependency rules.
- Preserve existing CRUD routes during compatibility migration.

Exit: administrators can register a non-duplicate shortcode; authors can reuse it in HTML and DOCX modes; a draft can be validated and published immutably; and unknown required fields prevent publication/generation.

### Phase 2 — One dynamic generation popup

- Build `FormPopupSchemaService` and the single reusable React popup/drawer.
- Implement current-database option resolvers for directors, alternate directors, secretary, shareholders, share classes, events, and structured manual/transaction values.
- Add dependency handling, single/multiple selection, field grouping, optional/required dates, sensitive-data indicators, and multi-template schema merging.
- Implement dependent remote options such as shareholder → related shares, including loading/empty/error states, parent-change clearing, stale-response protection, pagination/search, backend re-authorization, and circular-dependency publication checks.
- Add preview validation with value source labels and field-level errors.

Exit: different templates render different inputs through the same component without template-specific popup code.

### Phase 3 — First end-to-end document generation slice

- Use one supplied DOCX sample as the first high-fidelity vertical slice; recommended: Share Allotment because it exercises company, members, directors, shares, money, dates, repeaters, and signature blocks.
- Resolve current-database master data and structured transaction inputs server-side.
- Generate DOCX and PDF, persist immutable selection/resolved snapshots and hashes, and store outputs in `document_store`.
- Support preview, download, save to documents, optional compliance-event/checklist tag, history, and idempotent retry.

Exit: the chosen sample passes approved source-versus-output comparison tests and can be regenerated from its stored snapshot.

### Phase 4 — Remaining samples and Base Library distribution

- Implement the remaining supplied document families and required resolver paths.
- Package published Base Library templates with manifest, source, fields, mappings, assets, and hashes.
- Copy to one or many authorized entity databases with per-destination status, idempotency, retry, version comparison, and local-customization protection.
- Add `Import from Base Library`, `Copy to databases`, and update-available UI.

Exit: a published package can be copied safely to multiple databases and generated independently from each local copy.

### Phase 5 — Operational and batch generation

- Add multi-template generation, combined PDF, ZIP packages, collision-safe naming, progress, cancellation, retry, partial-failure reporting, and Generated Forms history.
- Use durable jobs for rendering/conversion/packaging beyond synchronous limits.
- For cross-database bulk operations, orchestrate independent database-scoped runs; never mix destination data in one resolver context or transaction.
- Add readiness matrix, concurrency/output limits, cleanup/quarantine, and operational metrics.

Exit: batch runs are database-isolated, observable, retryable, and produce correct partial-success packages.

### Phase 6 — E-sign foundation

- Select and integrate the first provider behind the adapter interface.
- Add versioned settings profiles, delivery/receipt rules, sequential/parallel signing, recipient roles/order, expiry, email templates, reminder policies, and secret management.
- Implement generate-and-send from the same dynamic popup.
- Implement verified, idempotent, out-of-order-safe webhooks and the recipient/envelope activity timeline.
- Store unsigned document, signed PDF, and completion certificate separately and link them to compliance.

Exit: an authorized user can generate, send, monitor, remind, cancel, complete, and download a fully audited envelope.

### Phase 7 — E-sign operations and optional channels

- Build the E-sign Forms workspace, dashboard counts, filters, envelope details, downloads, and failure recovery.
- Add provider callback-health monitoring and reconciliation jobs.
- Add optional WhatsApp notifications only after provider, consent, opt-out, delivery logs, template approval, and privacy requirements are satisfied.
- Add rate limits, reminder cooldowns, accessibility, responsive behavior, and permission-specific detail views.

Exit: operations can identify and resolve stuck/failed envelopes without database intervention.

### Phase 8 — Compliance audit integration and production hardening

- Emit form, download, distribution, e-sign, reminder, signed-file, approval, filing, and completion activities into the compliance event timeline.
- Complete queue scaling, metrics/alerts, retention, malware scanning, font/rendering verification, backup/disaster recovery, penetration testing, accessibility, and load testing.
- Complete migration and remove deprecated hard-coded merge arrays, template-specific popups, legacy e-sign copies, and unsafe audit/database routing fallbacks.

Exit: security, isolation, recovery, rendering, webhook, accessibility, and target-load acceptance suites pass.

## 15. Acceptance criteria

The first production release is accepted when:

1. A published template resolves real company, current director, selected secretary, shareholder, share, and event values from the trusted current database without frontend-provided master data or an `entity_id` on `forms`.
2. Unknown required shortcodes block generation with a field-level message.
3. One reusable popup renders and validates each template's configured dynamic fields, dependencies, option sources, and manual transaction values.
4. A retry with the same idempotency key does not create duplicate generated documents.
5. A ZIP contains correctly named, database-isolated files for every successful template output and reports partial failures.
6. Each output records the template version and immutable resolved-data snapshot.
7. Tagging creates a valid `document_store` record linked to the correct company event and checklist row.
8. E-sign callbacks update the envelope idempotently and store both the signed PDF and completion certificate.
9. Signed forms remain linked to the compliance event, while event completion still follows checklist/business rules.
10. Permission, tenant-isolation, sensitive-data, rendering, webhook, failure-recovery, and batch-load tests pass.
11. Every compliance event row opens a complete chronological activity timeline showing the action, actor, date/time, status, and relevant changes from event creation through completion.
12. A Base Library package can be copied to multiple authorized entity databases with local IDs, stable provenance, verified hashes, per-destination status, and safe retry.
13. A copied template may be customized locally; later library distribution does not silently overwrite that customization.
14. The ordinary form/generation APIs cannot switch databases using a client-supplied database or `port_name` value.
15. E-sign settings are versioned, and each envelope preserves the settings and rendered messages used at send time.
16. Sequential and parallel recipient workflows, reminders, expiry, cancellation, decline, partial signing, completion, and out-of-order callbacks are tested.
17. Only authorized administrators can create shortcode definitions; every definition is tagged to an allow-listed source domain/resolver path and is auditable.
18. Canonical keys and aliases cannot collide case-insensitively, and likely semantic duplicates are shown before creation.
19. One canonical scalar or collection shortcode can be reused across differently styled HTML and DOCX templates without presentation-specific duplicate keys.
20. Both source modes—HTML rendered to DOCX/PDF and uploaded DOCX mapped to data—use the same validation, resolver snapshot, document storage, history, and e-sign pipeline.
21. Uploaded DOCX validation detects unknown/malformed placeholders in supported document regions and rejects unsafe or unsupported document structures with actionable errors.
22. Selecting a shareholder loads only that shareholder's authorized shares into the configured child control; changing the shareholder clears stale selections, and preview/generation reject manipulated or outdated share IDs.
23. Base Library import resolves shortcodes by canonical key and blocks incompatible destination definitions instead of overwriting them.

## 16. Recommended first vertical slice

Implement one complete **Share Allotment** flow from the supplied Version 4 DOCX before building every document family:

- One published DOCX template in the current entity database
- `company.*`, `directors`, `shareholders/allottees`, share class, quantity, issue price, total consideration, transaction date, and signature blocks
- One dynamic popup generated entirely from the template-field schema
- Preview plus DOCX and PDF output
- Store both outputs in `document_store`
- Optionally link them to the applicable `company_event` and checklist item
- Display it in Generated Forms history and in the compliance event’s Documents section

This slice validates high-fidelity DOCX mapping, collections/tables, calculated money values, signature-role metadata, rendering, document storage, and compliance linkage. Base Library distribution, batch packaging, and e-signature then reuse the same version, schema, generation records, and resolver snapshot.

## 17. Compliance Event Audit Trail

### 17.1 Current-state finding

The project already has a generic `audit_log` table and `LogHelper` action constants for many compliance actions, including event creation/update/deletion, extensions, waivers, exemptions, status changes, and document checklist decisions. The Due Date Tracker can display extension history.

This is not yet a complete event timeline:

- The Company Events list has no audit/history action.
- The available history API is filtered to extension actions only.
- A generic audit row records one `table_name` and `record_id`. For child rows, such as `company_event_document`, the record ID is the child ID rather than the parent `company_event_id`.
- Reminder sends, file downloads, generated forms, signature events, approvals, filing, and completion are stored in different tables or are not consistently emitted as event activities.
- Generic `old_values`/`new_values` are useful for forensic detail but are not enough to render a client-friendly process timeline.

### 17.2 UI requirement

Add one audit icon to the **Action** column of every Company Events row:

```jsx
<i className="ri-history-line" />
```

- Tooltip: `View complete audit trail`.
- Recommended position: after Documents and before Update status.
- Clicking opens `/compliance/events/:company_event_id/audit-trail` in a large modal or full-screen page.
- A full page is preferred because the trail can contain many actions and document details.

The audit page header shows:

- Company name and registration/client number
- Event name, period/FYE, original and effective due date
- Current workflow status and completion percentage
- Created date and creator
- Filing date and completion date when available

Filters:

- Search action, person, document, or comment
- Category: Event, Due date, Documents, Approval, Reminder, Form, E-sign, Filing, System
- Result: Success or Failed
- Actor: named user or System
- Date/time range
- `Important only` switch

Display modes:

1. **Process timeline** — default, oldest to newest, designed for easy understanding.
2. **Audit table** — newest to oldest, suitable for administrators and export.
3. **Status journey** — compact workflow steps with completed/current/not-started states.

### 17.3 Timeline row design

Every activity row contains:

- A category-specific colored icon
- Plain-language title
- Short description with meaningful entity/document names
- Actor avatar/name and actor type (`USER`, `SYSTEM`, `CRON`, `API`, `ESIGN_PROVIDER`)
- Exact date and time in the company/user timezone, with timezone label
- Relative time as secondary text, for example `2 hours ago`
- Success/failed/pending result badge
- Optional `View details` expansion for old/new values, reason, remarks, IP, and technical correlation ID
- Links to the related document, reminder log, generated form, signature envelope, or filing record when authorized

Example:

```text
[✓] Event created
    AGM 2027 was created with a due date of 30-Jun-2027.
    Created by Sarah Tan · 18-Aug-2026 10:42 AM SGT

[📄] AGM Notice uploaded
    AGM_Notice_2027.pdf (version 1) was uploaded and linked to the checklist.
    Uploaded by John Lim · 12-Jun-2027 03:15 PM SGT

[✓] Document approved
    AGM Notice changed from Received to Approved.
    Approved by Priya Nair · 13-Jun-2027 09:06 AM SGT

[⇧] Event filed
    Filing date: 28-Jun-2027 · Reference: ACRA-AR-00981
    Filed by Sarah Tan · 28-Jun-2027 04:31 PM SGT

[★] Event completed
    All mandatory requirements were completed.
    Completed by Sarah Tan · 28-Jun-2027 04:33 PM SGT
```

Suggested category colors and icons:

| Category | Color | Icon |
|---|---|---|
| Event created/updated | Primary blue | `ri-calendar-event-line` |
| Status/workflow | Indigo | `ri-flow-chart` |
| Due date/extension | Amber | `ri-calendar-check-line` |
| Document upload/version | Cyan | `ri-file-upload-line` |
| Document approval/rejection | Green/red | `ri-shield-check-line` / `ri-close-circle-line` |
| Reminder | Orange | `ri-notification-3-line` |
| Generated form | Purple | `ri-file-edit-line` |
| E-signature | Teal | `ri-pen-nib-line` |
| Filing | Blue | `ri-upload-cloud-2-line` |
| Completion | Green | `ri-checkbox-circle-line` |
| Failure | Red | `ri-error-warning-line` |
| System/cron | Grey | `ri-settings-3-line` |

Color must not be the only status indicator; always include icon and text.

### 17.4 Required activity catalogue

The timeline must cover the complete process, including failed attempts where appropriate:

| Stage | Required activities |
|---|---|
| Creation | Event created manually, automatically from rule, or imported; source/rule and initial due date |
| Assignment | Person in charge/assignee changed |
| Calculation | Due date calculated/recalculated; source date, rule version, old/new date |
| Extension/exception | Extension requested/approved/cancelled; waiver, dispense, exemption requested/applied/cancelled |
| Preparation | Status changes such as In Preparation, Awaiting Documents, Awaiting Client, Awaiting Approval, Ready to File |
| Documents | Checklist initialized; document requested/uploaded/replaced/downloaded/approved/rejected/expired/not applicable |
| Forms | Template selected; form generated/regenerated; DOCX/PDF downloaded; generation failed |
| E-sign | Sent, delivered, viewed, reminder sent, signed by each recipient, declined, expired, completed; signed file stored |
| Reminders | Scheduled, sent, failed, skipped, recipient counts, and link to reminder log |
| Approval | Submitted for approval, approved, rejected, reopened; actor and remarks |
| Filing | Filed; filing date, filing reference/receipt document, authority |
| Completion | Event completed/reopened/cancelled; completion validation summary |
| Administration | Deleted/restored, access-sensitive changes, and system corrections |

### 17.5 Data model

Keep `audit_log` as the forensic system-wide log. Add a normalized event activity projection for reliable event grouping and readable UI.

Proposed `compliance_event_activities` table:

- `activity_id` BIGINT PK
- `company_event_id` BIGINT, required and indexed
- `entity_id` BIGINT, required and indexed
- `event_id` nullable event-master reference
- `audit_log_id` nullable link to the generic audit row
- `activity_code` stable enum/string, for example `EVENT_CREATED` or `DOCUMENT_APPROVED`
- `category` (`EVENT`, `DUE_DATE`, `DOCUMENT`, `REMINDER`, `FORM`, `ESIGN`, `APPROVAL`, `FILING`, `SYSTEM`)
- `title` and `description` snapshot text
- `result` (`PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`)
- `actor_type` (`USER`, `SYSTEM`, `CRON`, `API`, `ESIGN_PROVIDER`)
- `actor_user_id` nullable
- `actor_name_snapshot` nullable, so history remains understandable after a user is removed/renamed
- `occurred_at` UTC datetime with millisecond precision
- `source_table`, `source_record_id`, `source_action`
- `related_doc_id`, `event_document_id`, `reminder_log_id`, `generated_document_id`, `esign_envelope_id` nullable
- `old_values`, `new_values`, and `metadata` JSON
- `reason`, `remarks`, `correlation_id`, `request_id` nullable
- `ip_address` and `user_agent` for authorized audit-detail views
- `is_important` boolean
- `created_at`

This table is append-only: application APIs must never update or delete activity rows. Corrections are represented by a new compensating activity. Database permissions should prevent ordinary application roles from mutating historical rows.

Indexes:

- `(company_event_id, occurred_at, activity_id)`
- `(entity_id, occurred_at)`
- `(company_event_id, category, occurred_at)`
- unique `(source_table, source_record_id, source_action, correlation_id)` where practical for idempotency

### 17.6 Activity writer

Create `ComplianceEventActivityService.record()` and call it from the same transaction or transaction-safe outbox as the business change.

Required input:

```js
{
  companyEventId,
  entityId,
  activityCode,
  category,
  result,
  actor,
  source,
  links,
  oldValues,
  newValues,
  metadata,
  occurredAt
}
```

Rules:

- Resolve the actor only from `req.user` or trusted system context, never from a client-supplied `created_by`/`updated_by` value.
- User actions and the associated activity should commit atomically where possible.
- For storage, cron, e-sign webhook, and queue actions, use a transactional outbox/idempotent consumer so external failures do not create duplicate or missing timeline rows.
- Also write/link the generic `audit_log` where forensic auditing is required.
- Capture concise metadata, not whole unbounded request bodies.
- Redact passwords, tokens, SMTP credentials, identity numbers, signature authentication data, and confidential document contents.

### 17.7 API specification

- `GET /event/:company_event_id/audit-trail`
  - Query: `page`, `limit`, `order`, `category`, `result`, `actor_user_id`, `date_from`, `date_to`, `important`, `search`
  - Default process timeline order: `occurred_at ASC, activity_id ASC`
- `GET /event/:company_event_id/audit-summary`
  - Returns event header, current stage, stage counts, created/last activity/completed metadata
- `GET /event/:company_event_id/audit-trail/export?format=pdf|csv`
  - Requires export permission and writes an `AUDIT_TRAIL_EXPORTED` activity
- `GET /event-activity/:activity_id`
  - Returns authorized technical detail and signed document links

The API must verify that the authenticated user can access both the tenant and the event’s company. It must not accept `entity_id` as an alternative that could expose another event.

### 17.8 Backfill and compatibility

Existing events will have incomplete history. Backfill only facts that can be proven:

- `EVENT_CREATED` from `company_event.created_date/created_by`
- Existing applicable generic audit rows by matching event table/ID
- Child document activities when `company_event_id` is available in the child row or audit JSON
- Extension/waiver records from their dedicated history tables
- Reminder delivery summaries from `company_event_reminder_logs`

Mark backfilled activities with `metadata.backfilled = true` and `actor_type = SYSTEM` when the original actor cannot be proven. Never invent approval, upload, filing, or completion timestamps.

### 17.9 Audit-trail acceptance criteria

1. Every event row has a history icon with accessible label and tooltip.
2. Opening it displays the event from creation to the latest action in chronological order.
3. Event create/update, status transition, document upload/replacement/review, form generation, signature, reminder, filing, and completion actions appear without manual reconciliation.
4. Each row shows who acted and an exact timezone-aware date/time; automatic work is clearly labelled System/Cron/API.
5. Document child actions appear under the correct parent compliance event.
6. Old/new values are available in details but the main timeline uses readable descriptions.
7. Failed actions do not falsely change the displayed business state.
8. Duplicate webhook, queue, or retry delivery does not create duplicate activities.
9. Users cannot edit/delete audit activities or view events outside their tenant/company permissions.
10. The timeline remains usable with at least 10,000 activities through indexed cursor/page loading.
