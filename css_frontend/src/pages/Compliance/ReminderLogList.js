import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Container, Input, Modal, ModalBody, ModalHeader, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getReminderLogs } from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try { return parseArray(JSON.parse(value)); } catch { return []; }
  }
  return [];
};

const decodeHtmlEntities = value => String(value || '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const stripHtml = value => decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const recipientLabel = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const label = value.email || value.name || value.official_entity_name || value.display_name || '';
  return value.reason ? `${label || 'Unknown'} - ${value.reason}` : label;
};

const MoreButton = ({ count, onClick }) => count > 0 && (
  <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none fs-12" onClick={onClick}>
    +{count} more
  </button>
);

const RecipientDetails = ({ label, color, rows, onShowAll }) => {
  const list = parseArray(rows).map(recipientLabel).filter(Boolean);
  return (
    <div className="mb-1">
      <Badge color={color} pill>{label} {list.length}</Badge>
      {list.length > 0 && (
        <div className="text-muted mt-1" style={{ fontSize: 11, lineHeight: 1.35 }}>
          {list.slice(0, 4).map((item, index) => <div key={`${label}-${item}-${index}`} className="text-truncate" title={item}>{item}</div>)}
          <MoreButton count={list.length - 4} onClick={() => onShowAll(`${label} recipients`, color, list)} />
        </div>
      )}
    </div>
  );
};

const numberValue = value => Number(value || 0);

const DeliveryBadges = ({ row }) => (
  <div className="d-flex flex-wrap gap-1">
    <Badge color="success" pill>Accepted {numberValue(row.sent_count)}</Badge>
    <Badge color="danger" pill>Failed {numberValue(row.failed_count)}</Badge>
    <Badge color="secondary" pill>Skipped {numberValue(row.skipped_count)}</Badge>
    <Badge color="warning" pill>Invalid {numberValue(row.invalid_count)}</Badge>
  </div>
);

const groupedRecipientResults = (rows) => {
  const groups = {
    success: [],
    invalid: [],
    failed: [],
    skipped: [],
    unknown: [],
  };
  const seen = {};

  parseArray(rows).forEach((item) => {
    const status = String(item.delivery_status || '').toUpperCase();
    const groupKey =
      status === 'ACCEPTED' ? 'success'
      : status === 'INVALID' ? 'invalid'
      : status === 'FAILED' || status === 'REJECTED' ? 'failed'
      : status === 'SKIPPED' ? 'skipped'
      : 'unknown';
    const emailKey = String(item.email || item.name || '').trim().toLowerCase();
    const dedupeKey = `${groupKey}:${emailKey || JSON.stringify(item)}`;
    if (seen[dedupeKey]) return;
    seen[dedupeKey] = true;
    groups[groupKey].push(item);
  });

  return groups;
};

const RecipientResultGroup = ({ title, color, rows, showReason = true, onShowAll }) => {
  if (!rows.length) return null;

  return (
    <div className="mb-2">
      <Badge color={color} pill>{title} {rows.length}</Badge>
      {rows.slice(0, 4).map((item, index) => {
        const email = item.email || item.name || 'Unknown';
        const reason = item.reason || '';
        return (
          <div key={`${title}-${email}-${index}`} className="mt-1">
            <div className="fs-12 text-truncate" title={email}>{email}</div>
            {showReason && reason && <div className="text-muted fs-12 text-truncate" title={reason}>{reason}</div>}
          </div>
        );
      })}
      <MoreButton
        count={rows.length - 4}
        onClick={() => onShowAll(title, color, rows.map(recipientLabel).filter(Boolean))}
      />
    </div>
  );
};

const RecipientResultDetails = ({ rows, onShowAll }) => {
  const groups = groupedRecipientResults(rows);
  const total = Object.values(groups).reduce((sum, items) => sum + items.length, 0);
  if (!total) return null;

  return (
    <div className="mt-2" style={{ maxWidth: 360 }}>
      <div className="text-muted fs-12 fw-semibold mb-1">Email delivery details</div>
      <RecipientResultGroup title="Successful" color="success" rows={groups.success} showReason={false} onShowAll={onShowAll} />
      <RecipientResultGroup title="Invalid / Not Sent" color="warning" rows={groups.invalid} onShowAll={onShowAll} />
      <RecipientResultGroup title="Failed / Rejected" color="danger" rows={groups.failed} onShowAll={onShowAll} />
      <RecipientResultGroup title="Skipped" color="secondary" rows={groups.skipped} onShowAll={onShowAll} />
      <RecipientResultGroup title="Unknown" color="dark" rows={groups.unknown} onShowAll={onShowAll} />
    </div>
  );
};

const userSafeMessage = row => row.user_message || row.summary_message || row.error_message || '';

const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'SENT') return 'success';
  if (key === 'FAILED') return 'danger';
  if (key === 'SKIPPED') return 'secondary';
  return 'warning';
};

const ReminderLogList = () => {
  useCollapseSidebar();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [emailModal, setEmailModal] = useState(null);

  document.title = 'Reminder Logs | ASR CSS';

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReminderLogs({
        page: 1,
        limit: 1000,
        ...(companyId ? { company_id: companyId } : {}),
        ...(status ? { status } : {}),
        ...(from ? { scheduled_from: from } : {}),
        ...(to ? { scheduled_to: to } : {}),
      });
      setRows(unwrapList(res));
    } catch {
      toast.error('Failed to load reminder logs');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, from, status, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter(row => [
      row.company_name,
      row.uen_no,
      row.fbrn_reg_no,
      row.client_no,
      row.event_name,
      row.reminder_subject,
      row.subject_snapshot,
      row.message_snapshot,
      row.error_message,
      row.status,
    ].some(value => String(value || '').toLowerCase().includes(keyword)));
  }, [rows, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setPage(1); }, [search, status, from, to, companyId]);

  const showAllEmails = (title, color, items) => setEmailModal({ title, color, items });

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reminder Logs" pageTitle="Compliance" />

        <Card>
          <div className="d-flex align-items-center gap-2 flex-wrap" style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)' }}>
            <Button size="sm" color="light" onClick={() => navigate(-1)}>
              <i className="ri-arrow-left-line me-1" /> Back
            </Button>
            <Link to="/compliance/events-reminder" className="btn btn-light btn-sm">
              <i className="ri-calendar-todo-line me-1" /> Reminder Dates
            </Link>
            <Link to="/compliance/reminder-cron" className="btn btn-success btn-sm">
              <i className="ri-play-circle-line me-1" /> Cron
            </Link>
            <Input bsSize="sm" style={{ maxWidth: 280 }} placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
            <Input bsSize="sm" type="select" style={{ maxWidth: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="PENDING">Pending</option>
            </Input>
            <DatePickerInput style={{ maxWidth: 155 }} value={from} onChange={e => setFrom(e.target.value)} />
            <DatePickerInput style={{ maxWidth: 155 }} value={to} onChange={e => setTo(e.target.value)} />
            <Button size="sm" color="primary" onClick={fetchLogs} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <i className="ri-refresh-line me-1" />} Refresh
            </Button>
            <span className="ms-auto text-muted fs-12">{total} {total === 1 ? 'log' : 'logs'}</span>
          </div>

          <div className="il-table-wrap">
            <table className="il-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Company</th>
                  <th>Event</th>
                  <th>Reminder</th>
                  <th>Scheduled</th>
                  <th>Recipients</th>
                  <th>Delivery</th>
                  <th>Status / Error</th>
                  <th>Message</th>
                  <th style={{ width: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-4"><Spinner size="sm" color="primary" /></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={10}><div className="il-empty"><h6>No reminder logs found</h6></div></td></tr>
                ) : pageRows.map((row, index) => {
                  const subject = row.reminder_subject || stripHtml(row.subject_snapshot) || '-';
                  const message = stripHtml(row.message_snapshot);
                  return (
                    <tr key={row.log_id || `${row.company_event_id}-${row.reminder_id}-${index}`}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="fw-semibold">{row.company_name || '-'}</div>
                        <div className="text-muted fs-12">{row.uen_no || row.fbrn_reg_no || row.client_no || '-'}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-primary">{row.event_name || '-'}</div>
                        <div className="text-muted fs-12">Due: {fmtDate(row.event_due_date)}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{subject}</div>
                        <div className="text-muted fs-12">Reminder #{row.reminder_id || '-'}</div>
                      </td>
                      <td>
                        <div>{fmtDate(row.scheduled_date)}</div>
                        {row.sent_at && <div className="text-muted fs-12">Sent: {fmtDate(row.sent_at)}</div>}
                      </td>
                      <td>
                        <RecipientDetails label="TO" color="primary" rows={row.to_recipients} onShowAll={showAllEmails} />
                        <RecipientDetails label="CC" color="warning" rows={row.cc_recipients} onShowAll={showAllEmails} />
                        <RecipientDetails label="BCC" color="danger" rows={row.bcc_recipients} onShowAll={showAllEmails} />
                        <RecipientDetails label="Invalid" color="secondary" rows={row.invalid_recipients} onShowAll={showAllEmails} />
                      </td>
                      <td>
                        <DeliveryBadges row={row} />
                        <div className="text-muted fs-12 mt-1">
                          Valid: {numberValue(row.recipient_count)}
                          {' '}| TO {numberValue(row.to_count)}
                          {' '}CC {numberValue(row.cc_count)}
                          {' '}BCC {numberValue(row.bcc_count)}
                        </div>
                        {parseArray(row.accepted_recipients).slice(0, 4).map((email, emailIndex) => (
                          <div key={`accepted-${email}-${emailIndex}`} className="text-success fs-12 mt-1 text-truncate" title={recipientLabel(email)}>
                            {emailIndex === 0 ? 'Accepted: ' : ''}{recipientLabel(email)}
                          </div>
                        ))}
                        <MoreButton count={parseArray(row.accepted_recipients).length - 4} onClick={() => showAllEmails('Accepted', 'success', parseArray(row.accepted_recipients).map(recipientLabel))} />
                        {parseArray(row.rejected_recipients).slice(0, 4).map((email, emailIndex) => (
                          <div key={`rejected-${email}-${emailIndex}`} className="text-danger fs-12 mt-1 text-truncate" title={recipientLabel(email)}>
                            {emailIndex === 0 ? 'Rejected: ' : ''}{recipientLabel(email)}
                          </div>
                        ))}
                        <MoreButton count={parseArray(row.rejected_recipients).length - 4} onClick={() => showAllEmails('Rejected', 'danger', parseArray(row.rejected_recipients).map(recipientLabel))} />
                        <RecipientResultDetails rows={row.recipient_results} onShowAll={showAllEmails} />
                      </td>
                      <td>
                        <Badge color={statusColor(row.status)} pill>{row.status || 'PENDING'}</Badge>
                        {row.status !== 'SENT' && userSafeMessage(row) && (
                          <div className={row.status === 'SENT' ? 'text-success fs-12 mt-1' : 'text-danger fs-12 mt-1'} style={{ maxWidth: 300, whiteSpace: 'normal' }}>
                            {userSafeMessage(row)}
                          </div>
                        )}
                        {row.sender_email && <div className="text-muted fs-12 mt-1">From: {row.sender_email}</div>}
                        {row.reply_to_email && <div className="text-muted fs-12">Reply: {row.reply_to_email}</div>}
                      </td>
                      <td style={{ maxWidth: 320 }}>
                        <div className="text-truncate" title={message}>{message || '-'}</div>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          color="primary"
                          outline
                          title="View all email statuses"
                          onClick={() => navigate(`/compliance/reminder-logs/${row.log_id}`, { state: { reminderLog: row } })}
                          disabled={!row.log_id}
                        >
                          <i className="ri-eye-line me-1" /> View
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
              <Pagination total={total} currentPage={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
            </div>
          )}
        </Card>
        <Modal isOpen={Boolean(emailModal)} toggle={() => setEmailModal(null)} centered scrollable>
          <ModalHeader toggle={() => setEmailModal(null)}>
            {emailModal?.title || 'Email recipients'}
          </ModalHeader>
          <ModalBody>
            <Badge color={emailModal?.color || 'primary'} pill className="mb-3">
              {emailModal?.items?.length || 0} emails
            </Badge>
            {(emailModal?.items || []).map((item, index) => (
              <div key={`${item}-${index}`} className="py-2 border-bottom text-break">{item}</div>
            ))}
          </ModalBody>
        </Modal>
      </Container>
    </div>
  );
};

export default ReminderLogList;
