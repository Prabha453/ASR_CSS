# Old System Full Workflow Documentation

Source inspected:

- Old application: `C:\xampp7.2\htdocs\teamwork\Version_1.0.0`
- Old database dump: `C:\Users\MYPC\Downloads\pinnacle.sql`

This document explains the old business workflow. It does not recommend copying the old code structure. The old system contains important business logic, but the implementation is tightly coupled, controller-heavy, and difficult to maintain.

## 1. Old System Summary

The old project is a CodeIgniter application where CRM, Sales, Project Management, Billing, Invoice, Expense, Cost Recovery, Settings, and Statutory Event logic are connected.

Main workflow:

```text
Company / Customer / Contact
  -> Lead / Opportunity
  -> Follow-up / Activity
  -> Quotation
  -> Sales Order
  -> Project / Workspace / Task / Cycle
  -> Billing / Milestone Invoice / On-The-Go Invoice
  -> Invoice / Approval / Payment / Credit Note / Debit Note
  -> Expense / Cost Recovery
  -> Reports / Dashboard / Communication
```

Statutory compliance workflow:

```text
Company
  -> Company date information / FYE logic
  -> System events: AGM, AR, ECI, Anniversary
  -> Due date tracker
  -> Due date extension
  -> Reminder dates
  -> Reminder email logs
```

## 2. Important Old Controllers

| Controller | Main Responsibility |
| --- | --- |
| `Crm.php` | CRM dashboard, customer 360, company tabs, CRM settings, team creation, project status, email settings, customer CRM AJAX lists. |
| `Leads.php` | Lead CRUD, lead listing, lead services, follow-ups, lead documents, quotation creation, quote email, quote conversion. |
| `Orders.php` | Sales order listing, quote-to-order conversion, sales order edit/view/print/PDF, milestone billing, order-to-project conversion, recurring sales order, commission, invoice generation from milestone/cost recovery. |
| `Projects.php` | Project CRUD, project list/grid/gantt, project view, project tasks, project files, project notifications. |
| `Workspace_management.php` | Workspace-specific project listing, filters, status counts, team-based visibility. |
| `Project_sub_allocation.php` | Sub tasks / sub allocation. |
| `Project_cost.php`, `ProjectCost.php` | Project cost views and calculations. |
| `Project_wise_commission.php` | Commission by project. |
| `Expenses.php` | Expense management, expense file handling, disbursement threshold, expense invoice history. |
| `Cost_recovery.php` | Cost recovery listing/report and recovery JSON data. |
| `Billing.php` | Billing creation, editing, viewing, PDF, company fee details, billing cycle master. |
| `Invoice.php` | Invoice CRUD, draft invoice, invoice approval, payments, credit notes, debit notes, statement of account, invoice reports, number generation, templates, bulk download. |
| `Settings.php` | Finance settings, branch settings, invoice numbering, fee types, UOM, billing cycle, CRM/PM settings, custom tabs/fields. |
| `Sales_dashboard.php` | Sales dashboard and sales metrics. |
| `Crm_report_module.php` | CRM/project/expense/revenue/payment reports. |
| `Company_agm.php` | Old event/AGM add/edit/list/due date tracker logic. |
| `Mainadmin.php` | Old due date tracker entry and dashboard-style listings. |
| `Get_admininfo.php` | Old model used by due date tracker and event listing. |

## 3. Important Old Models

| Model | Responsibility |
| --- | --- |
| `Crmdata.php` | Shared CRM data access and helper queries. |
| `Crm_lead.php` | Lead list and lead-related data. |
| `Crm_sales.php` | Sales/quotation/order-related data. |
| `Crm_project_list_model.php` | Project listing datatable. |
| `Crm_task_list_model.php` | Task listing. |
| `Crm_task_pm_list_model.php` | PM task listing and task status permission filtering. |
| `Crm_task_project_milestone_model.php` | Milestone/project task data. |
| `Crm_expenses_management_model.php` | Expense datatable and filters. |
| `Invoice_report.php` | Invoice report, SOA, aging, export logic. |
| `Invoice_payments.php` | Payment listing and totals. |
| `Sales_order_milestone_report.php` | Milestone payment report. |
| `Project_wise_commission_model.php` | Project commission reporting. |
| `Sales_dashboard_model.php` | Sales dashboard metrics. |

## 4. Old View/Page Groups

CRM pages:

- `application/views/crm/dashboard`
- `application/views/crm/leads`
- `application/views/crm/leads/quotation`
- `application/views/crm/leads/followups`
- `application/views/crm/company`
- `application/views/crm/contact`
- `application/views/crm/activity`
- `application/views/crm/overview`
- `application/views/crm/team`
- `application/views/crm/template`
- `application/views/crm/crm_settings`

Sales order pages:

- `application/views/crm/sales_order/list_sales_order.php`
- `application/views/crm/sales_order/grid_sales_order.php`
- `application/views/crm/sales_order/create_sales.php`
- `application/views/crm/sales_order/convert_to_order.php`
- `application/views/crm/sales_order/edit.php`
- `application/views/crm/sales_order/view.php`
- `application/views/crm/sales_order/print.php`
- `application/views/crm/sales_order/pdf.php`
- `application/views/crm/sales_order/milestone_master.php`
- `application/views/crm/sales_order/sales_order_milestone_report.php`
- `application/views/crm/sales_order/list_cost_recovery.php`
- `application/views/crm/sales_order/commission.php`

Project/PM pages:

- `application/views/crm/projects/list.php`
- `application/views/crm/projects/grid.php`
- `application/views/crm/projects/new.php`
- `application/views/crm/projects/edit.php`
- `application/views/crm/projects/view.php`
- `application/views/crm/projects/new_task.php`
- `application/views/crm/projects/new_gantt_chart_page.php`
- `application/views/crm/workspace_management`
- `application/views/crm/project_cost`

Finance pages:

- `application/views/finance/index.php`
- `application/views/finance/add_invoice.php`
- `application/views/finance/edit_invoice.php`
- `application/views/finance/view_invoice.php`
- `application/views/finance/print_invoice.php`
- `application/views/finance/pdf_invoice.php`
- `application/views/finance/add_payments.php`
- `application/views/finance/view_payments.php`
- `application/views/finance/invoice_email_pop_up.php`
- `application/views/billing/index.php`
- `application/views/billing/add_billing.php`
- `application/views/billing/edit_billing.php`
- `application/views/billing/view_billing.php`
- `application/views/billing/billing_cycle_master_list.php`

Expense/settings pages:

- `application/views/crm/activity/expenses_management.php`
- `application/views/crm/activity/expense_activity.php`
- `application/views/crm_expense_head/list.php`
- `application/views/lead_status`
- `application/views/lead_source`
- `application/views/order_reason`
- `application/views/project_status`
- `application/views/crm_status_master`
- `application/views/crm_ticket_source_master`
- `application/views/workspace`
- `application/views/myTeam`
- `application/views/Settings`

Compliance/event pages:

- `application/views/company_agm/add_agm.php`
- `application/views/company_agm/edit_agm.php`
- `application/views/duedatetracker.php`
- `application/views/ajax_datatable_page/duedate_listing.php`

## 5. Old Database Table Families

### 5.1 Company / Customer / Contacts

- `company_registration`
- `members`
- `crm_contacts`
- `crm_contact_points`
- `crm_contact_pins`
- company address/contact tables from the core company module

Purpose:

- CRM entities are linked to companies/customers.
- Leads, quotations, sales orders, projects, invoices, expenses, and statutory events all depend on company/customer identity.

### 5.2 Lead / Pre Sales

- `crm_leads`
- `crm_lead_services`
- `crm_lead_followup`
- `crm_lead_document`
- `crm_lead_chat`
- `crm_lead_status`
- `crm_lead_source`
- `crm_lead_rating`
- `crm_followup_agenda`
- `crm_followup_mode`

Old lead flow:

1. User creates lead against company/customer.
2. User selects source, status, rating, expected closing date, sales user, and service/package/part data.
3. User records follow-ups, notes, documents, and communication.
4. Lead progresses through status pipeline.
5. Quotation is generated from lead services.

### 5.3 Quotation

- `crm_quotation`
- `crm_quotation_detail`
- `crm_quotation_email_info`
- `crm_quotation_email_document`
- `crm_sla_terms`
- `crm_sla_terms_detail`

Old quotation flow:

1. Quotation is created from lead.
2. Quotation lines are stored in `crm_quotation_detail`.
3. SLA/terms can be attached.
4. Quote can be printed/PDF/email.
5. Quote can be converted to sales order.

### 5.4 Sales Order

- `crm_convert_order`
- `crm_sales_order`
- `crm_orders_project`
- `crm_project_sales`
- `crm_so_milestone`
- `crm_order_reason`

Old sales order flow:

1. Accepted quote is converted into order.
2. `crm_convert_order` stores company, quote, order number, sales person, reason, remarks, PM notification fields, and billing method.
3. Some data also appears in `crm_sales_order`.
4. Order can be converted to project.
5. Order can use milestone billing or on-the-go billing.
6. Milestone data is stored in `crm_so_milestone`.

Important old fields in `crm_convert_order`:

- `convert_order_id`
- `company_id`
- `quote_id`
- `sales_person`
- `order_number`
- `reason`
- `remarks`
- `project_id`
- `bill_amount`
- `amount_collected`
- `parent_order_id`
- `so_status`
- `pm_notification_settings`
- `pm_notification_days`
- `billing_method`

Important old fields in `crm_so_milestone`:

- `milestone_order_id`
- `milestone_service_id`
- `milestone_quote_id`
- `milestone_name`
- `milestone_percentage`
- `mamount`
- `mamount_type`
- `mdate_of_creation_date`
- `mdate_of_creation_duration`
- `mexpected_paymentdate`
- `mexpected_payment_duration`
- `mpaid_amount`
- `mdue_amount`
- `minvoice`
- `mfollowup`

### 5.5 Project / PM

- `crm_project`
- `crm_project_detail`
- `crm_project_allocation`
- `crm_project_sub_allocation`
- `crm_project_activity`
- `crm_project_file`
- `crm_project_chat`
- `crm_project_track_history`
- `crm_task`
- `crm_task_file`
- `crm_task_expenses`
- `crm_relational_task`
- `crm_cycle_master`
- `crm_cycle_master_tasks`
- `crm_workspace`
- `crm_workspace_management`
- `crm_workspace_chat`
- `crm_workspace_manager_status`

Old PM flow:

1. Project can be created manually or from sales order.
2. Project is attached to company, lead, quote, sales order, workspace, status, manager, dates, priority, and tags.
3. Project tasks are created manually or from cycle/task templates.
4. Tasks are assigned to users/teams.
5. Tasks can have files, expenses, comments, activities, dependencies, and statuses.
6. Workspace pages filter projects by workspace and status.
7. Team creation can restrict assignment and list visibility.

### 5.6 Billing / Invoice / Payment

- `tbl_billing_master`
- `tbl_billing_child`
- `tbl_billing_transaction`
- `tbl_billing_cycle_master`
- `tbl_invoice_status`
- `tbl_invoice_template`
- `tbl_invoice_log`
- `tbl_invoice_approval_flow`
- `tbl_invoice_approval_audit`
- `tbl_credit_note_invoice`
- `tbl_payment_method`
- `invoice_settings`
- `invoice_bank_details`

Old invoice flow:

1. Invoice may be created manually, from billing, from sales order, from milestone, from recurring billing, or from cost recovery.
2. Header is stored in `tbl_billing_master`.
3. Lines are stored in `tbl_billing_child`.
4. Payments are stored in `tbl_billing_transaction`.
5. Invoice status is controlled by `tbl_invoice_status`.
6. Numbering is controlled by branch/invoice settings and controller logic.
7. Approval is stored in approval flow/audit tables.
8. Credit/debit notes are handled inside invoice logic.
9. Reports include invoice report, payment report, statement of account, aging summary, reconciliation, and bulk download.

Important old fields in `tbl_billing_master`:

- `billing_master_id`
- `company_id`
- `agent_id`
- `branch_id`
- `branch_bill_no`
- `invoice_flag`
- `invoice_parent_id`
- `recur_stop_at`
- `order_id`
- `bill_no`
- `bill_no_sequence`
- `draft_invoice_no`
- `draft_invoice_no_sequence`
- `billing_address`
- `currency`
- `net_total`
- `gst_amt`
- `grand_total`
- `status`
- `commission_entitled`
- `contact_person`
- `invoice_date`
- `due_date`
- `close_date`
- `followup`
- `pic_id`
- `project_id`
- `milestone_id`
- `cn_status`
- `draft_auto_invoice`
- `auto_invoice_flag`
- `extra_discount_type`
- `extra_discount`
- `commission_date`
- `order_invoice_type`
- `id_expenses`
- `expense_amt`
- `service_expense`

### 5.7 Expense / Cost Recovery

- `crm_task_expenses`
- `crm_expense_head_master`
- `crm_cost_recovery`

Old expense flow:

1. User records expense against company/project/task.
2. Expense head/category is selected.
3. Files can be attached.
4. Disbursement threshold can be checked.
5. Expense can later be selected for invoice or cost recovery.

Old cost recovery flow:

1. Project costs, task costs, expenses, previous invoice amounts, or manual rows are selected.
2. Old system stores selected recovery rows as JSON in `crm_cost_recovery.cost_recover_details`.
3. Recovery rows can be invoiced, marked as COR, or nullified.
4. Generated invoice links back to cost recovery.

### 5.8 Commission

- `crm_commission`
- `crm_project_wise_commission`
- commission fields inside quotation/order/billing logic

Old commission flow:

1. Quotation/service can define commission user, amount, and date.
2. Sales order inherits quotation commission context.
3. Billing can mark commission entitlement.
4. Reports calculate commission by project, branch, service, user, and invoice.

### 5.9 Pre Sales Settings

- `crm_lead_status`
- `crm_lead_source`
- `crm_lead_rating`
- `crm_order_reason`
- `crm_sla_terms`
- `crm_sla_terms_detail`
- `crm_setting`
- `crm_email_configuration`
- `crm_email`
- `crm_email_recipient`
- `crm_custom_field_master`
- `crm_custom_masters`
- `crm_field_type_master`
- `crm_company_source`
- `crm_industry_master`
- `crm_market_segment_master`

Purpose:

- Configure lead statuses and sources.
- Configure quotation numbering and templates.
- Configure quote/order email content.
- Configure SLA terms.
- Configure custom fields and custom tabs.

### 5.10 PM Settings

- `crm_project_status`
- `crm_task_priority_master`
- `crm_ticket_priority_master`
- `crm_ticket_source_master`
- `crm_ticket_type_master`
- `crm_master_task`
- `crm_cycle_master`
- `crm_cycle_master_tasks`
- `crm_workspace`
- `crm_workspace_manager_status`
- `crm_team`
- `crm_team_member`
- `crm_holiday_master`
- `crm_importance_master`
- `crm_uom_master`

Purpose:

- Project, task, and ticket statuses.
- Task and ticket priorities.
- Workspace configuration.
- Cycle master templates.
- Team-based user filtering.
- Holiday and duration support.

Important old behavior:

- `crm_project_status.type_status = 1` means project status.
- `crm_project_status.type_status = 2` means task status.
- `crm_project_status.type_status = 3` means ticket status.
- Default closed/completed status controls completion behavior.
- Team creation setting controls whether assignment dropdowns show all users or only team users.

### 5.11 Compliance / Event

- `company_agm`
- `company_event_name`
- `company_event_settings`
- newer event tables added in new work

Old event flow:

1. Company FYE/date info creates AGM, AR, ECI, Anniversary due dates.
2. Event add and edit have different visible fields.
3. Due date tracker shows due events.
4. Only certain events can extend due date.
5. AGM/AR extension logic allows limited extension actions.
6. Reminder date depends on actual/extended due date behavior.
7. Reminder list shows reminder dates.
8. Reminder cron sends email and logs result.

## 6. Old End-To-End Business Flow

### 6.1 Customer To Lead

1. Customer/company exists.
2. Lead is created with source, status, sales person, expected closing date, and remarks.
3. Services/packages/parts are selected.
4. Follow-ups and documents are added.

### 6.2 Lead To Quotation

1. Lead services become quotation lines.
2. Quotation number is generated from CRM settings.
3. Quotation status is tracked using CRM status.
4. Quotation can be emailed, printed, or downloaded.

### 6.3 Quotation To Sales Order

1. Quote is accepted/converted.
2. Sales order number is generated.
3. `crm_convert_order` is created.
4. Selected services/packages/parts are carried forward.
5. Billing method is selected.

### 6.4 Sales Order To Project

1. Sales order is linked to project.
2. Project header is created.
3. Project tasks are created from selected services/cycle templates.
4. Project manager/team assignment is applied.
5. Notifications can be sent to PM users.

### 6.5 Project To Task Execution

1. Project appears in workspace list.
2. PM user sees allowed tasks based on team/status permissions.
3. Task statuses move through PM status master.
4. Task files, comments, expenses, and activity logs are added.
5. Completed/closed statuses are based on status master flags.

### 6.6 Sales Order To Invoice

Two old paths:

- Milestone billing: sales order milestone creates invoice.
- On-the-go billing: selected services directly create invoice.

### 6.7 Project Expense / Cost Recovery To Invoice

1. Expenses/tasks/other recoverables are selected.
2. Cost recovery batch stores selected rows.
3. Invoice is generated from cost recovery.
4. Recovery row links to invoice.

### 6.8 Invoice Approval And Payment

1. Draft invoice is created.
2. Invoice submitted.
3. Approval flow created if required.
4. Approver acts.
5. Invoice is finalized.
6. Payment transaction is recorded.
7. Reports and SOA calculate paid/due values.

### 6.9 Compliance Event Flow

1. Company FYE/date information determines event due dates.
2. Events created/updated by system or manual event forms.
3. Due date tracker manages extension.
4. Reminder list shows reminder dates.
5. Cron sends reminders and stores detailed logs.

## 7. Old Page-By-Page Workflow

This section maps the important old UI pages to the business flow they support.

### 7.1 CRM Dashboard Pages

Old pages:

- `crm/dashboard/sales_dashboard.php`
- `crm/dashboard/dashboard_sales.php`
- `crm/dashboard/dashboard_project_new.php`
- `crm/dashboard/dashboard_invoice.php`
- `crm/dashboard/my_dashboard_sales.php`

Purpose:

- Show lead pipeline, quotation value, sales order value, project workload, invoice summary, and user/team activity.

Main actions:

- Filter by date, status, sales person, branch, customer, or team.
- Open lead, quotation, sales order, project, or invoice detail.
- View counts and totals by status.

Data used:

- `crm_leads`
- `crm_quotation`
- `crm_convert_order`
- `crm_project`
- `crm_project_allocation`
- `tbl_billing_master`
- `tbl_billing_transaction`
- status/settings tables

### 7.2 Customer / Company CRM View

Old pages:

- `crm/company/*`
- customer/company tabs inside `Crm.php`

Purpose:

- Show a company/customer 360 view with leads, quotations, projects, invoices, contacts, notes, documents, and activity.

Main actions:

- View company CRM history.
- Open related leads, quotations, projects, and invoices.
- View contacts and communication.
- See invoice and payment history by customer.

Data used:

- company tables
- `crm_contacts`
- `crm_leads`
- `crm_quotation`
- `crm_project`
- `tbl_billing_master`
- `tbl_billing_transaction`

### 7.3 Lead List Page

Old pages:

- `crm/leads/list.php`
- `crm/leads/grid.php`

Purpose:

- List leads/opportunities.

Main actions:

- Search/filter by company, source, status, sales person, date, expected closing date.
- Open lead view.
- Add new lead.
- Edit/delete lead.
- Convert or progress lead depending on status.

Data used:

- `crm_leads`
- `crm_lead_status`
- `crm_lead_source`
- `crm_lead_rating`
- company tables

### 7.4 Lead Add/Edit/View Pages

Old pages:

- lead add/edit/view pages under `crm/leads`
- follow-up and document partials

Purpose:

- Maintain lead details, services, follow-ups, documents, notes, and communications.

Main actions:

- Add/update lead information.
- Add services/packages/parts.
- Upload documents.
- Add follow-up.
- Change lead status.
- Create quotation from lead.

Data used:

- `crm_leads`
- `crm_lead_services`
- `crm_lead_followup`
- `crm_lead_document`
- `crm_lead_chat`

### 7.5 Quotation Pages

Old pages:

- `crm/leads/quotation/*`
- quotation create/edit/view/print/email pages

Purpose:

- Create quotation from lead and selected services.

Main actions:

- Add quotation line items.
- Apply discount/tax.
- Select SLA terms.
- Print/PDF quotation.
- Send quotation email.
- Convert quotation to sales order.

Data used:

- `crm_quotation`
- `crm_quotation_detail`
- `crm_quotation_email_info`
- `crm_quotation_email_document`
- `crm_sla_terms`
- `crm_sla_terms_detail`
- `crm_setting`

### 7.6 Sales Order List/Grid Pages

Old pages:

- `crm/sales_order/list_sales_order.php`
- `crm/sales_order/grid_sales_order.php`
- `crm/sales_order/list_ajax.php`

Purpose:

- List converted sales orders.

Main actions:

- Filter sales orders by customer, sales person, order number, status, date, branch, and amount.
- Open view/edit.
- Print/PDF sales order.
- Generate project from order.
- Open milestone billing.
- Open invoice/cost recovery/commission.

Data used:

- `crm_convert_order`
- `crm_sales_order`
- `crm_quotation`
- `crm_quotation_detail`
- `crm_project`
- `tbl_billing_master`

### 7.7 Sales Order Create/Edit/View Pages

Old pages:

- `crm/sales_order/create_sales.php`
- `crm/sales_order/edit.php`
- `crm/sales_order/view.php`
- `crm/sales_order/convert_to_order.php`

Purpose:

- Create/edit/view sales order from quotation or manual selection.

Main actions:

- Select company, lead, quotation, contacts.
- Copy quote lines to order.
- Select billing method.
- Set PM notification.
- Add/edit order services.
- Convert order to project.
- Generate sales order PDF/email.

Data used:

- `crm_convert_order`
- `crm_sales_order`
- `crm_quotation`
- `crm_quotation_detail`
- `crm_project_sales`
- `crm_orders_project`

### 7.8 Sales Order Milestone Page

Old pages:

- `crm/sales_order/milestone_master.php`
- milestone modal/list inside sales order edit
- `crm/sales_order/sales_order_milestone_report.php`

Purpose:

- Manage milestone billing schedule.

Main actions:

- Add/edit/delete milestones.
- Set amount or percentage.
- Set expected payment date.
- Generate milestone invoice.
- View milestone report.

Data used:

- `crm_so_milestone`
- `crm_convert_order`
- `crm_quotation_detail`
- `tbl_billing_master`

### 7.9 Project List/Grid Pages

Old pages:

- `crm/projects/list.php`
- `crm/projects/grid.php`
- `crm/workspace_management/list.php`
- `crm/workspace_management/grid.php`

Purpose:

- Show projects by workspace, team, status, cycle, manager, customer, tags, and date.

Main actions:

- Filter/search projects.
- Switch list/grid.
- Open project view.
- Add project.
- Edit project.
- View status counts.

Data used:

- `crm_project`
- `crm_project_status`
- `crm_workspace`
- `crm_project_allocation`
- `crm_team_member`
- `tbl_category_label_tag_master`

### 7.10 Project Add/Edit/View Pages

Old pages:

- `crm/projects/new.php`
- `crm/projects/edit.php`
- `crm/projects/view.php`
- `crm/projects/new_task.php`
- `crm/projects/new_gantt_chart_page.php`

Purpose:

- Manage project header, detail, tasks, files, comments, timeline, and activities.

Main actions:

- Add/edit project details.
- Assign manager/team.
- Create tasks.
- Upload files.
- Add comments/activity.
- View gantt chart.
- Track task progress.

Data used:

- `crm_project`
- `crm_project_detail`
- `crm_project_allocation`
- `crm_project_file`
- `crm_project_activity`
- `crm_project_chat`
- `crm_relational_task`

### 7.11 PM Task/Ticket Pages

Old pages:

- `crm/tasks/*`
- project task modals
- workspace task lists

Purpose:

- Manage task/ticket execution under projects.

Main actions:

- Assign users.
- Change status.
- Add comments/files.
- Add expenses.
- Track due date and progress.
- Use status permission filters.

Data used:

- `crm_project_allocation`
- `crm_project_sub_allocation`
- `crm_project_status`
- `crm_task_priority_master`
- `crm_ticket_priority_master`
- `crm_task_file`
- `crm_task_expenses`

### 7.12 Invoice List Page

Old pages:

- `finance/index.php`
- `finance/invoice_list_ajax.php`

Purpose:

- List invoices, drafts, submitted invoices, paid/unpaid invoices.

Main actions:

- Filter by company, invoice date, due date, status, paid status, branch, PIC, agent.
- Open invoice view/edit.
- Add invoice.
- Record payment.
- Send invoice email.
- Export reports.

Data used:

- `tbl_billing_master`
- `tbl_billing_child`
- `tbl_billing_transaction`
- `tbl_invoice_status`
- branch/settings tables

### 7.13 Invoice Add/Edit/View Pages

Old pages:

- `finance/add_invoice.php`
- `finance/edit_invoice.php`
- `finance/view_invoice.php`
- `finance/print_invoice.php`
- `finance/pdf_invoice.php`

Purpose:

- Create, edit, view, print, and email invoice.

Main actions:

- Select company, contact, billing address, branch.
- Add service/fee lines.
- Add expense lines.
- Apply discount/GST.
- Generate draft/final invoice number.
- Submit invoice.
- Send invoice email.
- Print/PDF.

Data used:

- `tbl_billing_master`
- `tbl_billing_child`
- `tbl_invoice_template`
- `invoice_settings`
- `crm_branch_master`

### 7.14 Invoice Approval / Logs Pages

Old pages:

- invoice approval views/log views inside `Invoice.php`

Purpose:

- Handle invoice approval workflow.

Main actions:

- Submit invoice for approval.
- Approve/reject/re-request.
- Apply threshold approval.
- View approval log.

Data used:

- `tbl_invoice_approval_flow`
- `tbl_invoice_approval_audit`
- `tbl_invoice_log`

### 7.15 Payment Pages

Old pages:

- `finance/add_payments.php`
- `finance/view_payments.php`
- `finance/payment_history_pop_up.php`

Purpose:

- Record payments against invoices.

Main actions:

- Add payment amount/date/method/reference.
- View payment history.
- Calculate paid/due amounts.

Data used:

- `tbl_billing_transaction`
- `tbl_payment_method`
- `tbl_billing_master`

### 7.16 Credit Note / Debit Note Pages

Old pages:

- credit note/debit note pages and print methods inside `Invoice.php`

Purpose:

- Create credit/debit notes and adjust invoice balance.

Main actions:

- Create note.
- Generate note number.
- Submit/approve note.
- Print/PDF note.
- Apply/remove refund or debit status.

Data used:

- `tbl_credit_note_invoice`
- `tbl_billing_master`
- `tbl_billing_child`
- approval/log tables

### 7.17 Expense Management Page

Old pages:

- `crm/activity/expenses_management.php`
- `crm/activity/expense_activity.php`

Purpose:

- Record and manage project/customer/task expenses.

Main actions:

- Add/edit/delete expense.
- Upload expense files.
- Check disbursement threshold.
- Link expenses to invoice.
- View expense invoice history.

Data used:

- `crm_task_expenses`
- `crm_expense_head_master`
- project/company/task tables

### 7.18 Cost Recovery Page

Old pages:

- `crm/sales_order/list_cost_recovery.php`
- `Cost_recovery.php`

Purpose:

- Select project/task/expense/other recovery items and generate invoice.

Main actions:

- View recoverable items.
- Mark item invoice/COR/nullify.
- Generate cost recovery invoice.

Data used:

- `crm_cost_recovery`
- `crm_task_expenses`
- `crm_project_allocation`
- `tbl_billing_master`

### 7.19 Pre Sales Settings Pages

Old pages:

- `lead_status/*`
- `lead_source/*`
- `order_reason/*`
- `crm/crm_settings/*`

Purpose:

- Configure lead/quotation/sales settings.

Main actions:

- Manage lead statuses.
- Manage lead sources.
- Manage order reasons.
- Manage quotation numbering.
- Manage email templates and notification settings.
- Manage SLA terms.

Data used:

- `crm_lead_status`
- `crm_lead_source`
- `crm_order_reason`
- `crm_setting`
- `crm_sla_terms`
- `crm_sla_terms_detail`

### 7.20 PM Settings Pages

Old pages:

- `project_status/*`
- `workspace/*`
- `myTeam/*`
- cycle/task/priority settings pages

Purpose:

- Configure PM workflow.

Main actions:

- Manage project/task/ticket statuses.
- Set default closed/completed statuses.
- Manage task/ticket priority.
- Manage workspaces.
- Manage team members.
- Manage cycle master and cycle tasks.

Data used:

- `crm_project_status`
- `crm_task_priority_master`
- `crm_ticket_priority_master`
- `crm_workspace`
- `crm_team`
- `crm_team_member`
- `crm_cycle_master`
- `crm_cycle_master_tasks`

### 7.21 Compliance List / Event Pages

Old pages:

- `company_agm/add_agm.php`
- `company_agm/edit_agm.php`
- old event listing pages

Purpose:

- Create/edit company events like AGM, AR, ECI, Anniversary and manual events.

Main actions:

- Select company and event type.
- Enter due date, held date, filing date, meeting details.
- Manage attendees and recipients.
- Store event details.

Data used:

- `company_agm`
- `company_event_name`
- company/officer/contact tables

### 7.22 Due Date Tracker Page

Old pages:

- `duedatetracker.php`
- `ajax_datatable_page/duedate_listing.php`

Purpose:

- Show events with due dates and allow old-style due date extension.

Main actions:

- Filter by event type, company, year/date.
- Show due dates.
- Extend only allowed events.
- Track actual vs extended due date behavior.

Data used:

- old AGM/event tables
- company tables
- audit/history logic

### 7.23 Reminder Pages

Old pages:

- reminder master/list/log pages from old reminder files

Purpose:

- Configure reminders and show due reminder event list.

Main actions:

- Create reminder rule/template.
- Show reminder dates for events.
- Send emails by cron.
- Show logs.

Data used:

- reminder settings tables
- event tables
- email settings
- log tables

## 8. Old System Problems

The old project logic is useful, but implementation has problems:

1. Very large controllers.
   - `Orders.php` and `Invoice.php` contain many unrelated workflows.

2. Repeated table responsibility.
   - Sales order data is split across `crm_convert_order`, `crm_sales_order`, `crm_orders_project`, and `crm_project_sales`.

3. JSON stored in text fields for reportable data.
   - Example: cost recovery details and selected services.

4. Numeric status values are ambiguous.

5. Settings are scattered.
   - CRM settings, invoice settings, branch settings, PM settings, and email settings are mixed.

6. Views contain too much business logic and JavaScript calculation.

7. Number generation is embedded in controllers.

8. Invoice approval, credit note, debit note, payments, reports, templates, and numbering are all mixed in one controller.

9. Reminder/event logic is partly company logic, partly event logic, partly old AGM logic.

10. Old table naming is inconsistent.

The new project should keep the workflow but redesign the code and DB structure.
