import React, { useState, useRef, useEffect } from 'react';
import { Row, Input, Nav, NavItem, NavLink, TabContent, TabPane, Button } from 'reactstrap';
import classnames from 'classnames';
import SectionBlock from '../../Company/components/SectionBlock';
import FormField from '../components/FormField';
import ChangeHistoryModal from '../components/ChangeHistoryModal';
import { MultiFileUpload } from '../../Company/components/FilePreviewModal';

/* ── field_type_id per address type ── */
const ADDR_PARTICULAR_TYPE = {
  contact:     33,
  residential:  8,
  foreign:      9,
};

const ADDRESS_TABS = [
  { id: 'contact',     label: 'Contact Address',     icon: 'ri-map-pin-2-line'  },
  { id: 'residential', label: 'Residential Address', icon: 'ri-building-2-line' },
  { id: 'foreign',     label: 'Foreign Address',     icon: 'ri-earth-line'      },
];

const EMPTY_ADDRESS = {
  houseNo: '', streetName: '', building: '', level: '', unitNo: '',
  country: 'Singapore', state: '', city: '', postalCode: '',
  proofDocs: [],   // [{ name, preview, docId, isNew }]
};

/* ── AddressForm ── */
const AddressForm = ({
  addrKey,
  address,
  onUpdate,
  countries,
  onFilesAdd,      // (addrKey, File[]) → append to proofFiles[addrKey]
  onFileDelete,    // (addrKey, index)  → remove from proofFiles + address.proofDocs
  onDeleteDocument,
  entityId,
}) => {
  const update    = (field, value) => onUpdate(addrKey, field, value);
  const isForeign = addrKey === 'foreign';

  const handleAdd = (files) => {
    const newDocs = files.map(f => ({
      name:    f.name,
      preview: URL.createObjectURL(f),
      docId:   null,
      isNew:   true,
    }));
    const updated = [...(address.proofDocs || []), ...newDocs];
    update('proofDocs', updated);
    onFilesAdd?.(addrKey, files);
  };

  const handleDelete = async (idx) => {
    const docs = address.proofDocs || [];
    const doc  = docs[idx];
    if (doc?.docId && entityId) {
      try { await onDeleteDocument?.(entityId, doc.docId); } catch { /* ignore */ }
    } else {
      if (doc?.preview && doc?.isNew) URL.revokeObjectURL(doc.preview);
      // proofFiles[addrKey] in Individual.jsx only holds NEW (unsaved) files,
      // in upload order — so we must translate the combined-list index `idx`
      // into the index within just the "isNew" subset before notifying the parent.
      const newFileIndex = docs.slice(0, idx).filter(d => d.isNew).length;
      const updated = docs.filter((_, i) => i !== idx);
      update('proofDocs', updated);
      if (doc?.isNew) onFileDelete?.(addrKey, newFileIndex);
    }
  };

  return (
    <Row className="g-3">
      {!isForeign && (
        <FormField label="House No. / Block" md={4}>
          <Input bsSize="sm" placeholder="e.g. Blk 123"
            value={address.houseNo}
            onChange={e => update('houseNo', e.target.value)} />
        </FormField>
      )}

      <FormField label="Street Name" md={isForeign ? 12 : 8}>
        <Input bsSize="sm" placeholder="e.g. Orchard Road"
          value={address.streetName}
          onChange={e => update('streetName', e.target.value)} />
      </FormField>

      {!isForeign && (
        <>
          <FormField label="Building / Estate" md={6}>
            <Input bsSize="sm" placeholder="e.g. The Atrium"
              value={address.building}
              onChange={e => update('building', e.target.value)} />
          </FormField>
          <FormField label="Level" md={3}>
            <Input bsSize="sm" placeholder="e.g. 05"
              value={address.level}
              onChange={e => update('level', e.target.value)} />
          </FormField>
          <FormField label="Unit No." md={3}>
            <Input bsSize="sm" placeholder="e.g. 12"
              value={address.unitNo}
              onChange={e => update('unitNo', e.target.value)} />
          </FormField>
          <FormField label="Country" md={4}>
            <Input type="select" bsSize="sm"
              value={address.country || ''}
              onChange={e => update('country', e.target.value)}>
              <option value="">Select country...</option>
              {countries.map(c => (
                <option key={c.id} value={c.country_name}>{c.country_name}</option>
              ))}
            </Input>
          </FormField>
          <FormField label="State / Province" md={4}>
            <Input bsSize="sm" placeholder="e.g. Central Region"
              value={address.state}
              onChange={e => update('state', e.target.value)} />
          </FormField>
          <FormField label="Postal Code" md={4}>
            <Input bsSize="sm" placeholder="e.g. 238801"
              value={address.postalCode}
              onChange={e => update('postalCode', e.target.value)} />
          </FormField>
          <FormField label="City and/or Town" md={12}>
            <Input bsSize="sm" placeholder="e.g. Singapore"
              value={address.city}
              onChange={e => update('city', e.target.value)} />
          </FormField>
        </>
      )}

      <FormField label="Proof of Address" md={12}>
        <MultiFileUpload
          docs={address.proofDocs || []}
          accept=".pdf,.png,.jpg,.jpeg"
          placeholder="Upload proof of address (PDF, PNG, JPG)"
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
        {(address.proofDocs || []).length > 0 && (
          <small style={{ fontSize: 10, color: 'var(--vz-sidebar-sub-item-color)' }}>
            {address.proofDocs.length} file{address.proofDocs.length !== 1 ? 's' : ''} attached
          </small>
        )}
      </FormField>
    </Row>
  );
};

/* ── Main Step component ── */
const Step4Address = ({
  formData,
  updateFormData,
  countries          = [],
  errors             = [],
  isEditMode         = false,
  entityId           = null,
  onFetchHistory,
  onSaveChange,
  onProofFilesAdd,     // (addrKey, File[]) — appends to proofFiles[addrKey]
  onProofFileDelete,   // (addrKey, index)  — removes from proofFiles[addrKey]
  onDeleteDocument,
}) => {
  const [activeTab,   setActiveTab]   = useState('contact');
  const [defaultAddr, setDefaultAddr] = useState(formData.defaultAddress || '');
  const defaultAddrError = errors.some(e => e.toLowerCase().includes('default address')) && !defaultAddr;

  /* ── Address state ── */
  const initAddresses = () => {
    const existing = formData.addresses || {};
    const result   = {};
    ADDRESS_TABS.forEach(t => {
      result[t.id] = existing[t.id]
        ? { ...EMPTY_ADDRESS, ...existing[t.id] }
        : { ...EMPTY_ADDRESS };
    });
    return result;
  };
  const [addresses, setAddresses] = useState(initAddresses);

  /* Sync from parent — preserve locally staged new files */
  useEffect(() => {
    if (!formData.addresses || Object.keys(formData.addresses).length === 0) return;
    const incoming = formData.addresses;
    setAddresses(prev => {
      const result = {};
      ADDRESS_TABS.forEach(t => {
        const src   = incoming[t.id] || {};
        const local = prev[t.id]     || {};

        // Server docs (isNew=false) come from src.proofDocs
        // Locally staged new docs (isNew=true) come from local.proofDocs
        const serverDocs = (src.proofDocs   || []).filter(d => !d.isNew);
        const localNew   = (local.proofDocs || []).filter(d =>  d.isNew);

        result[t.id] = {
          ...EMPTY_ADDRESS,
          ...src,
          proofDocs: [...serverDocs, ...localNew],
        };
      });
      return result;
    });
  }, [formData.addresses]);

  /* Sync default address */
  useEffect(() => {
    if (formData.defaultAddress !== undefined) setDefaultAddr(formData.defaultAddress || '');
  }, [formData.defaultAddress]);

  /* ── Change / History modal ── */
  const [modal, setModal] = useState({
    open: false, mode: 'change', variant: 'address',
    addrKey: null, historyRows: [], historyLoading: false,
  });

  /* ── handlers ── */
  const handleUpdate = (addrKey, field, value) => {
    const updated = { ...addresses, [addrKey]: { ...addresses[addrKey], [field]: value } };
    setAddresses(updated);
    updateFormData({ addresses: updated });
  };

  const handleSetDefault = (id) => {
    setDefaultAddr(id);
    updateFormData({ defaultAddress: id });
  };

  const openChange = (addrKey) =>
    setModal({ open: true, mode: 'change', variant: 'address', addrKey, historyRows: [], historyLoading: false });

  const openHistory = async (addrKey) => {
    const typeId = ADDR_PARTICULAR_TYPE[addrKey];
    setModal({ open: true, mode: 'history', variant: 'address', addrKey, historyRows: [], historyLoading: true });
    try {
      const rows = await onFetchHistory?.('address', typeId);
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
    const updated = {
      ...addresses,
      [addrKey]: { ...addresses[addrKey], houseNo, streetName, building, level, unitNo, country, state, city, postalCode },
    };
    setAddresses(updated);
    updateFormData({ addresses: updated });
    await onSaveChange?.({
      field:       'address',
      fieldTypeId: ADDR_PARTICULAR_TYPE[addrKey],
      oldValue:    JSON.stringify(addresses[addrKey]),
      newValue:    JSON.stringify(updated[addrKey]),
      effectiveDate, isProposed,
      extra:       updated[addrKey],
    });
    setModal(m => ({ ...m, open: false }));
  };

  const activeAddrKey   = modal.addrKey;
  const activeAddrLabel = ADDRESS_TABS.find(t => t.id === activeAddrKey)?.label || 'Address';

  return (
    <>
      <ChangeHistoryModal
        isOpen={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        mode={modal.mode}
        variant="address"
        addrKey={modal.addrKey}
        fieldLabel={activeAddrLabel}
        oldValue={JSON.stringify(addresses[modal.addrKey] || {})}
        addressExtra={{
          houseNo:    addresses[modal.addrKey]?.houseNo    || '',
          streetName: addresses[modal.addrKey]?.streetName || '',
          building:   addresses[modal.addrKey]?.building   || '',
          level:      addresses[modal.addrKey]?.level      || '',
          unitNo:     addresses[modal.addrKey]?.unitNo     || '',
          country:    addresses[modal.addrKey]?.country    || '',
          state:      addresses[modal.addrKey]?.state      || '',
          city:       addresses[modal.addrKey]?.city       || '',
          postalCode: addresses[modal.addrKey]?.postalCode || '',
        }}
        onSaveAddress={handleSaveAddressChange}
        countries={countries}
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
      />

      <SectionBlock title="Individual Addresses">

        {/* Default Address selector */}
        <div className="d-flex align-items-center gap-3 mb-3 p-2"
          style={{
            background:   defaultAddrError ? 'rgba(240,101,72,.05)' : 'var(--vz-light)',
            borderRadius: 7,
            border:       `1px solid ${defaultAddrError ? '#f06548' : 'var(--vz-border-color)'}`,
          }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vz-body-color)', whiteSpace: 'nowrap' }}>
            <i className="ri-home-4-line me-1" style={{ color: '#405189' }}></i>Default Address:
          </span>
          {ADDRESS_TABS.map(tab => (
            <label key={tab.id} className="d-flex align-items-center gap-1 mb-0"
              style={{ fontSize: 12, cursor: 'pointer',
                fontWeight: defaultAddr === tab.id ? 600 : 400,
                color:      defaultAddr === tab.id ? '#405189' : 'var(--vz-body-color)' }}>
              <input type="radio" name="defaultAddress" value={tab.id}
                checked={defaultAddr === tab.id}
                onChange={() => handleSetDefault(tab.id)}
                style={{ accentColor: '#405189' }} />
              {tab.label.replace(' Address', '')}
            </label>
          ))}
          {defaultAddr && (
            <button onClick={() => handleSetDefault('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--vz-sidebar-sub-item-color)' }}>
              <i className="ri-close-line"></i> Clear
            </button>
          )}
        </div>

        {defaultAddrError && (
          <div style={{ fontSize: 11, color: '#f06548', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ri-error-warning-line"></i> Please select a Default Address.
          </div>
        )}

        {/* Tabs */}
        <Nav className="ind-addr-tabs flex-wrap mb-0" style={{ borderBottom: 'none' }}>
          {ADDRESS_TABS.map(tab => (
            <NavItem key={tab.id}>
              <NavLink
                className={classnames({ active: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}>
                <i className={tab.icon}></i>
                {tab.label}
                {defaultAddr === tab.id && (
                  <i className="ri-home-4-fill ms-1" style={{ color: '#0ab39c', fontSize: 11 }}></i>
                )}
                {/* Badge showing number of proof docs */}
                {(addresses[tab.id]?.proofDocs?.length > 0) && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 10,
                    background: 'rgba(64,81,137,.15)', color: '#405189',
                  }}>
                    {addresses[tab.id].proofDocs.length}
                  </span>
                )}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        {/* Tab panels */}
        <div className="ind-addr-panel">
          <TabContent activeTab={activeTab}>
            {ADDRESS_TABS.map(tab => (
              <TabPane key={tab.id} tabId={tab.id}>
                {activeTab === tab.id && (
                  <>
                    <FormField
                      label=""
                      md={12}
                      isEditMode={isEditMode}
                      onChange={() => openChange(tab.id)}
                      onHistory={() => openHistory(tab.id)}
                    />
                    <AddressForm
                      addrKey={tab.id}
                      address={addresses[tab.id]}
                      onUpdate={handleUpdate}
                      countries={countries}
                      onFilesAdd={onProofFilesAdd}
                      onFileDelete={onProofFileDelete}
                      onDeleteDocument={onDeleteDocument}
                      entityId={entityId}
                    />
                  </>
                )}
              </TabPane>
            ))}
          </TabContent>
        </div>

      </SectionBlock>
    </>
  );
};

export default Step4Address;