import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Input, Button, Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import {
  getCompanyList, deleteCompany,
  getCompanyTypeList, getRegionList, getEntityStatusList,
  getCorpSecTypeList, getCountriesList,
  getCompanyShareSummary,
} from '../../helpers/backend_helper';

/* ── Shared registration field utility ──────────────────────────────────────
   Returns [{ key, label, value }] based on country.
   Reads from common_helper (already in your codebase).
─────────────────────────────────────────────────────────────────────────── */
import { getRegistrationFields } from '../../helpers/common_helper';

import '../Individual/IndividualList.css';
import CompanyQuickViewModal from './CompanyQuickViewModal';

/* ─────────────────────────────────────────────────────────────────────────────
   SCOPED CSS — registration fields block
   Layout: label (tiny uppercase) on top, value below, stacked vertically.
   Values wrap to next line instead of overflowing.
   No min-width on label — no forced column-alignment of numbers.
───────────────────────────────────────────────────────────────────────────── */
const REG_CSS = `
  .reg-fields {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  }
  .reg-field-item {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 5px;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }
  .reg-field-lbl {
    font-size: 10px;
    font-weight: 600;
    color: var(--vz-secondary-color, #878a99);
    text-transform: uppercase;
    letter-spacing: .04em;
    line-height: 1.4;
    white-space: nowrap;
  }
  .reg-field-lbl::after {
    content: ':';
    margin-left: 1px;
  }
  .reg-field-val {
    font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
    color: var(--vz-body-color);
    font-weight: 500;
    line-height: 1.45;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
    display: block;
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   RegFieldsBlock
   Single reusable component used in table, rich, and card views.

   Behaviour:
   • Calls getRegistrationFields(entity, country) to get [{ key, label, value }]
   • Filters out empty / '—' values — only renders fields that have data
   • If ALL fields are empty → shows "UEN / FBRN: Not provided" so the cell
     is never blank and is self-describing without any outer section label
   • Each field: tiny uppercase label on top, monospace value below
───────────────────────────────────────────────────────────────────────────── */
const RegFieldsBlock = ({ entity, country }) => {
  const fields = getRegistrationFields(entity, country);
  const filled = fields.filter(f => f.value && f.value !== '—');

  if (filled.length === 0) {
    return (
      <div className="reg-fields">
        <div className="reg-field-item">
          <span className="reg-field-lbl">UEN / FBRN</span>
          <span className="il-rich-mid-val empty">Not provided</span>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-fields">
      {filled.map(f => (
        <div key={f.key} className="reg-field-item">
          <span className="reg-field-lbl">{f.label}</span>
          <span className="reg-field-val">{f.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── ShareStat — tiny pill used in the share-summary strip ─────────────── */
const ShareStat = ({ icon, color, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px' }}>
    <i className={icon} style={{ color, fontSize: 11 }} />
    <span style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
    <span style={{ fontSize: 11.5, color: '#1e293b', fontWeight: 700 }}>{value}</span>
  </div>
);

/* ── Constants ──────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#405189','#0ab39c','#f06548','#f0b232','#299cdb','#6559cc','#e83e8c','#20c997','#fd7e14','#6c757d'];
const AVATAR_GRAD   = ['#6b7fc8','#2dcbb0','#f5876b','#f5c560','#4db5e8','#8a7fd8','#ee6ba5','#4dd9ae','#ff9b45','#8c959d'];

const STATUS_META = {
  ACTIVE:   { label:'Active',   cls:'active'   },
  INACTIVE: { label:'Inactive', cls:'inactive' },
  PENDING:  { label:'Pending',  cls:'pending'  },
};

const RISK_META = {
  LOW:       { label:'Low',       cls:'LOW'       },
  MEDIUM:    { label:'Medium',    cls:'MEDIUM'    },
  HIGH:      { label:'High',      cls:'HIGH'      },
  VERY_HIGH: { label:'Very High', cls:'VERY_HIGH' },
};

const KPI_DEFS = [
  { key:'total',    label:'Total Companies', icon:'ri-building-2-line',      color:'#405189', light:'rgba(64,81,137,.1)'  },
  { key:'active',   label:'Active',          icon:'ri-checkbox-circle-line', color:'#0ab39c', light:'rgba(10,179,156,.1)' },
  { key:'inactive', label:'Inactive',        icon:'ri-close-circle-line',    color:'#f06548', light:'rgba(240,101,72,.1)' },
  { key:'pending',  label:'Pending',         icon:'ri-time-line',            color:'#f0b232', light:'rgba(240,178,50,.1)' },
];

/* Column header changed from 'Reg. Info' → 'UEN / FBRN' */
const SORT_COLS = [
  { key:'name',         label:'Company',    sortable:true  },
  { key:'reg_no',       label:'UEN / FBRN', sortable:false },
  { key:'client_no',    label:'Client No.', sortable:true  },
  { key:'status',       label:'Status',     sortable:true  },
  { key:'risk',         label:'Risk',       sortable:false },
  { key:'created_date', label:'Created',    sortable:true  },
];

const BLANK_SIDE = {
  status:'', risk:'', company_type_id:'', region_id:'',
  country:'', e_status_id:'', corp_sec_id:'',
  incorp_from:'', incorp_to:'', created_from:'', created_to:'',
};

const FILTER_LABELS = {
  search:'Search',
  status:'Status', risk:'Risk', company_type_id:'Type', region_id:'Region',
  country:'Country', e_status_id:'CSS Status', corp_sec_id:'Corp Sec',
  incorp_from:'Incorp From', incorp_to:'Incorp To',
  created_from:'Created From', created_to:'Created To',
};


/* ── Helpers ────────────────────────────────────────────────────────────── */
const avatarColor    = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const avatarGradient = (name = '') => { const i = (name.charCodeAt(0)||0) % AVATAR_COLORS.length; return `linear-gradient(135deg, ${AVATAR_COLORS[i]} 0%, ${AVATAR_GRAD[i]} 100%)`; };
const initials    = (name = '') => name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const fmtDate     = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' }); };
const fmtAddress  = (a) => {
  if (!a) return null;
  const parts = [];
  const street = [a.block_no, a.street_name].filter(Boolean).join(' ');
  if (street) parts.push(street);
  if (a.level_no || a.unit_no) parts.push(`#${[a.level_no, a.unit_no].filter(Boolean).join('-')}`);
  if (a.building_name) parts.push(a.building_name);
  if (a.postal_code) parts.push((a.country || 'Singapore') + ' ' + a.postal_code);
  return parts.join(', ') || null;
};

/* ── Sub-components ─────────────────────────────────────────────────────── */
const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill asc',    { active: sortKey===col && sortDir==='asc'  })}></i>
    <i className={classnames('ri-arrow-down-s-fill desc', { active: sortKey===col && sortDir==='desc' })}></i>
  </span>
);

const SkeletonRows = ({ cols }) => (
  <>
    {[...Array(8)].map((_,i) => (
      <tr key={i} className="il-skeleton-row">
        {[...Array(cols)].map((__,j) => (
          <td key={j}><div style={{ width: j===0 ? 180 : 80 }}></div></td>
        ))}
      </tr>
    ))}
  </>
);

/* ── Redux selector ─────────────────────────────────────────────────────── */
const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);

/* ── Side Filter Drawer ─────────────────────────────────────────────────── */
const drawerStyles = `
  .cf-drawer-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.25);
    z-index: 1040; transition: opacity 0.2s;
  }
  .cf-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: 340px; background: #fff;
    box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    z-index: 1041; display: flex; flex-direction: column;
    transform: translateX(100%); transition: transform 0.25s ease;
  }
  .cf-drawer.open { transform: translateX(0); }
  .cf-drawer-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--vz-border-color);
    flex-shrink: 0;
  }
  .cf-drawer-head h6 { margin: 0; font-size: 14px; font-weight: 600; }
  .cf-drawer-close {
    width: 28px; height: 28px; border-radius: 6px; border: none;
    background: var(--vz-light); color: var(--vz-body-color);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px;
  }
  .cf-drawer-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
  .cf-drawer-foot {
    padding: 12px 18px; border-top: 1px solid var(--vz-border-color);
    display: flex; gap: 8px; flex-shrink: 0;
  }
  .cf-filter-group { margin-bottom: 14px; }
  .cf-filter-group label { font-size: 11px; font-weight: 600; color: #878a99; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; display: block; }
  .cf-section-divider { font-size: 10px; font-weight: 700; color: #405189; text-transform: uppercase; letter-spacing: .06em; margin: 16px 0 10px; padding-bottom: 4px; border-bottom: 1px solid var(--vz-border-color); }
`;

const SideFilterDrawer = ({ open, onClose, filters, setFilter, onApply, onReset, masters }) => (
  <>
    <style>{drawerStyles}</style>
    {open && <div className="cf-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('cf-drawer', { open })}>
      <div className="cf-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary"></i>Advanced Filters</h6>
        <button className="cf-drawer-close" onClick={onClose}><i className="ri-close-line" /></button>
      </div>
      <div className="cf-drawer-body">
        <div className="cf-section-divider">Entity</div>
        <div className="cf-filter-group">
          <label>Status</label>
          <Input type="select" bsSize="sm" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Company Type</label>
          <Input type="select" bsSize="sm" value={filters.company_type_id} onChange={e => setFilter('company_type_id', e.target.value)}>
            <option value="">All</option>
            {masters.companyTypes.map(t => (
              <option key={t.company_type_id} value={t.company_type_id}>{t.company_type_name || t.name}</option>
            ))}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Entity Status</label>
          <Input type="select" bsSize="sm" value={filters.e_status_id} onChange={e => setFilter('e_status_id', e.target.value)}>
            <option value="">All</option>
            {masters.entityStatuses.map(s => (
              <option key={s.e_status_id} value={s.e_status_id}>{s.e_status_name || s.name}</option>
            ))}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Corp Sec Status</label>
          <Input type="select" bsSize="sm" value={filters.corp_sec_id} onChange={e => setFilter('corp_sec_id', e.target.value)}>
            <option value="">All</option>
            {masters.corpSecTypes.map(c => (
              <option key={c.corp_sec_id} value={c.corp_sec_id}>{c.corp_sec_name || c.name}</option>
            ))}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Risk Level</label>
          <Input type="select" bsSize="sm" value={filters.risk} onChange={e => setFilter('risk', e.target.value)}>
            <option value="">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="VERY_HIGH">Very High</option>
          </Input>
        </div>
        <div className="cf-section-divider">Location</div>
        <div className="cf-filter-group">
          <label>Country</label>
          <Input type="select" bsSize="sm" value={filters.country} onChange={e => setFilter('country', e.target.value)}>
            <option value="">All</option>
            {masters.countries.map(c => (
              <option key={c.country_id || c.id} value={c.country_name || c.name}>{c.country_name || c.name}</option>
            ))}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Region</label>
          <Input type="select" bsSize="sm" value={filters.region_id} onChange={e => setFilter('region_id', e.target.value)}>
            <option value="">All</option>
            {masters.regions.map(r => (
              <option key={r.region_id} value={r.region_id}>{r.region_name || r.name}</option>
            ))}
          </Input>
        </div>
        <div className="cf-section-divider">Date Ranges</div>
        <div className="cf-filter-group">
          <label>Incorporation Date</label>
          <div className="d-flex gap-2">
            <DatePickerInput value={filters.incorp_from} onChange={e => setFilter('incorp_from', e.target.value)} />
            <DatePickerInput value={filters.incorp_to} onChange={e => setFilter('incorp_to', e.target.value)} />
          </div>
        </div>
        <div className="cf-filter-group">
          <label>Created Date</label>
          <div className="d-flex gap-2">
            <DatePickerInput value={filters.created_from} onChange={e => setFilter('created_from', e.target.value)} />
            <DatePickerInput value={filters.created_to} onChange={e => setFilter('created_to', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="cf-drawer-foot">
        <Button size="sm" color="light" onClick={onReset} className="d-flex align-items-center gap-1">
          <i className="ri-refresh-line" /> Reset
        </Button>
        <Button size="sm" onClick={() => { onApply(); onClose(); }}
          style={{ background:'#405189', borderColor:'#405189', flex:1 }}
          className="d-flex align-items-center justify-content-center gap-1">
          <i className="ri-search-line" /> Apply Filters
        </Button>
      </div>
    </div>
  </>
);

/* ── Main ────────────────────────────────────────────────────────────────── */
const CompanyList = () => {
  useCollapseSidebar();
  const navigate       = useNavigate();
  const globalPageSize = useSelector(selectDefaultPageSize);

  const [rows,         setRows]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [shareSummary, setShareSummary] = useState({});

  const [masters, setMasters] = useState({ companyTypes:[], regions:[], entityStatuses:[], corpSecTypes:[], countries:[] });

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(globalPageSize);
  const [sortKey,  setSortKey]  = useState('created_date');
  const [sortDir,  setSortDir]  = useState('desc');

  const [search,      setSearch]      = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied,     setApplied]     = useState({ search:'', ...BLANK_SIDE });
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const [viewMode,     setViewMode]  = useState('rich');
  const [deleteTarget, setDelTarget] = useState(null);
  const [deleting,     setDeleting]  = useState(false);

  const [officialsTarget, setOfficialsTarget] = useState(null);

  useEffect(() => { setPageSize(globalPageSize); setPage(1); }, [globalPageSize]);

  document.title = 'Company List | ASR CSS';

  useEffect(() => {
    Promise.allSettled([
      getCompanyTypeList({ page:1, limit:200 }),
      getRegionList({ page:1, limit:200 }),
      getEntityStatusList({ page:1, limit:200 }),
      getCorpSecTypeList({ page:1, limit:200 }),
      getCountriesList({ page:1, limit:300 }),
    ]).then(([ct, reg, es, cs, cn]) => {
      const pick = r => r.status === 'fulfilled' ? (r.value?.data?.data || r.value?.data || []) : [];
      setMasters({ companyTypes: pick(ct), regions: pick(reg), entityStatuses: pick(es), corpSecTypes: pick(cs), countries: pick(cn) });
    });
  }, []);

  const setSideFilter = (k, v) => setSideFilters(f => ({ ...f, [k]: v }));

  const applyFilters = () => { setApplied({ search, ...sideFilters }); setPage(1); };

  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search:'', ...BLANK_SIDE });
    setPage(1);
  };

  const removeChip = (k) => {
    if (k === 'search') { setSearch(''); setApplied(a => ({ ...a, search:'' })); }
    else { setSideFilters(f => ({ ...f, [k]:'' })); setApplied(a => ({ ...a, [k]:'' })); }
    setPage(1);
  };

  const activeChips     = Object.entries(applied).filter(([,v]) => v);
  const sideActiveCount = Object.entries(applied).filter(([k,v]) => k !== 'search' && v).length;

  /* ── Fetch ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:pageSize, sort:sortKey, order:sortDir.toUpperCase() };
      if (applied.search)          params.search          = applied.search;
      if (applied.status)          params.status          = applied.status;
      if (applied.risk)            params.risk            = applied.risk;
      if (applied.company_type_id) params.company_type_id = applied.company_type_id;
      if (applied.e_status_id)     params.e_status_id     = applied.e_status_id;
      if (applied.corp_sec_id)     params.corp_sec_id     = applied.corp_sec_id;
      if (applied.region_id)       params.region_id       = applied.region_id;
      if (applied.country)         params.country         = applied.country;
      if (applied.incorp_from)     params.incorp_from     = applied.incorp_from;
      if (applied.incorp_to)       params.incorp_to       = applied.incorp_to;
      if (applied.created_from)    params.created_from    = applied.created_from;
      if (applied.created_to)      params.created_to      = applied.created_to;
      const res  = await getCompanyList(params);
      const data = res?.data ?? res;
      const list = data?.data ?? [];
      setRows(list);
      setTotal(data?.totalItems ?? 0);

      // Fetch share summary for the loaded page in background
      const ids = list.map(r => r.entity_id).filter(Boolean);
      if (ids.length) {
        getCompanyShareSummary(ids)
          .then(r => setShareSummary(r?.data?.data ?? r?.data ?? {}))
          .catch(() => {});
      }
    } catch {
      setRows([]);
      toast.error('Failed to load company list');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir, applied]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d==='asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const kpi = useMemo(() => ({
    total,
    active:   rows.filter(r => r.status === 'ACTIVE').length,
    inactive: rows.filter(r => r.status === 'INACTIVE').length,
    pending:  rows.filter(r => r.status === 'PENDING').length,
  }), [rows, total]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompany(deleteTarget.entity_id);
      toast.success(`${deleteTarget.name} removed`);
      setDelTarget(null);
      fetchList();
    } catch {
      toast.error('Failed to delete company');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Shared renderers ── */
  const renderStatus = (row) => {
    const m = STATUS_META[row.status] || { label: row.status, cls:'pending' };
    return <span className={`il-badge ${m.cls}`}>{m.label}</span>;
  };

  const renderRisk = (row) => {
    const r = row.company_detail?.risk_assessment_rating;
    if (!r) return <span className="text-muted">—</span>;
    const m = RISK_META[r] || { label:r, cls:r };
    return <span className={`il-risk-dot ${m.cls}`}>{m.label}</span>;
  };

  const renderActions = (row) => (
    <div className="il-action-wrap">
      <button className="il-action-btn shares" title="Shares"
        onClick={() => navigate(`/company/${row.entity_id}/shares`)}>
        <i className="ri-stock-line"></i>
        <span>Shares</span>
      </button>
      <div className="il-action-divider" />
      <button className="il-action-btn view" title="View"
        onClick={() => navigate(`/company/view/${row.entity_id}`)}>
        <i className="ri-eye-line"></i>
      </button>
      <button className="il-action-btn edit" title="Edit"
        onClick={() => navigate(`/company/edit/${row.entity_id}`)}>
        <i className="ri-pencil-line"></i>
      </button>
      <button className="il-action-btn delete" title="Delete"
        onClick={() => setDelTarget(row)}>
        <i className="ri-delete-bin-line"></i>
      </button>
    </div>
  );

  /* ── Render ── */
  return (
    <div className="page-content">
      <style>{REG_CSS}</style>

      <Container fluid>
        <BreadCrumb title="Company List" pageTitle="Entity Management" />

        {/* ── KPI Strip ── */}
        <Row className="g-3 mb-3">
          {KPI_DEFS.map(k => (
            <Col key={k.key} xl={3} md={6}>
              <div className="il-kpi" style={{ background:k.light, borderColor:k.light }}>
                <div className="il-kpi-icon" style={{ background:k.color }}>
                  <i className={k.icon}></i>
                </div>
                <div>
                  <div className="il-kpi-val">{kpi[k.key]}</div>
                  <div className="il-kpi-lbl">{k.label}</div>
                </div>
                {k.key !== 'total' && total > 0 && (
                  <span className="il-kpi-pct" style={{ background:k.color+'22', color:k.color }}>
                    {Math.round((kpi[k.key] / total) * 100)}%
                  </span>
                )}
              </div>
            </Col>
          ))}
        </Row>

        {/* ── Main Card ── */}
        <Card>

          {/* ── Toolbar ── */}
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--vz-border-color)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'1 1 220px', maxWidth:340 }}>
              <Input bsSize="sm" placeholder="Search name, UEN, client no…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <Button size="sm" onClick={applyFilters}
              style={{ background:'#405189', borderColor:'#405189' }}
              className="d-flex align-items-center gap-1">
              <i className="ri-search-line" /> Search
            </Button>
            <Button size="sm" color="light" onClick={() => setDrawerOpen(o => !o)}
              className="d-flex align-items-center gap-1 ms-1" style={{ position:'relative' }}>
              <i className="ri-equalizer-line" /> Filters
              {sideActiveCount > 0 && (
                <span style={{ position:'absolute', top:-6, right:-6, minWidth:16, height:16, borderRadius:8, background:'#405189', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>
                  {sideActiveCount}
                </span>
              )}
            </Button>
            {activeChips.length > 0 && (
              <button onClick={resetFilters} style={{ fontSize:11, color:'#f06548', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                <i className="ri-refresh-line" /> Reset all
              </button>
            )}
            <div className="ms-auto d-flex align-items-center gap-2">
              <span style={{ fontSize:11, fontWeight:600, background:'rgba(64,81,137,.1)', color:'#405189', borderRadius:10, padding:'2px 8px' }}>
                {total} {total===1 ? 'record' : 'records'}
              </span>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize:11, fontWeight:600, color:'#405189', background:'rgba(64,81,137,.08)', borderRadius:6, padding:'3px 9px', whiteSpace:'nowrap' }}>
                  { viewMode === 'table' ? 'Normal View' : viewMode === 'rich' ? 'Rich View' : 'Grid View' }
                </span>
                <div className="btn-group" role="group">
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode==='table' ? 'btn-success' : 'btn-outline-success')}
                    title="Normal view" onClick={() => setViewMode('table')}>
                    <i className="ri-list-unordered"></i>
                  </button>
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode==='rich' ? 'btn-success' : 'btn-outline-success')}
                    title="Rich view" onClick={() => setViewMode('rich')}>
                    <i className="ri-file-list-3-line"></i>
                  </button>
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode==='card' ? 'btn-success' : 'btn-outline-success')}
                    title="Grid view" onClick={() => setViewMode('card')}>
                    <i className="ri-grid-fill"></i>
                  </button>
                </div>
              </div>
              <Link to="/company/add" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                <i className="ri-building-2-line"></i>
                <span className="d-none d-sm-inline">Add Company</span>
              </Link>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {activeChips.length > 0 && (
            <div style={{ padding:'6px 18px', borderBottom:'1px solid var(--vz-border-color)', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#878a99', textTransform:'uppercase', letterSpacing:'.05em', display:'flex', alignItems:'center', gap:4 }}>
                <i className="ri-filter-3-line" style={{ fontSize:12 }} /> Filters
              </span>
              {activeChips.map(([k, v]) => (
                <span key={k} className="il-chip">
                  <span style={{ color:'#405189', fontWeight:600, marginRight:3 }}>{FILTER_LABELS[k] || k}:</span>
                  <span style={{ color:'var(--vz-body-color)' }}>{v}</span>
                  <button onClick={() => removeChip(k)}><i className="ri-close-line" /></button>
                </span>
              ))}
            </div>
          )}

          {/* ══ TABLE VIEW ══════════════════════════════════════════════════ */}
          {viewMode === 'table' && (
            <div className="il-table-wrap">
              <table className="il-table">
                <thead>
                  <tr>
                    <th style={{ width:40, textAlign:'center' }}>#</th>
                    {SORT_COLS.map(col => (
                      <th key={col.key}
                        className={classnames({
                          sortable:    col.sortable,
                          'sort-asc':  sortKey===col.key && sortDir==='asc',
                          'sort-desc': sortKey===col.key && sortDir==='desc',
                        })}
                        onClick={() => col.sortable && handleSort(col.key)}
                        style={{ minWidth: col.key === 'reg_no' ? 180 : 'auto' }}>
                        {col.label}
                        {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                      </th>
                    ))}
                    <th style={{ width:106 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={SORT_COLS.length + 2} />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={SORT_COLS.length + 2}>
                        <div className="il-empty">
                          <div className="il-empty-icon"><i className="ri-building-2-line"></i></div>
                          <h6>No companies found</h6>
                          <p>Try adjusting filters or <Link to="/company/add" style={{ color:'#405189' }}>add a new company</Link>.</p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, idx) => {
                    const country = row.company_detail?.country || 'Singapore';
                    return (
                      <tr key={row.entity_id} className={`status-${(row.status||'pending').toLowerCase()}`}>
                        <td style={{ textAlign:'center', color:'#878a99', fontSize:12 }}>
                          {(page-1)*pageSize + idx + 1}
                        </td>
                        <td>
                          <div className="il-name-cell">
                            <div className="il-avatar" style={{ background: avatarColor(row.name||'') }}>
                              {initials(row.name||'')}
                            </div>
                            <div className="il-name-text">
                              <b>{row.name||'—'}</b>
                              <small>{row.former_name || row.company_detail?.country || ''}</small>
                            </div>
                          </div>
                        </td>
                        {/*
                          UEN / FBRN column — RegFieldsBlock handles:
                          • Singapore: UEN No. + ACRA ID (filled values only)
                          • Other:     FBRN + UF No. + Domestic Bus. No. (filled only)
                          • All empty: shows "UEN / FBRN — Not provided"
                          No outer section label needed — each field carries its own label.
                        */}
                        <td>
                          <RegFieldsBlock entity={row} country={country} />
                        </td>
                        <td style={{ fontSize:12 }}>{row.client_no || <span className="text-muted">—</span>}</td>
                        <td>{renderStatus(row)}</td>
                        <td>{renderRisk(row)}</td>
                        <td style={{ fontSize:12 }}>{fmtDate(row.created_date)}</td>
                        <td>{renderActions(row)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ══ RICH LIST VIEW ══════════════════════════════════════════════ */}
          {viewMode === 'rich' && (
            loading ? (
              <div className="il-rich-list">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="il-rich-skel-card">
                    <div className="il-rich-skel-top">
                      <div className="il-rich-skel-avatar" />
                      <div className="il-rich-skel-body">
                        <div className="il-rich-skel-line" style={{ width: '45%' }} />
                        <div className="il-rich-skel-line" style={{ width: '30%', marginTop: 3 }} />
                      </div>
                      <div className="il-rich-skel-right">
                        <div className="il-rich-skel-line" style={{ width: 58, height: 20, borderRadius: 20 }} />
                        <div className="il-rich-skel-line" style={{ width: 68 }} />
                      </div>
                    </div>
                    <div className="il-rich-skel-grid">
                      {[...Array(4)].map((__,j) => (
                        <div key={j} className="il-rich-skel-cell">
                          <div className="il-rich-skel-line" style={{ width: '50%', height: 8 }} />
                          <div className="il-rich-skel-line" style={{ width: '75%' }} />
                        </div>
                      ))}
                    </div>
                    <div className="il-rich-skel-foot" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="il-empty">
                <div className="il-empty-icon"><i className="ri-building-2-line"></i></div>
                <h6>No companies found</h6>
                <p>Try adjusting filters or <Link to="/company/add" style={{ color:'#405189' }}>add a new company</Link>.</p>
              </div>
            ) : (
              <div className="il-rich-list">
                {rows.map((row, idx) => {
                  const sm          = STATUS_META[row.status] || { label: row.status, cls: 'pending' };
                  const risk        = row.company_detail?.risk_assessment_rating;
                  const country     = row.company_detail?.country || 'Singapore';
                  const companyType = row.company_detail?.company_type_name || row.company_type?.company_type_name;
                  const addrRec     = (row.addresses || []).find(a => a.is_primary)
                                   || (row.addresses || []).find(a => a.address_type === 'REGISTERED')
                                   || (row.addresses || [])[0];
                  const address     = fmtAddress(addrRec);

                  const ss = shareSummary[row.entity_id];

                  return (
                    <div key={row.entity_id} className={`il-rich-card ${sm.cls}`}>
                      <div className="il-rich-top">
                        <div className="il-rich-top-row">
                          <span className="il-rich-serial">{(page-1)*pageSize + idx + 1}</span>

                          <div className="il-rich-avatar" style={{ background: avatarGradient(row.name || '') }}>
                            {initials(row.name || '')}
                          </div>

                          <div className="il-rich-body">
                            <button className="il-rich-name" onClick={() => setOfficialsTarget(row)}>
                              {row.name || '—'}
                            </button>
                            {row.former_name
                              ? <div className="il-rich-former"><i className="ri-arrow-right-line" />Formerly: {row.former_name}</div>
                              : <div className="il-rich-former" style={{ opacity:.4 }}>No former name</div>
                            }
                          </div>

                          <div className="il-rich-mid">
                            {/* Address */}
                            {address ? (
                              <div className="il-rich-mid-item il-rich-addr-col">
                                <i className="ri-map-pin-2-line il-rich-addr-icon" />
                                <span className="il-rich-addr-text">{address}</span>
                              </div>
                            ) : (
                              <div className="il-rich-mid-item il-rich-addr-col il-rich-addr-empty">
                                <i className="ri-map-pin-line il-rich-addr-icon" />
                                <span className="il-rich-addr-text">No address on record</span>
                              </div>
                            )}

                            {/*
                              Registration — RegFieldsBlock renders its own per-field labels.
                              No outer "Registration" label. When values exist the field names
                              (UEN No., ACRA ID, etc.) are self-describing.
                            */}
                            <div className="il-rich-mid-item">
                              <RegFieldsBlock entity={row} country={country} />
                            </div>

                            <div className="il-rich-mid-item">
                              <span className="il-rich-mid-lbl">Client No.</span>
                              <span className={`il-rich-mid-val${row.client_no ? '' : ' empty'}`}>
                                {row.client_no || 'Not provided'}
                              </span>
                            </div>
                            <div className="il-rich-mid-item">
                              <span className="il-rich-mid-lbl">Country</span>
                              <span className={`il-rich-mid-val${country ? '' : ' empty'}`}>{country || '—'}</span>
                            </div>
                            <div className="il-rich-mid-item">
                              <span className="il-rich-mid-lbl">Company Type</span>
                              <span className={`il-rich-mid-val${companyType ? '' : ' empty'}`}>{companyType || '—'}</span>
                            </div>
                          </div>

                          <div className="il-rich-right">
                            <span className={`il-badge ${sm.cls}`}>{sm.label}</span>
                            {risk ? renderRisk(row) : <span style={{ fontSize:10.5, color:'#ced4da' }}>No risk data</span>}
                          </div>
                        </div>

                        {/* ── Share summary + actions footer ── */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '4px 10px', borderTop: '1px solid var(--vz-border-color)',
                          background: 'rgba(64,97,238,0.025)', gap: 8, flexWrap: 'wrap',
                        }}>
                          {/* left: date + share info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span className="il-rich-foot-date" style={{ fontSize: 10.5 }}>
                              <i className="ri-calendar-check-line" />
                              Added {fmtDate(row.created_date)}
                            </span>
                            <span style={{ color: '#e2e8f0' }}>|</span>
                            <i className="ri-stock-line" style={{ fontSize: 11, color: '#4361ee' }} />
                            {ss ? (
                              <>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5 }}>
                                  <i className="ri-group-line" style={{ fontSize:11, color:'#4361ee' }} />
                                  <span style={{ fontWeight:700, color:'#374151' }}>Shareholders</span>
                                  <span style={{ background:'#e0e7ff', color:'#4361ee', fontWeight:700, fontSize:10.5, borderRadius:20, padding:'1px 9px', minWidth:22, textAlign:'center' }}>{ss.holder_count || 0}</span>
                                </span>
                                {ss.classes?.map((c, i) => (
                                  <span key={c.name} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5 }}>
                                    <span style={{ color:'#cbd5e1', fontSize:10 }}>·</span>
                                    <i className="ri-copper-coin-line" style={{ fontSize:11, color:'#0da06e' }} />
                                    <span style={{ fontWeight:700, color:'#374151' }}>{c.name}</span>
                                    <span style={{ background:'#dcfce7', color:'#0da06e', fontWeight:700, fontSize:10.5, borderRadius:20, padding:'1px 9px', minWidth:22, textAlign:'center' }}>{Number(c.shares).toLocaleString()}</span>
                                  </span>
                                ))}
                              </>
                            ) : (
                              <span style={{ fontSize: 10.5, color: '#cbd5e1', fontStyle: 'italic' }}>No shares set up</span>
                            )}
                          </div>

                          {/* right: actions */}
                          <div>{renderActions(row)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ══ CARD / GRID VIEW ════════════════════════════════════════════ */}
          {viewMode === 'card' && (
            loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height:200 }}>
                <Spinner color="primary" />
              </div>
            ) : rows.length === 0 ? (
              <div className="il-empty">
                <div className="il-empty-icon"><i className="ri-building-2-line"></i></div>
                <h6>No companies found</h6>
                <p>Try adjusting filters or <Link to="/company/add" style={{ color:'#405189' }}>add a new company</Link>.</p>
              </div>
            ) : (
              <div className="il-card-grid">
                {rows.map(row => {
                  const sm      = STATUS_META[row.status] || { label:row.status, cls:'pending' };
                  const barClr  = sm.cls==='active' ? '#0ab39c' : sm.cls==='inactive' ? '#f06548' : '#f0b232';
                  const country = row.company_detail?.country || 'Singapore';

                  return (
                    <div key={row.entity_id} className="il-card" style={{ borderTop:`3px solid ${barClr}` }}>
                      <div className="il-card-top">
                        <div className="il-card-avatar" style={{ background: avatarColor(row.name||'') }}>
                          {initials(row.name||'')}
                        </div>
                        <div className="il-card-header-info">
                          <div className="il-card-name">{row.name||'—'}</div>
                          <div className="il-card-client">{row.client_no || country}</div>
                        </div>
                        <span className={`il-badge ${sm.cls}`}>{sm.label}</span>
                      </div>
                      <div className="il-card-body">
                        <div style={{ marginBottom: 2 }}>
                          <RegFieldsBlock entity={row} country={country} />
                        </div>
                        {row.company_detail?.risk_assessment_rating && (
                          <div className="il-card-row">
                            <span className="il-card-row-label"><i className="ri-shield-line me-1"></i>Risk</span>
                            {renderRisk(row)}
                          </div>
                        )}
                        <div className="il-card-row">
                          <span className="il-card-row-label"><i className="ri-calendar-check-line me-1"></i>Added</span>
                          <span style={{ fontSize: 11 }}>{fmtDate(row.created_date)}</span>
                        </div>
                      </div>
                      <div className="il-card-footer">
                        {renderActions(row)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Pagination */}
          {!loading && rows.length > 0 && (
            <div style={{ padding:'8px 18px', borderTop:'1px solid var(--vz-border-color)' }}>
              <Pagination
                total={total} currentPage={page} pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          )}

        </Card>
      </Container>

      {/* Officials Quick-View Popup */}
      {officialsTarget && (
        <CompanyQuickViewModal
          company={officialsTarget}
          onClose={() => setOfficialsTarget(null)}
        />
      )}

      {/* Side Filter Drawer */}
      <SideFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={sideFilters}
        setFilter={setSideFilter}
        onApply={applyFilters}
        onReset={() => { resetFilters(); setDrawerOpen(false); }}
        masters={masters}
      />

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDelTarget(null)} centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => setDelTarget(null)} style={{ border:'none', paddingBottom:0 }} />
        <ModalBody>
          <div className="il-del-modal">
            <div className="il-del-icon"><i className="ri-delete-bin-5-line"></i></div>
            <h5>Delete Company?</h5>
            <p><strong>{deleteTarget?.name}</strong> will be permanently removed.<br />This cannot be undone.</p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border:'none', justifyContent:'center', gap:10 }}>
          <Button color="light" size="sm" onClick={() => setDelTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting} className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm"/> Deleting…</> : <><i className="ri-delete-bin-line"></i> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default CompanyList;
