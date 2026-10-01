import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Card, Input, Button,
  Modal, ModalBody, ModalFooter, ModalHeader, Spinner,
  UncontrolledTooltip,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import BreadCrumb         from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getRegisterChargeList,
  deleteRegisterCharge,
  getEntityList,
} from '../../helpers/backend_helper';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Column definitions — exactly matching the spec:
 * S/No. | Company Name | Charge No. | Type of charge | Date of Creation |
 * Date of Registration | Name of chargee | Amount of Charge |
 * Date of Discharge | Action
 */
const COLS = [
  { key: 'company_id',           label: 'Company name',        sortable: true  },
  { key: 'charge_number',        label: 'Charge no.',          sortable: true  },
  { key: 'type_of_charge',       label: 'Type of charge',      sortable: false },
  { key: 'charge_creation_date', label: 'Date of creation',    sortable: true  },
  { key: 'registration_date',    label: 'Date of registration', sortable: true  },
  { key: 'chargee_name',         label: 'Name of chargee',     sortable: false },
  { key: 'chargee_type',         label: 'Chargee type',        sortable: false },
  { key: 'chargee_amount',       label: 'Amount of charge',    sortable: false },
  { key: 'satisfaction_date',    label: 'Date of discharge',   sortable: true  },
];

/* Type-of-charge option labels (values 1-10 from CHARGE_NAME_OPTS) */
const CHARGE_NAME_MAP = {
  '1':  'Charge on debentures',
  '2':  'Charge on uncalled share capital',
  '3':  'Charge on subsidiary shares',
  '4':  'Charge created by instrument',
  '5':  'Charge on land',
  '6':  'Charge on book debts',
  '7':  'Floating charge',
  '8':  'Charge on calls not paid',
  '9':  'Charge on ship / aircraft',
  '10': 'Charge on goodwill / IP',
};

/* ─────────────────────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────────────────────── */
const CSS = `
  /* ── Sort icons ── */
  .rcl-th { cursor: pointer; user-select: none; white-space: nowrap; }
  .rcl-th:hover { color: #405189; }
  .rcl-sort-ic {
    display: inline-flex; flex-direction: column;
    margin-left: 3px; vertical-align: middle; opacity: .35;
  }
  .rcl-sort-ic i { font-size: 9px; line-height: 1; }
  .rcl-sort-ic i.on { opacity: 1; color: #405189; }

  /* ── Table ── */
  .rcl-table { font-size: 12.5px; }
  .rcl-table thead th {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .04em;
    padding: 9px 10px; white-space: nowrap;
    color: var(--vz-secondary-color, #878a99);
    background: var(--vz-light);
    border-bottom: 2px solid var(--vz-border-color);
  }
  .rcl-table td { padding: 8px 10px; vertical-align: middle; }
  .rcl-table tbody tr:hover td { background: rgba(64,81,137,.03); }

  /* ── Charge number pill ── */
  .rcl-chno {
    font-weight: 600; font-size: 12px; color: #185FA5;
    background: #E6F1FB; border-radius: 4px;
    padding: 2px 7px; white-space: nowrap;
    display: inline-block;
  }

  /* ── Chargee type badge ── */
  .rcl-badge-corp {
    font-size: 10.5px; font-weight: 600; padding: 2px 8px;
    border-radius: 20px; background: rgba(64,81,137,.1); color: #405189;
    white-space: nowrap; display: inline-block;
  }
  .rcl-badge-ind {
    font-size: 10.5px; font-weight: 600; padding: 2px 8px;
    border-radius: 20px; background: rgba(15,110,86,.1); color: #0F6E56;
    white-space: nowrap; display: inline-block;
  }

  /* ── '+N more' chip ── */
  .rcl-more {
    font-size: 10px; font-weight: 600;
    background: var(--vz-light); color: var(--vz-secondary-color,#878a99);
    border: 1px solid var(--vz-border-color);
    border-radius: 99px; padding: 1px 7px;
    cursor: default; margin-left: 4px;
    display: inline-block; vertical-align: middle;
  }

  /* ── Tooltip content list ── */
  .rcl-tip-list { list-style: none; margin: 0; padding: 0; text-align: left; font-size: 11px; }
  .rcl-tip-list li { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,.15); }
  .rcl-tip-list li:last-child { border: none; }

  /* ── Action buttons ── */
  .rcl-act {
    width: 27px; height: 27px; border-radius: 6px;
    border: 1px solid transparent;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 13px; background: transparent;
    transition: background .12s, border-color .12s; padding: 0;
  }
  .rcl-act-v { color: #185FA5; border-color: rgba(24,95,165,.25); }
  .rcl-act-v:hover { background: #E6F1FB; border-color: #85B7EB; }
  .rcl-act-e { color: #0F6E56; border-color: rgba(15,110,86,.25); }
  .rcl-act-e:hover { background: #E1F5EE; border-color: #5DCAA5; }
  .rcl-act-d { color: #A32D2D; border-color: rgba(163,45,45,.25); }
  .rcl-act-d:hover { background: #FCEBEB; border-color: #F09595; }

  /* ── Count pill ── */
  .rcl-count {
    background: #E6F1FB; color: #0C447C;
    font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px; white-space: nowrap;
  }

  /* ── Skeleton ── */
  .rcl-sk td div {
    height: 12px; border-radius: 4px;
    background: linear-gradient(90deg,var(--vz-light) 25%,#e9e9e9 50%,var(--vz-light) 75%);
    background-size: 200% 100%; animation: rcl-sh 1.2s infinite;
  }
  @keyframes rcl-sh {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Empty ── */
  .rcl-empty { text-align: center; padding: 52px 24px; }
  .rcl-empty-ic {
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(64,81,137,.08); color: #405189;
    font-size: 28px; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 14px;
  }
  .rcl-empty h6 { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
  .rcl-empty p  { font-size: 12px; color: var(--vz-secondary-color,#878a99); margin: 0; }

  /* ── Delete modal ── */
  .rcl-del-ring {
    width: 54px; height: 54px; border-radius: 50%;
    background: #FCEBEB; color: #A32D2D;
    font-size: 26px; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 14px;
  }

  /* ── Toolbar ── */
  .rcl-bar {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 10px 14px; border-bottom: 1px solid var(--vz-border-color);
    background: var(--vz-light);
  }

  /* ── Footer ── */
  .rcl-foot {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
    padding: 8px 14px; border-top: 1px solid var(--vz-border-color);
    background: var(--vz-light);
  }

  /* ── Ellipsis cell ── */
  .rcl-ell {
    max-width: 160px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── Amount ── */
  .rcl-amt {
    font-weight: 600; font-size: 12px; color: #27500A;
    white-space: nowrap;
  }
  .rcl-amt-all {
    font-size: 11px; color: var(--vz-secondary-color,#878a99);
    font-style: italic;
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-SG', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—';

/** 
 * Resolve chargee display name from a single chargee row.
 * Uses the `chargee_name` field that comes from the backend (resolved from entities table).
 */
const chargeeName = (c) => {
  if (!c) return '—';
  
  // PRIMARY: Use the resolved chargee_name from backend
  if (c.chargee_name) return c.chargee_name;
  
  // FALLBACK: If chargee_name not available, construct from other fields
  if (c.chargee_type === '1') {
    // Corporate - try to use entity name or UEN
    if (c.chargee_company_entity_id) return `Entity #${c.chargee_company_entity_id}`;
    return 'Corporate chargee';
  }
  
  if (c.chargee_type === '2') {
    // Individual - try to use ID or entity ID
    if (c.chargee_individual_entity_id) return `Entity #${c.chargee_individual_entity_id}`;
    return 'Individual chargee';
  }
  
  return '—';
};

/** Resolve chargee type label */
const chargeeTypeLbl = (c) => {
  if (!c) return '—';
  if (c.chargee_type === '1') return 'Corporate';
  if (c.chargee_type === '2') return 'Individual';
  return '—';
};

/** Format amount for first chargee that has one; else "All monies" */
const fmtAmount = (chargees = []) => {
  const c = chargees.find(x => x.chargee_secures_all_monies === '2' && x.chargee_amount_secured);
  if (!c) return null; // means all-monies
  const cur = c.chargee_currency ? `${c.chargee_currency} ` : '';
  return `${cur}${Number(c.chargee_amount_secured).toLocaleString()}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="rcl-sort-ic">
    <i className={classnames('ri-arrow-up-s-fill',   { on: sortKey === col && sortDir === 'asc'  })} />
    <i className={classnames('ri-arrow-down-s-fill', { on: sortKey === col && sortDir === 'desc' })} />
  </span>
);

const SkeletonRows = ({ cols }) => (
  <>
    {Array.from({ length: 8 }, (_, i) => (
      <tr key={i} className="rcl-sk">
        {Array.from({ length: cols }, (_, j) => (
          <td key={j}><div style={{ width: j === 0 ? 28 : j === 2 ? 80 : 110 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

const ActBtn = ({ cls, icon, title, onClick }) => (
  <button className={`rcl-act ${cls}`} title={title} type="button" onClick={onClick}>
    <i className={icon} />
  </button>
);

/**
 * ChargeeCell — shows first chargee name.
 * If there are more chargees, renders a "+N more" chip with a tooltip
 * listing all chargee names on hover.
 *
 * Uses a stable id built from chargeId so multiple rows don't clash.
 */
const ChargeeNameCell = ({ chargees, chargeId }) => {
  if (!chargees?.length) return <span className="text-muted">—</span>;

  const first     = chargees[0];
  const firstName = chargeeName(first);
  const rest      = chargees.slice(1);
  const tipId     = `chargee-name-${chargeId}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      <span className="rcl-ell" title={firstName}>{firstName}</span>
      {rest.length > 0 && (
        <>
          <span className="rcl-more" id={tipId}>+{rest.length} more</span>
          <UncontrolledTooltip target={tipId} placement="top" autohide={false}>
            <ul className="rcl-tip-list">
              {rest.map((c, i) => (
                <li key={i}>{chargeeName(c)}</li>
              ))}
            </ul>
          </UncontrolledTooltip>
        </>
      )}
    </div>
  );
};

/**
 * ChargeeTypeCell — shows first chargee type badge.
 * If there are more chargees, renders a "+N" chip with a tooltip
 * listing all chargee types on hover.
 */
const ChargeeTypeCell = ({ chargees, chargeId }) => {
  if (!chargees?.length) return <span className="text-muted">—</span>;

  const first   = chargees[0];
  const label   = chargeeTypeLbl(first);
  const badgeCls = first.chargee_type === '1' ? 'rcl-badge-corp' : 'rcl-badge-ind';
  const rest    = chargees.slice(1);
  const tipId   = `chargee-type-${chargeId}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      <span className={badgeCls}>{label}</span>
      {rest.length > 0 && (
        <>
          <span className="rcl-more" id={tipId}>+{rest.length}</span>
          <UncontrolledTooltip target={tipId} placement="top" autohide={false}>
            <ul className="rcl-tip-list">
              {rest.map((c, i) => (
                <li key={i}>{chargeeTypeLbl(c)}</li>
              ))}
            </ul>
          </UncontrolledTooltip>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const RegisterChargeList = () => {
  useCollapseSidebar();
  const navigate = useNavigate();

  /* ── State ── */
  const [rows,       setRows]       = useState([]);
  const [totalItems, setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [sortKey,    setSortKey]    = useState('registration_date');
  const [sortDir,    setSortDir]    = useState('desc');
  const [search,         setSearch]         = useState('');
  const [companyFilter,  setCompanyFilter]  = useState('');
  const [companyOpts,    setCompanyOpts]    = useState([]);
  const [deleteTarget,   setDelTarget]      = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  document.title = 'Register Charges | ASR CSS';

  /* ── Load company filter options ── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await getEntityList();
        const list = res?.data?.data ?? res?.data ?? res ?? [];
        setCompanyOpts(
          list
            .filter(e => e.entity_type === 'COMPANY')
            .map(e => ({ value: String(e.entity_id), label: e.name }))
        );
      } catch { /* non-fatal */ }
    })();
  }, []);

  /* ── Fetch list ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, sort: sortKey, order: sortDir };
      if (search)        params.charge_number = search;
      if (companyFilter) params.company_id    = companyFilter;

      const res = await getRegisterChargeList(params);

      const data       = res?.data?.data  ?? res?.data  ?? [];
      const total      = res?.data?.totalItems ?? res?.data?.total ?? res?.total ?? (Array.isArray(data) ? data.length : 0);
      const pages      = res?.data?.totalPages ?? 1;

      setRows(Array.isArray(data) ? data : []);
      setTotal(total);
      setTotalPages(pages);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load charges');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir, search, companyFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  /* ── Sort ── */
  const handleSort = (key) => {
    setSortDir(d => sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortKey(key);
    setPage(1);
  };

  /* ── Search ── */
  const handleSearch = () => { setPage(1); fetchList(); };
  const resetFilters = () => { setSearch(''); setCompanyFilter(''); setPage(1); };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRegisterCharge(deleteTarget.charge_id);
      toast.success(`Charge "${deleteTarget.charge_number}" deleted`);
      setDelTarget(null);
      fetchList();
    } catch {
      toast.error('Failed to delete charge');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Pagination window ── */
  const pageNumbers = (() => {
    const count = Math.min(5, totalPages);
    const half  = Math.floor(count / 2);
    const start = Math.max(1, Math.min(page - half, totalPages - count + 1));
    return Array.from({ length: count }, (_, i) => start + i);
  })();

  const colCount = COLS.length + 2; // S/No. + Actions

  /* ── Render ── */
  return (
    <div className="page-content">
      <style>{CSS}</style>
      <Container fluid>
        <BreadCrumb title="Register Charges" pageTitle="Entity" />

        <Card className="p-0">

          {/* ══ TOOLBAR ══════════════════════════════════════════════════════ */}
          <div className="rcl-bar">
            {/* Charge number search */}
            <Input
              bsSize="sm"
              placeholder="Search charge no…"
              value={search}
              style={{ width: 180 }}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />

            {/* Company filter */}
            <Input
              type="select" bsSize="sm" value={companyFilter}
              style={{ width: 200 }}
              onChange={e => { setCompanyFilter(e.target.value); setPage(1); }}
            >
              <option value="">All companies</option>
              {companyOpts.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Input>

            <Button size="sm" color="primary"
              className="d-flex align-items-center gap-1 px-3"
              onClick={handleSearch}>
              <i className="ri-search-line" /> Search
            </Button>

            <Button size="sm" color="light"
              className="d-flex align-items-center gap-1"
              onClick={resetFilters}>
              <i className="ri-refresh-line" />
            </Button>

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="rcl-count">
                {totalItems} {totalItems === 1 ? 'record' : 'records'}
              </span>
              <Button size="sm" color="success"
                className="d-flex align-items-center gap-1"
                onClick={() => navigate('/entity/register-charges-create')}>
                <i className="ri-add-line" /> Add charge
              </Button>
            </div>
          </div>

          {/* ══ TABLE ════════════════════════════════════════════════════════ */}
          <div className="table-responsive">
            <table className="table table-hover rcl-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>S/No.</th>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'rcl-th' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && (
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      )}
                    </th>
                  ))}
                  <th style={{ width: 96 }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <SkeletonRows cols={colCount} />

                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={colCount}>
                      <div className="rcl-empty">
                        <div className="rcl-empty-ic">
                          <i className="ri-file-unknow-line" />
                        </div>
                        <h6>No charges found</h6>
                        <p>
                          Try adjusting your filters or{' '}
                          <Link to="/entity/register-charges-create" style={{ color: '#405189' }}>
                            add a new charge
                          </Link>.
                        </p>
                      </div>
                    </td>
                  </tr>

                ) : (
                  rows.map((row, idx) => {
                    const chargees   = row.chargees || [];
                    const amountStr  = fmtAmount(chargees);
                    const typeLabel  = CHARGE_NAME_MAP[row.type_of_charge] || row.type_of_charge || '—';

                    return (
                      <tr key={row.charge_id}>

                        {/* S/No. */}
                        <td className="text-muted" style={{ fontSize: 12 }}>
                          {(page - 1) * pageSize + idx + 1}
                        </td>

                        {/* Company name - now using company_name from backend */}
                        <td className="rcl-ell" title={row.company_name || row.company_id}>
                          {row.company_name || row.company_id || '—'}
                        </td>

                        {/* Charge no. */}
                        <td>
                          <span className="rcl-chno">{row.charge_number || '—'}</span>
                        </td>

                        {/* Type of charge */}
                        <td className="rcl-ell" title={typeLabel}>{typeLabel}</td>

                        {/* Date of creation */}
                        <td className="text-muted" style={{ fontSize: 12 }}>
                          {fmtDate(row.charge_creation_date)}
                        </td>

                        {/* Date of registration */}
                        <td className="text-muted" style={{ fontSize: 12 }}>
                          {fmtDate(row.registration_date)}
                        </td>

                        {/* Name of chargee — uses chargee_name from backend with +N more tooltip */}
                        <td style={{ minWidth: 130 }}>
                          <ChargeeNameCell chargees={chargees} chargeId={row.charge_id} />
                        </td>

                        {/* Chargee type — first + "+N" tooltip */}
                        <td style={{ minWidth: 100 }}>
                          <ChargeeTypeCell chargees={chargees} chargeId={row.charge_id} />
                        </td>

                        {/* Amount of charge */}
                        <td>
                          {amountStr
                            ? <span className="rcl-amt">{amountStr}</span>
                            : <span className="rcl-amt-all">All monies</span>
                          }
                        </td>

                        {/* Date of discharge */}
                        <td className="text-muted" style={{ fontSize: 12 }}>
                          {fmtDate(row.satisfaction_date)}
                        </td>

                        {/* Action */}
                        <td>
                          <div className="d-flex gap-1">
                            <ActBtn
                              cls="rcl-act-v" icon="ri-eye-line" title="View"
                              onClick={() => navigate(`/entity/register-charges-view/${row.charge_id}`)}
                            />
                            <ActBtn
                              cls="rcl-act-e" icon="ri-pencil-line" title="Edit"
                              onClick={() => navigate(`/entity/register-charges-update/${row.charge_id}`)}
                            />
                            <ActBtn
                              cls="rcl-act-d" icon="ri-delete-bin-line" title="Delete"
                              onClick={() => setDelTarget(row)}
                            />
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ══ PAGINATION ═══════════════════════════════════════════════════ */}
          {!loading && rows.length > 0 && (
            <div className="rcl-foot">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <small className="text-muted">Show</small>
                <Input
                  type="select" bsSize="sm" style={{ width: 68 }}
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                </Input>
                <small className="text-muted">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
                </small>
              </div>

              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(1)}>
                    <i className="ri-arrow-left-double-line" />
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>
                    <i className="ri-arrow-left-s-line" />
                  </button>
                </li>
                {pageNumbers.map(n => (
                  <li key={n} className={`page-item ${n === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(totalPages)}>
                    <i className="ri-arrow-right-double-line" />
                  </button>
                </li>
              </ul>
            </div>
          )}

        </Card>
      </Container>

      {/* ══ DELETE MODAL ═════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!deleteTarget}
        toggle={() => !deleting && setDelTarget(null)}
        centered size="sm"
        modalClassName="zoomIn"
      >
        <ModalHeader toggle={() => !deleting && setDelTarget(null)} className="border-0 pb-0" />
        <ModalBody className="text-center pt-1 pb-2">
          <div className="rcl-del-ring">
            <i className="ri-delete-bin-5-line" />
          </div>
          <h5 className="mb-2 fw-semibold">Delete charge?</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Charge <strong className="text-dark">"{deleteTarget?.charge_number}"</strong>{' '}
            will be permanently removed.<br />This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter className="border-0 justify-content-center gap-2 pt-0">
          <Button color="light" size="sm"
            onClick={() => setDelTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" size="sm"
            onClick={confirmDelete} disabled={deleting}
            className="d-flex align-items-center gap-1">
            {deleting
              ? <><Spinner size="sm" /> Deleting…</>
              : <><i className="ri-delete-bin-line" /> Delete</>
            }
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RegisterChargeList;