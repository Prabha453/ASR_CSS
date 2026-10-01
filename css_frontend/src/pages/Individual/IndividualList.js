import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getIndividualList, deleteIndividual } from '../../helpers/backend_helper';
import { hasPermission } from '../../helpers/permissionHelper';
import './IndividualList.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#405189','#0ab39c','#f06548','#f0b232','#299cdb','#6559cc','#e83e8c','#20c997','#fd7e14','#6c757d'];
const STATUS_META   = {
  ACTIVE:   { label:'Active',   cls:'active'   },
  INACTIVE: { label:'Inactive', cls:'inactive' },
  PENDING:  { label:'Pending',  cls:'pending'  },
};

const KPI_DEFS = [
  { key:'total',    label:'Total Individuals', icon:'ri-user-3-line',          color:'#405189', light:'rgba(64,81,137,.1)'   },
  { key:'active',   label:'Active',            icon:'ri-checkbox-circle-line', color:'#0ab39c', light:'rgba(10,179,156,.1)'  },
  { key:'inactive', label:'Inactive',          icon:'ri-close-circle-line',    color:'#f06548', light:'rgba(240,101,72,.1)'  },
];

// Updated columns: Removed Risk and Created Date
const SORT_COLS = [
  { key:'name',         label:'Individual',    sortable:true  },
  { key:'id_info',      label:'ID Info',       sortable:false },
  { key:'address',      label:'Address',       sortable:false },
  { key:'email',        label:'Email',         sortable:false },
  { key:'contact_no',   label:'Contact No.',   sortable:false },
  { key:'status',       label:'Status',        sortable:true  },
];

const BLANK_SIDE = {
  status:'', nationality:'',
  dob_from:'', dob_to:'', created_from:'', created_to:'',
};

const FILTER_LABELS = {
  status:'Status', nationality:'Nationality',
  dob_from:'DOB From', dob_to:'DOB To',
  created_from:'Created From', created_to:'Created To',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials    = (name = '') => name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const fmtDate     = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' }); };
const calcAge     = (dob) => { if (!dob) return null; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365.25)); };

// ── Helper Functions ──────────────────────────────────────────────────────

const getPrimaryIdentification = (identifications = []) => {
  if (!identifications || identifications.length === 0) {
    return null;
  }
  const primary = identifications.find(id => id.is_primary === true);
  return primary || identifications[0];
};

const formatIdentification = (identification) => {
  if (!identification) {
    return 'Not Provided';
  }
  const idType = identification.id_type?.id_name || '';
  const idNumber = identification.id_number || '';
  if (idType && idNumber) {
    return `${idType}: ${idNumber}`;
  }
  return idNumber || 'Not Provided';
};

const getPrimaryAddress = (addresses = []) => {
  if (!addresses || addresses.length === 0) {
    return null;
  }
  const primary = addresses.find(addr => addr.is_primary === true);
  return primary || addresses[0];
};

const formatAddress = (address) => {
  if (!address) {
    return 'Not Provided';
  }
  const parts = [];
  if (address.block_no) {
    parts.push(`Blk ${address.block_no}`);
  }
  if (address.street_name) {
    parts.push(address.street_name);
  }
  if (address.building_name) {
    parts.push(address.building_name);
  }
  const levelUnit = [];
  if (address.level_no) {
    levelUnit.push(`#${address.level_no}`);
  }
  if (address.unit_no) {
    levelUnit.push(`-${address.unit_no}`);
  }
  if (levelUnit.length > 0) {
    parts.push(levelUnit.join(''));
  }
  if (address.postal_code) {
    parts.push(`Singapore ${address.postal_code}`);
  } else if (address.country) {
    parts.push(address.country);
  }
  return parts.length > 0 ? parts.join(', ') : 'Not Provided';
};

const getAddressTypeLabel = (address) => {
  if (!address) return '';
  const types = {
    'CONTACT': 'Contact',
    'RESIDENTIAL': 'Residential',
    'FOREIGN': 'Foreign',
  };
  return types[address.address_type] || address.address_type || '';
};

// ── Helper Functions for Email and Contact ─────────────────────────────

const getPrimaryEmail = (contacts = []) => {
  if (!contacts || contacts.length === 0) {
    return null;
  }
  const primary = contacts.find(c => c.is_primary === true && c.contact_type === 'EMAIL');
  if (primary) return primary;
  return contacts.find(c => c.contact_type === 'EMAIL') || null;
};

const getPrimaryContact = (contacts = []) => {
  if (!contacts || contacts.length === 0) {
    return null;
  }
  const primaryMobile = contacts.find(c => c.is_primary === true && c.contact_type === 'MOBILE');
  if (primaryMobile) return primaryMobile;
  
  const mobile = contacts.find(c => c.contact_type === 'MOBILE');
  if (mobile) return mobile;
  
  return contacts.find(c => c.contact_type === 'OFFICE') || null;
};

const formatContact = (contact) => {
  if (!contact) {
    return 'Not Provided';
  }
  const code = contact.phone_country_code || '';
  const value = contact.contact_value || '';
  if (code && value) {
    return `${code} ${value}`;
  }
  return value || 'NNot Provided';
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill   asc',  { active: sortKey===col && sortDir==='asc'  })}></i>
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

// ── Redux selector ─────────────────────────────────────────────────────────────

const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);

// ── Side Filter Drawer ─────────────────────────────────────────────────────────

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
    background: #f3f4f6; color: #374151;
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

const SideFilterDrawer = ({ open, onClose, filters, setFilter, onApply, onReset }) => (
  <>
    <style>{drawerStyles}</style>
    {open && <div className="cf-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('cf-drawer', { open })}>
      <div className="cf-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary"></i>Advanced Filters</h6>
        <button className="cf-drawer-close" onClick={onClose}><i className="ri-close-line" /></button>
      </div>

      <div className="cf-drawer-body">

        <div className="cf-section-divider">Individual</div>

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
          <label>Nationality</label>
          <Input bsSize="sm" placeholder="e.g. Singaporean"
            value={filters.nationality} onChange={e => setFilter('nationality', e.target.value)} />
        </div>

        <div className="cf-section-divider">Date Ranges</div>

        <div className="cf-filter-group">
          <label>Date of Birth</label>
          <div className="d-flex gap-2">
            <DatePickerInput value={filters.dob_from} onChange={e => setFilter('dob_from', e.target.value)} />
            <DatePickerInput value={filters.dob_to} onChange={e => setFilter('dob_to', e.target.value)} />
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

// ── Main ──────────────────────────────────────────────────────────────────────

const IndividualList = () => {
  useCollapseSidebar();
  const navigate       = useNavigate();
  const globalPageSize = useSelector(selectDefaultPageSize);

  const canView   = hasPermission('individual', 'view');
  const canCreate = hasPermission('individual', 'create');
  const canEdit   = hasPermission('individual', 'edit');
  const canDelete = hasPermission('individual', 'delete');

  // ── Data ──
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Pagination / Sort ──
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(globalPageSize);
  const [sortKey,  setSortKey]  = useState('name');
  const [sortDir,  setSortDir]  = useState('asc');

  // ── Filters ──
  const [search,      setSearch]      = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied,     setApplied]     = useState({ search:'', ...BLANK_SIDE });
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  // ── View / Delete ──
  const [viewMode,     setViewMode]  = useState('table');
  const [deleteTarget, setDelTarget] = useState(null);
  const [deleting,     setDeleting]  = useState(false);

  useEffect(() => { setPageSize(globalPageSize); setPage(1); }, [globalPageSize]);

  document.title = 'Individuals | ASR CSS';

  const setSideFilter = (k, v) => setSideFilters(f => ({ ...f, [k]: v }));

  const applyFilters = () => { setApplied({ search, ...sideFilters }); setPage(1); };

  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search:'', ...BLANK_SIDE });
    setPage(1);
  };

  const removeChip = (k) => {
    if (k === 'search') {
      setSearch('');
      setApplied(a => ({ ...a, search:'' }));
    } else {
      setSideFilters(f => ({ ...f, [k]:'' }));
      setApplied(a => ({ ...a, [k]:'' }));
    }
    setPage(1);
  };

  const activeChips     = Object.entries(applied).filter(([,v]) => v);
  const sideActiveCount = Object.entries(applied).filter(([k,v]) => k !== 'search' && v).length;

  // ── Fetch ──
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:pageSize, sort:sortKey, order:sortDir };
      if (applied.search)       params.search       = applied.search;
      if (applied.status)       params.status       = applied.status;
      if (applied.nationality)  params.nationality  = applied.nationality;
      if (applied.dob_from)     params.dob_from     = applied.dob_from;
      if (applied.dob_to)       params.dob_to       = applied.dob_to;
      if (applied.created_from) params.created_from = applied.created_from;
      if (applied.created_to)   params.created_to   = applied.created_to;

      const res   = await getIndividualList(params);
      const data  = res?.data?.data  ?? res?.data  ?? res ?? [];
      const count = res?.data?.total ?? res?.data?.totalItems ?? res?.total ?? (Array.isArray(data) ? data.length : 0);
      setRows(Array.isArray(data) ? data : []);
      setTotal(count);
    } catch {
      toast.error('Failed to load individuals');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir, applied]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Sort ──
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d==='asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  // ── KPI ──
  const kpi = useMemo(() => ({
    total,
    active:   rows.filter(r => r.status === 'ACTIVE').length,
    inactive: rows.filter(r => r.status === 'INACTIVE').length,
  }), [rows, total]);

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteIndividual(deleteTarget.entity_id);
      toast.success(`${deleteTarget.name} removed`);
      setDelTarget(null);
      fetchList();
    } catch {
      toast.error('Failed to delete individual');
    } finally {
      setDeleting(false);
    }
  };

  // ── Access guard ──
  if (!canView) return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Individuals" pageTitle="Entity Management" />
        <Card>
          <CardBody className="text-center py-5">
            <i className="ri-shield-keyhole-line" style={{ fontSize:48, color:'#dc2626' }} />
            <h5 className="mt-3 mb-1">Access Denied</h5>
            <p className="text-muted mb-0">You do not have permission to view Individuals.</p>
          </CardBody>
        </Card>
      </Container>
    </div>
  );

  // ── Row helpers ──
  const detail = (row) => row.individual_detail || row.entity_individual_detail || {};
  
  const renderStatus = (row) => { 
    const m = STATUS_META[row.status] || { label:row.status, cls:'pending' }; 
    return <span className={`il-badge ${m.cls}`}>{m.label}</span>; 
  };

  // ── Render ID Info ──
  const renderIdInfo = (row) => {
    const primaryId = getPrimaryIdentification(row.identifications);
    if (!primaryId) {
      return <span className="il-rich-mid-val empty" style={{ fontSize: 12 }}>Not Provided</span>;
    }
    const formatted = formatIdentification(primaryId);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 500,  }}>{formatted}</span>
        {row.identifications && row.identifications.length > 1 && (
          <span style={{ fontSize: 9, color: '#878a99' }}>
            +{row.identifications.length - 1} more
          </span>
        )}
      </div>
    );
  };

  // ── Render Address Info ──
  const renderAddressInfo = (row) => {
    const primaryAddr = getPrimaryAddress(row.addresses);
    if (!primaryAddr) {
      return <span className="il-rich-mid-val empty" style={{ fontSize: 12 }}>Not Provided</span>;
    }
    const formatted = formatAddress(primaryAddr);
    const addrType = getAddressTypeLabel(primaryAddr);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12 }}>{formatted}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {addrType && (
            <span style={{ 
              fontSize: 9, 
              color: '#878a99', 
              background: '#f3f4f6', 
              padding: '1px 6px', 
              borderRadius: 10,
              display: 'inline-block'
            }}>
              {addrType}
            </span>
          )}
          {row.addresses && row.addresses.length > 1 && (
            <span style={{ fontSize: 9, color: '#878a99' }}>
              +{row.addresses.length - 1} more
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Render Email ──
  const renderEmail = (row) => {
    const primaryEmail = getPrimaryEmail(row.contacts);
    if (!primaryEmail) {
      return <span className="il-rich-mid-val empty" style={{ fontSize: 12 }}>Not Provided</span>;
    }
    return (
      <span style={{ fontSize: 12 }}>
        {primaryEmail.contact_value || 'Not Provided'}
      </span>
    );
  };

  // ── Render Contact No ──
  const renderContactNo = (row) => {
    const primaryContact = getPrimaryContact(row.contacts);
    if (!primaryContact) {
      return <span className="il-rich-mid-val empty" style={{ fontSize: 12 }}>Not Provided</span>;
    }
    return (
      <span style={{ fontSize: 12 }}>
        {formatContact(primaryContact)}
      </span>
    );
  };

  const renderActions = (row) => (
    <div className="il-action-wrap">
      <button className="il-action-btn view" title="View Profile"
        onClick={() => navigate(`/individual/${row.entity_id}`)}>
        <i className="ri-eye-line"></i>
      </button>
      {canEdit && (
        <button className="il-action-btn edit" title="Edit"
          onClick={() => navigate(`/individual/edit/${row.entity_id}`)}>
          <i className="ri-pencil-line"></i>
        </button>
      )}
      {canDelete && (
        <button className="il-action-btn delete" title="Delete"
          onClick={() => setDelTarget(row)}>
          <i className="ri-delete-bin-line"></i>
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Individuals" pageTitle="Entity Management" />

        {/* ── KPI Strip ── */}
        <Row className="g-3 mb-3">
          {KPI_DEFS.map(k => (
            <Col key={k.key} xl={4} md={6}>
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

            {/* Quick search */}
            <div style={{ position:'relative', flex:'1 1 220px', maxWidth:340 }}>
              <i className="ri-search-line" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#878a99', fontSize:13, pointerEvents:'none' }}></i>
              <Input bsSize="sm" style={{ paddingLeft:28 }} placeholder="Search name, ID number…"
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

            {/* Advanced filter toggle */}
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
              <div className="btn-group" role="group">
                <button type="button"
                  className={classnames('btn btn-sm', viewMode==='table' ? 'btn-success' : 'btn-outline-success')}
                  title="List view" onClick={() => setViewMode('table')}>
                  <i className="ri-list-unordered"></i>
                </button>
                <button type="button"
                  className={classnames('btn btn-sm', viewMode==='card' ? 'btn-success' : 'btn-outline-success')}
                  title="Grid view" onClick={() => setViewMode('card')}>
                  <i className="ri-grid-fill"></i>
                </button>
              </div>
              {canCreate && (
                <Link to="/individual/add" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                  <i className="ri-user-add-line"></i>
                  <span className="d-none d-sm-inline">Add Individual</span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {activeChips.length > 0 && (
            <div style={{ padding:'6px 18px', borderBottom:'1px solid var(--vz-border-color)', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#878a99' }}>Active:</span>
              {activeChips.map(([k, v]) => (
                <span key={k} className="il-chip">
                  <span style={{ color:'#878a99', marginRight:2 }}>{FILTER_LABELS[k] || k}:</span> {v}
                  <button onClick={() => removeChip(k)}><i className="ri-close-line"></i></button>
                </span>
              ))}
            </div>
          )}

          {/* ── Table view ── */}
          {viewMode === 'table' && (
            <div className="il-table-wrap">
              <table className="il-table">
                <thead>
                  <tr>
                    <th style={{ width:40, textAlign:'center' }}>#</th>
                    {SORT_COLS.map(col => (
                      <th key={col.key}
                        className={classnames({ sortable:col.sortable, 'sort-asc':sortKey===col.key&&sortDir==='asc', 'sort-desc':sortKey===col.key&&sortDir==='desc' })}
                        onClick={() => col.sortable && handleSort(col.key)}>
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
                          <div className="il-empty-icon"><i className="ri-user-search-line"></i></div>
                          <h6>No individuals found</h6>
                          <p>Try adjusting filters or&nbsp;
                            <Link to="/individual/add" style={{ color:'#405189' }}>add a new individual</Link>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, idx) => {
                    const d   = detail(row);
                    const age = calcAge(d.member_dob);
                    return (
                      <tr key={row.entity_id} className={`status-${(row.status||'pending').toLowerCase()}`}>
                        <td style={{ textAlign:'center', color:'#878a99', fontSize:12 }}>
                          {(page-1)*pageSize + idx + 1}
                        </td>
                        <td>
                          <div className="il-name-cell">
                            <div className="il-avatar" style={{ background: avatarColor(row.name) }}>
                              {initials(row.name)}
                            </div>
                            <div className="il-name-text">
                              <b>{row.name}</b>
                              <small>
                                {age ? `${age} yrs` : ''}
                                {age && d.member_nationality ? ' · ' : ''}
                                {d.member_nationality || ''}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          {renderIdInfo(row)}
                        </td>
                        <td style={{ minWidth: 180 }}>
                          {renderAddressInfo(row)}
                        </td>
                        <td style={{ minWidth: 140 }}>
                          {renderEmail(row)}
                        </td>
                        <td style={{ minWidth: 120 }}>
                          {renderContactNo(row)}
                        </td>
                        <td>{renderStatus(row)}</td>
                        <td>{renderActions(row)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Card / Grid view ── */}
          {viewMode === 'card' && (
            loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height:200 }}>
                <Spinner color="primary" />
              </div>
            ) : rows.length === 0 ? (
              <div className="il-empty">
                <div className="il-empty-icon"><i className="ri-user-search-line"></i></div>
                <h6>No individuals found</h6>
                <p>Try adjusting filters or <Link to="/individual/add" style={{ color:'#405189' }}>add a new individual</Link>.</p>
              </div>
            ) : (
              <div className="il-card-grid">
                {rows.map(row => {
                  const d   = detail(row);
                  const age = calcAge(d.member_dob);
                  const sm  = STATUS_META[row.status] || { label:row.status, cls:'pending' };
                  const barClr = sm.cls==='active' ? '#0ab39c' : sm.cls==='inactive' ? '#f06548' : '#f0b232';
                  const primaryId = getPrimaryIdentification(row.identifications);
                  const primaryAddr = getPrimaryAddress(row.addresses);
                  const primaryEmail = getPrimaryEmail(row.contacts);
                  const primaryContact = getPrimaryContact(row.contacts);
                  
                  return (
                    <div key={row.entity_id} className="il-card">
                      <div style={{ height:4, background:barClr, borderRadius:'10px 10px 0 0' }} />
                      <div className="il-card-top">
                        <div className="il-card-avatar" style={{ background: avatarColor(row.name) }}>
                          {initials(row.name)}
                        </div>
                        <div className="il-card-name">{row.name}</div>
                        
                        {/* ID Info in Card */}
                        {primaryId && (
                          <div style={{ 
                            fontSize: 11, 
                            color: '#405189', 
                            background: 'rgba(64,81,137,.08)', 
                            padding: '2px 10px', 
                            borderRadius: 12,
                            marginTop: 2
                          }}>
                            {formatIdentification(primaryId)}
                          </div>
                        )}
                        
                        {/* Address in Card */}
                        {primaryAddr && (
                          <div style={{ 
                            fontSize: 10, 
                            color: '#878a99', 
                            marginTop: 2,
                            textAlign: 'center'
                          }}>
                            {formatAddress(primaryAddr)}
                          </div>
                        )}
                        
                        {/* Email in Card */}
                        {primaryEmail && (
                          <div style={{ 
                            fontSize: 10, 
                            color: '#299cdb', 
                            marginTop: 2,
                            textAlign: 'center'
                          }}>
                            <i className="ri-mail-line" style={{ marginRight: 2 }} />
                            {primaryEmail.contact_value}
                          </div>
                        )}
                        
                        {/* Contact in Card */}
                        {primaryContact && (
                          <div style={{ 
                            fontSize: 10, 
                            color: '#0ab39c', 
                            marginTop: 2,
                            textAlign: 'center'
                          }}>
                            <i className="ri-phone-line" style={{ marginRight: 2 }} />
                            {formatContact(primaryContact)}
                          </div>
                        )}
                        
                        <div className="mt-2"><span className={`il-badge ${sm.cls}`}>{sm.label}</span></div>
                      </div>
                      <div className="il-card-body">
                        {d.member_nationality && (
                          <div className="il-card-row">
                            <span className="il-card-row-label"><i className="ri-flag-line me-1"></i>Nationality</span>
                            <span>{d.member_nationality}</span>
                          </div>
                        )}
                        {age && (
                          <div className="il-card-row">
                            <span className="il-card-row-label"><i className="ri-calendar-line me-1"></i>Age</span>
                            <span>{age} yrs</span>
                          </div>
                        )}
                      </div>
                      <div className="il-card-footer">{renderActions(row)}</div>
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

      {/* ── Side Filter Drawer ── */}
      <SideFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={sideFilters}
        setFilter={setSideFilter}
        onApply={applyFilters}
        onReset={() => { resetFilters(); setDrawerOpen(false); }}
      />

      {/* Delete modal */}
      <Modal isOpen={canDelete && !!deleteTarget} toggle={() => setDelTarget(null)} centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => setDelTarget(null)} style={{ border:'none', paddingBottom:0 }} />
        <ModalBody>
          <div className="il-del-modal">
            <div className="il-del-icon"><i className="ri-delete-bin-5-line"></i></div>
            <h5>Delete Individual?</h5>
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

export default IndividualList;
