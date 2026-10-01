import React, { useState, useEffect } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Spinner, Table,
} from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';

/* ══════════════════════════════════════════════════════
   JSON value parser + renderer (for history rows)
══════════════════════════════════════════════════════ */

const ADDRESS_LABELS = {
  houseNo:    'House No.',
  streetName: 'Street Name',
  building:   'Building',
  level:      'Level',
  unitNo:     'Unit No.',
  country:    'Country',
  state:      'State',
  city:       'City',
  postalCode: 'Postal Code',
};

const SSIC_LABELS = {
  ssic_id:               'SSIC Code',
  ssic_description:      'Description',
  ssic_user_description: 'User Described Activity',
};

  const tryParseJson = (str) => {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
};

const JsonValueCell = ({ raw, color, ssicCodes=[] }) => {
  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== 'object') {
    return (
      <span style={{ color, fontWeight: color === '#0ab39c' ? 500 : 400 }}>
        {raw || '—'}
      </span>
    );
  }

  const labelMap = 'streetName' in parsed ? ADDRESS_LABELS
                 : 'ssic_id'    in parsed ? SSIC_LABELS
                 : {};

  const entries = Object.entries(parsed).filter(
    ([k, v]) => v !== '' && v != null && k !== 'proofName'
  );

  if (!entries.length) return <span style={{ color: '#adb5bd' }}>—</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {entries.map(([k, v]) => {
        let displayValue = String(v);

        // Show SSIC Code + Description instead of the ID
        if (k === 'ssic_id') {
          const ssic = ssicCodes.find(
            item => Number(item.ssic_id) === Number(v)
          );

          if (ssic) {
            displayValue = `${ssic.ssic_code} — ${
              (ssic.ssic_description || ssic.description || '').substring(0, 50)
            }`;
          }
        }

        return (
        <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
          <span style={{
            fontSize: 10, color: '#6c757d',
            whiteSpace: 'nowrap', minWidth: 88, flexShrink: 0,
          }}>
            {labelMap[k] || k}:
          </span>
          <span style={{ color, fontWeight: color === '#0ab39c' ? 500 : 400, fontSize: 11 }}>
            {String(displayValue)}
          </span>
        </div>
        );
      })}

    </div>
  );
};

/* ── Sub-components ── */

const labelStyle = {
  fontSize: 11, fontWeight: 500, marginBottom: 3,
  display: 'block', color: 'var(--vz-body-color)',
};

const LabeledInput = ({ label, value, onChange, readOnly, type = 'text', placeholder, required = false }) => (
  <div>
    <label style={labelStyle}>
      {label}{required && <span className="text-danger"> *</span>}
    </label>
    <Input
      bsSize="sm"
      type={type}
      value={value ?? ''}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      placeholder={placeholder}
      style={readOnly
        ? { background: 'var(--vz-light)', color: 'var(--vz-sidebar-sub-item-color)', fontSize: 12 }
        : { fontSize: 12 }}
    />
  </div>
);

const Row2Col = ({ left, right }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 4 }}>
    {left}
    {right}
  </div>
);

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

/* ══════════════════════════════════════════════════════
   CompanyChangeHistoryModal
   
   variants supported:
     "simple"      → old text + new text
     "entity_type" → old text + entity type SELECT
     "ssic"        → SSIC code + description picker + user description
     "contact"     → phone-code picker + number input
     "address"     → full address form
══════════════════════════════════════════════════════ */

const CompanyChangeHistoryModal = ({
  isOpen,
  onClose,
  mode               = 'change',
  variant            = 'simple',
  fieldLabel         = 'Field',

  /* simple / entity_type / contact */
  oldValue           = '',

  /* ssic — old user description passed from parent */
  oldUserDescription = '',

  /* entity_type */
  entityTypeOptions  = [],

  /* contact */
  phoneCodes         = [],

  /* address */
  addressExtra       = {},
  countries          = [],
  onSaveAddress,
  addrKey            = '',

  /* simple / entity_type / contact / ssic */
  onSave,

  /* history */
  historyRows        = [],
  historyLoading     = false,

  /* ssic */
  ssicCodes          = [],
}) => {
  /* ── ALL hooks at top level — never inside conditions or callbacks ── */
  const [newValue,            setNewValue]           = useState('');
  const [newUserDescription,  setNewUserDescription] = useState('');
  const [effectiveDate,       setDate]               = useState('');
  const [isProposed,          setIsProposed]         = useState(false);
  const [saving,              setSaving]             = useState(false);
  const [error,               setError]             = useState('');

  /* contact phone code */
  const [phoneCode, setPhoneCode] = useState('+65');

  /* address fields */
  const [addr, setAddr] = useState({
    houseNo: '', streetName: '', building: '', level: '', unitNo: '',
    country: '', state: '', city: '', postalCode: '',
  });

  /* ── Sync phoneCode default when phoneCodes prop arrives ── */
  useEffect(() => {
    if (phoneCodes.length > 0) {
      setPhoneCode(phoneCodes[0].value || '+65');
    }
  }, [phoneCodes]);

  /* ── Reset all state when modal opens / closes ── */
  useEffect(() => {
    if (!isOpen) {
      setNewValue('');
      setNewUserDescription('');
      setDate('');
      setIsProposed(false);
      setPhoneCode(phoneCodes[0]?.value || '+65');
      setAddr({ houseNo: '', streetName: '', building: '', level: '', unitNo: '', country: '', state: '', city: '', postalCode: '' });
      setError('');
      setSaving(false);
    }
  }, [isOpen]);

  /* ── Pre-populate address fields when addressExtra changes (edit mode) ── */
  useEffect(() => {
    if (isOpen && variant === 'address' && addressExtra) {
      setAddr({
        houseNo:    addressExtra.houseNo    || '',
        streetName: addressExtra.streetName || '',
        building:   addressExtra.building   || '',
        level:      addressExtra.level      || '',
        unitNo:     addressExtra.unitNo     || '',
        country:    addressExtra.country    || '',
        state:      addressExtra.state      || '',
        city:       addressExtra.city       || '',
        postalCode: addressExtra.postalCode || '',
      });
    }
  }, [isOpen, variant, addressExtra]);

  /* ── Derived values for SSIC (computed — no hooks needed) ── */
  const ssicParsedNew          = tryParseJson(newValue);
  const ssicDisplayNewId       = ssicParsedNew?.ssic_id               || '';
  const ssicDisplayNewDesc     = ssicParsedNew?.ssic_description       || '';
  const ssicOldParsed          = tryParseJson(oldValue) || {};

  /* ── SSIC picker helper — stores full JSON including user description ── */
  const handleSsicPick = (ssicId) => {
    const found = ssicCodes.find(s => String(s.ssic_id) === String(ssicId));
    const desc  = found?.ssic_description || found?.description || '';
    setNewValue(JSON.stringify({
      ssic_id:               ssicId,
      ssic_description:      desc,
      ssic_user_description: newUserDescription,
    }));
  };

  /* ── Keep user description in sync with the JSON payload as user types ── */
  const handleUserDescriptionChange = (val) => {
    setNewUserDescription(val);
    if (ssicDisplayNewId) {
      setNewValue(JSON.stringify({
        ssic_id:               ssicDisplayNewId,
        ssic_description:      ssicDisplayNewDesc,
        ssic_user_description: val,
      }));
    }
  };

  /* ── Address field updater ── */
  const updateAddr = (field, val) => setAddr(prev => ({ ...prev, [field]: val }));

  const isForeign = addrKey === 'FOREIGN' || addrKey === 'foreign';
  const modalSize = mode === 'history' ? 'lg' : 'md';

  /* ── Save handler ── */
  const handleSave = async () => {
    if (variant !== 'address' && !newValue.trim()) {
      setError(`Please enter the new ${fieldLabel}.`);
      return;
    }
    if (!effectiveDate) {
      setError('Please enter the changed date.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (variant === 'address' && onSaveAddress) {
        await onSaveAddress({ ...addr, effectiveDate, isProposed });
      } else if (variant === 'contact') {
        await onSave?.({ newValue: `${phoneCode}-${newValue}`, effectiveDate, isProposed });
      } else {
        await onSave?.({ newValue, effectiveDate, isProposed });
      }
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size={modalSize} centered scrollable>
      <ModalHeader toggle={onClose} className="bg-light p-3" style={{ fontSize: 13 }}>
        {mode === 'change' ? `Change — ${fieldLabel}` : `History — ${fieldLabel}`}
      </ModalHeader>

      {/* ══════════════ CHANGE MODE ══════════════ */}
      {mode === 'change' && (
        <>
          <ModalBody className="p-3">
            {error && (
              <div style={{ fontSize: 12, color: '#f06548', marginBottom: 10, display: 'flex', gap: 5, alignItems: 'center' }}>
                <i className="ri-error-warning-line" /> {error}
              </div>
            )}

            {/* ── SIMPLE ── */}
            {variant === 'simple' && (
              <Row2Col
                left={<LabeledInput label={`Old ${fieldLabel}`} value={oldValue} readOnly />}
                right={
                  <LabeledInput
                    required
                    label={`New ${fieldLabel}`}
                    value={newValue}
                    onChange={setNewValue}
                    placeholder={`Enter new ${fieldLabel}`}
                  />
                }
              />
            )}

            {/* ── ENTITY TYPE ── */}
            {variant === 'entity_type' && (
              <Row2Col
                left={<LabeledInput label="Old Entity Type" value={oldValue} readOnly />}
                right={
                  <div>
                    <label style={labelStyle}>
                      New Entity Type <span className="text-danger">*</span>
                    </label>
                    <Input
                      type="select"
                      bsSize="sm"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                    >
                      <option value="">Select entity type...</option>
                      {entityTypeOptions.map(n => (
                        <option key={n.company_type_id} value={n.company_type_id}>
                          {n.company_type_name || n.name}
                        </option>
                      ))}
                    </Input>
                  </div>
                }
              />
            )}

            {/* ── SSIC ── */}
            {variant === 'ssic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Row 1: SSIC Code */}
                <Row2Col
                  left={
                    <LabeledInput
                        label="Old SSIC Code"
                        value={((s) =>
                            s
                            ? `${s.ssic_code} — ${(s.ssic_description || s.description || '').substring(0, 50)}`
                            : ''
                        )(ssicCodes.find(item => Number(item.ssic_id) === Number(ssicOldParsed.ssic_id)))}
                        readOnly
                    />
                  }
                  right={
                    <div>
                      <label style={labelStyle}>
                        New SSIC Code <span className="text-danger">*</span>
                      </label>
                      <Input
                        type="select"
                        bsSize="sm"
                        value={ssicDisplayNewId}
                        onChange={e => handleSsicPick(e.target.value)}
                      >
                        <option value="">Select SSIC code…</option>
                        {ssicCodes.map(s => (
                          <option key={s.ssic_id} value={s.ssic_id}>
                            {s.ssic_code} — {(s.ssic_description || s.description || '').substring(0, 50)}
                          </option>
                        ))}
                      </Input>
                    </div>
                  }
                />

                {/* Row 2: Description (auto-filled, read-only) */}
                <Row2Col
                  left={
                    <LabeledInput
                      label="Old Description"
                      value={ssicOldParsed.ssic_description || ''}
                      readOnly
                    />
                  }
                  right={
                    <LabeledInput
                      label="New Description"
                      value={ssicDisplayNewDesc}
                      readOnly
                    />
                  }
                />

                {/* Row 3: User Described Activity */}
                <Row2Col
                  left={
                    <LabeledInput
                      label="Old User Described Activity"
                      value={ssicOldParsed.ssic_user_description || oldUserDescription || ''}
                      readOnly
                    />
                  }
                  right={
                    <LabeledInput
                      label="New User Described Activity"
                      value={newUserDescription}
                      onChange={handleUserDescriptionChange}
                      placeholder="Enter activity description"
                    />
                  }
                />
              </div>
            )}

            {/* ── CONTACT (mobile / telephone) ── */}
            {variant === 'contact' && (
              <Row2Col
                left={<LabeledInput label={`Old ${fieldLabel}`} value={oldValue} readOnly />}
                right={
                  <div>
                    <label style={labelStyle}>
                      New {fieldLabel} <span className="text-danger">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Input
                        type="select"
                        bsSize="sm"
                        style={{ width: 130, flexShrink: 0 }}
                        value={phoneCode}
                        onChange={e => setPhoneCode(e.target.value)}
                      >
                        {phoneCodes.length > 0
                          ? phoneCodes.map(p => (
                              <option key={p.value + p.countryName} value={p.value}>{p.label}</option>
                            ))
                          : <option value="+65">+65 (SG)</option>
                        }
                      </Input>
                      <Input
                        bsSize="sm"
                        placeholder="e.g. 91234567"
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                }
              />
            )}

            {/* ── ADDRESS ── */}
            {variant === 'address' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 4 }}>

                {/* left — current (read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#405189', marginBottom: 2 }}>
                    Current Address
                  </div>
                  {!isForeign && (
                    <LabeledInput label="Block / House No." value={addressExtra.houseNo    || ''} readOnly />
                  )}
                  <LabeledInput label="Street Name"         value={addressExtra.streetName || ''} readOnly />
                  {!isForeign && (
                    <>
                      <LabeledInput label="Building"         value={addressExtra.building   || ''} readOnly />
                      <LabeledInput label="Level"            value={addressExtra.level      || ''} readOnly />
                      <LabeledInput label="Unit No."         value={addressExtra.unitNo     || ''} readOnly />
                      <LabeledInput label="Country"          value={addressExtra.country    || ''} readOnly />
                      <LabeledInput label="State / Province" value={addressExtra.state      || ''} readOnly />
                      <LabeledInput label="City / Town"      value={addressExtra.city       || ''} readOnly />
                      <LabeledInput label="Postal Code"      value={addressExtra.postalCode || ''} readOnly />
                    </>
                  )}
                </div>

                {/* right — new (editable) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0ab39c', marginBottom: 2 }}>
                    New Address
                  </div>
                  {!isForeign && (
                    <LabeledInput
                      label="Block / House No."
                      value={addr.houseNo}
                      onChange={v => updateAddr('houseNo', v)}
                      placeholder="e.g. Blk 123"
                    />
                  )}
                  <LabeledInput
                    label="Street Name"
                    value={addr.streetName}
                    onChange={v => updateAddr('streetName', v)}
                    placeholder="e.g. Orchard Road"
                  />
                  {!isForeign && (
                    <>
                      <LabeledInput
                        label="Building"
                        value={addr.building}
                        onChange={v => updateAddr('building', v)}
                        placeholder="e.g. The Atrium"
                      />
                      <LabeledInput
                        label="Level"
                        value={addr.level}
                        onChange={v => updateAddr('level', v)}
                        placeholder="e.g. 05"
                      />
                      <LabeledInput
                        label="Unit No."
                        value={addr.unitNo}
                        onChange={v => updateAddr('unitNo', v)}
                        placeholder="e.g. 12"
                      />
                      <div>
                        <label style={labelStyle}>Country</label>
                        <Input
                          type="select"
                          bsSize="sm"
                          value={addr.country}
                          onChange={e => updateAddr('country', e.target.value)}
                        >
                          <option value="">Select country…</option>
                          {countries.map(c => (
                            <option key={c.country_id || c.id} value={c.country_name || c.name}>
                              {c.country_name || c.name}
                            </option>
                          ))}
                        </Input>
                      </div>
                      <LabeledInput
                        label="State / Province"
                        value={addr.state}
                        onChange={v => updateAddr('state', v)}
                        placeholder="e.g. Central Region"
                      />
                      <LabeledInput
                        label="City / Town"
                        value={addr.city}
                        onChange={v => updateAddr('city', v)}
                        placeholder="e.g. Singapore"
                      />
                      <LabeledInput
                        label="Postal Code"
                        value={addr.postalCode}
                        onChange={v => updateAddr('postalCode', v)}
                        placeholder="e.g. 238801"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Proposed / Effective — shared by all change variants ── */}
            <div className="mt-3 mb-3">
              <label style={labelStyle}>Proposed / Effective</label>
              <div className="d-flex gap-4">
                {[{ label: 'Proposed', val: true }, { label: 'Effective', val: false }].map(opt => (
                  <label
                    key={opt.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', fontWeight: 400 }}
                  >
                    <input
                      type="radio"
                      name="chg_proposed"
                      checked={isProposed === opt.val}
                      onChange={() => setIsProposed(opt.val)}
                      style={{ accentColor: '#405189' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* ── Changed Date ── */}
            <div>
              <label style={labelStyle}>
                Changed Date <span className="text-danger">*</span>
              </label>
              <DatePickerInput
                value={effectiveDate}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </ModalBody>

          <ModalFooter className="py-2">
            <Button type="button" color="light" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button type="button" color="success" size="sm" onClick={handleSave} disabled={saving}>
              {saving
                ? <><Spinner size="sm" className="me-1" />Saving…</>
                : <><i className="ri-save-line me-1" />Save</>}
            </Button>
          </ModalFooter>
        </>
      )}

      {/* ══════════════ HISTORY MODE ══════════════ */}
      {mode === 'history' && (
        <>
          <ModalBody className="p-3" style={{ minHeight: 120 }}>
            {historyLoading ? (
              <div className="d-flex justify-content-center align-items-center py-4">
                <Spinner color="primary" />
              </div>
            ) : historyRows.length === 0 ? (
              <div className="text-muted text-center py-4" style={{ fontSize: 13 }}>
                No change history found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table size="sm" bordered hover className="mb-0 align-middle" style={{ fontSize: 11 }}>
                  <thead style={{ background: 'var(--vz-light)' }}>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th style={{ minWidth: 140 }}>New Value</th>
                      <th style={{ minWidth: 140 }}>Old Value</th>
                      <th style={{ minWidth: 100 }}>Effective Date</th>
                      <th style={{ minWidth: 100 }}>Proposed Date</th>
                      <th style={{ minWidth: 110 }}>Date of Change</th>
                      <th style={{ minWidth: 100 }}>Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row, i) => {
                      const isFuture = row.effective_date && new Date(row.effective_date) > new Date();

                        let oldHistoryValue = row.old_value;
                        let newHistoryValue = row.new_value;

                        if (row?.field_type_id === 38) {

                            oldHistoryValue =
                                entityTypeOptions.find(
                                    item => Number(item.company_type_id) === Number(row.old_value)
                                )?.company_type_name || '';

                            newHistoryValue =
                                entityTypeOptions.find(
                                    item => Number(item.company_type_id) === Number(row.new_value)
                                )?.company_type_name || '';

                        }

                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><JsonValueCell raw={newHistoryValue} color="#0ab39c" ssicCodes={ssicCodes} /></td>
                          <td><JsonValueCell raw={oldHistoryValue} color="#f06548" ssicCodes={ssicCodes} /></td>
                          <td>
                            {row.effective_date ? (
                              <span style={{ color: isFuture ? '#f06548' : 'inherit' }}>
                                {fmtDate(row.effective_date)}
                              </span>
                            ) : '—'}
                          </td>
                          <td>{row.proposed_date ? fmtDate(row.proposed_date) : '—'}</td>
                          <td>{row.changed_date  ? fmtDate(row.changed_date)  : '—'}</td>
                          <td>{row.changed_by    || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="py-2">
            <Button type="button" color="light" size="sm" onClick={onClose}>
              <i className="ri-close-line me-1" />Close
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
};

export default CompanyChangeHistoryModal;
