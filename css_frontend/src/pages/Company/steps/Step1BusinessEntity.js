import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Label, Input, Spinner, Button, Fade } from 'reactstrap';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../components/SectionBlock';
import CheckboxCard from '../components/CheckboxCard';
import ChangeHistoryModal from '../components/ChangeHistoryModal';
import DateInformationSection from './DateInformationSection';
import {
  getCompanySegregationList,
  getBusinessEntityList,
  getCompanyTypeList,
  getRegionList,
  getJurisdictionsList,
  getEntityStatusList,
  getCorpSecTypeList,
  getRelatedIndustryList,
  getSoftwareList,
  getCompanySSICCodeList,
  getEntityServiceCategoryList,
  checkEntityName,
  getUserList,
  getEntityList,
  getOfficialList,
  getGroupMasterList,
} from '../../../helpers/backend_helper';

const RISK_OPTIONS   = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING'];

// Entity Status → the label shown for the single shared "status effective date"
// field. Every status here writes to the same backend field (status_effective_date),
// which is stored as a new entity_status_history row (not a fixed column) — so the
// label changes per status, but no history is ever overwritten.
const STATUS_DATE_LABEL_MAP = {
  'Dormant (Reminder Sending)': 'Dormant Date',
  'Liquidation':                'Liquidation Date',
  'Liquidated':                 'Liquidated Date',
  'Striking Off':               'Striking Off Date',
  'Terminated':                 'Termination Date',
  'Dissolved':                  'Dissolution Date',
  'Struck-Off':                 'Struck-Off Date',
  'Cancelled':                  'Cancelled Date',
  'Amalgamated':                'Amalgamated Date',
};
const STATUS_DATE_FIELD = 'status_effective_date';

const REFERRAL_SOURCES = [
  { name: 'Advertising',            slug: 'advertising' },
  { name: 'Bookmark',               slug: 'bookmark' },
  { name: 'Campaign',               slug: 'campaign' },
  { name: 'Cecilia - Accounthink',  slug: 'cecilia-accounthink' },
  { name: 'Edvertising',            slug: 'edvertising' },
  { name: 'Existing',               slug: 'existing' },
  { name: 'Facebook',               slug: 'facebook' },
  { name: 'Genteel',                slug: 'genteel' },
  { name: 'Ng Ah Lek',              slug: 'ng-ah-lek' },
  { name: 'Not Applicable',         slug: 'not-applicable' },
  { name: 'Referral',               slug: 'referral' },
  { name: 'RMS',                    slug: 'rms' },
  { name: 'Social Media',           slug: 'social-media' },
  { name: 'Temporary',              slug: 'temporary' },
  { name: 'test',                   slug: 'test' },
  { name: 'W T Woon',               slug: 'w-t-woon' },
  { name: 'Website',                slug: 'website' },
];

// Tracked fields for Change/History
const TRACKED_FIELDS = {
  name:                { label: 'Entity Name',              fieldTypeId: 4  },
  former_name:         { label: 'Former Name',              fieldTypeId: 30 },
  company_type_id:     { label: 'Entity Type',              fieldTypeId: 38 },
  ssic_id:             { label: 'SSIC Code Activity (I)',   fieldTypeId: 5  },
  ssic_id_secondary:   { label: 'SSIC Code Activity (II)',  fieldTypeId: 6  },
};

const Step1BusinessEntity = ({ 
  formData, 
  updateFormData, 
  countries = [], 
  isEditMode = false,
  entityId = null,
  onFetchHistory,
  onSaveChange,
  registerValidationError,
  logoFile = null,
  onLogoSelect,
  onLogoRemove,
  onValidityChange,
}) => {
  // ── Master data ──
  const [masters, setMasters] = useState({
    segregations: [], businessEntities: [], companyTypes: [], regions: [],
    entityStatuses: [], corpSecTypes: [], industries: [], softwares: [],
    ssicCodes: [], services: [], users: [], entities: [],
    seniorPartners: [], lawyersManagers: [], groups: [], jurisdictions: [],
  });
  const [mastersLoading, setMastersLoading] = useState(true);
  /* duplicate entity name warning */
  const [nameWarning, setNameWarning] = useState('');
  const [nameChecking, setChecking]   = useState(false);
  const nameTimerRef                  = useRef();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [seg, bn, ct, reg, css, cs, ind, sw, ssic, svc, usr, ent, offPartners, offManagers, grp, jur] = await Promise.allSettled([
          getCompanySegregationList({ page: 1, limit: 200 }),
          getBusinessEntityList({ page: 1, limit: 200 }),
          getCompanyTypeList({ page: 1, limit: 200 }),
          getRegionList({ page: 1, limit: 200 }),
          getEntityStatusList({ page: 1, limit: 200 }),
          getCorpSecTypeList({ page: 1, limit: 200 }),
          getRelatedIndustryList({ page: 1, limit: 200 }),
          getSoftwareList({ page: 1, limit: 200 }),
          getCompanySSICCodeList({ page: 1, limit: 500 }),
          getEntityServiceCategoryList({ page: 1, limit: 200 }),
          getUserList({ page: 1, limit: 500 }),
          getEntityList(),
          getOfficialList({ official_master_slug: 'partners', limit: 500 }),
          getOfficialList({ official_master_slug: 'managers', limit: 500 }),
          getGroupMasterList({ page: 1, limit: 200 }),
          getJurisdictionsList({ page: 1, limit: 500 }),
        ]);
        if (cancelled) return;
        const pick = (r) => r.status === 'fulfilled' ? (r.value?.data?.data || r.value?.data || []) : [];

        // Dedupe officials down to the distinct individuals (official_entity) holding that role
        const dedupeOfficialEntities = (rows) => {
          const map = new Map();
          rows.forEach(row => {
            const oe = row.official_entity || {};
            if (oe.entity_id && !map.has(oe.entity_id)) {
              map.set(oe.entity_id, { entity_id: oe.entity_id, name: oe.name });
            }
          });
          return Array.from(map.values());
        };

        setMasters({
          segregations:    pick(seg),
          businessEntities: pick(bn),
          companyTypes:    pick(ct),
          regions:         pick(reg),
          entityStatuses:  pick(css),
          corpSecTypes:    pick(cs),
          industries:      pick(ind),
          softwares:       pick(sw),
          ssicCodes:       pick(ssic),
          services:        pick(svc),
          users:           pick(usr),
          entities:        pick(ent),
          seniorPartners:  dedupeOfficialEntities(pick(offPartners)),
          lawyersManagers: dedupeOfficialEntities(pick(offManagers)),
          groups:          pick(grp),
          jurisdictions:   pick(jur),
        });
      } finally {
        if (!cancelled) setMastersLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Local form state ──
  const init = (key, def) => formData[key] ?? def;

  const [segregations, setSegregations] = useState(() => init('segregations', []));
  const [bnIds,        setBnIds]        = useState(() => init('bnIds',        []));
  const [basic,        setBasic]        = useState(() => init('basic',        {}));
  const [detail,       setDetail]       = useState(() => init('detail',       {}));
  const defaultBusinessEntityApplied = useRef(false);

  useEffect(() => {
    if (isEditMode || defaultBusinessEntityApplied.current || !masters.businessEntities.length) return;

    defaultBusinessEntityApplied.current = true;
    const corporateShareholderClient = masters.businessEntities.find(entity =>
      String(entity.bs_name || entity.bn_name || entity.name || '')
        .trim()
        .toLowerCase() === 'corporate shareholder client'
    );

    if (!corporateShareholderClient || bnIds.length) return;

    const defaultBnIds = [corporateShareholderClient.bn_id];
    setBnIds(defaultBnIds);
    updateFormData({ bnIds: defaultBnIds });
  }, [bnIds.length, isEditMode, masters.businessEntities, updateFormData]);

  // ── Company logo ──
  const logoInputRef = useRef();
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    setLogoLoadError(false);
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreview(detail.logo_url || null);
  }, [logoFile, detail.logo_url]);

  const handleLogoFileChange = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      toast.error('Only PNG, JPG, or WEBP images are supported for the logo.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be under 5MB.');
      return;
    }
    onLogoSelect?.(selected);
  };

  // Change/History modal
  const [modal, setModal] = useState({
    open: false, mode: 'change', field: null,
    historyRows: [], historyLoading: false,
  });

  const checkName = useCallback((name) => {
    clearTimeout(nameTimerRef.current);
    if (!name?.trim()) {
      setNameWarning('');
      registerValidationError?.('name_check', null);
      return;
    }
    nameTimerRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await checkEntityName({ name: name.trim(), entity_id: entityId });
        const msg = res?.data?.exists ? 'An entity with this name already exists.' : '';
        setNameWarning(msg);
        registerValidationError?.('name_check', msg || null);
      } catch {
        setNameWarning('');
        registerValidationError?.('name_check', null);
      } finally {
        setChecking(false);
      }
    }, 600);
  }, [entityId, registerValidationError]);

  // ── Updaters ──
  const setBasicField = (f, v) => {
    const updated = { ...basic, [f]: v };
    setBasic(updated);
    updateFormData({ basic: updated });
  };

  const setDetailField = (f, v) => {
    const updated = { ...detail, [f]: v };
    setDetail(updated);
    updateFormData({ detail: updated });
  };

  // ── Entity Status → lifecycle date field ──
  const statusNameById = (id) =>
    masters.entityStatuses.find(s => String(s.e_status_id) === String(id))?.e_status_name;

  const statusDateLabel = STATUS_DATE_LABEL_MAP[statusNameById(detail.e_status_id)] || null;

  const setEntityStatus = (newStatusId) => {
    const newLabel = STATUS_DATE_LABEL_MAP[statusNameById(newStatusId)];
    // Every status change clears the shared date field — each status transition
    // is recorded as its own new entity_status_history row, so a fresh date is
    // always expected rather than carrying over the previous status's value.
    const updated = { ...detail, e_status_id: newStatusId, [STATUS_DATE_FIELD]: null };
    setDetail(updated);
    updateFormData({ detail: updated });

    if (newLabel) {
      toast.info(`Entity status changed — please provide the ${newLabel}.`);
    }
  };

  // Mandatory: the status-driven date field must be filled whenever its status is selected.
  useEffect(() => {
    if (statusDateLabel && !detail[STATUS_DATE_FIELD]) {
      registerValidationError?.('status_date', `${statusDateLabel} is required for the selected Entity Status.`);
    } else {
      registerValidationError?.('status_date', null);
    }
    return () => registerValidationError?.('status_date', null);
  }, [detail.e_status_id, detail[STATUS_DATE_FIELD]]);

  // Reports this step's own required-field validity up to the parent so the
  // global Save button can reflect Step1+Step2+Step3 together. Deliberately
  // has no cleanup — the last-known value should persist after this step
  // unmounts (e.g. user moved on to Addresses/Contact), since the underlying
  // data can't change while unmounted anyway.
  useEffect(() => {
    const isValid = !!basic.name?.trim() && !nameWarning && (!statusDateLabel || !!detail[STATUS_DATE_FIELD]);
    onValidityChange?.(isValid);
  }, [basic.name, nameWarning, statusDateLabel, detail[STATUS_DATE_FIELD]]);

  const toggleList = (list, setList, key, item) => {
    const updated = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setList(updated);
    updateFormData({ [key]: updated });
  };

  // ── SSIC helpers ──
  const getSsicDescription = (ssicId) => {
    const found = masters.ssicCodes.find(s => String(s.ssic_id) === String(ssicId));
    return found?.ssic_description || found?.description || '';
  };

  /**
   * Build the full SSIC JSON payload (code + description + user description).
   * Used for both old-value and new-value in Change/History modal.
   */
  const buildSsicJson = (ssicId, userDesc) => {
    const desc = getSsicDescription(ssicId);
    return JSON.stringify({
      ssic_id:               ssicId               || '',
      ssic_description:      desc,
      ssic_user_description: userDesc             || '',
    });
  };

  const isSingapore = (basic.country || 'Singapore').toLowerCase() === 'singapore';

  // ── Portfolio / Group / Holding option builders ──
  const companyEntityOptions    = masters.entities.filter(e => e.entity_type === 'COMPANY').map(e => ({ value: e.entity_id, label: e.name }));
  const individualEntityOptions = masters.entities.filter(e => e.entity_type === 'INDIVIDUAL').map(e => ({ value: e.entity_id, label: e.name }));
  const userOptions = masters.users.map(u => ({
    value: u.user_id,
    label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `User #${u.user_id}`,
  }));
  const seniorPartnerOptions = masters.seniorPartners.map(e => ({ value: e.entity_id, label: e.name }));
  const lawyerManagerOptions = masters.lawyersManagers.map(e => ({ value: e.entity_id, label: e.name }));

  const findOption = (options, value) => options.find(o => String(o.value) === String(value)) || null;

  const selectStyles = {
    control: base => ({ ...base, minHeight: 31, fontSize: 13 }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
  };

  // ── Modal handlers ──
  const openChange = (field) =>
    setModal({ open: true, mode: 'change', field, historyRows: [], historyLoading: false });

  const openHistory = async (field) => {
    setModal({ open: true, mode: 'history', field, historyRows: [], historyLoading: true });
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

    if (field === 'ssic_id' || field === 'ssic_id_secondary') {
      // newValue arrives as JSON string: { ssic_id, ssic_description, ssic_user_description }
      const parsed = JSON.parse(newValue);

      // Determine which user-description field maps to this SSIC field
      const userDescField = field === 'ssic_id'
        ? 'ssic_user_description'
        : 'ssic_user_description_secondary';

      const oldSsicId  = detail[field]        || '';
      const oldUserDesc = detail[userDescField] || '';
      const oldJson    = buildSsicJson(oldSsicId, oldUserDesc);

      // Update detail: both the SSIC id AND the user description
      // const updatedDetail = {
      //   ...detail,
      //   [field]:          parsed.ssic_id,
      //   [userDescField]:  parsed.ssic_user_description || '',
      // };
      // setDetail(updatedDetail);
      // updateFormData({ detail: updatedDetail });

      await onSaveChange?.({
        field,
        fieldTypeId: TRACKED_FIELDS[field].fieldTypeId,
        oldValue:    oldJson,
        extra :  JSON.parse(newValue) || null,
        newValue,
        effectiveDate,
        isProposed,
      });


    } else {
      const oldValue = basic[field] || '';
      setBasicField(field, newValue);
      await onSaveChange?.({
        field,
        fieldTypeId: TRACKED_FIELDS[field].fieldTypeId,
        oldValue,
        newValue,
        effectiveDate,
        isProposed,
      });
    }
  };

  // Get current field value for display in modal (old value side)
  const getFieldValue = (field) => {
    if (field === 'company_type_id') {
      const ct = masters.companyTypes.find(t => String(t.company_type_id) === String(basic[field]));
      return ct?.company_type_name || ct?.name || basic[field] || '';
    }
    if (field === 'ssic_id' || field === 'ssic_id_secondary') {
      // Return full JSON so the modal can parse old code + description
      const userDescField = field === 'ssic_id'
        ? 'ssic_user_description'
        : 'ssic_user_description_secondary';
      return buildSsicJson(detail[field], detail[userDescField]);
    }
    return basic[field] || '';
  };

  // Get the old user description for SSIC modal prop
  const getSsicOldUserDesc = (field) => {
    if (field === 'ssic_id')           return detail.ssic_user_description           || '';
    if (field === 'ssic_id_secondary') return detail.ssic_user_description_secondary || '';
    return '';
  };

  if (mastersLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
        <Spinner color="primary" /> <span className="ms-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <>

      <ChangeHistoryModal
        isOpen={modal.open}
        mode={modal.mode}
        fieldLabel={modal.field ? TRACKED_FIELDS[modal.field]?.label : ''}
        oldValue={modal.field ? getFieldValue(modal.field) : ''}
        oldUserDescription={modal.field ? getSsicOldUserDesc(modal.field) : ''}
        onClose={closeModal}
        onSave={handleSaveChange}
        variant={
          modal.field === 'company_type_id' ? 'entity_type'
          : (modal.field === 'ssic_id' || modal.field === 'ssic_id_secondary') ? 'ssic'
          : 'simple'
        }
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
        entityTypeOptions={masters.companyTypes}
        ssicCodes={masters.ssicCodes} 
      />

      {/* ── Section 0: Company Logo ── */}
      <SectionBlock title="Company Logo">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 84, height: 84, borderRadius: 8, border: '1px dashed #ced4da',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', background: 'var(--vz-light)', flexShrink: 0,
          }}>
            {logoPreview && !logoLoadError
              ? <img
                  src={logoPreview}
                  alt="Company logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setLogoLoadError(true)}
                />
              : <i className="ri-image-line" style={{ fontSize: 28, color: '#adb5bd' }}></i>}
          </div>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex gap-2">
              <Button type="button" size="sm" color="info" onClick={() => logoInputRef.current?.click()}>
                <i className="ri-upload-2-line me-1"></i>{logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {logoPreview && (
                <Button type="button" size="sm" color="light" onClick={onLogoRemove}>
                  <i className="ri-delete-bin-line me-1"></i>Remove
                </Button>
              )}
            </div>
            <small className="text-muted" style={{ fontSize: 10 }}>
              PNG, JPG, or WEBP, up to 5MB. Used on company documents and templates.
            </small>
          </div>
          <input
            ref={logoInputRef} type="file" hidden
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleLogoFileChange}
          />
        </div>
      </SectionBlock>

      {/* ── Section 0: Company Segregation ── */}
      <SectionBlock title="Company Segregation">
        <div className="d-flex flex-wrap gap-2">
          {masters.segregations.length > 0
            ? masters.segregations.map(s => (
                <CheckboxCard
                  key={s.segregation_id}
                  label={s.segregation_name || s.name}
                  checked={segregations.includes(s.segregation_id)}
                  onChange={() => toggleList(segregations, setSegregations, 'segregations', s.segregation_id)}
                />
              ))
            : ['Prospect', 'Client'].map(opt => (
                <CheckboxCard key={opt} label={opt}
                  checked={segregations.includes(opt)}
                  onChange={() => toggleList(segregations, setSegregations, 'segregations', opt)}
                />
              ))
          }
        </div>
      </SectionBlock>

      {/* ── Section 1: Particulars of Business Entity ── */}
      <SectionBlock title="Particulars of Business Entity">
        <Row className="g-3">
          {/* Entity Name - with Change/History */}
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Label className="form-label fs-12 mb-0">Entity Name <span className="text-danger">*</span></Label>
              {isEditMode && (
                <div className="d-flex gap-1">
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openChange('name')}>
                    <i className="ri-edit-2-line me-1"></i>Change
                  </Button>
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openHistory('name')}>
                    <i className="ri-history-line me-1"></i>History
                  </Button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Input bsSize="sm" placeholder="Full registered entity name"
                value={basic.name || ''}
                onChange={e => { setBasicField('name', e.target.value); checkName(e.target.value); }}
                invalid={!!nameWarning} />
              {nameChecking && (
                <Spinner size="sm" style={{ position: 'absolute', right: 8, top: 7 }} />
              )}
            </div>
            {nameWarning && (
              <div style={{ fontSize: 11, color: '#f06548', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ri-error-warning-line"></i>{nameWarning}
              </div>
            )}
          </Col>

          {/* Former Name - with Change/History */}
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Label className="form-label fs-12 mb-0">Former Name (if any)</Label>
              {isEditMode && (
                <div className="d-flex gap-1">
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openChange('former_name')}>
                    <i className="ri-edit-2-line me-1"></i>Change
                  </Button>
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openHistory('former_name')}>
                    <i className="ri-history-line me-1"></i>History
                  </Button>
                </div>
              )}
            </div>
            <Input bsSize="sm" placeholder="Previous registered name"
              value={basic.former_name || ''}
              onChange={e => setBasicField('former_name', e.target.value)} />
          </Col>

          <Col md={3}>
            <Label className="form-label fs-12">Company ID</Label>
            <Input bsSize="sm" placeholder="Internal client reference"
              value={basic.client_no || ''}
              onChange={e => setBasicField('client_no', e.target.value)} />
          </Col>

          {/* Entity Type - with Change/History */}
          <Col md={3}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Label className="form-label fs-12 mb-0">Entity Type</Label>
              {isEditMode && (
                <div className="d-flex gap-1">
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openChange('company_type_id')}>
                    <i className="ri-edit-2-line me-1"></i>Change
                  </Button>
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openHistory('company_type_id')}>
                    <i className="ri-history-line me-1"></i>History
                  </Button>
                </div>
              )}
            </div>
            <Input type="select" bsSize="sm"
              value={basic.company_type_id || ''}
              onChange={e => setBasicField('company_type_id', e.target.value)}>
              <option value="">Select type...</option>
              {masters.companyTypes.map(t => (
                <option key={t.company_type_id} value={t.company_type_id}>
                  {t.company_type_name || t.name}
                </option>
              ))}
            </Input>
          </Col>

          <Col md={3}>
            <Label className="form-label fs-12">Region</Label>
            <Input type="select" bsSize="sm"
              value={detail.region_id || ''}
              onChange={e => setDetailField('region_id', e.target.value)}>
              <option value="">Select region...</option>
              {masters.regions.map(r => (
                <option key={r.region_id} value={r.region_id}>{r.region_name || r.name}</option>
              ))}
            </Input>
          </Col>

          <Col md={3}>
            <Label className="form-label fs-12">Status</Label>
            <Input type="select" bsSize="sm"
              value={basic.status || 'ACTIVE'}
              onChange={e => setBasicField('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </Input>
          </Col>

          <Col md={3}>
            <Label className="form-label fs-12">Entity Status</Label>
            <Input type="select" bsSize="sm"
              value={detail.e_status_id || ''}
              onChange={e => setEntityStatus(e.target.value)}>
              <option value="">Select status...</option>
              {masters.entityStatuses.map(s => (
                <option key={s.e_status_id} value={s.e_status_id}>{s.e_status_name || s.name}</option>
              ))}
            </Input>
          </Col>

          {statusDateLabel && (
            <Col md={3}>
              <Fade in appear timeout={200}>
                <div>
                  <Label className="form-label fs-12">
                    {statusDateLabel} <span className="text-danger">*</span>
                  </Label>
                  <DatePickerInput
                    value={detail[STATUS_DATE_FIELD] || ''}
                    onChange={e => setDetailField(STATUS_DATE_FIELD, e.target.value)} />
                </div>
              </Fade>
            </Col>
          )}

          <Col md={3}>
            <Label className="form-label fs-12">Category / Label / Tag</Label>
            <Select
              isMulti
              options={masters.services.map(s => ({ value: s.service_id, label: s.service_name || s.name }))}
              value={(detail.service_ids || []).map(id => {
                const s = masters.services.find(x => x.service_id === id || x.service_id === Number(id));
                return s ? { value: s.service_id, label: s.service_name || s.name } : null;
              }).filter(Boolean)}
              onChange={selected => setDetailField('service_ids', selected ? selected.map(o => o.value) : [])}
              placeholder="Select category..."
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{ control: base => ({ ...base, minHeight: 31, fontSize: 13 }), menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </Col>

        </Row>
      </SectionBlock>

      {/* ── Section 2: Registration Information ── */}
      <SectionBlock title="Registration Information">
        <Row className="g-3">
          <Col md={4}>
            <Label className="form-label fs-12">Country</Label>
            <Input type="select" bsSize="sm"
              value={basic.country || 'Singapore'}
              onChange={e => setBasicField('country', e.target.value)}>
              <option value="Singapore">Singapore</option>
              {countries
                .filter(c => (c.country_name || c.name) !== 'Singapore')
                .map(c => (
                  <option key={c.country_id || c.id} value={c.country_name || c.name}>
                    {c.country_name || c.name}
                  </option>
                ))}
            </Input>
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">Jurisdiction (State / Free Zone / Municipality)</Label>
            <Input type="select" bsSize="sm"
              value={detail.jurisdiction_id || ''}
              onChange={e => setDetailField('jurisdiction_id', e.target.value || null)}>
              <option value="">Not applicable / country-level only</option>
              {masters.jurisdictions
                .filter(j => {
                  const selectedCountry = countries.find(c => (c.country_name || c.name) === (basic.country || 'Singapore'));
                  return selectedCountry ? Number(j.country_id) === Number(selectedCountry.country_id || selectedCountry.id) : false;
                })
                .map(j => (
                  <option key={j.jurisdiction_id} value={j.jurisdiction_id}>{j.name}</option>
                ))}
            </Input>
          </Col>

          {isSingapore ? (
            <Col md={4}>
              <Label className="form-label fs-12">UEN No.</Label>
              <Input bsSize="sm" placeholder="e.g. 202312345A"
                value={basic.uen_no || ''}
                onChange={e => setBasicField('uen_no', e.target.value)} />
            </Col>
          ) : (
            <>
              <Col md={4}>
                <Label className="form-label fs-12">FBRN</Label>
                <Input bsSize="sm" placeholder="Foreign Business Reg. No."
                  value={basic.fbrn_reg_no || ''}
                  onChange={e => setBasicField('fbrn_reg_no', e.target.value)} />
              </Col>
              <Col md={4}>
                <Label className="form-label fs-12">UF No.</Label>
                <Input bsSize="sm" placeholder="UF Number"
                  value={basic.uf_no || ''}
                  onChange={e => setBasicField('uf_no', e.target.value)} />
              </Col>
              <Col md={4}>
                <Label className="form-label fs-12">Domestic Business Number</Label>
                <Input bsSize="sm" placeholder="Domestic Business No."
                  value={basic.domes_bus_no || ''}
                  onChange={e => setBasicField('domes_bus_no', e.target.value)} />
              </Col>
            </>
          )}

          <Col md={4}>
            <Label className="form-label fs-12">ACRA ID</Label>
            <Input bsSize="sm" placeholder="ACRA / fallback registration No."
              value={basic.acra_no || ''}
              onChange={e => setBasicField('acra_no', e.target.value)} />
            <small className="text-muted" style={{ fontSize: 10 }}>
              If no FBRN, use this as the company registration number in all templates.
            </small>
          </Col>
        </Row>
      </SectionBlock>

      {/* ── Section 3: Choose Business Entity ── */}
      <SectionBlock title="Choose Business Entity">
        {masters.businessEntities.length > 0 && (
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted fs-12">
              {bnIds.length} of {masters.businessEntities.length} selected
            </span>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 fs-12"
              onClick={() => {
                const allIds = masters.businessEntities.map(b => b.bn_id);
                const allSelected = allIds.every(id => bnIds.includes(id));
                const updated = allSelected ? [] : allIds;
                setBnIds(updated);
                updateFormData({ bnIds: updated });
              }}
            >
              {masters.businessEntities.every(b => bnIds.includes(b.bn_id))
                ? <><i className="ri-checkbox-indeterminate-line me-1"></i>Uncheck All</>
                : <><i className="ri-checkbox-multiple-line me-1"></i>Check All</>
              }
            </button>
          </div>
        )}
        <div className="d-flex flex-wrap gap-2">
          {masters.businessEntities.map(b => (
            <CheckboxCard
              key={b.bn_id}
              label={b.bs_name || b.bn_name || b.name}
              checked={bnIds.includes(b.bn_id)}
              onChange={() => toggleList(bnIds, setBnIds, 'bnIds', b.bn_id)}
            />
          ))}
        </div>
      </SectionBlock>

      {/* ── Section 4a: Particulars of Business Entity (Corp Sec) ── */}
      <SectionBlock title="Particulars of Business Entity (Corp Sec)">
        <Row className="g-3">
          <Col md={3}>
            <Label className="form-label fs-12">Incorporation Date</Label>
            <DatePickerInput
              id="company_incorporation_date"
              name="company_incorporation_date"
              strictDmyInput
              value={detail.company_incorporation_date || ''}
              onChange={e => setDetailField('company_incorporation_date', e.target.value)} />
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Risk Assessment Rating</Label>
            <Input type="select" bsSize="sm"
              value={detail.risk_assessment_rating || ''}
              onChange={e => setDetailField('risk_assessment_rating', e.target.value)}>
              <option value="">Select rating...</option>
              {RISK_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Corp Sec Status</Label>
            <Input type="select" bsSize="sm"
              value={detail.corp_sec_id || ''}
              onChange={e => setDetailField('corp_sec_id', e.target.value)}>
              <option value="">Select...</option>
              {masters.corpSecTypes.map(c => (
                <option key={c.corp_sec_id} value={c.corp_sec_id}>{c.corp_sec_name || c.name}</option>
              ))}
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Related Industry</Label>
            <Input type="select" bsSize="sm"
              value={detail.related_industry_id || ''}
              onChange={e => setDetailField('related_industry_id', e.target.value)}>
              <option value="">Select industry...</option>
              {masters.industries.map(i => (
                <option key={i.related_industry_id} value={i.related_industry_id}>
                  {i.related_industry_name || i.name}
                </option>
              ))}
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Public Interest Company</Label>
            <Input type="select" bsSize="sm"
              value={detail.public_interest_company ?? ''}
              onChange={e => setDetailField('public_interest_company', e.target.value === 'true')}>
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Software Used by Company</Label>
            <Input type="select" bsSize="sm"
              value={detail.software_id || ''}
              onChange={e => setDetailField('software_id', e.target.value)}>
              <option value="">Select software...</option>
              {masters.softwares.map(s => (
                <option key={s.software_id} value={s.software_id}>{s.software_name || s.name}</option>
              ))}
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Financial Year End Date</Label>
            <DatePickerInput
              id="company_fin_date"
              name="company_fin_date"
              strictDmyInput
              value={detail.company_fin_date || ''}
              onChange={e => setDetailField('company_fin_date', e.target.value)} />
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Mail Redirection</Label>
            <Input type="select" bsSize="sm"
              value={detail.mail_redirection ?? ''}
              onChange={e => setDetailField('mail_redirection', e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Input>
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">XBRL Required</Label>
            <Input type="select" bsSize="sm"
              value={detail.company_xbrl_required ?? ''}
              onChange={e => setDetailField('company_xbrl_required', e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Input>
          </Col>
        </Row>
      </SectionBlock>

      {/* ── Section 5a: Portfolio / Group / Holding ── */}
      <SectionBlock title="Portfolio / Group / Holding Company">
        <Row className="g-3">
          <Col md={4}>
            <Label className="form-label fs-12">Holding Company Name</Label>
            <CreatableSelect
              options={companyEntityOptions}
              value={
                detail.holding_company_entity_id
                  ? findOption(companyEntityOptions, detail.holding_company_entity_id)
                  : (detail.holding_company_name ? { value: detail.holding_company_name, label: detail.holding_company_name } : null)
              }
              onChange={opt => {
                if (!opt) {
                  setDetailField('holding_company_entity_id', null);
                  setDetailField('holding_company_name', '');
                } else if (opt.__isNew__) {
                  setDetailField('holding_company_entity_id', null);
                  setDetailField('holding_company_name', opt.value);
                } else {
                  setDetailField('holding_company_entity_id', opt.value);
                  setDetailField('holding_company_name', opt.label);
                }
              }}
              placeholder="Select or type holding company..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Person in Charge</Label>
            <Select
              options={userOptions}
              value={findOption(userOptions, detail.person_in_charge)}
              onChange={opt => setDetailField('person_in_charge', opt ? opt.value : null)}
              placeholder="Select person in charge..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Group</Label>
            <Select
              isMulti
              options={masters.groups.map(g => ({ value: g.group_id, label: g.group_name }))}
              value={(detail.group_ids || []).map(id => {
                const g = masters.groups.find(x => String(x.group_id) === String(id));
                return g ? { value: g.group_id, label: g.group_name } : null;
              }).filter(Boolean)}
              onChange={selected => setDetailField('group_ids', selected ? selected.map(o => o.value) : [])}
              placeholder="Select group(s)..."
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Referral Source</Label>
            <Input type="select" bsSize="sm"
              value={detail.referral_source || ''}
              onChange={e => setDetailField('referral_source', e.target.value)}>
              <option value="">Select referral source...</option>
              {REFERRAL_SOURCES.map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </Input>
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Company Referral Partner</Label>
            <Select
              options={companyEntityOptions}
              value={findOption(companyEntityOptions, detail.company_referral_partner_id)}
              onChange={opt => setDetailField('company_referral_partner_id', opt ? opt.value : null)}
              placeholder="Select company referral partner..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Individual Referral Partner</Label>
            <Select
              options={individualEntityOptions}
              value={findOption(individualEntityOptions, detail.individual_referral_partner_id)}
              onChange={opt => setDetailField('individual_referral_partner_id', opt ? opt.value : null)}
              placeholder="Select individual referral partner..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Senior Partner</Label>
            <Select
              options={seniorPartnerOptions}
              value={findOption(seniorPartnerOptions, detail.senior_partner_id)}
              onChange={opt => setDetailField('senior_partner_id', opt ? opt.value : null)}
              placeholder="Select senior partner..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Lawyers</Label>
            <Select
              options={lawyerManagerOptions}
              value={findOption(lawyerManagerOptions, detail.lawyer_id)}
              onChange={opt => setDetailField('lawyer_id', opt ? opt.value : null)}
              placeholder="Select lawyer..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Manager</Label>
            <Select
              options={lawyerManagerOptions}
              value={findOption(lawyerManagerOptions, detail.manager_id)}
              onChange={opt => setDetailField('manager_id', opt ? opt.value : null)}
              placeholder="Select manager..."
              isClearable
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Source From</Label>
            <Input type="select" bsSize="sm"
              value={detail.source_from || 'MANUAL'}
              onChange={e => setDetailField('source_from', e.target.value)}>
              {['FORM','DM','SCRIPT','API','MANUAL'].map(s => <option key={s}>{s}</option>)}
            </Input>
          </Col>
        </Row>
      </SectionBlock>

      {/* ── Section 5b: Principal Activities (SSIC) ── */}
      <SectionBlock title="Principal Activities">
        <Row className="g-3">

          {/* ── SSIC Activity (I) ── */}
          <Col md={4}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Label className="form-label fs-12 mb-0">SSIC Code Activity (I)</Label>
              {isEditMode && (
                <div className="d-flex gap-1">
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openChange('ssic_id')}>
                    <i className="ri-edit-2-line me-1"></i>Change
                  </Button>
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openHistory('ssic_id')}>
                    <i className="ri-history-line me-1"></i>History
                  </Button>
                </div>
              )}
            </div>
            <Input type="select" bsSize="sm"
              value={detail.ssic_id || ''}
              onChange={e => setDetailField('ssic_id', e.target.value)}>
              <option value="">Select SSIC code...</option>
              {masters.ssicCodes.map(s => (
                <option key={s.ssic_id} value={s.ssic_id}>
                  {s.ssic_code} — {(s.ssic_description || s.description || '').substring(0, 50)}
                </option>
              ))}
            </Input>
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">Default SSIC Description (I)</Label>
            <Input bsSize="sm" readOnly
              value={getSsicDescription(detail.ssic_id)}
              style={{ background: 'var(--vz-light)' }} />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">User Described Activity (I)</Label>
            <Input bsSize="sm" placeholder="Your description"
              value={detail.ssic_user_description || ''}
              onChange={e => setDetailField('ssic_user_description', e.target.value)} />
          </Col>

          {/* ── SSIC Activity (II) ── */}
          <Col md={4}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Label className="form-label fs-12 mb-0">SSIC Code Activity (II)</Label>
              {isEditMode && (
                <div className="d-flex gap-1">
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openChange('ssic_id_secondary')}>
                    <i className="ri-edit-2-line me-1"></i>Change
                  </Button>
                  <Button type="button" size="sm" color="info"
                    style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
                    onClick={() => openHistory('ssic_id_secondary')}>
                    <i className="ri-history-line me-1"></i>History
                  </Button>
                </div>
              )}
            </div>
            <Input type="select" bsSize="sm"
              value={detail.ssic_id_secondary || ''}
              onChange={e => setDetailField('ssic_id_secondary', e.target.value)}>
              <option value="">Select secondary SSIC...</option>
              {masters.ssicCodes.map(s => (
                <option key={s.ssic_id} value={s.ssic_id}>
                  {s.ssic_code} — {(s.ssic_description || s.description || '').substring(0, 50)}
                </option>
              ))}
            </Input>
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">Default SSIC Description (II)</Label>
            <Input bsSize="sm" readOnly
              value={getSsicDescription(detail.ssic_id_secondary)}
              style={{ background: 'var(--vz-light)' }} />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">User Described Activity (II)</Label>
            <Input bsSize="sm" placeholder="Your description"
              value={detail.ssic_user_description_secondary || ''}
              onChange={e => setDetailField('ssic_user_description_secondary', e.target.value)} />
          </Col>

        </Row>
      </SectionBlock>

      {/* ── Section 7: Service Category ── */}
      <SectionBlock title="Service Category">
        <Row className="g-3">
          <Col md={6}>
            <Label className="form-label fs-12">Entity Service</Label>
            <Select
              isMulti
              options={masters.services.map(s => ({ value: s.service_id, label: s.service_name || s.name }))}
              value={(detail.service_ids || []).map(id => {
                const s = masters.services.find(x => x.service_id === id || x.service_id === Number(id));
                return s ? { value: s.service_id, label: s.service_name || s.name } : null;
              }).filter(Boolean)}
              onChange={selected => setDetailField('service_ids', selected ? selected.map(o => o.value) : [])}
              placeholder="Select services..."
              classNamePrefix="rs"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{ control: base => ({ ...base, minHeight: 31, fontSize: 13 }), menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </Col>
          <Col md={6}>
            <Label className="form-label fs-12">Type of Fee</Label>
            <Input type="select" bsSize="sm"
              value={detail.fee_id || ''}
              onChange={e => setDetailField('fee_id', e.target.value)}>
              <option value="">Select fee type...</option>
            </Input>
          </Col>
        </Row>
      </SectionBlock>

      {isEditMode && entityId && (
        <DateInformationSection
          formData={formData}
          entityId={entityId}
          updateFormData={updateFormData}
        />
      )}

      {/* ── Section 8: Create Remark ── */}
      <SectionBlock title="Create Remark">
        <Row className="g-3">
          <Col md={4}>
            <Label className="form-label fs-12">Remarks</Label>
            <Input type="textarea" bsSize="sm" rows={2} placeholder="Remarks"
              value={basic.remarks || ''}
              onChange={e => setBasicField('remarks', e.target.value)} />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">Additional Remarks</Label>
            <Input type="textarea" bsSize="sm" rows={2} placeholder="Additional remarks"
              value={basic.additional_remarks || ''}
              onChange={e => setBasicField('additional_remarks', e.target.value)} />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12">Location of Common Seal Remarks</Label>
            <Input type="textarea" bsSize="sm" rows={2} placeholder="Location of common seal remarks"
              value={detail.location_common_seal_remarks || ''}
              onChange={e => setDetailField('location_common_seal_remarks', e.target.value)} />
          </Col>
        </Row>
      </SectionBlock>
    </>
  );
};

export default Step1BusinessEntity;
