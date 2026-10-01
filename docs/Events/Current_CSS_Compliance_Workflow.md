# Current CSS Compliance Workflow

## 1. Overview

This document reflects the workflow currently implemented in the system, based on the live backend services, routes, frontend pages, and database models in the project.

The current implementation focuses on:

- Company/entity compliance setup
- Event master definition
- Rule-based due date generation
- Company-specific event creation
- Due date tracking and status progression
- Reminder generation and email dispatch
- Filing, completion, waiver, exemption, and cancellation handling
- Audit logging and reminder log tracking

---

## 2. Current Implementation Workflow

```text
Entity / Company
  -> Company date information / FYE / AD details
  -> Event master records in company_event_name
  -> Rule definitions in company_event_rule
  -> Rule engine creates company_event entries
  -> Event is tracked in company_event
  -> Status moves through workflow states
  -> Due date tracker / extensions / waivers are applied
  -> Reminder scheduler sends notifications from reminder_settings
  -> Reminder results are logged in company_event_reminder_log
  -> Event is marked as filed / completed / waived / exempt / cancelled
  -> Audit logs track status and update actions
```

---

## 3. Current Workflow by Stage

| Stage | Current implementation | Main files |
| --- | --- | --- |
| Company setup | Company and date/FYE metadata is used before compliance generation | [css_frontend/src/pages/Company/steps/DateInformationSection.js](../../css_frontend/src/pages/Company/steps/DateInformationSection.js), [css_frontend/src/pages/Company/steps/Step1BusinessEntity.js](../../css_frontend/src/pages/Company/steps/Step1BusinessEntity.js) |
| Event master setup | Master event definitions are created and maintained | [css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js](../../css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js) |
| Rule setup | Event rules determine due date generation and matching logic | [css_frontend/src/pages/Settings/MasterSettings/EventRule.js](../../css_frontend/src/pages/Settings/MasterSettings/EventRule.js), [css_backend/src/service/company/EventRuleService.js](../../css_backend/src/service/company/EventRuleService.js) |
| Rule-generated creation | Company events are calculated and created from system/company data | [css_backend/src/service/company/EntityCompanyService.js](../../css_backend/src/service/company/EntityCompanyService.js) |
| Event lifecycle | Core event CRUD, due date, and workflow logic | [css_backend/src/service/company/CompanyEventService.js](../../css_backend/src/service/company/CompanyEventService.js) |
| Status transitions | Current business status workflow is centralized here | [css_backend/src/config/companyEventStatus.js](../../css_backend/src/config/companyEventStatus.js) |
| Due tracker | Due date, extension, and tracker actions | [css_frontend/src/pages/Compliance/DueDateTracker.js](../../css_frontend/src/pages/Compliance/DueDateTracker.js), [css_backend/src/controllers/company/CompanyEventController.js](../../css_backend/src/controllers/company/CompanyEventController.js) |
| Reminder setup | Reminder templates and schedules are configured | [css_frontend/src/pages/Settings/MasterSettings/Reminder.js](../../css_frontend/src/pages/Settings/MasterSettings/Reminder.js), [css_backend/src/service/company/ReminderService.js](../../css_backend/src/service/company/ReminderService.js) |
| Reminder execution | Cron/manual send logic triggers reminders | [css_backend/src/service/company/CommonCronService.js](../../css_backend/src/service/company/CommonCronService.js), [css_backend/src/controllers/company/CommonCronController.js](../../css_backend/src/controllers/company/CommonCronController.js) |
| Logging and audit | Reminder send results and event audit actions are logged | [css_backend/src/helper/LogHelper.js](../../css_backend/src/helper/LogHelper.js), [css_backend/src/models/company/CompanyEventReminderLog.js](../../css_backend/src/models/company/CompanyEventReminderLog.js) |

---

## 4. Current Status Workflow in Code

The current status lifecycle is centralized in:

- [css_backend/src/config/companyEventStatus.js](../../css_backend/src/config/companyEventStatus.js)

### Main statuses

| Status | Meaning |
| --- | --- |
| PENDING | Event created but not yet started |
| IN_PREPARATION | Work is being prepared |
| AWAITING_DOCUMENTS | Waiting for required documents |
| AWAITING_CLIENT | Waiting for client response |
| AWAITING_APPROVAL | Waiting for internal approval |
| READY_TO_FILE | Ready for filing/dispatch |
| FILED | Filing completed |
| COMPLETED | Final completion state |
| WAIVED | Waived |
| DISPENSE | Dispensed |
| EXEMPT | Exempt |
| CANCELLED | Cancelled |
| NOT_APPLICABLE | Not applicable |

### Open statuses used in reminder / due processing

- PENDING
- IN_PREPARATION
- AWAITING_DOCUMENTS
- AWAITING_CLIENT
- AWAITING_APPROVAL
- READY_TO_FILE

This is the current logic used by the implementation, not the old legacy workflow.

---

## 5. Current File Paths

### 5.1 Frontend paths

| Area | File path | Purpose |
| --- | --- | --- |
| Compliance list | [css_frontend/src/pages/Compliance/ComplianceList.js](../../css_frontend/src/pages/Compliance/ComplianceList.js) | Compliance landing/list page |
| Event list | [css_frontend/src/pages/Compliance/EventList.js](../../css_frontend/src/pages/Compliance/EventList.js) | Event listing |
| Event form | [css_frontend/src/pages/Compliance/EventForm.js](../../css_frontend/src/pages/Compliance/EventForm.js) | Create/edit event |
| Multi event create | [css_frontend/src/pages/Compliance/MultiEventCreate.js](../../css_frontend/src/pages/Compliance/MultiEventCreate.js) | Bulk creation |
| Due date tracker | [css_frontend/src/pages/Compliance/DueDateTracker.js](../../css_frontend/src/pages/Compliance/DueDateTracker.js) | Due date tracker and extension actions |
| Reminder list | [css_frontend/src/pages/Compliance/ReminderEventList.js](../../css_frontend/src/pages/Compliance/ReminderEventList.js) | Reminder event list |
| Reminder logs | [css_frontend/src/pages/Compliance/ReminderLogList.js](../../css_frontend/src/pages/Compliance/ReminderLogList.js) | Reminder logs and results |
| Reminder cron page | [css_frontend/src/pages/Compliance/ReminderCronPage.js](../../css_frontend/src/pages/Compliance/ReminderCronPage.js) | Manual trigger page |
| Event master | [css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js](../../css_frontend/src/pages/Settings/MasterSettings/CompanyEventName.js) | Event/master configuration |
| Event rule | [css_frontend/src/pages/Settings/MasterSettings/EventRule.js](../../css_frontend/src/pages/Settings/MasterSettings/EventRule.js) | Rule setup |
| Reminder master | [css_frontend/src/pages/Settings/MasterSettings/Reminder.js](../../css_frontend/src/pages/Settings/MasterSettings/Reminder.js) | Reminder setup |
| Company date info | [css_frontend/src/pages/Company/steps/DateInformationSection.js](../../css_frontend/src/pages/Company/steps/DateInformationSection.js) | FYE/company date setup |
| API helper | [css_frontend/src/helpers/backend_helper.js](../../css_frontend/src/helpers/backend_helper.js) | Frontend API wrapper |
| URL helper | [css_frontend/src/helpers/url_helper.js](../../css_frontend/src/helpers/url_helper.js) | Endpoint constants |

### 5.2 Backend paths

| Area | File path | Purpose |
| --- | --- | --- |
| Event controller | [css_backend/src/controllers/company/CompanyEventController.js](../../css_backend/src/controllers/company/CompanyEventController.js) | Event API actions |
| Event service | [css_backend/src/service/company/CompanyEventService.js](../../css_backend/src/service/company/CompanyEventService.js) | Main compliance workflow logic |
| Company service | [css_backend/src/service/company/EntityCompanyService.js](../../css_backend/src/service/company/EntityCompanyService.js) | Auto rule-based event generation |
| Rule service | [css_backend/src/service/company/EventRuleService.js](../../css_backend/src/service/company/EventRuleService.js) | Event rules CRUD and matching |
| Reminder service | [css_backend/src/service/company/ReminderService.js](../../css_backend/src/service/company/ReminderService.js) | Reminder logic and templates |
| Cron service | [css_backend/src/service/company/CommonCronService.js](../../css_backend/src/service/company/CommonCronService.js) | Reminder/background scheduling |
| Reminder controller | [css_backend/src/controllers/company/ReminderController.js](../../css_backend/src/controllers/company/ReminderController.js) | Reminder endpoints |
| Common cron controller | [css_backend/src/controllers/company/CommonCronController.js](../../css_backend/src/controllers/company/CommonCronController.js) | Cron/manual handling |
| Status config | [css_backend/src/config/companyEventStatus.js](../../css_backend/src/config/companyEventStatus.js) | Workflow status source of truth |
| Event routes | [css_backend/src/route/event/index.js](../../css_backend/src/route/event/index.js) | Event route registration |
| Reminder routes | [css_backend/src/route/event/reminderRoute.js](../../css_backend/src/route/event/reminderRoute.js) | Reminder route registration |
| Cron routes | [css_backend/src/route/event/reminderCronRoute.js](../../css_backend/src/route/event/reminderCronRoute.js) | Cron/manual reminder routes |
| Email helper | [css_backend/src/helper/EmailHelper.js](../../css_backend/src/helper/EmailHelper.js) | Email sending |
| Event helper | [css_backend/src/helper/eventHelper.js](../../css_backend/src/helper/eventHelper.js) | Shared helper logic |
| Log helper | [css_backend/src/helper/LogHelper.js](../../css_backend/src/helper/LogHelper.js) | Audit and log handling |

### 5.3 Documentation paths

| Document | File path | Purpose |
| --- | --- | --- |
| Current workflow doc | [docs/Events/Current_CSS_Compliance_Workflow.md](Current_CSS_Compliance_Workflow.md) | Current implementation summary |
| Event artifact | [docs/Events/event-management-system-artifact.md](event-management-system-artifact.md) | Architecture and workflow artifact |
| Old workflow doc | [docs/Events/old-system-full-workflow-documentation.md](old-system-full-workflow-documentation.md) | Legacy old-process reference |
| DB blueprint | [docs/Events/new-system-full-workflow-db-blueprint.md](new-system-full-workflow-db-blueprint.md) | Recommended data model blueprint |

---

## 6. Current Database Tables Used by the System

### 6.1 Main compliance tables

| Table | Current role |
| --- | --- |
| `company_event_name` | Master list of event/log definitions, recurring behavior, system event metadata |
| `company_event_rule` | Stores rule definitions used to calculate due dates and create events |
| `company_event` | Stores actual company-specific compliance records, due dates, status, attendees, and filing details |
| `reminder_settings` | Reminder templates, schedule, message, and event mapping |
| `company_event_reminder_log` | Reminder send attempts, results, recipient summary, and error details |

### 6.2 Supporting tables

| Table | Current role |
| --- | --- |
| `company_event_documents` | Event document checklist and uploaded document records |
| `compliance_rule_calculation_log` | Tracks rule calculation trace data |
| `compliance_extensions` | Stores extension actions and adjusted due dates |
| `compliance_waivers` | Stores waiver / exemption records linked to company events |
| `document_store` | Holds uploaded document references used by compliance workflows |

---

## 7. Current Table Structure and Important Fields

### `company_event_name`

Main fields used in the current implementation:

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

Main fields used in the current implementation:

- `rule_id`
- `event_id`
- `event_slug`
- due-date rule conditions
- matching logic for company/event data

### `company_event`

Main fields used in the current implementation:

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
- audit fields

### `company_event_reminder_log`

Main fields used in the current implementation:

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

## 8. Current Business Flow in Plain Terms

1. The company/entity setup provides the baseline data for compliance processing.
2. The event master defines the event type and system event metadata.
3. Event rules determine when a company event should be created and its due date.
4. Actual company records are generated in `company_event`.
5. Each event moves through a current status lifecycle from pending to ready-to-file and final completion or closure.
6. The system supports due-date extension and waiver/exemption handling.
7. Reminder templates are used to send notifications and track result logs.
8. Completed actions are retained in audit/log tables for traceability.

---

## 9. Actual implementation summary

The current implemented compliance workflow is centered on the following core chain:

- [css_backend/src/config/companyEventStatus.js](../../css_backend/src/config/companyEventStatus.js)
- [css_backend/src/service/company/CompanyEventService.js](../../css_backend/src/service/company/CompanyEventService.js)
- [css_backend/src/service/company/EntityCompanyService.js](../../css_backend/src/service/company/EntityCompanyService.js)
- [css_backend/src/service/company/CommonCronService.js](../../css_backend/src/service/company/CommonCronService.js)
- [css_backend/src/service/company/ReminderService.js](../../css_backend/src/service/company/ReminderService.js)

This is the live workflow used by the project now, and not the legacy old-system workflow.
