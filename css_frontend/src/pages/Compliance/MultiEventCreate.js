// MultiEventCreate.jsx - Main Component
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner } from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import {
  getCompanyList,
  getCompanyEventNameList,
  getCompanyProfile,
  getCompany,
  createMultipleCompanyEvents,
  getCompanyEventList,
  getUserList,
} from '../../helpers/backend_helper';
import { getLoggedinUser } from '../../helpers/api_helper';

import {
  getEntityId,
  toDateInput,
  unwrapList,
  unwrapOne,
  mapEmailConfigs,
  getDefaultEmailConfig,
  getCustomPartyErrors,
} from './multiEventHelpers';

// ─── Step Components ───
import Step1SelectEntities from './steps/Step1SelectEntities';
import Step2EventDetails from './steps/Step2EventDetails';
import Step3EmailConfig from './steps/Step3EmailConfig';
import Step4ReceivingParties from './steps/Step4ReceivingParties';
import Step5PreviewSubmit from './steps/Step5PreviewSubmit';

/* ─── Step Configuration ─── */
const STEPS = [
  { 
    key: 'entities', 
    label: 'Select Entities', 
    subLabel: 'Choose companies for event generation', 
    icon: 'ri-building-2-line' 
  },
  { 
    key: 'event_details', 
    label: 'Event Details', 
    subLabel: 'Event types, Dates, timing, agenda & recurring', 
    icon: 'ri-calendar-event-line' 
  },
  { 
    key: 'email_config', 
    label: 'Email Configuration', 
    subLabel: 'Sending email & recipient mode', 
    icon: 'ri-mail-settings-line' 
  },
  { 
    key: 'receiving_parties', 
    label: 'Receiving Parties', 
    subLabel: 'TO / CC / BCC per official role', 
    icon: 'ri-user-shared-2-line' 
  },
  { 
    key: 'preview', 
    label: 'Preview & Submit', 
    subLabel: 'Review and generate events', 
    icon: 'ri-file-check-line' 
  },
];

const user = getLoggedinUser();

/* ─── Initial State ─── */
const getInitialState = () => ({
  selected_entities: [],
  event_id: '',
  fye_mode: 'manual',
  fye_months_rule: 6,
  selected_fye_map: {},
  auto_due_date_map: {},
  due_date: '',
  held_date: '',
  filing_date: '',
  sent_date: '',
  received_date: '',
  held_time: '',
  held_time_end: '',
  venue_type: '',
  venue: '',
  meeting_chairman: '',
  meeting_agenda: '',
  remarks: '',
  is_recurring: false,
  recurring_period_number: 1,
  recurring_duration: 'years',
  sender_email: '',
  reply_to_email: '',
  group_to_recipient: 'SEPARATE',
  email_config_id: '',
  receiving_parties: {},
  user_receiving_parties: {},
  custom_receiving_parties: [],
});

/* ─── Main Component ─── */
const MultiEventCreate = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [companies, setCompanies] = useState([]);
  const [eventNames, setEventNames] = useState([]);
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(getInitialState);
  const [stepErrors, setStepErrors] = useState({});

  const [companyDetailsMap, setCompanyDetailsMap] = useState({});
  const [loadingOfficials, setLoadingOfficials] = useState(false);

  // ─── Load Data ───
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [companyRes, eventRes, profileRes, userRes] = await Promise.all([
          getCompanyList({ page: 1, limit: 1000, order: 'name:ASC' }),
          getCompanyEventNameList({ page: 1, limit: 1000, event_type: 'EVENT', is_system_event: 0, order: 'event_name:ASC' }),
          getCompanyProfile(1),
          getUserList({ page: 1, limit: 1000, order: 'first_name:ASC' }),
        ]);

        setCompanies(unwrapList(companyRes) || []);
        setEventNames(unwrapList(eventRes) || []);
        setUsers(unwrapList(userRes) || []);

        const profilePayload = unwrapOne(profileRes);
        const mappedEmailConfigs = mapEmailConfigs(profilePayload.emailConfigs || []);
        setEmailConfigs(mappedEmailConfigs);

        const defaultEmailConfig = getDefaultEmailConfig(mappedEmailConfigs);
        if (defaultEmailConfig) {
          setFormData(prev => ({
            ...prev,
            sender_email: defaultEmailConfig.sender_email || '',
            reply_to_email: defaultEmailConfig.reply_to_email || '',
            group_to_recipient: defaultEmailConfig.group_to_recipient || 'SEPARATE',
            email_config_id: defaultEmailConfig.email_config_id || '',
          }));
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // ─── Fetch Officials ───
  useEffect(() => {
    const entities = formData.selected_entities || [];
    const missingIds = entities
      .map(getEntityId)
      .filter(id => id != null && !companyDetailsMap[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    setLoadingOfficials(true);
    Promise.all(
      missingIds.map(id =>
        getCompany(id).then(res => [id, unwrapOne(res)]).catch(() => [id, null])
      )
    )
      .then(results => {
        if (cancelled) return;
        setCompanyDetailsMap(prev => {
          const next = { ...prev };
          results.forEach(([id, detail]) => { if (detail) next[id] = detail; });
          return next;
        });
      })
      .finally(() => { if (!cancelled) setLoadingOfficials(false); });

    return () => { cancelled = true; };
  }, [formData.selected_entities]);

  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));

  const goTo = (stepId) => setCurrentStep(stepId);
  const next = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(s => Math.min(s + 1, STEPS.length));
    }
  };
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  const validateStep = (stepNum) => {
    const errors = [];
    const stepKey = STEPS[stepNum - 1]?.key;

    if (stepKey === 'entities') {
      if (!formData.selected_entities || formData.selected_entities.length === 0) {
        errors.push('Please select at least one entity.');
      }
    }

    if (stepKey === 'event_details') {
      if (!formData.event_id) {
        errors.push('Please select an Event Type.');
      }
      if (!formData.due_date) {
        errors.push('Due Date is required.');
      }
    }

    if (stepKey === 'email_config') {
      if (!formData.sender_email) {
        errors.push('Default Sending Email is required.');
      }
      if (!formData.reply_to_email) {
        errors.push('Reply Email is required.');
      }
    }

    if (stepKey === 'receiving_parties') {
      const hasAnySelection = Object.values(formData.receiving_parties || {}).some(v => v);
      const hasAnyUserSelection = Object.values(formData.user_receiving_parties || {}).some(v => v);
      const hasCustom = (formData.custom_receiving_parties || []).some(p => p.email);
      if (!hasAnySelection && !hasAnyUserSelection && !hasCustom) {
        errors.push('Please select at least one role or add an external recipient.');
      }
      errors.push(...getCustomPartyErrors(formData.custom_receiving_parties));
    }

    if (stepKey === 'preview') {
      const entities = formData.selected_entities || [];
      const validEntities = formData.fye_mode === 'manual'
        ? entities
        : entities.filter(e => formData.selected_fye_map && formData.selected_fye_map[getEntityId(e)]);

      if (validEntities.length === 0) {
        errors.push(formData.fye_mode === 'manual'
          ? 'Please select at least one entity.'
          : 'No valid entities to create events for.');
      }
    }

    setStepErrors(prev => ({ ...prev, [stepNum]: errors }));
    if (errors.length) {
      errors.forEach(msg => toast.warning(msg, { autoClose: 5000 }));
      return false;
    }
    return true;
  };

  const progressPercent = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);
  const step = STEPS[currentStep - 1];

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    const selectedEvent = eventNames.find(e => String(e.e_id) === String(formData.event_id));
    const eventSlug = selectedEvent?.event_slug || '';

    const entities = formData.selected_entities || [];
    const validEntities = formData.fye_mode === 'manual'
      ? entities
      : entities.filter(e => formData.selected_fye_map && formData.selected_fye_map[getEntityId(e)]);

    if (validEntities.length === 0) {
      toast.warning('No valid entities to create events for.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        entity_ids: validEntities.map(getEntityId).filter(Boolean),
        event_id: Number(formData.event_id),
        event_slug: eventSlug || '',
        fye_mode: formData.fye_mode || 'manual',
        fye_months_rule: formData.fye_months_rule || 6,
        selected_fye_map: formData.selected_fye_map || {},
        auto_due_date_map: formData.auto_due_date_map || {},
        is_recurring: Boolean(formData.is_recurring),
        recurring_period_number: formData.recurring_period_number || 1,
        recurring_duration: formData.recurring_duration || '',
        due_date: toDateInput(formData.due_date),
        held_date: toDateInput(formData.held_date),
        filing_date: toDateInput(formData.filing_date),
        sent_date: toDateInput(formData.sent_date),
        received_date: toDateInput(formData.received_date),
        held_time: formData.held_time || null,
        held_time_end: formData.held_time_end || null,
        venue_type: formData.venue_type || null,
        venue: formData.venue || null,
        meeting_chairman: formData.meeting_chairman || null,
        meeting_agenda: formData.meeting_agenda || null,
        sender_email: formData.sender_email || null,
        reply_to_email: formData.reply_to_email || null,
        group_to_recipient: formData.group_to_recipient || 'SEPARATE',
        email_config_id: formData.email_config_id || null,
        remarks: formData.remarks || null,
        receiving_parties: formData.receiving_parties || {},
        user_receiving_parties: formData.user_receiving_parties || {},
        system_users: users || [],
        custom_receiving_parties: formData.custom_receiving_parties || [],
        attendees: { officials: [], users: [] },
        reminders: [],
        uploaded_files: [],
        created_by: user?.user_id || null,
        updated_by: user?.user_id || null,
      };

      const res = await createMultipleCompanyEvents(payload);
      const result = res?.data?.data || res?.data || {};
      const successCount = Number(result.created_count || 0);
      const failCount = Number(result.failed_count || 0);

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} event${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`);
        navigate('/compliance/events/list');
      } else {
        toast.error('Failed to create any events. Please try again.');
      }
    } catch (err) {
      toast.error('Error during event creation: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  document.title = 'Multiple Event Creation | ASR CSS';

  if (loadingData) {
    return (
      <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Multiple Event Creation" pageTitle="Compliance" />

        <Card className="overflow-hidden p-0">
          <div className="cw-outer">

            {/* ── Left Navigation ── */}
            <div className="cw-nav">
              <div className="cw-nav-header">
                <h5><i className="ri-calendar-event-line me-2"></i>Event Generator</h5>
                <p>Create events for multiple entities</p>
              </div>
              <div className="cw-nav-body">
                {STEPS.map((s, index) => {
                  const stepNum = index + 1;
                  const isDone = currentStep > stepNum;
                  const isActive = currentStep === stepNum;
                  const isPending = currentStep < stepNum;

                  return (
                    <React.Fragment key={s.key}>
                      <div
                        className={classnames('cw-nav-item', { done: isDone, active: isActive, pending: isPending })}
                        onClick={() => goTo(stepNum)}
                      >
                        <div className="cw-nav-circle">
                          {isDone ? <i className="ri-check-line fs-12"></i> : stepNum}
                        </div>
                        <div className="cw-nav-text">
                          <b>{s.label}</b>
                          <small>{s.subLabel}</small>
                        </div>
                        <span className={classnames('cw-nav-status', { done: isDone, active: isActive, pending: isPending })}>
                          {isDone ? <i className="ri-checkbox-circle-fill"></i>
                            : isActive ? <i className="ri-record-circle-line"></i>
                            : <i className="ri-circle-line"></i>}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && <div className={classnames('cw-connector', { done: isDone })} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="cw-nav-footer">
                <div className="d-flex justify-content-between mb-1">
                  <span>Progress</span>
                  <span style={{ color: 'var(--vz-primary)', fontWeight: 600 }}>{progressPercent}%</span>
                </div>
                <div className="cw-progress-bar">
                  <div className="cw-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="cw-content">
              {/* Header */}
              <div className="cw-content-header">
                <div className="cw-content-hicon"><i className={step.icon}></i></div>
                <div>
                  <p className="cw-content-htitle">
                    Step {currentStep}: {step.label}
                  </p>
                  <p className="cw-content-hsub">{step.subLabel}</p>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                  <Link to="/compliance/events/list" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                    <i className="ri-list-unordered"></i> All Events
                  </Link>
                  <span className="cw-step-badge">{currentStep} / {STEPS.length}</span>
                </div>
              </div>

              {/* Body */}
              <div className="cw-content-body">
                {currentStep === 1 && (
                  <Step1SelectEntities
                    formData={formData}
                    updateFormData={updateFormData}
                    companies={companies}
                    errors={stepErrors[currentStep] || []}
                  />
                )}

                {currentStep === 2 && (
                  <Step2EventDetails
                    formData={formData}
                    eventNames={eventNames}
                    getCompanyEvents={getCompanyEventList}
                    updateFormData={updateFormData}
                    errors={stepErrors[currentStep] || []}
                  />
                )}
                {currentStep === 3 && (
                  <Step3EmailConfig
                    formData={formData}
                    updateFormData={updateFormData}
                    emailConfigs={emailConfigs}
                    errors={stepErrors[currentStep] || []}
                  />
                )}
                {currentStep === 4 && (
                  <Step4ReceivingParties
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={stepErrors[currentStep] || []}
                    companyDetailsMap={companyDetailsMap}
                    loadingOfficials={loadingOfficials}
                    users={users}
                  />
                )}
                {currentStep === 5 && (
                  <Step5PreviewSubmit
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={stepErrors[currentStep] || []}
                    eventNames={eventNames}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="cw-content-footer">
                <Button color="light" size="sm" onClick={prev} disabled={currentStep === 1}
                  className="d-flex align-items-center gap-1 px-3">
                  <i className="ri-arrow-left-line"></i> Previous
                </Button>
                <div className="cw-progress-wrap">
                  <span className="cw-progress-text">{currentStep} of {STEPS.length}</span>
                  <div className="cw-progress-bar">
                    <div className="cw-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="cw-progress-text">{progressPercent}%</span>
                </div>
                {currentStep < STEPS.length ? (
                  <Button size="sm" onClick={next}
                    className="d-flex align-items-center gap-1 px-3"
                    style={{ background: 'var(--vz-primary)', borderColor: 'var(--vz-primary)', color: 'var(--vz-white)' }}>
                    Next Step <i className="ri-arrow-right-line"></i>
                  </Button>
                ) : (
                  <Button color="success" size="sm" onClick={handleSubmit} disabled={submitting}
                    className="d-flex align-items-center gap-1 px-3">
                    {submitting
                      ? <><Spinner size="sm" /> Generating…</>
                      : <><i className="ri-rocket-line"></i> Generate Events</>}
                  </Button>
                )}
              </div>
            </div>

          </div>
        </Card>
      </Container>
    </div>
  );
};

export default MultiEventCreate;
