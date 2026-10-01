import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Label, Input, FormFeedback } from 'reactstrap';

// ── Phone Code Picker (unchanged) ─────────────────────────────────────────────
const PhoneCodePicker = ({ value, onChange, phoneCodes, disabled }) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const [pos,    setPos]    = useState({ top: 0, left: 0 });
  const btnRef   = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.bottom + window.scrollY + 3, left: rect.left + window.scrollX });
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const selected = phoneCodes.find(p => p.value === value) || phoneCodes[0];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return phoneCodes;
    return phoneCodes.filter(p =>
      p.countryName.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
    );
  }, [search, phoneCodes]);

  const dropdown = open && !disabled && ReactDOM.createPortal(
    <div style={{
      position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999,
      background: '#fff', border: '1px solid #ced4da', borderRadius: 6,
      boxShadow: '0 4px 16px rgba(0,0,0,.15)', width: 230,
    }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search country or code..."
          style={{ width: '100%', border: '1px solid #ced4da', borderRadius: 4, padding: '4px 8px', fontSize: 11, outline: 'none' }}
        />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <div style={{ padding: 10, fontSize: 11, color: '#6c757d', textAlign: 'center' }}>No results</div>
          : filtered.map(p => (
            <div
              key={p.value + p.countryName}
              onMouseDown={() => { onChange(p.value); setOpen(false); setSearch(''); }}
              style={{
                padding: '6px 10px', cursor: 'pointer', fontSize: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: p.value === value ? 'rgba(64,81,137,.08)' : 'transparent',
                color: p.value === value ? '#405189' : '#212529',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(64,81,137,.06)'}
              onMouseLeave={e => e.currentTarget.style.background = p.value === value ? 'rgba(64,81,137,.08)' : 'transparent'}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>{p.countryName}</span>
              <span style={{ fontWeight: 600, flexShrink: 0, color: '#405189', fontSize: 11 }}>{p.label}</span>
            </div>
          ))
        }
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={btnRef} style={{ flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          height: 31, minWidth: 90, padding: '0 8px',
          border: '1px solid #ced4da', borderRadius: 4,
          background: disabled ? '#f8f9fa' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 4, whiteSpace: 'nowrap',
          color: disabled ? '#6c757d' : '#212529',
          opacity: disabled ? 0.75 : 1,
        }}
      >
        <span>{selected?.label || '+65'}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: '#6c757d' }}></i>
      </button>
      {dropdown}
    </div>
  );
};

// ── Validation helpers ────────────────────────────────────────────────────────
const validateEmail = (val) => {
  if (!val || !val.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? null : 'Invalid email format';
};

const validate8DigitPhone = (val, label) => {
  if (!val || !val.trim()) return null;
  const digits = val.replace(/\D/g, '');
  if (digits.length !== 8) return `${label} must be exactly 8 digits`;
  return null;
};

// ── Phone Field ───────────────────────────────────────────────────────────────
const PhoneField = ({ label, codeVal, numVal, onCodeChange, onNumChange, phoneCodes, placeholder, error }) => (
  <Col md={6}>
    <Label className="form-label fs-12 fw-semibold mb-1">{label}</Label>
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <PhoneCodePicker
        value={codeVal}
        onChange={onCodeChange}
        phoneCodes={phoneCodes}
      />
      <div style={{ flex: 1 }}>
        <Input
          bsSize="sm"
          placeholder={placeholder}
          value={numVal}
          onChange={e => onNumChange(e.target.value)}
          invalid={!!error}
        />
        {error && <FormFeedback style={{ display: 'block' }}>{error}</FormFeedback>}
      </div>
    </div>
  </Col>
);

// ── BLANK_CONTACT ─────────────────────────────────────────────────────────────
const BLANK_CONTACT = {
  contact_id:    null,
  email:         '',
  mobileCode:    '+65',
  mobile:        '',
  telephoneCode: '+65',
  telephone:     '',
  officeCode:    '+65',
  office:        '',
  ext:           '',
};

// ── Helper: map API contact object → internal state ───────────────────────────
const mapApiContact = (c) => ({
  contact_id:    c.contact_id    || null,
  email:         c.email         || '',
  mobileCode:    c.mobile_code   ? `+${String(c.mobile_code).replace(/^\+/, '')}` : '+65',
  mobile:        c.mobile        || '',
  telephoneCode: c.telephone_code ? `+${String(c.telephone_code).replace(/^\+/, '')}` : '+65',
  telephone:     c.telephone     || '',
  officeCode:    c.office_code   ? `+${String(c.office_code).replace(/^\+/, '')}` : '+65',
  office:        c.office        || '',
  ext:           c.ext_no        || '',
});

const roleLabels = (contact = {}) => {
  if (
    contact.official_role_groups &&
    typeof contact.official_role_groups === 'object' &&
    Object.keys(contact.official_role_groups).length
  ) {
    return Object.keys(contact.official_role_groups).filter(Boolean).join(', ');
  }
  if (
    contact.official_roles &&
    typeof contact.official_roles === 'object' &&
    Object.keys(contact.official_roles).length
  ) {
    return Object.keys(contact.official_roles).filter(Boolean).join(', ');
  }
  return String(contact.official_roles || '').trim();
};

const contactOptionLabel = (c, index) => {
  const base = c.email
    ? `${c.email}${c.mobile ? ` | ${c.mobile}` : ''}`
    : c.mobile
      ? c.mobile
      : `Contact ${index + 1}`;
  const roles = roleLabels(c);

  return roles ? `${base} (${roles})` : base;
};

// ── Main Component ────────────────────────────────────────────────────────────
const OfficialContactSection = ({
  value,
  onChange,
  countries = [],
  existingContacts = [],
  defaultContactId = null,
}) => {

  const [selectedExistingId, setSelectedExistingId] = useState('');

  // ── Sync selectedExistingId when defaultContactId arrives (edit mode async load)
  useEffect(() => {
    if (defaultContactId) {
      setSelectedExistingId(String(defaultContactId));
    } else {
      setSelectedExistingId('');
    }
  }, [defaultContactId]);

  const phoneCodes = useMemo(() => {
    const seen  = new Set();
    const codes = [];
    const sorted = [
      ...countries.filter(c => c.iso === 'SG' || c.iso2 === 'SG'),
      ...countries
        .filter(c => c.iso !== 'SG' && c.iso2 !== 'SG')
        .sort((a, b) => (a.country_name || a.name || '').localeCompare(b.country_name || b.name || '')),
    ];
    sorted.forEach(c => {
      const code = c.phonecode || c.phone_code;
      if (!code) return;
      const val  = `+${String(code).replace(/^\+/, '')}`;
      const name = c.country_name || c.name || '';
      const iso  = c.iso || c.iso2 || '';
      const key  = val + name;
      if (seen.has(key)) return;
      seen.add(key);
      codes.push({ value: val, label: `${val} (${iso})`, countryName: name, iso });
    });
    if (!codes.length) codes.push({ value: '+65', label: '+65 (SG)', countryName: 'Singapore', iso: 'SG' });
    return codes;
  }, [countries]);

  const contact = value || BLANK_CONTACT;

  // Always allow editing — just call onChange directly
  const set = (field, val) => onChange({ ...contact, [field]: val });

  // ── Handle existing contact selection ─────────────────────────────────────
  const handleExistingSelect = (e) => {
    const id = e.target.value;
    setSelectedExistingId(id);

    if (!id) {
      // "New Contact" selected — reset to blank, no contact_id so backend inserts new
      onChange({ ...BLANK_CONTACT });
      return;
    }

    // Load the selected existing contact into fields (editable)
    const found = existingContacts.find(c => String(c.contact_id) === String(id));
    if (found) {
      onChange(mapApiContact(found));
    }
  };

  // ── Live validation ───────────────────────────────────────────────────────
  const errors = {
    email:     validateEmail(contact.email),
    mobile:    validate8DigitPhone(contact.mobile,    'Mobile No'),
    telephone: validate8DigitPhone(contact.telephone, 'Telephone No'),
    office:    validate8DigitPhone(contact.office,    'Office No'),
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div style={{
      border: '1px solid var(--vz-border-color)',
      borderRadius: 10,
      padding: '16px 18px',
      background: 'var(--vz-card-bg, #fff)',
      marginTop: 4,
    }}>

      {/* ── Existing Contact Picker ── */}
      {existingContacts.length > 0 && (
        <Row className="mb-3">
          <Col md={6}>
            <Label className="form-label fs-12 fw-semibold mb-1">
              <i className="ri-contacts-line me-1 text-primary"></i>
              Select Existing Contact
            </Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                type="select"
                bsSize="sm"
                value={selectedExistingId}
                onChange={handleExistingSelect}
                style={{ flex: 1 }}
              >
                <option value="">— New Contact —</option>
                {existingContacts.map((c, i) => (
                  <option key={c.contact_id} value={c.contact_id}>
                    {contactOptionLabel(c, i)}
                  </option>
                ))}
              </Input>
              {selectedExistingId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExistingId('');
                    onChange({ ...BLANK_CONTACT });
                  }}
                  title="Clear — enter new contact details"
                  style={{
                    flexShrink: 0, height: 31, padding: '0 10px',
                    border: '1px solid #ced4da', borderRadius: 4,
                    background: '#fff', cursor: 'pointer', fontSize: 11,
                    color: '#6c757d', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <i className="ri-close-line"></i> Clear
                </button>
              )}
            </div>

            {/* Status hint */}
            {selectedExistingId ? (
              <div style={{ fontSize: 11, color: '#0ab39c', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ri-edit-line"></i>
                Editing existing contact — changes will update this contact record.
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#878a99', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ri-add-line"></i>
                Filling in details will create a new contact record.
              </div>
            )}
          </Col>
        </Row>
      )}

      {/* ── Divider ── */}
      {existingContacts.length > 0 && (
        <div style={{
          borderTop: '1px dashed var(--vz-border-color)',
          marginBottom: 16,
          paddingTop: 4,
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {selectedExistingId ? 'Contact Details (Editable)' : 'New Contact Details'}
          </span>
        </div>
      )}

      <Row className="g-3">

        {/* ── Email ── */}
        <Col md={6}>
          <Label className="form-label fs-12 fw-semibold mb-1">
            <i className="ri-mail-line me-1 text-primary"></i>
            Email Address
          </Label>
          <Input
            bsSize="sm"
            type="text"
            placeholder="email@example.com"
            value={contact.email}
            onChange={e => set('email', e.target.value)}
            invalid={!!errors.email}
          />
          {errors.email && <FormFeedback style={{ display: 'block' }}>{errors.email}</FormFeedback>}
        </Col>

        {/* ── Mobile No ── */}
        <PhoneField
          label={<><i className="ri-smartphone-line me-1 text-primary"></i>Mobile No</>}
          codeVal={contact.mobileCode}
          numVal={contact.mobile}
          onCodeChange={v => set('mobileCode', v)}
          onNumChange={v  => set('mobile', v)}
          phoneCodes={phoneCodes}
          placeholder="e.g. 90001234"
          error={errors.mobile}
        />

        {/* ── Telephone No ── */}
        <PhoneField
          label={<><i className="ri-phone-line me-1 text-primary"></i>Telephone No</>}
          codeVal={contact.telephoneCode}
          numVal={contact.telephone}
          onCodeChange={v => set('telephoneCode', v)}
          onNumChange={v  => set('telephone', v)}
          phoneCodes={phoneCodes}
          placeholder="e.g. 61234567"
          error={errors.telephone}
        />

        {/* ── Office No ── */}
        <PhoneField
          label={<><i className="ri-building-line me-1 text-primary"></i>Office No</>}
          codeVal={contact.officeCode}
          numVal={contact.office}
          onCodeChange={v => set('officeCode', v)}
          onNumChange={v  => set('office', v)}
          phoneCodes={phoneCodes}
          placeholder="e.g. 61234568"
          error={errors.office}
        />

        {/* ── Ext No ── */}
        <Col md={6}>
          <Label className="form-label fs-12 fw-semibold mb-1">
            <i className="ri-corner-up-right-line me-1 text-primary"></i>
            Ext No.
          </Label>
          <Input
            bsSize="sm"
            type="text"
            placeholder="e.g. 101"
            value={contact.ext}
            onChange={e => set('ext', e.target.value)}
          />
        </Col>

      </Row>

      {/* ── Validation summary ── */}
      {hasErrors && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: 'rgba(240,101,72,.06)',
          border: '1px solid rgba(240,101,72,.2)',
          borderRadius: 6, fontSize: 11.5, color: '#f06548',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className="ri-error-warning-line" style={{ fontSize: 14 }}></i>
          Please fix the errors above before saving.
        </div>
      )}
    </div>
  );
};

export { BLANK_CONTACT, mapApiContact };
export default OfficialContactSection;
