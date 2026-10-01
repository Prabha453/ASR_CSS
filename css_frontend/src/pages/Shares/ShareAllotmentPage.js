import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Card, CardBody, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getCompany,
  getEntityShareList,
  getOfficialList,
  createShareAllotment,
  getShareTxnList,
} from '../../helpers/backend_helper';
import './ShareAllotmentPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEC_COLORS = ['#405189', '#0ab39c', '#6559cc', '#f7b84b', '#f06548'];

const TX_TYPES = [
  { value: 'ALLOTMENT', label: 'Allotment' },
  { value: 'BONUS',     label: 'Bonus' },
  { value: 'OPENING',   label: 'Opening Balance' },
];

const SHARE_TYPE_LABELS = { NORMAL: 'Ordinary', BONUS: 'Bonus', GUARANTEE: 'Guarantee' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v, d = 2) => v == null || v === '' ? '' : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const shareLabel = (s) =>
  `${SHARE_TYPE_LABELS[s.share_type] || s.share_type}${s.share_class?.sc_name ? ` · ${s.share_class.sc_name}` : ''}`;

// ── UI Helpers ────────────────────────────────────────────────────────────────
const SecHead = ({ num, title }) => {
  const color = SEC_COLORS[(parseInt(num, 10) - 1) % SEC_COLORS.length];
  return (
    <div className="aop-sec-head">
      <div className="aop-sec-num" style={{ background: color, boxShadow: `0 2px 8px ${color}66` }}>{num}</div>
      <div className="aop-sec-title" style={{ color }}>{title}</div>
      <div className="aop-sec-line" style={{ background: `linear-gradient(to right, ${color}55, transparent)` }} />
    </div>
  );
};

const Lbl = ({ children, required }) => (
  <div className="aop-lbl">{children}{required && <span style={{ color: '#f06548', marginLeft: 2 }}>*</span>}</div>
);

const RadioGroup = ({ name, options, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
    {options.map(o => (
      <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, userSelect: 'none' }}>
        <input type="radio" name={name} value={o.value} checked={value === o.value}
          onChange={() => onChange(o.value)}
          style={{ width: 15, height: 15, accentColor: '#405189', cursor: 'pointer' }} />
        {o.label}
      </label>
    ))}
  </div>
);

// ── Share Selection Modal ─────────────────────────────────────────────────────
const ShareModal = ({ shares, initialLines, onAdd, onClose }) => {
  // inputs keyed by share.id: { qty, cash, oc, noConsid }
  const [inputs, setInputs] = useState(() => {
    const seed = {};
    initialLines.forEach(l => {
      seed[l.shareId] = { qty: l.noOfShares, cash: l.cash, oc: l.oc, noConsid: l.noConsideration };
    });
    return seed;
  });

  const upd = (shareId, field, val) =>
    setInputs(prev => ({ ...prev, [shareId]: { ...(prev[shareId] || {}), [field]: val } }));

  const handleAdd = () => {
    const selected = shares.filter(s => Number((inputs[s.id] || {}).qty || 0) > 0);
    if (!selected.length) { toast.warn('Enter number of shares for at least one share class'); return; }
    onAdd(selected.map(s => {
      const inp = inputs[s.id] || {};
      const qty = Number(inp.qty || 0);
      const perShare = Number(s.per_share || 0);
      const balance = Number(s.number_of_shares || 0) - Number(s.allotted_shares || 0);
      if (balance > 0 && qty > balance) {
        toast.error(`${shareLabel(s)} @ ${perShare.toFixed(2)}: qty (${qty}) exceeds balance (${balance})`);
        return null;
      }
      return {
        id: Date.now() + Math.random(),
        shareId: s.id,
        currency: s.currency,
        shareType: s.share_type,
        shareClassName: s.share_class?.sc_name || '',
        perShare,
        balance,
        noOfShares: String(qty),
        cash: inp.cash || '',
        oc: inp.oc || '',
        noConsideration: inp.noConsid || '',
        distinctiveFrom: '',
        distinctiveTo: '',
        remarks: '',
      };
    }).filter(Boolean));
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--vz-card-bg, #fff)', borderRadius: 10, width: '95%', maxWidth: 960,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
      }}>
        {/* Modal header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--vz-body-color)' }}>
            <i className="ri-stack-line me-2" style={{ color: '#405189' }} />Share Allotment — Select Share Classes
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#878a99', lineHeight: 1 }}>×</button>
        </div>

        {/* Modal body — scrollable table */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--vz-light)', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={thS}>Share Type</th>
                <th style={thS}>$ Rate</th>
                <th style={thS}>No of Shares</th>
                <th style={thS}>Balance</th>
                <th style={{ ...thS, background: 'rgba(64,81,137,.06)', color: '#405189' }}>No. to Allot *</th>
                <th style={thS}>Issued <span style={autoTag}>auto</span></th>
                <th style={thS}>Paid <span style={autoTag}>auto</span></th>
                <th style={thS}>Cash</th>
                <th style={thS}>Otherwise in Cash</th>
                <th style={thS}>C + OC <span style={autoTag}>auto</span></th>
                <th style={thS}>No Consideration</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((s, idx) => {
                const inp = inputs[s.id] || {};
                const qty = Number(inp.qty || 0);
                const perShare = Number(s.per_share || 0);
                const balance = Number(s.number_of_shares || 0) - Number(s.allotted_shares || 0);
                const issued = qty * perShare;
                const paidup = issued;
                const noConsid = !!inp.noConsid;
                const cash = noConsid ? 0 : Number(inp.cash || 0);
                const oc = noConsid ? 0 : Number(inp.oc || 0);
                const coc = cash + oc;
                const isSelected = qty > 0;
                const rowBg = isSelected ? 'rgba(64,81,137,.04)' : (idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)');
                return (
                  <tr key={s.id} style={{ background: rowBg, borderBottom: '1px solid var(--vz-border-color)' }}>
                    <td style={tdS}>
                      <div style={{ fontWeight: 600, color: 'var(--vz-body-color)' }}>{SHARE_TYPE_LABELS[s.share_type] || s.share_type}</div>
                      {s.share_class?.sc_name && <div style={{ fontSize: 11, color: '#878a99' }}>{s.share_class.sc_name}</div>}
                    </td>
                    <td style={{ ...tdS, fontWeight: 700, color: '#405189', fontVariantNumeric: 'tabular-nums' }}>{perShare.toFixed(2)}</td>
                    <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums' }}>{Number(s.number_of_shares || 0).toLocaleString()}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: balance > 0 ? '#0ab39c' : '#f06548', fontVariantNumeric: 'tabular-nums' }}>{balance.toLocaleString()}</td>
                    <td style={{ ...tdS, background: 'rgba(64,81,137,.04)' }}>
                      <input type="number" min="0"
                        value={inp.qty || ''}
                        onChange={e => {
                          const newQty = e.target.value;
                          setInputs(prev => {
                            const curr = prev[s.id] || {};
                            const noC = !!curr.noConsid;
                            // Auto-fill cash = qty × perShare (user can still override)
                            const autoCash = !noC && perShare > 0 && Number(newQty) > 0
                              ? (Number(newQty) * perShare).toFixed(2) : '';
                            return { ...prev, [s.id]: { ...curr, qty: newQty, cash: autoCash } };
                          });
                        }}
                        style={{ ...modalInput, borderColor: isSelected ? '#405189' : undefined }}
                        placeholder="0"
                      />
                    </td>
                    <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums', color: issued > 0 ? 'var(--vz-body-color)' : '#c0c7d6' }}>{issued > 0 ? fmt(issued) : '—'}</td>
                    <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums', color: paidup > 0 ? 'var(--vz-body-color)' : '#c0c7d6' }}>{paidup > 0 ? fmt(paidup) : '—'}</td>
                    <td style={tdS}>
                      <input type="number" min="0" step="0.01"
                        value={inp.cash || ''}
                        onChange={e => upd(s.id, 'cash', e.target.value)}
                        disabled={noConsid}
                        style={{ ...modalInput, ...(noConsid ? { background: '#f8f9fa', color: '#c0c7d6' } : {}) }}
                        placeholder="0.00"
                      />
                    </td>
                    <td style={tdS}>
                      <input type="number" min="0" step="0.01"
                        value={inp.oc || ''}
                        onChange={e => upd(s.id, 'oc', e.target.value)}
                        disabled={noConsid}
                        style={{ ...modalInput, ...(noConsid ? { background: '#f8f9fa', color: '#c0c7d6' } : {}) }}
                        placeholder="0.00"
                      />
                    </td>
                    <td style={{ ...tdS, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: coc > 0 ? '#0ab39c' : '#c0c7d6' }}>{coc > 0 ? fmt(coc) : '—'}</td>
                    <td style={tdS}>
                      <input type="text"
                        value={inp.noConsid || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setInputs(prev => {
                            const curr = prev[s.id] || {};
                            if (val) {
                              // No consideration filled → clear cash/oc
                              return { ...prev, [s.id]: { ...curr, noConsid: val, cash: '', oc: '' } };
                            }
                            // Cleared → restore cash to auto value
                            const qty = Number(curr.qty || 0);
                            const autoCash = perShare > 0 && qty > 0
                              ? (qty * perShare).toFixed(2) : '';
                            return { ...prev, [s.id]: { ...curr, noConsid: val, cash: autoCash } };
                          });
                        }}
                        style={modalInput}
                        placeholder="e.g. Gift"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--vz-border-color)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-light btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-success btn-sm" onClick={handleAdd}>
            <i className="ri-add-line me-1" />Add
          </button>
        </div>
      </div>
    </div>
  );
};

// inline styles reused inside modal
const thS = { padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#495057', whiteSpace: 'nowrap', borderBottom: '2px solid var(--vz-border-color)' };
const tdS = { padding: '8px 10px', verticalAlign: 'middle' };
const autoTag = { fontSize: 10, fontWeight: 600, color: '#0ab39c', background: 'rgba(10,179,156,.12)', borderRadius: 3, padding: '1px 5px', marginLeft: 3 };
const modalInput = { width: '100%', minWidth: 80, padding: '4px 7px', fontSize: 12, border: '1px solid #ced4da', borderRadius: 5, outline: 'none', background: 'var(--vz-card-bg, #fff)', color: 'var(--vz-body-color)' };

// ── Certificate Line Row ──────────────────────────────────────────────────────
const CertLineRow = ({ line, idx, onUpdate, onRemove }) => {
  const qty = Number(line.noOfShares || 0);
  const issued = qty * Number(line.perShare || 0);
  const noConsid = !!line.noConsideration;
  const cash = noConsid ? 0 : Number(line.cash || 0);
  const oc = noConsid ? 0 : Number(line.oc || 0);
  const coc = cash + oc;

  return (
    <tr style={{ borderBottom: '1px solid var(--vz-border-color)', fontSize: 13 }}>
      <td style={{ ...tdS, fontWeight: 700, color: '#405189', textAlign: 'center', width: 32 }}>{idx + 1}</td>
      <td style={tdS}>
        <div style={{ fontWeight: 600, color: 'var(--vz-body-color)', whiteSpace: 'nowrap' }}>
          {SHARE_TYPE_LABELS[line.shareType] || line.shareType}
          {line.shareClassName && <span style={{ fontSize: 11, color: '#878a99', marginLeft: 4 }}>· {line.shareClassName}</span>}
        </div>
        <div style={{ fontSize: 11, color: '#878a99' }}>{line.currency} · @{Number(line.perShare || 0).toFixed(2)}/share</div>
      </td>
      <td style={{ ...tdS, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#405189' }}>{qty.toLocaleString()}</td>
      <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums' }}>{issued > 0 ? fmt(issued) : '—'}</td>
      <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums' }}>{issued > 0 ? fmt(issued) : '—'}</td>
      <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums', color: coc > 0 ? '#0ab39c' : '#c0c7d6', fontWeight: 600 }}>
        {noConsid ? <span style={{ fontSize: 11, color: '#6559cc' }}>No Consid.</span> : (coc > 0 ? fmt(coc) : '—')}
      </td>
      <td style={tdS}>
        <input type="text" value={line.distinctiveFrom} placeholder="e.g. 1"
          onChange={e => onUpdate('distinctiveFrom', e.target.value)}
          style={{ ...modalInput, minWidth: 70 }} />
      </td>
      <td style={tdS}>
        <input type="text" value={line.distinctiveTo} placeholder="e.g. 100"
          onChange={e => onUpdate('distinctiveTo', e.target.value)}
          style={{ ...modalInput, minWidth: 70 }} />
      </td>
      <td style={tdS}>
        <input type="text" value={line.remarks} placeholder="Optional"
          onChange={e => onUpdate('remarks', e.target.value)}
          style={{ ...modalInput, minWidth: 80 }} />
      </td>
      <td style={{ ...tdS, textAlign: 'center' }}>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f06548', fontSize: 15, padding: '2px 6px' }}>
          <i className="ri-delete-bin-line" />
        </button>
      </td>
    </tr>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ShareAllotmentPage = () => {
  useCollapseSidebar();
  const { entity_id } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();

  const [company,      setCompany]      = useState(state?.company || null);
  const [shares,       setShares]       = useState([]);
  const [shareholders, setShareholders] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showModal,    setShowModal]    = useState(false);

  // Certificate lines — each line = one share class being allotted
  const [certLines, setCertLines] = useState([]);

  // Context share (when navigating from a specific share class row)
  const contextShare = state?.company_share || null;

  // Header fields
  const [shareholderId, setShareholderId] = useState('');
  const [txType,        setTxType]        = useState('ALLOTMENT');
  const [typeOfShares,  setTypeOfShares]  = useState('ALLOTMENT');
  const [mergeShare,    setMergeShare]    = useState('NEW');
  const [txDate,        setTxDate]        = useState('');
  const [folioNo,       setFolioNo]       = useState('');
  const [folioAutoFilled, setFolioAutoFilled] = useState(false);
  const [certNo,        setCertNo]        = useState('');
  const [allotmentNo,   setAllotmentNo]   = useState('A');
  const [isUbo,         setIsUbo]         = useState('NO');
  const [txStatus,      setTxStatus]      = useState('ACTIVE');
  const [hasInstalment, setHasInstalment] = useState('NO');
  const [paymentDate,   setPaymentDate]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, shareRes] = await Promise.all([
        company ? Promise.resolve({ data: company }) : getCompany(entity_id),
        getEntityShareList(entity_id, { limit: 500 }),
      ]);
      if (!company) setCompany(compRes?.data || compRes || null);
      setShares(shareRes?.data?.data || shareRes?.data || []);
      const shRes = await getOfficialList({ entity_id, official_master_slug: 'shareholders', limit: 500 }).catch(() => ({}));
      setShareholders(shRes?.data?.data || shRes?.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [entity_id, company]);

  useEffect(() => { load(); }, [load]);

  // Auto-fill folio when shareholder is selected — find their existing txn matching currency/share class
  useEffect(() => {
    if (!shareholderId || !entity_id) { setFolioNo(''); setFolioAutoFilled(false); return; }
    const selected = shareholders.find(s => String(s.official_id) === String(shareholderId));
    const officialEntityId = selected?.official_entity_id;
    if (!officialEntityId) { setFolioNo(''); setFolioAutoFilled(false); return; }
    const apiParams = { official_entity_id: officialEntityId, limit: 500 };
    if (contextShare?.id) apiParams.company_share_id = contextShare.id;
    getShareTxnList(entity_id, apiParams)
      .then(res => {
        const txns = res?.data?.data || res?.data || [];
        const match = txns.find(t => !!t.folio_no);
        setFolioNo(match?.folio_no || '');
        setFolioAutoFilled(!!match?.folio_no);
      })
      .catch(() => { setFolioNo(''); setFolioAutoFilled(false); });
  }, [shareholderId, entity_id, contextShare, shareholders]);

  const selectedShareholder = shareholders.find(s => String(s.official_id) === shareholderId);

  // When context share exists, restrict modal to same currency + share class only.
  // This prevents mixing SGD and AED shares in one allotment operation.
  const modalShares = contextShare
    ? shares.filter(s =>
        s.currency      === contextShare.currency &&
        s.share_class_id === contextShare.share_class_id
      )
    : shares;

  const updateCertLine = (id, field, val) =>
    setCertLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  const removeCertLine = (id) => setCertLines(prev => prev.filter(l => l.id !== id));

  const handleModalAdd = (newLines) => {
    // Replace existing lines with whatever came from the modal
    setCertLines(newLines);
  };

  // Totals across all cert lines
  const totals = certLines.reduce((acc, l) => {
    const qty    = Number(l.noOfShares || 0);
    const issued = qty * Number(l.perShare || 0);
    const noC    = !!l.noConsideration;
    const coc    = noC ? 0 : (Number(l.cash || 0) + Number(l.oc || 0));
    return { qty: acc.qty + qty, issued: acc.issued + issued, coc: acc.coc + coc };
  }, { qty: 0, issued: 0, coc: 0 });

  const handleSave = async (withWorkflow = false) => {
    if (!shareholderId)       { toast.error('Select a shareholder'); return; }
    if (!txDate)              { toast.error('Enter transaction date'); return; }
    if (!folioNo)             { toast.error('Folio No. is required'); return; }
    if (!certNo)              { toast.error('Share Cert No. is required'); return; }
    if (certLines.length === 0) { toast.error('Add shares via the "Add Shares" button first'); return; }

    for (let i = 0; i < certLines.length; i++) {
      const l = certLines[i];
      const qty = Number(l.noOfShares || 0);
      if (!qty) continue;
      const noC = !!l.noConsideration;
      const coc = Number(l.cash || 0) + Number(l.oc || 0);
      if (!noC && coc === 0) {
        toast.error(`Line ${i + 1} (${shareLabel({ share_type: l.shareType, share_class: { sc_name: l.shareClassName } })}): Enter Cash or Otherwise in Cash, or fill No Consideration`);
        return;
      }
    }

    setSaving(true);
    try {
      for (const l of certLines) {
        const qty = Number(l.noOfShares || 0);
        if (!qty) continue;
        const payload = {
          entity_id:       Number(entity_id),
          company_share_id: Number(l.shareId),
          official_id:     Number(shareholderId),
          tx_type:         txType,
          type_of_shares:  typeOfShares,
          merge_share:     mergeShare,
          tx_date:         txDate,
          folio_no:        folioNo || null,
          cert_no:         certNo  || null,
          allotment_no:    allotmentNo || null,
          tx_status:       txStatus,
          is_ubo:          isUbo === 'YES',
          has_instalment:  hasInstalment,
          payment_date:    paymentDate || null,
          distinctive_from: l.distinctiveFrom || null,
          distinctive_to:   l.distinctiveTo   || null,
          lines: [{
            no_of_shares:     qty,
            cash:             l.cash || null,
            otherwise_cash:   l.oc   || null,
            no_consideration: l.noConsideration || '',
          }],
        };
        const res = await createShareAllotment(payload);
        if (res?.data?.status === false) {
          toast.error(res.data.message || `Failed to save allotment for ${shareLabel({ share_type: l.shareType, share_class: { sc_name: l.shareClassName } })}`);
          setSaving(false);
          return;
        }
      }
      toast.success(withWorkflow ? 'Allotment saved & sent to workflow' : 'Share allotment saved successfully');
      navigate(`/company/${entity_id}/shares/shareholder-register`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: '#878a99' }}>
          <Spinner size="sm" style={{ color: '#405189' }} /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="sap-wrap">
        <BreadCrumb title="Add Allotment" pageTitle="Shareholder Shares" />

        {/* Company context strip */}
        <div className="sap-context-strip">
          <div className="es-company-avatar" style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
            {(company?.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vz-body-color)' }}>{company?.name || '—'}</div>
            {company?.identifications?.[0]?.uen_no && (
              <div style={{ fontSize: 11, color: '#878a99' }}>UEN: {company.identifications[0].uen_no}</div>
            )}
          </div>
          {certLines.length > 0 && (
            <div className="sap-share-hint" style={{ margin: 0 }}>
              <span><i className="ri-stack-line" /> {certLines.length} share class{certLines.length > 1 ? 'es' : ''}</span>
              <span><i className="ri-scales-line" /> {totals.qty.toLocaleString()} total shares</span>
            </div>
          )}
          <button className="sap-back-btn" onClick={() => navigate(-1)}>
            <i className="ri-arrow-left-line" /> Back
          </button>
        </div>

        <Row>
          {/* ── Left column ── */}
          <Col lg={8}>

            {/* Section 1 — Shareholder */}
            <Card className="sap-card">
              <CardBody>
                <SecHead num="1" title="Shareholder" />
                <Row>
                  <Col md={9} className="mb-3">
                    <Lbl required>Shareholder</Lbl>
                    <select className="form-select form-select-sm"
                      value={shareholderId} onChange={e => setShareholderId(e.target.value)}>
                      <option value="">— Select shareholder —</option>
                      {shareholders.map(s => {
                        const name = s.official_entity?.name || `Official #${s.official_id}`;
                        const clientNo = s.official_entity?.client_no;
                        return (
                          <option key={s.official_id} value={s.official_id}>
                            {name}{clientNo ? ` (${clientNo})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {shareholders.length === 0 && (
                      <div className="sap-warn">
                        <i className="ri-information-line" /> No shareholders found. Add shareholders first.
                      </div>
                    )}
                  </Col>
                  <Col md={3} className="mb-3">
                    <Lbl required>UBO</Lbl>
                    <RadioGroup name="ubo" value={isUbo} onChange={setIsUbo}
                      options={[{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }]} />
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Section 2 — Transaction Header */}
            <Card className="sap-card">
              <CardBody>
                <SecHead num="2" title="Transaction Header" />
                <Row>
                  <Col md={6} className="mb-3">
                    <Lbl required>Type of Transaction</Lbl>
                    <select className="form-select form-select-sm"
                      value={txType} onChange={e => setTxType(e.target.value)}>
                      {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl required>Date of Transaction</Lbl>
                    <DatePickerInput value={txDate} onChange={e => setTxDate(e.target.value)} style={{ width: '100%' }} />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl required>Type of Shares</Lbl>
                    <RadioGroup name="typeOfShares" value={typeOfShares} onChange={setTypeOfShares}
                      options={[{ value: 'ALLOTMENT', label: 'Allotment' }, { value: 'SUBSCRIBER', label: 'Subscriber' }, { value: 'BALANCE', label: 'Balance' }]} />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl required>Merge Share?</Lbl>
                    <RadioGroup name="mergeShare" value={mergeShare} onChange={setMergeShare}
                      options={[{ value: 'NEW', label: 'New cert' }, { value: 'EXISTING', label: 'Existing cert' }]} />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl required>Folio No.</Lbl>
                    <input className="form-control form-control-sm" placeholder="e.g. 5"
                      value={folioNo} onChange={e => setFolioNo(e.target.value)}
                      disabled={folioAutoFilled} />
                    {folioAutoFilled && (
                      <div style={{ fontSize: 11, color: '#0ab39c', marginTop: 3 }}>
                        <i className="ri-check-line" /> Auto-filled from existing record
                      </div>
                    )}
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl required>Share Cert No.</Lbl>
                    <input className="form-control form-control-sm" placeholder="e.g. CERT-001"
                      value={certNo} onChange={e => setCertNo(e.target.value)} />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Lbl>Allotment No.</Lbl>
                    <input className="form-control form-control-sm" placeholder="e.g. A"
                      value={allotmentNo} onChange={e => setAllotmentNo(e.target.value)} />
                  </Col>

                  <Col md={6} className="mb-1">
                    <Lbl>Status</Lbl>
                    <select className="form-select form-select-sm" value={txStatus} onChange={e => setTxStatus(e.target.value)}>
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="CEASED">Ceased</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Section 3 — Share Certificate Lines */}
            <Card className="sap-card">
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SecHead num="3" title="Add Shares Certificate" />
                  <button
                    className="btn btn-success btn-sm d-flex align-items-center gap-1 sap-add-line-btn"
                    onClick={() => setShowModal(true)}
                    disabled={modalShares.length === 0}
                    title={modalShares.length === 0 ? 'No share classes defined for this company' : 'Select share classes to allot'}
                  >
                    <i className="ri-add-line" /> Add Shares
                  </button>
                </div>

                {modalShares.length === 0 && (
                  <div className="sap-warn" style={{ marginBottom: 12 }}>
                    <i className="ri-information-line" /> No share classes found. Add share classes in the Company Shares page first.
                  </div>
                )}

                {certLines.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#878a99' }}>
                    <i className="ri-stack-line" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: '#c0c7d6' }} />
                    <div style={{ fontSize: 13 }}>Click <strong>Add Shares</strong> to select share classes and enter allotment details</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--vz-light)', borderBottom: '2px solid var(--vz-border-color)' }}>
                          <th style={thS}>#</th>
                          <th style={thS}>Share Class</th>
                          <th style={thS}>No of Shares</th>
                          <th style={thS}>Issued Capital <span style={autoTag}>auto</span></th>
                          <th style={thS}>Paid Up Capital <span style={autoTag}>auto</span></th>
                          <th style={thS}>Total Consideration Paid</th>
                          <th style={thS}>Distinctive No From</th>
                          <th style={thS}>Distinctive No To</th>
                          <th style={thS}>Remarks</th>
                          <th style={thS}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {certLines.map((l, i) => (
                          <CertLineRow
                            key={l.id}
                            line={l}
                            idx={i}
                            onUpdate={(field, val) => updateCertLine(l.id, field, val)}
                            onRemove={() => removeCertLine(l.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Section 4 — Installment */}
            <Card className="sap-card">
              <CardBody>
                <SecHead num="4" title="Installment / Partial Payments" />
                <Row>
                  <Col md={6} className="mb-3">
                    <Lbl required>Installment / Partial Payments</Lbl>
                    <select className="form-select form-select-sm"
                      value={hasInstalment} onChange={e => setHasInstalment(e.target.value)}>
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </Col>
                  {hasInstalment === 'YES' && (
                    <>
                      <Col md={6} className="mb-3">
                        <Lbl>Payment Date</Lbl>
                        <DatePickerInput value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%' }} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Lbl>Upload Document</Lbl>
                        <input type="file" className="form-control form-control-sm" />
                      </Col>
                    </>
                  )}
                </Row>
              </CardBody>
            </Card>

          </Col>

          {/* ── Right column — Summary ── */}
          <Col lg={4}>
            <Card className="sap-card sap-summary-card">
              <CardBody>
                <div className="sap-summary-title"><i className="ri-file-list-3-line" /> Summary</div>

                <div className="sap-summary-section">
                  <div className="sap-summary-label">Shareholder</div>
                  <div className="sap-summary-val">
                    {selectedShareholder
                      ? (selectedShareholder.official_entity?.name || `Official #${shareholderId}`)
                      : <span className="sap-summary-empty">Not selected</span>}
                  </div>
                </div>

                <div className="sap-summary-section">
                  <div className="sap-summary-label">Transaction</div>
                  <div className="sap-summary-val">
                    {TX_TYPES.find(t => t.value === txType)?.label || '—'}
                    {txDate && <span style={{ color: '#878a99', fontWeight: 400 }}> · {txDate}</span>}
                  </div>
                </div>

                <div className="sap-summary-section" style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div className="sap-summary-label">Type of Shares</div>
                    <div className="sap-summary-val" style={{ fontSize: 12 }}>{typeOfShares}</div>
                  </div>
                  <div>
                    <div className="sap-summary-label">Merge Share</div>
                    <div className="sap-summary-val" style={{ fontSize: 12 }}>{mergeShare === 'NEW' ? 'New cert' : 'Existing cert'}</div>
                  </div>
                  <div>
                    <div className="sap-summary-label">UBO</div>
                    <div className="sap-summary-val" style={{ fontSize: 12 }}>{isUbo}</div>
                  </div>
                </div>

                {/* Share class breakdown */}
                {certLines.length > 0 && (
                  <>
                    <div className="sap-summary-divider" />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6 }}>Share Classes</div>
                    {certLines.map(l => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, padding: '4px 8px', background: 'rgba(64,81,137,.04)', borderRadius: 5 }}>
                        <span style={{ color: '#495057' }}>
                          {SHARE_TYPE_LABELS[l.shareType] || l.shareType}{l.shareClassName ? ` · ${l.shareClassName}` : ''} @{Number(l.perShare || 0).toFixed(2)}
                        </span>
                        <strong style={{ color: '#405189', fontVariantNumeric: 'tabular-nums' }}>{Number(l.noOfShares || 0).toLocaleString()}</strong>
                      </div>
                    ))}
                  </>
                )}

                <div className="sap-summary-divider" />

                <div className="sap-summary-stat">
                  <span>Total Shares</span>
                  <strong style={{ color: '#405189' }}>{totals.qty ? totals.qty.toLocaleString() : '—'}</strong>
                </div>
                <div className="sap-summary-stat">
                  <span>Issued Capital</span>
                  <strong style={{ color: '#c49a0a' }}>{totals.issued ? `${certLines[0]?.currency || 'SGD'} ${fmt(totals.issued)}` : '—'}</strong>
                </div>
                <div className="sap-summary-stat">
                  <span>Total Consideration (C+OC)</span>
                  <strong>{totals.coc ? `${certLines[0]?.currency || 'SGD'} ${fmt(totals.coc)}` : '—'}</strong>
                </div>
                <div className="sap-summary-stat">
                  <span>Cert Lines</span>
                  <strong>{certLines.length}</strong>
                </div>

                <div className="sap-summary-divider" />

                <div className="sap-summary-stat" style={{ fontSize: 11 }}>
                  <span>Folio No.</span><span style={{ color: 'var(--vz-body-color)', fontWeight: 600 }}>{folioNo || '—'}</span>
                </div>
                <div className="sap-summary-stat" style={{ fontSize: 11 }}>
                  <span>Cert No.</span><span style={{ color: 'var(--vz-body-color)', fontWeight: 600 }}>{certNo || '—'}</span>
                </div>
                <div className="sap-summary-stat" style={{ fontSize: 11 }}>
                  <span>Allotment No.</span><span style={{ color: 'var(--vz-body-color)', fontWeight: 600 }}>{allotmentNo || '—'}</span>
                </div>

                <div className="sap-summary-divider" />

                <div className="sap-actions">
                  <button className="btn btn-success sap-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <><Spinner size="sm" /> Saving...</> : <><i className="ri-save-line" /> Save Allotment</>}
                  </button>
                  <button className="btn btn-warning sap-save-btn" style={{ height: 36, fontSize: 13 }} onClick={() => handleSave(true)} disabled={saving}>
                    <i className="ri-git-branch-line" /> Save & Workflow
                  </button>
                  <button className="btn btn-light sap-cancel-btn"
                    onClick={() => navigate(`/company/${entity_id}/shares/shareholder-register`)}>
                    <i className="ri-arrow-left-line" /> Back
                  </button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Share selection modal — filtered to same currency + class as context */}
      {showModal && (
        <ShareModal
          shares={modalShares}
          initialLines={certLines}
          onAdd={handleModalAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ShareAllotmentPage;
