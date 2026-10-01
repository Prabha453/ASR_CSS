import React, { useState, useEffect } from 'react';
import { Row, Input, Nav, NavItem, NavLink, TabContent, TabPane, Col, Label, Button, FormFeedback } from 'reactstrap';
import classnames from 'classnames';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../components/SectionBlock';
import ChangeHistoryModal from '../components/ChangeHistoryModal';
import { MultiFileUpload } from '../components/FilePreviewModal';
import '../../Individual/Individual.css';

const ADDRESS_TABS = [
  { key: 'REGISTERED',          label: 'Registered Office', icon: 'ri-building-2-line'  },
  { key: 'MAILING',             label: 'Mailing',           icon: 'ri-mail-line'         },
  { key: 'BUSINESS',            label: 'Business',          icon: 'ri-briefcase-2-line'  },
  { key: 'FOREIGN',             label: 'Foreign',           icon: 'ri-earth-line'        },
  { key: 'OTHER',               label: 'Other',             icon: 'ri-map-pin-2-line'    },
  { key: 'REGISTER_OF_MEMBERS', label: 'Reg. of Members',  icon: 'ri-team-line'         },
];

const EMPTY_ADDRESS = {
  block_no: '', street_name: '', building_name: '', level_no: '', unit_no: '',
  city: '', state: '', postal_code: '', country: 'Singapore', country_code: '',
  proof_of_address_url: '', proof_of_address_name: '',
  effective_from: '', effective_to: '', is_primary: false,
  proofDocs: [],
};

const ADDR_TYPE_ID = {
  REGISTERED:          1,
  MAILING:             3,
  BUSINESS:            15,
  FOREIGN:             2,
  OTHER:               16,
  REGISTER_OF_MEMBERS: 25,
};

// ── Address form ───────────────────────────────────────────────────────────────
const AddressForm = ({
  tabKey, address, onUpdate, countries,
  isEditMode, onOpenChange, onOpenHistory, errors = {},
  onFilesAdd, onFileDelete, onDeleteDocument, entityId,
}) => {
  const set = (field, value) => onUpdate(tabKey, field, value);

  const handleAdd = (files) => {
    const newDocs = files.map(f => ({
      name: f.name, preview: URL.createObjectURL(f), docId: null, isNew: true,
    }));
    onUpdate(tabKey, 'proofDocs', [...(address.proofDocs || []), ...newDocs]);
    onFilesAdd?.(tabKey, files);
  };

  const handleDelete = async (idx) => {
    const doc = (address.proofDocs || [])[idx];
    if (doc?.docId && entityId) {
      onDeleteDocument?.({ docId: doc.docId });
    } else {
      if (doc?.preview && doc?.isNew) URL.revokeObjectURL(doc.preview);
      const updatedDocs = (address.proofDocs || []).filter((_, i) => i !== idx);
      onUpdate(tabKey, 'proofDocs', updatedDocs);
      // Pass the file name to remove from proofFiles
      if (doc?.name) {
        onFileDelete?.(tabKey, doc.name); // Pass name, not index
      }
    }
  };

  return (
    <>
      {/* Change / History buttons — edit mode only */}
      {isEditMode && (
        <div className="d-flex justify-content-end gap-1 mb-2">
          <Button type="button" size="sm" color="info"
            style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
            onClick={() => onOpenChange(tabKey)}>
            <i className="ri-edit-2-line me-1" />Change
          </Button>
          <Button type="button" size="sm" color="info"
            style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
            onClick={() => onOpenHistory(tabKey)}>
            <i className="ri-history-line me-1" />History
          </Button>
        </div>
      )}

      <Row className="g-3">
        <Col md={2}>
          <Label className="form-label fs-12">Block / House No.</Label>
          <Input bsSize="sm" placeholder="Blk 123"
            value={address.block_no || ''}
            onChange={e => set('block_no', e.target.value)}
            invalid={!!errors[`${tabKey}_block_no`]} />
          {errors[`${tabKey}_block_no`] && <FormFeedback>{errors[`${tabKey}_block_no`]}</FormFeedback>}
        </Col>

        <Col md={6}>
          <Label className="form-label fs-12">Street Name</Label>
          <Input bsSize="sm" placeholder="e.g. Orchard Road"
            value={address.street_name || ''}
            onChange={e => set('street_name', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Building / Estate</Label>
          <Input bsSize="sm" placeholder="e.g. The Atrium"
            value={address.building_name || ''}
            onChange={e => set('building_name', e.target.value)} />
        </Col>

        <Col md={2}>
          <Label className="form-label fs-12">Level</Label>
          <Input bsSize="sm" placeholder="05"
            value={address.level_no || ''}
            onChange={e => set('level_no', e.target.value)} />
        </Col>

        <Col md={2}>
          <Label className="form-label fs-12">Unit No.</Label>
          <Input bsSize="sm" placeholder="12"
            value={address.unit_no || ''}
            onChange={e => set('unit_no', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Country</Label>
          <Input type="select" bsSize="sm"
            value={address.country || 'Singapore'}
            onChange={e => set('country', e.target.value)}>
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
          <Label className="form-label fs-12">State / Province</Label>
          <Input bsSize="sm" placeholder="e.g. Central Region"
            value={address.state || ''}
            onChange={e => set('state', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">City / Town</Label>
          <Input bsSize="sm" placeholder="e.g. Singapore"
            value={address.city || ''}
            onChange={e => set('city', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Postal Code</Label>
          <Input bsSize="sm" placeholder="238801"
            value={address.postal_code || ''}
            onChange={e => set('postal_code', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Effective From</Label>
          <DatePickerInput
            value={address.effective_from || ''}
            onChange={e => set('effective_from', e.target.value)} />
        </Col>

        <Col md={4}>
          <Label className="form-label fs-12">Effective To</Label>
          <DatePickerInput
            value={address.effective_to || ''}
            onChange={e => set('effective_to', e.target.value)} />
        </Col>

        {/* ── Proof of Address — uses new MultiFileUpload with eye/download/delete ── */}
        <Col md={12}>
          <Label className="form-label fs-12">Proof of Address</Label>
          <MultiFileUpload
            docs={address.proofDocs || []}
            accept=".pdf,.png,.jpg,.jpeg"
            placeholder="Upload proof of address (PDF, PNG, JPG)"
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </Col>
      </Row>
    </>
  );
};

// ── Main step ──────────────────────────────────────────────────────────────────
const Step2Address = ({
  formData,
  updateFormData,
  countries = [],
  isEditMode = false,
  onProofFilesAdd,
  onProofFileDelete,
  onDeleteDocument,
  entityId = null,
  onFetchHistory,
  onSaveChange,
  registerValidationError,
}) => {
  const [activeTab,   setActiveTab]   = useState('REGISTERED');
  const [defaultAddr, setDefaultAddr] = useState(formData.defaultAddress || 'REGISTERED');
  const [errors,      setErrors]      = useState({});

  const MODAL_INIT = {
    open: false, mode: 'change', variant: 'address',
    addrKey: null, historyRows: [], historyLoading: false,
  };
  const [modal, setModal] = useState(MODAL_INIT);

  // ── Initialise address map ─────────────────────────────────────────────────
  const initAddresses = () => {
    const existing = formData.addresses || {};
    const result   = {};
    ADDRESS_TABS.forEach(t => {
      result[t.key] = existing[t.key]
        ? { ...EMPTY_ADDRESS, ...existing[t.key], address_type: t.key }
        : { ...EMPTY_ADDRESS, address_type: t.key };
    });
    return result;
  };

  const [addresses, setAddresses] = useState(initAddresses);

  // Sync when parent updates (OCR / edit load / post-save refresh)
  useEffect(() => {
    if (!formData.addresses || Object.keys(formData.addresses).length === 0) return;
    const incoming = formData.addresses;
    setAddresses(() => {
      const result = {};
      ADDRESS_TABS.forEach(t => {
        const src   = incoming[t.key] || {};
        const local = addresses[t.key] || {};
        // Preserve locally staged new docs that haven't been saved yet
        const serverDocs = (src.proofDocs   || []).filter(d => !d.isNew);
        const localNew   = (local.proofDocs || []).filter(d =>  d.isNew);
        result[t.key] = {
          ...EMPTY_ADDRESS,
          ...src,
          address_type: t.key,
          proofDocs: [...serverDocs, ...localNew],
        };
      });
      return result;
    });
  }, [formData.addresses]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (currentAddresses) => {
    const errs = {};
    let valid   = true;
    setErrors(errs);
    if (registerValidationError) {
      registerValidationError('step2_address', valid ? null : 'Address details have validation errors');
    }
    return valid;
  };

  useEffect(() => { validate(addresses); }, [addresses]);

  // ── Update helpers ─────────────────────────────────────────────────────────
  const handleUpdate = (tabKey, field, value) => {
    const updated = { ...addresses, [tabKey]: { ...addresses[tabKey], [field]: value } };
    setAddresses(updated);
    updateFormData({ addresses: updated });
  };

  const handleSetDefault = (key) => {
    setDefaultAddr(key);
    const updated = {};
    ADDRESS_TABS.forEach(t => {
      updated[t.key] = { ...addresses[t.key], is_primary: t.key === key };
    });
    setAddresses(updated);
    updateFormData({ addresses: updated, defaultAddress: key });
  };

  const isFilled = (key) => {
    const a = addresses[key] || {};
    return !!(a.street_name || a.block_no || a.postal_code);
  };

  const hasProofDocs = (key) => (addresses[key]?.proofDocs || []).length > 0;

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openChange = (addrKey) =>
    setModal({ open: true, mode: 'change', variant: 'address', addrKey, historyRows: [], historyLoading: false });

  const openHistory = async (addrKey) => {
    if (!onFetchHistory) return;
    setModal({ open: true, mode: 'history', variant: 'address', addrKey, historyRows: [], historyLoading: true });
    try {
      const rows = await onFetchHistory('address', ADDR_TYPE_ID[addrKey]);
      setModal(m => ({ ...m, historyRows: rows || [], historyLoading: false }));
    } catch {
      setModal(m => ({ ...m, historyRows: [], historyLoading: false }));
    }
  };

  const handleSaveAddressChange = async ({
    houseNo, streetName, building, level, unitNo,
    country, state, city, postalCode, effectiveDate, isProposed,
  }) => {
    const addrKey = modal.addrKey;
    const old     = addresses[addrKey] || {};
    const oldAddress = {
      block_no: old.block_no ?? '', street_name: old.street_name ?? '',
      building_name: old.building_name ?? '', level_no: old.level_no ?? '',
      unit_no: old.unit_no ?? '', country: old.country ?? '',
      state: old.state ?? '', city: old.city ?? '', postal_code: old.postal_code ?? '',
    };
    const newAddress = {
      block_no: houseNo ?? '', street_name: streetName ?? '',
      building_name: building ?? '', level_no: level ?? '',
      unit_no: unitNo ?? '', country: country ?? '',
      state: state ?? '', city: city ?? '', postal_code: postalCode ?? '',
    };
    const updated = { ...addresses, [addrKey]: { ...addresses[addrKey], ...newAddress } };
    setAddresses(updated);
    updateFormData({ addresses: updated });
    await onSaveChange?.({
      field: 'address', fieldTypeId: ADDR_TYPE_ID[addrKey],
      oldValue: JSON.stringify(oldAddress), newValue: JSON.stringify(newAddress),
      effectiveDate, isProposed, extra: newAddress,
    });
    setModal(m => ({ ...m, open: false }));
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const activeAddrKey   = modal.addrKey;
  const activeAddrLabel = ADDRESS_TABS.find(t => t.key === activeAddrKey)?.label || 'Address';
  const activeAddress   = addresses[activeAddrKey] || EMPTY_ADDRESS;

  return (
    <>
      <ChangeHistoryModal
        isOpen={modal.open}
        onClose={closeModal}
        mode={modal.mode}
        variant="address"
        addrKey={modal.addrKey}
        fieldLabel={activeAddrLabel}
        oldValue={JSON.stringify(activeAddress)}
        addressExtra={{
          houseNo:    activeAddress.block_no      || '',
          streetName: activeAddress.street_name   || '',
          building:   activeAddress.building_name || '',
          level:      activeAddress.level_no      || '',
          unitNo:     activeAddress.unit_no       || '',
          country:    activeAddress.country       || '',
          state:      activeAddress.state         || '',
          city:       activeAddress.city          || '',
          postalCode: activeAddress.postal_code   || '',
        }}
        onSaveAddress={handleSaveAddressChange}
        countries={countries}
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
      />

      <SectionBlock title="Address Details">

        {/* Default address selector */}
        <div className="d-flex align-items-center gap-3 mb-3 p-2"
          style={{ background: 'var(--vz-light)', borderRadius: 7, border: '1px solid var(--vz-border-color)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vz-body-color)', whiteSpace: 'nowrap' }}>
            <i className="ri-home-4-line me-1" style={{ color: '#405189' }} />
            Default Address:
          </span>
          {ADDRESS_TABS.map(tab => (
            <label key={tab.key} className="d-flex align-items-center gap-1 mb-0"
              style={{
                fontSize: 12, cursor: 'pointer',
                fontWeight: defaultAddr === tab.key ? 600 : 400,
                color: defaultAddr === tab.key ? '#405189' : 'var(--vz-body-color)',
              }}>
              <input type="radio" name="defaultAddress" value={tab.key}
                checked={defaultAddr === tab.key}
                onChange={() => handleSetDefault(tab.key)}
                style={{ accentColor: '#405189' }} />
              {tab.label}
            </label>
          ))}
          {defaultAddr && (
            <button onClick={() => { setDefaultAddr(''); updateFormData({ defaultAddress: '' }); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--vz-sidebar-sub-item-color)' }}>
              <i className="ri-close-line" /> Clear
            </button>
          )}
        </div>

        {/* Address tabs */}
        <Nav className="ind-addr-tabs flex-wrap mb-0" style={{ borderBottom: 'none' }}>
          {ADDRESS_TABS.map(tab => (
            <NavItem key={tab.key}>
              <NavLink
                className={classnames({ active: activeTab === tab.key })}
                onClick={() => setActiveTab(tab.key)}
                style={{ cursor: 'pointer' }}>
                <i className={tab.icon} />
                {tab.label}
                {defaultAddr === tab.key && (
                  <i className="ri-home-4-fill ms-1" style={{ color: '#0ab39c', fontSize: 11 }} />
                )}
                {isFilled(tab.key) && defaultAddr !== tab.key && (
                  <i className="ri-check-line ms-1" style={{ color: '#0ab39c', fontSize: 11 }} />
                )}
                {/* Proof doc badge */}
                {hasProofDocs(tab.key) && (
                  <span style={{
                    marginLeft: 4, fontSize: 9, fontWeight: 600,
                    padding: '1px 5px', borderRadius: 8,
                    background: 'rgba(64,81,137,.15)', color: '#405189',
                  }}>
                    {addresses[tab.key].proofDocs.length}
                  </span>
                )}
                {Object.keys(errors).some(k => k.startsWith(tab.key)) && (
                  <i className="ri-error-warning-line ms-1" style={{ color: '#f06548', fontSize: 11 }} />
                )}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <div className="ind-addr-panel">
          <TabContent activeTab={activeTab}>
            {ADDRESS_TABS.map(tab => (
              <TabPane key={tab.key} tabId={tab.key}>
                {activeTab === tab.key && (
                  <AddressForm
                    tabKey={tab.key}
                    address={addresses[tab.key]}
                    onUpdate={handleUpdate}
                    countries={countries}
                    isEditMode={isEditMode}
                    onOpenChange={openChange}
                    onOpenHistory={openHistory}
                    errors={errors}
                    onFilesAdd={onProofFilesAdd}
                    onFileDelete={onProofFileDelete}
                    onDeleteDocument={onDeleteDocument}
                    entityId={entityId}
                  />
                )}
              </TabPane>
            ))}
          </TabContent>
        </div>

      </SectionBlock>
    </>
  );
};

export default Step2Address;
