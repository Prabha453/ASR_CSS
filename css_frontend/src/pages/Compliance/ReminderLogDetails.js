import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, Container, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getReminderLogs } from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try { return parseArray(JSON.parse(value)); } catch { return []; }
  }
  return [];
};

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const emailOf = item => typeof item === 'string' ? item : item?.email || item?.name || 'Unknown';
const statusColor = status => ({ ACCEPTED: 'success', SENT: 'success', FAILED: 'danger', REJECTED: 'danger', INVALID: 'warning', SKIPPED: 'secondary' }[String(status || '').toUpperCase()] || 'dark');

const ReminderLogDetails = () => {
  useCollapseSidebar();
  const { logId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [row, setRow] = useState(location.state?.reminderLog || null);
  const [loading, setLoading] = useState(!location.state?.reminderLog);

  document.title = 'Reminder Email Status | ASR CSS';

  useEffect(() => {
    if (row) return;
    const load = async () => {
      try {
        const res = await getReminderLogs({ page: 1, limit: 1000 });
        setRow(unwrapList(res).find(item => String(item.log_id) === String(logId)) || null);
      } catch {
        toast.error('Failed to load reminder log details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [logId, row]);

  const statuses = useMemo(() => {
    if (!row) return [];
    const results = parseArray(row.recipient_results).map(item => ({
      email: emailOf(item),
      type: item.recipient_type || item.type || '-',
      status: item.delivery_status || item.status || 'UNKNOWN',
      reason: item.reason || item.error_message || '-',
    }));
    if (results.length) return results;

    const accepted = parseArray(row.accepted_recipients).map(item => ({ email: emailOf(item), type: '-', status: 'ACCEPTED', reason: '-' }));
    const rejected = parseArray(row.rejected_recipients).map(item => ({ email: emailOf(item), type: '-', status: 'REJECTED', reason: '-' }));
    const invalid = parseArray(row.invalid_recipients).map(item => ({ email: emailOf(item), type: '-', status: 'INVALID', reason: item?.reason || '-' }));
    return [...accepted, ...rejected, ...invalid];
  }, [row]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Email Status" pageTitle="Reminder Logs" />
        <Card>
          <CardBody>
            <Button size="sm" color="light" className="mb-3" onClick={() => navigate(-1)}>
              <i className="ri-arrow-left-line me-1" /> Back
            </Button>
            {loading ? (
              <div className="text-center py-5"><Spinner color="primary" /></div>
            ) : !row ? (
              <div className="il-empty"><h6>Reminder log not found</h6></div>
            ) : (
              <>
                <div className="mb-3">
                  <h5 className="mb-1">{row.reminder_subject || row.subject_snapshot || 'Reminder'}</h5>
                  <div className="text-muted">{row.company_name || '-'} · {row.event_name || '-'}</div>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>#</th><th>Email</th><th>Recipient type</th><th>Status</th><th>Reason</th></tr>
                    </thead>
                    <tbody>
                      {statuses.length ? statuses.map((item, index) => (
                        <tr key={`${item.email}-${item.status}-${index}`}>
                          <td>{index + 1}</td>
                          <td className="text-break">{item.email}</td>
                          <td>{String(item.type).toUpperCase()}</td>
                          <td><Badge color={statusColor(item.status)} pill>{item.status}</Badge></td>
                          <td className="text-break">{item.reason}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="text-center text-muted py-4">No email status details available</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ReminderLogDetails;
