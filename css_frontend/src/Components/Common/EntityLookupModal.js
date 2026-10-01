/**
 * EntityLookupModal
 * ─────────────────
 * Reusable popup for choosing an Individual or Company from a paginated,
 * searchable table. Designed to handle very large record sets (1 lakh+)
 * via server-side search + page-by-page navigation.
 *
 * Props:
 *   isOpen          {bool}     — controls visibility
 *   onClose         {fn}       — called on cancel / backdrop click
 *   onSelect        {fn(row)}  — called when user confirms a row
 *   entityType      {'INDIVIDUAL'|'COMPANY'}
 *   title           {string}   — modal header title  (optional)
 *   excludeEntityId {number}   — entity_id to hide from the list (e.g. the main entity)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Spinner } from 'reactstrap';
import { getIndividualList, getCompanyList } from '../../helpers/backend_helper';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE  = 15;
const STATUSES   = ['', 'ACTIVE', 'INACTIVE', 'PENDING'];
const STATUS_LBL = { '': 'All Status', ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending' };
const STATUS_CLS = { ACTIVE: '#0ab39c', INACTIVE: '#f06548', PENDING: '#f7b84b' };

const AVATAR_COLORS = ['#405189','#0ab39c','#6559cc','#f7b84b','#299cdb','#f06548','#20c997','#fd7e14'];
const avatarColor   = (n = '') => AVATAR_COLORS[(n.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials      = (n = '') => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ── Styles ────────────────────────────────────────────────────────────────────
const css = `
  /* Override modal width */
  .elm-dialog { max-width: 760px !important; }

  /* Search / filter bar */
  .elm-toolbar { display:flex; gap:10px; align-items:center; padding:12px 16px; border-bottom:1px solid var(--vz-border-color); flex-wrap:wrap; }
  .elm-srch    { position:relative; flex:1; min-width:200px; }
  .elm-srch input  { padding-left:34px; font-size:13px; }
  .elm-srch i      { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#878a99; font-size:15px; pointer-events:none; }
  .elm-srch .elm-clr { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#878a99; font-size:15px; cursor:pointer; padding:0; line-height:1; }
  .elm-srch .elm-clr:hover { color:#405189; }

  /* Table */
  .elm-table-wrap { overflow-x:auto; }
  .elm-table      { width:100%; font-size:12.5px; border-collapse:collapse; }
  .elm-table thead th { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#878a99; padding:9px 12px; white-space:nowrap; background:var(--vz-light,#f8f9fa); border-bottom:1px solid var(--vz-border-color); }
  .elm-table tbody td { padding:10px 12px; border-bottom:1px solid var(--vz-border-color,#e9ebec); vertical-align:middle; }
  .elm-table tbody tr { cursor:pointer; transition:background .1s; }
  .elm-table tbody tr:hover     { background:var(--vz-light,#f8f9fa); }
  .elm-table tbody tr.elm-sel   { background:rgba(64,81,137,.08); }
  .elm-table tbody tr:last-child td { border-bottom:none; }

  /* Avatar cell */
  .elm-av   { width:30px; height:30px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; vertical-align:middle; margin-right:9px; }
  .elm-name { font-weight:600; color:var(--vz-body-color); }
  .elm-sub  { font-size:11px; color:#878a99; margin-top:1px; }

  /* Status badge */
  .elm-sts { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }

  /* ID type label */
  .elm-id-lbl { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#878a99; background:var(--vz-light,#f8f9fa); border:1px solid var(--vz-border-color); border-radius:4px; padding:1px 5px; white-space:nowrap; margin-right:5px; }
  /* ID dropdown (multiple identifications) */
  .elm-id-select { font-size:11.5px; font-family:monospace; border:1px solid var(--vz-border-color); border-radius:5px; padding:3px 6px; background:var(--vz-light,#f8f9fa); color:var(--vz-body-color); cursor:pointer; outline:none; max-width:180px; }
  .elm-id-select:focus { border-color:#405189; }

  /* Radio */
  .elm-radio { width:15px; height:15px; accent-color:#405189; cursor:pointer; }

  /* Empty / loading */
  .elm-state { text-align:center; padding:36px 20px; color:#878a99; }
  .elm-state i { font-size:32px; display:block; margin-bottom:8px; opacity:.25; }
  .elm-state p { font-size:12.5px; margin:0; }

  /* Pagination */
  .elm-pager      { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid var(--vz-border-color); flex-wrap:wrap; gap:8px; }
  .elm-pager-info { font-size:11.5px; color:#878a99; }
  .elm-pager-btns { display:flex; gap:3px; align-items:center; }
  .elm-pg-btn     { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid var(--vz-border-color); background:transparent; font-size:12px; font-weight:600; cursor:pointer; color:var(--vz-body-color); transition:all .13s; }
  .elm-pg-btn:hover    { border-color:#405189; color:#405189; background:rgba(64,81,137,.06); }
  .elm-pg-btn.active   { background:#405189; border-color:#405189; color:#fff; }
  .elm-pg-btn:disabled { opacity:.4; cursor:default; pointer-events:none; }
  .elm-pg-ellipsis    { font-size:12px; color:#878a99; padding:0 3px; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total);
  } else if (current >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '…', current - 1, current, current + 1, '…', total);
  }
  return pages;
};

// ── Component ─────────────────────────────────────────────────────────────────

const EntityLookupModal = ({ isOpen, onClose, onSelect, entityType = 'INDIVIDUAL', title, excludeEntityId, excludeEntityIds, filterParams }) => {
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [rows,      setRows]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [hovered,      setHovered]      = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [chosenIdents, setChosenIdents] = useState({});

  const abortRef = useRef(null);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const isIndividual = entityType === 'INDIVIDUAL';

  const modalTitle = title || (isIndividual ? 'Select Individual' : 'Select Company');

  // Reset on open / entity type change
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setStatus('');
      setRows([]);
      setTotal(0);
      setPage(1);
      setSelected(null);
      setChosenIdents({});
    }
  }, [isOpen, entityType, filterParams]);

  // Fetch data
  const fetchData = useCallback(async (q, s, pg) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: PAGE_SIZE, ...(filterParams || {}) };
      if (q)  params.search = q;
      if (s)  params.status = s;
      const fn  = isIndividual ? getIndividualList : getCompanyList;
      const res = await fn(params);
      const raw  = res?.data ?? res;
      const excludeSet = new Set([
        ...(excludeEntityId ? [excludeEntityId] : []),
        ...(Array.isArray(excludeEntityIds) ? excludeEntityIds : []),
      ].filter(Boolean));
      const data = (raw?.data ?? []).filter(r => !excludeSet.has(r.entity_id));
      const excluded = (raw?.data ?? []).filter(r => excludeSet.has(r.entity_id)).length;
      setRows(data);
      setTotal((raw?.totalItems ?? 0) - excluded);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [isIndividual, excludeEntityId, excludeEntityIds, filterParams]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchData(search, status, 1);
    }, 350);
    return () => clearTimeout(t);
  }, [search, status, isOpen, fetchData]);

  // Page change
  useEffect(() => {
    if (!isOpen) return;
    fetchData(search, status, page);
  }, [page]); // eslint-disable-line

  const goPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const getId = (row) => {
    if (isIndividual) {
      return (row.identifications || []).map(i => ({
        id:      i.identification_id,
        label:   i.id_type?.id_name || 'ID',
        value:   i.id_number || '',
        primary: !!i.is_primary,
      })).filter(i => i.value);
    }
    const ident = row.identifications?.[0];
    const val   = ident?.uen_no || ident?.id_number || '';
    return val ? [{ id: ident?.identification_id, label: 'UEN', value: val, primary: true }] : [];
  };

  const defaultIdentId = (row) => {
    const ids = getId(row);
    return chosenIdents[row.entity_id] ?? ids.find(i => i.primary)?.id ?? ids[0]?.id ?? null;
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSelect({ ...selected, _chosen_ident_id: defaultIdentId(selected) });
    onClose();
  };

  const handleRowClick = (row) => setSelected(row);

  const pageNums = buildPageNumbers(page, totalPages);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  if (!isOpen) return null;

  return (
    <>
      <style>{css}</style>
      <Modal isOpen={isOpen} toggle={onClose} centered size="lg" className="elm-dialog">
        <ModalHeader toggle={onClose} style={{ fontSize: 14, fontWeight: 700 }}>
          <i className={`${isIndividual ? 'ri-user-search-line' : 'ri-building-4-line'} me-2`}
            style={{ color: '#405189' }}></i>
          {modalTitle}
        </ModalHeader>

        {/* Search + filter toolbar */}
        <div className="elm-toolbar">
          <div className="elm-srch">
            <i className="ri-search-line"></i>
            <Input
              bsSize="sm"
              placeholder={`Search by name, ${isIndividual ? 'NRIC / Passport / FIN' : 'UEN / Reg. No.'}, client no…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus />
            {search && (
              <button className="elm-clr" onClick={() => setSearch('')}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
          <Input type="select" bsSize="sm" style={{ width: 130, flexShrink: 0 }}
            value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LBL[s]}</option>)}
          </Input>
        </div>

        <ModalBody style={{ padding: 0, maxHeight: '55vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="elm-state"><Spinner /><p style={{ marginTop: 10 }}>Loading…</p></div>
          ) : rows.length === 0 ? (
            <div className="elm-state">
              <i className="ri-inbox-line"></i>
              <p>{search ? `No results for "${search}"` : `No ${isIndividual ? 'individuals' : 'companies'} found.`}</p>
            </div>
          ) : (
            <div className="elm-table-wrap">
              <table className="elm-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>{isIndividual ? 'Individual' : 'Company'}</th>
                    <th>{isIndividual ? 'NRIC / ID' : 'UEN No.'}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const isSel = selected?.entity_id === row.entity_id;
                    const ids = getId(row);
                    const sts   = row.status || '';
                    return (
                      <tr
                        key={row.entity_id}
                        className={isSel ? 'elm-sel' : ''}
                        onClick={() => handleRowClick(row)}>
                        <td>
                          <input
                            type="radio"
                            className="elm-radio"
                            checked={isSel}
                            onChange={() => handleRowClick(row)}
                            onClick={e => e.stopPropagation()} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="elm-av" style={{ background: avatarColor(row.name) }}>
                              {initials(row.name)}
                            </span>
                            <div>
                              <div className="elm-name">{row.name}</div>
                              {row.former_name && (
                                <div className="elm-sub">f/k/a {row.former_name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {ids.length === 0 ? (
                            <span style={{ color: '#878a99' }}>—</span>
                          ) : ids.length === 1 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <span className="elm-id-lbl">{ids[0].label}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{ids[0].value}</span>
                            </span>
                          ) : (
                            <select
                              className="elm-id-select"
                              value={chosenIdents[row.entity_id] ?? (ids.find(i => i.primary)?.id ?? ids[0].id)}
                              onChange={e => setChosenIdents(prev => ({ ...prev, [row.entity_id]: Number(e.target.value) }))}>
                              {ids.map((id, i) => (
                                <option key={i} value={id.id}>{id.label}: {id.value}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          {sts && (
                            <span className="elm-sts"
                              style={{
                                background: (STATUS_CLS[sts] || '#6c757d') + '1a',
                                color:       STATUS_CLS[sts] || '#6c757d',
                              }}>
                              {sts.charAt(0) + sts.slice(1).toLowerCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="elm-pager">
            <div className="elm-pager-info">
              Showing <strong>{from}–{to}</strong> of <strong>{total.toLocaleString()}</strong>
              {isIndividual ? ' individuals' : ' companies'}
            </div>
            <div className="elm-pager-btns">
              <button className="elm-pg-btn" onClick={() => goPage(1)} disabled={page === 1}>
                <i className="ri-skip-left-line"></i>
              </button>
              <button className="elm-pg-btn" onClick={() => goPage(page - 1)} disabled={page === 1}>
                <i className="ri-arrow-left-s-line"></i>
              </button>

              {pageNums.map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="elm-pg-ellipsis">…</span>
                ) : (
                  <button
                    key={n}
                    className={`elm-pg-btn ${n === page ? 'active' : ''}`}
                    onClick={() => goPage(n)}>
                    {n}
                  </button>
                )
              )}

              <button className="elm-pg-btn" onClick={() => goPage(page + 1)} disabled={page === totalPages}>
                <i className="ri-arrow-right-s-line"></i>
              </button>
              <button className="elm-pg-btn" onClick={() => goPage(totalPages)} disabled={page === totalPages}>
                <i className="ri-skip-right-line"></i>
              </button>
            </div>
          </div>
        )}

        <ModalFooter style={{ gap: 8 }}>
          <span style={{ fontSize: 12, color: '#878a99', flex: 1 }}>
            {selected
              ? <><i className="ri-checkbox-circle-fill me-1" style={{ color: '#0ab39c' }}></i>Selected: <strong>{selected.name}</strong></>
              : 'Click a row to select'}
          </span>
          <Button color="light" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm"
            style={{ background: '#405189', borderColor: '#405189', minWidth: 100 }}
            onClick={handleConfirm}
            disabled={!selected}>
            <i className="ri-check-line me-1"></i>Select
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default EntityLookupModal;
