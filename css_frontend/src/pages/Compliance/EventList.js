import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Spinner,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { deleteCompanyEvent, getCompanyEventCalculationTrace, getCompanyEventDocuments, getCompanyList, getReminderList, updateCompanyEventDocumentStatus, updateCompanyEventStatus, uploadDocumentStore } from '../../helpers/backend_helper';
import { getRegistrationFields } from '../../helpers/common_helper';
import '../Individual/IndividualList.css';

const EVENT_COLS = [
  { key: 'company_name', label: 'Company', sortable: true, globalOnly: true },
  { key: 'event_name', label: 'Event', sortable: true },
  { key: 'fye_date', label: 'FYE Date', sortable: true },
  { key: 'due_date', label: 'Due Date', sortable: true },
  { key: 'filing_date', label: 'Filing Date', sortable: true },
  { key: 'reminder_dates', label: 'Reminder Dates', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'attendees_count', label: 'Attendees', sortable: true },
  { key: 'receiving_parties_count', label: 'Receiving Parties', sortable: true },
  { key: 'source_basis', label: 'Source', sortable: true },
  { key: 'created_date', label: 'Created', sortable: true },
];

const BLANK_SIDE = {
  status: '',
  event_slug: '',
  due_from: '',
  due_to: '',
  company_status: '',
};

const FILTER_LABELS = {
  search: 'Search',
  status: 'Event Status',
  event_slug: 'Event',
  due_from: 'Due From',
  due_to: 'Due To',
  company_status: 'Company Status',
};

const drawerStyles = `
  .cf-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 1040; }
  .cf-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 340px; background: #fff; box-shadow: -4px 0 24px rgba(0,0,0,0.12); z-index: 1041; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.25s ease; }
  .cf-drawer.open { transform: translateX(0); }
  .cf-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--vz-border-color); flex-shrink: 0; }
  .cf-drawer-head h6 { margin: 0; font-size: 14px; font-weight: 600; }
  .cf-drawer-close { width: 28px; height: 28px; border-radius: 6px; border: none; background: #f3f4f6; color: #374151; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
  .cf-drawer-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
  .cf-drawer-foot { padding: 12px 18px; border-top: 1px solid var(--vz-border-color); display: flex; gap: 8px; flex-shrink: 0; }
  .cf-filter-group { margin-bottom: 14px; }
  .cf-filter-group label { font-size: 11px; font-weight: 600; color: #878a99; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; display: block; }
  .cf-section-divider { font-size: 10px; font-weight: 700; color: #405189; text-transform: uppercase; letter-spacing: .06em; margin: 16px 0 10px; padding-bottom: 4px; border-bottom: 1px solid var(--vz-border-color); }
  .il-due-date-stack { display: flex; flex-direction: column; gap: 2px; min-width: 92px; }
  .il-due-date-original { font-size: 11px; color: var(--vz-secondary-color,#878a99); text-decoration: line-through; line-height: 1.2; }
  .il-due-date-current { font-weight: 600; color: var(--vz-body-color); line-height: 1.2; }
`;

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'object') {
    return [
      ...(Array.isArray(value.officials) ? value.officials : []),
      ...(Array.isArray(value.users) ? value.users : []),
      ...(Array.isArray(value.custom) ? value.custom : []),
    ];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseJsonArray(parsed);
    } catch {
      return [];
    }
  }
  return [];
};

const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (value, days) => {
  const date = toDate(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};

const isActiveReminder = reminder =>
  String(reminder?.category || 'EVENT').toUpperCase() === 'EVENT'
  && String(reminder?.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
  && !reminder?.is_deleted;

const reminderMatchesEvent = (reminder, event, company) => {
  const reminderEventId = Number(reminder?.event_id);
  const eventId = Number(event?.event_id || event?.event?.e_id);
  if (reminderEventId && eventId && reminderEventId !== eventId) return false;

  const reminderCompanyTypeId = Number(reminder?.company_type_id);
  const companyTypeId = Number(company?.company_type_id);
  if (reminderCompanyTypeId && companyTypeId && reminderCompanyTypeId !== companyTypeId) return false;
  if (reminderCompanyTypeId && !companyTypeId) return false;

  return true;
};

const buildReminderDates = (event, company, reminders = []) => {
  const closedStatuses = new Set(['FILED', 'COMPLETED', 'WAIVED', 'DISPENSE', 'EXEMPT', 'CANCELLED', 'NOT_APPLICABLE']);
  if (closedStatuses.has(String(event?.status || '').toUpperCase())) return [];
  const dueDate = event?.reminder_date_basis === 'ACTUAL_DUE_DATE'
    ? event?.due_date
    : (event?.extended_due_date || event?.due_date);
  if (!dueDate) return [];

  return reminders
    .filter(reminder => isActiveReminder(reminder) && reminderMatchesEvent(reminder, event, company))
    .flatMap((reminder) => {
      const offset = Number(reminder.offset_days || 0);
      const sign = String(reminder.timing_type || 'BEFORE').toUpperCase() === 'AFTER' ? 1 : -1;
      const firstDate = addDays(dueDate, sign * offset);
      if (!firstDate) return [];

      const base = {
        reminder_id: reminder.reminder_id,
        subject: reminder.subject || reminder.sender_name || 'Reminder',
        timing_type: String(reminder.timing_type || 'BEFORE').toUpperCase(),
        offset_days: offset,
        is_recurring: Boolean(reminder.is_recurring),
        recurring_interval_days: Number(reminder.recurring_interval_days || 1),
      };

      if (!base.is_recurring) return [{ ...base, date: firstDate }];

      const interval = Math.max(base.recurring_interval_days, 1);
      return Array.from({ length: 3 }, (_, index) => ({
        ...base,
        date: addDays(firstDate, index * interval),
        sequence: index + 1,
      })).filter(row => row.date);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const statusColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'ACTIVE' || key === 'COMPLETED' || key === 'FILED' || key === 'HELD') return 'success';
  if (key === 'INACTIVE' || key === 'OVERDUE') return 'danger';
  if (key === 'PENDING' || key === 'AWAITING_APPROVAL' || key === 'AWAITING_CLIENT' || key === 'AWAITING_DOCUMENTS') return 'warning';
  if (key === 'DRAFT' || key === 'NOT_APPLICABLE' || key === 'UPCOMING') return 'secondary';
  if (key === 'NOT_STARTED') return 'light';
  if (key === 'IN_PREPARATION' || key === 'READY_TO_FILE') return 'primary';
  return 'info';
};

const STATUS_LABELS = {
  IN_PREPARATION: 'In Preparation',
  AWAITING_DOCUMENTS: 'Awaiting Documents',
  AWAITING_CLIENT: 'Awaiting Client',
  AWAITING_APPROVAL: 'Awaiting Approval',
  READY_TO_FILE: 'Ready to File',
  NOT_APPLICABLE: 'Not Applicable',
  NOT_STARTED: 'Not Started',
};

const statusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  return STATUS_LABELS[key] || (key.charAt(0) + key.slice(1).toLowerCase()).replace(/_/g, ' ');
};

const labelFromSlug = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const registrationText = (entity) => {
  const country = entity.company_detail?.country || 'Singapore';
  return getRegistrationFields(entity, country)
    .map(item => item.value)
    .filter(value => value && value !== '-' && value !== 'â€”')
    .join(' ');
};

// ── Due date cell ──
// When an event has an extended_due_date, show the original due date struck
// through above the new effective date below it, e.g.:
//   ~~30/09/2028~~
//   29/11/2028
// Falls back to a plain date when there's no extension.
const DueDateCell = ({ row }) => {
  if (!row.due_date) return <span className="text-muted">-</span>;

  // Spec §7.2: a grace period doesn't change the due date, so this is purely an
  // informational overlay — an event can be OVERDUE and still in_grace_period.
  const graceBadge = row.in_grace_period && (
    <span className="badge bg-warning-subtle text-warning" style={{ fontSize: 9, marginTop: 2, width: 'fit-content' }} title={`Grace period until ${fmtDate(row.grace_end_date)}`}>
      In Grace
    </span>
  );

  if (!row.extended_due_date) {
    return (
      <div className="il-due-date-stack">
        <span>{fmtDate(row.due_date)}</span>
        {graceBadge}
      </div>
    );
  }

  return (
    <div className="il-due-date-stack">
      <span className="il-due-date-original">{fmtDate(row.due_date)}</span>
      <span className="il-due-date-current">{fmtDate(row.extended_due_date)}</span>
      {graceBadge}
    </div>
  );
};

const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill asc', { active: sortKey === col && sortDir === 'asc' })} />
    <i className={classnames('ri-arrow-down-s-fill desc', { active: sortKey === col && sortDir === 'desc' })} />
  </span>
);

const SkeletonRows = ({ cols }) => (
  <>
    {Array.from({ length: 8 }, (_, i) => (
      <tr key={i} className="il-skeleton-row">
        {Array.from({ length: cols }, (__, j) => <td key={j}><div style={{ width: j === 1 ? 180 : 90 }} /></td>)}
      </tr>
    ))}
  </>
);

const ReminderDatesCell = ({ dates = [] }) => {
  if (!dates.length) return <span className="text-muted">-</span>;

  const visible = dates.slice(0, 3);
  const hidden = dates.length - visible.length;

  return (
    <div className="d-flex flex-column gap-1">
      {visible.map((item, index) => (
        <span
          key={`${item.reminder_id}-${item.date}-${item.sequence || index}`}
          className="badge bg-light text-body border"
          title={item.subject}
          style={{ width: 'fit-content', fontWeight: 500 }}
        >
          {fmtDate(item.date)}
          <small className="text-muted ms-1">
            {item.timing_type === 'AFTER' ? 'after' : 'before'}
          </small>
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-muted" style={{ fontSize: 11 }}>+{hidden} more</span>
      )}
    </div>
  );
};

const SideFilterDrawer = ({ open, onClose, filters, eventOptions, setFilter, onApply, onReset, globalMode }) => (
  <>
    <style>{drawerStyles}</style>
    {open && <div className="cf-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('cf-drawer', { open })}>
      <div className="cf-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary" />Advanced Filters</h6>
        <Button color="light" size="sm" className="cf-drawer-close" onClick={onClose}>
          <i className="ri-close-line" />
        </Button>
      </div>

      <div className="cf-drawer-body">
        <div className="cf-section-divider">Event</div>
        <div className="cf-filter-group">
          <label>Event Name</label>
          <Input type="select" bsSize="sm" value={filters.event_slug} onChange={e => setFilter('event_slug', e.target.value)}>
            <option value="">All events</option>
            {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Event Status</label>
          <Input type="select" bsSize="sm" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PREPARATION">In Preparation</option>
            <option value="AWAITING_DOCUMENTS">Awaiting Documents</option>
            <option value="AWAITING_CLIENT">Awaiting Client</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="READY_TO_FILE">Ready to File</option>
            <option value="FILED">Filed</option>
            <option value="COMPLETED">Completed</option>
            <option value="HELD">Held</option>
            <option value="OVERDUE">Overdue</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
            <option value="DRAFT">Draft</option>
          </Input>
        </div>

        {globalMode && (
          <>
            <div className="cf-section-divider">Company</div>
            <div className="cf-filter-group">
              <label>Company Status</label>
              <Input type="select" bsSize="sm" value={filters.company_status} onChange={e => setFilter('company_status', e.target.value)}>
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </Input>
            </div>
          </>
        )}

        <div className="cf-section-divider">Date Range</div>
        <div className="cf-filter-group">
          <label>Due Date</label>
          <div className="d-flex gap-2">
            <DatePickerInput value={filters.due_from} onChange={e => setFilter('due_from', e.target.value)} />
            <DatePickerInput value={filters.due_to} onChange={e => setFilter('due_to', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="cf-drawer-foot">
        <Button size="sm" color="light" onClick={onReset} className="d-flex align-items-center gap-1">
          <i className="ri-refresh-line" /> Reset
        </Button>
        <Button size="sm" color="primary" onClick={() => { onApply(); onClose(); }} className="d-flex align-items-center justify-content-center gap-1 flex-grow-1">
          <i className="ri-search-line" /> Apply Filters
        </Button>
      </div>
    </div>
  </>
);

const EventList = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const globalMode = !companyId;

  const [companies, setCompanies] = useState([]);
  const [reminderMasters, setReminderMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('created_date');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied, setApplied] = useState({ search: '', ...BLANK_SIDE });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // ── Delete confirmation modal state ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── "Why is this due?" calculation-trace modal state ──
  const [traceTarget, setTraceTarget] = useState(null);
  const [traceRows, setTraceRows] = useState([]);
  const [traceLoading, setTraceLoading] = useState(false);

  // ── "Update Status" workflow modal state (spec §10) ──
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusValue, setStatusValue] = useState('');
  const [statusFilingDate, setStatusFilingDate] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  // ── "Documents" checklist modal state (spec §15.1 / §10.1) ──
  const [docsTarget, setDocsTarget] = useState(null);
  const [docItems, setDocItems] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docDrafts, setDocDrafts] = useState({});
  const [docSavingId, setDocSavingId] = useState(null);

  document.title = globalMode ? 'All Events | ASR CSS' : 'Company Events | ASR CSS';

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, reminderRes] = await Promise.all([
        getCompanyList({ page: 1, limit: 1000, order: 'entity_id:DESC' }),
        getReminderList({ page: 1, limit: 1000, category: 'EVENT', status: 'ACTIVE' }),
      ]);
      setCompanies(unwrapList(companyRes));
      setReminderMasters(unwrapList(reminderRes));
    } catch {
      toast.error('Failed to load events');
      setCompanies([]);
      setReminderMasters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Delete (with confirmation modal) ──
  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    const eventId = deleteTarget.company_event_id;
    if (!eventId) return;

    setDeleting(true);
    try {
      await deleteCompanyEvent(eventId);
      toast.success('Event deleted successfully');
      setDeleteTarget(null);
      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  // ── "Why is this due?" (spec §14.2): fetch the calculation-trace history for one event ──
  const openTrace = async (row) => {
    setTraceTarget(row);
    setTraceRows([]);
    setTraceLoading(true);
    try {
      const res = await getCompanyEventCalculationTrace(row.company_event_id);
      const list = res?.data?.data ?? res?.data ?? res;
      setTraceRows(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load calculation trace');
    } finally {
      setTraceLoading(false);
    }
  };

  // ── "Update Status" (spec §10): the <select> only ever offers the event's own
  //    server-computed allowed_status_transitions — the transition graph itself
  //    lives only in the backend and is never duplicated here. ──
  const confirmStatusUpdate = async () => {
    if (!statusTarget || !statusValue) return;
    if (statusValue === 'FILED' && !statusFilingDate) {
      toast.error('Filing date is required');
      return;
    }
    setStatusSaving(true);
    try {
      await updateCompanyEventStatus(statusTarget.company_event_id, {
        status: statusValue,
        filing_date: statusValue === 'FILED' ? statusFilingDate : undefined,
        remarks: statusRemarks || undefined,
      });
      toast.success('Event status updated');
      setStatusTarget(null);
      setStatusValue('');
      setStatusFilingDate('');
      setStatusRemarks('');
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update event status');
    } finally {
      setStatusSaving(false);
    }
  };

  // ── Documents checklist (spec §15.1): list an event's required documents ──
  const openDocuments = async (row) => {
    setDocsTarget(row);
    setDocItems([]);
    setDocDrafts({});
    setDocsLoading(true);
    try {
      const res = await getCompanyEventDocuments(row.company_event_id);
      const list = res?.data?.data ?? res?.data ?? res;
      setDocItems(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load document checklist');
    } finally {
      setDocsLoading(false);
    }
  };

  const setDocDraft = (id, patch) =>
    setDocDrafts(drafts => ({ ...drafts, [id]: { ...drafts[id], ...patch } }));

  // Same upload-then-link two-step pattern as DueDateTracker.js's uploadEvidenceDoc.
  const uploadDocEvidence = async (row, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_id', row.entity_id || '');
    formData.append('entity_type', 'company_event');
    formData.append('module_name', 'compliance_document');
    formData.append('doc_category', 'compliance_document_evidence');
    formData.append('company_event_id', row.company_event_id);
    const res = await uploadDocumentStore(formData);
    const doc = res?.data?.data ?? res?.data ?? res;
    return doc?.doc_id || null;
  };

  const saveDocStatus = async (item) => {
    const draft = docDrafts[item.event_document_id] || {};
    const targetStatus = draft.status || item.status;
    if (!targetStatus || !docsTarget) return;

    setDocSavingId(item.event_document_id);
    let docId = item.doc_id || null;
    if (draft.file) {
      try {
        docId = await uploadDocEvidence(docsTarget, draft.file);
      } catch (err) {
        toast.error(err?.message || 'Failed to upload document');
        setDocSavingId(null);
        return;
      }
    }
    try {
      const res = await updateCompanyEventDocumentStatus(item.event_document_id, {
        status: targetStatus,
        doc_id: docId || undefined,
      });
      const list = res?.data?.data ?? res?.data ?? res;
      setDocItems(Array.isArray(list) ? list : docItems);
      setDocDrafts(drafts => { const next = { ...drafts }; delete next[item.event_document_id]; return next; });
      toast.success('Document status updated');
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update document status');
    } finally {
      setDocSavingId(null);
    }
  };

  const selectedCompany = useMemo(
    () => companies.find(company => String(company.entity_id) === String(companyId)) || null,
    [companies, companyId]
  );

  const eventRows = useMemo(() => {
    const sourceCompanies = companyId ? (selectedCompany ? [selectedCompany] : []) : companies;

    return sourceCompanies.flatMap((company) => {
      const events = Array.isArray(company.events) ? company.events.filter(event => !event.is_deleted) : [];

      return events.map((event) => {
        const eventMaster = event.event || {};
        const attendees = parseJsonArray(event.attendees);
        const receivingParties = parseJsonArray(event.receiving_parties);
        const reminderDates = buildReminderDates(event, company, reminderMasters);

        return {
          ...event,
          entity_id: company.entity_id,
          company_name: company.name || `Company #${company.entity_id}`,
          company_status: company.status || '',
          client_no: company.client_no || '',
          reg_no: registrationText(company),
          incorporation_date: company.company_detail?.company_incorporation_date || '',
          event_name: eventMaster.event_name || labelFromSlug(event.event_slug),
          event_subject: eventMaster.event_subject || '',
          display_status: event.display_status || event.status || '',
          fye_date: event.fye_date || event.period_end || '',
          due_date: event.due_date ||  '',
          extended_due_date: event.extended_due_date || '',
          reminder_dates: reminderDates,
          next_reminder_date: reminderDates[0]?.date || '',
          attendees_count: attendees.length,
          receiving_parties_count: receivingParties.length,
        };
      });
    });
  }, [companies, companyId, reminderMasters, selectedCompany]);

  const eventOptions = useMemo(() => {
    const map = new Map();
    eventRows.forEach((event) => {
      const key = event.event_slug || event.event_name;
      if (key) map.set(key, event.event_name || key);
    });
    return Array.from(map, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [eventRows]);

  const setSideFilter = (key, value) => setSideFilters(filters => ({ ...filters, [key]: value }));
  const applyFilters = () => { setApplied({ search, ...sideFilters }); setPage(1); };
  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search: '', ...BLANK_SIDE });
    setPage(1);
  };
  const removeChip = (key) => {
    if (key === 'search') {
      setSearch('');
      setApplied(filters => ({ ...filters, search: '' }));
    } else {
      setSideFilters(filters => ({ ...filters, [key]: '' }));
      setApplied(filters => ({ ...filters, [key]: '' }));
    }
    setPage(1);
  };

  const filteredRows = useMemo(() => {
    const keyword = applied.search.trim().toLowerCase();
    const from = applied.due_from ? new Date(applied.due_from).getTime() : null;
    const to = applied.due_to ? new Date(applied.due_to).getTime() : null;

    return eventRows.filter((row) => {
      const matchesSearch = !keyword || [
        row.company_name,
        row.client_no,
        row.reg_no,
        row.event_name,
        row.event_slug,
        row.status,
        row.source_basis,
        row.created_date,
      ].some(value => String(value || '').toLowerCase().includes(keyword));

      const rowStatus = String(row.display_status || row.status || '').toUpperCase();
      const matchesStatus = !applied.status || rowStatus === applied.status;
      const matchesEvent = !applied.event_slug || String(row.event_slug || row.event_name) === applied.event_slug;
      const matchesCompanyStatus = !applied.company_status || String(row.company_status || '').toUpperCase() === applied.company_status;
      const dueTime = row.due_date ? new Date(row.due_date).getTime() : null;
      const matchesDueFrom = !from || (dueTime && dueTime >= from);
      const matchesDueTo = !to || (dueTime && dueTime <= to);

      return matchesSearch && matchesStatus && matchesEvent && matchesCompanyStatus && matchesDueFrom && matchesDueTo;
    });
  }, [applied, eventRows]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const left = a[sortKey] ?? '';
      const right = b[sortKey] ?? '';
      if (sortKey.includes('date') || sortKey === 'period_end') {
        const dateOrder = sortDir === 'asc'
          ? new Date(left || 0).getTime() - new Date(right || 0).getTime()
          : new Date(right || 0).getTime() - new Date(left || 0).getTime();
        if (dateOrder !== 0 || sortKey !== 'created_date') return dateOrder;
        return sortDir === 'asc'
          ? Number(a.company_event_id || 0) - Number(b.company_event_id || 0)
          : Number(b.company_event_id || 0) - Number(a.company_event_id || 0);
      }
      if (typeof left === 'number' || typeof right === 'number') {
        return sortDir === 'asc' ? Number(left) - Number(right) : Number(right) - Number(left);
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return sorted;
  }, [filteredRows, sortDir, sortKey]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeChips = Object.entries(applied).filter(([, value]) => value);
  const sideActiveCount = Object.entries(applied).filter(([key, value]) => key !== 'search' && value).length;
  const activeCols = EVENT_COLS.filter(col => globalMode || !col.globalOnly);

  const kpi = useMemo(() => ({
    total: eventRows.length,
    pending: eventRows.filter(row => String(row.display_status || row.status || '').toUpperCase() === 'PENDING').length,
    overdue: eventRows.filter(row => String(row.display_status || row.status || '').toUpperCase() === 'OVERDUE').length,
    completed: eventRows.filter(row => ['COMPLETED', 'FILED', 'HELD'].includes(String(row.display_status || row.status || '').toUpperCase())).length,
  }), [eventRows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const title = globalMode ? 'All Events' : 'Company Events';
  const pageTitle = globalMode ? 'Compliance' : (selectedCompany?.name || 'Compliance');

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={title} pageTitle={pageTitle} />

        <Row className="g-3 mb-3">
          {[
            { key: 'total', label: 'Events', icon: 'ri-calendar-event-line', color: '#405189' },
            { key: 'pending', label: 'Pending', icon: 'ri-time-line', color: '#f0b232' },
            { key: 'overdue', label: 'Overdue', icon: 'ri-alert-line', color: '#f06548' },
            { key: 'completed', label: 'Completed', icon: 'ri-checkbox-circle-line', color: '#0ab39c' },
          ].map(item => (
            <Col key={item.key} xl={3} md={6}>
              <div className="il-kpi" style={{ background: `${item.color}14`, borderColor: `${item.color}14` }}>
                <div className="il-kpi-icon" style={{ background: item.color }}><i className={item.icon} /></div>
                <div>
                  <div className="il-kpi-val">{kpi[item.key]}</div>
                  <div className="il-kpi-lbl">{item.label}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Card>
          {!globalMode && (
            <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div className="fw-semibold">{selectedCompany?.name || `Company #${companyId}`}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {selectedCompany?.client_no ? `Client: ${selectedCompany.client_no}` : 'Company event details'}
                </div>
              </div>
              <div className="ms-auto d-flex align-items-center gap-2">
              <Button size="sm" color="light" className="d-flex align-items-center gap-1" onClick={() => navigate('/compliance/events')}>
                <i className="ri-arrow-left-line" /> Compliance List
              </Button>
              </div>
            </div>
             
          )}

          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: 13, pointerEvents: 'none' }} />
              <Input
                bsSize="sm"
                style={{ paddingLeft: 28 }}
                placeholder={globalMode ? 'Search company, event, UEN/FBRN...' : 'Search event, status, source...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <Button size="sm" color="primary" onClick={applyFilters} className="d-flex align-items-center gap-1">
              <i className="ri-search-line" /> Search
            </Button>

            <Button size="sm" color="light" onClick={() => setDrawerOpen(true)} className="d-flex align-items-center gap-1 ms-1" style={{ position: 'relative' }}>
              <i className="ri-equalizer-line" /> Filters
              {sideActiveCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: '#405189', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {sideActiveCount}
                </span>
              )}
            </Button>

            {activeChips.length > 0 && (
              <Button size="sm" color="link" className="text-danger d-flex align-items-center gap-1" onClick={resetFilters}>
                <i className="ri-refresh-line" /> Reset all
              </Button>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(64,81,137,.1)', color: '#405189', borderRadius: 10, padding: '2px 8px' }}>
                {total} {total === 1 ? 'event' : 'events'}
              </span>
              <Button size="sm" color="warning" className="d-flex align-items-center gap-1" onClick={() => navigate(companyId ? `/compliance/events/company/${companyId}/create` : '/compliance/events-create')}>
                <i className="ri-add-circle-line" /> Add Event
              </Button>
              {globalMode && (
                <Button size="sm" color="light" className="d-flex align-items-center gap-1" onClick={() => navigate('/compliance/events')}>
                  <i className="ri-building-4-line" /> Companies
                </Button>
              )}
            </div>
          </div>

          {activeChips.length > 0 && (
            <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#878a99' }}>Active:</span>
              {activeChips.map(([key, value]) => (
                <span key={key} className="il-chip">
                  <span style={{ color: '#878a99', marginRight: 2 }}>{FILTER_LABELS[key] || key}:</span> {value}
                  <Button color="link" size="sm" className="p-0 border-0" onClick={() => removeChip(key)}>
                    <i className="ri-close-line" />
                  </Button>
                </span>
              ))}
            </div>
          )}

          <div className="il-table-wrap">
            <table className="il-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  {activeCols.map(col => (
                    <th
                      key={col.key}
                      className={classnames({ sortable: col.sortable, 'sort-asc': sortKey === col.key && sortDir === 'asc', 'sort-desc': sortKey === col.key && sortDir === 'desc' })}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                    </th>
                  ))}
                  <th style={{ width: 116 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows cols={activeCols.length + 2} />
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeCols.length + 2}>
                      <div className="il-empty">
                        <div className="il-empty-icon"><i className="ri-calendar-event-line" /></div>
                        <h6>No events found</h6>
                        <p>Try adjusting filters, or <Link to="/settings">review event rules</Link>.</p>
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((row, index) => (
                  <tr
                    key={`${row.entity_id}-${row.company_event_id || index}`}
                    className={classnames('compliance-event-row', {
                      'compliance-event-row-filed': Boolean(row.filing_date),
                      'compliance-event-row-selected': String(selectedRowId) === String(row.company_event_id),
                    })}
                    onClick={() => setSelectedRowId(row.company_event_id)}
                  >
                    <td style={{ textAlign: 'center', color: '#878a99', fontSize: 12 }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    {globalMode && (
                      <td>
                        <div className="fw-semibold">{row.company_name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{row.reg_no || row.client_no || '-'}</div>
                      </td>
                    )}
                    <td>
                      <div className="fw-semibold text-primary">{row.event_name || '-'}</div>
                      {row.event_subject && <div className="text-muted" style={{ fontSize: 11 }}>{row.event_subject}</div>}
                    </td>
                    <td>{fmtDate(row.fye_date)}</td>
                    <td><DueDateCell row={row} /></td>
                    <td>{fmtDate(row.filing_date)}</td>
                    <td><ReminderDatesCell dates={row.reminder_dates} /></td>
                    <td><Badge color={statusColor(row.display_status || row.status)} pill>{statusLabel(row.display_status || row.status) || 'Pending'}</Badge></td>
                    <td><span className="badge bg-light text-body">{row.attendees_count}</span></td>
                    <td><span className="badge bg-light text-body">{row.receiving_parties_count}</span></td>
                    <td><span className="text-muted">{row.source_basis || '-'}</span></td>
                    <td><span className="text-muted">{fmtDate(row.created_date)}</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Button size="sm" color="link" className="p-0 text-body" title="Why is this due?" onClick={() => openTrace(row)}>
                          <i className="ri-question-line fs-16" />
                        </Button>
                        <Button size="sm" color="link" className="p-0 text-body" title="Documents" onClick={() => openDocuments(row)}>
                          <i className="ri-file-list-3-line fs-16" />
                        </Button>
                        <Button
                          size="sm"
                          color="link"
                          className="p-0 text-body"
                          title="Update status"
                          disabled={!row.allowed_status_transitions?.length}
                          onClick={() => {
                            setStatusTarget(row);
                            setStatusValue('');
                            setStatusFilingDate(row.filing_date || '');
                            setStatusRemarks(row.remarks || '');
                          }}
                        >
                          <i className="ri-flow-chart fs-16" />
                        </Button>
                        <Button size="sm" color="link" className="p-0 text-primary" title="Edit event" onClick={() => navigate(`/compliance/events-update/${row.company_event_id}`)}>
                          <i className="ri-pencil-line fs-16" />
                        </Button>
                        <Button
                          size="sm"
                          color="link"
                          className="p-0 text-info"
                          title="Manage due-date extension"
                          onClick={() => navigate(`/compliance/due-date-tracker?company_event_id=${row.company_event_id}&action=extension`)}
                        >
                          <i className="ri-calendar-event-line fs-16" />
                        </Button>
                        <Button
                          size="sm"
                          color="link"
                          className="p-0 text-info"
                          title="Manage waiver, dispensation or exemption"
                          onClick={() => navigate(`/compliance/due-date-tracker?company_event_id=${row.company_event_id}&action=waiver`)}
                        >
                          <i className="ri-shield-check-line fs-16" />
                        </Button>
                        <Button size="sm" color="link" className="p-0 text-danger" title="Delete event" onClick={() => setDeleteTarget(row)}>
                          <i className="ri-delete-bin-line fs-16" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && total > 0 && (
            <div style={{ padding: '8px 18px', borderTop: '1px solid var(--vz-border-color)' }}>
              <Pagination
                total={total}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </div>
          )}
        </Card>
      </Container>

      <SideFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={sideFilters}
        eventOptions={eventOptions}
        setFilter={setSideFilter}
        onApply={applyFilters}
        onReset={() => { resetFilters(); setDrawerOpen(false); }}
        globalMode={globalMode}
      />

      {/* ── Delete confirmation modal ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => !deleting && setDeleteTarget(null)} centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => !deleting && setDeleteTarget(null)} style={{ border: 'none', paddingBottom: 0 }} />
        <ModalBody>
          <div className="il-del-modal">
            <div className="il-del-icon"><i className="ri-delete-bin-5-line" /></div>
            <h5>Delete Event?</h5>
            <p>
              <strong>{deleteTarget?.event_name || 'This event'}</strong>
              {deleteTarget?.company_name && <> for <strong>{deleteTarget.company_name}</strong></>} will be permanently removed.
              <br />This cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border: 'none', justifyContent: 'center', gap: 10 }}>
          <Button color="light" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" size="sm" onClick={handleDeleteEvent} disabled={deleting} className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm" /> Deleting...</> : <><i className="ri-delete-bin-line" /> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Calculation trace: "Why is this due?" (spec §14.2) ── */}
      <Modal isOpen={!!traceTarget} toggle={() => setTraceTarget(null)} centered size="lg" scrollable>
        <ModalHeader toggle={() => setTraceTarget(null)}>
          Why is this due? {traceTarget?.event_name ? `— ${traceTarget.event_name}` : ''}
        </ModalHeader>
        <ModalBody>
          {traceLoading ? (
            <div className="text-center py-4"><Spinner size="sm" /></div>
          ) : traceRows.length === 0 ? (
            <div className="text-muted text-center py-3">No calculation trace recorded for this event yet.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {traceRows.map((trace, index) => (
                <div key={trace.calculation_log_id} className="border rounded p-3">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <Badge color={index === 0 ? 'primary' : 'secondary'} pill>
                      {index === 0 ? 'Latest' : 'Earlier run'}
                    </Badge>
                    {trace.rule && (
                      <span className="badge bg-light text-body border">
                        Rule #{trace.rule.rule_id} · v{trace.rule.version_no} · {trace.rule.version_status}
                      </span>
                    )}
                    <span className="text-muted" style={{ fontSize: 11 }}>{fmtDate(trace.created_date)}</span>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>Trigger Basis</div>
                      <div className="fw-semibold" style={{ fontSize: 12.5 }}>{trace.trigger_date_basis || '-'}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>Base Date</div>
                      <div className="fw-semibold" style={{ fontSize: 12.5 }}>{fmtDate(trace.base_date)}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>Computed Due Date</div>
                      <div className="fw-semibold" style={{ fontSize: 12.5 }}>{fmtDate(trace.computed_due_date)}</div>
                    </div>
                  </div>

                  {Array.isArray(trace.candidate_rules) && trace.candidate_rules.length > 0 && (
                    <div className="mb-2">
                      <div className="text-muted mb-1" style={{ fontSize: 10, textTransform: 'uppercase' }}>Candidate Rules Considered</div>
                      <div className="d-flex flex-wrap gap-1">
                        {trace.candidate_rules.map(candidate => (
                          <span
                            key={candidate.rule_id}
                            className={`badge ${candidate.selected ? 'bg-success' : 'bg-light text-body border'}`}
                            style={{ fontSize: 11 }}
                          >
                            #{candidate.rule_id} (v{candidate.version_no}) · priority {candidate.rule_priority} · specificity {candidate.specificity}
                            {candidate.selected ? ' · selected' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {trace.selected_reason && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      <i className="ri-information-line me-1" />{trace.selected_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="sm" onClick={() => setTraceTarget(null)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* ── Update workflow status (spec §10) ── */}
      <Modal isOpen={!!statusTarget} toggle={() => !statusSaving && setStatusTarget(null)} centered>
        <ModalHeader toggle={() => !statusSaving && setStatusTarget(null)}>
          Update Status {statusTarget?.event_name ? `— ${statusTarget.event_name}` : ''}
        </ModalHeader>
        <ModalBody>
          <div className="mb-2 text-muted" style={{ fontSize: 12 }}>
            Current status: <Badge color={statusColor(statusTarget?.display_status || statusTarget?.status)} pill>
              {statusLabel(statusTarget?.display_status || statusTarget?.status)}
            </Badge>
          </div>
          <Input
            type="select"
            bsSize="sm"
            value={statusValue}
            onChange={e => setStatusValue(e.target.value)}
          >
            <option value="">Select new status</option>
            {(statusTarget?.allowed_status_transitions || []).map(value => (
              <option key={value} value={value}>{statusLabel(value)}</option>
            ))}
          </Input>
          {statusValue === 'FILED' && (
            <div className="mt-3">
              <label className="form-label fs-12">Filing Date <span className="text-danger">*</span></label>
              <DatePickerInput
                value={statusFilingDate}
                onChange={e => setStatusFilingDate(e.target.value)}
                strictDmyInput
              />
            </div>
          )}
          <div className="mt-3">
            <label className="form-label fs-12">Status Remarks</label>
            <Input
              type="textarea"
              rows={3}
              value={statusRemarks}
              onChange={e => setStatusRemarks(e.target.value)}
              placeholder="Optional reason or filing note"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="sm" disabled={statusSaving} onClick={() => setStatusTarget(null)}>Cancel</Button>
          <Button color="primary" size="sm" disabled={statusSaving || !statusValue} onClick={confirmStatusUpdate} className="d-flex align-items-center gap-1">
            {statusSaving && <Spinner size="sm" />} Save
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Document checklist (spec §15.1 / §10.1) ── */}
      <Modal isOpen={!!docsTarget} toggle={() => setDocsTarget(null)} centered size="lg" scrollable>
        <ModalHeader toggle={() => setDocsTarget(null)}>
          Documents {docsTarget?.event_name ? `— ${docsTarget.event_name}` : ''}
        </ModalHeader>
        <ModalBody>
          {docsLoading ? (
            <div className="text-center py-4"><Spinner size="sm" /></div>
          ) : docItems.length === 0 ? (
            <div className="text-muted text-center py-3">No document checklist configured for this event type.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {docItems.map((item) => {
                const draft = docDrafts[item.event_document_id] || {};
                const saving = docSavingId === item.event_document_id;
                return (
                  <div key={item.event_document_id} className="border rounded p-3">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className="fw-semibold" style={{ fontSize: 13 }}>{item.document_name}</span>
                      {item.is_mandatory ? (
                        <Badge color="danger" pill style={{ fontSize: 9 }}>Mandatory</Badge>
                      ) : (
                        <Badge color="secondary" pill style={{ fontSize: 9 }}>Optional</Badge>
                      )}
                      <Badge color={statusColor(item.status)} pill className="ms-auto">{statusLabel(item.status)}</Badge>
                    </div>
                    {item.remarks && <div className="text-muted mb-2" style={{ fontSize: 12 }}>{item.remarks}</div>}
                    <div className="row g-2 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label fs-12 mb-1">Update Status</label>
                        <Input
                          type="select"
                          bsSize="sm"
                          value={draft.status || item.status}
                          onChange={e => setDocDraft(item.event_document_id, { status: e.target.value })}
                        >
                          {['REQUIRED', 'REQUESTED', 'RECEIVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_APPLICABLE'].map(value => (
                            <option key={value} value={value}>{statusLabel(value)}</option>
                          ))}
                        </Input>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fs-12 mb-1">Evidence File (optional)</label>
                        <Input
                          type="file"
                          bsSize="sm"
                          onChange={e => setDocDraft(item.event_document_id, { file: e.target.files?.[0] || null })}
                        />
                      </div>
                      <div className="col-md-2">
                        <Button
                          size="sm"
                          color="primary"
                          className="w-100 d-flex align-items-center justify-content-center gap-1"
                          disabled={saving}
                          onClick={() => saveDocStatus(item)}
                        >
                          {saving && <Spinner size="sm" />} Save
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="sm" onClick={() => setDocsTarget(null)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EventList;
