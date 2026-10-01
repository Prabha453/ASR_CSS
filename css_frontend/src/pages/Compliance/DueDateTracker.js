import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getLoggedinUser } from '../../helpers/api_helper';
import {
  cancelCompanyEventDueDateExtension,
  cancelDispenseCompanyEvent,
  cancelExemptCompanyEvent,
  cancelGeneralEventWaiver,
  dispenseCompanyEvent,
  exemptCompanyEvent,
  extendCompanyEventDueDate,
  getCompanyEventExtensionLogs,
  getCompanyList,
  requestGeneralEventExtension,
  requestGeneralEventWaiver,
  uploadDocumentStore,
} from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

// ── Constants ──
const MAX_EXTENSION_TOTAL_DAYS = 180;
const EVENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  WAIVED: 'WAIVED',
  EXEMPT: 'EXEMPT',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
  DISPENSE: 'DISPENSE',
};

// Statuses an event can be "open"/in-progress in (spec §10) — used to widen the
// OVERDUE computation below to match the backend's _eventDisplayStatus, which no
// longer only marks PENDING events overdue.
const OPEN_STATUSES = [
  'PENDING', 'IN_PREPARATION', 'AWAITING_DOCUMENTS', 'AWAITING_CLIENT', 'AWAITING_APPROVAL', 'READY_TO_FILE',
];

const STATUS_META = {
  OVERDUE: { bg: 'rgba(var(--vz-danger-rgb),.12)', fg: 'var(--vz-danger)', icon: 'ri-error-warning-fill' },
  UPCOMING: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-calendar-line' },
  NOT_STARTED: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-hourglass-line' },
  PENDING: { bg: 'rgba(var(--vz-warning-rgb),.14)', fg: 'var(--vz-warning)', icon: 'ri-time-fill' },
  IN_PREPARATION: { bg: 'rgba(var(--vz-primary-rgb),.12)', fg: 'var(--vz-primary)', icon: 'ri-file-edit-fill' },
  AWAITING_DOCUMENTS: { bg: 'rgba(var(--vz-warning-rgb),.14)', fg: 'var(--vz-warning)', icon: 'ri-file-upload-fill' },
  AWAITING_CLIENT: { bg: 'rgba(var(--vz-warning-rgb),.14)', fg: 'var(--vz-warning)', icon: 'ri-user-received-fill' },
  AWAITING_APPROVAL: { bg: 'rgba(var(--vz-warning-rgb),.14)', fg: 'var(--vz-warning)', icon: 'ri-shield-user-fill' },
  READY_TO_FILE: { bg: 'rgba(var(--vz-primary-rgb),.12)', fg: 'var(--vz-primary)', icon: 'ri-send-plane-fill' },
  FILED: { bg: 'rgba(var(--vz-success-rgb),.12)', fg: 'var(--vz-success)', icon: 'ri-checkbox-circle-fill' },
  COMPLETED: { bg: 'rgba(var(--vz-success-rgb),.12)', fg: 'var(--vz-success)', icon: 'ri-checkbox-circle-fill' },
  HELD: { bg: 'rgba(var(--vz-success-rgb),.12)', fg: 'var(--vz-success)', icon: 'ri-checkbox-circle-fill' },
  DISPENSE: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-forbid-fill' },
  WAIVED: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-forbid-fill' },
  CANCELLED: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-close-circle-fill' },
  NOT_APPLICABLE: { bg: 'rgba(135,138,153,.14)', fg: 'var(--vz-gray-600)', icon: 'ri-forbid-2-fill' },
  EXEMPT: { bg: 'rgba(2,168,181,.12)', fg: 'var(--vz-teal)', icon: 'ri-shield-check-fill' },
  EXEMPTED: { bg: 'rgba(2,168,181,.12)', fg: 'var(--vz-teal)', icon: 'ri-shield-check-fill' },
};

const COLS = [
  { key: 'company_name', label: 'Company', sortable: true , style : { width : '150px' } },
  { key: 'event_name', label: 'Event', sortable: true , style : { width : '150px' }},
  { key: 'fye_date', label: 'FYE Date', sortable: true , style : { width : '50px' }},
  { key: 'effective_due_date', label: 'Due Date', sortable: true , style : { width : '50px' }},
  { key: 'status', label: 'Status', sortable: true , style : { width : '50px' }},
  { key: 'actions', label: 'Action', sortable: false , style : { width : '200px' }},
];

const REMINDER_DATE_BASIS = {
  ACTUAL: 'ACTUAL_DUE_DATE',
  EXTENDED: 'EXTENDED_DUE_DATE',
};

const BLANK_FILTERS = {
  search: '',
  company_id: '',
  event_key: '',
  event_status: '',
  due_from: '',
  due_to: '',
  date_type: 'ALL',
  extension_filter: 'ALL',
};

const FILTER_LABELS = {
  search: 'Search',
  company_id: 'Company',
  event_key: 'Event',
  event_status: 'Status',
  due_from: 'Due From',
  due_to: 'Due To',
  date_type: 'View',
  extension_filter: 'Extension',
};

const FILTER_VALUE_LABELS = {
  date_type: {
    ALL: 'All due dates',
    TODAY: 'Due today',
    UPCOMING: 'Upcoming',
    OVERDUE: 'Overdue',
    EXTENDED: 'Extended only',
  },
  extension_filter: {
    ALL: 'All',
    CAN_EXTEND: 'Can extend',
    HAS_EXTENSION: 'Has extension',
    NO_EXTENSION: 'No extension',
  },
  event_status: {
    UPCOMING: 'Upcoming',
    PENDING: 'Pending',
    NOT_STARTED: 'Not Started',
    IN_PREPARATION: 'In Preparation',
    AWAITING_DOCUMENTS: 'Awaiting Documents',
    AWAITING_CLIENT: 'Awaiting Client',
    AWAITING_APPROVAL: 'Awaiting Approval',
    READY_TO_FILE: 'Ready to File',
    FILED: 'Filed',
    OVERDUE: 'Overdue',
    COMPLETED: 'Completed',
    DISPENSE: 'Dispense',
    WAIVED: 'Waived',
    CANCELLED: 'Cancelled',
    NOT_APPLICABLE: 'Not Applicable',
    EXEMPT: 'Exempt',
    EXEMPTED: 'Exempted',
  },
};

const CONFIRM_ACTIONS = {
  'cancel-extension': {
    icon: 'ri-close-circle-line',
    color: 'var(--vz-danger)',
    colorRgb: 'var(--vz-danger-rgb)',
    title: 'Cancel Due Date Extension?',
    message: row => {
      const type = getExtensionType(row);
      if (['AGM', 'AR'].includes(type)) {
        return 'This will cancel the latest 60-day extension. If it reaches the original due date, the extension will be removed.';
      }
      return 'This will remove the extended due date and revert to the original due date.';
    },
    confirmLabel: 'Yes, Cancel Extension',
    confirmColor: 'danger',
  },
  dispense: {
    icon: 'ri-forbid-line',
    color: 'var(--vz-gray-600)',
    colorRgb: '135, 138, 153',
    title: 'Dispense This AGM?',
    message: () => `This event will be marked as dispensed and removed from active due date tracking.`,
    confirmLabel: 'Yes, Dispense',
    confirmColor: 'secondary',
  },
  'cancel-dispense': {
    icon: 'ri-restart-line',
    color: 'var(--vz-success)',
    colorRgb: 'var(--vz-success-rgb)',
    title: 'Cancel Dispense?',
    message: () => `This AGM event will be restored back to active status.`,
    confirmLabel: 'Yes, Restore',
    confirmColor: 'success',
  },
  exempt: {
    icon: 'ri-shield-check-line',
    color: 'var(--vz-teal)',
    colorRgb: '2, 168, 181',
    title: 'Exempt This AGM?',
    message: () => `This event will be marked as exempted and removed from active due date tracking.`,
    confirmLabel: 'Yes, Exempt',
    confirmColor: 'info',
  },
  'cancel-exempt': {
    icon: 'ri-restart-line',
    color: 'var(--vz-success)',
    colorRgb: 'var(--vz-success-rgb)',
    title: 'Cancel Exemption?',
    message: () => `This AGM event will be restored back to active status.`,
    confirmLabel: 'Yes, Restore',
    confirmColor: 'success',
  },
  'cancel-waiver': {
    icon: 'ri-restart-line',
    color: 'var(--vz-success)',
    colorRgb: 'var(--vz-success-rgb)',
    title: 'Cancel Waiver?',
    message: () => `This event will be restored back to active status.`,
    confirmLabel: 'Yes, Restore',
    confirmColor: 'success',
  },
};

// ── Helper Functions ──
const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toDateInput = value => value ? String(value).slice(0, 10) : '';
const todayInput = () => new Date().toISOString().slice(0, 10);
const getEffectiveDueDate = event => event?.extended_due_date || event?.due_date || '';

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = normalizeDate(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};

const daysBetween = (from, to) => {
  const start = normalizeDate(from);
  const end = normalizeDate(to);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
};

const getExtensionType = (row) => {
  const item = row || {};
  const slug = String(item.event_slug || item.event?.event_slug || '').toLowerCase();
  const name = String(item.event_name || item.event?.event_name || '').toLowerCase();
  if (slug === 'agm' || name === 'agm' ) return 'AGM';
  if (slug === 'ar' || name === 'ar' || slug === 'annual-return-filing' || name === 'annual return filing') return 'AR';
  if (slug === 'annual-filing' || name === 'annual filing') return 'Annual Filing';
  return '';
};

const currentExtensionDays = row => row?.extended_due_date ? daysBetween(row.due_date, row.extended_due_date) : 0;

const getExtensionOptions = (row) => {
  const type = getExtensionType(row);
  if (type === 'Annual Filing' && row?.extended_due_date) return [];
  const alreadyExtendedDays = currentExtensionDays(row);
  if (['AGM', 'AR'].includes(type)) {
    const completedStages = Math.max(0, Math.ceil(alreadyExtendedDays / 60));
    if (completedStages >= 3) return [];
    return [{
      value: 60,
      stage: completedStages + 1,
      label: `60 Days - ${completedStages + 1}${completedStages === 0 ? 'st' : completedStages === 1 ? 'nd' : 'rd'} Extension`,
    }];
  }
  if (type === 'Annual Filing') {
    return [{ value: 60, stage: 1, label: '60 Days / 2 Months' }];
  }
  return [];
};

const isBlockedExtensionStatus = (row) => {
  const item = row || {};
  const status = String(item.status || '').toUpperCase();
  const displayStatus = String(item.display_status || '').toUpperCase();
  return ['COMPLETED', 'WAIVED', 'CANCELLED', 'DISPENSE', 'EXEMPT', 'EXEMPTED'].includes(status)
    || ['COMPLETED', 'WAIVED', 'CANCELLED', 'DISPENSE', 'EXEMPT', 'EXEMPTED'].includes(displayStatus);
};

const canApplyExtension = (row) => {
  const item = row || {};
  const type = getExtensionType(row);
  if (!type || !item.due_date || item.filing_date || isBlockedExtensionStatus(item)) return false;
  return getExtensionOptions(row).length > 0;
};

const canCancelExtension = (row) => {
  const item = row || {};
  return Boolean(
    getExtensionType(item)
    && item.extended_due_date
    && !item.filing_date
    && !isBlockedExtensionStatus(item)
  );
};

const isAgmEvent = row => getExtensionType(row) === 'AGM';
const isDispensedEvent = row => ['WAIVED', 'DISPENSE'].includes(String(row?.status || row?.display_status || '').toUpperCase());
const canDispenseEvent = row => Boolean(
  isAgmEvent(row)
  && row?.due_date
  && !row?.filing_date
  && !isDispensedEvent(row)
  && !isExemptedEvent(row)
  && !['COMPLETED', 'CANCELLED'].includes(String(row?.status || '').toUpperCase())
);

const canCancelDispenseEvent = row => Boolean(isAgmEvent(row) && isDispensedEvent(row));

const isExemptedEvent = row => String(row?.status || row?.display_status || '').toUpperCase() === 'EXEMPT';
const canExemptEvent = row => Boolean(
  isAgmEvent(row)
  && row?.due_date
  && !row?.filing_date
  && !isDispensedEvent(row)
  && !isExemptedEvent(row)
  && !['COMPLETED', 'CANCELLED'].includes(String(row?.status || '').toUpperCase())
);

const canCancelExemptEvent = row => Boolean(isAgmEvent(row) && isExemptedEvent(row));

// ── General (non-AGM/AR/Annual Filing) extension/waiver — spec §7 ──
// Surfaces the supports_extension/supports_waiver master flags (now returned on
// every row) for event types the hardcoded AGM/AR/Annual Filing flow doesn't cover.
const isGeneralWaivedEvent = row => String(row?.status || '').toUpperCase() === 'WAIVED';
const canRequestGeneralExtension = row => Boolean(
  row
  && !getExtensionType(row)
  && row.supports_extension
  && row.due_date
  && !row.filing_date
  && !isBlockedExtensionStatus(row)
);
const canRequestGeneralWaiver = row => Boolean(
  row
  && !getExtensionType(row)
  && row.supports_waiver
  && !row.filing_date
  && !isBlockedExtensionStatus(row)
  && !isGeneralWaivedEvent(row)
);
const canCancelGeneralWaiver = row => Boolean(row && !getExtensionType(row) && isGeneralWaivedEvent(row));

const displayStatusForRow = (event = {}) => {
  const rawStatus = String(event.status || 'PENDING').toUpperCase();
  if (getExtensionType(event) === 'AGM' && rawStatus === 'WAIVED') return 'DISPENSE';
  return rawStatus;
};

const getStatusMeta = (row) => {
  const status = String(row.display_status || row.status || '').toUpperCase();
  return STATUS_META[status] || { bg: 'rgba(var(--vz-primary-rgb),.12)', fg: 'var(--vz-primary)', icon: 'ri-information-fill' };
};

const rowStatusClass = (row = {}) => {
  const status = String(row.display_status || row.status || 'pending').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `status-${status || 'pending'}`;
};

const parseAuditValues = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
};

const reminderBasisLabel = (value) => (
  String(value || '').toUpperCase() === REMINDER_DATE_BASIS.ACTUAL
    ? 'Actual Due Date'
    : 'Extended Due Date'
);

const auditActionLabel = (log = {}, values = {}) => {
  const type = values.extension_type || '';
  if (log.action === 'CANCEL_EVENT_DUE_DATE_EXTENSION') {
    if (type === 'ANNUAL_FILING') return 'Cancel Annual Filing Extension';
    if (type === 'AR') return 'Cancel AR Extension';
    return 'Cancel AGM Extension';
  }
  if (log.action === 'EXTEND_EVENT_DUE_DATE') {
    if (type === 'ANNUAL_FILING') return 'Annual Filing Extension';
    if (type === 'AR') return 'AR Extension';
    return 'AGM Extension';
  }
  return log.action || '';
};

const auditLogToHistory = (log = {}) => {
  const oldValues = parseAuditValues(log.old_values);
  const newValues = parseAuditValues(log.new_values);
  const adminName = [log.user?.first_name, log.user?.last_name].filter(Boolean).join(' ') || log.user?.user_name || '';
  const base = {
    updated_date: log.created_at || log.updated_at || '',
    admin_name: adminName,
  };
  const rows = [];

  if ((oldValues.extended_due_date || '') !== (newValues.extended_due_date || '')) {
    rows.push({
      ...base,
      action: auditActionLabel(log, newValues),
      field: 'Extended Due Date',
      old_data: oldValues.extended_due_date || '',
      new_data: newValues.extended_due_date || '',
      value_type: 'date',
    });
  }

  if (
    oldValues.reminder_date_basis
    && newValues.reminder_date_basis
    && oldValues.reminder_date_basis !== newValues.reminder_date_basis
  ) {
    rows.push({
      ...base,
      action: 'Reminder Date Basis',
      field: 'Reminder Basis',
      old_data: reminderBasisLabel(oldValues.reminder_date_basis),
      new_data: reminderBasisLabel(newValues.reminder_date_basis),
      value_type: 'text',
    });
  }

  if (!rows.length) {
    rows.push({
      ...base,
      action: auditActionLabel(log, newValues),
      field: 'Change',
      old_data: '',
      new_data: '',
      value_type: 'text',
    });
  }

  return rows;
};

const formatHistoryValue = (item, value) => {
  if (!value) return '-';
  return item.value_type === 'date' ? fmtDate(value) : value;
};

// ── Sub-Components ──
const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill asc', { active: sortKey === col && sortDir === 'asc' })} />
    <i className={classnames('ri-arrow-down-s-fill desc', { active: sortKey === col && sortDir === 'desc' })} />
  </span>
);

const StatusBadge = ({ row }) => {
  const meta = getStatusMeta(row);
  const label = row.display_status || row.status || '-';
  return (
    <span className="ddt-status-badge" style={{ background: meta.bg, color: meta.fg }}>
      <i className={meta.icon} style={{ fontSize: 12 }} />
      {label}
    </span>
  );
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }, (_, i) => (
      <tr key={i} className="il-skeleton-row">
        {Array.from({ length: COLS.length + 1 }, (_, j) => (
          <td key={j}><div style={{ width: j === 1 ? 180 : 90 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

// ── Filter Drawer ──
const DueDateFilterDrawer = ({
  open,
  onClose,
  filters,
  setFilter,
  resetFilters,
  companyOptions,
  eventOptions,
}) => (
  <>
    {open && <div className="ddt-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('ddt-drawer', { open })}>
      <div className="ddt-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary" />Due Date Filters</h6>
        <button type="button" className="ddt-drawer-close" onClick={onClose}>
          <i className="ri-close-line" />
        </button>
      </div>

      <div className="ddt-drawer-body">
        <div className="ddt-section-divider">Event</div>

        <div className="ddt-filter-group">
          <label>Company</label>
          <Input bsSize="sm" type="select" value={filters.company_id} onChange={e => setFilter('company_id', e.target.value)}>
            <option value="">All companies</option>
            {companyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Input>
        </div>

        <div className="ddt-filter-group">
          <label>Event</label>
          <Input bsSize="sm" type="select" value={filters.event_key} onChange={e => setFilter('event_key', e.target.value)}>
            <option value="">All events</option>
            {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Input>
        </div>

        <div className="ddt-filter-group">
          <label>Status</label>
          <Input bsSize="sm" type="select" value={filters.event_status} onChange={e => setFilter('event_status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PREPARATION">In Preparation</option>
            <option value="AWAITING_DOCUMENTS">Awaiting Documents</option>
            <option value="AWAITING_CLIENT">Awaiting Client</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="READY_TO_FILE">Ready to File</option>
            <option value="FILED">Filed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="COMPLETED">Completed</option>
            <option value="DISPENSE">Dispense</option>
            <option value="WAIVED">Waived</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
            <option value="EXEMPT">Exempt</option>
            <option value="EXEMPTED">Exempted</option>
          </Input>
        </div>

        <div className="ddt-section-divider">Due Date</div>

        <div className="ddt-filter-group">
          <label>View</label>
          <Input bsSize="sm" type="select" value={filters.date_type} onChange={e => setFilter('date_type', e.target.value)}>
            <option value="ALL">All due dates</option>
            <option value="TODAY">Due today</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="OVERDUE">Overdue</option>
            <option value="EXTENDED">Extended only</option>
          </Input>
        </div>

        <div className="ddt-filter-group">
          <label>Extension</label>
          <Input bsSize="sm" type="select" value={filters.extension_filter} onChange={e => setFilter('extension_filter', e.target.value)}>
            <option value="ALL">All</option>
            <option value="CAN_EXTEND">Can extend</option>
            <option value="HAS_EXTENSION">Has extension</option>
            <option value="NO_EXTENSION">No extension</option>
          </Input>
        </div>

        <div className="ddt-filter-group">
          <label>Due Date Range</label>
          <div className="d-flex gap-2">
            <DatePickerInput name="due_from" value={filters.due_from} onChange={e => setFilter('due_from', e.target.value)} placeholder="From" />
            <DatePickerInput name="due_to" value={filters.due_to} onChange={e => setFilter('due_to', e.target.value)} placeholder="To" />
          </div>
        </div>
      </div>

      <div className="ddt-drawer-foot">
        <Button size="sm" color="light" onClick={resetFilters} className="d-flex align-items-center gap-1">
          <i className="ri-refresh-line" /> Reset
        </Button>
        <Button
          size="sm"
          color="primary"
          onClick={onClose}
          style={{ flex: 1 }}
          className="d-flex align-items-center justify-content-center gap-1"
        >
          <i className="ri-search-line" /> Apply Filters
        </Button>
      </div>
    </div>
  </>
);

// ── Extend Modal ──
const HistoryTable = ({ history, logsLoading, compact = false }) => (
  <div className={compact ? 'mt-3' : ''}>
    <div className="text-muted fs-11 text-uppercase fw-semibold mb-2">Extension History</div>
    {logsLoading ? (
      <div className="text-muted fs-12 border rounded p-3"><Spinner size="sm" className="me-1" /> Loading history...</div>
    ) : !history.length ? (
      <div className="text-muted fs-12 border rounded p-3">No extension history found.</div>
    ) : (
      <div className="ddt-history-list">
        {history.map((item, index) => (
          <div className="ddt-history-item" key={`${item.updated_date || index}-${item.field}-${index}`}>
            <div className="ddt-history-top">
              <span className="ddt-history-action">{item.action || '-'}</span>
              <span className="ddt-history-date">{item.updated_date ? fmtDate(item.updated_date) : '-'}</span>
            </div>
            <div className="ddt-history-change">
              <span className="ddt-history-field">{item.field}</span>
              <span className="ddt-history-value old">{formatHistoryValue(item, item.old_data)}</span>
              <i className="ri-arrow-right-line" />
              <span className="ddt-history-value new">{formatHistoryValue(item, item.new_data)}</span>
            </div>
            <div className="ddt-history-user">Updated by {item.admin_name || 'System'}</div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ExtendDueDateModal = ({ row, open, mode = 'extend', saving, logsLoading, auditLogs, onClose, onSave, onCancelExtension }) => {
  const options = useMemo(() => getExtensionOptions(row), [row]);
  const [extensionDays, setExtensionDays] = useState('');
  const [reminderDateBasis, setReminderDateBasis] = useState(REMINDER_DATE_BASIS.EXTENDED);
  const [reason, setReason] = useState('');
  const [authority, setAuthority] = useState('');
  const [reference, setReference] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    setExtensionDays(options[0]?.value ? String(options[0].value) : '');
    setReminderDateBasis(
      row?.reminder_date_basis === REMINDER_DATE_BASIS.ACTUAL
        ? REMINDER_DATE_BASIS.ACTUAL
        : REMINDER_DATE_BASIS.EXTENDED
    );
    setReason('');
    setAuthority('');
    setReference('');
    setEvidenceFile(null);
  }, [open, row, options]);

  const originalDue = toDateInput(row?.due_date);
  const currentExtendedDue = toDateInput(row?.extended_due_date);
  const baseDate = currentExtendedDue || originalDue;
  const nextDue = extensionDays ? addDays(baseDate, Number(extensionDays)) : '';
  const history = auditLogs.flatMap(auditLogToHistory);
  const extensionType = getExtensionType(row);
  const totalExtendedDays = nextDue ? daysBetween(originalDue, nextDue) : 0;
  const allowApply = canApplyExtension(row);
  const isHistoryOnly = mode === 'history';

  return (
    <Modal isOpen={open} toggle={onClose} centered size="lg">
      <ModalHeader toggle={onClose}>{isHistoryOnly ? 'Extension History' : 'Extend Due Date'}</ModalHeader>
      <ModalBody>
        <div className="ddt-modal-summary">
          <div className="ddt-modal-title">{row?.event_name || '-'}</div>
          <div className="ddt-modal-meta">
            {row?.company_name || '-'}
            {row?.event_slug ? <span className="ms-2">({row.event_slug})</span> : null}
          </div>
        </div>
        {!isHistoryOnly && (
          <Row className="g-2">
            <Col md={6}>
              <Label className="form-label fs-12">Original Due Date</Label>
              <Input bsSize="sm" value={fmtDate(originalDue)} readOnly />
            </Col>
            <Col md={6}>
              <Label className="form-label fs-12">Current Extended Due Date</Label>
              <Input bsSize="sm" value={fmtDate(currentExtendedDue)} readOnly />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Extension Type</Label>
              <Input bsSize="sm" value={extensionType || 'Not available'} readOnly />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Extend By <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm"
                type="select"
                value={extensionDays}
                disabled={!allowApply}
                onChange={e => setExtensionDays(e.target.value)}
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Input>
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">New Extended Due Date</Label>
              <Input bsSize="sm" value={fmtDate(nextDue)} readOnly />
            </Col>
            {totalExtendedDays > 0 && (
              <Col md={12}>
                <div className="text-muted fs-11 mt-2">Total extension from original due date: {totalExtendedDays} day(s)</div>
              </Col>
            )}
            <Col md={4}>
              <Label className="form-label fs-12">Authority</Label>
              <Input bsSize="sm" value={authority} disabled={!allowApply} onChange={e => setAuthority(e.target.value)} placeholder="Optional" />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Reference</Label>
              <Input bsSize="sm" value={reference} disabled={!allowApply} onChange={e => setReference(e.target.value)} placeholder="Optional" />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Evidence</Label>
              <input
                type="file"
                className="form-control form-control-sm"
                disabled={!allowApply}
                onChange={e => setEvidenceFile(e.target.files?.[0] || null)}
              />
            </Col>
            <Col md={12}>
              <Label className="form-label fs-12">Reason</Label>
              <Input bsSize="sm" type="textarea" rows={2} value={reason} disabled={!allowApply} onChange={e => setReason(e.target.value)} placeholder="Optional" />
            </Col>
            <Col md={12}>
              <Label className="form-label fs-12 mb-1">Reminder Date Basis</Label>
              <div className="d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="reminder-date-basis-extended"
                    checked={reminderDateBasis === REMINDER_DATE_BASIS.EXTENDED}
                    onChange={() => setReminderDateBasis(REMINDER_DATE_BASIS.EXTENDED)}
                    disabled={!allowApply}
                  />
                  <label className="form-check-label fs-12" htmlFor="reminder-date-basis-extended">
                    Extended Due Date
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="reminder-date-basis-actual"
                    checked={reminderDateBasis === REMINDER_DATE_BASIS.ACTUAL}
                    onChange={() => setReminderDateBasis(REMINDER_DATE_BASIS.ACTUAL)}
                    disabled={!allowApply}
                  />
                  <label className="form-check-label fs-12" htmlFor="reminder-date-basis-actual">
                    Actual Due Date
                  </label>
                </div>
              </div>
            </Col>
          </Row>
        )}
        <HistoryTable history={history} logsLoading={logsLoading} compact={!isHistoryOnly} />
      </ModalBody>
      <ModalFooter>
        {!isHistoryOnly && row?.extended_due_date && canCancelExtension(row) && (
          <Button color="danger" outline size="sm" disabled={saving} onClick={onCancelExtension}>
            Cancel Extend
          </Button>
        )}
        <Button color="secondary" size="sm" disabled={saving} onClick={onClose}>{isHistoryOnly ? 'Close' : 'Cancel'}</Button>
        {!isHistoryOnly && (
          <Button color="primary" size="sm" disabled={saving || !extensionDays || !allowApply} onClick={() => onSave(Number(extensionDays), reminderDateBasis, reason, authority, reference, evidenceFile)}>
            {saving ? <Spinner size="sm" className="me-1" /> : <i className="ri-save-3-line me-1" />}
            Apply Extension
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

// ── General (non-AGM/AR/Annual Filing) extension/waiver request modal — spec §7 ──
// Covers whichever event types have supports_extension/supports_waiver=true on their
// master. Reason is required; authority/reference/evidence are optional.
const GeneralActionModal = ({ row, mode, open, saving, onClose, onSave }) => {
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [authority, setAuthority] = useState('');
  const [reference, setReference] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDueDate('');
    setReason('');
    setAuthority('');
    setReference('');
    setEvidenceFile(null);
  }, [open, row, mode]);

  const isExtension = mode === 'extension';
  const currentDue = toDateInput(row?.extended_due_date || row?.due_date);
  const canSave = isExtension ? Boolean(dueDate && reason.trim()) : Boolean(reason.trim());

  return (
    <Modal isOpen={open} toggle={onClose} centered size="md">
      <ModalHeader toggle={onClose}>{isExtension ? 'Request Extension' : 'Request Waiver'}</ModalHeader>
      <ModalBody>
        <div className="ddt-modal-summary">
          <div className="ddt-modal-title">{row?.event_name || '-'}</div>
          <div className="ddt-modal-meta">{row?.company_name || '-'}</div>
        </div>
        <Row className="g-2">
          {isExtension && (
            <>
              <Col md={6}>
                <Label className="form-label fs-12">Current Due Date</Label>
                <Input bsSize="sm" value={fmtDate(currentDue)} readOnly />
              </Col>
              <Col md={6}>
                <Label className="form-label fs-12">Requested Due Date <span className="text-danger">*</span></Label>
                <DatePickerInput value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </Col>
            </>
          )}
          <Col md={6}>
            <Label className="form-label fs-12">Authority</Label>
            <Input bsSize="sm" value={authority} onChange={e => setAuthority(e.target.value)} placeholder="Optional" />
          </Col>
          <Col md={6}>
            <Label className="form-label fs-12">Reference</Label>
            <Input bsSize="sm" value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" />
          </Col>
          <Col md={12}>
            <Label className="form-label fs-12">Evidence{row?.evidence_required ? <span className="text-danger"> *</span> : ''}</Label>
            <input
              type="file"
              className="form-control form-control-sm"
              onChange={e => setEvidenceFile(e.target.files?.[0] || null)}
            />
          </Col>
          <Col md={12}>
            <Label className="form-label fs-12">Reason <span className="text-danger">*</span></Label>
            <Input bsSize="sm" type="textarea" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Required" />
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" size="sm" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button
          color="primary"
          size="sm"
          disabled={saving || !canSave || (row?.evidence_required && !evidenceFile)}
          onClick={() => onSave({ dueDate, reason, authority, reference, evidenceFile })}
        >
          {saving ? <Spinner size="sm" className="me-1" /> : <i className="ri-save-3-line me-1" />}
          Submit
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ── Confirmation Modal ──
const ConfirmActionModal = ({ open, type, row, saving, onClose, onConfirm }) => {
  const config = CONFIRM_ACTIONS[type];
  if (!config) return null;

  return (
    <Modal isOpen={open} toggle={saving ? undefined : onClose} fade centered modalClassName="zoomIn">
      <ModalBody className="py-4 px-4 position-relative">
        {!saving && (
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3"
            onClick={onClose}
            aria-label="Close"
          />
        )}
        <div className="text-center">
          <div
            className="ddt-confirm-icon-wrap"
            style={{ background: `rgba(${config.colorRgb}, 0.12)` }}
          >
            <i className={config.icon} style={{ fontSize: 28, color: config.color }} />
          </div>
          <h5 className="mb-2">{config.title}</h5>
          <p className="text-muted mb-0 px-2">{config.message(row)}</p>

          {row && (
            <div className="ddt-confirm-summary">
              <div className="ddt-modal-title">{row.event_name || '-'}</div>
              <div className="ddt-modal-meta">
                {row.company_name || '-'}
                {row.event_slug ? <span className="ms-2">({row.event_slug})</span> : null}
              </div>
            </div>
          )}
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4">
          <Button size="sm" color="light" onClick={onClose} disabled={saving} style={{ minWidth: 100, height: 34 }}>
            Cancel
          </Button>
          <Button
            size="sm"
            color={config.confirmColor}
            onClick={onConfirm}
            disabled={saving}
            style={{ minWidth: 160, height: 34 }}
            className="d-flex align-items-center justify-content-center gap-1"
          >
            {saving ? <Spinner size="sm" /> : <i className={config.icon} />}
            {config.confirmLabel}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};

// ── Row Actions (All buttons visible, no dropdown) ──
const RowActions = ({
  row,
  saving,
  onEdit,
  onExtend,
  onHistory,
  onCancelExtension,
  onDispense,
  onCancelDispense,
  onExempt,
  onCancelExempt,
  onRequestGeneralExtension,
  onRequestGeneralWaiver,
  onCancelGeneralWaiver,
}) => {
  // Check each action based on legacy logic
  const showExtend = canApplyExtension(row);
  const showCancelExtend = canCancelExtension(row);
  const showHistory = row.extended_due_date;
  const showDispense = canDispenseEvent(row);
  const showCancelDispense = canCancelDispenseEvent(row);
  const showExempt = canExemptEvent(row);
  const showCancelExempt = canCancelExemptEvent(row);
  const showRequestGeneralExtension = canRequestGeneralExtension(row);
  const showRequestGeneralWaiver = canRequestGeneralWaiver(row);
  const showCancelGeneralWaiver = canCancelGeneralWaiver(row);

  return (
    <div className="ddt-actions" style={{ flexWrap: 'wrap', gap: '4px' }}>
      {/* Edit - Always visible */}
      <Button
        color="primary"
        outline
        size="sm"
        title="Edit event"
        onClick={onEdit}
        className="ddt-action-btn"
      >
        <i className="ri-pencil-line" /> Edit
      </Button>

      {/* Extend - Based on legacy logic: show when can apply extension */}
      {showExtend && (
        <Button
          color="success"
          outline
          size="sm"
          title="Extend due date"
          onClick={onExtend}
          className="ddt-action-btn"
        >
          <i className="ri-calendar-event-line" /> Extend
        </Button>
      )}

      {/* Cancel Extend - Based on legacy logic: show when has extension and can cancel */}
      {showCancelExtend && (
        <Button
          color="danger"
          outline
          size="sm"
          title="Cancel extension"
          onClick={onCancelExtension}
          className="ddt-action-btn"
        >
          <i className="ri-close-circle-line" /> Cancel Extend
        </Button>
      )}

      {/* View History - Legacy: show when has extended_due_date */}
      {showHistory && (
        <Button
          color="info"
          outline
          size="sm"
          title="View extension history"
          onClick={onHistory}
          className="ddt-action-btn"
        >
          <i className="ri-history-line" /> History
        </Button>
      )}

      {/* Dispense - Legacy: AGM only, not dispensed, not exempt, not completed, has due date */}
      {showDispense && (
        <Button
          color="secondary"
          outline
          size="sm"
          title="Dispense AGM"
          onClick={onDispense}
          className="ddt-action-btn"
        >
          <i className="ri-forbid-line" /> Dispense
        </Button>
      )}

      {/* Cancel Dispense - Legacy: AGM only, is dispensed */}
      {showCancelDispense && (
        <Button
          color="success"
          outline
          size="sm"
          title="Cancel dispense"
          onClick={onCancelDispense}
          className="ddt-action-btn"
        >
          <i className="ri-restart-line" /> Cancel Dispense
        </Button>
      )}

      {/* Exempt - Legacy: AGM only, not dispensed, not exempt, not completed, has due date */}
      {showExempt && (
        <Button
          color="info"
          outline
          size="sm"
          title="Exempt AGM"
          onClick={onExempt}
          className="ddt-action-btn"
          style={{ color: 'var(--vz-teal)', borderColor: 'var(--vz-teal)' }}
        >
          <i className="ri-shield-check-line" /> Exempt
        </Button>
      )}

      {/* Cancel Exempt - Legacy: AGM only, is exempt */}
      {showCancelExempt && (
        <Button
          color="success"
          outline
          size="sm"
          title="Cancel exemption"
          onClick={onCancelExempt}
          className="ddt-action-btn"
        >
          <i className="ri-restart-line" /> Cancel Exempt
        </Button>
      )}

      {/* Request Extension - General (non-AGM/AR/Annual Filing), supports_extension=true */}
      {showRequestGeneralExtension && (
        <Button
          color="success"
          outline
          size="sm"
          title="Request extension"
          onClick={onRequestGeneralExtension}
          className="ddt-action-btn"
        >
          <i className="ri-calendar-event-line" /> Request Extension
        </Button>
      )}

      {/* Request Waiver - General (non-AGM), supports_waiver=true */}
      {showRequestGeneralWaiver && (
        <Button
          color="info"
          outline
          size="sm"
          title="Request waiver"
          onClick={onRequestGeneralWaiver}
          className="ddt-action-btn"
          style={{ color: 'var(--vz-teal)', borderColor: 'var(--vz-teal)' }}
        >
          <i className="ri-shield-check-line" /> Request Waiver
        </Button>
      )}

      {/* Cancel Waiver - General (non-AGM), currently WAIVED */}
      {showCancelGeneralWaiver && (
        <Button
          color="success"
          outline
          size="sm"
          title="Cancel waiver"
          onClick={onCancelGeneralWaiver}
          className="ddt-action-btn"
        >
          <i className="ri-restart-line" /> Cancel Waiver
        </Button>
      )}
    </div>
  );
};

// ── Main Component ──
const DueDateTracker = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ ...BLANK_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('effective_due_date');
  const [sortDir, setSortDir] = useState('asc');
  const [extendRow, setExtendRow] = useState(null);
  const [extendModalMode, setExtendModalMode] = useState('extend');
  const [extensionLogs, setExtensionLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [lastChangedEventId, setLastChangedEventId] = useState(null);
  const [generalAction, setGeneralAction] = useState(null); // { row, mode: 'extension'|'waiver' }
  const [generalActionSaving, setGeneralActionSaving] = useState(false);

  const loggedUser = getLoggedinUser();
  const userId = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'Due Date Tracker | ASR CSS';

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanyList({ page: 1, limit: 1000, order: 'entity_id:DESC' });
      setCompanies(unwrapList(res));
    } catch {
      toast.error('Failed to load due date tracker');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const companyOptions = useMemo(() => companies
    .map(company => ({ value: String(company.entity_id), label: company.name || `Company #${company.entity_id}` }))
    .sort((a, b) => a.label.localeCompare(b.label)), [companies]);

  const rows = useMemo(() => {
    const today = normalizeDate(todayInput());

    return companies.flatMap(company => {
      const events = Array.isArray(company.events)
        ? company.events.filter(event => !event.is_deleted && event.due_date)
        : [];
      return events.map(event => {
        const effectiveDueDate = getEffectiveDueDate(event);
        const effectiveDate = normalizeDate(effectiveDueDate);
        const rawStatus = displayStatusForRow(event);
        const status = event.filing_date ? 'COMPLETED' : rawStatus;
        const isOverdue = OPEN_STATUSES.includes(status) && effectiveDate && today && effectiveDate < today;

        const companyStatus = company.status || '';
        let displayStatus = isOverdue ? 'OVERDUE' : status;
        
        if (['Dissolved', 'Struck-Off', 'Liquidation', 'Striking Off', 'Terminated', 'De-Registered', 'Pre-Incorporation'].includes(companyStatus)) {
          displayStatus = companyStatus;
        }

        return {
          ...event,
          supports_extension: Boolean(event.supports_extension || event.event?.supports_extension),
          supports_waiver: Boolean(event.supports_waiver || event.event?.supports_waiver),
          evidence_required: Boolean(event.evidence_required || event.event?.evidence_required),
          company,
          company_id: company.entity_id,
          company_name: company.name || '-',
          fye_date: event.fye_date || event.period_end || '',
          event_name: event.event?.event_name || event.event_name || event.event_slug || '-',
          effective_due_date: effectiveDueDate,
          status,
          display_status: displayStatus,
          searchable: [
            company.name,
            event.event?.event_name,
            event.event_name,
            event.event_slug ?? '',
            event.status,
            event.fye_date || event.period_end || '',
            effectiveDueDate,
          ].filter(Boolean).join(' ').toLowerCase(),
        };
      });
    });
  }, [companies]);

  const eventOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const value = String(row.event_id || row.event_slug || '');
      if (!value || map.has(value)) return;
      map.set(value, { value, label: row.event_name || row.event_slug || `Event #${value}` });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const activeChips = useMemo(() => Object.entries(filters)
    .filter(([key, value]) => {
      if (!value) return false;
      if (key === 'date_type' && value === BLANK_FILTERS.date_type) return false;
      if (key === 'extension_filter' && value === BLANK_FILTERS.extension_filter) return false;
      return true;
    })
    .map(([key, value]) => {
      let labelValue = value;
      if (key === 'company_id') {
        labelValue = companyOptions.find(option => String(option.value) === String(value))?.label || value;
      } else if (key === 'event_key') {
        labelValue = eventOptions.find(option => String(option.value) === String(value))?.label || value;
      } else if (FILTER_VALUE_LABELS[key]?.[value]) {
        labelValue = FILTER_VALUE_LABELS[key][value];
      }
      return { key, label: FILTER_LABELS[key] || key, value: labelValue };
    }), [companyOptions, eventOptions, filters]);

  const sideActiveCount = activeChips.filter(chip => chip.key !== 'search').length;

  const filteredRows = useMemo(() => {
    const today = normalizeDate(todayInput());
    const from = normalizeDate(filters.due_from);
    const to = normalizeDate(filters.due_to);
    const search = filters.search.trim().toLowerCase();

    return rows.filter(row => {
      const due = normalizeDate(row.effective_due_date);
      if (search && !row.searchable.includes(search)) return false;
      if (filters.company_id && String(row.company_id) !== String(filters.company_id)) return false;
      if (filters.event_key && String(row.event_id || row.event_slug || '') !== String(filters.event_key)) return false;
      if (filters.event_status && row.display_status !== filters.event_status) return false;
      if (from && (!due || due < from)) return false;
      if (to && (!due || due > to)) return false;
      if (filters.date_type === 'OVERDUE' && row.display_status !== 'OVERDUE') return false;
      if (filters.date_type === 'EXTENDED' && !row.extended_due_date) return false;
      if (filters.date_type === 'TODAY' && (!due || !today || due.getTime() !== today.getTime())) return false;
      if (filters.date_type === 'UPCOMING' && (!due || !today || due < today)) return false;
      if (filters.extension_filter === 'CAN_EXTEND' && !canApplyExtension(row)) return false;
      if (filters.extension_filter === 'HAS_EXTENSION' && !row.extended_due_date) return false;
      if (filters.extension_filter === 'NO_EXTENSION' && row.extended_due_date) return false;
      return true;
    });
  }, [filters, rows]);

  const sortedRows = useMemo(() => {
    const next = [...filteredRows];
    next.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (['due_date', 'extended_due_date', 'effective_due_date', 'fye_date', 'period_end'].includes(sortKey)) {
        const ad = normalizeDate(av)?.getTime() || 0;
        const bd = normalizeDate(bv)?.getTime() || 0;
        return sortDir === 'asc' ? ad - bd : bd - ad;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return next;
  }, [filteredRows, sortDir, sortKey]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [page, pageSize, sortedRows]);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(col.key); setSortDir('asc'); }
  };

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...BLANK_FILTERS });
    setPage(1);
  };

  const removeChip = (key) => {
    setFilter(key, BLANK_FILTERS[key] ?? '');
  };

  const openExtensionModal = async (row, mode = 'extend') => {
    setExtendRow(row);
    setExtendModalMode(mode);
    setExtensionLogs([]);

    if (!row?.company_event_id) return;

    setLogsLoading(true);
    try {
      const res = await getCompanyEventExtensionLogs({
        company_event_id: row.company_event_id,
        page: 1,
        limit: 50,
      });
      // Use the same unwrapList function consistently
      setExtensionLogs(unwrapList(res));
    } catch (err) {
      console.error('Failed to fetch extension logs:', err);
      setExtensionLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Deep-link from Company Events directly to one event's extension or waiver flow.
  useEffect(() => {
    const eventId = searchParams.get('company_event_id');
    const requestedAction = searchParams.get('action') || 'extension';
    if (!eventId || loading || !rows.length) return;

    const row = rows.find(item => String(item.company_event_id) === String(eventId));
    if (!row) return;

    setLastChangedEventId(String(row.company_event_id));
    setFilters(previous => ({
      ...previous,
      company_id: String(row.company_id || ''),
      event_key: String(row.event_id || row.event_slug || ''),
    }));
    setPage(1);

    if (requestedAction === 'waiver') {
      if (isAgmEvent(row)) {
        toast.info('Use Dispense or Exempt on the highlighted AGM row');
      } else if (row.supports_waiver && !isBlockedExtensionStatus(row)) {
        setGeneralAction({ row, mode: 'waiver' });
      } else if (canCancelGeneralWaiver(row)) {
        toast.info('Use Cancel Waiver on the highlighted event row');
      } else {
        toast.info('Waiver is not enabled for this event type');
      }
      setSearchParams({}, { replace: true });
      return;
    }

    const type = getExtensionType(row);
    if (type) {
      openExtensionModal(row, row.extended_due_date ? 'history' : 'extend');
    } else if (row.supports_extension) {
      setGeneralAction({ row, mode: 'extension' });
    } else {
      toast.info('Due-date extension is not enabled for this event type');
    }
    setSearchParams({}, { replace: true });
  }, [loading, rows, searchParams, setSearchParams]);

  // ── Evidence upload → doc_id (spec §7: extension/waiver evidence) ──
  // Uploaded standalone first (the compliance_extension/compliance_waiver row doesn't
  // exist yet), then linked server-side once the primary action creates that row.
  const uploadEvidenceDoc = async (row, file, moduleName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_id', row.company_id || row.entity_id || '');
    formData.append('entity_type', 'company_event');
    formData.append('module_name', moduleName);
    formData.append('doc_category', `${moduleName}_evidence`);
    formData.append('company_event_id', row.company_event_id);
    const res = await uploadDocumentStore(formData);
    const doc = res?.data?.data ?? res?.data ?? res;
    return doc?.doc_id || null;
  };

  const saveExtension = async (extensionDays, reminderDateBasis, reason, authority, reference, evidenceFile) => {
    if (!extendRow?.company_event_id) return;

    setSaving(true);
    let evidenceDocId = null;
    if (evidenceFile) {
      try {
        evidenceDocId = await uploadEvidenceDoc(extendRow, evidenceFile, 'compliance_extension');
      } catch (err) {
        toast.error(err?.message || 'Failed to upload evidence document');
        setSaving(false);
        return;
      }
    }
    try {
      await extendCompanyEventDueDate(extendRow.company_event_id, {
        extension_days: extensionDays,
        reminder_date_basis: reminderDateBasis || REMINDER_DATE_BASIS.EXTENDED,
        reason: reason || undefined,
        authority: authority || undefined,
        reference: reference || undefined,
        evidence_doc_id: evidenceDocId || undefined,
        updated_by: userId,
      });
      toast.success('Due date extended successfully');
      setLastChangedEventId(String(extendRow.company_event_id));
      setExtendRow(null);
      setExtendModalMode('extend');
      setExtensionLogs([]);
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update due date extension');
    } finally {
      setSaving(false);
    }
  };

  const openGeneralAction = (row, mode) => setGeneralAction({ row, mode });
  const closeGeneralAction = () => { if (!generalActionSaving) setGeneralAction(null); };

  const saveGeneralAction = async ({ dueDate, reason, authority, reference, evidenceFile }) => {
    const row = generalAction?.row;
    if (!row?.company_event_id) return;

    setGeneralActionSaving(true);
    let evidenceDocId = null;
    const moduleName = generalAction.mode === 'extension' ? 'compliance_extension' : 'compliance_waiver';
    if (evidenceFile) {
      try {
        evidenceDocId = await uploadEvidenceDoc(row, evidenceFile, moduleName);
      } catch (err) {
        toast.error(err?.message || 'Failed to upload evidence document');
        setGeneralActionSaving(false);
        return;
      }
    }
    try {
      if (generalAction.mode === 'extension') {
        await requestGeneralEventExtension(row.company_event_id, {
          requested_due_date: dueDate,
          reason,
          authority: authority || undefined,
          reference: reference || undefined,
          evidence_doc_id: evidenceDocId || undefined,
          updated_by: userId,
        });
        toast.success('Extension requested successfully');
      } else {
        await requestGeneralEventWaiver(row.company_event_id, {
          reason,
          authority: authority || undefined,
          reference: reference || undefined,
          evidence_doc_id: evidenceDocId || undefined,
          updated_by: userId,
        });
        toast.success('Waiver requested successfully');
      }
      setLastChangedEventId(String(row.company_event_id));
      setGeneralAction(null);
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Request failed');
    } finally {
      setGeneralActionSaving(false);
    }
  };

  const requestCancelExtension = (row) => setConfirmAction({ type: 'cancel-extension', row });
  const requestDispense = (row) => setConfirmAction({ type: 'dispense', row });
  const requestCancelDispense = (row) => setConfirmAction({ type: 'cancel-dispense', row });
  const requestExempt = (row) => setConfirmAction({ type: 'exempt', row });
  const requestCancelExempt = (row) => setConfirmAction({ type: 'cancel-exempt', row });
  const requestCancelGeneralWaiver = (row) => setConfirmAction({ type: 'cancel-waiver', row });

  const closeConfirmAction = () => {
    if (saving) return;
    setConfirmAction(null);
  };

  const runConfirmedAction = async () => {
    if (!confirmAction?.row?.company_event_id) return;
    const { type, row } = confirmAction;

    setSaving(true);
    try {
      if (type === 'cancel-extension') {
        await cancelCompanyEventDueDateExtension(row.company_event_id, { updated_by: userId });
        toast.success('Due date extension cancelled successfully');
        setLastChangedEventId(String(row.company_event_id));
        setExtendRow(null);
        setExtendModalMode('extend');
        setExtensionLogs([]);
      } else if (type === 'dispense') {
        await dispenseCompanyEvent(row.company_event_id, { updated_by: userId });
        toast.success('Event dispensed successfully');
        setLastChangedEventId(String(row.company_event_id));
      } else if (type === 'cancel-dispense') {
        await cancelDispenseCompanyEvent(row.company_event_id, { updated_by: userId });
        toast.success('Event dispense cancelled successfully');
        setLastChangedEventId(String(row.company_event_id));
      } else if (type === 'exempt') {
        await exemptCompanyEvent(row.company_event_id, { updated_by: userId });
        toast.success('Event exempted successfully');
        setLastChangedEventId(String(row.company_event_id));
      } else if (type === 'cancel-exempt') {
        await cancelExemptCompanyEvent(row.company_event_id, { updated_by: userId });
        toast.success('Event exemption cancelled successfully');
        setLastChangedEventId(String(row.company_event_id));
      } else if (type === 'cancel-waiver') {
        await cancelGeneralEventWaiver(row.company_event_id, { updated_by: userId });
        toast.success('Waiver cancelled successfully');
        setLastChangedEventId(String(row.company_event_id));
      }
      setConfirmAction(null);
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <style>{`
        .il-toolbar .btn { height: 30px; }
        .ddt-drawer-backdrop { position: fixed; inset: 0; background: rgba(23,31,60,.35); backdrop-filter: blur(1px); z-index: 1040; }
        .ddt-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 360px; max-width: 92vw; background: #fff; box-shadow: -8px 0 32px rgba(23,31,60,.16); z-index: 1041; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .28s cubic-bezier(.32,.72,0,1); }
        .ddt-drawer.open { transform: translateX(0); }
        .ddt-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--vz-border-color); flex-shrink: 0; }
        .ddt-drawer-head h6 { margin: 0; font-size: 14px; font-weight: 700; }
        .ddt-drawer-close { width: 28px; height: 28px; border-radius: 7px; border: 0; background: var(--vz-gray-100); color: var(--vz-gray-700); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; transition: background .12s; }
        .ddt-drawer-close:hover { background: var(--vz-gray-300); }
        .ddt-drawer-body { flex: 1; overflow-y: auto; padding: 18px; }
        .ddt-drawer-foot { padding: 14px 18px; border-top: 1px solid var(--vz-border-color); display: flex; gap: 8px; flex-shrink: 0; }
        .ddt-filter-group { margin-bottom: 16px; }
        .ddt-filter-group label { font-size: 11px; font-weight: 700; color: var(--vz-gray-600); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; display: block; }
        .ddt-section-divider { font-size: 10px; font-weight: 700; color: var(--vz-primary); text-transform: uppercase; letter-spacing: .07em; margin: 18px 0 12px; padding-bottom: 5px; border-bottom: 1px solid var(--vz-border-color); }
        .ddt-section-divider:first-child { margin-top: 0; }
        .ddt-company-main { font-weight: 700; color: var(--vz-body-color); max-width: 220px; white-space: normal; line-height: 1.3; }
        .ddt-event-name { font-weight: 700; color: var(--vz-primary); max-width: 210px; white-space: normal; line-height: 1.3; }
        .ddt-due-cell { display: flex; flex-direction: column; gap: 2px; min-width: 130px; }
        .ddt-due-original-struck { font-size: 12px; color: var(--vz-secondary-color,var(--vz-gray-600)); text-decoration: line-through; text-decoration-color: var(--vz-gray); text-decoration-thickness: 1.5px; }
        .ddt-due-current { font-weight: 600; color: var(--vz-body-color); }
        .ddt-due-extended-pill { display: inline-flex; align-items: center; gap: 3px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--vz-primary); margin-top: 1px; }
        .ddt-status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 20px; letter-spacing: .02em; }
        .ddt-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .ddt-action-btn { font-size: 10px; padding: 2px 6px; white-space: nowrap; }
        .ddt-action-btn i { font-size: 11px; margin-right: 2px; }
        .ddt-modal-summary { border: 1px solid var(--vz-border-color); border-radius: 10px; padding: 10px 12px; background: var(--vz-light); margin-bottom: 12px; }
        .ddt-modal-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; color: var(--vz-body-color); }
        .ddt-modal-meta { font-size: 12px; color: var(--vz-secondary-color,var(--vz-gray-600)); }
        .ddt-history-list { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; padding-right: 2px; }
        .ddt-history-item { border: 1px solid var(--vz-border-color); border-radius: 8px; padding: 10px 12px; background: var(--vz-card-bg,#fff); box-shadow: 0 1px 2px rgba(23,31,60,.04); }
        .ddt-history-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
        .ddt-history-action { font-size: 12px; font-weight: 700; color: var(--vz-primary); }
        .ddt-history-date { font-size: 11px; color: var(--vz-secondary-color,var(--vz-gray-600)); white-space: nowrap; }
        .ddt-history-change { display: grid; grid-template-columns: minmax(90px, 130px) minmax(0, 1fr) 18px minmax(0, 1fr); gap: 8px; align-items: center; }
        .ddt-history-field { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--vz-secondary-color,var(--vz-gray-600)); }
        .ddt-history-value { min-height: 28px; border-radius: 6px; padding: 5px 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; word-break: break-word; }
        .ddt-history-value.old { background: rgba(var(--vz-danger-rgb),.06); color: var(--vz-danger); }
        .ddt-history-value.new { background: rgba(var(--vz-success-rgb),.08); color: var(--vz-success); }
        .ddt-history-change i { color: var(--vz-secondary-color,var(--vz-gray-600)); text-align: center; }
        .ddt-history-user { margin-top: 7px; font-size: 11px; color: var(--vz-secondary-color,var(--vz-gray-600)); }
        .ddt-confirm-icon-wrap { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .ddt-confirm-summary { border: 1px solid var(--vz-border-color); border-radius: 10px; padding: 8px 12px; background: var(--vz-light); margin: 14px auto 0; max-width: 320px; text-align: left; }
        .il-table tbody tr { transition: background-color .1s ease; }
        .il-table tbody tr:hover { background-color: rgba(var(--vz-primary-rgb),.035); }
        .il-table tbody tr.ddt-row-changed { background: rgba(var(--vz-success-rgb),.14); box-shadow: inset 3px 0 0 var(--vz-success); }
        .il-table tbody tr.ddt-row-changed:hover { background: rgba(var(--vz-success-rgb),.2); }
        .ddt-row-changed .ddt-company-main::after { content: 'Updated'; display: inline-flex; align-items: center; margin-left: 8px; padding: 2px 7px; border-radius: 10px; background: rgba(var(--vz-success-rgb),.16); color: var(--vz-success); font-size: 9px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; vertical-align: middle; }
        .il-table tbody tr.status-overdue td:first-child { border-left-color: var(--vz-danger); }
        .il-table tbody tr.status-completed td:first-child { border-left-color: var(--vz-success); }
        .il-table tbody tr.status-dispense td:first-child,
        .il-table tbody tr.status-waived td:first-child,
        .il-table tbody tr.status-cancelled td:first-child { border-left-color: var(--vz-gray-500); }
        .il-table tbody tr.status-exempt td:first-child,
        .il-table tbody tr.status-exempted td:first-child { border-left-color: var(--vz-teal); }
        .il-skeleton-row td div { height: 14px; background: linear-gradient(90deg, var(--vz-gray-200) 25%, var(--vz-gray-100) 50%, var(--vz-gray-200) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 4px; }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        
        /* Button color overrides for Exempt button */
        .btn-outline-teal {
          color: var(--vz-teal);
          border-color: var(--vz-teal);
        }
        .btn-outline-teal:hover {
          background-color: var(--vz-teal);
          color: #fff;
        }
        @media (max-width: 575.98px) {
          .ddt-history-change { grid-template-columns: 1fr; }
          .ddt-history-change i { transform: rotate(90deg); }
        }
      `}</style>
      <Container fluid>
        <BreadCrumb title="Due Date Tracker" pageTitle="Compliance" infoLink="/compliance/system-guide" />

        <Card>
          <div className="il-toolbar">
            <div className="il-search-wrap">
              <i className="ri-search-line" />
              <Input
                bsSize="sm"
                value={filters.search}
                placeholder="Search company, event, FYE date..."
                onChange={e => setFilter('search', e.target.value)}
              />
            </div>

            <Button
              size="sm"
              style={{ background: '#405189', borderColor: '#405189' }}
              className="d-flex align-items-center gap-1"
              onClick={() => setPage(1)}
            >
              <i className="ri-search-line" /> Search
            </Button>

            <Button
              size="sm"
              color="light"
              className="d-flex align-items-center gap-1 ms-1"
              style={{ position: 'relative' }}
              onClick={() => setFilterOpen(true)}
            >
              <i className="ri-equalizer-line" /> Filters
              {sideActiveCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#405189',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {sideActiveCount}
                </span>
              )}
            </Button>

            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                style={{ fontSize: 11, color: '#f06548', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <i className="ri-refresh-line" /> Reset all
              </button>
            )}

            <div className="il-toolbar-right">
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(64,81,137,.1)', color: '#405189', borderRadius: 10, padding: '2px 8px' }}>
                {sortedRows.length} {sortedRows.length === 1 ? 'record' : 'records'}
              </span>
              <Link to="/compliance/events" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                <i className="ri-list-unordered" />
                <span className="d-none d-sm-inline">Compliance List</span>
              </Link>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#878a99' }}>Active:</span>
              {activeChips.map(chip => (
                <span key={chip.key} className="il-chip">
                  <span style={{ color: '#878a99', marginRight: 2 }}>{chip.label}:</span> {chip.value}
                  <button type="button" onClick={() => removeChip(chip.key)}><i className="ri-close-line" /></button>
                </span>
              ))}
            </div>
          )}

          <DueDateFilterDrawer
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            filters={filters}
            setFilter={setFilter}
            resetFilters={resetFilters}
            companyOptions={companyOptions}
            eventOptions={eventOptions}
          />

            <div className="il-table-wrap">
              <table className="il-table">
                <thead>
                  <tr>
                    <th style={{ width: '10px', textAlign: 'center' }}>#</th>
                    {COLS.map(col => (
                      <th
                        key={col.key}
                        style={col.style || {}}
                        className={classnames({
                          sortable: col.sortable,
                          'sort-asc': sortKey === col.key && sortDir === 'asc',
                          'sort-desc': sortKey === col.key && sortDir === 'desc',
                        })}
                        onClick={() => toggleSort(col)}
                      >
                        {col.label}
                        {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonRows /> : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1}>
                        <div className="il-empty">
                          <div className="il-empty-icon"><i className="ri-calendar-search-line" /></div>
                          <h6 className="mb-1">No due dates found</h6>
                          <p className="mb-0">Try adjusting your filters, or clear them to see every tracked event.</p>
                          {activeChips.length > 0 && (
                            <Button size="sm" color="light" className="mt-3" onClick={resetFilters}>
                              <i className="ri-refresh-line me-1" /> Reset filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : pagedRows.map((row, index) => (
                    <tr
                      key={row.company_event_id}
                      className={classnames({
                        [rowStatusClass(row)]: true,
                        'ddt-row-changed': String(row.company_event_id) === String(lastChangedEventId),
                      })}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--vz-gray-600)', fontSize: 12 }}>
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td>
                        <div className="ddt-company-main">{row.company_name}</div>
                      </td>
                      <td>
                        <div className="ddt-event-name">{row.event_name}</div>
                      </td>
                      <td>{fmtDate(row.fye_date)}</td>
                      <td>
                        <div className="ddt-due-cell">
                          {row.extended_due_date ? (
                            <>
                              <span className="ddt-due-original-struck">{fmtDate(row.due_date)}</span>
                              <span className="ddt-due-current is-extended">{fmtDate(row.extended_due_date)}</span>
                              {/* <span className="ddt-due-extended-pill">
                                <i className="ri-arrow-right-up-line" /> Extended
                              </span> */}
                            </>
                          ) : (
                            <span className="ddt-due-current">{fmtDate(row.due_date)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge row={row} />
                      </td>
                      <td>
                        <RowActions
                          row={row}
                          saving={saving}
                          onEdit={() => navigate(`/compliance/events-update/${row.company_event_id}`)}
                          onExtend={() => openExtensionModal(row, 'extend')}
                          onHistory={() => openExtensionModal(row, 'history')}
                          onCancelExtension={() => requestCancelExtension(row)}
                          onDispense={() => requestDispense(row)}
                          onCancelDispense={() => requestCancelDispense(row)}
                          onExempt={() => requestExempt(row)}
                          onCancelExempt={() => requestCancelExempt(row)}
                          onRequestGeneralExtension={() => openGeneralAction(row, 'extension')}
                          onRequestGeneralWaiver={() => openGeneralAction(row, 'waiver')}
                          onCancelGeneralWaiver={() => requestCancelGeneralWaiver(row)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && rows.length > 0 && (
              <div style={{ padding:'8px 18px', borderTop:'1px solid var(--vz-border-color)' }}>
                <Pagination
                  total={sortedRows.length}
                  currentPage={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(next) => { setPageSize(next); setPage(1); }}
                />
              </div>
            )}
        </Card>
      </Container>

      <ExtendDueDateModal
        row={extendRow}
        mode={extendModalMode}
        open={Boolean(extendRow)}
        saving={saving}
        logsLoading={logsLoading}
        auditLogs={extensionLogs}
        onClose={() => { setExtendRow(null); setExtendModalMode('extend'); setExtensionLogs([]); }}
        onSave={saveExtension}
        onCancelExtension={() => requestCancelExtension(extendRow)}
      />

      <ConfirmActionModal
        open={Boolean(confirmAction)}
        type={confirmAction?.type}
        row={confirmAction?.row}
        saving={saving}
        onClose={closeConfirmAction}
        onConfirm={runConfirmedAction}
      />

      <GeneralActionModal
        row={generalAction?.row}
        mode={generalAction?.mode}
        open={Boolean(generalAction)}
        saving={generalActionSaving}
        onClose={closeGeneralAction}
        onSave={saveGeneralAction}
      />
    </div>
  );
};

export default DueDateTracker;
