// steps/Step6PreviewSubmit.jsx
import React from 'react';
import { Row, Col, Button, Spinner, Badge } from 'reactstrap';
import { getEntityId, formatSourceDate } from '../multiEventHelpers';

const Step6PreviewSubmit = ({ formData, errors, eventNames, onSubmit, submitting }) => {
  const selectedEvent = eventNames.find(e => String(e.e_id) === String(formData.event_id));
  const eventDisplayName = selectedEvent?.event_name || 'Event';

  const validEntities = formData.fye_mode === 'manual'
    ? formData.selected_entities
    : formData.selected_entities.filter(e => formData.selected_fye_map[getEntityId(e)]);

  const invalidEntities = formData.fye_mode !== 'manual'
    ? formData.selected_entities.filter(e => !formData.selected_fye_map[getEntityId(e)])
    : [];

  const selectedRoles = Object.entries(formData.receiving_parties || {}).filter(([, ch]) => ch);
  const selectedUsers = Object.entries(formData.user_receiving_parties || {}).filter(([, ch]) => ch);
  const customParties = (formData.custom_receiving_parties || []).filter(p => p.email);

  const calcNextDue = (base, num, unit) => {
    if (!base || !/^\d{2}\/\d{2}\/\d{4}$/.test(base)) return '';
    const parts = base.split('/');
    const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    num = parseInt(num, 10) || 1;
    if (unit === 'years') d.setFullYear(d.getFullYear() + num);
    if (unit === 'months') d.setMonth(d.getMonth() + num);
    if (unit === 'weeks') d.setDate(d.getDate() + num * 7);
    if (unit === 'days') d.setDate(d.getDate() + num);
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' +
      d.getFullYear();
  };

  const canSubmit = !submitting && errors.length === 0 && validEntities.length > 0;

  return (
    <div>
      <style>{`
        .ps-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          background: linear-gradient(135deg, rgba(var(--vz-primary-rgb),.08), rgba(var(--vz-primary-rgb),.02));
          border: 1px solid var(--vz-border-color);
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 18px;
        }
        .ps-hero-stat { display: flex; flex-direction: column; gap: 2px; }
        .ps-hero-stat-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--vz-secondary-color,#878a99); }
        .ps-hero-stat-val { font-size: 16px; font-weight: 700; color: var(--vz-body-color); }
        .ps-hero-stats { display: flex; gap: 26px; flex-wrap: wrap; }

        .ps-card { border: 1px solid var(--vz-border-color); border-radius: 10px; background: var(--vz-white); margin-bottom: 14px; overflow: hidden; }
        .ps-card-head { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: rgba(var(--vz-primary-rgb),.04); border-bottom: 1px solid var(--vz-border-color); }
        .ps-card-head i { color: var(--vz-primary); font-size: 15px; }
        .ps-card-head h5 { margin: 0; font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; color: var(--vz-body-color); }
        .ps-card-body { padding: 12px 14px; }

        .preview-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 5px 0; border-bottom: 1px dashed rgba(0,0,0,.06); font-size: 12.5px; }
        .preview-row:last-child { border-bottom: none; }
        .preview-label { color: var(--vz-secondary-color,#878a99); font-weight: 500; white-space: nowrap; }
        .preview-val { color: var(--vz-body-color); font-weight: 600; text-align: right; }

        .ps-footer { position: sticky; bottom: 0; margin-top: 8px; padding: 12px 14px; background: var(--vz-white); border: 1px solid var(--vz-border-color); border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
      `}</style>

      <div className="ps-hero">
        <div className="ps-hero-stats">
          <div className="ps-hero-stat">
            <span className="ps-hero-stat-label">Entities</span>
            <span className="ps-hero-stat-val">{validEntities.length}</span>
          </div>
          <div className="ps-hero-stat">
            <span className="ps-hero-stat-label">Event</span>
            <span className="ps-hero-stat-val">{eventDisplayName}</span>
          </div>
          <div className="ps-hero-stat">
            <span className="ps-hero-stat-label">Due Date</span>
            <span className="ps-hero-stat-val">{formData.due_date || '-'}</span>
          </div>
        </div>
        <Badge color="warning-subtle" className="text-warning-emphasis fw-medium fs-12 px-3 py-2">
          <i className="ri-time-line me-1"></i> Pending
        </Badge>
      </div>

      {invalidEntities.length > 0 && (
        <div className="alert alert-warning">
          <i className="ri-alert-line me-1"></i>
          <strong>Warning:</strong> The following entities do not have matching FYE records and will be excluded:
          <ul className="mb-0 mt-1">
            {invalidEntities.map(e => <li key={getEntityId(e)}>{e.name}</li>)}
          </ul>
        </div>
      )}

      <Row>
        <Col md={6}>
          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-building-2-line"></i><h5>Selected Entities</h5></div>
            <div className="ps-card-body">
              {validEntities.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {validEntities.map(e => {
                    const eid = getEntityId(e);
                    return (
                      <div key={eid} className="chosen-entity-tag" style={{ display: 'inline-flex' }}>
                        {e.name}
                        {formData.fye_mode !== 'manual' && formData.selected_fye_map[eid] && (
                          <span className="ms-1 entity-fye-valid" style={{ fontSize: 10 }}>
                            <i className="ri-check-circle-fill"></i> FYE: {formatSourceDate(formData.selected_fye_map[eid].actual_fye || formData.selected_fye_map[eid].fye_date)}
                          </span>
                        )}
                        {formData.fye_mode !== 'manual' && formData.auto_due_date_map[eid] && (
                          <span className="ms-1 text-primary" style={{ fontSize: 10 }}>
                            Due: {formData.auto_due_date_map[eid]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-muted fs-12">No valid entities</span>
              )}
            </div>
          </div>

          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-calendar-event-line"></i><h5>Event</h5></div>
            <div className="ps-card-body">
              <div className="preview-row"><span className="preview-label">Event Type</span><span className="preview-val">{eventDisplayName}</span></div>
              <div className="preview-row"><span className="preview-label">Due Date</span><span className="preview-val">{formData.due_date || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Held Date</span><span className="preview-val">{formData.held_date || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Completed Date</span><span className="preview-val">{formData.filing_date || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Start Time</span><span className="preview-val">{formData.held_time || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">End Time</span><span className="preview-val">{formData.held_time_end || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Venue</span><span className="preview-val">{formData.venue || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Agenda</span><span className="preview-val">{formData.meeting_agenda || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Remarks</span><span className="preview-val">{formData.remarks || '-'}</span></div>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-repeat-line"></i><h5>Recurring</h5></div>
            <div className="ps-card-body">
              <div className="preview-row">
                <span className="preview-label">Recurring</span>
                <span className="preview-val">
                  {formData.is_recurring ? (
                    <Badge color="info-subtle" className="text-info-emphasis">Yes</Badge>
                  ) : (
                    <Badge color="secondary-subtle" className="text-secondary-emphasis">No</Badge>
                  )}
                </span>
              </div>
              {formData.is_recurring && (
                <>
                  <div className="preview-row"><span className="preview-label">Every</span><span className="preview-val">{formData.recurring_period_number} {formData.recurring_duration}</span></div>
                  <div className="preview-row"><span className="preview-label">Next Due</span><span className="preview-val">{formData.due_date ? calcNextDue(formData.due_date, formData.recurring_period_number, formData.recurring_duration) : '-'}</span></div>
                </>
              )}
            </div>
          </div>

          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-mail-line"></i><h5>Email</h5></div>
            <div className="ps-card-body">
              <div className="preview-row"><span className="preview-label">Sending Email</span><span className="preview-val">{formData.sender_email || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Reply Email</span><span className="preview-val">{formData.reply_to_email || '-'}</span></div>
              <div className="preview-row"><span className="preview-label">Recipient Mode</span><span className="preview-val">{formData.group_to_recipient || 'SEPARATE'}</span></div>
            </div>
          </div>

          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-user-shared-2-line"></i><h5>Receiving Parties</h5></div>
            <div className="ps-card-body">
              <div className="d-flex flex-wrap gap-1 mb-2">
                {selectedRoles.length === 0 && selectedUsers.length === 0 ? (
                  <span className="text-muted fs-12">None selected</span>
                ) : (
                  selectedRoles.map(([roleName, ch]) => (
                    <span key={roleName} className="chosen-entity-tag" style={{ fontSize: 11 }}>
                      {roleName} <b className="ms-1">{ch}</b>
                    </span>
                  ))
                )}
                {selectedUsers.map(([userId, ch]) => (
                  <span key={`user-${userId}`} className="chosen-entity-tag" style={{ fontSize: 11 }}>
                    User #{userId} <b className="ms-1">{ch}</b>
                  </span>
                ))}
              </div>
              <div className="preview-row">
                <span className="preview-label">External</span>
                <span className="preview-val">
                  {customParties.length > 0
                    ? customParties.map(p => `${p.name || p.email} (${p.channel})`).join(', ')
                    : 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="ps-card">
            <div className="ps-card-head"><i className="ri-file-info-line"></i><h5>Summary</h5></div>
            <div className="ps-card-body">
              <div className="preview-row"><span className="preview-label">Entities</span><span className="preview-val">{validEntities.length} companies</span></div>
              <div className="preview-row"><span className="preview-label">Event</span><span className="preview-val">{eventDisplayName}</span></div>
              <div className="preview-row"><span className="preview-label">Status</span><span className="preview-val">Pending</span></div>
            </div>
          </div>
        </Col>
      </Row>

      {errors.length > 0 && (
        <div className="mt-3 alert alert-danger">
          {errors.map((err, i) => <div key={i}><i className="ri-error-warning-line"></i> {err}</div>)}
        </div>
      )}

      {/* <div className="ps-footer">
        <span className="text-muted fs-12 me-auto">
          {validEntities.length} {validEntities.length === 1 ? 'entity' : 'entities'} will be scheduled for this event.
        </span>
        <Button color="primary" disabled={!canSubmit} onClick={onSubmit}>
          {submitting ? (
            <><Spinner size="sm" className="me-1" /> Submitting…</>
          ) : (
            <><i className="ri-send-plane-fill me-1"></i> Submit</>
          )}
        </Button>
      </div> */}
    </div>
  );
};

export default Step6PreviewSubmit;
