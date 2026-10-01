# Compliance Form Automation — Phase 0 Discovery

Status: In progress  
Started: 24-Aug-2026  
Source specification: `docs/Compliance-Form-Auto-Mapping-Specification.md`

Working delivery roadmap: `docs/Compliance-Form-Delivery-Plan.md`

## Progress

- [x] Inventory the current Form Builder route, controller, service, DAO, models, migrations, and UI entry points.
- [x] Correct Form Builder actor resolution so request payload audit IDs are ignored.
- [x] Confirm tenant-local ownership: every client database owns and manages its own forms.
- [x] Preserve the existing authentication, login, Redis, and database-selection behavior.
- [ ] Catalogue all required DOCX samples and map their fields and document regions.
- [ ] Record and approve renderer/converter architecture decisions.
- [ ] Complete the threat model and rendering proof of concept.

## Current implementation inventory

| Area | Current location | Finding |
|---|---|---|
| Form API | `css_backend/src/route/formBuilder/formRoute.js` | Authenticated create, update, get, list, and soft-delete routes under `/form-template`. |
| Form controller | `css_backend/src/controllers/formBuilder/FormController.js` | Actor is now resolved only from `req.user.user_id` or `req.user.id`. |
| Form persistence | `forms`, `form_pop_up_fields` | Stored in the request-selected database. No redundant `entity_id` exists on `forms`. |
| Form service | `css_backend/src/service/formBuilder/FormService.js` | CRUD, Save As, duplicate, attachment upload, and legacy e-sign-copy behavior are coupled in one service. |
| Editor | `css_frontend/src/pages/FormBuilder` | HTML editor, template list, and popup-field administration exist. Merge fields are not registry-backed. |
| Documents | `document_store`, `DocumentStoreDao`, `documentHelper` | Local/S3 document abstraction exists; Form Builder currently accepts client `port_name` during attachment routing. |
| Company/event sources | company, official, share, and company-event models | Most target source domains exist, but no allow-listed central shortcode resolver exists. |
| Generated-document ownership | `document_store`, generation runs/artifacts | Generated forms are company documents within the current tenant. They are not automatically linked to `company_event` or `company_event_documents`. |
| E-sign | `form_type = 1` copy behavior | This is template duplication, not an envelope/provider workflow. It must remain legacy-only during migration. |

## Security findings

### Corrected: client-controlled audit actor

The Form controller read `user_id`/`id` from `req.body`, and the service fell back to payload `created_by`/`updated_by`. Both paths allowed actor spoofing. Form writes now use only the authenticated actor passed from `req.user`. Regression coverage is in `css_backend/specs/FormBuilder/FormActorSecurity.spec.js`.

### Confirmed boundary: tenant-local forms

Each client has its own database and its own independent `forms` rows. Application code, shortcode definitions, and resolver behavior are common and deployed consistently. Forms are prepared locally and deployed only into the selected tenant databases; at runtime they are not shared and there are no cross-database form references. The existing authentication, login, Redis, port, and database-selection behavior is established application infrastructure and is outside this implementation's change scope.

The Form automation implementation will use the database context already established by the application. It will not add `entity_id` to `forms`, change token contents, change login/refresh behavior, or introduce cross-database form operations.

Required controls within Form automation:

1. Resolve actors from `req.user`, not audit IDs supplied in a form payload.
2. Use only models from the current request database context.
3. Keep generation, history, documents, and jobs inside that same tenant database.
4. Test that Form automation never reads or writes another client database.

## Sample-document inventory

The specification requires share certificate, constitution, change-name, share-allotment, adoption, and capital-reduction samples. The repository currently contains only:

| File | Initial package observation |
|---|---|
| `Reference document/Annual RORC- Changes.docx` | Main document XML, styles, numbering; no header/footer parts or embedded media. |
| `Reference document/User_Guide_Share_Amalgamation_Formatted.docx` | Main document XML and eight embedded images; no header/footer parts were found. |

Neither filename is the recommended Share Allotment Version 4 vertical-slice template. Field mapping and renderer acceptance comparisons for the required six families remain blocked until the authoritative samples and expected-output fixtures are supplied.

The tenant-local Share Allotment data-mapping foundation is now implemented independently of those samples. It validates a selected allotment against the current company and snapshots repeating allottee/share lines plus calculated quantity, capital, and consideration totals. Visual field placement and golden DOCX/PDF acceptance remain blocked on the authoritative Version 4 package.

## Architecture decisions to approve by Phase 0 exit

| Decision | Status | Required experiment |
|---|---|---|
| DOCX template engine | Open | Collections/tables, split-run placeholders, images, headers/footers, page breaks, and signature anchors against supplied samples. |
| HTML-to-DOCX renderer | Open | Layout and formatting comparison for existing HTML templates; keep behind a disabled capability until approved. |
| DOCX-to-PDF conversion and fonts | Open | Visual comparison in the deployment environment, including font substitution and pagination. |
| Tenant-local job context | Open | Demonstrate that generation workers retain the initiating tenant context without enabling cross-database form access. |

## Immediate next work

1. Obtain the six authoritative DOCX samples, starting with Share Allotment Version 4.
2. Run renderer spikes against those samples and capture decisions as ADRs.
3. Produce the canonical tenant-local field catalogue.
5. Produce the canonical field catalogue before creating Phase 1 shortcode tables.
