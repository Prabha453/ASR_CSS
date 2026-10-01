import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Card, Input, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { toast } from 'react-toastify';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getEntityShareList, deleteEntityShare,
  getEntityShareHistory, getShareClassMasterList,
  getCompany,
  getEntityShareDecimalSettings,
  getShareTxnList,
} from '../../helpers/backend_helper';
import ShareBreakdownPanel from './ShareBreakdownPanel';
import EntityShareFormModal from './EntityShareFormModal';
import EntityShareDecimalModal from './EntityShareDecimalModal';
import '../Individual/IndividualList.css';
import './EntitySharesPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum  = (n, dec = 2) => (n == null ? '—' : Number(n).toLocaleString('en-SG', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TYPE_META = {
  NORMAL:    { label: 'Normal',    cls: 'share-type-normal'    },
  BONUS:     { label: 'Bonus',     cls: 'share-type-bonus'     },
  GUARANTEE: { label: 'Guarantee', cls: 'share-type-guarantee' },
};

const TXN_COLORS = {
  'allotment':        '#0ab39c',
  'pre-allotment':    '#405189',
  'share-increase':   '#0ab39c',
  'share-decrease':   '#f06548',
  'transfer':         '#299cdb',
  'cancel':           '#f06548',
  'buyback':          '#e83e8c',
  'consolidation':    '#6559cc',
  'conversion':       '#fd7e14',
  'subdivide':        '#20c997',
  'capital-reduction':'#f0b232',
  'redemption':       '#6c757d',
};

const txnColor = (slug) => TXN_COLORS[slug] || '#878a99';

// ── History Drawer ────────────────────────────────────────────────────────────

const HistoryDrawer = ({ open, onClose, entityId, shareSetId, shareLabel, dec }) => {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !entityId) return;
    setLoading(true);
    const params = { limit: 100 };
    if (shareSetId) params.share_set_id = shareSetId;
    getEntityShareHistory(entityId, params)
      .then(r => setRows(r?.data?.data || []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [open, entityId, shareSetId]);

  return (
    <>
      {open && <div className="es-drawer-backdrop" onClick={onClose} />}
      <div className={`es-drawer ${open ? 'open' : ''}`}>
        <div className="es-drawer-head">
          <div>
            <h6><i className="ri-history-line me-2 text-primary" />Transaction History</h6>
            {shareLabel && <div style={{ fontSize: 11, color: '#878a99', marginTop: 2 }}>{shareLabel}</div>}
          </div>
          <button className="es-drawer-close" onClick={onClose}><i className="ri-close-line" /></button>
        </div>
        <div className="es-drawer-body">
          {loading ? (
            <div className="d-flex justify-content-center mt-4"><Spinner color="primary" size="sm" /></div>
          ) : rows.length === 0 ? (
            <div className="es-history-empty"><i className="ri-file-list-3-line" /><p>No transactions yet</p></div>
          ) : (
            <div className="es-timeline">
              {rows.map((h, i) => (
                <div key={h.id} className="es-timeline-item">
                  <div className="es-timeline-dot" style={{ background: txnColor(h.transaction_type) }} />
                  {i < rows.length - 1 && <div className="es-timeline-line" />}
                  <div className="es-timeline-card">
                    <div className="es-timeline-head">
                      <span className="es-txn-badge" style={{ background: txnColor(h.transaction_type) + '22', color: txnColor(h.transaction_type) }}>
                        {h.transaction_type}
                      </span>
                      <span className="es-timeline-date">{fmtDate(h.created_at)}</span>
                    </div>
                    <div className="es-timeline-grid">
                      <div><span>Shares</span><b>{fmtNum(h.number_of_shares, dec.shares)}</b></div>
                      <div><span>Paid-up</span><b>{h.currency} {fmtNum(h.paid_up_capital, dec.paid)}</b></div>
                      <div><span>Issued</span><b>{h.currency} {fmtNum(h.issued_share_capital, dec.issued)}</b></div>
                      <div><span>Per Share</span><b>{fmtNum(h.per_share, Math.max(dec.paid, 4))}</b></div>
                    </div>
                    {(h.delta_shares != null) && (
                      <div className="es-timeline-deltas">
                        {h.delta_shares       !== 0 && <span className={h.delta_shares > 0 ? 'pos' : 'neg'}>{h.delta_shares > 0 ? '+' : ''}{fmtNum(h.delta_shares, dec.shares)} shares</span>}
                        {h.delta_paid_capital !== 0 && <span className={h.delta_paid_capital > 0 ? 'pos' : 'neg'}>{h.delta_paid_capital > 0 ? '+' : ''}{fmtNum(h.delta_paid_capital, dec.paid)} paid-up</span>}
                      </div>
                    )}
                    {h.remarks && <div className="es-timeline-remarks"><i className="ri-chat-1-line" />{h.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Actions Dropdown ──────────────────────────────────────────────────────────

const SHARE_ACTIONS = [
  { key: 'history',   icon: 'ri-history-line',        label: 'History',        cls: '' },
  { key: 'divider' },
  { key: 'edit',      icon: 'ri-pencil-line',          label: 'Edit Share',     cls: '' },
  { key: 'increase',  icon: 'ri-arrow-up-circle-line', label: 'Share Increase', cls: '' },
  { key: 'decrease',  icon: 'ri-arrow-down-circle-line',label: 'Share Decrease', cls: '' },
  { key: 'divider2' },
  { key: 'delete',    icon: 'ri-delete-bin-line',      label: 'Delete',         cls: 'danger' },
];

const ActionsDropdown = ({ share, onEdit, onDelete, onHistory, onQuickAction }) => {
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const MENU_HEIGHT = 220; // approx menu height in px

  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < MENU_HEIGHT;
    setMenuPos({
      top:    openUp ? undefined : r.bottom + 5,
      bottom: openUp ? window.innerHeight - r.top + 5 : undefined,
      right:  window.innerWidth - r.right,
    });
  };

  const closeMenu = () => setMenuPos(null);

  useEffect(() => {
    if (!menuPos) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) closeMenu();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', closeMenu, true);
    };
  }, [menuPos]);

  const handle = (key) => {
    closeMenu();
    if (key === 'history')   onHistory(share);
    else if (key === 'edit') onEdit(share);
    else if (key === 'delete') onDelete(share);
    else onQuickAction(share, key);
  };

  return (
    <div className="es-actions-wrap">
      <button ref={btnRef} className="es-actions-btn"
        onClick={() => menuPos ? closeMenu() : openMenu()}>
        Actions <i className={`ri-arrow-${menuPos ? 'up' : 'down'}-s-line`} />
      </button>
      {menuPos && (
        <div ref={menuRef} className="es-actions-menu"
          style={{ top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }}>
          {SHARE_ACTIONS.map(a =>
            a.key.startsWith('divider')
              ? <div key={a.key} className="es-actions-divider" />
              : (
                <button key={a.key} className={`es-actions-item${a.cls ? ` ${a.cls}` : ''}`}
                  onClick={() => handle(a.key)}>
                  <i className={a.icon} />{a.label}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
};

// ── Share Row ─────────────────────────────────────────────────────────────────

// ── Share Info Panel (expandable, fetch-on-demand) ────────────────────────────

const ShareInfoPanel = ({ share, entityId, dec }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    getShareTxnList(entityId, { company_share_id: share.id, status: 'VALID', limit: 500 })
      .then(res => {
        const txns = res?.data?.data || res?.data || [];

        // Allocation summary from share header + allotted_shares
        const allotted = Number(share.allotted_shares || 0);
        const total    = Number(share.number_of_shares || 0);
        const balance  = total - allotted;
        const pct      = total > 0 ? Math.min(100, (allotted / total) * 100) : 0;

        // Group by shareholder — count VALID IN rows (active allotments / transfer-in)
        // and VALID NONE rows (remaining balance after a transfer-out).
        // Exclude INVALID rows so superseded allotment source rows are not double-counted.
        const holderMap = {};
        txns.forEach(t => {
          if (!['IN', 'NONE'].includes(t.transaction_status)) return;
          if (t.is_deleted) return;
          const id = t.official_entity_id;
          if (!id) return;
          if (!holderMap[id]) {
            holderMap[id] = {
              name:     t.official_entity?.name || `Entity #${id}`,
              clientNo: t.official_entity?.client_no || '',
              shares:   0,
              issued:   0,
              paidup:   0,
              folios:   new Set(),
              certs:    new Set(),
            };
          }
          holderMap[id].shares  += Number(t.no_of_shares          || 0);
          holderMap[id].issued  += Number(t.issued_share_capital   || 0);
          holderMap[id].paidup  += Number(t.paidup_share_capital   || 0);
          if (t.folio_no)      holderMap[id].folios.add(t.folio_no);
          if (t.share_cert_no) holderMap[id].certs.add(t.share_cert_no);
        });

        const holders = Object.values(holderMap).sort((a, b) => b.shares - a.shares);
        setData({ allotted, balance, pct, total, holders });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [share.id, entityId]);

  if (loading) return (
    <div className="es-info-panel">
      <div className="es-info-panel-loading"><Spinner size="sm" style={{ color: '#405189' }} /> Loading…</div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="es-info-panel">

      {/* ── Section: Allocation ── */}
      <div className="es-info-section es-info-section--alloc">
        <div className="es-info-section-title"><i className="ri-pie-chart-line" /> Allocation</div>
        <div className="es-info-stats">
          <div className="es-info-stat">
            <span>Total</span><b>{fmtNum(data.total, dec.shares)}</b>
          </div>
          <div className="es-info-stat allotted">
            <span>Allotted</span><b>{fmtNum(data.allotted, dec.shares)}</b>
          </div>
          <div className="es-info-stat balance">
            <span>Balance</span><b>{fmtNum(data.balance, dec.shares)}</b>
          </div>
        </div>
        <div className="es-info-bar-wrap">
          <div className="es-info-bar">
            <div className="es-info-bar-fill" style={{ width: `${data.pct}%` }} />
          </div>
          <span className="es-info-bar-pct">{data.pct.toFixed(1)}% allotted</span>
        </div>
      </div>

      {/* ── Section: Shareholders ── */}
      <div className="es-info-section es-info-section--holders">
        <div className="es-info-section-title">
          <i className="ri-group-line" /> Shareholders
          <span className="es-info-holder-count">{data.holders.length}</span>
        </div>

        {data.holders.length === 0 ? (
          <div className="es-info-no-holders">No shareholder records found</div>
        ) : (
          <table className="es-info-holder-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Folio</th>
                <th>Cert No.</th>
                <th>Shares</th>
                <th>Issued Capital</th>
                <th>Paid-up Capital</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.holders.map((h, i) => {
                const pctHeld = data.allotted > 0 ? ((h.shares / data.allotted) * 100).toFixed(1) : '—';
                return (
                  <tr key={i}>
                    <td className="es-info-ht-seq">{i + 1}</td>
                    <td className="es-info-ht-name">
                      <div className="es-info-ht-nm">{h.name}</div>
                      {h.clientNo && <div className="es-info-ht-no">{h.clientNo}</div>}
                    </td>
                    <td className="es-info-ht-folio">
                      {h.folios.size > 0 ? [...h.folios].join(', ') : '—'}
                    </td>
                    <td className="es-info-ht-folio">
                      {h.certs.size > 0 ? [...h.certs].join(', ') : '—'}
                    </td>
                    <td className="es-info-ht-shares">{fmtNum(h.shares, dec.shares)}</td>
                    <td className="es-info-ht-shares" style={{ color: '#c49a0a' }}>{fmtNum(h.issued, dec.issued)}</td>
                    <td className="es-info-ht-shares" style={{ color: '#0ab39c' }}>{fmtNum(h.paidup, dec.paid)}</td>
                    <td className="es-info-ht-pct">{pctHeld}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

// ── Share Row ─────────────────────────────────────────────────────────────────

const ShareRow = ({ share, onEdit, onDelete, onHistory, onQuickAction, inGroup, dec, isAuthorizedCapital, entityId }) => {
  const tm = TYPE_META[share.share_type] || { label: share.share_type, cls: 'share-type-normal' };
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <div className={`es-share-row${inGroup ? ' es-share-row--in-group' : ''}`}>

        {/* Identity */}
        <div className="es-row-identity">
          <div className="es-card-currency-badge">{share.currency}</div>
          <div>
            <div className="es-row-class">
              {share.share_class?.sc_name || `Class #${share.share_class_id}`}
              {share.share_class?.sc_type && (
                <span className="es-sc-type-tag">{share.share_class.sc_type}</span>
              )}
            </div>
            <div className="es-row-date"><i className="ri-calendar-line" />{fmtDate(share.date_of_transaction)}</div>
          </div>
        </div>

        {/* Capital columns — simplified for Guarantee shares */}
        {share.share_type === 'GUARANTEE' ? (
          <>
            <div className="es-row-col">
              <span className="es-row-lbl">Guarantee Amount</span>
              <span className="es-row-val highlight">{fmtNum(share.guarantee_amount, dec.paid)}</span>
            </div>
            <div className="es-row-col">
              <span className="es-row-lbl">Per Share</span>
              <span className="es-row-val highlight">{fmtNum(share.per_share, Math.max(dec.paid, 4))}</span>
            </div>
          </>
        ) : (
          <>
            <div className="es-row-col">
              <span className="es-row-lbl">Shares</span>
              <span className="es-row-val">{fmtNum(share.number_of_shares, dec.shares)}</span>
            </div>
            <div className="es-row-col">
              <span className="es-row-lbl">Issued</span>
              <span className="es-row-val">{fmtNum(share.issued_share_capital, dec.issued)}</span>
            </div>
            {isAuthorizedCapital && (
              <div className="es-row-col">
                <span className="es-row-lbl">Authorized</span>
                <span className="es-row-val">{fmtNum(share.authorized_share_capital, dec.paid)}</span>
              </div>
            )}
            <div className="es-row-col">
              <span className="es-row-lbl">Paid-up</span>
              <span className="es-row-val">{fmtNum(share.paid_up_capital, dec.paid)}</span>
            </div>
            <div className="es-row-col">
              <span className="es-row-lbl">Per Share</span>
              <span className="es-row-val highlight">{fmtNum(share.per_share, Math.max(dec.paid, 4))}</span>
            </div>
          </>
        )}

        {/* Info toggle + Actions */}
        <div className="es-row-actions">
          <button
            className={`es-info-btn${panelOpen ? ' active' : ''}`}
            onClick={() => setPanelOpen(p => !p)}
            title="Share details"
          >
            <i className={panelOpen ? 'ri-information-fill' : 'ri-information-line'} />
          </button>
          <ActionsDropdown
            share={share}
            onEdit={onEdit} onDelete={onDelete}
            onHistory={onHistory} onQuickAction={onQuickAction}
          />
        </div>

      </div>

      {panelOpen && (
        <ShareInfoPanel share={share} entityId={entityId} dec={dec} />
      )}
    </>
  );
};

// ── KPI Strip ─────────────────────────────────────────────────────────────────

const KpiStrip = ({ shares, dec }) => {
  const totalShares    = shares.reduce((a, s) => a + (s.number_of_shares    || 0), 0);
  const totalAuth      = shares.reduce((a, s) => a + (s.authorized_share_capital || 0), 0);
  const totalIssued    = shares.reduce((a, s) => a + (s.issued_share_capital || 0), 0);
  const totalPaid      = shares.reduce((a, s) => a + (s.paid_up_capital      || 0), 0);

  const kpis = [
    { label: 'Total Shares',       val: fmtNum(totalShares, dec.shares), icon: 'ri-stack-line',               color: '#405189', bg: 'rgba(64,81,137,.1)'   },
    { label: 'Authorized Capital', val: fmtNum(totalAuth,   dec.paid),   icon: 'ri-government-line',          color: '#6559cc', bg: 'rgba(101,89,204,.1)'  },
    { label: 'Issued Capital',     val: fmtNum(totalIssued, dec.issued), icon: 'ri-bank-line',                color: '#299cdb', bg: 'rgba(41,156,219,.1)'  },
    { label: 'Paid-up Capital',    val: fmtNum(totalPaid,   dec.paid),   icon: 'ri-money-dollar-circle-line', color: '#0ab39c', bg: 'rgba(10,179,156,.1)'  },
  ];

  return (
    <div className="es-kpi-strip">
      {kpis.map(k => (
        <div key={k.label} className="es-kpi-card" style={{ background: k.bg }}>
          <div className="es-kpi-icon" style={{ background: k.color }}>
            <i className={k.icon} />
          </div>
          <div>
            <div className="es-kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="es-kpi-label">{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const EntitySharesPage = () => {
  useCollapseSidebar();
  const { entity_id } = useParams();
  const navigate       = useNavigate();
  const [company,      setCompany]      = useState(null);
  const decimals             = useSelector(s => s.CompanyProfile.decimals);
  const authorizedCountries  = useSelector(s => s.CompanyProfile.profile?.cp_authorized_captial_countries || []);
  const [shares,       setShares]       = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [pageSize]                      = useState(20);
  const [shareClasses,  setShareClasses]  = useState([]);
  const [allCurrencies, setAllCurrencies] = useState([]);

  // Filters
  const [filterCurrency,   setFilterCurrency]   = useState('');
  const [filterClassId,    setFilterClassId]     = useState('');
  const [filterType,       setFilterType]        = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // History drawer
  const [historyShare, setHistoryShare] = useState(null);

  // Form modal — null = closed, { shareId: null } = add, { shareId: id } = edit
  const [formModal, setFormModal] = useState(null);
  const isGuarantee       = /guarantee/i.test(company?.company_type_name || '');
  const entityCountry     = company?.company_detail?.country || '';
  const isAuthorizedCapital = entityCountry
    ? authorizedCountries.some(c => c.toLowerCase() === entityCountry.toLowerCase())
    : false;

  // Collapsible groups
  const [collapsed, setCollapsed] = useState({});
  const toggleGroup = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  // Chart panel
  const [showChart,    setShowChart]    = useState(false);
  const [chartShares,  setChartShares]  = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartMountKey, setChartMountKey] = useState(0);

  // Decimal settings modal
  const [decSettingsOpen, setDecSettingsOpen] = useState(false);
  const [entityDecimals,  setEntityDecimals]  = useState({ shares: null, paid: null, issued: null });

  // Effective decimals: entity override → global fallback
  const effDecimals = {
    shares: entityDecimals.shares !== null ? entityDecimals.shares : decimals.shares,
    paid:   entityDecimals.paid   !== null ? entityDecimals.paid   : decimals.paid,
    issued: entityDecimals.issued !== null ? entityDecimals.issued : decimals.issued,
  };

  useEffect(() => {
    if (!showChart || chartShares.length > 0) return;
    setChartLoading(true);
    getEntityShareList(entity_id, { page: 1, limit: 200 })
      .then(r => setChartShares(r?.data?.data || []))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [showChart, entity_id, chartShares.length]);

  document.title = 'Company Shares | ASR CSS';

  useEffect(() => {
    getCompany(entity_id)
      .then(r => setCompany(r?.data || null))
      .catch(() => {});
    getShareClassMasterList({ page: 1, limit: 200 })
      .then(r => setShareClasses(r?.data?.data || r?.data || []))
      .catch(() => {});
    getEntityShareList(entity_id, { limit: 500 })
      .then(r => {
        const rows = r?.data?.data || [];
        setAllCurrencies([...new Set(rows.map(s => s.currency).filter(Boolean))]);
      })
      .catch(() => {});
    getEntityShareDecimalSettings(entity_id)
      .then(r => {
        const d = r?.data || {};
        setEntityDecimals({
          shares: d.no_of_share_decimal_place   ?? null,
          paid:   d.paid_up_share_decimal_place ?? null,
          issued: d.issued_share_decimal_place  ?? null,
        });
      })
      .catch(() => {});
  }, [entity_id]);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (filterCurrency) params.currency       = filterCurrency;
      if (filterClassId)  params.share_class_id = filterClassId;
      if (filterType)     params.share_type      = filterType;
      const res = await getEntityShareList(entity_id, params);
      setShares(res?.data?.data        || []);
      setTotal(res?.data?.totalItems   || 0);
    } catch {
      toast.error('Failed to load shares');
    } finally {
      setLoading(false);
    }
  }, [entity_id, page, pageSize, filterCurrency, filterClassId, filterType]);

  useEffect(() => { fetchShares(); }, [fetchShares]);

  const resetFilters = () => {
    setFilterCurrency(''); setFilterClassId(''); setFilterType('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEntityShare(deleteTarget.id);
      toast.success('Share record deleted');
      setDeleteTarget(null);
      fetchShares();
    } catch {
      toast.error('Failed to delete share');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickAction = (share) => {
    setFormModal({ shareId: share.id });
  };

  const openDecSettings = () => setDecSettingsOpen(true);


  // Group shares by currency + share_class_id
  const grouped = shares.reduce((acc, share) => {
    const key = `${share.currency}__${share.share_class_id}`;
    if (!acc[key]) acc[key] = { key, currency: share.currency, share_class: share.share_class, items: [] };
    acc[key].items.push(share);
    return acc;
  }, {});
  const groups = Object.values(grouped);

  return (
    <div className="page-content">
      <Container fluid>
        {/* ── Page Header Section ── */}
        <div className="es-page-header">
          {/* Left: company info */}
          <div className="es-page-header-left">
            <div className="es-company-avatar">
              {(company?.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <Link to={`/company/view/${entity_id}`} className="es-company-name" style={{ textDecoration: 'none' }}>
                {company?.name || '—'}
              </Link>
              <div className="es-company-meta">
                {/* <i className="ri-stock-line" /> Share Register */}
                {company?.identifications?.[0]?.uen_no && (
                  <>UEN: {company.identifications[0].uen_no}</>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="es-page-header-right">
            <Link to={`/company/list`}
              className="btn btn-warning btn-sm d-flex align-items-center gap-1">
              <i className="ri-arrow-left-line" /> Entity List
            </Link>
            <button className="btn btn-success btn-sm d-flex align-items-center gap-1"
              onClick={() => setFormModal({ shareId: null })}>
              <i className="ri-add-line" /> Add Company Shares
            </button>
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => navigate('/officials/shareholders/list', {
                state: {
                  entity: {
                    id:          Number(entity_id),
                    companyName: company?.name || '—',
                    clientNo:    company?.client_no || '—',
                    regNo:       company?.identifications?.[0]?.uen_no || '',
                    status:      company?.status || null,
                  },
                  officialTypes: [],
                },
              })}>
              <i className="ri-group-line" /> Shareholders
            </button>
            <button className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}
              onClick={() => navigate(`/company/${entity_id}/shares/shareholder-register`)}>
              <i className="ri-file-list-3-line" /> Shareholder Shares
            </button>
            <button className="btn btn-info btn-sm d-flex align-items-center gap-1"
              onClick={() => setHistoryShare({ entity_id, _all: true })}>
              <i className="ri-history-line" /> History
            </button>
            <button
              className={`es-chart-toggle-btn${showChart ? ' active' : ''}`}
              onClick={() => setShowChart(v => { if (!v) setChartMountKey(k => k + 1); return !v; })}>
              <i className="ri-donut-chart-line" />
              {showChart ? 'Hide Chart' : 'Chart View'}
            </button>
            <button className="es-dec-settings-btn" onClick={openDecSettings}>
              <i className="ri-settings-3-line" /> Decimal Settings
              {(entityDecimals.shares !== null || entityDecimals.paid !== null || entityDecimals.issued !== null) && (
                <span className="es-dec-settings-dot" />
              )}
            </button>
          </div>
        </div>


        {/* ── Decimal Override Info Bar ── */}
        {(entityDecimals.shares !== null || entityDecimals.paid !== null || entityDecimals.issued !== null) && (
          <div className="es-dec-infobar">
            <i className="ri-information-line" />
            <span>Entity decimal overrides active:</span>
            {[
              { label: 'No. of Shares',  val: effDecimals.shares, override: entityDecimals.shares !== null },
              { label: 'Paid-up Capital',val: effDecimals.paid,   override: entityDecimals.paid   !== null },
              { label: 'Issued Capital', val: effDecimals.issued, override: entityDecimals.issued !== null },
            ].map(({ label, val, override }) => (
              <span key={label} className={`es-dec-infobar-item${override ? ' override' : ''}`}>
                {label}: <b>{val} dp</b>
              </span>
            ))}
            <button className="es-dec-infobar-edit" onClick={openDecSettings}>
              <i className="ri-edit-line" /> Edit
            </button>
          </div>
        )}

        {/* ── Chart Panel ── */}
        <div className={`es-chart-panel${showChart ? ' open' : ''}`}>
          <div className="es-chart-card">
            <div className="es-chart-card-head">
              <span><i className="ri-donut-chart-line" />Share Breakdown</span>
              <button className="es-chart-close-btn" onClick={() => setShowChart(false)}>
                <i className="ri-close-line" /> Hide
              </button>
            </div>
            {chartLoading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                <Spinner color="primary" size="sm" />
              </div>
            ) : (
              <ShareBreakdownPanel shares={chartShares} chartKey={chartMountKey} />
            )}
          </div>
        </div>

        {/* ── Main Card ── */}
        <Card className="es-main-card">

          {/* Filter bar */}
          <div className="es-filter-bar">
            <span className="es-filter-label"><i className="ri-filter-3-line" /> Filter by</span>

            <div className="es-filter-pill">
              <span className="es-pill-lbl">Currency</span>
              <span className="es-pill-val">{filterCurrency || 'All'}</span>
              <i className="ri-arrow-down-s-line es-pill-arrow" />
              <select className="es-pill-select-overlay" value={filterCurrency} onChange={e => { setFilterCurrency(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="es-filter-pill">
              <span className="es-pill-lbl">Share Class</span>
              <span className="es-pill-val">{shareClasses.find(sc => String(sc.sc_id) === filterClassId)?.sc_name || 'All'}</span>
              <i className="ri-arrow-down-s-line es-pill-arrow" />
              <select className="es-pill-select-overlay" value={filterClassId} onChange={e => { setFilterClassId(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {shareClasses.map(sc => <option key={sc.sc_id} value={sc.sc_id}>{sc.sc_name}</option>)}
              </select>
            </div>

            <div className="es-filter-pill">
              <span className="es-pill-lbl">Share Type</span>
              <span className="es-pill-val">{{ NORMAL:'Normal', BONUS:'Bonus', GUARANTEE:'Guarantee' }[filterType] || 'All'}</span>
              <i className="ri-arrow-down-s-line es-pill-arrow" />
              <select className="es-pill-select-overlay" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                <option value="">All</option>
                <option value="NORMAL">Normal</option>
                <option value="BONUS">Bonus</option>
                <option value="GUARANTEE">Guarantee</option>
              </select>
            </div>

            <button className="es-filter-reset-btn" onClick={resetFilters}>
              <i className="ri-refresh-line" />
            </button>

            <div className="es-record-badge ms-auto">
              <i className="ri-database-2-line" />
              <span>{total} {total === 1 ? 'record' : 'records'}</span>
            </div>
          </div>

          {/* Cards list */}
          <div className="es-cards-body">
            {loading ? (
              <div className="es-loading-wrap">
                {[...Array(4)].map((_, i) => <div key={i} className="es-skel-card" />)}
              </div>
            ) : shares.length === 0 ? (
              <div className="es-empty">
                <div className="es-empty-icon"><i className="ri-stock-line" /></div>
                <h5>No shares found</h5>
                <p>Start by adding shares to this company.</p>
                <button className="btn btn-success btn-sm" onClick={() => setFormModal({ shareId: null })}>
                  <i className="ri-add-line me-1" />Add First Share
                </button>
              </div>
            ) : (
              groups.map((group, idx) => {
                const totalShares    = group.items.reduce((a, s) => a + (s.number_of_shares || 0), 0);
                const totalPaid     = group.items.reduce((a, s) => a + (s.paid_up_capital  || 0), 0);
                const totalIssued   = group.items.reduce((a, s) => a + (s.issued_share_capital || 0), 0);
                const totalGuarantee = group.items.reduce((a, s) => a + (s.guarantee_amount || 0), 0);
                const isGuarGroup   = group.items[0]?.share_type === 'GUARANTEE';
                const hasMultiple = group.items.length > 1;
                const className   = group.share_class?.sc_name || `Class #${group.items[0].share_class_id}`;
                const classType   = group.share_class?.sc_type || '';

                const divider = idx > 0 ? (
                  <div className="es-section-divider">
                    <span className="es-divider-line" />
                    <span className="es-divider-dot"><i className="ri-more-line" /></span>
                    <span className="es-divider-line" />
                  </div>
                ) : null;

                const isCollapsed  = !!collapsed[group.key];
                const entryCount   = group.items.length;
                const headerChips  = (
                  <>
                    <div className="es-gt-chip identity">
                      <i className="ri-layout-grid-line" />
                      <div>
                        <span>Currency / Class</span>
                        <b>
                          {group.currency} &middot; {className}
                          {classType && <span className="es-sc-type-tag">{classType}</span>}
                        </b>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line es-group-sep-arrow" />
                    <div className="es-group-totals">
                      {isGuarGroup ? (
                        <div className="es-gt-chip guarantee">
                          <i className="ri-shield-check-line" />
                          <div><span>Guarantee</span><b>{fmtNum(totalGuarantee, effDecimals.paid)}</b></div>
                        </div>
                      ) : (
                        <>
                          <div className="es-gt-chip shares">
                            <i className="ri-stack-line" />
                            <div><span>Shares</span><b>{fmtNum(totalShares, effDecimals.shares)}</b></div>
                          </div>
                          <div className="es-gt-chip paidup">
                            <i className="ri-money-dollar-circle-line" />
                            <div><span>Paid-up</span><b>{fmtNum(totalPaid, effDecimals.paid)}</b></div>
                          </div>
                          <div className="es-gt-chip issued">
                            <i className="ri-bank-line" />
                            <div><span>Issued</span><b>{fmtNum(totalIssued, effDecimals.issued)}</b></div>
                          </div>
                        </>
                      )}
                    </div>
                    <span className="es-group-count">{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
                    <i className={`ri-arrow-${isCollapsed ? 'down' : 'up'}-s-line es-group-chevron`} />
                  </>
                );

                return (
                  <React.Fragment key={group.key}>
                    {divider}
                    <div className="es-group-box">
                      <div className="es-group-box-header" onClick={() => toggleGroup(group.key)}>
                        {headerChips}
                      </div>
                      <div className={`es-group-rows${isCollapsed ? ' es-group-rows--collapsed' : ''}`}>
                        {group.items.map(share => (
                          <ShareRow
                            key={share.id} share={share} inGroup dec={effDecimals}
                            isAuthorizedCapital={isAuthorizedCapital}
                            entityId={entity_id}
                            onEdit={s => setFormModal({ shareId: s.id })}
                            onDelete={s => setDeleteTarget(s)}
                            onHistory={s => setHistoryShare(s)}
                            onQuickAction={handleQuickAction}
                          />
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!loading && total > pageSize && (
            <div style={{ padding: '8px 18px', borderTop: '1px solid var(--vz-border-color)' }}>
              <Pagination total={total} currentPage={page} pageSize={pageSize} onPageChange={setPage} />
            </div>
          )}
        </Card>
      </Container>

      {/* ── Share Form Modal ── */}
      <EntityShareFormModal
        isOpen={!!formModal}
        onClose={() => setFormModal(null)}
        onSaved={() => { fetchShares(); setChartShares([]); }}
        entityId={entity_id}
        shareId={formModal?.shareId || null}
        isGuarantee={isGuarantee}
        isAuthorizedCapital={isAuthorizedCapital}
      />

      {/* ── History Drawer ── */}
      <HistoryDrawer
        open={!!historyShare}
        onClose={() => setHistoryShare(null)}
        entityId={entity_id}
        shareSetId={historyShare?._all ? null : historyShare?.share_set_id}
        shareLabel={historyShare?._all ? 'All Transactions' : `${historyShare?.currency} · ${historyShare?.share_class?.sc_name}`}
        dec={effDecimals}
      />

      {/* ── Decimal Settings Modal ── */}
      <EntityShareDecimalModal
        isOpen={decSettingsOpen}
        onClose={() => setDecSettingsOpen(false)}
        entityId={entity_id}
        decimals={decimals}
        entityDecimals={entityDecimals}
        onSaved={setEntityDecimals}
      />

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => setDeleteTarget(null)} style={{ border: 'none', paddingBottom: 0 }} />
        <ModalBody>
          <div className="il-del-modal">
            <div className="il-del-icon"><i className="ri-delete-bin-5-line" /></div>
            <h5>Delete Share Record?</h5>
            <p>
              <strong>{deleteTarget?.currency} · {deleteTarget?.share_class?.sc_name}</strong><br />
              This action will be logged in history and cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border: 'none', justifyContent: 'center', gap: 10 }}>
          <Button color="light" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting} className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm" /> Deleting…</> : <><i className="ri-delete-bin-line" /> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EntitySharesPage;
