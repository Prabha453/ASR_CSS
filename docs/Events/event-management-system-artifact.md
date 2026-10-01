# Event Management System Artifact

## Purpose

The Event Management system manages company compliance events from master setup through automatic rule-based creation, manual event creation, due date tracking, reminders, email sending, and audit/history tracking.

The new structure keeps the old project behavior where it matters, but stores and processes events using the current data model:

- Event masters are identified by `event_slug`.
- Company events store `event_id` and `event_slug`.
- Rule-based statutory events are created from company data and event rules.
- Manual events, recurring events, due tracker extensions, reminders, and logs are handled through the event module.

## Scope

This artifact covers:

- Event Name Master
- Event Rule Master
- Company Event CRUD
- Multiple Event Creation
- Company Date Information / FYE / AD flow
- Due Date Tracker and extension actions
- Reminder Master
- Reminder Event List
- Cron/manual reminder send
- Reminder logs
- Email merge fields
- Audit history

## Frontend Modules

| Area | File | Purpose |
| --- | --- | --- |
| Compliance company list | `css_frontend/src/pages/Compliance/ComplianceList.js` | Company compliance landing/list page with filters and event navigation. |
| Event list | `css_frontend/src/pages/Compliance/EventList.js` | Shows all events or company-specific events. |
| Event form | `css_frontend/src/pages/Compliance/EventForm.js` | Add/edit single event, attendees, recipients, email settings, meeting details. |
| Multiple event create | `css_frontend/src/pages/Compliance/MultiEventCreate.js` | Bulk event creation flow. |
| Multi-event steps | `css_frontend/src/pages/Compliance/steps/*` | Entity selection, event details, recipients and preview steps. |
| Due date tracker | `css_frontend/src/pages/Compliance/DueDateTracker.js` | Old due tracker logic in new UI: due dates, extension, status actions, history. |
| Reminder event list | `css_frontend/src/pages/Compliance/ReminderEventList.js` | Shows reminder dates based on reminder master and event due dates. |
| Reminder logs | `css_frontend/src/pages/Compliance/ReminderLogList.js` | Shows reminder send results and failure/invalid recipient details. |
| Reminder cron page | `css_frontend/src/pages/Compliance/ReminderCronPage.js` | Manual date-based cron trigger and summary result. |
| Event name master | `css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js` | EVENT/LOG master setup, system events, recurring config, view modal. |
| Event rule master | `css_frontend/src/pages/Settings/MasterSettings/EventRule.js` | Rule setup used for automatic due date generation. |
| Reminder master | `css_frontend/src/pages/Settings/MasterSettings/Reminder.js` | Reminder subject/message templates, merge fields, scheduling. |
| Company date information | `css_frontend/src/pages/Company/steps/DateInformationSection.js` | Company edit date/FYE/AD section embedded in Step 1. |
| Company edit step | `css_frontend/src/pages/Company/steps/Step1BusinessEntity.js` | Hosts Date Information section in edit mode. |
| API helpers | `css_frontend/src/helpers/backend_helper.js` | Frontend API wrapper methods. |
| URL constants | `css_frontend/src/helpers/url_helper.js` | Event/reminder/due tracker endpoint constants. |

## Backend Modules

| Area | File | Purpose |
| --- | --- | --- |
| Event controller | `css_backend/src/controllers/company/CompanyEventController.js` | HTTP handlers for event, due tracker, FYE sync and history APIs. |
| Event service | `css_backend/src/service/company/CompanyEventService.js` | Event CRUD, multiple create support, recurring creation, due tracker actions, FYE delegation. |
| Company service | `css_backend/src/service/company/EntityCompanyService.js` | Rule-based statutory event creation engine. This is the source of truth for company-driven event generation. |
| Event rule service | `css_backend/src/service/company/EventRuleService.js` | Event rule CRUD. |
| Reminder service | `css_backend/src/service/company/ReminderService.js` | Reminder master, reminder list/log support, merge-field metadata. |
| Common cron service | `css_backend/src/service/company/CommonCronService.js` | Common cron entry point, including due reminder sending. |
| Reminder controller | `css_backend/src/controllers/company/ReminderController.js` | Reminder master/log API handlers. |
| Common cron controller | `css_backend/src/controllers/company/CommonCronController.js` | Cron/manual reminder API handler. |
| Event routes | `css_backend/src/route/event/index.js` | Main event route registration. |
| Reminder routes | `css_backend/src/route/event/reminderRoute.js` | Reminder master/log routes. |
| Cron routes | `css_backend/src/route/event/reminderCronRoute.js` | Manual/cron trigger routes. |
| Email helper | `css_backend/src/helper/EmailHelper.js` | SMTP/nodemailer send helper. |
| Event helper | `css_backend/src/helper/eventHelper.js` | Shared event/reminder helpers and merge fields. |
| Log helper | `css_backend/src/helper/LogHelper.js` | Audit log writing and retrieval helpers. |

## Data Model

### `company_event_name`

Master list for event and log types.

Important fields:

- `e_id`
- `event_type`: `EVENT` or `LOG`
- `event_name`
- `event_slug`
- `event_subject`
- `color_code`
- `is_system_event`: `1` means protected system event
- `is_recurring`: `1` means recurring event generation is enabled
- `recurring_period`
- `recurring_duration`
- `is_deleted`

System events should be view-only in master UI. They should not be edited or deleted from the normal UI.

Default system events:

- `ECI`
- `AR`
- `Anniversary`
- `AGM`
- `Annual General Meeting`
- `Annual Return Filing`
- `Board Resolution`
- `Tax Filing`
- `Service Review`

### `company_event_rule`

Stores rules used to calculate due dates for company events.

Rules are matched through the current structure by `event_slug` and, where needed, event master id compatibility.

### `company_event`

Stores actual company event rows.

Important fields:

- `company_event_id`
- `entity_id`
- `event_id`
- `event_slug`
- `rule_id`
- `period_start`
- `period_end`
- `fye_date`
- `base_date`
- `due_date`
- `extended_due_date`
- `reminder_date_basis`: controls whether reminder logic uses actual due date or extended due date
- `held_date`
- `filing_date`
- `status`
- `source_from`: `AUTO_RULE`, `MANUAL`, `IMPORT`
- `source_basis`
- `attendees`
- `receiving_parties`
- `agm_status_details`
- `meeting_details` fields
- `email settings` fields
- audit columns

Do not use `extension_history` on this table when audit log is available. Extension history belongs in audit logs.

### `reminder_settings`

Stores reminder master setup.

Important fields:

- reminder name/type
- event mapping
- due-date offset
- subject
- message
- attachments if supported
- active/deleted flags

Templates use merge fields like `{{Company_name}}`, resolved at send time from the event/company context.

### `company_event_reminder_log`

Stores reminder send attempts and result summaries.

Recommended clean structure:

- `log_id`
- `company_event_id`
- `reminder_id`
- `scheduled_date`
- `sent_at`
- `status`: `PENDING`, `SENT`, `FAILED`, `SKIPPED`
- `recipient_summary`: JSON summary of unique TO/CC/BCC recipients
- `result_summary`: JSON counts for sent, failed, skipped, invalid
- `recipient_results`: JSON unique per-email results
- `subject_snapshot`
- `message_snapshot`
- `sender_email`
- `reply_to_email`
- `provider_response`
- `user_message`
- `technical_message`
- audit columns

The UI should show friendly summaries and only show detailed reasons for invalid, failed, or skipped recipients.

### Audit Log

Due tracker extension/cancel/status actions should be stored in audit logs using a clear module name, action name, old value, new value, and user metadata.

## Core Flows

### 1. Event Name Master

1. Admin creates or views event names.
2. `event_type` is stored as `EVENT` or `LOG`.
3. System events are protected.
4. `is_recurring` controls whether recurring fields are visible and used.
5. Event create screens should load only `event_type = EVENT`.

### 2. Event Rule Master

1. Admin creates rules for statutory or recurring event dates.
2. Company-driven creation uses these rules to calculate due dates.
3. Rules should be matched by `event_slug` in the new structure.

### 3. Company Date Information / FYE / AD

This flow is based on the old company edit date information logic.

1. The Date Information section appears in company edit Step 1.
2. If incorporation date or required company financial date is missing, show:
   `Please update the "Incorporation Date" under "Particulars of Company" in order to enter the FYE and AGM,AR dates`
3. Rows are grouped by FYE/AD date information.
4. Event columns are shown only when event data exists.
5. Statutory columns are shown first, then other event columns.
6. Show the `FYE` action only for the latest row that has FYE.
7. Show the `AD` action for the latest Annual Declaration row.
8. Empty state can show Add FYE.
9. Frontend validates before submit.
10. Backend validates again.
11. Backend delegates actual event creation/update to the current company event rule engine.

The important structural rule: keep `EntityCompanyService` as the rule-based generation source. `CompanyEventService` should normalize FYE/AD payloads and delegate validation/sync to it.

### 4. Single Event CRUD

1. User selects entity and event type.
2. Event type list excludes protected system events on add where required.
3. Edit mode keeps entity name readonly.
4. System/statutory events can keep event name, FYE date, and due date readonly where old logic requires it.
5. Filing/completion date can mark event as completed.
6. Completing recurring events should create the next event when no duplicate exists.

### 5. Multiple Event Create

1. User selects companies/entities.
2. User selects event details.
3. Recipients include company officials and system users.
4. User previews and creates events.
5. Backend should use same event normalization and recipient storage format as single create.

### 6. Recurring Event Logic

Recurring events are based on event master settings and old behavior.

Rules:

- Use `event_slug`, not hard-coded ids.
- Create next recurring event only when the current event is completed or filing/completion date is given.
- Do not create duplicates for the same entity, event slug, and period/due date.
- Use `is_recurring`, `recurring_period`, and `recurring_duration` from event master.
- Legacy yearly recurring slugs can still be supported where old logic expects it.

### 7. Due Date Tracker

The due tracker shows all events where due date exists.

Required behavior:

- Filter by company, event type, due year/date range/status.
- Show actual due date and extended due date clearly.
- Use `reminder_date_basis` to control whether reminders use actual or extended due date.
- Extension is allowed only for eligible event slugs, not every event.
- AGM/AR style extension is limited to three 60-day extensions, matching old logic.
- History button opens history only.
- Extend button opens extension form and history.
- After action success, reload the page/list and highlight the last changed row.

Actions:

- Extend due date
- Cancel extension
- Dispense
- Cancel dispense
- Exempt
- Cancel exempt
- View history
- Open event/company event list

History should show old value and new value correctly from audit logs.

### 8. Reminder Event List

1. Load events and reminder masters.
2. Calculate reminder dates from the selected reminder settings.
3. Use `reminder_date_basis`:
   - actual due date basis uses `due_date`
   - extended basis uses `extended_due_date` when present, otherwise `due_date`
4. Show reminder dates and event context.

### 9. Reminder Cron / Email Send

1. Manual cron page calls the due reminder API for a chosen date.
2. Backend finds matching reminder/event rows.
3. Recipients are resolved at send time:
   - officials by `official_id` primary email
   - users by user id/email
   - external recipients by JSON email
4. Duplicate emails are de-duplicated before send/log display.
5. Subject and message templates are rendered with merge fields.
6. Subject must be decoded/stripped from HTML editor tags.
7. Email sends through SMTP using nodemailer.
8. Logs store detailed backend data and user-friendly summary messages.

Important limitation:

SMTP `accepted` means the SMTP server accepted the message. It does not guarantee the final mailbox received it. Invalid syntax and provider rejections can be shown immediately; later bounces require mailbox/bounce processing if needed.

### 10. Reminder Log UI

The UI should show:

- Sent count
- Failed count
- Skipped count
- Invalid count
- Unique success emails
- Unique invalid emails with reason
- Unique failed emails with reason
- Unique skipped emails with reason

For user readability:

- Do not repeat duplicate email rows.
- Do not show long provider success messages for every success.
- Show detailed reason only for invalid, failed, or skipped rows.

## Old Logic Mapping

| Old Behavior | New Structure |
| --- | --- |
| Event type ids | `event_slug` driven logic |
| Company AGM/FYE date rows | `DateInformationSection` + `CompanyEventService` delegation |
| Rule date creation | `EntityCompanyService` rule engine |
| FYE/AD action buttons | Latest eligible row only |
| 3 extension options | Due tracker extension options by eligible slug |
| Extended due date changes | Audit log history |
| Reminder uses actual/extended date | `reminder_date_basis` on `company_event` |
| Reminder email template variables | Merge fields resolved from event/company context |
| System events protected | `is_system_event` |
| Event vs log type | `event_type = EVENT / LOG` |

## Validation Rules

### FYE / AD

- Company must have incorporation date and required company financial date before allowing FYE/AD entry.
- Actual FYE/AD date is required.
- Actual date must not be before period start.
- Backend must validate range and return meaningful messages.
- Frontend should not display confusing success text like `FYE allowed` when backend status is out of range.

### Event Form

- Company is required.
- Event type is required.
- Due date is required where applicable.
- Sender email and reply email must be valid.
- At least one recipient is required when sending/reminder behavior depends on recipients.
- Meeting end time must be after start time.
- Corporate chairman representative is required when chairman is corporate.

### Due Tracker

- Extension allowed only for eligible event slugs.
- Maximum extension count follows old logic.
- Extension date must be valid and after the current effective due date.
- Cancel/dispense/exempt actions must write audit history.

### Reminder Send

- Deduplicate emails.
- Reject invalid email format before SMTP.
- Log provider rejection/failure clearly.
- Do not rely only on stale email stored in recipient JSON for officials.

## Key Implementation Rules

- Use `event_slug` for event logic decisions.
- Keep `EntityCompanyService` as the rule-based company event generator.
- Do not create new extension history JSON when audit log already stores the action trail.
- Do not show protected system events as editable/deletable in master setup.
- Do not use old event ids in frontend logic.
- Keep reminder email sending SMTP-only unless a new provider is explicitly added.
- Keep user-facing log messages short and clear; keep technical details in backend log fields.

## Test Checklist

### Event Master

- Create EVENT master.
- Create LOG master.
- Verify system event is view-only.
- Verify recurring fields show only when `is_recurring` is checked.
- Verify event create dropdown only shows `EVENT`.

### Company Date Information

- Company without incorporation date shows the old warning.
- Latest FYE row shows FYE action.
- Latest AD row shows AD action.
- Non-latest rows do not show action buttons.
- Actual FYE validation messages are meaningful.
- Confirm creates/updates expected company events through rules.
- No duplicate events are created for the same period/rule.

### Event Form

- Add manual event.
- Edit manual event.
- Edit system/statutory event readonly fields.
- Filing date marks event completed.
- Recurring next event is created once.
- Recurring next event is not duplicated.

### Multiple Event Create

- Create events for multiple companies.
- Officials and system users appear in recipients.
- User emails are included when selected.
- Created events match single-event structure.

### Due Tracker

- List shows only rows with due date.
- Filters work.
- Extend appears only for eligible events.
- 1st/2nd/3rd extension works.
- 4th extension is blocked.
- Cancel extension works.
- Dispense/exempt and cancel actions work.
- History modal shows old/new values.
- Last changed row is highlighted after reload.

### Reminder

- Reminder dates calculate from actual due date.
- Reminder dates calculate from extended due date when basis requires it.
- Official email resolves from official primary contact.
- External recipient uses entered email.
- Duplicate emails are shown once.
- Invalid emails are logged.
- SMTP failures are logged.
- Cron summary and log page show useful user messages.

## Known Risks / Future Improvements

- High volume reminder sending should eventually use a queue table and worker locking instead of one long request.
- SMTP accepted recipients are not proof of final inbox delivery.
- Merge fields should ideally be loaded from backend into the reminder master UI to avoid frontend/backend drift.
- Event list includes should stay light for list pages and load full company/reminder context only for detail or cron flows.
- Any change to `EntityCompanyService` can affect company creation and FYE event generation, so changes there should be deliberate and tested.

