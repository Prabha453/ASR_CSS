import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card,
  Input, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Badge,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { getFormTemplateList, deleteFormTemplate } from '../../helpers/backend_helper';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import GenerationPopup from './GenerationPopup';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const FORM_TYPE_META = {
  0: { label: 'Form-Builder', cls: 'fb'     },
  1: { label: 'Esign',        cls: 'esign'  },
  2: { label: 'Manual',       cls: 'manual' },
};


const KPI_DEFS = [
  { key: 'total',       label: 'Total Forms',  icon: 'ri-file-text-line',    color: '#405189', light: 'rgba(64,81,137,.1)'  },
  { key: 'formBuilder', label: 'Form-Builder', icon: 'ri-draft-line',        color: '#0ab39c', light: 'rgba(10,179,156,.1)' },
  { key: 'esign',       label: 'Esign',        icon: 'ri-pen-nib-line',      color: '#299cdb', light: 'rgba(41,156,219,.1)' },
  { key: 'pdpa',        label: 'PDPA Forms',   icon: 'ri-shield-check-line', color: '#f0b232', light: 'rgba(240,178,50,.1)' },
];

/* Removed: slug, country_code — Added: assigned_users */
const SORT_COLS = [
  { key: 'form_name',      label: 'Form Name',      sortable: true  },
  { key: 'category_names', label: 'Category',       sortable: false },
  { key: 'form_type',      label: 'Type',           sortable: false },
  { key: 'orientation',    label: 'Orientation',    sortable: false },
  { key: 'assigned_users', label: 'Assigned Users', sortable: false },
  { key: 'Status',         label: 'Status',         sortable: false },
  { key: 'created_at',     label: 'Created',        sortable: true  },
];

const BLANK_SIDE = {
  form_type: '', country_code: '', default_library: '', is_pdpa: '',
};

const FILTER_LABELS = {
  form_type: 'Type', country_code: 'Country',
  default_library: 'Library', is_pdpa: 'PDPA',
};


/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);

const AVATAR_COLORS = ['#405189', '#0ab39c', '#f06548', '#f0b232', '#299cdb', '#6559cc'];
const avatarColor   = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials      = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ─── Scoped CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  .fbl-kpi { display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:10px; border:1px solid transparent; }
  .fbl-kpi-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; flex-shrink:0; }
  .fbl-kpi-val { font-size:22px; font-weight:700; line-height:1.1; color:var(--vz-body-color); }
  .fbl-kpi-lbl { font-size:11px; color:var(--vz-secondary-color,#878a99); font-weight:500; margin-top:1px; }
  .fbl-kpi-pct { margin-left:auto; font-size:10px; font-weight:700; border-radius:10px; padding:2px 8px; }

  .fbl-table-wrap { overflow-x:auto; }
  .fbl-table { width:100%; border-collapse:collapse; font-size:12.5px; }
  .fbl-table thead tr { background:var(--vz-light); border-bottom:2px solid var(--vz-border-color); }
  .fbl-table th { padding:9px 14px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--vz-secondary-color,#6c757d); white-space:nowrap; }
  .fbl-table th.sortable { cursor:pointer; user-select:none; }
  .fbl-table th.sortable:hover { color:#405189; }
  .fbl-table td { padding:9px 14px; vertical-align:middle; border-bottom:1px solid var(--vz-border-color); }
  .fbl-table tbody tr:hover { background:rgba(64,81,137,.03); }
  .fbl-table tbody tr:last-child td { border-bottom:none; }

  .sort-icons { display:inline-flex; flex-direction:column; margin-left:4px; gap:0; opacity:.4; }
  .sort-icons i { font-size:10px; line-height:1; }
  .sort-icons i.active { opacity:1; color:#405189; }

  .fbl-type-badge { display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
  .fbl-type-badge.fb     { background:rgba(64,81,137,.12); color:#405189; }
  .fbl-type-badge.esign  { background:rgba(41,156,219,.12); color:#299cdb; }
  .fbl-type-badge.manual { background:rgba(240,178,50,.12); color:#c9920c; }

  .fbl-cat-pill {
    display:inline-block; padding:2px 7px; border-radius:20px;
    font-size:10px; font-weight:600;
    background:rgba(64,81,137,.09); color:#405189;
    border:1px solid rgba(64,81,137,.18);
    white-space:nowrap;
  }

  .fbl-user-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding:2px 8px; border-radius:20px;
    font-size:11px; font-weight:600;
    background:rgba(10,179,156,.1); color:#0ab39c;
    border:1px solid rgba(10,179,156,.2);
    white-space:nowrap;
  }
  .fbl-user-pill i { font-size:10px; }

  .fbl-pill-wrap { display:flex; flex-wrap:wrap; gap:4px; }

  .fbl-skeleton-row td div { height:14px; border-radius:6px; background:linear-gradient(90deg,var(--vz-light) 25%,#e2e2e2 50%,var(--vz-light) 75%); background-size:200% 100%; animation:fbl-shimmer 1.2s infinite; }
  @keyframes fbl-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .fbl-action-wrap { display:flex; gap:4px; }
  .fbl-action-btn { width:28px; height:28px; border-radius:6px; border:1px solid transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:13px; transition:all .15s; background:transparent; }
  .fbl-action-btn.edit   { border-color:rgba(41,156,219,.3); color:#299cdb; }
  .fbl-action-btn.view   { border-color:rgba(64,81,137,.3);  color:#405189; }
  .fbl-action-btn.delete { border-color:rgba(240,101,72,.3); color:#f06548; }
  .fbl-action-btn.generate { border-color:rgba(10,179,156,.3); color:#0ab39c; }
  .fbl-action-btn.history { border-color:rgba(240,178,50,.35); color:#c9920c; }
  .fbl-action-btn:hover.edit   { background:rgba(41,156,219,.1); }
  .fbl-action-btn:hover.view   { background:rgba(64,81,137,.1); }
  .fbl-action-btn:hover.delete { background:rgba(240,101,72,.1); }
  .fbl-action-btn:hover.generate { background:rgba(10,179,156,.1); }
  .fbl-action-btn:hover.history { background:rgba(240,178,50,.1); }

  .fbl-empty { text-align:center; padding:48px 24px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .fbl-empty-icon { width:64px; height:64px; border-radius:50%; background:rgba(64,81,137,.08); color:#405189; font-size:28px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .fbl-empty h6 { font-size:15px; font-weight:600; margin-bottom:6px; }
  .fbl-empty p  { font-size:12px; color:var(--vz-secondary-color,#878a99); margin-bottom:16px; }
  .fbl-content-area { flex:1; display:flex; flex-direction:column; }

  .fbl-card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; padding:16px; }
  .fbl-card { border-radius:10px; border:1px solid var(--vz-border-color); overflow:hidden; background:var(--vz-card-bg,#fff); transition:box-shadow .15s; }
  .fbl-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.08); }
  .fbl-card-top { padding:16px; text-align:center; }
  .fbl-card-avatar { width:48px; height:48px; border-radius:12px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#fff; }
  .fbl-card-name { font-size:13px; font-weight:700; color:var(--vz-body-color); margin-bottom:2px; }
  .fbl-card-sub  { font-size:11px; color:var(--vz-secondary-color,#878a99); }
  .fbl-card-body { padding:0 14px 12px; }
  .fbl-card-row  { display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid var(--vz-border-color); font-size:11px; }
  .fbl-card-row:last-child { border-bottom:none; }
  .fbl-card-row-label { color:var(--vz-secondary-color,#878a99); display:flex; align-items:center; }
  .fbl-card-footer { display:flex; justify-content:center; gap:8px; padding:10px 14px; border-top:1px solid var(--vz-border-color); background:var(--vz-light); }

  .fbl-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 8px 3px 10px; border-radius:20px; font-size:11px; font-weight:500; background:rgba(64,81,137,.08); color:#405189; border:1px solid rgba(64,81,137,.2); }
  .fbl-chip button { background:none; border:none; padding:0; cursor:pointer; display:flex; align-items:center; color:#405189; font-size:12px; line-height:1; }

  .fbl-drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.25); z-index:1040; }
  .fbl-drawer { position:fixed; top:0; right:0; bottom:0; width:320px; background:var(--vz-card-bg,#fff); box-shadow:-4px 0 24px rgba(0,0,0,.12); z-index:1041; display:flex; flex-direction:column; transform:translateX(100%); transition:transform .25s ease; }
  .fbl-drawer.open { transform:translateX(0); }
  .fbl-drawer-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--vz-border-color); flex-shrink:0; }
  .fbl-drawer-head h6 { margin:0; font-size:14px; font-weight:600; }
  .fbl-drawer-close { width:28px; height:28px; border-radius:6px; border:none; background:#f3f4f6; color:#374151; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; }
  .fbl-drawer-body { flex:1; overflow-y:auto; padding:16px 18px; }
  .fbl-drawer-foot { padding:12px 18px; border-top:1px solid var(--vz-border-color); display:flex; gap:8px; flex-shrink:0; }
  .fbl-filter-group { margin-bottom:14px; }
  .fbl-filter-group label { font-size:11px; font-weight:600; color:#878a99; text-transform:uppercase; letter-spacing:.04em; margin-bottom:5px; display:block; }
  .fbl-section-divider { font-size:10px; font-weight:700; color:#405189; text-transform:uppercase; letter-spacing:.06em; margin:16px 0 10px; padding-bottom:4px; border-bottom:1px solid var(--vz-border-color); }

  .fbl-del-modal { text-align:center; padding:10px 0 0; }
  .fbl-del-icon { width:56px; height:56px; border-radius:50%; background:rgba(240,101,72,.1); color:#f06548; font-size:26px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
  .fbl-del-modal h5 { font-size:16px; font-weight:600; margin-bottom:8px; }
  .fbl-del-modal p  { font-size:13px; color:var(--vz-secondary-color,#878a99); }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill',   { active: sortKey === col && sortDir === 'asc'  })} />
    <i className={classnames('ri-arrow-down-s-fill', { active: sortKey === col && sortDir === 'desc' })} />
  </span>
);

const SkeletonRows = ({ cols }) => (
  <>
    {[...Array(7)].map((_, i) => (
      <tr key={i} className="fbl-skeleton-row">
        {[...Array(cols)].map((__, j) => (
          <td key={j}><div style={{ width: j === 0 ? 40 : j === 2 ? 180 : 90 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

/** Renders a comma-separated names string as individual pills */
const PillList = ({ value, pillClass }) => {
  if (!value) return <span style={{ color: '#878a99', fontSize: 12 }}>—</span>;
  const items = value.split(', ').filter(Boolean);
  if (!items.length) return <span style={{ color: '#878a99', fontSize: 12 }}>—</span>;
  return (
    <div className="fbl-pill-wrap">
      {items.map((item, i) => (
        <span key={i} className={pillClass}>
          {pillClass === 'fbl-user-pill' && <i className="ri-user-line" />}
          {item}
        </span>
      ))}
    </div>
  );
};

const SideFilterDrawer = ({ open, onClose, filters, setFilter, onApply, onReset }) => (
  <>
    {open && <div className="fbl-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('fbl-drawer', { open })}>
      <div className="fbl-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary" />Advanced Filters</h6>
        <button className="fbl-drawer-close" onClick={onClose}><i className="ri-close-line" /></button>
      </div>
      <div className="fbl-drawer-body">
        <div className="fbl-section-divider">Form</div>

        <div className="fbl-filter-group">
          <label>Form Type</label>
          <Input type="select" bsSize="sm" value={filters.form_type}
            onChange={e => setFilter('form_type', e.target.value)}>
            <option value="">All Types</option>
            <option value="0">Form-Builder</option>
            <option value="1">Esign</option>
            <option value="2">Manual</option>
          </Input>
        </div>

        <div className="fbl-filter-group">
          <label>Country</label>
          <Input type="select" bsSize="sm" value={filters.country_code}
            onChange={e => setFilter('country_code', e.target.value)}>
            <option value="">All Countries</option>
            <option value="SG">Singapore</option>
            <option value="MY">Malaysia</option>
            <option value="IN">India</option>
          </Input>
        </div>

        <div className="fbl-filter-group">
          <label>Default Library</label>
          <Input type="select" bsSize="sm" value={filters.default_library}
            onChange={e => setFilter('default_library', e.target.value)}>
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          </Input>
        </div>

        <div className="fbl-section-divider">Flags</div>

        <div className="fbl-filter-group">
          <label>PDPA Required</label>
          <Input type="select" bsSize="sm" value={filters.is_pdpa}
            onChange={e => setFilter('is_pdpa', e.target.value)}>
            <option value="">All</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Input>
        </div>
      </div>
      <div className="fbl-drawer-foot">
        <Button size="sm" color="light" onClick={onReset}
          className="d-flex align-items-center gap-1">
          <i className="ri-refresh-line" /> Reset
        </Button>
        <Button size="sm" onClick={() => { onApply(); onClose(); }}
          style={{ background: '#405189', borderColor: '#405189', flex: 1 }}
          className="d-flex align-items-center justify-content-center gap-1">
          <i className="ri-search-line" /> Apply Filters
        </Button>
      </div>
    </div>
  </>
);

/* ════════════════════════════════════════════════════════════════════════════
   FormBuilderList
════════════════════════════════════════════════════════════════════════════ */
const FormBuilderList = () => {
  const navigate = useNavigate();
  const globalPageSize = useSelector(selectDefaultPageSize);

  /* ── Data ── */
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [kpiCounts, setKpiCounts] = useState({ formBuilder: 0, esign: 0, pdpa: 0 });
  const [loading, setLoading] = useState(true);

  /* ── Pagination / Sort ── */
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(globalPageSize);
  const [sortKey,  setSortKey]  = useState('created_at');
  const [sortDir,  setSortDir]  = useState('desc');

  /* ── Filters ── */
  const [search,      setSearch]      = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied,     setApplied]     = useState({ search: '', ...BLANK_SIDE });
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  /* ── View / Delete ── */
  const [viewMode,     setViewMode]  = useState('table');
  const [deleteTarget, setDelTarget] = useState(null);
  const [deleting,     setDeleting]  = useState(false);
  const [selected,     setSelected]  = useState([]);
  const [generationTargets, setGenerationTargets] = useState([]);

  document.title = 'Form Builder | CSS';

  const setSideFilter = (k, v) => setSideFilters(f => ({ ...f, [k]: v }));
  const applyFilters  = () => { setApplied({ search, ...sideFilters }); setPage(1); };

  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search: '', ...BLANK_SIDE });
    setPage(1);
  };

  const removeChip = (k) => {
    if (k === 'search') { setSearch(''); setApplied(a => ({ ...a, search: '' })); }
    else { setSideFilters(f => ({ ...f, [k]: '' })); setApplied(a => ({ ...a, [k]: '' })); }
    setPage(1);
  };

  const activeChips     = Object.entries(applied).filter(([, v]) => v !== '' && v !== undefined);
  const sideActiveCount = Object.entries(applied).filter(([k, v]) => k !== 'search' && v !== '' && v !== undefined).length;

  /* ── Fetch ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit:    pageSize,
        sort:     sortKey,
        order:    sortDir,
        ...(applied.search           && { search:          applied.search }),
        ...(applied.form_type !== '' && { form_type:       applied.form_type }),
        ...(applied.country_code     && { country_code:    applied.country_code }),
        ...(applied.default_library  && { default_library: applied.default_library }),
        ...(applied.is_pdpa  !== ''  && { pdpa_required:   applied.is_pdpa }),
      };

      const res   = await getFormTemplateList(params);
      const data  = res?.data?.data  ?? res?.data  ?? res ?? [];
      const count = res?.data?.total ?? res?.data?.totalItems ?? res?.total ?? (Array.isArray(data) ? data.length : 0);
      const counts = res?.data?.counts ?? res?.counts ?? {};
      setRows(Array.isArray(data) ? data : []);
      setTotal(count);
      setKpiCounts({
        formBuilder: Number(counts.formBuilder) || 0,
        esign: Number(counts.esign) || 0,
        pdpa: Number(counts.pdpa) || 0,
      });
    } catch (err) {
      toast.error('Failed to load form builder list');
      console.error('[FormBuilderList] fetchList error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir, applied]);

  useEffect(() => { fetchList(); }, [fetchList]);

  /* ── Sort ── */
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  /* ── KPI ── */
  const kpi = { total, ...kpiCounts };

  /* ── Selection ── */
  const isAllSelected = rows.length > 0 && selected.length === rows.length;
  const toggleAll     = () => setSelected(isAllSelected ? [] : rows.map(r => r.form_id));
  const toggleOne     = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFormTemplate(deleteTarget.form_id);
      toast.success(`"${deleteTarget.form_name}" deleted successfully`);
      setDelTarget(null);
      const newTotal = total - 1;
      const maxPage  = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);
      else fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete form');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !window.confirm(`Delete ${selected.length} form(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map(id => deleteFormTemplate(id)));
      toast.success(`${selected.length} form(s) deleted`);
      setSelected([]);
      fetchList();
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  };

  /* ── Pagination ── */
  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const half  = Math.floor(Math.min(5, totalPages) / 2);
    const start = Math.max(1, Math.min(page - half, totalPages - Math.min(5, totalPages) + 1));
    return start + i;
  });

  /* ── Render helpers ── */
  const renderType = (formType) => {
    const m = FORM_TYPE_META[Number(formType)] ?? { label: String(formType), cls: 'fb' };
    return <span className={`fbl-type-badge ${m.cls}`}>{m.label}</span>;
  };

  const renderActions = (row) => (
    <div className="fbl-action-wrap">
      {Boolean(row.status) && <button className="fbl-action-btn generate" title="Generate"
        onClick={() => setGenerationTargets([row])}>
        <i className="ri-file-download-line" />
      </button>}
      <button className="fbl-action-btn edit" title="Edit"
        onClick={() => navigate(`/form-builder/form-template/${row.form_id}`)}>
        <i className="ri-pencil-line" />
      </button>
      <button className="fbl-action-btn delete" title="Delete"
        onClick={() => setDelTarget(row)}>
        <i className="ri-delete-bin-line" />
      </button>
    </div>
  );

  /* ── Render ── */
  return (
    <div className="page-content">
      <style>{CSS}</style>
      <Container fluid>
        <BreadCrumb title="Form Template" pageTitle="Form Builder" />

        {/* ── KPI Strip ── */}
        <Row className="g-3 mb-3">
          {KPI_DEFS.map(k => (
            <Col key={k.key} xl={3} md={6}>
              <div className="fbl-kpi" style={{ background: k.light, borderColor: k.light }}>
                <div className="fbl-kpi-icon" style={{ background: k.color }}>
                  <i className={k.icon} />
                </div>
                <div>
                  <div className="fbl-kpi-val">{kpi[k.key]}</div>
                  <div className="fbl-kpi-lbl">{k.label}</div>
                </div>
                {k.key !== 'total' && total > 0 && (
                  <span className="fbl-kpi-pct" style={{ background: k.color + '22', color: k.color }}>
                    {Math.round((kpi[k.key] / total) * 100)}%
                  </span>
                )}
              </div>
            </Col>
          ))}
        </Row>

        {/* ── Main Card ── */}
        <Card style={{ minHeight: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column' }}>

          {/* ── Toolbar ── */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: 13, pointerEvents: 'none' }} />
              <Input bsSize="sm" style={{ paddingLeft: 28 }} placeholder="Search form name, slug…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <Button size="sm" onClick={applyFilters}
              style={{ background: '#405189', borderColor: '#405189' }}
              className="d-flex align-items-center gap-1">
              <i className="ri-search-line" /> Search
            </Button>

            <Button size="sm" color="light" onClick={() => setDrawerOpen(o => !o)}
              className="d-flex align-items-center gap-1 ms-1" style={{ position: 'relative' }}>
              <i className="ri-equalizer-line" /> Filters
              {sideActiveCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: '#405189', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {sideActiveCount}
                </span>
              )}
            </Button>

            {activeChips.length > 0 && (
              <button onClick={resetFilters} style={{ fontSize: 11, color: '#f06548', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ri-refresh-line" /> Reset all
              </button>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              {selected.length > 0 && (
                <>
                  <Button size="sm" color="success" outline
                    onClick={() => setGenerationTargets(rows.filter(row => selected.includes(row.form_id) && Boolean(row.status)))}
                    className="d-flex align-items-center gap-1">
                    <i className="ri-file-download-line" /> Generate ({selected.length})
                  </Button>
                  <Button size="sm" color="danger" outline onClick={handleBulkDelete}
                    className="d-flex align-items-center gap-1">
                    <i className="ri-delete-bin-line" /> Delete ({selected.length})
                  </Button>
                </>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(64,81,137,.1)', color: '#405189', borderRadius: 10, padding: '2px 8px' }}>
                {total} {total === 1 ? 'record' : 'records'}
              </span>
              <div className="btn-group" role="group">
                <button type="button"
                  className={classnames('btn btn-sm', viewMode === 'table' ? 'btn-success' : 'btn-outline-success')}
                  title="List view" onClick={() => setViewMode('table')}>
                  <i className="ri-list-unordered" />
                </button>
                <button type="button"
                  className={classnames('btn btn-sm', viewMode === 'card' ? 'btn-success' : 'btn-outline-success')}
                  title="Grid view" onClick={() => setViewMode('card')}>
                  <i className="ri-grid-fill" />
                </button>
              </div>
              <Button size="sm" color="warning"
                className="d-flex align-items-center gap-1"
                onClick={() => navigate('/form-builder/form-template/add')}>
                <i className="ri-add-line" />
                <span className="d-none d-sm-inline">Add Form</span>
              </Button>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {activeChips.length > 0 && (
            <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#878a99' }}>Active:</span>
              {activeChips.map(([k, v]) => (
                <span key={k} className="fbl-chip">
                  <span style={{ color: '#878a99', marginRight: 2 }}>{FILTER_LABELS[k] || k}:</span>{' '}
                  {k === 'form_type'
                    ? (FORM_TYPE_META[Number(v)]?.label ?? v)
                    : k === 'is_pdpa'
                      ? (v === '1' ? 'Yes' : 'No')
                      : v}
                  <button onClick={() => removeChip(k)}><i className="ri-close-line" /></button>
                </span>
              ))}
            </div>
          )}

          {/* ── Table view ── */}
          {viewMode === 'table' && (
            <div className="fbl-content-area fbl-table-wrap">
              <table className="fbl-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <Input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                    </th>
                    <th style={{ width: 44 }}>#</th>
                    {SORT_COLS.map(col => (
                      <th key={col.key}
                        className={classnames({ sortable: col.sortable })}
                        onClick={() => col.sortable && handleSort(col.key)}>
                        {col.label}
                        {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                      </th>
                    ))}
                    <th style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={SORT_COLS.length + 3} />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={SORT_COLS.length + 3} style={{ border: 'none' }}>
                        <div className="fbl-empty" style={{ minHeight: 'calc(100vh - 380px)' }}>
                          <div className="fbl-empty-icon"><i className="ri-file-unknow-line" /></div>
                          <h6>No forms found</h6>
                          <p>Try adjusting filters or{' '}
                            <Link to="/form-builder/form-template/add" style={{ color: '#405189' }}>create a new form</Link>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, idx) => (
                    <tr key={row.form_id} className={selected.includes(row.form_id) ? 'table-active' : ''}>

                      {/* Checkbox */}
                      <td>
                        <Input type="checkbox"
                          checked={selected.includes(row.form_id)}
                          onChange={() => toggleOne(row.form_id)} />
                      </td>

                      {/* Row number */}
                      <td style={{ color: '#878a99', fontSize: 12 }}>
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* Form name + download name */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.form_name}</div>
                        {row.download_name && (
                          <div style={{ fontSize: 11, color: '#878a99', fontFamily: 'monospace' }}>
                            {row.download_name}
                          </div>
                        )}
                      </td>

                      {/* Category names as pills */}
                      <td>
                        <PillList value={row.category_names} pillClass="fbl-cat-pill" />
                      </td>

                      {/* Form type badge */}
                      <td>{renderType(row.form_type)}</td>

                      {/* Orientation */}
                      <td style={{ fontSize: 12 }}>{row.orientation || '—'}</td>

                      {/* Assigned user names as pills */}
                      <td>
                        <PillList value={row.assigned_user_names} pillClass="fbl-user-pill" />
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <Badge color={`soft-${row.status ? 'success' : 'danger' }}`}
                              className={`text-${row.status ? 'success' : 'danger' } fs-11`}>
                          {row.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      
                      {/* Created date */}
                      <td style={{ fontSize: 12, color: '#878a99' }}>{fmtDate(row.created_at)}</td>

                      {/* Actions */}
                      <td>{renderActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Card / Grid view ── */}
          {viewMode === 'card' && (
            loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 380px)' }}>
                <Spinner color="primary" />
              </div>
            ) : rows.length === 0 ? (
              <div className="fbl-empty" style={{ minHeight: 'calc(100vh - 380px)' }}>
                <div className="fbl-empty-icon"><i className="ri-file-unknow-line" /></div>
                <h6>No forms found</h6>
                <p>Try adjusting filters or{' '}
                  <Link to="/form-builder/form-template/add" style={{ color: '#405189' }}>create a new form</Link>.
                </p>
              </div>
            ) : (
              <div className="fbl-card-grid">
                {rows.map(row => {
                  const m      = FORM_TYPE_META[Number(row.form_type)] ?? { label: String(row.form_type), cls: 'fb' };
                  const barClr = m.cls === 'fb' ? '#405189' : m.cls === 'esign' ? '#299cdb' : '#f0b232';
                  return (
                    <div key={row.form_id} className="fbl-card">
                      <div style={{ height: 4, background: barClr, borderRadius: '10px 10px 0 0' }} />
                      <div className="fbl-card-top">
                        <div className="fbl-card-avatar" style={{ background: avatarColor(row.form_name) }}>
                          {initials(row.form_name)}
                        </div>
                        <div className="fbl-card-name">{row.form_name}</div>
                        <div className="fbl-card-sub" style={{ fontFamily: 'monospace' }}>
                          {row.download_name || ''}
                        </div>
                        <div className="mt-2"><span className={`fbl-type-badge ${m.cls}`}>{m.label}</span></div>
                      </div>
                      <div className="fbl-card-body">
                        <div className="fbl-card-row">
                          <span className="fbl-card-row-label"><i className="ri-price-tag-3-line me-1" />Category</span>
                          <div style={{ maxWidth: 160 }}>
                            <PillList value={row.category_names} pillClass="fbl-cat-pill" />
                          </div>
                        </div>
                        <div className="fbl-card-row">
                          <span className="fbl-card-row-label"><i className="ri-layout-line me-1" />Orientation</span>
                          <span style={{ fontSize: 12 }}>{row.orientation || '—'}</span>
                        </div>
                        <div className="fbl-card-row">
                          <span className="fbl-card-row-label"><i className="ri-user-line me-1" />Assigned</span>
                          <div style={{ maxWidth: 160 }}>
                            <PillList value={row.assigned_user_names} pillClass="fbl-user-pill" />
                          </div>
                        </div>
                        <div className="fbl-card-row">
                          <span className="fbl-card-row-label"><i className="ri-calendar-line me-1" />Created</span>
                          <span style={{ fontSize: 12 }}>{fmtDate(row.created_at)}</span>
                        </div>
                      </div>
                      <div className="fbl-card-footer">{renderActions(row)}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Pagination ── */}
          {!loading && rows.length > 0 && (
            <div style={{ padding: '8px 18px', borderTop: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#878a99' }}>Show</span>
                <Input type="select" bsSize="sm" style={{ width: 70 }}
                  value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </Input>
                <small className="text-muted">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
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

      {/* ── Side Filter Drawer ── */}
      <SideFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={sideFilters}
        setFilter={setSideFilter}
        onApply={applyFilters}
        onReset={() => { resetFilters(); setDrawerOpen(false); }}
      />

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => !deleting && setDelTarget(null)} centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => !deleting && setDelTarget(null)} style={{ border: 'none', paddingBottom: 0 }} />
        <ModalBody>
          <div className="fbl-del-modal">
            <div className="fbl-del-icon"><i className="ri-delete-bin-5-line" /></div>
            <h5>Delete Form?</h5>
            <p>
              <strong>"{deleteTarget?.form_name}"</strong> will be permanently removed.<br />
              This cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border: 'none', justifyContent: 'center', gap: 10 }}>
          <Button color="light" size="sm" onClick={() => setDelTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting}
            className="d-flex align-items-center gap-1">
            {deleting
              ? <><Spinner size="sm" /> Deleting…</>
              : <><i className="ri-delete-bin-line" /> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>
      <GenerationPopup
        forms={generationTargets}
        isOpen={generationTargets.length > 0}
        onClose={() => setGenerationTargets([])}
      />
    </div>
  );
};

export default FormBuilderList;
