import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Row, Input, FormFeedback } from 'reactstrap';
import FormField from '../components/FormField';

const validateEmail = (val) => {
  if (!val || !val.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? null : 'Invalid email format';
};

const validate8DigitPhone = (val, label) => {
  if (!val || !val.trim()) return null;
  const digits = val.replace(/\D/g, '');
  return digits.length === 8 ? null : `${label} must be exactly 8 digits`;
};

const splitRoles = (roles = '') => {
  if (roles && typeof roles === 'object' && !Array.isArray(roles)) {
    return Object.keys(roles).filter(Boolean);
  }

  if (Array.isArray(roles)) {
    return roles
      .map(role => role?.role_name || role?.official_master_slug || role)
      .filter(Boolean);
  }

  return String(roles)
    .split(',')
    .map(role => role.trim())
    .filter(Boolean);
};

const contactRoleSource = (contact = {}) => {
  const groups = contact.official_role_groups;
  if (groups && typeof groups === 'object' && !Array.isArray(groups) && Object.keys(groups).length) {
    return groups;
  }

  return contact.official_roles;
};

const sortCompanyContacts = (items = []) => [...items].sort((a, b) => {
  const companyA = String(a.entity_id || a.company_name || '').toLowerCase();
  const companyB = String(b.entity_id || b.company_name || '').toLowerCase();
  if (companyA !== companyB) return companyA.localeCompare(companyB, undefined, { numeric: true });

  const officialA = String(a.official_entity_id || '').toLowerCase();
  const officialB = String(b.official_entity_id || '').toLowerCase();
  if (officialA !== officialB) return officialA.localeCompare(officialB, undefined, { numeric: true });

  return Number(a.contact_id || 0) - Number(b.contact_id || 0);
});

const PhoneCodePicker = ({ value, onChange, phoneCodes }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();
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
      if (rect) setDropPos({ top: rect.bottom + window.scrollY + 3, left: rect.left + window.scrollX });
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

  const pick = (p) => {
    onChange(p.value);
    setOpen(false);
    setSearch('');
  };

  const dropdown = open && ReactDOM.createPortal(
    <div style={{
      position: 'absolute', top: dropPos.top, left: dropPos.left, zIndex: 9999,
      background: '#fff', border: '1px solid #ced4da', borderRadius: 6,
      boxShadow: '0 4px 16px rgba(0,0,0,.15)', width: 230,
    }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ position: 'relative' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6c757d', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search country or code..."
            style={{ width: '100%', border: '1px solid #ced4da', borderRadius: 4, padding: '4px 8px 4px 26px', fontSize: 11, outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <div style={{ padding: 10, fontSize: 11, color: '#6c757d', textAlign: 'center' }}>No results</div>
          : filtered.map(p => (
            <div
              key={p.value + p.countryName}
              onMouseDown={() => pick(p)}
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
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        height: 31, minWidth: 90, padding: '0 8px', border: '1px solid #ced4da', borderRadius: 4,
        background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 4, whiteSpace: 'nowrap', color: '#212529',
      }}>
        <span>{selected?.label || '+65'}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: '#6c757d' }} />
      </button>
      {dropdown}
    </div>
  );
};

const PhoneField = ({ icon, label, code, number, onCodeChange, onNumberChange, phoneCodes, error, placeholder }) => (
  <FormField md={6} label={label} icon={icon}>
    <div className="d-flex gap-2 align-items-start">
      <PhoneCodePicker value={code} onChange={onCodeChange} phoneCodes={phoneCodes} />
      <div style={{ flex: 1 }}>
        <Input
          type="number"
          bsSize="sm"
          placeholder={placeholder}
          value={number || ''}
          onChange={e => onNumberChange(e.target.value)}
          invalid={!!error}
        />
        {error && <FormFeedback style={{ display: 'block' }}>{error}</FormFeedback>}
      </div>
    </div>
  </FormField>
);

const Step6CompanyContacts = ({
  formData,
  updateFormData,
  countries = [],
  errors = [],
}) => {
  const [contacts, setContacts] = useState(() => sortCompanyContacts(formData.companyContacts || []));

  useEffect(() => {
    setContacts(sortCompanyContacts(formData.companyContacts || []));
  }, [formData.companyContacts]);

  const phoneCodes = useMemo(() => {
    const seen = new Set();
    const sorted = [
      ...countries.filter(c => c.iso === 'SG' || c.iso2 === 'SG'),
      ...countries
        .filter(c => c.iso !== 'SG' && c.iso2 !== 'SG')
        .sort((a, b) => (a.country_name || a.name || '').localeCompare(b.country_name || b.name || '')),
    ];
    const list = [];
    sorted.forEach(c => {
      const code = c.phonecode || c.phone_code;
      if (!code) return;
      const value = `+${String(code).replace(/^\+/, '')}`;
      const countryName = c.country_name || c.name || '';
      const iso = c.iso || c.iso2 || '';
      const key = `${value}-${countryName}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ value, label: `${value} (${iso})`, countryName, iso });
    });
    return list.length ? list : [{ value: '+65', label: '+65 (SG)', countryName: 'Singapore', iso: 'SG' }];
  }, [countries]);

  const updateContact = (index, field, value) => {
    const next = sortCompanyContacts(contacts.map((contact, i) => i === index ? { ...contact, [field]: value } : contact));
    setContacts(next);
    updateFormData({ companyContacts: next });
  };

  const hasStepError = errors.some(e => e.toLowerCase().includes('company contact'));

  return (
    
      <div className="d-flex flex-column gap-3">
        {contacts.map((contact, index) => {
          const itemErrors = {
            email: validateEmail(contact.email),
            mobile: validate8DigitPhone(contact.mobile, 'Mobile No'),
            telephone: validate8DigitPhone(contact.telephone, 'Telephone No'),
            office: validate8DigitPhone(contact.office, 'Office No'),
          };
          const roleList = splitRoles(contactRoleSource(contact));
          const contactHasErrors = Object.values(itemErrors).some(Boolean);

          return (
            <div
              key={contact.contact_id || index}
              style={{
                border: `1px solid ${contactHasErrors ? 'rgba(240,101,72,.35)' : 'var(--vz-border-color)'}`,
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--vz-card-bg, #fff)',
                boxShadow: contactHasErrors ? '0 8px 20px rgba(240,101,72,.06)' : '0 6px 18px rgba(15,23,42,.04)',
              }}
            >
              <div
                className="d-flex flex-wrap justify-content-between align-items-start gap-3"
                style={{
                  padding: '10px 16px',
                  background: contactHasErrors ? 'rgba(240,101,72,.035)' : 'linear-gradient(180deg, rgba(64,81,137,.055), rgba(64,81,137,.02))',
                  borderBottom: '1px solid var(--vz-border-color)',
                }}
              >
                <div style={{ minWidth: 220, flex: '1 1 280px' }}>
                  <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                    <span
                      className="d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'rgba(64,81,137,.1)',
                        color: '#405189',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ri-building-4-line" style={{ fontSize: 17 }}></i>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--vz-body-color)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={contact.company_name || `Company #${contact.entity_id || ''}`}
                      >
                        {contact.company_name || `Company #${contact.entity_id || ''}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="d-flex flex-wrap justify-content-end align-items-center gap-1"
                  style={{ flex: '1 1 260px', minWidth: 220 }}
                >
                  {roleList.length ? roleList.map(role => (
                    <span
                      key={role}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: '#405189',
                        background: 'rgba(64,81,137,.09)',
                        border: '1px solid rgba(64,81,137,.14)',
                        borderRadius: 20,
                        padding: '3px 9px',
                      }}
                    >
                      {role}
                    </span>
                  )) : (
                    <span style={{ fontSize: 11, color: 'var(--vz-sidebar-sub-item-color)' }}>No roles tagged</span>
                  )}
                </div>

                {contactHasErrors && (
                  <span
                    className="d-inline-flex align-items-center gap-1"
                    style={{
                      color: '#f06548',
                      background: 'rgba(240,101,72,.08)',
                      border: '1px solid rgba(240,101,72,.18)',
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <i className="ri-error-warning-line"></i>
                    Check fields
                  </span>
                )}
              </div>

              <div style={{ padding: 16 }}>
              <Row className="g-3">
                <FormField md={6} label="Email Address" icon="ri-mail-line fw-semibold">
                  <Input
                    bsSize="sm"
                    type="text"
                    placeholder="email@example.com"
                    value={contact.email || ''}
                    onChange={e => updateContact(index, 'email', e.target.value)}
                    invalid={!!itemErrors.email}
                  />
                  {itemErrors.email && <FormFeedback style={{ display: 'block' }}>{itemErrors.email}</FormFeedback>}
                </FormField>

                <PhoneField
                  icon="ri-smartphone-line fw-semibold"
                  label="Mobile No"
                  code={contact.mobile_code}
                  number={contact.mobile}
                  onCodeChange={v => updateContact(index, 'mobile_code', v)}
                  onNumberChange={v => updateContact(index, 'mobile', v)}
                  phoneCodes={phoneCodes}
                  error={itemErrors.mobile}
                  placeholder="90001234"
                />

                <PhoneField
                  icon="ri-phone-line fw-semibold"
                  label="Telephone No"
                  code={contact.telephone_code}
                  number={contact.telephone}
                  onCodeChange={v => updateContact(index, 'telephone_code', v)}
                  onNumberChange={v => updateContact(index, 'telephone', v)}
                  phoneCodes={phoneCodes}
                  error={itemErrors.telephone}
                  placeholder="61234567"
                />

                <PhoneField
                  icon="ri-building-line fw-semibold"
                  label="Office No"
                  code={contact.office_code}
                  number={contact.office}
                  onCodeChange={v => updateContact(index, 'office_code', v)}
                  onNumberChange={v => updateContact(index, 'office', v)}
                  phoneCodes={phoneCodes}
                  error={itemErrors.office}
                  placeholder="61234568"
                />

                <FormField md={6} label="Ext No." icon="ri-corner-up-right-line fw-semibold">
                  <Input
                    bsSize="sm"
                    type="text"
                    placeholder="101"
                    value={contact.ext_no || ''}
                    onChange={e => updateContact(index, 'ext_no', e.target.value)}
                  />
                </FormField>
              </Row>
              </div>
            </div>
          );
        })}
      </div>
  );
};

export default Step6CompanyContacts;
