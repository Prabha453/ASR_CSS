import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { sendDueReminders } from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

const today = () => new Date().toISOString().slice(0, 10);

const statusColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'SENT') return 'success';
  if (key === 'FAILED') return 'danger';
  if (key === 'SKIPPED') return 'secondary';
  return 'warning';
};

const countValue = value => Number(value || 0);
const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try { return parseArray(JSON.parse(value)); } catch { return []; }
  }
  return [];
};

const groupedRecipientResults = (rows) => {
  const groups = {
    success: [],
    invalid: [],
    failed: [],
    skipped: [],
  };
  const seen = {};

  parseArray(rows).forEach((item) => {
    const status = String(item.delivery_status || '').toUpperCase();
    const groupKey =
      status === 'ACCEPTED' ? 'success'
      : status === 'INVALID' ? 'invalid'
      : status === 'FAILED' || status === 'REJECTED' ? 'failed'
      : status === 'SKIPPED' ? 'skipped'
      : '';
    if (!groupKey) return;
    const emailKey = String(item.email || item.name || '').trim().toLowerCase();
    const dedupeKey = `${groupKey}:${emailKey || JSON.stringify(item)}`;
    if (seen[dedupeKey]) return;
    seen[dedupeKey] = true;
    groups[groupKey].push(item);
  });

  return groups;
};

const RecipientResultGroup = ({ title, color, rows, showReason = true }) => {
  if (!rows.length) return null;

  return (
    <div className="mb-1">
      <Badge color={color} pill>{title} {rows.length}</Badge>
      {rows.slice(0, 3).map((item, index) => {
        const email = item.email || item.name || 'Unknown';
        const reason = item.reason || '';
        return (
          <div key={`${title}-${email}-${index}`} className="mt-1">
            <div className="fs-12 text-truncate" title={email}>{email}</div>
            {showReason && reason && <div className="text-muted fs-12 text-truncate" title={reason}>{reason}</div>}
          </div>
        );
      })}
      {rows.length > 3 && <div className="text-muted fs-12">+{rows.length - 3} more</div>}
    </div>
  );
};

const RecipientResultDetails = ({ rows }) => {
  const groups = groupedRecipientResults(rows);
  const total = Object.values(groups).reduce((sum, items) => sum + items.length, 0);
  if (!total) return null;

  return (
    <div style={{ maxWidth: 340 }}>
      <RecipientResultGroup title="Successful" color="success" rows={groups.success} showReason={false} />
      <RecipientResultGroup title="Invalid / Not Sent" color="warning" rows={groups.invalid} />
      <RecipientResultGroup title="Failed / Rejected" color="danger" rows={groups.failed} />
      <RecipientResultGroup title="Skipped" color="secondary" rows={groups.skipped} />
    </div>
  );
};

const cronReason = (item = {}) => {
  if (item.reason || item.error_message) return item.reason || item.error_message;
  if (countValue(item.invalid_count)) return `${countValue(item.invalid_count)} invalid recipient email(s).`;
  if (countValue(item.failed_count)) return `${countValue(item.failed_count)} email(s) failed.`;
  if (countValue(item.skipped_count)) return 'Skipped.';
  return '-';
};

const ReminderCronPage = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const [runDate, setRunDate] = useState(today());
  const [companyId, setCompanyId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  document.title = 'Reminder Cron | ASR CSS';

  const runCron = async () => {
    setLoading(true);
    try {
      const res = await sendDueReminders({
        date: runDate,
        dry_run: dryRun,
        force,
        ...(companyId ? { company_id: companyId } : {}),
      });
      const payload = res?.data?.data ?? res?.data ?? res;
      setResult(payload || null);
      toast.success(dryRun ? 'Cron preview completed' : 'Cron process completed');
    } catch (err) {
      toast.error(err?.message || 'Failed to run reminder cron');
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(result?.items) ? result.items : [];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reminder Cron" pageTitle="Compliance" />

        <Card>
          <div className="d-flex align-items-center gap-2 flex-wrap" style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)' }}>
            <Button size="sm" color="light" onClick={() => navigate(-1)}>
              <i className="ri-arrow-left-line me-1" /> Back
            </Button>
            <Link to="/compliance/events-reminder" className="btn btn-light btn-sm">
              <i className="ri-calendar-todo-line me-1" /> Reminder Dates
            </Link>
            <Link to="/compliance/reminder-logs" className="btn btn-light btn-sm">
              <i className="ri-file-list-3-line me-1" /> Logs
            </Link>
            <Link to="/compliance/reminder-cron" className="btn btn-success btn-sm">
              <i className="ri-play-circle-line me-1" /> Cron
            </Link>
          </div>
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Label className="form-label fs-12">Run Date</Label>
                <DatePickerInput value={runDate} onChange={e => setRunDate(e.target.value)} />
              </Col>
              <Col md={3}>
                <Label className="form-label fs-12">Company ID</Label>
                <Input bsSize="sm" value={companyId} onChange={e => setCompanyId(e.target.value)} placeholder="Optional" />
              </Col>
              <Col md={2}>
                <div className="form-check">
                  <Input type="checkbox" className="form-check-input" id="dryRun" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
                  <Label className="form-check-label fs-12" htmlFor="dryRun">Preview only</Label>
                </div>
              </Col>
              <Col md={2}>
                <div className="form-check">
                  <Input type="checkbox" className="form-check-input" id="forceRun" checked={force} onChange={e => setForce(e.target.checked)} />
                  <Label className="form-check-label fs-12" htmlFor="forceRun">Force resend</Label>
                </div>
              </Col>
              <Col md={2}>
                <Button size="sm" color="success" className="w-100" onClick={runCron} disabled={loading || !runDate}>
                  {loading ? <><Spinner size="sm" className="me-1" /> Running</> : <><i className="ri-play-circle-line me-1" /> Run Cron</>}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {result && (
          <Card>
            <CardBody>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <Badge color="primary" pill>Date: {result.date}</Badge>
                <Badge color="info" pill>Checked: {result.checked || 0}</Badge>
                <Badge color="success" pill>Accepted: {result.sent || 0}</Badge>
                <Badge color="secondary" pill>Skipped: {result.skipped || 0}</Badge>
                <Badge color="danger" pill>Failed: {result.failed || 0}</Badge>
                <Badge color="warning" pill>Invalid: {result.invalid || 0}</Badge>
                {result.dry_run && <Badge color="warning" pill>Dry Run</Badge>}
              </div>

              <div className="il-table-wrap">
                <table className="il-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Status</th>
                      <th>Event ID</th>
                      <th>Reminder ID</th>
                      <th>Scheduled Date</th>
                      <th>Subject</th>
                      <th>Recipients</th>
                      <th>Delivery</th>
                      <th>Error / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={9}><div className="il-empty"><h6>No due reminders for this date</h6></div></td></tr>
                    ) : items.map((item, index) => (
                      <tr key={`${item.company_event_id}-${item.reminder_id}-${index}`}>
                        <td>{index + 1}</td>
                        <td><Badge color={statusColor(item.status)} pill>{item.status || 'PENDING'}</Badge></td>
                        <td>{item.company_event_id || '-'}</td>
                        <td>{item.reminder_id || '-'}</td>
                        <td>{item.scheduled_date || '-'}</td>
                        <td>{item.subject_snapshot || '-'}</td>
                        <td>
                          <Badge color="primary" pill>TO {countValue(item.to_count ?? (item.to_recipients || []).length)}</Badge>{' '}
                          <Badge color="warning" pill>CC {countValue(item.cc_count ?? (item.cc_recipients || []).length)}</Badge>{' '}
                          <Badge color="danger" pill>BCC {countValue(item.bcc_count ?? (item.bcc_recipients || []).length)}</Badge>{' '}
                          <Badge color="secondary" pill>Invalid {countValue(item.invalid_count)}</Badge>
                        </td>
                        <td>
                          <Badge color="success" pill>Accepted {countValue(item.sent_count)}</Badge>{' '}
                          <Badge color="danger" pill>Failed {countValue(item.failed_count)}</Badge>{' '}
                          <Badge color="secondary" pill>Skipped {countValue(item.skipped_count)}</Badge>
                          <div className="mt-2">
                            <RecipientResultDetails rows={item.recipient_results} />
                          </div>
                        </td>
                        <td className={cronReason(item) === '-' ? 'text-muted' : 'text-danger'}>{cronReason(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default ReminderCronPage;
