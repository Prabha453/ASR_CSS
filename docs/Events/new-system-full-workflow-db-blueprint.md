# New System Full Workflow And Database Blueprint

This document describes the recommended new structure for rebuilding the old CRM, Projects, Sales Order, Invoice, Expense, Cost Recovery, Settings, and Compliance Event workflows in the current React + Node/Sequelize project.

The goal is to keep the old business logic but not copy the old technical structure.

## 1. New System Principles

1. Use one clear table per business concept.
2. Keep routes, controllers, validators, services, DAOs, models, migrations, and seeders separate.
3. Use service classes for business workflows.
4. Use DAOs only for database access.
5. Use validators before service calls.
6. Use audit logs for important business actions.
7. Avoid JSON for data that needs filtering/reporting.
8. Use JSON only for snapshots, email payloads, or flexible metadata.
9. Use slugs/codes for statuses and settings.
10. Keep UI pages workflow-based, not table-based.
11. Use the existing `document_store` table for every upload in every module.

## 1.1 Unified Document Upload Standard

All pages must use the existing document upload flow:

- Backend upload helper: `css_backend/src/helper/documentHelper.js`
- Generic API route: `/document-store`
- Table: `document_store`
- Tenant/port scope: `document_store.port_number`

Do not create module-specific upload tables such as `crm_lead_document`, `project_document`, `invoice_attachment`, or JSON fields such as `uploaded_files` for new pages. Those old structures make documents hard to search, secure, delete, and port-scope.

Recommended document mapping:

| Module | `entity_type` | `module_name` | `sub_module_name` | `module_record_id` | `doc_category` |
|---|---|---|---|---|---|
| CRM lead | `company` or `lead` | `crm` | `lead` | `lead_id` | `lead_document` |
| CRM quotation | `company` | `crm` | `quotation` | `quotation_id` | `quotation_attachment` |
| Sales order | `company` | `sales` | `sales_order` | `sales_order_id` | `sales_order_attachment` |
| Invoice | `company` | `finance` | `invoice` | `invoice_id` | `invoice_attachment` |
| Expense | `company` or `expense` | `expense` | `expense` | `expense_id` | `expense_receipt` |
| Project | `company` | `project` | `project` | `project_id` | `project_document` |
| Project task | `company` | `project` | `task` | `task_id` | `task_attachment` |
| Event reminder | `company` | `event` | `reminder` | `reminder_id` | `reminder_attachment` |
| Company profile | `company` | `company_profile` | field name | `cp_id` | logo/category name |

Frontend pages should call the shared helpers in `css_frontend/src/helpers/backend_helper.js`:

- `uploadDocumentStore(formData)`
- `uploadMultipleDocumentStore(formData)`
- `getDocumentStoreList(params)`
- `getDocumentStore(id, params)`
- `deleteDocumentStore(id, params)`
- `getDocumentStoreStats(params)`

Every upload `FormData` should include:

- `port_name`
- `entity_id`
- `entity_type`
- `module_name`
- `sub_module_name`
- `module_record_id`
- `doc_category`
- `doc_name`
- `file` or `files`

The helper automatically appends `port_name` from the logged-in user when the page does not pass it.

## 2. Recommended Backend Structure

```text
css_backend/src/
  route/
    crm/
      index.js
      leadRoute.js
      quotationRoute.js
      salesOrderRoute.js
      crmSettingsRoute.js
      crmDashboardRoute.js
    project/
      index.js
      projectRoute.js
      projectTaskRoute.js
      projectCycleRoute.js
      workspaceRoute.js
      pmSettingsRoute.js
    finance/
      index.js
      invoiceRoute.js
      paymentRoute.js
      creditNoteRoute.js
      debitNoteRoute.js
      billingRoute.js
      financeSettingsRoute.js
    expense/
      index.js
      expenseRoute.js
      costRecoveryRoute.js
    compliance/
      index.js
      companyEventRoute.js
      dueDateTrackerRoute.js
      reminderRoute.js
      commonCronRoute.js

  controllers/
    crm/
    project/
    finance/
    expense/
    compliance/

  service/
    crm/
    project/
    finance/
    expense/
    compliance/

  dao/
    crm/
    project/
    finance/
    expense/
    compliance/

  validator/
    crm/
    project/
    finance/
    expense/
    compliance/

  models/
    crm/
    project/
    finance/
    expense/
    company/
    masterSettings/

  helper/
    auditHelper.js
    emailHelper.js
    numberSequenceHelper.js
    billingCalculationHelper.js
    projectCycleHelper.js
    eventHelper.js
    reminderTemplateHelper.js
```

## 3. Recommended Frontend Page Structure

```text
css_frontend/src/pages/
  CRM/
    Dashboard/
    Leads/
      LeadList.js
      LeadForm.js
      LeadView.js
    Quotations/
      QuotationList.js
      QuotationForm.js
      QuotationView.js
    SalesOrders/
      SalesOrderList.js
      SalesOrderForm.js
      SalesOrderView.js
      SalesOrderMilestone.js
    Settings/
      PreSalesSettings.js
      LeadStatus.js
      LeadSource.js
      OrderReason.js
      SlaTerms.js
      CrmEmailTemplates.js

  Projects/
    ProjectList.js
    ProjectForm.js
    ProjectView.js
    TaskList.js
    TaskForm.js
    WorkspaceList.js
    Settings/
      PMSettings.js
      ProjectStatus.js
      TaskStatus.js
      TicketStatus.js
      TaskPriority.js
      TicketPriority.js
      CycleMaster.js
      WorkspaceMaster.js
      TeamManagement.js

  Finance/
    Invoices/
      InvoiceList.js
      InvoiceForm.js
      InvoiceView.js
      InvoiceApprovalList.js
    Payments/
      PaymentList.js
      PaymentForm.js
    CreditNotes/
    DebitNotes/
    Billing/
    Reports/
    Settings/
      InvoiceSettings.js
      BranchInvoiceSettings.js
      InvoiceTemplates.js
      PaymentMethods.js
      ApprovalSettings.js

  Expenses/
    ExpenseList.js
    ExpenseForm.js
    CostRecoveryList.js
    CostRecoveryForm.js

  Compliance/
    ComplianceList.js
    EventList.js
    EventForm.js
    MultiEventCreate.js
    DueDateTracker.js
    ReminderEventList.js
    ReminderLogList.js
    CommonCronRun.js
```

## 4. New Database Naming Rules

Use singular table names where possible:

- `crm_lead`
- `crm_quotation`
- `crm_sales_order`
- `project`
- `project_task`
- `finance_invoice`
- `expense`
- `company_event`

Common columns:

- `is_deleted`
- `created_date`
- `created_by`
- `updated_date`
- `updated_by`
- `deleted_date`
- `deleted_by`

Use stable codes:

- status code: `DRAFT`, `PENDING`, `APPROVED`
- source code: `MANUAL`, `SYSTEM`, `FYE_DATE`, `SALES_ORDER`
- event slug: `agm`, `ar`, `eci`, `anniversary`

## 5. CRM Database Structure

### 5.1 `crm_lead`

Purpose: lead/opportunity header.

Columns:

- `lead_id`
- `entity_id`
- `lead_no`
- `lead_name`
- `lead_date`
- `source_id`
- `status_id`
- `rating_id`
- `sales_owner_id`
- `expected_closing_date`
- `description`
- `lost_reason_id`
- `lost_remarks`
- `converted_quotation_id`
- `converted_sales_order_id`
- common audit columns

### 5.2 `crm_lead_service`

Purpose: lead service/package/part lines.

Columns:

- `lead_service_id`
- `lead_id`
- `service_id`
- `package_id`
- `part_id`
- `description`
- `qty`
- `uom_id`
- `unit_price`
- `discount_type`
- `discount_value`
- `tax_rate`
- `net_total`
- `sort_order`
- common audit columns

### 5.3 `crm_lead_followup`

Purpose: follow-up, call, meeting, reminder, note.

Columns:

- `followup_id`
- `lead_id`
- `entity_id`
- `mode_id`
- `agenda_id`
- `followup_date`
- `next_followup_date`
- `assigned_to`
- `remarks`
- `status`
- common audit columns

### 5.4 Lead Documents

Lead documents must be stored in the shared `document_store` table.

Use:

- `module_name`: `crm`
- `sub_module_name`: `lead`
- `module_record_id`: `lead_id`
- `doc_category`: `lead_document`
- `port_number`: resolved from logged-in port

## 6. Quotation Database Structure

### 6.1 `crm_quotation`

Columns:

- `quotation_id`
- `lead_id`
- `entity_id`
- `quotation_no`
- `quotation_date`
- `valid_until`
- `sales_person_id`
- `pic_id`
- `branch_id`
- `contact_id`
- `currency`
- `subtotal`
- `discount_type`
- `discount_value`
- `tax_total`
- `grand_total`
- `status_id`
- `terms_snapshot`
- `email_sent_count`
- common audit columns

### 6.2 `crm_quotation_item`

Columns:

- `quotation_item_id`
- `quotation_id`
- `line_type`
- `service_id`
- `package_id`
- `part_id`
- `description`
- `qty`
- `uom_id`
- `unit_price`
- `discount_type`
- `discount_value`
- `tax_rate`
- `tax_amount`
- `net_total`
- `sort_order`
- common audit columns

## 7. Sales Order Database Structure

### 7.1 `crm_sales_order`

This replaces the old mixed use of `crm_convert_order`, `crm_sales_order`, `crm_orders_project`, and `crm_project_sales`.

Columns:

- `sales_order_id`
- `entity_id`
- `lead_id`
- `quotation_id`
- `project_id`
- `parent_sales_order_id`
- `sales_order_no`
- `sequence_no`
- `sales_person_ids`
- `reason_id`
- `remarks`
- `status`
- `billing_method`
- `pm_notification_enabled`
- `pm_notification_days`
- `subtotal`
- `tax_total`
- `grand_total`
- `amount_collected`
- `source_from`
- common audit columns

Status values:

- `DRAFT`
- `CONFIRMED`
- `CONVERTED_TO_PROJECT`
- `LOST`
- `CANCELLED`

Billing methods:

- `ON_THE_GO`
- `MILESTONE`

### 7.2 `crm_sales_order_item`

Columns:

- `sales_order_item_id`
- `sales_order_id`
- `quotation_item_id`
- `service_id`
- `package_id`
- `part_id`
- `description`
- `qty`
- `uom_id`
- `unit_price`
- `discount_type`
- `discount_value`
- `tax_rate`
- `tax_amount`
- `net_total`
- `project_task_template_id`
- common audit columns

### 7.3 `crm_sales_order_milestone`

Columns:

- `milestone_id`
- `sales_order_id`
- `sales_order_item_id`
- `name`
- `percentage`
- `amount`
- `amount_type`
- `creation_basis`
- `creation_date`
- `creation_duration`
- `creation_duration_type`
- `expected_payment_basis`
- `expected_payment_date`
- `expected_payment_duration`
- `expected_payment_duration_type`
- `paid_amount`
- `due_amount`
- `invoice_id`
- `followup_required`
- `status`
- common audit columns

Status values:

- `PENDING`
- `INVOICED`
- `PAID`
- `CANCELLED`

## 8. Project / PM Database Structure

### 8.1 `project`

Columns:

- `project_id`
- `workspace_id`
- `entity_id`
- `lead_id`
- `quotation_id`
- `sales_order_id`
- `project_no`
- `project_name`
- `status_id`
- `priority_id`
- `importance_id`
- `manager_id`
- `assigned_user_ids`
- `start_date`
- `due_date`
- `completed_date`
- `progress_percent`
- `description`
- `tags`
- `source_from`
- common audit columns

### 8.2 `project_detail`

Columns:

- `project_detail_id`
- `project_id`
- `sales_order_item_id`
- `service_id`
- `package_id`
- `part_id`
- `description`
- `qty`
- `amount`
- common audit columns

### 8.3 `project_task`

Columns:

- `task_id`
- `project_id`
- `parent_task_id`
- `cycle_instance_id`
- `service_id`
- `task_no`
- `task_name`
- `task_detail`
- `status_id`
- `priority_id`
- `assigned_user_ids`
- `start_date`
- `due_date`
- `completed_date`
- `estimated_hours`
- `actual_hours`
- `billable_amount`
- `cost_amount`
- `sort_order`
- common audit columns

### 8.4 `project_cycle_master`

Columns:

- `cycle_master_id`
- `cycle_name`
- `workspace_id`
- `service_id`
- `is_active`
- common audit columns

### 8.5 `project_cycle_task_template`

Columns:

- `cycle_task_template_id`
- `cycle_master_id`
- `task_name`
- `task_detail`
- `priority_id`
- `duration`
- `duration_type`
- `dependency_template_id`
- `assigned_role`
- `sort_order`
- common audit columns

### 8.6 `project_cycle_instance`

Columns:

- `cycle_instance_id`
- `project_id`
- `cycle_master_id`
- `sales_order_id`
- `instance_no`
- `start_date`
- `due_date`
- `status`
- common audit columns

## 9. Finance / Invoice Database Structure

### 9.1 `finance_invoice`

This replaces `tbl_billing_master`.

Columns:

- `invoice_id`
- `entity_id`
- `branch_id`
- `agent_id`
- `sales_order_id`
- `project_id`
- `milestone_id`
- `invoice_no`
- `invoice_sequence`
- `draft_invoice_no`
- `draft_invoice_sequence`
- `invoice_type`
- `source_type`
- `source_id`
- `currency`
- `billing_address`
- `contact_id`
- `invoice_date`
- `due_date`
- `close_date`
- `subtotal`
- `tax_total`
- `discount_type`
- `discount_value`
- `expense_total`
- `grand_total`
- `paid_total`
- `due_total`
- `status_id`
- `approval_status`
- `commission_entitled`
- `commission_date`
- `external_remarks`
- `internal_remarks`
- `template_id`
- common audit columns

Source types:

- `MANUAL`
- `SALES_ORDER`
- `MILESTONE`
- `COST_RECOVERY`
- `EXPENSE`
- `RECURRING`

### 9.2 `finance_invoice_item`

This replaces `tbl_billing_child`.

Columns:

- `invoice_item_id`
- `invoice_id`
- `source_type`
- `source_id`
- `service_id`
- `fee_type_id`
- `description`
- `qty`
- `uom_id`
- `unit_price`
- `discount_type`
- `discount_value`
- `tax_rate`
- `tax_amount`
- `net_total`
- `sort_order`
- common audit columns

### 9.3 `finance_payment`

This replaces `tbl_billing_transaction`.

Columns:

- `payment_id`
- `invoice_id`
- `entity_id`
- `payment_date`
- `paid_by`
- `amount`
- `payment_method_id`
- `payment_reference`
- `description`
- `credit_note_id`
- `credit_note_item_id`
- common audit columns

### 9.4 `finance_invoice_status`

Columns:

- `status_id`
- `status_code`
- `status_name`
- `status_type`
- `sequence`
- `color`
- `is_default`
- `is_completed`
- `is_closed`
- common audit columns

Status examples:

- `DRAFT`
- `SUBMITTED`
- `APPROVAL_PENDING`
- `APPROVED`
- `REJECTED`
- `PAID`
- `PARTIALLY_PAID`
- `VOID`
- `PUSHED_TO_XERO`

### 9.5 `finance_invoice_approval_flow`

Columns:

- `approval_flow_id`
- `invoice_id`
- `category`
- `stage`
- `group_id`
- `approver_user_id`
- `status`
- `remarks`
- `acted_at`
- common audit columns

### 9.6 `finance_invoice_audit`

Columns:

- `audit_id`
- `invoice_id`
- `category`
- `stage`
- `action`
- `user_id`
- `remarks`
- `payload_snapshot`
- common audit columns

### 9.7 `finance_credit_note`

Columns:

- `credit_note_id`
- `entity_id`
- `invoice_id`
- `credit_note_no`
- `credit_note_sequence`
- `credit_note_date`
- `reason`
- `subtotal`
- `tax_total`
- `grand_total`
- `remaining_amount`
- `status_id`
- `approval_status`
- common audit columns

### 9.8 `finance_debit_note`

Columns:

- `debit_note_id`
- `entity_id`
- `invoice_id`
- `debit_note_no`
- `debit_note_sequence`
- `debit_note_date`
- `reason`
- `subtotal`
- `tax_total`
- `grand_total`
- `status_id`
- common audit columns

## 10. Expense / Cost Recovery Database Structure

### 10.1 `expense`

Columns:

- `expense_id`
- `entity_id`
- `project_id`
- `task_id`
- `expense_head_id`
- `expense_date`
- `currency`
- `amount`
- `exchange_rate`
- `base_amount`
- `description`
- `is_billable`
- `invoice_id`
- `status`
- common audit columns

Status values:

- `DRAFT`
- `APPROVED`
- `REJECTED`
- `INVOICED`
- `VOID`

### 10.2 `expense_file`

Columns:

- `file_id`
- `expense_id`
- `file_name`
- `file_path`
- `mime_type`
- `file_size`
- common audit columns

### 10.3 `expense_head`

Columns:

- `expense_head_id`
- `expense_head_name`
- `is_active`
- common audit columns

### 10.4 `cost_recovery`

Columns:

- `cost_recovery_id`
- `entity_id`
- `project_id`
- `sales_order_id`
- `invoice_id`
- `step_no`
- `status`
- `total_amount`
- common audit columns

### 10.5 `cost_recovery_item`

This replaces JSON stored in old `crm_cost_recovery.cost_recover_details`.

Columns:

- `cost_recovery_item_id`
- `cost_recovery_id`
- `source_type`
- `source_id`
- `description`
- `amount`
- `action_type`
- common audit columns

Source types:

- `EXPENSE`
- `TASK`
- `SALES_ORDER_INVOICE`
- `OTHER`

Action types:

- `INVOICE`
- `COR`
- `NULLIFY`

## 11. Compliance / Event Database Structure

### 11.1 `company_event_name`

Columns:

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
- common audit columns

Event type:

- `EVENT`
- `LOG`

System event examples:

- `agm`
- `ar`
- `eci`
- `anniversary`

### 11.2 `company_event`

Columns:

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
- `sent_date`
- `received_date`
- `status`
- `source_from`
- `source_basis`
- `recurring_period`
- `recurring_duration`
- `meeting_details`
- `agm_status_details`
- `attendees`
- `receiving_parties`
- `reminders`
- common audit columns

Status values:

- `PENDING`
- `COMPLETED`
- `WAIVED`
- `CANCELLED`

Display-only status:

- `OVERDUE` should be computed when `status = PENDING` and effective due date is before today.

Reminder date basis:

- `ACTUAL_DUE_DATE`
- `EXTENDED_DUE_DATE`

### 11.3 `company_event_reminder_log`

Columns:

- `log_id`
- `company_event_id`
- `reminder_id`
- `scheduled_date`
- `sent_at`
- `status`
- `sender_email`
- `recipient_summary`
- `recipient_result`
- `subject_snapshot`
- `message_snapshot`
- `summary_message`
- `technical_message`
- common audit columns

## 12. Settings Database Structure

### 12.1 Pre Sales Settings

Tables:

- `crm_lead_status`
- `crm_lead_source`
- `crm_lead_rating`
- `crm_order_reason`
- `crm_sla_term`
- `crm_sla_term_detail`
- `crm_email_template`
- `crm_notification_setting`
- `crm_number_setting`
- `crm_custom_field`
- `crm_custom_tab`

### 12.2 PM Settings

Tables:

- `pm_project_status`
- `pm_task_status`
- `pm_ticket_status`
- `pm_task_priority`
- `pm_ticket_priority`
- `pm_ticket_source`
- `pm_ticket_type`
- `pm_workspace`
- `pm_team`
- `pm_team_member`
- `pm_cycle_master`
- `pm_cycle_task_template`
- `pm_holiday`
- `pm_importance`

### 12.3 Finance Settings

Tables:

- `finance_invoice_status`
- `finance_invoice_template`
- `finance_payment_method`
- `finance_branch_setting`
- `finance_number_setting`
- `finance_approval_setting`
- `finance_bank_detail`
- `billing_cycle`
- `fee_type`
- `uom`

### 12.4 Shared Number Sequence

Table: `number_sequence`

Columns:

- `sequence_id`
- `module`
- `branch_id`
- `prefix`
- `format`
- `current_number`
- `reset_period`
- `number_mode`
- `template_id`
- common audit columns

Modules:

- `QUOTATION`
- `SALES_ORDER`
- `INVOICE`
- `DRAFT_INVOICE`
- `CREDIT_NOTE`
- `DRAFT_CREDIT_NOTE`
- `DEBIT_NOTE`
- `DRAFT_DEBIT_NOTE`
- `PROJECT`
- `TASK`

## 13. New End-To-End Workflows

### 13.1 Lead To Quotation

1. `LeadController.create` validates request.
2. `LeadService.create` stores lead.
3. `LeadService.addServices` stores service rows.
4. Follow-ups/documents are stored separately.
5. `QuotationService.createFromLead` copies services into quotation items.
6. `NumberSequenceService` generates quote number.
7. Quotation can be emailed and logged.

### 13.2 Quotation To Sales Order

1. `SalesOrderService.createFromQuotation` validates quotation.
2. Sales order number is generated.
3. Quotation items become sales order items.
4. Billing method is selected.
5. Milestones are created if billing method is `MILESTONE`.
6. Audit log records conversion.

### 13.3 Sales Order To Project

1. `SalesOrderProjectService.createProjectFromOrder` validates confirmed order.
2. Project header is created.
3. Sales order items become project detail rows.
4. Cycle/task templates create project tasks.
5. Manager/team assignment is applied.
6. PM notification is sent if enabled.
7. Sales order is linked to project.

### 13.4 Project Task Execution

1. Project appears in workspace list.
2. User sees projects/tasks based on permissions/team.
3. Task statuses move through PM status workflow.
4. Files, comments, activity, and expenses are added.
5. Completed status updates project progress.

### 13.5 Milestone Invoice

1. User selects sales order milestone.
2. `InvoiceService.createFromMilestone` creates invoice header and line.
3. Milestone is marked `INVOICED`.
4. Invoice can go through approval.

### 13.6 On-The-Go Invoice

1. User selects sales order items.
2. `InvoiceService.createFromSalesOrderItems` creates invoice.
3. Selected items are marked billed.

### 13.7 Expense To Invoice

1. Expense is created and approved.
2. User selects billable expense in invoice/cost recovery.
3. Invoice item source is `EXPENSE`.
4. Expense becomes `INVOICED`.

### 13.8 Cost Recovery Invoice

1. User selects project.
2. System loads recoverable tasks, expenses, previous invoices, and manual items.
3. `CostRecoveryService.create` stores batch and items.
4. `InvoiceService.createFromCostRecovery` creates invoice.
5. Recovery batch is marked invoiced.

### 13.9 Invoice Approval

1. Draft invoice is created.
2. User submits invoice.
3. Approval flow rows are created.
4. Approver acts at stage 1.
5. Threshold/second stage applies if configured.
6. Final approval locks invoice.
7. Payment can be recorded.

### 13.10 Compliance Event Flow

1. Company FYE/date information calculates statutory events.
2. `CompanyEventService` creates events by slug and rule, not by hardcoded IDs.
3. Event form handles manual event add/edit.
4. Due date tracker manages extension for allowed event slugs.
5. Reminder list calculates reminder dates using `reminder_date_basis`.
6. Common cron sends reminder emails and logs recipient results.

## 14. Validation Rules

CRM:

- company/entity required for lead
- lead status/source must exist
- at least one service required before quotation
- quotation must have at least one item
- quote number must be unique

Sales order:

- quotation must exist
- company/entity required
- at least one order item required
- billing method required
- milestone billing requires at least one milestone
- confirmed order cannot be deleted if invoice/project exists

Project:

- project name required
- workspace required when workspace module is used
- manager required for PM workflow
- due date cannot be before start date
- task due date cannot be before task start date
- assigned users must be active

Invoice:

- company/entity required
- invoice date required
- due date required
- at least one invoice item required
- invoice number unique when submitted
- submitted invoice edit must be controlled
- paid invoice cannot be deleted
- approval required based on settings/threshold

Expense:

- expense head required
- amount must be greater than zero
- currency required
- approved/invoiced expense cannot be deleted directly

Compliance event:

- company/entity required
- event slug required
- due date required for due tracker visibility
- extension allowed only for configured event slugs
- extension count/rules must be validated
- reminder basis must be actual or extended due date

## 15. Reports To Rebuild

CRM reports:

- Lead pipeline
- Lead by source/status
- Quotation value
- Sales conversion

Sales order reports:

- Sales order list
- Sales order milestone report
- Month-wise expected payment
- Revenue by product/service
- Commission report

Project reports:

- Project list
- Project revenue
- Project payment
- Project no-task report
- Project unallocated task report
- Project working hours
- Project summary

Finance reports:

- Invoice report
- Invoice payment report
- Statement of account
- Custom SOA
- Aging summary
- Reconciliation report
- Credit note/debit note reports

Expense reports:

- Expense report
- Expense by project
- Expense by customer
- Cost recovery report

Compliance reports:

- Event list
- Due date tracker
- Reminder event list
- Reminder logs
- Cron result log

## 16. Build Order

1. Shared master data and number sequence.
2. Pre Sales Settings.
3. PM Settings.
4. Finance Settings.
5. Lead and follow-up.
6. Quotation.
7. Sales order.
8. Sales order milestones.
9. Project creation from sales order.
10. Project tasks and cycles.
11. Invoice core.
12. Invoice approval.
13. Payments.
14. Expenses.
15. Cost recovery.
16. Compliance events.
17. Due date tracker.
18. Reminder master/list/cron/logs.
19. Reports.
20. Dashboards.

## 17. Old-To-New Migration Mapping

| Old Table | New Table |
| --- | --- |
| `crm_leads` | `crm_lead` |
| `crm_lead_services` | `crm_lead_service` |
| `crm_lead_followup` | `crm_lead_followup` |
| `crm_lead_document` | `document_store` with `module_name=crm`, `sub_module_name=lead` |
| `crm_quotation` | `crm_quotation` |
| `crm_quotation_detail` | `crm_quotation_item` |
| `crm_convert_order` / `crm_sales_order` | `crm_sales_order` |
| `crm_so_milestone` | `crm_sales_order_milestone` |
| `crm_project` | `project` |
| `crm_project_detail` | `project_detail` |
| `crm_project_allocation` | `project_task` |
| `crm_cycle_master` | `project_cycle_master` |
| `crm_cycle_master_tasks` | `project_cycle_task_template` |
| `tbl_billing_master` | `finance_invoice` |
| `tbl_billing_child` | `finance_invoice_item` |
| `tbl_billing_transaction` | `finance_payment` |
| `tbl_invoice_approval_flow` | `finance_invoice_approval_flow` |
| `tbl_invoice_approval_audit` | `finance_invoice_audit` |
| `crm_task_expenses` | `expense` |
| `crm_expense_head_master` | `expense_head` |
| `crm_cost_recovery` | `cost_recovery` + `cost_recovery_item` |
| `company_agm` | `company_event` |
| `company_event_name` | `company_event_name` |

Recommended migration support columns:

- `legacy_id`
- `legacy_table`
- `legacy_payload`

These can be removed after migration verification.

## 18. New Page-By-Page Workflow

This section defines the new pages that should be created and how each page should work. The page names can be adjusted, but the responsibility should stay clean.

### 18.1 CRM Dashboard

Page:

- `CRM/Dashboard/CrmDashboard.js`

Purpose:

- Show lead, quotation, sales order, project, invoice, and activity summary.

UI sections:

- Lead status cards.
- Quotation value cards.
- Sales order value cards.
- Project workload cards.
- Invoice outstanding/paid cards.
- Recent activities.
- Team performance.

APIs:

- `GET /crm/dashboard/summary`
- `GET /crm/dashboard/pipeline`
- `GET /crm/dashboard/recent-activity`

Tables:

- `crm_lead`
- `crm_quotation`
- `crm_sales_order`
- `project`
- `project_task`
- `finance_invoice`
- `finance_payment`

### 18.2 Customer 360 Page

Page:

- `CRM/Customers/CustomerView.js`

Purpose:

- Single company/customer view for CRM and finance history.

Tabs:

- Overview.
- Contacts.
- Leads.
- Quotations.
- Sales Orders.
- Projects.
- Invoices.
- Payments.
- Events.
- Documents.
- Activity.

APIs:

- `GET /crm/customers/:entityId/overview`
- `GET /crm/customers/:entityId/leads`
- `GET /crm/customers/:entityId/quotations`
- `GET /crm/customers/:entityId/sales-orders`
- `GET /crm/customers/:entityId/projects`
- `GET /crm/customers/:entityId/invoices`

### 18.3 Lead List Page

Page:

- `CRM/Leads/LeadList.js`

Purpose:

- List and filter leads.

Filters:

- Company.
- Lead status.
- Lead source.
- Sales owner.
- Date range.
- Expected closing date.
- Keyword.

Actions:

- Add Lead.
- View.
- Edit.
- Delete.
- Create Quotation.

APIs:

- `GET /crm/leads`
- `DELETE /crm/leads/:id`

Tables:

- `crm_lead`
- `crm_lead_status`
- `crm_lead_source`

### 18.4 Lead Add/Edit/View Page

Page:

- `CRM/Leads/LeadForm.js`
- `CRM/Leads/LeadView.js`

Purpose:

- Maintain lead data, services, follow-ups, documents, and notes.

Sections:

- Lead details.
- Company/contact.
- Services/items.
- Follow-ups.
- Documents.
- Activity history.

Actions:

- Save lead.
- Add service.
- Add follow-up.
- Upload document.
- Create quotation.

APIs:

- `POST /crm/leads`
- `GET /crm/leads/:id`
- `PUT /crm/leads/:id`
- `POST /crm/leads/:id/services`
- `POST /crm/leads/:id/followups`
- `POST /document-store/upload` with `module_name=crm`, `sub_module_name=lead`, `module_record_id=lead_id`

Tables:

- `crm_lead`
- `crm_lead_service`
- `crm_lead_followup`
- `document_store`

### 18.5 Quotation List Page

Page:

- `CRM/Quotations/QuotationList.js`

Purpose:

- List quotations.

Filters:

- Company.
- Lead.
- Status.
- Sales person.
- Quotation date.
- Valid until.
- Keyword.

Actions:

- Add quotation.
- View.
- Edit.
- Print/PDF.
- Send email.
- Convert to Sales Order.

APIs:

- `GET /crm/quotations`
- `POST /crm/quotations/:id/send-email`
- `POST /crm/quotations/:id/convert-to-sales-order`

### 18.6 Quotation Form/View Page

Page:

- `CRM/Quotations/QuotationForm.js`
- `CRM/Quotations/QuotationView.js`

Purpose:

- Create/edit/view quotation.

Sections:

- Company/lead/contact.
- Quotation info.
- Line items.
- Discounts/tax.
- SLA terms.
- Email history.

APIs:

- `POST /crm/quotations`
- `GET /crm/quotations/:id`
- `PUT /crm/quotations/:id`
- `GET /crm/quotations/:id/pdf`

Tables:

- `crm_quotation`
- `crm_quotation_item`
- `crm_sla_term`
- `crm_sla_term_detail`

### 18.7 Sales Order List Page

Page:

- `CRM/SalesOrders/SalesOrderList.js`

Purpose:

- List confirmed/converted/lost sales orders.

Filters:

- Company.
- Sales person.
- Order status.
- Billing method.
- Order date.
- Branch.
- Keyword.

Actions:

- Add Sales Order.
- View.
- Edit.
- Print/PDF.
- Create Project.
- Open Milestones.
- Generate Invoice.
- View Commission.

APIs:

- `GET /crm/sales-orders`
- `DELETE /crm/sales-orders/:id`
- `POST /crm/sales-orders/:id/create-project`

Tables:

- `crm_sales_order`
- `crm_sales_order_item`
- `project`
- `finance_invoice`

### 18.8 Sales Order Form/View Page

Page:

- `CRM/SalesOrders/SalesOrderForm.js`
- `CRM/SalesOrders/SalesOrderView.js`

Purpose:

- Create/edit/view sales order.

Sections:

- Company/quotation/contact.
- Order details.
- Line items.
- Billing method.
- PM notification.
- Milestone setup.
- Files.
- Activity.

Actions:

- Save order.
- Confirm order.
- Create project.
- Generate invoice.
- Send order email.

APIs:

- `POST /crm/sales-orders`
- `GET /crm/sales-orders/:id`
- `PUT /crm/sales-orders/:id`
- `POST /crm/sales-orders/:id/confirm`
- `POST /crm/sales-orders/:id/send-email`

### 18.9 Sales Order Milestone Page

Page:

- `CRM/SalesOrders/SalesOrderMilestone.js`

Purpose:

- Manage milestone billing schedule.

Actions:

- Add milestone.
- Edit milestone.
- Delete milestone.
- Generate milestone invoice.
- Mark expected payment.

APIs:

- `GET /crm/sales-orders/:id/milestones`
- `POST /crm/sales-orders/:id/milestones`
- `PUT /crm/sales-order-milestones/:milestoneId`
- `DELETE /crm/sales-order-milestones/:milestoneId`
- `POST /crm/sales-order-milestones/:milestoneId/generate-invoice`

Tables:

- `crm_sales_order_milestone`
- `finance_invoice`
- `finance_invoice_item`

### 18.10 Project List Page

Page:

- `Projects/ProjectList.js`

Purpose:

- List projects with PM filters.

Filters:

- Workspace.
- Company.
- Project status.
- Manager.
- Team member.
- Cycle.
- Date range.
- Tags.
- Keyword.

Actions:

- Add Project.
- View.
- Edit.
- Open Tasks.
- Open Cost.
- Open Invoice.

APIs:

- `GET /projects`
- `DELETE /projects/:id`

Tables:

- `project`
- `project_task`
- `pm_workspace`
- `pm_project_status`
- `pm_team_member`

### 18.11 Project Form/View Page

Page:

- `Projects/ProjectForm.js`
- `Projects/ProjectView.js`

Purpose:

- Create/edit/view project.

Sections:

- Project details.
- Sales order/quotation links.
- Tasks.
- Files.
- Comments/activity.
- Timeline.
- Cost/expense.
- Invoices.

Actions:

- Save project.
- Add task.
- Generate tasks from cycle.
- Upload file.
- Add activity.

APIs:

- `POST /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `POST /projects/:id/tasks`
- `POST /projects/:id/generate-cycle`

### 18.12 Task List/Form Page

Page:

- `Projects/TaskList.js`
- `Projects/TaskForm.js`

Purpose:

- Manage project tasks/tickets.

Actions:

- Add/edit task.
- Assign users.
- Change status.
- Add comment.
- Upload file.
- Add expense.
- Complete/close task.

APIs:

- `GET /project/tasks`
- `POST /project/tasks`
- `GET /project/tasks/:id`
- `PUT /project/tasks/:id`
- `POST /project/tasks/:id/status`
- `POST /project/tasks/:id/files`
- `POST /project/tasks/:id/expenses`

### 18.13 Invoice List Page

Page:

- `Finance/Invoices/InvoiceList.js`

Purpose:

- List invoices and drafts.

Filters:

- Company.
- Branch.
- Invoice date.
- Due date.
- Status.
- Paid status.
- PIC.
- Agent.
- Keyword.

Actions:

- Add Invoice.
- View.
- Edit.
- Submit.
- Approve.
- Add Payment.
- Send Email.
- Print/PDF.

APIs:

- `GET /finance/invoices`
- `DELETE /finance/invoices/:id`
- `POST /finance/invoices/:id/submit`
- `POST /finance/invoices/:id/send-email`

### 18.14 Invoice Form/View Page

Page:

- `Finance/Invoices/InvoiceForm.js`
- `Finance/Invoices/InvoiceView.js`

Purpose:

- Create/edit/view invoice.

Sections:

- Company/contact/address.
- Invoice metadata.
- Line items.
- Expenses.
- Discount/tax.
- Approval.
- Payments.
- Email history.

Actions:

- Save draft.
- Submit invoice.
- Generate invoice number.
- Add payment.
- Create credit/debit note.
- Print/PDF.

APIs:

- `POST /finance/invoices`
- `GET /finance/invoices/:id`
- `PUT /finance/invoices/:id`
- `POST /finance/invoices/:id/payments`
- `POST /finance/invoices/:id/credit-note`
- `POST /finance/invoices/:id/debit-note`

### 18.15 Invoice Approval Page

Page:

- `Finance/Invoices/InvoiceApprovalList.js`

Purpose:

- Show approval tasks for invoice/credit note/debit note.

Actions:

- Approve.
- Reject.
- Re-request.
- Add remarks.
- View audit trail.

APIs:

- `GET /finance/invoice-approvals`
- `POST /finance/invoice-approvals/:id/action`
- `GET /finance/invoices/:id/audit`

### 18.16 Payment Page

Page:

- `Finance/Payments/PaymentList.js`
- `Finance/Payments/PaymentForm.js`

Purpose:

- Record and report payments.

Actions:

- Add payment.
- Edit payment if allowed.
- Delete payment if allowed.
- Export payment report.

APIs:

- `GET /finance/payments`
- `POST /finance/payments`
- `PUT /finance/payments/:id`
- `DELETE /finance/payments/:id`

### 18.17 Credit Note / Debit Note Pages

Pages:

- `Finance/CreditNotes/CreditNoteList.js`
- `Finance/CreditNotes/CreditNoteForm.js`
- `Finance/DebitNotes/DebitNoteList.js`
- `Finance/DebitNotes/DebitNoteForm.js`

Purpose:

- Manage invoice adjustments.

Actions:

- Create note from invoice.
- Submit/approve note.
- Print/PDF.
- Apply to invoice/payment.

APIs:

- `GET /finance/credit-notes`
- `POST /finance/credit-notes`
- `GET /finance/debit-notes`
- `POST /finance/debit-notes`

### 18.18 Expense List/Form Page

Page:

- `Expenses/ExpenseList.js`
- `Expenses/ExpenseForm.js`

Purpose:

- Manage company/project/task expenses.

Filters:

- Company.
- Project.
- Task.
- Expense head.
- Date range.
- Status.
- Billable.

Actions:

- Add expense.
- Edit.
- Upload file.
- Approve/reject.
- Mark billable.
- Link to invoice/cost recovery.

APIs:

- `GET /expenses`
- `POST /expenses`
- `GET /expenses/:id`
- `PUT /expenses/:id`
- `POST /expenses/:id/files`
- `POST /expenses/:id/approve`

### 18.19 Cost Recovery Page

Page:

- `Expenses/CostRecoveryList.js`
- `Expenses/CostRecoveryForm.js`

Purpose:

- Recover project/task/expense/other cost through invoice.

Actions:

- Select project.
- Load recoverable items.
- Mark item as invoice/COR/nullify.
- Generate invoice.

APIs:

- `GET /expenses/cost-recovery`
- `POST /expenses/cost-recovery`
- `GET /expenses/cost-recovery/:id`
- `POST /expenses/cost-recovery/:id/generate-invoice`

### 18.20 Pre Sales Settings Pages

Pages:

- `CRM/Settings/LeadStatus.js`
- `CRM/Settings/LeadSource.js`
- `CRM/Settings/OrderReason.js`
- `CRM/Settings/SlaTerms.js`
- `CRM/Settings/CrmEmailTemplates.js`

Purpose:

- Configure pre-sales masters and CRM templates.

APIs:

- `GET/POST/PUT/DELETE /crm/settings/lead-status`
- `GET/POST/PUT/DELETE /crm/settings/lead-source`
- `GET/POST/PUT/DELETE /crm/settings/order-reason`
- `GET/POST/PUT/DELETE /crm/settings/sla-terms`
- `GET/POST/PUT/DELETE /crm/settings/email-templates`

### 18.21 PM Settings Pages

Pages:

- `Projects/Settings/ProjectStatus.js`
- `Projects/Settings/TaskStatus.js`
- `Projects/Settings/TicketStatus.js`
- `Projects/Settings/TaskPriority.js`
- `Projects/Settings/TicketPriority.js`
- `Projects/Settings/CycleMaster.js`
- `Projects/Settings/WorkspaceMaster.js`
- `Projects/Settings/TeamManagement.js`

Purpose:

- Configure PM workflow.

APIs:

- `GET/POST/PUT/DELETE /project/settings/status`
- `GET/POST/PUT/DELETE /project/settings/priority`
- `GET/POST/PUT/DELETE /project/settings/cycles`
- `GET/POST/PUT/DELETE /project/settings/workspaces`
- `GET/POST/PUT/DELETE /project/settings/teams`

### 18.22 Finance Settings Pages

Pages:

- `Finance/Settings/InvoiceSettings.js`
- `Finance/Settings/BranchInvoiceSettings.js`
- `Finance/Settings/InvoiceTemplates.js`
- `Finance/Settings/PaymentMethods.js`
- `Finance/Settings/ApprovalSettings.js`
- `Finance/Settings/FeeTypes.js`
- `Finance/Settings/BillingCycle.js`
- `Finance/Settings/Uom.js`

Purpose:

- Configure invoice numbering, templates, approval, payment methods, fee types, UOM, and billing cycle.

### 18.23 Compliance List Page

Page:

- `Compliance/ComplianceList.js`

Purpose:

- Company compliance overview.

Actions:

- Filter companies.
- Show company event counts.
- Open company event list.
- Open due date tracker.

APIs:

- `GET /compliance/companies`

### 18.24 Event List Page

Page:

- `Compliance/EventList.js`

Purpose:

- Show events globally or by company.

Actions:

- Add event.
- Edit event.
- View event.
- Open reminder list.
- Open due tracker.

APIs:

- `GET /events/company-events`
- `GET /events/company-events/:id`
- `DELETE /events/company-events/:id`

### 18.25 Event Form Page

Page:

- `Compliance/EventForm.js`

Purpose:

- Add/edit event with old event logic but clean structure.

Sections:

- Event details.
- Meeting details.
- AGM/AR status details.
- Email settings.
- Attendees.
- Receiving parties.

APIs:

- `POST /events/company-events`
- `PUT /events/company-events/:id`

Tables:

- `company_event`
- `company_event_name`
- company official/contact tables

### 18.26 Multi Event Create Page

Page:

- `Compliance/MultiEventCreate.js`

Purpose:

- Create events for multiple companies from selected event/rule/date data.

APIs:

- `POST /events/company-events/multiple`

### 18.27 Due Date Tracker Page

Page:

- `Compliance/DueDateTracker.js`

Purpose:

- Show all events where due date is not empty and manage due date extension.

Actions:

- Filter by company/event/year/status/date.
- View actual due date and extended due date.
- Extend allowed event types only.
- Show extension history.
- Update reminder date basis.

APIs:

- `GET /events/due-date-tracker`
- `POST /events/company-events/:id/extend-due-date`
- `GET /events/company-events/:id/history`

Tables:

- `company_event`
- audit log table

### 18.28 Reminder Event List Page

Page:

- `Compliance/ReminderEventList.js`

Purpose:

- Show event reminder dates based on reminder master and event due date basis.

Actions:

- Filter reminders.
- Open event.
- Run cron manually.
- Open logs.

APIs:

- `GET /events/reminder-events`
- `POST /events/cron/due-reminders`

### 18.29 Reminder Master Page

Page:

- `Settings/MasterSettings/Reminder.js`

Purpose:

- Configure event reminder template, subject, message, timing, merge fields, and attachments.

APIs:

- `GET /events/reminders`
- `POST /events/reminders`
- `PUT /events/reminders/:id`
- `DELETE /events/reminders/:id`
- `GET /events/reminders/merge-fields`

### 18.30 Reminder Log Page

Page:

- `Compliance/ReminderLogList.js`

Purpose:

- Show email reminder delivery results.

Columns:

- Event.
- Company.
- Reminder.
- Scheduled date.
- Status.
- Sent count.
- Failed count.
- Skipped count.
- Invalid count.
- Main message.
- Details modal.

APIs:

- `GET /events/reminder-logs`
- `GET /events/reminder-logs/:id`
