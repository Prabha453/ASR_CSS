# CSS Compliance Workflow

## 1. Overview

This document summarizes the CSS compliance/event workflow, related files, and database tables used in the current project.

The compliance lifecycle includes:

- Company / entity registration and date information
- Event master setup
- Rule-based due date generation
- Event creation and tracking
- Due date extension and status updates
- Reminder scheduling and email sending
- Completion, filing, waiver, exemption, or cancellation
- Audit / reminder logging

---

## 2. Compliance Workflow Flow

```text
Company / Entity
  -> Company date information / FYE / AD setup
  -> Event master setup (company_event_name)
  -> Rule setup (company_event_rule)
  -> Auto generation of company_event rows
  -> Manual event creation / recurring event generation
  -> Due date + extension logic
  -> Reminder schedule + email sending
  -> Filing / completion / waiver / exemption / cancellation
  -> Audit log and reminder log tracking
```

---

## 3. Main Workflow Statuses

The compliance status lifecycle is defined in:

- `css_backend/src/config/companyEventStatus.js`

Main statuses:

| Status | Meaning |
| --- | --- |
| PENDING | Event created but not started |
| IN_PREPARATION | Work is in progress |
| AWAITING_DOCUMENTS | Waiting on documents |
| AWAITING_CLIENT | Waiting for client action |
| AWAITING_APPROVAL | Waiting for approval |
| READY_TO_FILE | Ready to submit/file |
| FILED | Filed successfully |
| COMPLETED | Completed after filing or closure |
| WAIVED | Waived |
| DISPENSE | Dispensed |
| EXEMPT | Exempted |
| CANCELLED | Cancelled |
| NOT_APPLICABLE | Not applicable |

Open statuses used for reminders and due date processing:

- PENDING
- IN_PREPARATION
- AWAITING_DOCUMENTS
- AWAITING_CLIENT
- AWAITING_APPROVAL
- READY_TO_FILE

---

## 4. Related File Paths

### 4.1 Frontend Files

| Module | File path | Purpose |
| --- | --- | --- |
| Compliance list | `css_frontend/src/pages/Compliance/ComplianceList.js` | Company compliance landing/list page |
| Event list | `css_frontend/src/pages/Compliance/EventList.js` | Event listing |
| Event form | `css_frontend/src/pages/Compliance/EventForm.js` | Add/edit single event |
| Multi-event create | `css_frontend/src/pages/Compliance/MultiEventCreate.js` | Bulk event creation |
| Due date tracker | `css_frontend/src/pages/Compliance/DueDateTracker.js` | Due date extensions and status actions |
| Reminder event list | `css_frontend/src/pages/Compliance/ReminderEventList.js` | Reminder event list |
| Reminder logs | `css_frontend/src/pages/Compliance/ReminderLogList.js` | Reminder results/logs |
| Reminder cron | `css_frontend/src/pages/Compliance/ReminderCronPage.js` | Manual cron trigger UI |
| Event master | `css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js` | Event master definition |
| Event rules | `css_frontend/src/pages/Settings/MasterSettings/EventRule.js` | Rule configuration |
| Reminder master | `css_frontend/src/pages/Settings/MasterSettings/Reminder.js` | Reminder templates |
| Company date info | `css_frontend/src/pages/Company/steps/DateInformationSection.js` | FYE/company-date information |
| API helper | `css_frontend/src/helpers/backend_helper.js` | Frontend API wrapper |
| URL constants | `css_frontend/src/helpers/url_helper.js` | Endpoint constants |

### 4.2 Backend Files

| Module | File path | Purpose |
| --- | --- | --- |
| Event controller | `css_backend/src/controllers/company/CompanyEventController.js` | Event API handling |
| Event service | `css_backend/src/service/company/CompanyEventService.js` | Main company event lifecycle logic |
| Company service | `css_backend/src/service/company/EntityCompanyService.js` | Rule-based statutory event generation |
| Event rule service | `css_backend/src/service/company/EventRuleService.js` | Rule CRUD and matching |
| Reminder service | `css_backend/src/service/company/ReminderService.js` | Reminder templates and send logic |
| Cron service | `css_backend/src/service/company/CommonCronService.js` | Reminder cron and background processing |
| Status config | `css_backend/src/config/companyEventStatus.js` | Main state transition mapping |
| Event routes | `css_backend/src/route/event/index.js` | Event route registration |
| Reminder routes | `css_backend/src/route/event/reminderRoute.js` | Reminder route registration |
| Cron routes | `css_backend/src/route/event/reminderCronRoute.js` | Manual cron route registration |
| Email helper | `css_backend/src/helper/EmailHelper.js` | SMTP/email sending |
| Event helper | `css_backend/src/helper/eventHelper.js` | Shared compliance helper logic |
| Log helper | `css_backend/src/helper/LogHelper.js` | Audit log support |

### 4.3 Documentation Files

| Doc | File path | Purpose |
| --- | --- | --- |
| Event artifact | `docs/Events/event-management-system-artifact.md` | Overall event/compliance architecture |
| Old workflow doc | `docs/Events/old-system-full-workflow-documentation.md` | Legacy business process reference |
| DB blueprint | `docs/Events/new-system-full-workflow-db-blueprint.md` | Recommended new workflow/db structure |

---

## 5. Related Tables

### 5.1 Primary Compliance Tables

| Table | Purpose |
| --- | --- |
| `company_event_name` | Master list of event/log types, recurring settings, system event metadata |
| `company_event_rule` | Rule definitions used to calculate due dates and create events |
| `company_event` | Actual company-specific events with dates, status, attendees, recipients, and filing data |
| `reminder_settings` | Reminder master setup, due date offset, subject, message, schedule |
| `company_event_reminder_log` | Reminder attempts, send status, result summary, failure details |

### 5.2 Supporting Tables

| Table | Purpose |
| --- | --- |
| `company_event_documents` | Event document checklist and uploaded document mapping |
| `compliance_rule_calculation_log` | Rule calculation trace log |
| `compliance_extensions` | Due date extension records |
| `compliance_waivers` | Waiver or exemption tracking |
| `document_store` | Stored uploaded files/documents |

---

## 6. Important Table Fields

### `company_event_name`

Important fields:

- `e_id`
- `event_type`
- `event_name`
- `event_slug`
- `event_subject`
- `color_code`
- `is_system_event`
- `is_recurring`
- `recurring_period`
- `recurring_duration`
- `is_deleted`

### `company_event_rule`

Important fields:

- `rule_id`
- `event_id`
- `event_slug`
- due date conditions and matching logic
- rule-based generation metadata

### `company_event`

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
- `reminder_date_basis`
- `held_date`
- `filing_date`
- `status`
- `source_from`
- `source_basis`
- `attendees`
- `receiving_parties`
- `agm_status_details`
- `meeting_details`
- audit columns

### `company_event_reminder_log`

Important fields:

- `log_id`
- `company_event_id`
- `reminder_id`
- `scheduled_date`
- `sent_at`
- `status`
- `recipient_summary`
- `result_summary`
- `recipient_results`
- `subject_snapshot`
- `message_snapshot`
- `sender_email`
- `reply_to_email`
- `provider_response`
- `user_message`
- `technical_message`

---

## 7. Summary

The CSS compliance workflow is centered around:

1. `company_event_name` for event definitions
2. `company_event_rule` for rule-based due date calculations
3. `company_event` for actual event records and statuses
4. `reminder_settings` and `company_event_reminder_log` for reminders
5. `compliance_extensions` and `compliance_waivers` for extension and exemption handling

This architecture is documented in:

- `docs/Events/event-management-system-artifact.md`
- `docs/Events/new-system-full-workflow-db-blueprint.md`
- `css_backend/src/config/companyEventStatus.js`
- `css_backend/src/service/company/CompanyEventService.js`

---

## 8. Key Source References

- `docs/Events/event-management-system-artifact.md`
- `css_backend/src/config/companyEventStatus.js`
- `css_backend/src/service/company/CompanyEventService.js`
- `css_backend/src/service/company/EntityCompanyService.js`
- `css_backend/src/service/company/CommonCronService.js`
- `css_backend/src/models/company/CompanyEvent.js`
- `css_backend/src/models/masterSettings/CompanyEventName.js`
- `css_backend/src/models/company/CompanyEventReminderLog.js`
