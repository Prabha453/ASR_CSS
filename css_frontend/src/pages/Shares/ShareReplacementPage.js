'use strict';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import SharePageStrip from '../../Components/Common/SharePageStrip';
import { getCompany, createShareReplacement, checkReplacementCert, listCompatibleReplacementCerts } from '../../helpers/backend_helper';
import './ShareReplacementPage.css';

const fmt2   = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (v, d = 2) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const SHARE_TYPE_LABELS = { NORMAL: 'Ordinary', BONUS: 'Bonus', GUARANTEE: 'Guarantee' };

// ── Main Page ─────────────────────────────────────────────────────────────────
const ShareReplacementPage = () => {
  useCollapseSidebar();
  const { entity_id } = useParams();
  const navigate      = useNavigate();
  const { state }     = useLocation();

  const txn     = state?.txn    || null;
  const share   = state?.share  || null;

  const [company,  setCompany]  = useState(state?.company || null);
  const [loading,  setLoading]  = useState(!state?.company);
  const [saving,   setSaving]   = useState(false);

  // Header fields
  const [replNo,   setReplNo]   = useState('');
  const [replDate, setReplDate] = useState('');
  const [remarks,  setRemarks]  = useState('');

  // Cert fields
  const [newCertNo,  setNewCertNo]  = useState('');
  const [newFolioNo, setNewFolioNo] = useState('');

  // Existing-cert check (auto on type)
  const [checking,     setChecking]     = useState(false);
  const [existingInfo, setExistingInfo] = useState(null); // null | { exists, no_of_shares, per_share, ... }
  const [certCheckErr, setCertCheckErr] = useState('');
  const checkTimerRef = useRef(null);

  // Existing cert picker dropdown
  const [compatCerts,    setCompatCerts]    = useState([]);
  const [loadingCompat,  setLoadingCompat]  = useState(false);
  const [showPicker,     setShowPicker]     = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!txn) { navigate(-1); return; }
    if (company) { setLoading(false); return; }
    getCompany(entity_id)
      .then(r => setCompany(r?.data || r))
      .finally(() => setLoading(false));
  }, [entity_id, txn, navigate]);

  // Shared cert check — called immediately (picker) or via debounce (typing)
  const runCertCheck = useCallback(async (certNo) => {
    if (!certNo.trim() || !txn) return;
    setChecking(true);
    setExistingInfo(null);
    setCertCheckErr('');
    try {
      const res = await checkReplacementCert({
        entity_id,
        cert_no:       certNo.trim(),
        source_txn_id: txn.share_transaction_id,
      });
      const info = res?.data || res;
      setExistingInfo(info);
      if (info?.exists) {
        const srcPS = Number(txn.per_share);
        const psMatches = Number(info.per_share) === srcPS;
        // Different per_share: allowed — insert fresh, don't touch existing cert
        if (psMatches) {
          if (info.share_class_id !== txn.share_class_id)
            setCertCheckErr('Existing cert has a different share class — cannot combine');
          else if (info.share_type !== txn.share_type)
            setCertCheckErr('Existing cert has a different share type — cannot combine');
          else if (info.currency !== txn.currency)
            setCertCheckErr('Existing cert has a different currency — cannot combine');
          else if (info.official_entity_id !== txn.official_entity_id)
            setCertCheckErr('Existing cert belongs to a different shareholder — cannot combine');
        }
      }
    } catch {
      setExistingInfo(null);
    } finally {
      setChecking(false);
    }
  }, [entity_id, txn]);

  // Debounce check as user types cert no.
  useEffect(() => {
    clearTimeout(checkTimerRef.current);
    setExistingInfo(null);
    setCertCheckErr('');
    if (!newCertNo.trim() || !txn) return;
    checkTimerRef.current = setTimeout(() => runCertCheck(newCertNo), 600);
  }, [newCertNo, txn, runCertCheck]);

  const handleOpenPicker = useCallback(async () => {
    if (!txn) return;
    setShowPicker(p => !p);
    if (compatCerts.length > 0) return; // already loaded
    setLoadingCompat(true);
    try {
      const res = await listCompatibleReplacementCerts({ entity_id, source_txn_id: txn.share_transaction_id });
      setCompatCerts(res?.data?.certs || res?.certs || []);
    } catch {
      setCompatCerts([]);
    } finally {
      setLoadingCompat(false);
    }
  }, [txn, entity_id, compatCerts.length]);

  const handleSelectCompatCert = useCallback((cert) => {
    const certNo = cert.share_cert_no || '';
    setNewCertNo(certNo);
    setShowPicker(false);
    // Fire check immediately — don't wait for debounce
    clearTimeout(checkTimerRef.current);
    runCertCheck(certNo);
  }, [runCertCheck]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleSave = useCallback(async () => {
    if (!txn) return;
    if (!replDate) { toast.error('Date of replacement is required'); return; }
    if (!newCertNo.trim()) { toast.error('New cert no. is required'); return; }
    if (certCheckErr) { toast.error(certCheckErr); return; }

    setSaving(true);
    try {
      await createShareReplacement({
        entity_id,
        source_txn_id:    txn.share_transaction_id,
        replacement_no:   replNo || undefined,
        replacement_date: replDate,
        remarks:          remarks || undefined,
        new_cert_no:      newCertNo.trim(),
        new_folio_no:     newFolioNo.trim() || undefined,
      });
      toast.success('Replacement saved successfully');
      navigate(`/company/${entity_id}/shares/shareholder-register`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save replacement');
    } finally {
      setSaving(false);
    }
  }, [txn, entity_id, replNo, replDate, remarks, newCertNo, newFolioNo, certCheckErr, navigate]);

  if (loading) return (
    <div className="page-content">
      <Container fluid>
        <div className="srp-loading"><Spinner size="sm" /> Loading…</div>
      </Container>
    </div>
  );
  if (!txn) return null;

  const companyName = company?.name || '—';
  const _rawST      = share?.share_type || txn?.share_type || '';
  const currency    = share?.currency   || txn?.currency   || '—';
  const shareType   = SHARE_TYPE_LABELS[_rawST] || _rawST || '—';
  const scType      = share?.share_class?.sc_type || txn?.share_class?.sc_type || null;

  const srcShares = Number(txn.no_of_shares || 0);
  const srcPS     = Number(txn.per_share || 0);
  const srcPaidup = Number(txn.paidup_share_capital || 0);

  const exPSMatches          = existingInfo?.exists && Number(existingInfo.per_share || 0) === srcPS;
  const isExistingCompatible = existingInfo?.exists && !certCheckErr && exPSMatches; // same per_share → combine
  const isExistingDiffPS     = existingInfo?.exists && !certCheckErr && !exPSMatches; // diff per_share → insert fresh
  const exQty = isExistingCompatible ? Number(existingInfo.no_of_shares || 0) : 0;
  const combinedQty = srcShares + exQty;

  const certStatusClass = !newCertNo.trim() ? '' :
    certCheckErr ? ' srp-cert-status--err' :
    isExistingCompatible ? ' srp-cert-status--combine' :
    isExistingDiffPS ? ' srp-cert-status--new' :
    existingInfo && !existingInfo.exists ? ' srp-cert-status--new' : '';

  const certStatusText = !newCertNo.trim() ? null :
    checking ? 'Checking…' :
    certCheckErr ? certCheckErr :
    isExistingCompatible ? `Existing cert — will combine (${fmtNum(exQty, 0)} + ${fmtNum(srcShares, 0)} = ${fmtNum(combinedQty, 0)} shares)` :
    isExistingDiffPS ? `Cert no. already used (per share ${fmt2(Number(existingInfo.per_share))}) — will insert fresh, existing cert untouched` :
    existingInfo && !existingInfo.exists ? 'New cert no. — will be created fresh' : null;

  return (
    <div className="page-content">
      <Container fluid>
        <SharePageStrip
          companyName={companyName}
          currency={currency}
          shareType={shareType}
          scType={scType}
          actionLabel={`Replacement for Lost Cert · ${txn.share_cert_no || '—'}`}
          actionIcon="ri-file-copy-2-line"
          actionVariant="cancel"
          onBack={() => navigate(-1)}
        />

        {/* ── Details card ── */}
        <div className="srp-details-card">
          <div className="srp-details-row">
            <div className="srp-field-group">
              <label className="srp-lbl">Replacement No.</label>
              <input className="srp-input" value={replNo} onChange={e => setReplNo(e.target.value)} placeholder="e.g. RPL-001" />
            </div>
            <div className="srp-field-group">
              <label className="srp-lbl">Date of Replacement <span className="srp-req">*</span></label>
              <DatePickerInput value={replDate} onChange={e => setReplDate(e?.target?.value ?? e)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="srp-field-group srp-field-group--remarks">
              <label className="srp-lbl">Remarks</label>
              <input className="srp-input" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        </div>

        {/* ── Cert card ── */}
        <div className="srp-cert-card">
          {/* LEFT: source info */}
          <div className="srp-src-panel">
            <div className="srp-src-badge">
              <i className="ri-file-paper-2-line" />
              <div className="srp-src-badge-info">
                <span className="srp-src-cert">Cert: {txn.share_cert_no || '—'}</span>
                {txn.folio_no && <span className="srp-src-folio">Folio: {txn.folio_no}</span>}
              </div>
            </div>
            <div className="srp-src-holder">
              <i className="ri-user-line" />
              <span className="srp-src-holder-name">{txn.official_entity?.name || '—'}</span>
            </div>
            <div className="srp-src-stats">
              <div className="srp-src-stat"><span className="srp-src-stat-lbl">No. of Shares</span><span className="srp-src-stat-val">{fmtNum(srcShares, 0)}</span></div>
              <div className="srp-src-stat"><span className="srp-src-stat-lbl">Per Share</span><span className="srp-src-stat-val">{fmt2(srcPS)}</span></div>
              <div className="srp-src-stat"><span className="srp-src-stat-lbl">Paid-up Capital</span><span className="srp-src-stat-val">{fmt2(srcPaidup)}</span></div>
              {txn.share_type && <div className="srp-src-stat"><span className="srp-src-stat-lbl">Share Type</span><span className="srp-src-stat-val">{txn.share_type}</span></div>}
            </div>
          </div>

          {/* RIGHT: replacement inputs */}
          <div className="srp-repl-panel">
            <div className="srp-section-hdr srp-section-hdr--repl">
              <i className="ri-file-copy-2-line" /> Replacement Details
            </div>

            <div className="srp-repl-fields">
              <div className="srp-field-group">
                <label className="srp-lbl">New Cert No. <span className="srp-req">*</span></label>
                <div className="srp-cert-input-wrap">
                  <input
                    className={`srp-input${certCheckErr ? ' srp-input--err' : ''}`}
                    value={newCertNo}
                    onChange={e => setNewCertNo(e.target.value)}
                    placeholder="e.g. s1-R"
                  />
                  {checking && <Spinner size="sm" className="srp-cert-spinner" />}
                </div>
                {/* Existing cert picker */}
                <div className="srp-existing-wrap" ref={pickerRef}>
                  <button type="button" className="srp-existing-btn" onClick={handleOpenPicker}>
                    <i className="ri-folder-open-line" /> Pick existing cert
                  </button>
                  {showPicker && (
                    <div className="srp-existing-dropdown">
                      {loadingCompat ? (
                        <div className="srp-existing-loading"><Spinner size="sm" /> Loading…</div>
                      ) : compatCerts.length === 0 ? (
                        <div className="srp-existing-empty">No compatible existing certs found</div>
                      ) : (
                        compatCerts.map(c => (
                          <button
                            key={c.share_transaction_id}
                            type="button"
                            className="srp-existing-item"
                            onClick={() => handleSelectCompatCert(c)}
                          >
                            <span className="srp-existing-cert">{c.share_cert_no}</span>
                            <span className="srp-existing-meta">{fmtNum(c.no_of_shares, 0)} shares · {fmt2(c.per_share)}/sh{c.folio_no ? ` · ${c.folio_no}` : ''}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {certStatusText && (
                  <span className={`srp-cert-status${certStatusClass}`}>
                    {isExistingCompatible && <i className="ri-links-line" />}
                    {!certCheckErr && existingInfo && !existingInfo.exists && !checking && <i className="ri-add-circle-line" />}
                    {certCheckErr && <i className="ri-error-warning-line" />}
                    {' '}{certStatusText}
                  </span>
                )}
              </div>

              <div className="srp-field-group">
                <label className="srp-lbl">New Folio No.</label>
                <input
                  className="srp-input"
                  value={newFolioNo}
                  onChange={e => setNewFolioNo(e.target.value)}
                  placeholder={txn.folio_no || ''}
                />
              </div>
            </div>

            {/* Combine preview */}
            {isExistingCompatible && (
              <div className="srp-combine-box">
                <div className="srp-combine-hdr">
                  <i className="ri-links-line" /> Combine Preview
                </div>
                <div className="srp-combine-rows">
                  <div className="srp-combine-row srp-combine-row--src">
                    <span className="srp-combine-label">Lost cert ({txn.share_cert_no})</span>
                    <span className="srp-combine-val">{fmtNum(srcShares, 0)} shares @ {fmt2(srcPS)}</span>
                  </div>
                  <div className="srp-combine-row srp-combine-row--ex">
                    <span className="srp-combine-label">Existing cert ({newCertNo})</span>
                    <span className="srp-combine-val">{fmtNum(exQty, 0)} shares @ {fmt2(Number(existingInfo.per_share))}</span>
                  </div>
                  <div className="srp-combine-divider" />
                  <div className="srp-combine-row srp-combine-row--total">
                    <span className="srp-combine-label">New combined cert ({newCertNo})</span>
                    <span className="srp-combine-val">{fmtNum(combinedQty, 0)} shares @ {fmt2(srcPS)} = {fmt2(combinedQty * srcPS)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="srp-footer">
          <div className="srp-footer-summary">
            <span className="srp-sum-chip">
              <i className="ri-file-paper-2-line" /> Replacing: {txn.share_cert_no || '—'} ({fmtNum(srcShares, 0)} shares)
            </span>
            {isExistingCompatible && (
              <span className="srp-sum-chip srp-sum-chip--combine">
                <i className="ri-links-line" /> Combined: {fmtNum(combinedQty, 0)} shares
              </span>
            )}
          </div>
          <div className="srp-footer-actions">
            <button className="srp-btn-cancel" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
            <button className="srp-btn-save" onClick={handleSave} disabled={saving || checking || !!certCheckErr || !replDate || !newCertNo.trim()}>
              {saving ? <><Spinner size="sm" /> Saving…</> : <><i className="ri-save-line" /> Save Replacement</>}
            </button>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default ShareReplacementPage;
