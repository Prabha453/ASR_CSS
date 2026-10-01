import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Label, Spinner, Badge } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import {
  getEntityId,
  getYearFromDate,
  addMonthsToDate,
  formatSourceDate,
  parseFlexibleDate,
  formatDMY,
} from '../multiEventHelpers';

const FYE_MODES = [
  { value: 'manual', label: 'Manual Due Date', icon: 'ri-edit-2-line' },
  { value: 'current_year', label: 'Current Year FYE', icon: 'ri-calendar-2-line' },
  { value: 'last_year', label: 'Last Year FYE', icon: 'ri-calendar-check-line' },
];

const FYE_SOURCE_EVENT_SLUGS = new Set([
  'agm',
  'annual-general-meeting',
  'ar',
  'annual-return-filing',
  'annual-filing',
  'anniversary',
  'anniversary-of-registration',
]);

const Step2EventDetails = ({ formData, updateFormData, eventNames, errors, getCompanyEvents }) => {
  // ─── FYE / Event Type state (from former Step2) ───
  const [fyeRecords, setFyeRecords] = useState({});
  const [loadingFye, setLoadingFye] = useState(false);

  // ─── Recurring toggle state (from former Step3) ───
  const [showRecurring, setShowRecurring] = useState(formData.is_recurring || false);

  const selectedEvent = eventNames?.find(e => String(e.e_id) === String(formData.event_id));

  useEffect(() => {
    if (formData.fye_mode !== 'manual' && formData.selected_entities && formData.selected_entities.length > 0) {
      loadFyeRecords();
    }
  }, [formData.fye_mode, formData.selected_entities]);

  useEffect(() => {
    setShowRecurring(formData.is_recurring || false);
  }, [formData.is_recurring]);

  const loadFyeRecords = async () => {
    setLoadingFye(true);
    const records = {};
    const entities = formData.selected_entities || [];
    const promises = entities.map(async (entity) => {
      const entityId = getEntityId(entity);
      try {
        const res = await getCompanyEvents({entity_id : entityId, limit: 100 });
        const events = res?.data?.data || res?.data || [];
        records[entityId] = events.filter(e =>
          FYE_SOURCE_EVENT_SLUGS.has(String(e.event_slug || '').toLowerCase())
        );
      } catch {
        records[entityId] = [];
      }
    });
    await Promise.all(promises);
    setFyeRecords(records);
    applyFyeSelection(formData.fye_mode, records);
    setLoadingFye(false);
  };

  const handleFyeModeChange = (mode) => {
    updateFormData({ fye_mode: mode });
    if (mode !== 'manual') {
      applyFyeSelection(mode, fyeRecords);
    }
  };

  const applyFyeSelection = (mode, records) => {
    const selectedFyeMap = {};
    const autoDueDateMap = {};
    const currentYear = new Date().getFullYear();
    const targetYear = mode === 'current_year' ? currentYear : currentYear - 1;

    const entities = formData.selected_entities || [];
    entities.forEach(entity => {
      const entityId = getEntityId(entity);
      const entityRecords = records[entityId] || [];
      const match = entityRecords.find(r => {
        const fyeYear = getYearFromDate(r.actual_fye || r.fye_date);
        return fyeYear === targetYear;
      });
      if (match) {
        selectedFyeMap[entityId] = match;
        const dueDate = addMonthsToDate(match.actual_fye || match.fye_date, formData.fye_months_rule || 6);
        autoDueDateMap[entityId] = dueDate;
      }
    });

    updateFormData({ selected_fye_map: selectedFyeMap, auto_due_date_map: autoDueDateMap });
  };

  const getRecurringLabel = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    if (!number) return 'No';
    return String(value);
  };

  const hasEntities = formData.selected_entities && formData.selected_entities.length > 0;
  const recurringLabel = selectedEvent ? getRecurringLabel(selectedEvent.recurring_period) : '';
  const matchedCount = hasEntities
    ? formData.selected_entities.filter(entity => formData.selected_fye_map?.[getEntityId(entity)]).length
    : 0;

  // ─── Recurring schedule handlers (from former Step3) ───
  const handleRecurringToggle = (checked) => {
    setShowRecurring(checked);
    updateFormData({ is_recurring: checked });
  };

  const updateRecurringNextDue = () => {
    if (!formData.due_date || !formData.is_recurring) return '';
    const { recurring_period_number, recurring_duration } = formData;
    const d = parseFlexibleDate(formData.due_date);
    if (!d) return '';
    const num = parseInt(recurring_period_number, 10) || 1;
    const newDate = new Date(d);
    if (recurring_duration === 'years') newDate.setFullYear(newDate.getFullYear() + num);
    if (recurring_duration === 'months') newDate.setMonth(newDate.getMonth() + num);
    if (recurring_duration === 'weeks') newDate.setDate(newDate.getDate() + num * 7);
    if (recurring_duration === 'days') newDate.setDate(newDate.getDate() + num);
    return formatDMY(newDate);
  };

  const nextDueDate = updateRecurringNextDue();

  return (
    <div>
      {/* ── Event Type ── */}
      <Row className="g-3 align-items-start">
        <Col md={7}>
          <Label className="form-label fs-12 mb-1">
            Event Type <span className="text-danger">*</span>
          </Label>
          <Input bsSize="sm" type="select" value={formData.event_id || ''}
            onChange={(e) => updateFormData({ event_id: e.target.value })}
            invalid={errors.some(e => e.toLowerCase().includes('event type'))}>
            <option value="">— Select Event Type —</option>
            {eventNames && eventNames.map(event => (
              <option key={event.e_id} value={event.e_id}>
                {event.event_name}
              </option>
            ))}
          </Input>
        </Col>
        <Col md={5} className="d-flex align-items-end">
          {selectedEvent && (
            <div className="d-flex align-items-center gap-2 flex-wrap mt-4">
              <span className="fs-11 text-muted">Recurring:</span>
              {recurringLabel === 'No' ? (
                <Badge color="secondary-subtle" className="text-secondary-emphasis fw-medium">No</Badge>
              ) : recurringLabel ? (
                <Badge color="info-subtle" className="text-info-emphasis fw-medium">
                  Every {recurringLabel} {selectedEvent.recurring_duration || ''}
                </Badge>
              ) : (
                <span className="fs-11 text-muted">—</span>
              )}
            </div>
          )}
        </Col>
      </Row>

      {/* ── FYE Selection ── */}
      <div className="mb-2 py-3">
        <Label className="form-label fs-12 mb-2">Due Date Source</Label>
        <div className="fye-mode-group" role="group" aria-label="FYE selection mode">
          {FYE_MODES.map(mode => (
            <button
              key={mode.value}
              type="button"
              className={`fye-mode-btn ${formData.fye_mode === mode.value ? 'active' : ''}`}
              onClick={() => handleFyeModeChange(mode.value)}
            >
              <i className={mode.icon}></i>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
        <div className="text-muted fs-11 mt-2">
          {formData.fye_mode === 'manual'
            ? 'Enter the due date manually below. Same date applies to all entities.'
            : `Auto-picks each company's ${formData.fye_mode === 'current_year' ? 'current year' : 'last year'} FYE and calculates the due date below.`}
        </div>

        {formData.fye_mode !== 'manual' && hasEntities && (
          <Row className="mt-3 g-3">
            <Col md={4}>
              <Label className="form-label fs-12">FYE + Months Rule</Label>
              <Input bsSize="sm" type="number" min="0" max="24"
                value={formData.fye_months_rule || 6}
                onChange={(e) => updateFormData({ fye_months_rule: parseInt(e.target.value, 10) || 0 })}
                onBlur={() => applyFyeSelection(formData.fye_mode, fyeRecords)} />
              <div className="text-muted fs-11">Default is 6 months. Due date = FYE + N months (end of month).</div>
            </Col>
            <Col md={8}>
              {loadingFye ? (
                <div className="d-flex align-items-center gap-2 text-muted fs-12 mt-4">
                  <Spinner size="sm" />
                  <span>Matching FYE records…</span>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <Label className="form-label fs-12 mb-0">Matched Entities</Label>
                    <Badge color={matchedCount === formData.selected_entities.length ? 'success-subtle' : 'warning-subtle'}
                      className={matchedCount === formData.selected_entities.length ? 'text-success-emphasis' : 'text-warning-emphasis'}>
                      {matchedCount}/{formData.selected_entities.length} matched
                    </Badge>
                  </div>
                  <div className="fye-entity-list">
                    {formData.selected_entities.map(entity => {
                      const entityId = getEntityId(entity);
                      const fye = formData.selected_fye_map && formData.selected_fye_map[entityId];
                      const due = formData.auto_due_date_map && formData.auto_due_date_map[entityId];
                      return (
                        <div key={entityId} className="fye-entity-row">
                          <span className="fye-entity-name">{entity.name}</span>
                          {fye ? (
                            <span className="d-flex align-items-center gap-2">
                              <Badge color="success-subtle" className="text-success-emphasis fw-medium">
                                <i className="ri-checkbox-circle-fill me-1"></i>
                                FYE {formatSourceDate(fye.actual_fye || fye.fye_date)}
                              </Badge>
                              {due && (
                                <Badge color="primary-subtle" className="text-primary-emphasis fw-medium">
                                  Due {due}
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <Badge color="danger-subtle" className="text-danger-emphasis fw-medium">
                              <i className="ri-close-circle-fill me-1"></i> No matching FYE
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Col>
          </Row>
        )}
      </div>

      <hr className="my-1" />

      {/* ── Event Details (dates, times, agenda, remarks) ── */}
      <Row className="g-3 mt-1">
        <Col md={4}>
          <Label className="form-label fs-12">Due Date <span className="text-danger">*</span></Label>
          <DatePickerInput
            value={formData.due_date || ''} onChange={(e) => updateFormData({ due_date: e.target.value })}
            invalid={errors.some(e => e.toLowerCase().includes('due date'))} />
          {formData.fye_mode !== 'manual' && (
            <div className="text-muted fs-11"><i className="ri-information-line"></i> Auto-calculated from FYE selection above</div>
          )}
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Held Date</Label>
          <DatePickerInput
            value={formData.held_date || ''} onChange={(e) => updateFormData({ held_date: e.target.value })} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Filing / Completed Date</Label>
          <DatePickerInput
            value={formData.filing_date || ''} onChange={(e) => updateFormData({ filing_date: e.target.value })} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Notice Date</Label>
          <DatePickerInput
            value={formData.sent_date || ''} onChange={(e) => updateFormData({ sent_date: e.target.value })} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Received Date</Label>
          <DatePickerInput
            value={formData.received_date || ''} onChange={(e) => updateFormData({ received_date: e.target.value })} />
        </Col>

        <Col md={2}>
          <Label className="form-label fs-12">Start Time</Label>
          <Input bsSize="sm" type="time"
            value={formData.held_time || ''} onChange={(e) => updateFormData({ held_time: e.target.value })} />
        </Col>

        <Col md={2}>
          <Label className="form-label fs-12">End Time</Label>
          <Input bsSize="sm" type="time"
            value={formData.held_time_end || ''} onChange={(e) => updateFormData({ held_time_end: e.target.value })} />
        </Col>

        <Col md={6}>
          <Label className="form-label fs-12">Agenda</Label>
          <Input bsSize="sm" type="textarea" rows={3} placeholder="Meeting agenda..."
            value={formData.meeting_agenda || ''} onChange={(e) => updateFormData({ meeting_agenda: e.target.value })} />
        </Col>

        <Col md={6}>
          <Label className="form-label fs-12">Remarks</Label>
          <Input bsSize="sm" type="textarea" rows={3} placeholder="Additional remarks..."
            value={formData.remarks || ''} onChange={(e) => updateFormData({ remarks: e.target.value })} />
        </Col>
      </Row>

      {/* ── Recurring schedule ── */}
      <div className="mt-4 p-3 border rounded" style={{ background: 'var(--vz-light)' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <Input type="checkbox" checked={showRecurring}
            onChange={(e) => handleRecurringToggle(e.target.checked)}
            style={{ width: 16, height: 16 }} />
          <Label className="mb-0" style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Enable Recurring
          </Label>
        </div>

        {showRecurring && (
          <Row className="g-3 mt-1">
            <Col md={3}>
              <Label className="form-label fs-12">Every</Label>
              <Input bsSize="sm" type="number" min="1"
                value={formData.recurring_period_number || 1}
                onChange={(e) => updateFormData({ recurring_period_number: parseInt(e.target.value, 10) || 1 })} />
            </Col>
            <Col md={3}>
              <Label className="form-label fs-12">Duration</Label>
              <Input bsSize="sm" type="select" value={formData.recurring_duration || 'years'}
                onChange={(e) => updateFormData({ recurring_duration: e.target.value })}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </Input>
            </Col>
            <Col md={6}>
              <Label className="form-label fs-12">Next Due Date</Label>
              <Input bsSize="sm" type="text" readOnly
                value={nextDueDate || 'Enter due date first'}
                style={{ background: 'var(--vz-gray-100)' }} />
              <div className="text-muted fs-11">Calculated based on current due date + recurring period</div>
            </Col>
          </Row>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="mt-3 alert alert-danger py-2">
          {errors.map((err, i) => (
            <div key={i} className="fs-12"><i className="ri-error-warning-line me-1"></i>{err}</div>
          ))}
        </div>
      )}

      <style>{`
        .fye-mode-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fye-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          border: 1px solid var(--vz-border-color);
          background: var(--vz-white);
          color: var(--vz-gray-700);
          cursor: pointer;
          transition: all .15s ease;
        }
        .fye-mode-btn i {
          font-size: 14px;
        }
        .fye-mode-btn:hover {
          border-color: rgba(var(--vz-primary-rgb),.5);
          background: var(--vz-primary-bg-subtle);
        }
        .fye-mode-btn.active {
          border-color: var(--vz-primary);
          background: var(--vz-primary);
          color: var(--vz-white);
        }
        .fye-entity-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
        }
        .fye-entity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 6px 10px;
          border: 1px solid var(--vz-gray-200);
          border-radius: 6px;
          background: var(--vz-gray-100);
          font-size: 12px;
        }
        .fye-entity-name {
          font-weight: 500;
          color: var(--vz-gray-800);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 40%;
        }
        .fs-11 {
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};

export default Step2EventDetails;
