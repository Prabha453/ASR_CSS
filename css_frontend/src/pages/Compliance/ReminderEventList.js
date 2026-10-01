import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getCompanyList,
  getReminderList,
} from '../../helpers/backend_helper';
import { getRegistrationFields } from '../../helpers/common_helper';
import '../Individual/IndividualList.css';

const CHANNELS = ['TO', 'CC', 'BCC'];

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, index) => ({ value: index + 1, label }));

const TAB_DEFS = [
  { key: 'all', label: 'All', icon: 'ri-list-check-2' },
  { key: 'yesterday', label: 'Yesterday', icon: 'ri-arrow-go-back-line' },
  { key: 'today', label: 'Today', icon: 'ri-calendar-todo-line' },
  { key: 'tomorrow', label: 'Tomorrow', icon: 'ri-arrow-go-forward-line' },
  { key: 'last_month', label: 'Last Month', icon: 'ri-calendar-2-line' },
  { key: 'last_year', label: 'Last Year', icon: 'ri-history-line' },
  { key: 'next_year', label: 'Next Year', icon: 'ri-calendar-event-line' },
  { key: 'custom', label: 'Custom', icon: 'ri-equalizer-line' },
];

const tabStyles = `
  .rl-tabs { border-bottom: 1px solid var(--vz-border-color); padding: 0 18px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; }
  .rl-tabs .nav-item { flex: 0 0 auto; }
  .rl-tabs .nav-link { border: none; border-bottom: 2px solid transparent; color: var(--vz-secondary-color,#878a99); font-size: 12.5px; font-weight: 600; padding: 10px 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap; }
  .rl-tabs .nav-link:hover { color: var(--vz-primary); }
  .rl-tabs .nav-link.active { color: var(--vz-primary); border-bottom-color: var(--vz-primary); background: transparent; }
  .rl-tab-count { font-size: 10px; font-weight: 700; border-radius: 10px; padding: 1px 7px; background: rgba(135,138,153,.14); color: var(--vz-secondary-color,#878a99); }
  .rl-tabs .nav-link.active .rl-tab-count { background: rgba(64,81,137,.14); color: #405189; }
  .rl-custom-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px 18px; border-bottom: 1px solid var(--vz-border-color); background: var(--vz-light); }
  .rl-custom-toggle { display: flex; border: 1px solid var(--vz-border-color); border-radius: 6px; overflow: hidden; flex-shrink: 0; }
  .rl-custom-toggle button { border: none; background: var(--vz-white); font-size: 11px; font-weight: 600; padding: 5px 10px; color: var(--vz-secondary-color,#878a99); cursor: pointer; }
  .rl-custom-toggle button.active { background: var(--vz-primary); color: var(--vz-white); }
  .rl-toolbar { padding: 12px 18px; border-bottom: 1px solid var(--vz-border-color); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rl-search-wrap { position: relative; flex: 1 1 240px; max-width: 390px; }
  .rl-search-wrap i { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--vz-secondary-color,#878a99); font-size: 13px; pointer-events: none; }
  .rl-search-wrap input { padding-left: 28px; }
  .rl-count-pill { font-size: 11px; font-weight: 700; background: rgba(64,81,137,.1); color: #405189; border-radius: 10px; padding: 2px 8px; white-space: nowrap; }
  .rl-company-name { font-weight: 700; color: var(--vz-body-color); line-height: 1.25; max-width: 220px; white-space: normal; }
  .rl-event-name { font-weight: 700; color: #405189; line-height: 1.25; max-width: 210px; white-space: normal; }
  .rl-muted { color: var(--vz-secondary-color,#878a99); font-size: 11px; line-height: 1.3; }
  .rl-action-btn { display: inline-flex; align-items: center; gap: 4px; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 700; line-height: 1.2; }
  .rl-recipient-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; border-radius: 10px; padding: 2px 8px; }
  .rl-recipient-chip.to { background: rgba(64,81,137,.1); color: #405189; }
  .rl-recipient-chip.cc { background: rgba(240,178,50,.14); color: #a8710a; }
  .rl-recipient-chip.bcc { background: rgba(240,101,72,.12); color: #c9432b; }
  .rl-recipient-section { margin-bottom: 12px; }
  .rl-recipient-section:last-child { margin-bottom: 0; }
  .rl-recipient-section h6 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--vz-secondary-color,#878a99); margin-bottom: 6px; }
  .rl-recipient-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; border: 1px solid var(--vz-border-color); border-radius: 6px; margin-bottom: 6px; font-size: 12px; }
  .rl-recipient-row:last-child { margin-bottom: 0; }
  .rl-recipient-name { font-weight: 600; }
  .rl-recipient-meta { color: var(--vz-secondary-color,#878a99); font-size: 11px; }
  .rl-timing-badge { font-size: 9.5px; font-weight: 700; padding: 1px 7px; border-radius: 8px; text-transform: uppercase; }
  .rl-timing-badge.before { background: rgba(64,81,137,.1); color: #405189; }
  .rl-timing-badge.after { background: rgba(10,179,156,.12); color: #0a8f7d; }
  .rl-message-cell { display: flex; align-items: center; gap: 8px; }
  .rl-message-preview { font-size: 12px; color: var(--vz-body-color); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rl-message-preview.empty { color: var(--vz-secondary-color,#878a99); font-style: italic; }
  .rl-message-icon-btn { flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--vz-border-color); background: var(--vz-white); color: var(--vz-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .12s; }
  .rl-message-icon-btn:hover { background: var(--vz-primary); color: var(--vz-white); border-color: var(--vz-primary); }
  .rl-message-icon-btn:disabled { opacity: .4; cursor: not-allowed; }
  .rl-email-meta-bar { display: flex; flex-wrap: wrap; gap: 16px; padding: 10px 12px; border: 1px solid var(--vz-border-color); border-radius: 8px; background: var(--vz-light); margin-bottom: 12px; }
  .rl-email-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .rl-email-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--vz-secondary-color,#878a99); }
  .rl-email-meta-value { font-size: 13px; font-weight: 600; color: var(--vz-body-color); word-break: break-word; }
  .rl-email-frame-wrap { border: 1px solid var(--vz-border-color); border-radius: 8px; overflow: hidden; background: var(--vz-white); }
  .rl-email-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 40px 0; color: var(--vz-secondary-color,#878a99); font-size: 12px; }
  .rl-email-empty i { font-size: 24px; opacity: .5; }
  .rl-attachment-list { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
  .rl-attachment-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--vz-border-color); border-radius: 6px; font-size: 12px; }
  .rl-attachment-row i { color: var(--vz-primary); font-size: 15px; }
  .rl-attachment-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rl-due-date-stack { display: flex; flex-direction: column; gap: 2px; min-width: 92px; }
  .rl-due-date-original { font-size: 11px; color: var(--vz-secondary-color,#878a99); text-decoration: line-through; line-height: 1.2; }
  .rl-due-date-current { font-weight: 600; color: var(--vz-body-color); line-height: 1.2; }
  @media (max-width: 767px) {
    .rl-toolbar .ms-auto { margin-left: 0 !important; width: 100%; justify-content: space-between; }
    .rl-search-wrap { max-width: none; }
    .rl-custom-bar .ms-auto { margin-left: 0 !important; width: 100%; }
  }
`;

// Helpers shared with EventList.jsx

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

const addDaysToDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

// The backend stores subject/message as rich-text HTML (e.g. "<p>...</p>").
// For anywhere we need plain text - table previews, the subject line, sorting,
// search - we strip tags via DOMParser (safe: it only parses, never executes).
const stripHtml = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return String(html).replace(/<[^>]*>/g, '').trim();
  }
};

const truncateText = (text, max = 60) => {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
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
  const dueDate = String(event?.reminder_date_basis) === 'ACTUAL_DUE_DATE'
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

      const rawSubject = reminder.subject || reminder.sender_name || 'Reminder';

      const base = {
        reminder_id: reminder.reminder_id,
        subject: stripHtml(rawSubject),
        message_html: reminder.message || '',
        sender_name: reminder.sender_name || '',
        attachments: Array.isArray(reminder.attachments) ? reminder.attachments : [],
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
    .filter(value => {
      const text = String(value || '').trim();
      return text && text !== '-' && text.charCodeAt(0) !== 0x2014;
    })
    .join(' ');
};

const getPartyDisplayName = (party = {}) =>
  party.official_entity_name || party.name || party.display_name
  || (party.user_id ? `User #${party.user_id}` : 'Unnamed');

const getPartyRole = (party = {}) =>
  party.role || party.party_type || (party.user_id ? 'System User' : (party.official_id ? 'Official' : 'External'));

const groupRecipientsByChannel = (receivingParties) => {
  const rows = parseJsonArray(receivingParties);
  const grouped = { TO: [], CC: [], BCC: [] };
  rows.forEach((row) => {
    const channel = String(row?.channel || '').toUpperCase();
    if (!grouped[channel]) return;
    grouped[channel].push({
      name: getPartyDisplayName(row),
      email: row.email || '',
      role: getPartyRole(row),
    });
  });
  return grouped;
};

const withinRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = startOfDay(new Date(dateStr));
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const relativeStatus = (dateStr) => {
  const today = startOfDay(new Date());
  const d = toDate(dateStr);
  if (!d) return { label: '-', color: 'secondary' };
  const diffDays = Math.round((startOfDay(d) - today) / 86400000);
  if (diffDays < -1) return { label: 'Past', color: 'secondary' };
  if (diffDays === -1) return { label: 'Yesterday', color: 'secondary' };
  if (diffDays === 0) return { label: 'Due Today', color: 'warning' };
  if (diffDays === 1) return { label: 'Tomorrow', color: 'info' };
  return { label: 'Upcoming', color: 'primary' };
};

// ── Due date cell ──
// When an event has an extended_due_date, show the original due date struck
// through above the new effective date below it, e.g.:
//   ~~30/09/2028~~
//   29/11/2028
// Falls back to a plain date when there's no extension.
const DueDateCell = ({ row }) => {
  if (!row.due_date) return <span className="text-muted">-</span>;
  if (!row.extended_due_date) return <span>{fmtDate(row.due_date)}</span>;

  return (
    <div className="rl-due-date-stack">
      <span className="rl-due-date-original">{fmtDate(row.due_date)}</span>
      <span className="rl-due-date-current">{fmtDate(row.extended_due_date)}</span>
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

const RecipientsModal = ({ row, onClose }) => (
  <Modal isOpen={!!row} toggle={onClose} centered size="md">
    <ModalHeader toggle={onClose}>
      Recipients - {row?.reminder_subject || 'Reminder'}
    </ModalHeader>
    <ModalBody>
      <div className="text-muted mb-3" style={{ fontSize: 12 }}>
        {row?.company_name} / {row?.event_name} / Reminder scheduled for <strong>{fmtDate(row?.date)}</strong>
      </div>
      {CHANNELS.map((channel) => {
        const list = row?.recipients?.[channel] || [];
        return (
          <div className="rl-recipient-section" key={channel}>
            <h6>
              <span className={`rl-recipient-chip ${channel.toLowerCase()}`}>{channel}</span>
              <span className="ms-2">{list.length} recipient{list.length === 1 ? '' : 's'}</span>
            </h6>
            {list.length === 0 ? (
              <div className="text-muted" style={{ fontSize: 12 }}>No {channel} recipients configured.</div>
            ) : list.map((person, index) => (
              <div className="rl-recipient-row" key={`${channel}-${index}`}>
                <div>
                  <div className="rl-recipient-name">{person.name}</div>
                  <div className="rl-recipient-meta">{person.email || 'No email'}</div>
                </div>
                <Badge color="light" className="text-body border">{person.role}</Badge>
              </div>
            ))}
          </div>
        );
      })}
    </ModalBody>
    <ModalFooter>
      <Button color="light" size="sm" onClick={onClose}>Close</Button>
    </ModalFooter>
  </Modal>
);

// Email content preview modal
// Subject is shown as plain text (stripped of the rich-text wrapper tags the
// backend stores it with) since a subject line reads as plain text in a real
// inbox. The message body is rendered as real HTML inside a sandboxed iframe
// (via srcDoc) rather than dangerouslySetInnerHTML so that:
//   1. The template's own inline styles/layout don't leak into or clash with
//      the app's CSS.
//   2. Any <script> tag stored in a template can't execute - the empty
//      sandbox attribute blocks script execution entirely.
const EmailPreviewModal = ({ row, onClose }) => {
  const hasHtml = Boolean(row?.message_html);
  const attachments = row?.attachments || [];

  return (
    <Modal isOpen={!!row} toggle={onClose} centered size="lg">
      <ModalHeader toggle={onClose}>
        <i className="ri-mail-open-line me-2 text-primary" />
        Email Preview
      </ModalHeader>
      <ModalBody>
        <div className="text-muted mb-3" style={{ fontSize: 12 }}>
          {row?.company_name} / {row?.event_name}
          {row?.date && <> / Scheduled for <strong>{fmtDate(row.date)}</strong></>}
        </div>

        <div className="rl-email-meta-bar">
          <div className="rl-email-meta-item" style={{ flex: '1 1 100%' }}>
            <span className="rl-email-meta-label">Subject</span>
            <span className="rl-email-meta-value">{row?.subject || row?.reminder_subject || '(No subject)'}</span>
          </div>
          {row?.sender_name && (
            <div className="rl-email-meta-item">
              <span className="rl-email-meta-label">From</span>
              <span className="rl-email-meta-value">{row.sender_name}</span>
            </div>
          )}
        </div>

        {hasHtml ? (
          <div className="rl-email-frame-wrap">
            <iframe
              title="email-preview"
              sandbox=""
              srcDoc={row.message_html}
              style={{ width: '100%', height: 380, border: 'none', display: 'block' }}
            />
          </div>
        ) : (
          <div className="rl-email-empty">
            <i className="ri-file-forbid-line" />
            No email body configured for this reminder.
          </div>
        )}

        {attachments.length > 0 && (
          <div className="rl-attachment-list">
            <span className="rl-email-meta-label">Attachments ({attachments.length})</span>
            {attachments.map((file) => (
              <div className="rl-attachment-row" key={file.doc_id}>
                <i className="ri-attachment-2" />
                <span className="rl-attachment-name" title={file.file_name}>{file.file_name}</span>
                <a
                  href={file.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-sm d-flex align-items-center gap-1"
                >
                  <i className="ri-download-2-line" /> View
                </a>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" size="sm" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

const ReminderEventList = () => {
  useCollapseSidebar();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [reminderMasters, setReminderMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('today');
  const [customMode, setCustomMode] = useState('month'); // 'month' | 'range'
  const now = new Date();
  const [customMonth, setCustomMonth] = useState(now.getMonth() + 1);
  const [customYear, setCustomYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [recipientModalRow, setRecipientModalRow] = useState(null);
  const [emailPreviewRow, setEmailPreviewRow] = useState(null);

  document.title = 'Reminder Events | ASR CSS';

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
      toast.error('Failed to load reminder events');
      setCompanies([]);
      setReminderMasters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Build event rows (same shape/logic as EventList.jsx)
  const eventRows = useMemo(() => companies.flatMap((company) => {
    const events = Array.isArray(company.events) ? company.events.filter(event => !event.is_deleted) : [];

    return events.map((event) => {
      const eventMaster = event.event || {};
      const reminderDates = buildReminderDates(event, company, reminderMasters);

      return {
        ...event,
        entity_id: company.entity_id,
        company_name: company.name || `Company #${company.entity_id}`,
        client_no: company.client_no || '',
        reg_no: registrationText(company),
        event_name: eventMaster.event_name || labelFromSlug(event.event_slug),
        event_subject: eventMaster.event_subject || '',
        due_date: event.due_date || '',
        extended_due_date: event.extended_due_date || '',
        fye_date: event.fye_date || event.period_end || '',
        reminder_dates: reminderDates,
        receiving_parties_raw: event.receiving_parties,
      };
    });
  }), [companies, reminderMasters]);

  // Flatten to one row per scheduled reminder occurrence
  const reminderRows = useMemo(() => eventRows.flatMap((event) => {
    if (!event.reminder_dates.length) return [];
    const recipients = groupRecipientsByChannel(event.receiving_parties_raw);
    const recipientsCount = CHANNELS.reduce((sum, ch) => sum + recipients[ch].length, 0);

    return event.reminder_dates.map((reminder, index) => {
      const messagePreviewText = stripHtml(reminder.message_html);
      return {
        key: `${event.company_event_id}-${reminder.reminder_id}-${reminder.date}-${reminder.sequence || index}`,
        company_event_id: event.company_event_id,
        entity_id: event.entity_id,
        company_name: event.company_name,
        reg_no: event.reg_no,
        client_no: event.client_no,
        event_name: event.event_name,
        event_subject: event.event_subject,
        event_status: event.status,
        due_date: event.due_date,
        extended_due_date: event.extended_due_date,
        fye_date: event.fye_date,
        reminder_id: reminder.reminder_id,
        subject: reminder.subject,
        reminder_subject: reminder.subject,
        sender_name: reminder.sender_name,
        message_html: reminder.message_html,
        message_preview_text: messagePreviewText,
        attachments: reminder.attachments,
        timing_type: reminder.timing_type,
        offset_days: reminder.offset_days,
        is_recurring: reminder.is_recurring,
        date: reminder.date,
        recipients,
        recipients_count: recipientsCount,
      };
    });
  }), [eventRows]);

  // Tab date-range resolution
  const getTabRange = useCallback((tab) => {
    const today = startOfDay(new Date());
    const y = today.getFullYear();
    const m = today.getMonth();

    switch (tab) {
      case 'yesterday': { const d = addDaysToDate(today, -1); return [d, d]; }
      case 'today': return [today, today];
      case 'tomorrow': { const d = addDaysToDate(today, 1); return [d, d]; }
      case 'last_month': return [new Date(y, m - 1, 1), new Date(y, m, 0)];
      case 'last_year': return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)];
      case 'next_year': return [new Date(y + 1, 0, 1), new Date(y + 1, 11, 31)];
      case 'custom': {
        if (customMode === 'month') {
          const yr = Number(customYear) || y;
          const mo = Number(customMonth) - 1;
          return [new Date(yr, mo, 1), new Date(yr, mo + 1, 0)];
        }
        return [customFrom ? startOfDay(new Date(customFrom)) : null, customTo ? startOfDay(new Date(customTo)) : null];
      }
      default: return [null, null]; // 'all'
    }
  }, [customMode, customMonth, customYear, customFrom, customTo]);

  const tabCounts = useMemo(() => {
    const counts = { all: reminderRows.length };
    ['yesterday', 'today', 'tomorrow', 'last_month', 'last_year', 'next_year'].forEach((tab) => {
      const [start, end] = getTabRange(tab);
      counts[tab] = reminderRows.filter(row => withinRange(row.date, start, end)).length;
    });
    return counts;
  }, [reminderRows, getTabRange]);

  const [rangeStart, rangeEnd] = useMemo(() => getTabRange(activeTab), [activeTab, getTabRange]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return reminderRows.filter((row) => {
      const matchesRange = activeTab === 'all' ? true : withinRange(row.date, rangeStart, rangeEnd);
      const matchesSearch = !keyword || [
        row.company_name, row.reg_no, row.client_no, row.event_name, row.reminder_subject, row.message_preview_text,
      ].some(value => String(value || '').toLowerCase().includes(keyword));
      return matchesRange && matchesSearch;
    });
  }, [reminderRows, activeTab, rangeStart, rangeEnd, search]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const left = a[sortKey] ?? '';
      const right = b[sortKey] ?? '';
      if (sortKey === 'date' || sortKey === 'due_date') {
        return sortDir === 'asc'
          ? new Date(left || 0).getTime() - new Date(right || 0).getTime()
          : new Date(right || 0).getTime() - new Date(left || 0).getTime();
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return sorted;
  }, [filteredRows, sortKey, sortDir]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setPage(1); }, [activeTab, search, customMode, customMonth, customYear, customFrom, customTo]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  }, []);

  return (
    <div className="page-content">
      <style>{tabStyles}</style>
      <Container fluid>
        <BreadCrumb title="Reminder Events" pageTitle="Compliance" />

        <Card>
          <Nav tabs className="rl-tabs">
            {TAB_DEFS.map((tab) => (
              <NavItem key={tab.key}>
                <NavLink
                  className={classnames({ active: activeTab === tab.key })}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={tab.icon} />
                  {tab.label}
                  {tab.key !== 'custom' && (
                    <span className="rl-tab-count">{tabCounts[tab.key] ?? 0}</span>
                  )}
                </NavLink>
              </NavItem>
            ))}
          </Nav>

          {activeTab === 'custom' && (
            <div className="rl-custom-bar">
              <div className="rl-custom-toggle">
                <button
                  type="button"
                  className={classnames({ active: customMode === 'month' })}
                  onClick={() => setCustomMode('month')}
                >
                  By Month
                </button>
                <button
                  type="button"
                  className={classnames({ active: customMode === 'range' })}
                  onClick={() => setCustomMode('range')}
                >
                  By Date Range
                </button>
              </div>

              {customMode === 'month' ? (
                <>
                  <Input
                    bsSize="sm"
                    type="select"
                    style={{ maxWidth: 160 }}
                    value={customMonth}
                    onChange={e => setCustomMonth(Number(e.target.value))}
                  >
                    {MONTH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Input>
                  <Input
                    bsSize="sm"
                    type="select"
                    style={{ maxWidth: 110 }}
                    value={customYear}
                    onChange={e => setCustomYear(Number(e.target.value))}
                  >
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </Input>
                </>
              ) : (
                <>
                  <DatePickerInput style={{ maxWidth: 160 }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                  <span className="text-muted" style={{ fontSize: 12 }}>to</span>
                  <DatePickerInput style={{ maxWidth: 160 }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
                </>
              )}

              <span className="ms-auto text-muted" style={{ fontSize: 11 }}>
                {rangeStart ? fmtDate(rangeStart) : '...'} - {rangeEnd ? fmtDate(rangeEnd) : '...'}
              </span>
            </div>
          )}

          <div className="rl-toolbar">
            <Button
              size="sm"
              color="light"
              className="d-flex align-items-center gap-1"
              onClick={() => navigate('/compliance/reminder-logs')}
            >
              <i className="ri-file-list-3-line" />
              Logs
            </Button>
            <Button
              size="sm"
              color="success"
              className="d-flex align-items-center gap-1"
              onClick={() => navigate('/compliance/reminder-cron')}
            >
              <i className="ri-play-circle-line" />
              Cron
            </Button>
            <div className="rl-search-wrap">
              <i className="ri-search-line" />
              <Input
                bsSize="sm"
                placeholder="Search company, event, reminder subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="rl-count-pill">
                {total} {total === 1 ? 'reminder' : 'reminders'}
              </span>
            </div>
          </div>

          <div className="il-table-wrap">
            <table className="il-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th className={classnames({ sortable: true, 'sort-asc': sortKey === 'company_name' && sortDir === 'asc', 'sort-desc': sortKey === 'company_name' && sortDir === 'desc' })} onClick={() => handleSort('company_name')}>
                    Company <SortIcon col="company_name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={classnames({ sortable: true, 'sort-asc': sortKey === 'event_name' && sortDir === 'asc', 'sort-desc': sortKey === 'event_name' && sortDir === 'desc' })} onClick={() => handleSort('event_name')}>
                    Event <SortIcon col="event_name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th>Reminder</th>
                  <th>Message</th>
                  <th className={classnames({ sortable: true, 'sort-asc': sortKey === 'date' && sortDir === 'asc', 'sort-desc': sortKey === 'date' && sortDir === 'desc' })} onClick={() => handleSort('date')}>
                    Reminder Date <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={classnames({ sortable: true, 'sort-asc': sortKey === 'due_date' && sortDir === 'asc', 'sort-desc': sortKey === 'due_date' && sortDir === 'desc' })} onClick={() => handleSort('due_date')}>
                    Due Date <SortIcon col="due_date" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th>Recipients</th>
                  <th>Status</th>
                  <th style={{ width: 96 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows cols={10} />
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="il-empty">
                        <div className="il-empty-icon"><i className="ri-notification-3-line" /></div>
                        <h6>No reminders found</h6>
                        <p>Try a different tab, date range, or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((row, index) => {
                  const status = relativeStatus(row.date);
                  return (
                    <tr key={row.key}>
                      <td style={{ textAlign: 'center', color: 'var(--vz-secondary-color,#878a99)', fontSize: 12 }}>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="rl-company-name">{row.company_name}</div>
                        <div className="rl-muted">{row.reg_no || row.client_no || '-'}</div>
                      </td>
                      <td>
                        <div className="rl-event-name">{row.event_name || '-'}</div>
                        {row.event_subject && <div className="rl-muted">{row.event_subject}</div>}
                      </td>
                      <td>
                        <div>{row.subject}</div>
                        <span className={`rl-timing-badge ${row.timing_type === 'AFTER' ? 'after' : 'before'}`}>
                          {row.offset_days} day{row.offset_days === 1 ? '' : 's'} {row.timing_type === 'AFTER' ? 'after' : 'before'}
                        </span>
                        {row.is_recurring && <Badge color="light" className="text-body border ms-1" style={{ fontSize: 9 }}>Recurring</Badge>}
                      </td>
                      <td>
                        <div className="rl-message-cell">
                          <span className={classnames('rl-message-preview', { empty: !row.message_preview_text })} title={row.message_preview_text}>
                            {truncateText(row.message_preview_text, 50) || 'No message body'}
                          </span>
                          <button
                            type="button"
                            className="rl-message-icon-btn"
                            title="View email"
                            disabled={!row.message_html && !row.subject}
                            onClick={() => setEmailPreviewRow(row)}
                          >
                            <i className="ri-mail-open-line" />
                          </button>
                        </div>
                      </td>
                      <td>{fmtDate(row.date)}</td>
                      <td><DueDateCell row={row} /></td>
                      <td>
                        <Button
                          size="sm"
                          color="light"
                          className="d-flex align-items-center gap-1"
                          onClick={() => setRecipientModalRow(row)}
                          disabled={!row.recipients_count}
                        >
                          <i className="ri-team-line" /> {row.recipients_count}
                        </Button>
                      </td>
                      <td><Badge color={status.color} pill>{status.label}</Badge></td>
                      <td>
                        <Button
                          size="sm"
                          color="primary"
                          outline
                          className="rl-action-btn"
                          title="Edit event"
                          onClick={() => navigate(`/compliance/events-update/${row.company_event_id}`)}
                        >
                          <i className="ri-pencil-line" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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

      <RecipientsModal row={recipientModalRow} onClose={() => setRecipientModalRow(null)} />
      <EmailPreviewModal row={emailPreviewRow} onClose={() => setEmailPreviewRow(null)} />
    </div>
  );
};

export default ReminderEventList;
