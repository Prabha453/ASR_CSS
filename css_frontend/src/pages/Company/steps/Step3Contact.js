import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Input, Label, Button } from 'reactstrap';
import SectionBlock from '../components/SectionBlock';
import ChangeHistoryModal from '../components/ChangeHistoryModal';

const CONTACT_TYPE_ID = {
  email:     11,
  mobile:    12,
  telephone: 13,
};

// ── Searchable phone-code picker (portal) ─────────────────────────────────────

const PhoneCodePicker = ({ value, onChange, phoneCodes }) => {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState('');
  const [dropPos, setDropPos] = useState({ top:0, left:0 });
  const btnRef   = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
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
    return phoneCodes.filter(p => p.countryName.toLowerCase().includes(q) || p.label.toLowerCase().includes(q));
  }, [search, phoneCodes]);

  const pick = (p) => { onChange(p.value); setOpen(false); setSearch(''); };

  const dropdown = open && ReactDOM.createPortal(
    <div style={{
      position:'absolute', top:dropPos.top, left:dropPos.left, zIndex:9999,
      background:'#fff', border:'1px solid #ced4da', borderRadius:6,
      boxShadow:'0 4px 16px rgba(0,0,0,.15)', width:230,
    }}>
      <div style={{ padding:'6px 8px', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ position:'relative' }}>
          <i className="ri-search-line" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#6c757d', pointerEvents:'none' }}></i>
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search country or code..."
            style={{ width:'100%', border:'1px solid #ced4da', borderRadius:4, padding:'4px 8px 4px 26px', fontSize:11, outline:'none' }} />
        </div>
      </div>
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {filtered.length === 0
          ? <div style={{ padding:10, fontSize:11, color:'#6c757d', textAlign:'center' }}>No results</div>
          : filtered.map(p => (
            <div key={p.value + p.countryName} onMouseDown={() => pick(p)}
              style={{ padding:'6px 10px', cursor:'pointer', fontSize:12, display:'flex', justifyContent:'space-between', alignItems:'center',
                background: p.value === value ? 'rgba(64,81,137,.08)' : 'transparent',
                color: p.value === value ? '#405189' : '#212529' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(64,81,137,.06)'}
              onMouseLeave={e => e.currentTarget.style.background= p.value===value ? 'rgba(64,81,137,.08)' : 'transparent'}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:6 }}>{p.countryName}</span>
              <span style={{ fontWeight:600, flexShrink:0, color:'#405189', fontSize:11 }}>{p.label}</span>
            </div>
          ))
        }
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={btnRef} style={{ flexShrink:0 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        height:31, minWidth:90, padding:'0 8px', border:'1px solid #ced4da', borderRadius:4,
        background:'#fff', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center',
        justifyContent:'space-between', gap:4, whiteSpace:'nowrap', color:'#212529',
      }}>
        <span>{selected?.label || '+65'}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize:14, color:'#6c757d' }}></i>
      </button>
      {dropdown}
    </div>
  );
};

// ── Primary badge / set-primary button ────────────────────────────────────────

const PrimaryBadge = ({ isPrimary, onSet }) =>
  isPrimary ? (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'rgba(10,179,156,.12)', color:'#0ab39c', whiteSpace:'nowrap' }}>
      <i className="ri-star-fill"></i> Primary
    </span>
  ) : (
    <button type="button" onClick={onSet} style={{
      background:'none', border:'1px solid #dee2e6', borderRadius:20, fontSize:10, fontWeight:500,
      padding:'2px 8px', cursor:'pointer', color:'#6c757d', display:'inline-flex', alignItems:'center', gap:3, whiteSpace:'nowrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#0ab39c'; e.currentTarget.style.color='#0ab39c'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#dee2e6'; e.currentTarget.style.color='#6c757d'; }}>
      <i className="ri-star-line"></i> Set Primary
    </button>
  );

// ── Change + History inline buttons ──
const ChangeHistoryBtns = ({ onChangeClick, onHistoryClick }) => (
  <div className="d-flex gap-1">
    {onChangeClick && (
      <Button type="button" size="sm" color="info"
        style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
        onClick={onChangeClick}>
        <i className="ri-edit-2-line me-1"></i>Change
      </Button>
    )}
    {onHistoryClick && (
      <Button type="button" size="sm" color="info"
        style={{ padding: '0px 6px', fontSize: 10, lineHeight: 1.6 }}
        onClick={onHistoryClick}>
        <i className="ri-history-line me-1"></i>History
      </Button>
    )}
  </div>
);

// ── Email list ────────────────────────────────────────────────────────────────

const EmailList = ({ emails, onChange, isEditMode, onChangeClick, onHistoryClick }) => {
  const update    = (idx, val) => onChange(emails.map((e, i) => i===idx ? { ...e, email:val } : e));
  const setPrimary = (idx) => onChange(emails.map((e, i) => ({ ...e, isPrimary: i===idx })));
  const remove    = (idx) => {
    const next = emails.filter((_, i) => i !== idx);
    if (!next.some(e => e.isPrimary) && next.length) next[0] = { ...next[0], isPrimary:true };
    onChange(next);
  };
  const add = () => onChange([...emails, { email:'', isPrimary:false, contact_id:null }]);

  return (
    <div>
      {emails.map((e, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <Input bsSize="sm" type="email" placeholder="email@example.com"
            value={e.email} onChange={ev => update(i, ev.target.value)} style={{ flex:1 }} />
          <PrimaryBadge isPrimary={e.isPrimary} onSet={() => setPrimary(i)} />
          {isEditMode && e.contact_id && (
            <ChangeHistoryBtns
              onChangeClick={() => onChangeClick(i)}
              onHistoryClick={() => onHistoryClick(i)}
            />
          )}
          {emails.length > 1 && (
            <button type="button" onClick={() => remove(i)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#adb5bd', fontSize:16, lineHeight:1, padding:2 }}
              onMouseEnter={e => e.currentTarget.style.color='#f06548'}
              onMouseLeave={e => e.currentTarget.style.color='#adb5bd'}>
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add}
        style={{ background:'none', border:'1px dashed #ced4da', borderRadius:5, padding:'4px 12px', fontSize:11, color:'#6c757d', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
        <i className="ri-add-line"></i> Add Email
      </button>
    </div>
  );
};

// ── Mobile list ───────────────────────────────────────────────────────────────

const MobileList = ({ mobiles, onChange, phoneCodes, isEditMode, onChangeClick, onHistoryClick }) => {
  const update    = (idx, field, val) => onChange(mobiles.map((m, i) => i===idx ? { ...m, [field]:val } : m));
  const setPrimary = (idx) => onChange(mobiles.map((m, i) => ({ ...m, isPrimary: i===idx })));
  const remove    = (idx) => {
    const next = mobiles.filter((_, i) => i !== idx);
    if (!next.some(m => m.isPrimary) && next.length) next[0] = { ...next[0], isPrimary:true };
    onChange(next);
  };
  const add = () => onChange([...mobiles, { code:'+65', number:'', isPrimary:false, contact_id:null }]);

  return (
    <div>
      {mobiles.map((m, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <PhoneCodePicker value={m.code||'+65'} onChange={v => update(i,'code',v)} phoneCodes={phoneCodes} />
          <Input bsSize="sm" placeholder="9000 0000"
            value={m.number} onChange={ev => update(i,'number',ev.target.value)} style={{ flex:1 }} />
          <PrimaryBadge isPrimary={m.isPrimary} onSet={() => setPrimary(i)} />
          {isEditMode && m.contact_id && (
            <ChangeHistoryBtns
              onChangeClick={() => onChangeClick(i)}
              onHistoryClick={() => onHistoryClick(i)}
            />
          )}
          {mobiles.length > 1 && (
            <button type="button" onClick={() => remove(i)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#adb5bd', fontSize:16, lineHeight:1, padding:2 }}
              onMouseEnter={e => e.currentTarget.style.color='#f06548'}
              onMouseLeave={e => e.currentTarget.style.color='#adb5bd'}>
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add}
        style={{ background:'none', border:'1px dashed #ced4da', borderRadius:5, padding:'4px 12px', fontSize:11, color:'#6c757d', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
        <i className="ri-add-line"></i> Add Mobile
      </button>
    </div>
  );
};

// ── Single phone row (telephone) ────────────────────────────────────────────────

const PhoneRow = ({ codeField, numField, data, onChange, placeholder, isEditMode, onChangeClick, onHistoryClick }) => (
  <div>
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <PhoneCodePicker value={data[codeField]||'+65'} onChange={v => onChange(codeField, v)} phoneCodes={data._phoneCodes||[]} />
      <Input bsSize="sm" placeholder={placeholder}
        value={data[numField]||''} onChange={e => onChange(numField, e.target.value)} style={{ flex:1 }} />
    </div>
    {isEditMode && onChangeClick && (
      <div className="mt-1">
      <ChangeHistoryBtns
        onChangeClick={onChangeClick}
        onHistoryClick={onHistoryClick}
      />
      </div>
    )}
  </div>
);

// ── Main step component ───────────────────────────────────────────────────────

const Step3Contact = ({
  formData,
  updateFormData,
  countries = [],
  isEditMode = false,
  entityId = null,
  onFetchHistory,
  onSaveChange,
  registerValidationError,
  onValidityChange,
}) => {
  const init = formData.contactDetails || {};

  const [emails,  setEmails]  = useState(init.emails?.length  ? init.emails  : [{ email:'', isPrimary:true, contact_id:null }]);
  const [mobiles, setMobiles] = useState(init.mobiles?.length ? init.mobiles : [{ code:'+65', number:'', isPrimary:true, contact_id:null }]);
  const [contact, setContact] = useState({
    telephoneCode:      init.telephoneCode      || '+65',
    telephone:          init.telephone          || '',
    telephoneContactId: init.telephoneContactId || null,
    faxCode:            init.faxCode            || '+65',
    fax:                init.fax                || '',
    faxContactId:       init.faxContactId       || null,
    website:            init.website            || '',
    websiteContactId:   init.websiteContactId   || null,
  });

  useEffect(() => {
    const hasEmail = emails.some(e => e.email?.trim());
    registerValidationError?.('step3_email', hasEmail ? null : 'At least one email address is required.');
    // No cleanup: the parent's global Save gate should keep seeing this
    // step's last-known validity even after the user navigates away from it.
    onValidityChange?.(hasEmail);
  }, [emails, registerValidationError]);

  /* ── Change / History modal state ── */
  const MODAL_INIT = { open: false, mode: 'change', fieldKey: null, label: '', oldValue: '', rowIndex: null, historyRows: [], historyLoading: false };
  const [modal, setModal] = useState(MODAL_INIT);

  const phoneCodes = useMemo(() => {
    const seen = new Set();
    const codes = [];
    const sorted = [
      ...countries.filter(c => c.iso === 'SG'),
      ...countries.filter(c => c.iso !== 'SG').sort((a, b) => (a.country_name||'').localeCompare(b.country_name||'')),
    ];
    sorted.forEach(c => {
      if (!c.phonecode) return;
      const val = `+${c.phonecode}`;
      const key = val + c.country_name;
      if (seen.has(key)) return;
      seen.add(key);
      codes.push({ value:val, label:`+${c.phonecode} (${c.iso})`, countryName: c.country_name||c.iso, iso: c.iso });
    });
    if (!codes.length) codes.push({ value:'+65', label:'+65 (SG)', countryName:'Singapore', iso:'SG' });
    return codes;
  }, [countries]);

  const sync = (nextEmails, nextMobiles, nextContact) => {
    const e = nextEmails  ?? emails;
    const m = nextMobiles ?? mobiles;
    const c = nextContact ?? contact;
    updateFormData({ contactDetails: { ...c, emails: e, mobiles: m } });
  };

  const onEmailsChange  = (next) => { setEmails(next);  sync(next, null, null); };
  const onMobilesChange = (next) => { setMobiles(next); sync(null, next, null); };
  const updateContact   = (field, value) => {
    const updated = { ...contact, [field]: value };
    setContact(updated);
    sync(null, null, updated);
  };

  const contactWithCodes = { ...contact, _phoneCodes: phoneCodes };

  /* ── open helpers ── */
  const openChange = (fieldKey, label, oldValue, rowIndex = null) =>
    setModal({ open: true, mode: 'change', fieldKey, label, oldValue, rowIndex, historyRows: [], historyLoading: false });

  const openHistory = async (fieldKey, label, rowIndex = null) => {
    const typeId = CONTACT_TYPE_ID[fieldKey];
    setModal({ open: true, mode: 'history', fieldKey, label, oldValue: '', rowIndex, historyRows: [], historyLoading: true });
    try {
      let refId = null;
      if (fieldKey === 'email')     refId = emails[rowIndex]?.contact_id   ?? null;
      if (fieldKey === 'mobile')    refId = mobiles[rowIndex]?.contact_id  ?? null;
      if (fieldKey === 'telephone') refId = contact.telephoneContactId     ?? null;

      const rows = await onFetchHistory?.(fieldKey, typeId, null, refId);
      setModal(m => ({ ...m, historyRows: rows || [], historyLoading: false }));
    } catch {
      setModal(m => ({ ...m, historyRows: [], historyLoading: false }));
    }
  };

  /* ── save change ── */
  const handleSaveChange = async ({ newValue, effectiveDate, isProposed }) => {
    const { fieldKey, rowIndex } = modal;

    if (fieldKey === 'email') {
      const next = emails.map((e, i) => i === rowIndex ? { ...e, email: newValue } : e);
      setEmails(next);
      sync(next, null, null);
    } else if (fieldKey === 'mobile') {
      const next = mobiles.map((m, i) => i === rowIndex ? { ...m, number: newValue } : m);
      setMobiles(next);
      sync(null, next, null);
    } else if (fieldKey === 'telephone') {
      updateContact('telephone', newValue);
    }

    let refId = null;
    if (fieldKey === 'email')     refId = emails[rowIndex]?.contact_id   ?? null;
    if (fieldKey === 'mobile')    refId = mobiles[rowIndex]?.contact_id  ?? null;
    if (fieldKey === 'telephone') refId = contact.telephoneContactId     ?? null;
    
    const typeId = CONTACT_TYPE_ID[fieldKey] ?? CONTACT_TYPE_ID.email;
    await onSaveChange?.({
      field:            fieldKey,
      fieldTypeId:      typeId,
      oldValue:         modal.oldValue,
      newValue,
      effectiveDate,
      isProposed,
      refId,
    });

    setModal(MODAL_INIT);
  };

  return (
    <>
      {/* ── Change / History Modal ── */}
      <ChangeHistoryModal
        isOpen={modal.open}
        mode={modal.mode}
        fieldLabel={modal.label}
        oldValue={modal.oldValue}
        onClose={() => setModal(MODAL_INIT)}
        onSave={handleSaveChange}
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
      />

      <SectionBlock title="Company Contact Details">
        <Row className="g-4">

          <Col md={6}>
            <Label className="form-label fs-12 fw-semibold">
              <i className="ri-mail-line me-1 text-primary"></i>Email Address
            </Label>
            <EmailList 
              emails={emails} 
              onChange={onEmailsChange}
              isEditMode={isEditMode}
              onChangeClick={(i) => openChange('email', 'Email Address', emails[i]?.email || '', i)}
              onHistoryClick={(i) => openHistory('email', 'Email Address', i)}
            />
          </Col>

          <Col md={6}>
            <Label className="form-label fs-12 fw-semibold">
              <i className="ri-smartphone-line me-1 text-primary"></i>Mobile Number
            </Label>
            <MobileList 
              mobiles={mobiles} 
              onChange={onMobilesChange} 
              phoneCodes={phoneCodes}
              isEditMode={isEditMode}
              onChangeClick={(i) => openChange('mobile', 'Mobile Number', mobiles[i]?.number || '', i)}
              onHistoryClick={(i) => openHistory('mobile', 'Mobile Number', i)}
            />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12 fw-semibold">
              <i className="ri-phone-line me-1 text-primary"></i>Telephone Number
            </Label>
            <PhoneRow 
              codeField="telephoneCode" 
              numField="telephone"
              data={contactWithCodes} 
              onChange={updateContact} 
              placeholder="6000 0000"
              isEditMode={isEditMode}
              onChangeClick={() => openChange('telephone', 'Telephone Number', contact.telephone || '')}
              onHistoryClick={() => openHistory('telephone', 'Telephone Number')}
            />
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12 fw-semibold">
              <i className="ri-printer-line me-1 text-primary"></i>Fax
            </Label>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <PhoneCodePicker value={contact.faxCode||'+65'} onChange={v => updateContact('faxCode', v)} phoneCodes={phoneCodes} />
              <Input bsSize="sm" placeholder="6000 0001"
                value={contact.fax} onChange={e => updateContact('fax', e.target.value)} style={{ flex:1 }} />
            </div>
          </Col>

          <Col md={4}>
            <Label className="form-label fs-12 fw-semibold">
              <i className="ri-global-line me-1 text-primary"></i>Website
            </Label>
            <Input bsSize="sm" placeholder="https://www.example.com"
              value={contact.website} onChange={e => updateContact('website', e.target.value)} />
          </Col>

        </Row>
      </SectionBlock>
    </>
  );
};

export default Step3Contact;