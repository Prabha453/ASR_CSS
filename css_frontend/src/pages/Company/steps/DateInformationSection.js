import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';

import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../components/SectionBlock';
import {
  getCompanyEventDetails,
  syncCompanyEvents,
  validateCompanyActualFye,
} from '../../../helpers/backend_helper';
import { getLoggedinUser } from '../../../helpers/api_helper';

const EVENT_COLUMN_SLUGS = {
  agm: ['agm'],
  ar: ['ar'],
  eci: ['eci'],
  taxReturn: ['tax-return', 'tax-filing'],
};
const STATUTORY_EVENT_SLUGS = new Set(Object.values(EVENT_COLUMN_SLUGS).flat());
const AD_EVENT_SLUGS = new Set(['annual-declaration']);
const DATE_ACTION_EVENT_SLUGS = new Set([...STATUTORY_EVENT_SLUGS, ...AD_EVENT_SLUGS]);

const toDateInput = value => (value ? String(value).slice(0, 10) : '');

const displayDate = value => {
  const clean = toDateInput(value);
  if (!clean) return '-';
  const [y, m, d] = clean.split('-');
  return `${d}/${m}/${y}`;
};

const eventLabel = row => row?.event?.event_name || row?.event_name || row?.event_slug || 'Event';
const eventSlug = row => String(row?.event_slug || row?.event?.event_slug || '').toLowerCase();

const getYear = value => {
  const clean = toDateInput(value);
  return clean ? clean.slice(0, 4) : '';
};

const addMonths = (date, months) => {
  const clean = toDateInput(date);
  if (!clean) return '';
  const next = new Date(`${clean}T00:00:00`);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
};

const groupEventsByFye = rows => {
  const grouped = new Map();
  (rows || []).forEach(row => {
    const key = toDateInput(row.actual_fye || row.fye_date || row.period_end) || 'no-fye';
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        actual_fye: toDateInput(row.actual_fye || row.fye_date || row.period_end),
        fye_date: toDateInput(row.fye_date || row.actual_fye || row.period_end),
        period_start: toDateInput(row.period_start),
        period_end: toDateInput(row.period_end || row.actual_fye || row.fye_date),
        year_of_fye: row.year_of_fye || getYear(row.actual_fye || row.fye_date || row.period_end),
        events: [],
      });
    }
    grouped.get(key).events.push(row);
  });

  return Array.from(grouped.values())
    .sort((a, b) => String(a.actual_fye || '').localeCompare(String(b.actual_fye || '')));
};

const statusClass = status => {
  const key = String(status || '').toUpperCase();
  if (key === 'COMPLETED') return 'success';
  if (key === 'WAIVED' || key === 'DISPENSE' || key === 'EXEMPT') return 'warning';
  if (key === 'CANCELLED') return 'danger';
  return 'secondary';
};

const EventCell = ({ row }) => {
  if (!row) return <span className="cdi-empty-cell">-</span>;
  return (
    <div className="cdi-event-cell">
      <span className="cdi-event-date">{displayDate(row.due_date)}</span>
      <span className={`badge bg-${statusClass(row.status)}-subtle text-${statusClass(row.status)}`}>
        {row.display_status || row.status || 'PENDING'}
      </span>
    </div>
  );
};

const getEventBySlugs = (events = [], slugs = []) => {
  const slugSet = new Set(slugs);
  return events.find(row => slugSet.has(eventSlug(row))) || null;
};

const hasStatutoryEvent = events => (events || []).some(row => STATUTORY_EVENT_SLUGS.has(eventSlug(row)));

const hasAdEvent = events => (events || []).some(row => AD_EVENT_SLUGS.has(eventSlug(row)));

const getPrimaryOtherEvent = events => (events || []).find(row => !DATE_ACTION_EVENT_SLUGS.has(eventSlug(row))) || null;

const shortEventLabel = row => {
  const label = eventLabel(row);
  return label.length > 18 ? 'View Event' : label;
};

const buildEventColumns = rows => {
  const bySlug = new Map();
  (rows || []).forEach(row => {
    const slug = eventSlug(row);
    if (!slug || bySlug.has(slug)) return;
    bySlug.set(slug, { slug, label: eventLabel(row), slugs: [slug] });
  });

  const columns = [];
  const used = new Set();
  [
    { key: 'agm', label: 'AGM Due Date', slugs: EVENT_COLUMN_SLUGS.agm },
    { key: 'ar', label: 'AR Due Date', slugs: EVENT_COLUMN_SLUGS.ar },
    { key: 'eci', label: 'ECI Due Date', slugs: EVENT_COLUMN_SLUGS.eci },
    { key: 'taxReturn', label: 'Tax Return Due Date', slugs: EVENT_COLUMN_SLUGS.taxReturn },
  ].forEach(column => {
    const hasEvent = column.slugs.some(slug => bySlug.has(slug));
    if (!hasEvent) return;
    column.slugs.forEach(slug => used.add(slug));
    columns.push(column);
  });

  bySlug.forEach((column, slug) => {
    if (used.has(slug)) return;
    columns.push(column);
  });

  return columns;
};

const DateField = ({ name, label, value, onChange, required = false, disabled = false }) => (
  <Col md={4}>
    <Label className="form-label fs-12">
      {label} {required && <span className="text-danger">*</span>}
    </Label>
    <DatePickerInput
      name={name}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={`Select ${label.toLowerCase()}`}
    />
  </Col>
);

const isAfterDate = (first, second) => Boolean(first && second && new Date(`${first}T00:00:00`) > new Date(`${second}T00:00:00`));
const isBeforeDate = (first, second) => Boolean(first && second && new Date(`${first}T00:00:00`) < new Date(`${second}T00:00:00`));

const validationMessage = (validation = {}, fallback = '') => {
  const status = String(validation.status || '').toLowerCase();
  const rangeStatus = String(validation.range_status || '').toLowerCase();
  if (rangeStatus === 'out_of_range' || status === 'out_of_range') {
    return validation.message && validation.message !== 'FYE allowed'
      ? validation.message
      : 'Actual FYE is outside the allowed range. AGM must be held within 18 months from incorporation date.';
  }
  if (status === 'no') {
    return validation.message && validation.message !== 'FYE allowed'
      ? validation.message
      : 'Actual FYE is not valid for the selected FY range.';
  }
  if (status === 'confirm') {
    return validation.message && validation.message !== 'FYE allowed'
      ? validation.message
      : 'This FYE already has event records. Confirm before changing.';
  }
  return validation.message || fallback;
};

const DateInformationSection = ({ formData, entityId, updateFormData }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [actionMode, setActionMode] = useState('FYE');
  const [modalData, setModalData] = useState({
    year_of_fye: '',
    actual_fye: '',
    period_start: '',
    period_end: '',
  });

  const detail = formData?.detail || {};
  const user = getLoggedinUser();

  const loadEvents = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await getCompanyEventDetails(entityId);
      const payload = res?.data?.data ?? res?.data ?? [];
      setEvents(Array.isArray(payload) ? payload : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load date information');
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const groups = useMemo(() => groupEventsByFye(events), [events]);
  const eventColumns = useMemo(() => buildEventColumns(events), [events]);
  const currentFye = toDateInput(detail.company_fin_date);
  const incorporationDate = toDateInput(detail.company_incorporation_date);
  const lastAllowedFye = addMonths(incorporationDate, 18);
  const showMissingDateMessage = !incorporationDate && !currentFye;
  const lastFyeGroupKey = useMemo(() => {
    const fyeGroups = groups.filter(group => hasStatutoryEvent(group.events));
    return fyeGroups.length ? fyeGroups[fyeGroups.length - 1].key : '';
  }, [groups]);
  const lastAdGroupKey = useMemo(() => {
    const adGroups = groups.filter(group => hasAdEvent(group.events));
    return adGroups.length ? adGroups[adGroups.length - 1].key : '';
  }, [groups]);

  const openFyeModal = (group, mode = 'FYE') => {
    const fallbackFye = group?.actual_fye || currentFye || '';
    setSelectedGroup(group || null);
    setActionMode(mode);
    setModalData({
      year_of_fye: group?.year_of_fye || getYear(fallbackFye),
      actual_fye: fallbackFye,
      period_start: group?.period_start || incorporationDate || '',
      period_end: group?.period_end || fallbackFye || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (syncing) return;
    setModalOpen(false);
    setSelectedGroup(null);
    setActionMode('FYE');
  };

  const setModalField = event => {
    const { name, value } = event.target;
    setModalData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'actual_fye' ? { year_of_fye: getYear(value), period_end: value } : {}),
    }));
  };

  const handleSync = async () => {
    if (!modalData.actual_fye) {
      toast.error(`Actual ${actionMode} is required`);
      return;
    }
    if (!modalData.year_of_fye) {
      toast.error('Year is required');
      return;
    }
    if (!/^\d{4}$/.test(String(modalData.year_of_fye))) {
      toast.error('Year must be a valid 4 digit year');
      return;
    }
    if (modalData.period_start && modalData.period_end && isAfterDate(modalData.period_start, modalData.period_end)) {
      toast.error('FY Range To must be after FY Range From');
      return;
    }
    if (modalData.period_start && isBeforeDate(modalData.actual_fye, modalData.period_start)) {
      toast.error(`Actual ${actionMode} cannot be before FY Range From`);
      return;
    }

    setSyncing(true);
    try {
      const validationRes = await validateCompanyActualFye(entityId, {
        actual_fye: modalData.actual_fye,
        previous_actual_fye: selectedGroup?.actual_fye || '',
        period_start: modalData.period_start || '',
        period_end: modalData.period_end || '',
        row_id: selectedGroup ? 1 : 0,
      });
      const validation = validationRes?.data?.data ?? validationRes?.data ?? {};

      if (validation.status === 'out_of_range' || validation.range_status === 'out_of_range') {
        toast.error(validationMessage(validation));
        return;
      }
      if (validation.status === 'NO') {
        toast.error(validationMessage(validation, `Actual ${actionMode} is outside the selected FY range`));
        return;
      }

      if (validation.status === 'CONFIRM') {
        const ok = window.confirm(validationMessage(validation, `${actionMode} already has event records. Are you sure you want to change it?`));
        if (!ok) return;
      }

      const syncRes = await syncCompanyEvents(entityId, {
        actual_fye: modalData.actual_fye,
        fye_date: modalData.actual_fye,
        previous_actual_fye: selectedGroup?.actual_fye || '',
        period_start: modalData.period_start || null,
        period_end: modalData.period_end || modalData.actual_fye,
        year_of_fye: modalData.year_of_fye,
        confirm_range: validation.status === 'CONFIRM',
        updated_by: user?.user_id || user?.id || null,
      });

      const updatedDetail = {
        ...(formData.detail || {}),
        company_fin_date: modalData.actual_fye,
      };
      updateFormData?.({ detail: updatedDetail });

      const syncedEvents = syncRes?.data?.data?.events || syncRes?.data?.events || [];
      toast.success(`${syncedEvents.length || 0} event rows synced for Actual ${actionMode}`);
      setModalOpen(false);
      await loadEvents();
    } catch (err) {
      toast.error(err?.message || 'Failed to sync FYE events');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <style>{`
        .cdi-shell { border:1px solid var(--vz-border-color); border-radius:8px; overflow:hidden; background:var(--vz-card-bg,#fff); }
        .cdi-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:var(--vz-light); border-bottom:1px solid var(--vz-border-color); }
        .cdi-title { font-size:13px; font-weight:700; color:var(--vz-body-color); margin-bottom:2px; }
        .cdi-subtitle { color:var(--vz-secondary-color,#878a99); font-size:11px; }
        .cdi-content { padding:12px; }
        .cdi-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:8px; margin-bottom:12px; }
        .cdi-summary-item { border:1px solid var(--vz-border-color); border-radius:7px; padding:9px 10px; background:var(--vz-card-bg,#fff); display:flex; align-items:center; gap:9px; min-height:54px; }
        .cdi-summary-icon { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#405189; background:rgba(64,81,137,.09); flex:0 0 30px; }
        .cdi-summary-item small { display:block; color:var(--vz-secondary-color,#878a99); font-size:10px; font-weight:700; text-transform:uppercase; margin-bottom:2px; line-height:1.1; }
        .cdi-summary-item b { font-size:13px; color:var(--vz-body-color); font-weight:700; }
        .cdi-warning { border:1px solid rgba(247,184,75,.35); background:rgba(247,184,75,.10); color:#8a5a00; border-radius:7px; padding:10px 12px; display:flex; align-items:flex-start; gap:8px; font-size:12px; margin:0; }
        .cdi-table-wrap { overflow:auto; border:1px solid var(--vz-border-color); border-radius:8px; background:var(--vz-card-bg,#fff); }
        .cdi-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; min-width:980px; }
        .cdi-table th { background:var(--vz-light); color:var(--vz-body-color); font-weight:700; padding:9px 10px; border-bottom:1px solid var(--vz-border-color); white-space:nowrap; position:sticky; top:0; z-index:1; }
        .cdi-table td { padding:9px 10px; border-bottom:1px solid var(--vz-border-color); vertical-align:middle; color:var(--vz-body-color); }
        .cdi-table tr:last-child td { border-bottom:0; }
        .cdi-table tr:hover td { background:rgba(64,81,137,.025); }
        .cdi-year-cell { font-weight:700; color:#405189; white-space:nowrap; }
        .cdi-range-cell { color:var(--vz-secondary-color,#878a99); white-space:nowrap; }
        .cdi-event-cell { display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:145px; }
        .cdi-event-date { font-weight:600; white-space:nowrap; }
        .cdi-empty-cell { color:var(--vz-secondary-color,#878a99); font-size:12px; }
        .cdi-action-btn { white-space:nowrap; display:inline-flex; align-items:center; gap:5px; }
        .cdi-empty { border:1px dashed var(--vz-border-color); border-radius:8px; padding:24px; text-align:center; color:var(--vz-secondary-color,#878a99); background:var(--vz-light); }
        .cdi-modal-note { border:1px solid rgba(64,81,137,.18); background:rgba(64,81,137,.06); color:var(--vz-body-color); border-radius:7px; padding:10px 12px; display:flex; gap:8px; align-items:flex-start; font-size:12px; }
      `}</style>

      <SectionBlock title="Date Information">
        <div className="cdi-shell">
          <div className="cdi-toolbar">
            <div>
              <div className="cdi-title">Actual FYE and generated due dates</div>
              <div className="cdi-subtitle">Validate the latest FYE row and review generated compliance events.</div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
              <Link
                to={`/compliance/events/company/${entityId}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-warning btn-sm"
              >
                <i className="ri-external-link-line" /> View Events
              </Link>
            </div>
          </div>

          <div className="cdi-content">
            <div className="cdi-summary">
              <div className="cdi-summary-item">
                <span className="cdi-summary-icon"><i className="ri-building-2-line" /></span>
                <span><small>Incorporation Date</small><b>{displayDate(incorporationDate)}</b></span>
              </div>
              <div className="cdi-summary-item">
                <span className="cdi-summary-icon"><i className="ri-calendar-event-line" /></span>
                <span><small>Company FYE</small><b>{displayDate(currentFye)}</b></span>
              </div>
              <div className="cdi-summary-item">
                <span className="cdi-summary-icon"><i className="ri-timer-line" /></span>
                <span><small>18 Month Limit</small><b>{displayDate(lastAllowedFye)}</b></span>
              </div>
              <div className="cdi-summary-item">
                <span className="cdi-summary-icon"><i className="ri-list-check-3" /></span>
                <span><small>Event Rows</small><b>{events.length}</b></span>
              </div>
            </div>

            {showMissingDateMessage ? (
              <div className="cdi-warning">
                <i className="ri-error-warning-line mt-1" />
                <span>Please update the "Incorporation Date" under "Particulars of Company" in order to enter the FYE and AGM,AR dates</span>
              </div>
            ) : loading ? (
              <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
            ) : groups.length ? (
              <div className="cdi-table-wrap">
                <table className="cdi-table">
                  <thead>
                    <tr>
                      <th>FYE Year / Actual FYE</th>
                      <th>FYE Month</th>
                      <th>FY Range From</th>
                      <th>FY Range To</th>
                      {eventColumns.map(column => <th key={column.key || column.slug}>{column.label}</th>)}
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(group => {
                      const hasFyeAction = hasStatutoryEvent(group.events);
                      const hasAdAction = hasAdEvent(group.events);
                      const canShowFyeAction = hasFyeAction && group.key === lastFyeGroupKey;
                      const canShowAdAction = !hasFyeAction && hasAdAction && group.key === lastAdGroupKey;
                      const otherEvent = getPrimaryOtherEvent(group.events);
                      const fyeMonth = group.actual_fye
                        ? new Date(`${group.actual_fye}T00:00:00`).toLocaleString('en-US', { month: 'long' })
                        : '-';
                      return (
                        <tr key={group.key}>
                          <td className="cdi-year-cell">{group.year_of_fye || getYear(group.actual_fye) || '-'}{group.actual_fye ? ` - ${displayDate(group.actual_fye)}` : ''}</td>
                          <td>{fyeMonth}</td>
                          <td className="cdi-range-cell">{displayDate(group.period_start)}</td>
                          <td className="cdi-range-cell">{displayDate(group.period_end)}</td>
                          {eventColumns.map(column => (
                            <td key={column.key || column.slug}>
                              <EventCell row={getEventBySlugs(group.events, column.slugs)} />
                            </td>
                          ))}
                          <td className="text-end">
                            {canShowFyeAction ? (
                              <Button color="info" outline size="sm" className="cdi-action-btn" onClick={() => openFyeModal(group, 'FYE')}>
                                <i className="ri-calendar-check-line" /> FYE
                              </Button>
                            ) : canShowAdAction ? (
                              <Button color="info" outline size="sm" className="cdi-action-btn" onClick={() => openFyeModal(group, 'AD')}>
                                <i className="ri-calendar-check-line" /> AD
                              </Button>
                            ) : (
                              <span className="cdi-empty-cell">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="cdi-empty">
                <div className="fw-semibold mb-1">No event rows found</div>
                <div className="fs-12 mb-3">Add the first Actual FYE to generate AGM, AR and rule-based due dates.</div>
                <Button color="info" outline size="sm" className="cdi-action-btn" onClick={() => openFyeModal(null)}>
                  <i className="ri-add-line" /> Add FYE
                </Button>
              </div>
            )}
          </div>
        </div>
      </SectionBlock>

      <Modal isOpen={modalOpen} toggle={closeModal} centered size="lg">
        <ModalHeader toggle={closeModal}>
          {selectedGroup ? `Update Actual ${actionMode}` : `Add Actual ${actionMode}`}
        </ModalHeader>
        <ModalBody>
          <div className="cdi-modal-note mb-3">
            <i className="ri-information-line mt-1" />
            <span>This follows the old {actionMode} flow: validate Actual {actionMode}, then sync rule-based company events.</span>
          </div>
          <Row className="g-3">
            <Col md={4}>
              <Label className="form-label fs-12">Year <span className="text-danger">*</span></Label>
              <Input
                bsSize="sm"
                name="year_of_fye"
                value={modalData.year_of_fye || ''}
                onChange={setModalField}
                placeholder="e.g. 2026"
              />
            </Col>
            <DateField name="actual_fye" label={`Actual ${actionMode}`} value={modalData.actual_fye} onChange={setModalField} required />
            <DateField name="period_start" label="FY Range From" value={modalData.period_start} onChange={setModalField} />
            <DateField name="period_end" label="FY Range To" value={modalData.period_end} onChange={setModalField} />
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="sm" onClick={closeModal} disabled={syncing}>Cancel</Button>
          <Button color="success" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <><Spinner size="sm" className="me-1" /> Syncing...</> : <><i className="ri-save-3-line me-1" /> Validate & Sync</>}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DateInformationSection;
