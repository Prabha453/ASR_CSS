import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Input, Spinner } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../../Company/components/SectionBlock';
import CheckboxCard from '../../Company/components/CheckboxCard';
import FormField from '../components/FormField';
import ChangeHistoryModal from '../components/ChangeHistoryModal';
import { getSalutationList, getRaceList, checkIndividualName } from '../../../helpers/backend_helper';
import { extractApiList, toggleItem } from '../individualUtils';

const RISK_RATINGS     = ['Low', 'Medium', 'High', 'Very High'];
const GENDER_OPTIONS   = ['Male', 'Female'];
const STATUS_OPTIONS   = ['Active', 'Inactive', 'Prospect', 'Deceased'];
const CATEGORY_OPTIONS = [
  'Director', 'Shareholder', 'Secretary', 'Beneficiary',
  'Guarantor', 'Signatory', 'Contact Person',
];

const TRACKED_FIELDS = {
  name:        { label: 'Individual Name', fieldTypeId: 7  },
  nationality: { label: 'Nationality',     fieldTypeId: 10 },
};

const Step1Individual = ({
  formData,
  updateFormData,
  countries     = [],
  errors        = [],
  isEditMode    = false,
  entityId      = null,
  onFetchHistory,
  onSaveChange,
  registerValidationError,
}) => {
  const [info, setInfo]               = useState(formData.individualInfo || {});
  const [categories, setCategories]   = useState(formData.categories     || []);
  const [rel, setRel]                 = useState(formData.relationship   || {});
  const [salutations, setSalutations] = useState([]);
  const [races, setRaces]             = useState([]);

  /* duplicate name warning */
  const [nameWarning, setNameWarning] = useState('');
  const [nameChecking, setChecking]   = useState(false);
  const nameTimerRef                  = useRef();

  /* modal state */
  const [modal, setModal] = useState({
    open: false, mode: 'change', field: null,
    historyRows: [], historyLoading: false,
  });

  useEffect(() => {
    Promise.all([
      getSalutationList({ page: 1, limit: 100 }),
      getRaceList({ page: 1, limit: 100 }),
    ]).then(([s, r]) => {
      setSalutations(extractApiList(s));
      setRaces(extractApiList(r));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setInfo(formData.individualInfo || {});
    setCategories(formData.categories  || []);
    setRel(formData.relationship       || {});
  }, [formData.individualInfo, formData.categories, formData.relationship]);

  /* ── helpers ── */
  const updateInfo = (field, value) => {
    const updated = { ...info, [field]: value };
    setInfo(updated);
    updateFormData({ individualInfo: updated });
  };

  const updateRel = (field, value) => {
    const updated = { ...rel, [field]: value };
    setRel(updated);
    updateFormData({ relationship: updated });
  };

  const toggleCategory = (item) => {
    const updated = toggleItem(categories, item);
    setCategories(updated);
    updateFormData({ categories: updated });
  };

  /* ── duplicate name check (debounced 600 ms) ── */
  const checkName = useCallback((name) => {
  clearTimeout(nameTimerRef.current);
  if (!name?.trim()) {
    setNameWarning('');
    registerValidationError?.('name_check', '');
    return;
  }
  nameTimerRef.current = setTimeout(async () => {
    setChecking(true);
    try {
      const res = await checkIndividualName({ name: name.trim(), entity_id: entityId });
      const msg = res?.data?.exists ? 'An individual with this name already exists.' : '';
      setNameWarning(msg);
      registerValidationError?.('name_check', msg);
    } catch {
      setNameWarning('');
      registerValidationError?.('name_check', '');
    } finally {
      setChecking(false);
    }
  }, 600);
}, [entityId, registerValidationError]);

  /* ── modal helpers ── */
  const openChange = (field) =>
    setModal({ open: true, mode: 'change', variant: field === 'name' ? 'simple' : 'nationality' , field, historyRows: [],  historyLoading: false });

  const openHistory = async (field) => {
    setModal({ open: true, mode: 'history', variant: field === 'name' ? 'simple' : 'nationality', field, historyRows: [], historyLoading: true });
    try {
      const rows = await onFetchHistory?.(field, TRACKED_FIELDS[field].fieldTypeId);
      setModal(m => ({ ...m, historyRows: rows || [], historyLoading: false }));
    } catch {
      setModal(m => ({ ...m, historyRows: [], historyLoading: false }));
    }
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const handleSaveChange = async ({ newValue, effectiveDate, isProposed }) => {
    const field = modal.field;
    updateInfo(field, newValue);
    await onSaveChange?.({
      field,
      fieldTypeId: TRACKED_FIELDS[field].fieldTypeId,
      oldValue: info[field] || '',
      newValue,
      effectiveDate,
      isProposed,
    });
  };

  const isDeceased = info.status === 'Deceased';

  /* nationality list derived from countries */
  const nationalityOptions = countries
    .filter(c => c.nationality)
    .map(c => c.nationality);

  return (
    <>
      <ChangeHistoryModal
        isOpen={modal.open}
        mode={modal.mode}
        fieldLabel={modal.field ? TRACKED_FIELDS[modal.field]?.label : ''}
        oldValue={modal.field ? (info[modal.field] || '') : ''}
        onClose={closeModal}
        onSave={handleSaveChange}
        variant = {modal.variant}
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
        isNationality={modal.field === 'nationality'}
        nationalityOptions={nationalityOptions}
      />

      {/* ═══════════════════════════ INDIVIDUAL DETAILS ═══════════════════════════ */}
      <SectionBlock title="Individual Details">
        <Row className="g-3">

          {/* Salutation */}
          <FormField label="Salutation" md={2}>
            <Input type="select" bsSize="sm"
              value={info.salutationId ?? ''}
              onChange={e => updateInfo('salutationId', parseInt(e.target.value, 10) || null)}>
              <option value="">—</option>
              {salutations.map(s => (
                <option key={s.salutation_id} value={s.salutation_id}>{s.salutation_name}</option>
              ))}
            </Input>
          </FormField>

          {/* ── Individual Name ── */}
          <FormField label="Individual Name"
              required
              isEditMode={isEditMode}
              onChange={() => openChange('name')}
              onHistory={() => openHistory('name')}
              md={5}>

            <div style={{ position: 'relative' }}>
              <Input bsSize="sm" placeholder="Full legal name"
                value={info.name || ''}
                onChange={e => { updateInfo('name', e.target.value); checkName(e.target.value); }}
                invalid={errors.some(e => e.toLowerCase().includes('individual name')) && !info.name?.trim()} />
              {nameChecking && (
                <Spinner size="sm" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </div>
            {nameWarning && (
              <div style={{ fontSize: 11, color: '#f77e53', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ri-alert-line"></i>{nameWarning}
              </div>
            )}
            {errors.some(e => e.toLowerCase().includes('individual name')) && !info.name?.trim() && (
              <div style={{ fontSize: 11, color: '#f06548', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ri-error-warning-line"></i> Individual Name is required.
              </div>
            )}

          </FormField>

          {/* ── Former Name (read-only in edit mode — changed via Name Change) ── */}
          <FormField label="Former Name" md={5}>
            <Input bsSize="sm"
              placeholder="Previous / maiden name (if any)"
              value={info.formerName || ''}
              readOnly={isEditMode}
              onChange={e => updateInfo('formerName', e.target.value)}
              style={isEditMode ? { background: 'var(--vz-light)', color: 'var(--vz-sidebar-sub-item-color)' } : {}} />
            {isEditMode && (
              <small style={{ fontSize: 10, color: 'var(--vz-sidebar-sub-item-color)' }}>
                Updated automatically when Individual Name is changed.
              </small>
            )}
          </FormField>

          {/* Alias */}
          <FormField label="Alias" md={4}>
            <Input bsSize="sm" placeholder="Known alias or nickname"
              value={info.alias || ''}
              onChange={e => updateInfo('alias', e.target.value)} />
          </FormField>

          {/* Gender */}
          <FormField label="Gender" md={4}>
            <Input type="select" bsSize="sm"
              value={info.gender || ''}
              onChange={e => updateInfo('gender', e.target.value)}>
              <option value="">Select gender…</option>
              {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
            </Input>
          </FormField>

          {/* Date of Birth */}
          <FormField label="Date of Birth" md={4}>
            <DatePickerInput
              value={info.dob || ''}
              onChange={e => updateInfo('dob', e.target.value)} />
          </FormField>

          {/* Country of Birth */}
          <FormField label="Country of Birth" md={4}>
            <Input type="select" bsSize="sm"
              value={info.countryOfBirth || ''}
              onChange={e => updateInfo('countryOfBirth', e.target.value)}>
              <option value="">Select country…</option>
              {countries.map(c => (
                <option key={c.id} value={c.country_name}>{c.country_name}</option>
              ))}
            </Input>
          </FormField>

          {/* ── Nationality + Change / History ── */}
          <FormField label="Nationality"
              isEditMode={isEditMode}
              onChange={() => openChange('nationality')}
              onHistory={() => openHistory('nationality')} 
            >
            <Input type="select" bsSize="sm"
              value={info.nationality || ''}
              onChange={e => updateInfo('nationality', e.target.value)}>
              <option value="">Select nationality…</option>
              {nationalityOptions.map((n,index) => (
                <option key={`${n}-${index}`} value={n}>{n}</option>
              ))}
            </Input>
          </FormField>

          {/* Race */}
          <FormField label="Race" md={4}>
            <Input type="select" bsSize="sm"
              value={info.raceId ?? ''}
              onChange={e => updateInfo('raceId', parseInt(e.target.value, 10) || null)}>
              <option value="">Select race…</option>
              {races.map(r => (
                <option key={r.race_id} value={r.race_id}>{r.race_name}</option>
              ))}
            </Input>
          </FormField>

          {/* Status */}
          <FormField label="Status" md={4}>
            <Input type="select" bsSize="sm"
              value={info.status || ''}
              onChange={e => updateInfo('status', e.target.value)}>
              <option value="">Select status…</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </Input>
          </FormField>

          {/* Risk Assessment Rating */}
          <FormField label="Risk Assessment Rating" md={4}>
            <Input type="select" bsSize="sm"
              value={info.riskRating || ''}
              onChange={e => updateInfo('riskRating', e.target.value)}>
              <option value="">Select rating…</option>
              {RISK_RATINGS.map(r => <option key={r}>{r}</option>)}
            </Input>
          </FormField>

          {/* Additional Notes */}
          <FormField label="Additional Notes" md={12}>
            <Input type="textarea" bsSize="sm" rows={3}
              placeholder="Any additional notes or remarks…"
              value={info.notes || ''}
              onChange={e => updateInfo('notes', e.target.value)} />
          </FormField>

        </Row>
      </SectionBlock>

      {/* ═══════════════════════════ DECEASED (conditional) ═══════════════════════ */}
      {isDeceased && (
        <SectionBlock title="Deceased Details">
          <Row className="g-3">
            <FormField md={4} label="Date of Deceased" required>
              <DatePickerInput
                value={info.deceasedDate || ''}
                onChange={e => updateInfo('deceasedDate', e.target.value)}
                invalid={errors.some(e => e.toLowerCase().includes('deceased date'))} />
              {errors.some(e => e.toLowerCase().includes('deceased date')) && (
                <div style={{ fontSize: 11, color: '#f06548', marginTop: 3, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <i className="ri-error-warning-line"></i> Deceased Date is required.
                </div>
              )}
            </FormField>
            <FormField label="Remarks" md={8}>
              <Input bsSize="sm"
                placeholder="Reason or remarks"
                value={info.deceasedRemarks || ''}
                onChange={e => updateInfo('deceasedRemarks', e.target.value)} />
            </FormField>
          </Row>
          <div style={{ fontSize: 12, color: '#f77e53', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ri-information-line"></i>
            Saving with Deceased status will automatically set the cessation date on all active roles.
          </div>
        </SectionBlock>
      )}

      {/* ═══════════════════════════ RELATIONSHIP ══════════════════════════════════ */}
      <SectionBlock title="Relationship">
        <Row className="g-3">
          <FormField label="Father's Name" md={4}>
            <Input bsSize="sm" placeholder="Father's full name"
              value={rel.fatherName || ''}
              onChange={e => updateRel('fatherName', e.target.value)} />
          </FormField>
          <FormField label="Mother's Name" md={4}>
            <Input bsSize="sm" placeholder="Mother's full name"
              value={rel.motherName || ''}
              onChange={e => updateRel('motherName', e.target.value)} />
          </FormField>
          <FormField label="Spouse's Name" md={4}>
            <Input bsSize="sm" placeholder="Spouse's full name"
              value={rel.spouseName || ''}
              onChange={e => updateRel('spouseName', e.target.value)} />
          </FormField>
        </Row>
      </SectionBlock>

      {/* ═══════════════════════════ CATEGORY ══════════════════════════════════════ */}
      <SectionBlock title="Category / Label / Tag">
        <p className="text-muted fs-12 mb-2">Select all applicable categories for this individual.</p>
        <div className="d-flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(opt => (
            <CheckboxCard key={opt} label={opt}
              checked={categories.includes(opt)}
              onChange={() => toggleCategory(opt)} />
          ))}
        </div>
      </SectionBlock>
    </>
  );
};

export default Step1Individual;
