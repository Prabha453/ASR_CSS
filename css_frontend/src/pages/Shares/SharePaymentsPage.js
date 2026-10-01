import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getShareTxn, getSharePaymentList, createSharePayment,
  updateShareInstalment, deleteSharePayment,
} from '../../helpers/backend_helper';
import './SharePaymentsPage.css';

const SHARE_TYPE_LABELS = { NORMAL: 'Ordinary', BONUS: 'Bonus', GUARANTEE: 'Guarantee' };

const fmt = (v, d = 2) =>
  v == null || v === '' ? '0.00'
  : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY_FORM = { payment_date: '', cash_pay: '', oc_pay: '', no_consideration: false };

// ── Inline payment form (Add / Edit group) ────────────────────────────────────
// editGroup = null (new) | { date, rows, cashRow, ocRow, ncRow, totalCash, totalOC, noConsid }
const PaymentForm = ({ txn, editGroup, paidCash, paidOC, onSaved, onCancel }) => {
  const isEdit = !!editGroup;

  const [form, setForm] = useState(() => isEdit ? {
    payment_date:     editGroup.date || '',
    cash_pay:         editGroup.totalCash > 0 ? String(editGroup.totalCash) : '',
    oc_pay:           editGroup.totalOC   > 0 ? String(editGroup.totalOC)   : '',
    no_consideration: editGroup.noConsid,
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalCash = Number(txn?.cash || 0);
  const totalOC   = Number(txn?.otherwise_cash || 0);
  // Previous Paid = all payments (including current group) so Balance shows truly outstanding amount
  const prevCash  = paidCash;
  const prevOC    = paidOC;
  const balCash   = Math.max(0, totalCash - prevCash);
  const balOC     = Math.max(0, totalOC   - prevOC);

  const handleSave = async () => {
    if (!form.payment_date) { toast.error('Payment date is required'); return; }
    const cashAmt = Number(form.cash_pay) || 0;
    const ocAmt   = Number(form.oc_pay)   || 0;
    if (!form.no_consideration && cashAmt <= 0 && ocAmt <= 0) {
      toast.error('Enter at least one consideration amount or tick No Consideration'); return;
    }

    // Max payable = total consideration − amounts already paid by OTHER groups (not this edit group)
    const otherCashPaid = isEdit ? paidCash - (editGroup.totalCash || 0) : paidCash;
    const otherOCPaid   = isEdit ? paidOC   - (editGroup.totalOC   || 0) : paidOC;
    const maxCash = Math.max(0, totalCash - otherCashPaid);
    const maxOC   = Math.max(0, totalOC   - otherOCPaid);

    if (!form.no_consideration) {
      if (cashAmt > maxCash) {
        toast.error(`Cash amount exceeds remaining balance of ${fmt(maxCash)}`); return;
      }
      if (ocAmt > maxOC) {
        toast.error(`Otherwise In Cash amount exceeds remaining balance of ${fmt(maxOC)}`); return;
      }
    }
    setSaving(true);
    try {
      const txnId = txn.share_transaction_id;

      if (isEdit) {
        // Delete all existing rows in the group, then recreate cleanly.
        // This handles both old-style (cash + OC on one row) and new-style (separate rows).
        for (const row of editGroup.rows) await deleteSharePayment(row.id);

        if (form.no_consideration) {
          await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: 0, oc_paid: 0, no_consideration: 1 });
        } else {
          if (cashAmt > 0) await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: cashAmt, oc_paid: 0, no_consideration: 0 });
          if (ocAmt  > 0)  await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: 0, oc_paid: ocAmt, no_consideration: 0 });
        }
      } else {
        // New payment — create one row per type
        if (cashAmt > 0) await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: cashAmt, oc_paid: 0, no_consideration: 0 });
        if (ocAmt > 0)   await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: 0, oc_paid: ocAmt, no_consideration: 0 });
        if (!cashAmt && !ocAmt && form.no_consideration)
          await createSharePayment({ share_transaction_id: txnId, payment_date: form.payment_date, cash_paid: 0, oc_paid: 0, no_consideration: 1 });
      }

      toast.success(isEdit ? 'Payment updated' : 'Payment saved');
      onSaved();
    } catch {
      toast.error('Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="spp-add-form">

      {/* ── Form title + date on same bar ── */}
      <div className="spp-form-top-bar">
        <div className="spp-form-top-title">
          <i className={isEdit ? 'ri-edit-line' : 'ri-add-circle-line'} />
          {isEdit ? 'Edit Payment' : 'New Payment'}
        </div>
        <div className="spp-form-date-group">
          <label className="spp-form-label">
            Payment Date <span className="spp-req">*</span>
          </label>
          <input type="date" className="spp-form-input spp-date-input"
            value={form.payment_date}
            onChange={e => upd('payment_date', e.target.value)} />
        </div>
      </div>

      {/* ── Consideration breakdown table ── */}
      <div className="spp-pay-table-wrap">
        <table className="spp-pay-table">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="spp-th-left">Consideration</th>
              <th className="spp-th-right">Total Amount</th>
              <th className="spp-th-right">Previous Paid</th>
              <th className="spp-th-right">Balance</th>
              <th className="spp-th-right">Pay Now</th>
            </tr>
          </thead>
          <tbody>
            {/* Cash row */}
            <tr className={form.no_consideration ? 'spp-row-disabled' : ''}>
              <td>
                <div className="spp-consid-name">
                  <i className="ri-coin-line" /> Cash Paid-up
                </div>
              </td>
              <td className="spp-td-num">{fmt(totalCash)}</td>
              <td className="spp-td-num">{fmt(prevCash)}</td>
              <td className="spp-td-num spp-balance">{fmt(balCash)}</td>
              <td className="spp-td-input">
                <input className="spp-pay-input" type="number" min="0" placeholder="0.00"
                  value={form.cash_pay} disabled={form.no_consideration}
                  onChange={e => upd('cash_pay', e.target.value)} />
              </td>
            </tr>

            {/* Otherwise In Cash row */}
            <tr className={form.no_consideration ? 'spp-row-disabled' : ''}>
              <td>
                <div className="spp-consid-name">
                  <i className="ri-exchange-dollar-line" /> Otherwise In Cash
                </div>
              </td>
              <td className="spp-td-num">{fmt(totalOC)}</td>
              <td className="spp-td-num">{fmt(prevOC)}</td>
              <td className="spp-td-num spp-balance">{fmt(balOC)}</td>
              <td className="spp-td-input">
                <input className="spp-pay-input" type="number" min="0" placeholder="0.00"
                  value={form.oc_pay} disabled={form.no_consideration}
                  onChange={e => upd('oc_pay', e.target.value)} />
              </td>
            </tr>

            {/* No Consideration row */}
            <tr className="spp-noconsid-row">
              <td>
                <div className="spp-consid-name">
                  <i className="ri-checkbox-circle-line" /> No Consideration
                </div>
              </td>
              <td className="spp-td-num spp-dash">0.00</td>
              <td className="spp-td-num spp-dash">0.00</td>
              <td className="spp-td-num spp-dash">0.00</td>
              <td className="spp-td-input">
                <label className="spp-nc-toggle">
                  <input type="checkbox" checked={form.no_consideration}
                    onChange={e => {
                      const checked = e.target.checked;
                      setForm(f => ({
                        ...f,
                        no_consideration: checked,
                        cash_pay: checked ? '' : f.cash_pay,
                        oc_pay:   checked ? '' : f.oc_pay,
                      }));
                    }} />
                  <span className="spp-nc-track" />
                  <span className="spp-nc-label">{form.no_consideration ? 'Yes' : 'No'}</span>
                </label>
              </td>
            </tr>

            {/* Total row */}
            <tr className="spp-total-row">
              <td className="spp-total-label">Total</td>
              <td className="spp-td-num">{fmt(totalCash + totalOC)}</td>
              <td className="spp-td-num">{fmt(prevCash + prevOC)}</td>
              <td className="spp-td-num spp-balance">{fmt(balCash + balOC)}</td>
              <td className="spp-td-num spp-pay-total">
                {fmt((Number(form.cash_pay) || 0) + (Number(form.oc_pay) || 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="spp-add-form-actions">
        <button className="spp-btn spp-btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="spp-btn spp-btn--save" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" /> : <i className="ri-save-line" />}
          {isEdit ? ' Update Payment' : ' Save Payment'}
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const SharePaymentsPage = () => {
  useCollapseSidebar();
  const { txn_id }    = useParams();
  const navigate      = useNavigate();
  const { state }     = useLocation();

  const [txn,        setTxn]        = useState(state?.txn     || null);
  const [share]                     = useState(state?.share   || null);
  const [company]                   = useState(state?.company || null);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editGroup,  setEditGroup]  = useState(null);   // null = new, group obj = edit
  const [deleting,   setDeleting]   = useState(null);   // key of group being deleted
  const [instalment, setInstalment] = useState('NO');
  const [savingInst, setSavingInst] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, payRes] = await Promise.all([
        txn ? Promise.resolve({ data: txn }) : getShareTxn(txn_id),
        getSharePaymentList(txn_id),
      ]);
      const txnData = txnRes?.data || null;
      if (!txn) setTxn(txnData);
      setInstalment(txnData?.is_partially_paid ? 'YES' : 'NO');
      setPayments(payRes?.data?.data || payRes?.data || []);
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [txn_id]); // eslint-disable-line

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // Group rows by payment_date so Cash + OC from the same allotment appear as one row
  const groupedPayments = useMemo(() => {
    const map = new Map();
    payments.forEach(p => {
      const key = p.payment_date || '__none__';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()].map(([key, rows]) => {
      const cashRow = rows.find(r => r.payment_type === 'CASH');
      const ocRow   = rows.find(r => r.payment_type === 'OTHERWISE_THAN_CASH');
      const ncRow   = rows.find(r => r.payment_type === 'NO_CONSIDERATION' || r.no_consideration);
      return {
        key,
        date:       key === '__none__' ? null : key,
        rows,
        cashRow,
        ocRow,
        ncRow,
        totalCash:  rows.reduce((s, r) => s + Number(r.cash            || 0), 0),
        totalOC:    rows.reduce((s, r) => s + Number(r.otherwise_cash  || 0), 0),
        noConsid:   rows.some(r => r.no_consideration),
      };
    });
  }, [payments]);

  const handleSaveInstalment = async () => {
    setSavingInst(true);
    try {
      await updateShareInstalment(txn_id, { has_instalment: instalment });
      toast.success('Instalment setting saved');
    } catch {
      toast.error('Failed to save instalment setting');
    } finally {
      setSavingInst(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm('Delete this payment?')) return;
    setDeleting(group.key);
    try {
      for (const row of group.rows) await deleteSharePayment(row.id);
      toast.success('Payment deleted');
      loadPayments();
    } catch {
      toast.error('Failed to delete payment');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit  = (group) => { setEditGroup(group); setShowForm(true); };
  const closeForm = ()      => { setShowForm(false);  setEditGroup(null); };

  // Aggregate totals from all raw payment rows
  const totalCash = Number(txn?.cash || 0);
  const totalOC   = Number(txn?.otherwise_cash || 0);
  const total     = totalCash + totalOC;
  const paidCash  = payments.reduce((s, p) => s + Number(p.cash            || 0), 0);
  const paidOC    = payments.reduce((s, p) => s + Number(p.otherwise_cash  || 0), 0);
  const paid      = paidCash + paidOC;
  const due       = Math.max(0, total - paid);
  const pct       = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const pctColor  = pct >= 100 ? '#0ab39c' : pct > 0 ? '#f7b84b' : '#e9ebec';

  const txType  = txn?.share_header?.extra_type_of_transaction;
  const txColor = txn?.share_header?.transaction_type?.t_type_color || '#405189';

  return (
    <div className="page-content">
      <Container fluid>

        {/* ── Context strip ── */}
        <div className="spp-context-strip">
          <div className="spp-context-left">
            <div className="spp-avatar">{(company?.name || 'C').charAt(0).toUpperCase()}</div>
            <div className="spp-context-info">
              <div className="spp-context-top-row">
                <div className="spp-context-company">{company?.name || '—'}</div>
                {txType && (
                  <><span className="spp-top-divider" /><span className="spp-tx-badge" style={{ background: `${txColor}15`, color: txColor, border: `1.5px solid ${txColor}30` }}>{txType}</span></>
                )}
                <span className="spp-top-divider" />
                <div className="spp-context-holder">
                  <i className="ri-user-line" /> {txn?.official_entity?.name || '—'}
                </div>
              </div>
              <div className="spp-context-meta">
                <span className="spp-meta-currency">{share?.currency || ''}</span>
                <span className="spp-meta-dot">·</span>
                <span className="spp-meta-type">{SHARE_TYPE_LABELS[share?.share_type] || share?.share_type || ''}</span>
                {share?.share_class?.sc_type ? <><span className="spp-meta-dot">·</span><span className="spp-meta-type">{share.share_class.sc_type}</span></> : null}
                {txn?.folio_no      ? <><span className="spp-meta-dot">·</span><span className="spp-meta-label">Folio:</span><span className="spp-meta-val">{txn.folio_no}</span></>      : null}
                {txn?.share_cert_no ? <><span className="spp-meta-dot">·</span><span className="spp-meta-label">Cert:</span><span className="spp-meta-val">{txn.share_cert_no}</span></>  : null}
              </div>
            </div>
          </div>
          <div className="spp-context-right">
            <button className="spp-back-btn" onClick={() => navigate(-1)}>
              <i className="ri-arrow-left-line" /> Back
            </button>
          </div>
        </div>

        <Card className="spp-card">

          {/* ── Summary banner ── */}
          <div className="spp-summary-banner">
            <div className="spp-summary-stat">
              <i className="ri-money-dollar-circle-line" style={{ color: '#405189' }} />
              <div><span>Total Consideration</span><b style={{ color: '#405189' }}>{fmt(total)}</b></div>
            </div>
            <div className="spp-summary-stat">
              <i className="ri-checkbox-circle-line" style={{ color: '#0ab39c' }} />
              <div><span>Total Paid</span><b style={{ color: '#0ab39c' }}>{fmt(paid)}</b></div>
            </div>
            <div className="spp-summary-stat">
              <i className="ri-time-line" style={{ color: '#f7b84b' }} />
              <div><span>Due Amount</span><b style={{ color: due > 0 ? '#f06548' : '#0ab39c' }}>{fmt(due)}</b></div>
            </div>
            <div className="spp-summary-stat spp-summary-stat--progress">
              <div className="spp-progress-label">
                <span>Payment Progress</span>
                <b style={{ color: pct >= 100 ? '#0ab39c' : '#405189' }}>{pct.toFixed(0)}%</b>
              </div>
              <div className="spp-progress-track">
                <div className="spp-progress-fill" style={{ width: `${pct}%`, background: pctColor }} />
              </div>
            </div>
          </div>

          {/* ── Instalment section ── */}
          <div className="spp-instalment-bar">
            <div className="spp-instalment-left">
              <i className="ri-calendar-schedule-line" />
              <span className="spp-instalment-title">Installment Partial Payments</span>
            </div>
            <div className="spp-instalment-right">
              <select className="spp-instalment-select" value={instalment}
                onChange={e => setInstalment(e.target.value)}>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
              <button className="spp-btn spp-btn--save spp-btn--sm" onClick={handleSaveInstalment} disabled={savingInst}>
                {savingInst ? <Spinner size="sm" /> : <i className="ri-save-line" />} Save
              </button>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="spp-toolbar">
            <span className="spp-toolbar-title">
              <i className="ri-list-check" /> Payment Records
              {groupedPayments.length > 0 && <span className="spp-count-badge">{groupedPayments.length}</span>}
            </span>
            {!showForm && (
              <button className="spp-add-btn" onClick={() => { setEditGroup(null); setShowForm(true); }}>
                <i className="ri-add-line" /> Add New Payment
              </button>
            )}
          </div>

          {/* ── Form for Add New (no editGroup) ── */}
          {showForm && !editGroup && (
            <PaymentForm
              txn={txn}
              editGroup={null}
              paidCash={paidCash}
              paidOC={paidOC}
              onSaved={() => { closeForm(); loadPayments(); }}
              onCancel={closeForm}
            />
          )}

          {/* ── Payments list ── */}
          {loading ? (
            <div className="spp-loading">
              <Spinner size="sm" style={{ color: '#405189' }} /> Loading payments...
            </div>
          ) : groupedPayments.length === 0 ? (
            <div className="spp-empty">
              <div className="spp-empty-icon"><i className="ri-money-dollar-circle-line" /></div>
              <div className="spp-empty-title">No payments recorded yet</div>
              <div className="spp-empty-sub">Click "Add New Payment" to record the first installment.</div>
            </div>
          ) : (
            <div className="spp-list-wrap">
              <table className="spp-list-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Payment Date</th>
                    <th style={{ textAlign: 'right' }}>Cash Paid-up</th>
                    <th style={{ textAlign: 'right' }}>Cash Otherwise</th>
                    <th style={{ textAlign: 'right' }}>No Consideration</th>
                    <th style={{ whiteSpace: 'nowrap', width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPayments.map((group, i) => {
                    const isEditing = showForm && editGroup?.key === group.key;
                    return (
                      <React.Fragment key={group.key}>
                        <tr className={isEditing ? 'spp-row--editing' : ''}>
                          <td className="spp-seq">{i + 1}</td>
                          <td>{fmtDate(group.date)}</td>
                          <td className="spp-num">{fmt(group.totalCash)}</td>
                          <td className="spp-num">{fmt(group.totalOC)}</td>
                          <td className="spp-num">
                            {group.noConsid
                              ? <span className="spp-yes-chip">Yes</span>
                              : fmt(0)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="spp-action-btns">
                              <button
                                className={`spp-edit-btn${isEditing ? ' spp-edit-btn--active' : ''}`}
                                onClick={() => isEditing ? closeForm() : openEdit(group)}
                              >
                                <i className={isEditing ? 'ri-close-line' : 'ri-edit-line'} />
                                {isEditing ? ' Close' : ' Edit'}
                              </button>
                              <button className="spp-del-btn"
                                onClick={() => handleDeleteGroup(group)}
                                disabled={deleting === group.key}
                              >
                                {deleting === group.key
                                  ? <Spinner size="sm" />
                                  : <><i className="ri-delete-bin-line" /> Delete</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr className="spp-inline-edit-row">
                            <td colSpan={6} style={{ padding: 0 }}>
                              <PaymentForm
                                txn={txn}
                                editGroup={editGroup}
                                paidCash={paidCash}
                                paidOC={paidOC}
                                onSaved={() => { closeForm(); loadPayments(); }}
                                onCancel={closeForm}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="spp-foot-row">
                    <td colSpan={2}><b>Total</b></td>
                    <td className="spp-num"><b>{fmt(paidCash)}</b></td>
                    <td className="spp-num"><b>{fmt(paidOC)}</b></td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </Card>
      </Container>
    </div>
  );
};

export default SharePaymentsPage;
