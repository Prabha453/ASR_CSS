'use strict';

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import './ShareConsiderationModal.css';

const fmt2 = (v) => Number(v || 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Global reusable consideration modal for all share transaction modules.
 *
 * Props:
 *   open                — boolean
 *   onClose             — () => void
 *   onSave              — ({ cash, oc, noConsideration }) => void
 *   partyLabel          — string, e.g. "Transferee"
 *   srcCash             — number  (total source/ACRA cash consideration)
 *   srcOC               — number  (total source/ACRA OC consideration)
 *   allocCash           — number  (already allocated to other party; 0 for dissolve)
 *   allocOC             — number
 *   initialCash         — number  (pre-fill value)
 *   initialOC           — number
 *   initialNoConsid     — boolean
 *   showNoConsidCheckbox — boolean  true = checkbox (dissolve), false = readonly 0.00 (transfer)
 */
const ShareConsiderationModal = ({
  open,
  onClose,
  onSave,
  partyLabel           = 'Transferee',
  srcCash              = 0,
  srcOC                = 0,
  allocCash            = 0,
  allocOC              = 0,
  initialCash          = 0,
  initialOC            = 0,
  initialNoConsid      = false,
  showNoConsidCheckbox = false,
}) => {
  const [mCash,     setMCash]     = useState('0.00');
  const [mOC,       setMOC]       = useState('0.00');
  const [mNoConsid, setMNoConsid] = useState(false);
  const [transConsid, setTransConsid] = useState('');

  useEffect(() => {
    if (!open) return;
    setMCash(initialNoConsid ? '0.00' : (Number(initialCash) || 0).toFixed(2));
    setMOC(initialNoConsid   ? '0.00' : (Number(initialOC)   || 0).toFixed(2));
    setMNoConsid(initialNoConsid || false);
    setTransConsid('');
  }, [open]); // eslint-disable-line

  const srcTotal  = srcCash + srcOC;
  const balCash   = Math.max(0, srcCash - allocCash);
  const balOC     = Math.max(0, srcOC   - allocOC);
  const modalTotal = mNoConsid ? 0 : (Number(mCash) || 0) + (Number(mOC) || 0);

  const rows = [
    { label: 'Cash',             total: srcCash, alloc: allocCash, bal: balCash, val: mCash, set: setMCash },
    { label: 'Otherwise in Cash',total: srcOC,   alloc: allocOC,   bal: balOC,   val: mOC,   set: setMOC   },
    { label: 'No Consideration', total: 0,        alloc: 0,         bal: 0,       val: '0.00',set: null     },
  ];

  const handleSave = () => {
    onSave({
      cash:           mNoConsid ? 0 : (Number(mCash) || 0),
      oc:             mNoConsid ? 0 : (Number(mOC)   || 0),
      noConsideration: mNoConsid,
    });
    onClose();
  };

  return (
    <Modal isOpen={open} toggle={onClose} size="lg" centered className="scm-modal">
      <ModalHeader toggle={onClose}>Edit Consideration</ModalHeader>
      <ModalBody className="scm-body">

        {/* ── Section 1: Allocate ACRA Consideration ── */}
        <div className="scm-section">
          <div className="scm-section-hdr">
            <i className="ri-scales-3-line" /> ALLOCATE ACRA CONSIDERATION
          </div>
          <div className="scm-section-body">
            <div className="scm-meta-row">
              <span className="scm-meta">Total Consideration *: <b>{fmt2(srcTotal)}</b></span>
              <span className="scm-meta">{partyLabel} Consideration: <b>{fmt2(modalTotal)}</b></span>
            </div>
            <div className="scm-tbl-scroll">
              <table className="scm-tbl">
                <thead>
                  <tr>
                    <th></th>
                    <th>Total ACRA Consideration</th>
                    <th>Allocated</th>
                    <th>Balance for Allocation</th>
                    <th>Enter {partyLabel} Consideration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.label}>
                      <td className="scm-tbl-lbl">{r.label}</td>
                      <td>{fmt2(r.total)}</td>
                      <td>{fmt2(r.alloc)}</td>
                      <td>{fmt2(r.bal)}</td>
                      <td>
                        {r.label === 'No Consideration'
                          ? showNoConsidCheckbox
                            ? <input type="checkbox" checked={mNoConsid}
                                onChange={e => {
                                  setMNoConsid(e.target.checked);
                                  if (e.target.checked) { setMCash('0.00'); setMOC('0.00'); }
                                }} />
                            : <input className="scm-inp" readOnly value="0.00" />
                          : r.set
                            ? <input className="scm-inp" type="number" min="0" step="0.01"
                                value={r.val} disabled={mNoConsid}
                                onChange={e => r.set(e.target.value)} placeholder="0.00" />
                            : <input className="scm-inp" readOnly value="0.00" />
                        }
                      </td>
                    </tr>
                  ))}
                  <tr className="scm-tbl-foot">
                    <td className="scm-tbl-lbl">Total Consideration</td>
                    <td></td><td></td><td></td>
                    <td><span className="scm-tbl-total">{fmt2(modalTotal)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Section 2: Payment Section ── */}
        <div className="scm-section">
          <div className="scm-section-hdr">
            <i className="ri-secure-payment-line" /> PAYMENT SECTION
          </div>
          <div className="scm-section-body">
            <div className="scm-meta-row">
              <span className="scm-meta">Transferor previous Payment *: <b>{fmt2(srcTotal)}/{fmt2(srcTotal)}</b></span>
              <span className="scm-meta">{partyLabel} total less or expected payment: <b>{fmt2(modalTotal)}</b></span>
            </div>
            <div className="scm-tbl-scroll">
              <table className="scm-tbl">
                <thead>
                  <tr>
                    <th></th>
                    <th>Previous Payment</th>
                    <th>Allocated</th>
                    <th>Balance for Allocation</th>
                    <th>Enter {partyLabel} Consideration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.label}>
                      <td className="scm-tbl-lbl">{r.label}</td>
                      <td>{fmt2(r.total)}</td>
                      <td>{fmt2(r.alloc)}</td>
                      <td>{fmt2(r.bal)}</td>
                      <td>
                        <span className="scm-tbl-mirror">
                          {r.label === 'Cash'             ? fmt2(Number(mCash) || 0)
                          : r.label === 'Otherwise in Cash' ? fmt2(Number(mOC)   || 0)
                          : fmt2(0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="scm-tbl-foot">
                    <td className="scm-tbl-lbl">Total Payment</td>
                    <td>{fmt2(srcTotal)}/{fmt2(srcTotal)}</td>
                    <td></td><td></td>
                    <td><span className="scm-tbl-total">{fmt2(modalTotal)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Section 3: Other Consideration ── */}
        <div className="scm-section scm-section--last">
          <div className="scm-section-hdr">
            <i className="ri-exchange-dollar-line" /> OTHER CONSIDERATION
          </div>
          <div className="scm-section-body">
            <div className="scm-other-row">
              <label className="scm-other-lbl">Transactional Consideration</label>
              <input className="scm-inp scm-inp--lg" type="number" min="0" step="0.01"
                value={transConsid} onChange={e => setTransConsid(e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </div>

      </ModalBody>
      <ModalFooter>
        <button className="scm-btn-close"  onClick={onClose}>Close</button>
        <button className="scm-btn-update" onClick={handleSave}>Update</button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareConsiderationModal;
