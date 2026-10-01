import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Container, Card, CardBody, Row, Col, Input, Button, Spinner } from 'reactstrap';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getCompanyList, getOfficialMasterList, getOfficialList, deleteOfficial } from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

const RISK_META = {
  LOW:       { label: 'Low',       cls: 'LOW'       },
  MEDIUM:    { label: 'Medium',    cls: 'MEDIUM'    },
  HIGH:      { label: 'High',      cls: 'HIGH'      },
  VERY_HIGH: { label: 'Very High', cls: 'VERY_HIGH' },
};
const renderRisk = (row) => {
  const r = row.company_detail?.risk_assessment_rating;
  if (!r) return <span className="text-muted">—</span>;
  const m = RISK_META[r] || { label: r, cls: r };
  return <span className={`il-risk-dot ${m.cls}`}>{m.label}</span>;
};

const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);

// Color / icon palettes assigned by index to official master items
const OT_COLORS = ['#405189','#0ab39c','#6559cc','#f7b84b','#299cdb','#f06548','#e91e63','#20c997','#fd7e14','#6c757d'];
const OT_ICONS  = ['ri-user-star-line','ri-group-line','ri-shield-user-line','ri-file-search-line','ri-briefcase-line','ri-user-line','ri-account-circle-line','ri-team-line','ri-building-line','ri-profile-line'];

const mapOfficialMaster = (items) =>
  items.map((item, idx) => {
    const color = OT_COLORS[idx % OT_COLORS.length];
    return {
      id:               item.official_master_id,
      key:              item.official_master_slug,
      label:            item.official_master_name,
      icon:             OT_ICONS[idx % OT_ICONS.length],
      color,
      light:            color + '1f',
      isRepresentative: !!item.is_representative,
      isShow:           !!item.is_show,
      parentSlugs:      item.parent_slugs ? item.parent_slugs.split(',').map(s => s.trim()) : [],
    };
  });

const BLANK_SIDE = { status: '' };
const FILTER_LABELS = { status: 'Status', entity: 'Search' };

const drawerStyles = `
  .cf-drawer-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:1040;transition:opacity .2s; }
  .cf-drawer { position:fixed;top:0;right:0;bottom:0;width:320px;background:#fff;background:var(--vz-card-bg,#fff);box-shadow:-4px 0 24px rgba(0,0,0,.12);z-index:1041;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .25s ease; }
  .cf-drawer.open { transform:translateX(0); }
  .cf-drawer-head { display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--vz-border-color);flex-shrink:0; }
  .cf-drawer-head h6 { margin:0;font-size:14px;font-weight:600; }
  .cf-drawer-close { width:28px;height:28px;border-radius:6px;border:none;background:var(--vz-light);color:var(--vz-body-color);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px; }
  .cf-drawer-body { flex:1;overflow-y:auto;padding:16px 18px; }
  .cf-drawer-foot { padding:12px 18px;border-top:1px solid var(--vz-border-color);display:flex;gap:8px;flex-shrink:0; }
  .cf-filter-group { margin-bottom:14px; }
  .cf-filter-group label { font-size:11px;font-weight:600;color:#878a99;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;display:block; }
  .cf-section-divider { font-size:10px;font-weight:700;color:#405189;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 10px;padding-bottom:4px;border-bottom:1px solid var(--vz-border-color); }
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
      </div>
      <div className="cf-drawer-foot">
        <Button size="sm" color="light" onClick={onReset} className="d-flex align-items-center gap-1">
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

// Helpers
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const AVATAR_COLORS = ['#405189','#0ab39c','#6559cc','#f7b84b','#299cdb','#f06548','#e91e63'];
const avatarColor   = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const styles = `
  /* KPI strip */
  .oa-kpi { border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; border: 1px solid transparent; transition: transform 0.15s, box-shadow 0.15s; }
  .oa-kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 18px rgba(0,0,0,0.08); }
  .oa-kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
  .oa-kpi-val  { font-size: 22px; font-weight: 700; line-height: 1; color: var(--vz-body-color); }
  .oa-kpi-lbl  { font-size: 11px; color: var(--vz-sidebar-sub-item-color, #878a99); margin-top: 2px; font-weight: 500; }

  /* Filter bar */
  .oa-filter { border-bottom: 1px solid var(--vz-border-color); padding-bottom: 14px; margin-bottom: 14px; }
  .oa-filter-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; padding: 3px 8px 3px 10px;
    border-radius: 20px; background: rgba(64,81,137,0.1); color: #405189;
    border: 1px solid rgba(64,81,137,0.2); margin-right: 5px;
  }
  .oa-filter-chip button { background: none; border: none; cursor: pointer; color: #405189; font-size: 13px; line-height: 1; padding: 0 0 0 2px; }

  /* Table */
  .oa-table { font-size: 13px; }
  .oa-table thead tr { background: #eef0f8; border-bottom: 1px solid #c8cde6; }
  .oa-table thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #2c3558; padding: 7px 12px; white-space: nowrap; background: #eef0f8; border: none; user-select: none; }
  .oa-table tbody td { padding: 6px 12px; vertical-align: middle; border-bottom: 1px solid var(--vz-border-color); }
  .oa-table tbody tr { transition: background 0.12s; cursor: default; }
  .oa-table tbody tr:hover { background: var(--vz-light); }
  .oa-table tbody tr.status-inactive { opacity: 0.72; }
  .oa-table tbody tr.status-active td:first-child   { box-shadow: inset 3px 0 0 #0ab39c; }
  .oa-table tbody tr.status-inactive td:first-child  { box-shadow: inset 3px 0 0 #f06548; }
  .oa-table tbody tr.status-pending td:first-child   { box-shadow: inset 3px 0 0 #f7b84b; }

  /* Company cell */
  .oa-co-cell { display: flex; align-items: center; gap: 10px; }
  .oa-co-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .oa-co-name   { font-size: 13px; font-weight: 600; color: var(--vz-body-color); line-height: 1.2; }
  .oa-co-no     { font-size: 10px; color: var(--vz-sidebar-sub-item-color, #878a99); margin-top: 1px; }

  /* Status badge */
  .oa-status { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: .04em; }
  .oa-status-active   { background: rgba(10,179,156,0.12); color: #0ab39c; }
  .oa-status-inactive { background: rgba(240,101,72,0.12); color: #f06548; }
  .oa-status-pending  { background: rgba(247,184,75,0.12); color: #f7b84b; }

  /* Action dropdown */
  .oa-action-wrap { position: relative; display: inline-block; }
  .oa-action-btn  { display: flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 8px; border: 1.5px solid #405189; background: transparent; font-size: 12px; font-weight: 600; cursor: pointer; color: #405189; transition: all 0.15s; white-space: nowrap; }
  .oa-action-btn:hover { background: rgba(64,81,137,0.08); box-shadow: 0 2px 10px rgba(64,81,137,0.2); }
  .oa-action-btn.open  { background: #405189; color: #fff; box-shadow: 0 4px 14px rgba(64,81,137,0.35); }
  .oa-action-btn.open i { color: #fff; }

  /* Mega panel */
  .oa-mega {
    position: fixed; z-index: 1500;
    background: var(--vz-card-bg, #fff);
    border: 1px solid var(--vz-border-color, #e9ebec);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07);
    width: 480px;
    overflow: hidden;
    animation: oaMegaIn 0.16s cubic-bezier(.22,.68,0,1.2);
  }
  @keyframes oaMegaIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }

  .oa-mega-head {
    padding: 9px 12px 8px;
    background: linear-gradient(135deg, #405189 0%, #0ab39c 100%);
    display: flex; align-items: center; justify-content: space-between;
  }
  .oa-mega-head-title { font-size: 11.5px; font-weight: 700; color: #fff; letter-spacing: .03em; display: flex; align-items: center; gap: 6px; }
  .oa-mega-search-wrap { position: relative; }
  .oa-mega-search {
    height: 24px; width: 120px; padding: 0 8px 0 24px;
    border-radius: 20px; border: none; outline: none;
    background: rgba(255,255,255,0.2); color: #fff;
    font-size: 11px; transition: background 0.2s, width 0.2s;
  }
  .oa-mega-search::placeholder { color: rgba(255,255,255,0.65); }
  .oa-mega-search:focus { background: rgba(255,255,255,0.3); width: 140px; }
  .oa-mega-search-icon { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.75); font-size: 12px; pointer-events: none; }

  .oa-mega-body-wrap { position: relative; }
  .oa-mega-body { padding: 8px 10px; max-height: 260px; overflow-y: auto; overflow-x: hidden; }
  .oa-mega-body::-webkit-scrollbar { width: 3px; }
  .oa-mega-body::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
  .oa-mega-more-hint {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 44px;
    background: linear-gradient(to bottom, transparent 0%, var(--vz-card-bg, #fff) 70%);
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 5px;
    font-size: 10.5px; font-weight: 600; color: #405189;
    cursor: pointer; letter-spacing: .02em;
  }
  .oa-mega-more-hint:hover { color: #2d3a6b; }
  .oa-mega-more-hint i { font-size: 14px; animation: bounceDown 1s infinite; }
  @keyframes bounceDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }

  .oa-mega-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }

  .oa-mega-card {
    display: flex; flex-direction: row; align-items: center;
    gap: 8px; padding: 7px 9px;
    border-radius: 8px; cursor: pointer;
    border: 1px solid var(--vz-border-color, #e9ebec);
    background: var(--vz-light, #f8f9fa);
    transition: all 0.13s;
  }
  .oa-mega-card:hover { border-color: var(--card-color); background: var(--card-light); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .oa-mega-card-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
    transition: transform 0.13s;
  }
  .oa-mega-card:hover .oa-mega-card-icon { transform: scale(1.08); }
  .oa-mega-card-label { font-size: 11px; font-weight: 600; color: var(--vz-body-color); line-height: 1.2; }

  .oa-mega-empty { text-align: center; padding: 18px 12px; color: #878a99; font-size: 12px; }
  .oa-mega-empty i { font-size: 20px; display: block; margin-bottom: 5px; opacity: 0.35; }

  /* Drawer */
  .oa-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 1600; animation: oaBdIn 0.2s ease; }
  @keyframes oaBdIn { from { opacity:0; } to { opacity:1; } }
  .oa-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(480px, 96vw);
    background: #fff;
    background: var(--vz-card-bg, #fff);
    z-index: 1700;
    display: flex; flex-direction: column;
    box-shadow: -6px 0 30px rgba(0,0,0,0.22);
    animation: oaDrIn 0.25s ease;
  }
  @keyframes oaDrIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .oa-drawer-head { padding: 16px 18px; border-bottom: 1px solid var(--vz-border-color); flex-shrink: 0; }
  .oa-drawer-title { font-size: 14px; font-weight: 700; color: var(--vz-body-color); margin: 0; line-height: 1.3; }
  .oa-drawer-sub   { font-size: 11px; color: var(--vz-sidebar-sub-item-color); margin-top: 2px; }
  .oa-drawer-close { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--vz-sidebar-sub-item-color); padding: 2px; line-height: 1; }
  .oa-drawer-close:hover { color: var(--vz-body-color); }

  /* Drawer tabs */
  .oa-dtabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--vz-border-color); flex-shrink: 0; padding: 0 8px; gap: 2px; scrollbar-width: none; }
  .oa-dtabs::-webkit-scrollbar { display: none; }
  .oa-dtab { display: flex; align-items: center; gap: 5px; padding: 10px 12px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--vz-sidebar-sub-item-color); border-bottom: 2px solid transparent; white-space: nowrap; transition: color 0.15s, border-color 0.15s; }
  .oa-dtab:hover { color: var(--vz-body-color); }
  .oa-dtab.active { color: #405189; border-bottom-color: #405189; font-weight: 600; }
  .oa-dtab .oa-dtab-cnt { font-size: 10px; padding: 1px 5px; border-radius: 10px; background: var(--vz-light); }
  .oa-dtab.active .oa-dtab-cnt { background: rgba(64,81,137,0.15); color: #405189; }

  /* Drawer body */
  .oa-drawer-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
  .oa-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing:.07em; color: var(--vz-sidebar-sub-item-color); padding: 10px 0 6px; display: flex; align-items: center; gap: 6px; }
  .oa-section-label::after { content:''; flex:1; height:1px; background: var(--vz-border-color); }

  /* Official row */
  .oa-official-row { border: 1px solid var(--vz-border-color,#e9ebec); border-radius: 9px; margin-bottom: 8px; background: var(--vz-light,#f8f9fa); transition: border-color .15s, box-shadow .15s; }
  .oa-official-row:hover { border-color: #405189; box-shadow: 0 2px 10px rgba(64,81,137,.08); }
  .oa-official-main { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
  .oa-official-avatar { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .oa-official-name   { font-size: 12.5px; font-weight: 600; color: var(--vz-body-color); }
  .oa-official-id     { font-size: 10.5px; color: var(--vz-sidebar-sub-item-color); margin-top: 1px; }
  .oa-official-detail { font-size: 11px; color: var(--vz-sidebar-sub-item-color); margin-top: 1px; }
  .oa-official-badge  { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; }
  .oa-official-foot   { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-top: 1px dashed var(--vz-border-color); }
  .oa-official-date-chip { font-size: 10.5px; color: #878a99; display: flex; align-items: center; gap: 4px; }
  .oa-official-actions { margin-left: auto; display: flex; gap: 6px; }
  .oa-btn-edit { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: 1px solid var(--vz-border-color); background: transparent; cursor: pointer; color: #405189; transition: background .12s; }
  .oa-btn-edit:hover { background: rgba(64,81,137,.08); }
  .oa-btn-del  { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: 1px solid var(--vz-border-color); background: transparent; cursor: pointer; color: #f06548; transition: background .12s; }
  .oa-btn-del:hover  { background: rgba(240,101,72,.08); }

  .oa-empty { text-align: center; padding: 28px 14px; color: var(--vz-sidebar-sub-item-color); }
  .oa-empty i { font-size: 28px; display: block; margin-bottom: 6px; opacity: 0.4; }
  .oa-empty p { font-size: 12px; margin: 0; }

  /* Drawer footer */
  .oa-drawer-foot { padding: 12px 16px; border-top: 1px solid var(--vz-border-color, #e9ebec); flex-shrink: 0; background: #f8f9fa; background: var(--vz-light, #f8f9fa); }

  /* Search in drawer */
  .oa-drawer-search { position: relative; margin-bottom: 10px; }
  .oa-drawer-search input { padding-left: 32px; font-size: 12px; }
  .oa-drawer-search i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--vz-sidebar-sub-item-color); font-size: 14px; }

  /* Skeleton */
  .oa-skeleton td { padding: 11px 12px; }
  .oa-skeleton-line { height: 12px; border-radius: 4px; background: linear-gradient(90deg, var(--vz-light) 25%, #e9ecef 50%, var(--vz-light) 75%); background-size: 200% 100%; animation: oaSkel 1.2s infinite; }
  @keyframes oaSkel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

// KPI Strip
const KpiStrip = ({ total, active, inactive, pending }) => {
  const kpis = [
    { label: 'Total Entities', val: total,    color: '#405189', light: '#4051891f', icon: 'ri-building-line' },
    { label: 'Active',         val: active,   color: '#0ab39c', light: '#0ab39c1f', icon: 'ri-checkbox-circle-line' },
    { label: 'Inactive',       val: inactive, color: '#f06548', light: '#f065481f', icon: 'ri-close-circle-line' },
    { label: 'Pending',        val: pending,  color: '#f7b84b', light: '#f7b84b1f', icon: 'ri-time-line' },
  ];
  return (
    <Row className="g-3 mb-3">
      {kpis.map(k => (
        <Col key={k.label} xl={3} md={6}>
          <div className="oa-kpi" style={{ background: k.light, borderColor: k.light }}>
            <div className="oa-kpi-icon" style={{ background: k.color }}>
              <i className={k.icon} style={{ color: '#fff' }}></i>
            </div>
            <div>
              <div className="oa-kpi-val">{k.val}</div>
              <div className="oa-kpi-lbl">{k.label}</div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// Action dropdown — mega panel with card grid
const ActionDropdown = ({ entity, officialTypes, onSelect }) => {
  const [open, setOpen]     = useState(false);
  const [pos,  setPos]      = useState({ top: 0, left: 0, bottom: 'auto' });
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const btnRef              = useRef();
  const panelRef            = useRef();
  const searchRef           = useRef();
  const bodyRef             = useRef();

  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setHasMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  };

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const r          = btnRef.current.getBoundingClientRect();
      const panelW     = 480;
      const vw         = document.documentElement.clientWidth;
      const spaceBelow = window.innerHeight - r.bottom;
      let left = r.right - panelW;             // align panel right edge with button right edge
      if (left + panelW > vw - 8) left = vw - panelW - 8;
      if (left < 8) left = 8;
      setPos({
        top:    spaceBelow > 360 ? r.bottom + 6 : 'auto',
        bottom: spaceBelow <= 360 ? window.innerHeight - r.top + 6 : 'auto',
        left,
      });
      setSearch('');
      setTimeout(() => {
        searchRef.current?.focus();
        onBodyScroll();
      }, 60);
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (key) => { setOpen(false); setSearch(''); onSelect(entity, key); };

  const filtered = search.trim()
    ? officialTypes.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : officialTypes;

  return (
    <div className="oa-action-wrap">
      <button ref={btnRef} className={classnames('oa-action-btn', { open })} onClick={toggle}>
        <i className="ri-team-line"></i>
        Officials
        <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`}></i>
      </button>

      {open && createPortal(
        <div ref={panelRef} className="oa-mega"
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}>

          {/* Header */}
          <div className="oa-mega-head">
            <div className="oa-mega-head-title">
              <i className="ri-team-line"></i>
              Select Official Type
            </div>
            <div className="oa-mega-search-wrap">
              <i className="ri-search-line oa-mega-search-icon"></i>
              <input
                ref={searchRef}
                className="oa-mega-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filtered.length === 1) pick(filtered[0].key);
                }}
                placeholder="Quick search…"
              />
            </div>
          </div>

          {/* Card grid */}
          <div className="oa-mega-body-wrap">
            <div ref={bodyRef} className="oa-mega-body" onScroll={onBodyScroll}>
              {filtered.length === 0 ? (
                <div className="oa-mega-empty">
                  <i className="ri-search-line"></i>
                  No match for "{search}"
                </div>
              ) : (
                <div className="oa-mega-grid">
                  {filtered.map(o => (
                    <div
                      key={o.key}
                      className="oa-mega-card"
                      style={{ '--card-color': o.color, '--card-light': o.color + '18' }}
                      onClick={() => pick(o.key)}
                    >
                      <div className="oa-mega-card-icon" style={{ background: o.color + '1f' }}>
                        <i className={o.icon} style={{ color: o.color }}></i>
                      </div>
                      <div className="oa-mega-card-label">{o.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {hasMore && (
              <div className="oa-mega-more-hint"
                onClick={() => bodyRef.current?.scrollBy({ top: 120, behavior: 'smooth' })}>
                <i className="ri-arrow-down-s-line"></i> more
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => { if (!d) return null; return new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }); };

const AVATAR_GRAD = ['#6b7fc8','#2dcbb0','#f5876b','#f5c560','#4db5e8','#8a7fd8','#ee6ba5'];
const avatarGradient = (name = '') => {
  const i = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return `linear-gradient(135deg, ${AVATAR_COLORS[i]} 0%, ${AVATAR_GRAD[i % AVATAR_GRAD.length]} 100%)`;
};

const STATUS_META = {
  ACTIVE:   { label: 'Active',   cls: 'active'   },
  INACTIVE: { label: 'Inactive', cls: 'inactive' },
  PENDING:  { label: 'Pending',  cls: 'pending'  },
};

const fmtAddress = (a) => {
  if (!a) return null;
  const parts = [];
  const street = [a.block_no, a.street_name].filter(Boolean).join(' ');
  if (street) parts.push(street);
  if (a.level_no || a.unit_no) parts.push(`#${[a.level_no, a.unit_no].filter(Boolean).join('-')}`);
  if (a.building_name) parts.push(a.building_name);
  if (a.postal_code) parts.push((a.country || 'Singapore') + ' ' + a.postal_code);
  return parts.join(', ') || null;
};

// ── Single official card ──────────────────────────────────────────────────────
const OfficialCard = ({ rec, slug, entity, officialTypes, navigate, onDeleted }) => {
  const name      = rec.official_entity?.name || '—';
  const clientNo  = rec.official_entity?.client_no || '';
  const mainDate  = (rec.date_records || []).find(d => d.is_main_role === '1');
  const subRoles  = (rec.date_records || []).filter(d => d.is_main_role === '0');
  const ceased    = !!mainDate?.ceased_date;

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${name} from this official record?`)) return;
    try {
      await deleteOfficial(rec.official_id);
      toast.success('Official removed');
      onDeleted(rec.official_id);
    } catch { toast.error('Failed to remove official'); }
  };

  return (
    <div className="oa-official-row">
      <div className="oa-official-main">
        <div className="oa-official-avatar" style={{ background: avatarColor(name) }}>{initials(name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="oa-official-name">{name}</div>
          {clientNo && <div className="oa-official-id">{clientNo}</div>}
          {subRoles.length > 0 && (
            <div className="oa-official-detail">
              {subRoles.map(s => s.official_master_slug).filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <span className="oa-official-badge" style={{
          background: ceased ? 'rgba(240,101,72,.12)' : 'rgba(10,179,156,.12)',
          color:      ceased ? '#f06548' : '#0ab39c',
        }}>{ceased ? 'Ceased' : 'Active'}</span>
      </div>
      <div className="oa-official-foot">
        {mainDate?.appointment_date && (
          <span className="oa-official-date-chip">
            <i className="ri-calendar-check-line"></i>
            Appt: {fmtDate(mainDate.appointment_date)}
          </span>
        )}
        {mainDate?.ceased_date && (
          <span className="oa-official-date-chip" style={{ marginLeft: 8 }}>
            <i className="ri-calendar-close-line"></i>
            Ceased: {fmtDate(mainDate.ceased_date)}
          </span>
        )}
        <div className="oa-official-actions">
          <button className="oa-btn-edit"
            onClick={() => navigate(`/officials/${slug}/edit/${rec.official_id}`, { state: { entity, officialTypes } })}>
            <i className="ri-pencil-line me-1"></i>Edit
          </button>
          <button className="oa-btn-del" onClick={handleDelete}>
            <i className="ri-delete-bin-line me-1"></i>Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Officials list for one tab ────────────────────────────────────────────────
const OfficialsList = ({ list, slug, entity, officialTypes, navigate, onDeleted, loading }) => {
  if (loading) return <div className="oa-empty"><Spinner size="sm" /><p style={{ marginTop: 8 }}>Loading…</p></div>;
  if (list.length === 0) return (
    <div className="oa-empty">
      <i className="ri-user-search-line"></i>
      <p>No officials on record.</p>
    </div>
  );
  return list.map(rec => (
    <OfficialCard key={rec.official_id}
      rec={rec} slug={slug} entity={entity}
      officialTypes={officialTypes} navigate={navigate} onDeleted={onDeleted} />
  ));
};

// ── Drawer ────────────────────────────────────────────────────────────────────
const OfficialsDrawer = ({ entity, activeType, officialTypes, onClose }) => {
  const [tab,     setTab]     = useState(activeType);
  const [lists,   setLists]   = useState({});   // { [official_master_id]: [] }
  const [loading, setLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => { setTab(activeType); }, [activeType]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fetch officials for a given official_master_id
  const fetchForType = useCallback(async (ot) => {
    if (!ot?.id) return;
    setLoading(l => ({ ...l, [ot.id]: true }));
    try {
      const res  = await getOfficialList({ entity_id: entity.id, official_master_id: ot.id, limit: 100 });
      const data = res?.data?.data || res?.data || [];
      setLists(l => ({ ...l, [ot.id]: Array.isArray(data) ? data : [] }));
    } catch {
      setLists(l => ({ ...l, [ot.id]: [] }));
    } finally {
      setLoading(l => ({ ...l, [ot.id]: false }));
    }
  }, [entity.id]);

  // Fetch on tab change
  useEffect(() => {
    if (tab === 'all') {
      officialTypes.forEach(ot => fetchForType(ot));
    } else {
      const ot = officialTypes.find(o => o.key === tab);
      fetchForType(ot);
    }
  }, [tab]); // eslint-disable-line

  const currentOT  = tab === 'all' ? null : officialTypes.find(o => o.key === tab);
  const currentSlug = tab === 'all' ? 'all' : tab;

  const handleDeleted = (officialId) => {
    setLists(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => {
        updated[k] = prev[k].filter(r => r.official_id !== officialId);
      });
      return updated;
    });
  };

  return (
    <>
      <div className="oa-backdrop" onClick={onClose} />
      <div className="oa-drawer">
        {/* Header */}
        <div className="oa-drawer-head">
          <div className="d-flex align-items-start justify-content-between gap-2">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="d-flex align-items-center gap-8 mb-1">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: avatarColor(entity.companyName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginRight: 8 }}>
                  {initials(entity.companyName)}
                </div>
                <p className="oa-drawer-title">{entity.companyName}</p>
              </div>
              <div className="oa-drawer-sub">
                {entity.clientNo} {entity.regNo ? `· ${entity.regNo}` : ''}
                <span className={`oa-status oa-status-${entity.status.toLowerCase()} ms-2`}>{entity.status}</span>
              </div>
            </div>
            <button className="oa-drawer-close" onClick={onClose}><i className="ri-close-line"></i></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="oa-dtabs">
          <div className={classnames('oa-dtab', { active: tab === 'all' })} onClick={() => setTab('all')}>
            <i className="ri-apps-line"></i> All
          </div>
          {officialTypes.map(o => {
            const cnt = lists[o.id]?.length ?? 0;
            return (
              <div key={o.key}
                className={classnames('oa-dtab', { active: tab === o.key })}
                onClick={() => setTab(o.key)}>
                <i className={o.icon} style={{ color: tab === o.key ? o.color : undefined }}></i>
                {o.label}
                <span className="oa-dtab-cnt">{cnt}</span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="oa-drawer-body">
          {tab === 'all' ? (
            officialTypes.map(o => (
              <div key={o.key}>
                <div className="oa-section-label">
                  <i className={o.icon} style={{ color: o.color }}></i>
                  {o.label}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: o.light, color: o.color }}>
                    {lists[o.id]?.length ?? 0}
                  </span>
                </div>
                <OfficialsList
                  list={lists[o.id] || []} slug={o.key}
                  entity={entity} officialTypes={officialTypes}
                  navigate={navigate} onDeleted={handleDeleted}
                  loading={!!loading[o.id]} />
              </div>
            ))
          ) : (
            <OfficialsList
              list={lists[currentOT?.id] || []} slug={currentSlug}
              entity={entity} officialTypes={officialTypes}
              navigate={navigate} onDeleted={handleDeleted}
              loading={!!loading[currentOT?.id]} />
          )}
        </div>

        {/* Footer */}
        <div className="oa-drawer-foot">
          <Button size="sm" style={{ background: '#405189', borderColor: '#405189', width: '100%' }}
            className="d-flex align-items-center justify-content-center gap-1"
            onClick={() => navigate(`/officials/${currentSlug}/add`, { state: { entity, officialTypes } })}>
            <i className="ri-add-line"></i>
            Add {tab === 'all' ? 'Official' : currentOT?.label}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Rich view ─────────────────────────────────────────────────────────────────
const RichSkeleton = () => (
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
          {[...Array(4)].map((__, j) => (
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
);

const RichView = ({ rows, idx0, officialTypes, navigate }) => (
  <div className="il-rich-list">
    {rows.map((row, idx) => {
      const sm      = STATUS_META[row.status] || { label: row.status, cls: 'pending' };
      const risk    = row.company_detail?.risk_assessment_rating;
      const country = row.company_detail?.country;
      const coType  = row.company_detail?.company_type_name || row.company_type?.company_type_name;
      const uen     = row.identifications?.[0]?.uen_no;
      const addrRec = (row.addresses || []).find(a => a.is_primary)
                   || (row.addresses || []).find(a => a.address_type === 'REGISTERED')
                   || (row.addresses || [])[0];
      const address = fmtAddress(addrRec);
      const mapped  = {
        id: row.entity_id, clientNo: row.client_no || '—',
        regNo: uen || '', companyName: row.name || '—',
        status: row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase() : '—',
        officials: {},
      };
      return (
        <div key={row.entity_id} className={`il-rich-card ${sm.cls}`}>
          <div className="il-rich-top">
            <div className="il-rich-top-row">
              <span className="il-rich-serial">{idx0 + idx + 1}</span>

              <div className="il-rich-avatar" style={{ background: avatarGradient(row.name || '') }}>
                {initials(row.name || '')}
              </div>

              <div className="il-rich-body">
                <div className="il-rich-name">{row.name || '—'}</div>
                {row.former_name
                  ? <div className="il-rich-former"><i className="ri-arrow-right-line" />Formerly: {row.former_name}</div>
                  : <div className="il-rich-former" style={{ opacity: .4 }}>No former name</div>}
              </div>

              <div className="il-rich-mid">
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
                <div className="il-rich-mid-item">
                  <span className="il-rich-mid-lbl">UEN / Reg. No.</span>
                  <span className={`il-rich-mid-val${uen ? '' : ' empty'}`}>{uen || 'Not provided'}</span>
                </div>
                <div className="il-rich-mid-item">
                  <span className="il-rich-mid-lbl">Client No.</span>
                  <span className={`il-rich-mid-val${row.client_no ? '' : ' empty'}`}>{row.client_no || 'Not provided'}</span>
                </div>
                <div className="il-rich-mid-item">
                  <span className="il-rich-mid-lbl">Country</span>
                  <span className={`il-rich-mid-val${country ? '' : ' empty'}`}>{country || '—'}</span>
                </div>
                <div className="il-rich-mid-item">
                  <span className="il-rich-mid-lbl">Company Type</span>
                  <span className={`il-rich-mid-val${coType ? '' : ' empty'}`}>{coType || '—'}</span>
                </div>
              </div>

              <div className="il-rich-right">
                <span className={`il-badge ${sm.cls}`}>{sm.label}</span>
                {risk ? renderRisk(row) : <span style={{ fontSize: 10.5, color: '#ced4da' }}>No risk data</span>}
              </div>
            </div>

            <div className="il-rich-foot">
              <span className="il-rich-foot-date">
                <i className="ri-calendar-check-line" />
                Added {fmtDate(row.created_date)}
              </span>
              <div style={{ marginLeft: 'auto' }}>
                <ActionDropdown
                  entity={mapped}
                  officialTypes={officialTypes.filter(o => o.isShow)}
                  onSelect={(entity, type) =>
                    navigate(`/officials/${type}/list`, { state: { entity, officialTypes } })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ── Card grid view ────────────────────────────────────────────────────────────
const CardGridView = ({ rows, officialTypes, navigate }) => (
  <div className="il-card-grid" style={{ padding: '16px' }}>
    {rows.map(row => {
      const sm     = STATUS_META[row.status] || { label: row.status, cls: 'pending' };
      const barClr = sm.cls === 'active' ? '#0ab39c' : sm.cls === 'inactive' ? '#f06548' : '#f0b232';
      const uen    = row.identifications?.[0]?.uen_no;
      const mapped = {
        id: row.entity_id, clientNo: row.client_no || '—',
        regNo: uen || '', companyName: row.name || '—',
        status: row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase() : '—',
        officials: {},
      };
      return (
        <div key={row.entity_id} className="il-card">
          <div style={{ height: 4, background: barClr, borderRadius: '10px 10px 0 0' }} />
          <div className="il-card-top">
            <div className="il-card-avatar" style={{ background: avatarColor(row.name || '') }}>
              {initials(row.name || '')}
            </div>
            <div className="il-card-name">{row.name || '—'}</div>
            <div className="il-card-client">{uen || row.client_no || 'No UEN'}</div>
            <div className="mt-2"><span className={`il-badge ${sm.cls}`}>{sm.label}</span></div>
          </div>
          <div className="il-card-body">
            {row.company_detail?.country && (
              <div className="il-card-row">
                <span className="il-card-row-label"><i className="ri-global-line me-1"></i>Country</span>
                <span>{row.company_detail.country}</span>
              </div>
            )}
            {row.company_detail?.risk_assessment_rating && (
              <div className="il-card-row">
                <span className="il-card-row-label"><i className="ri-shield-line me-1"></i>Risk</span>
                {renderRisk(row)}
              </div>
            )}
            <div className="il-card-row">
              <span className="il-card-row-label"><i className="ri-calendar-check-line me-1"></i>Added</span>
              <span>{fmtDate(row.created_date)}</span>
            </div>
          </div>
          <div className="il-card-footer" style={{ justifyContent: 'center' }}>
            <ActionDropdown
              entity={mapped}
              officialTypes={officialTypes.filter(o => o.isShow)}
              onSelect={(entity, type) =>
                navigate(`/officials/${type}/list`, { state: { entity, officialTypes } })
              }
            />
          </div>
        </div>
      );
    })}
  </div>
);

// Skeleton rows
const SkeletonRows = ({ cols }) => (
  <>
    {[...Array(6)].map((_, i) => (
      <tr key={i} className="oa-skeleton">
        {[...Array(cols)].map((__, j) => (
          <td key={j}><div className="oa-skeleton-line" style={{ width: j === 1 ? 200 : 80 }}></div></td>
        ))}
      </tr>
    ))}
  </>
);

// Main page
const Officials = () => {
  useCollapseSidebar();
  const navigate       = useNavigate();
  const globalPageSize = useSelector(selectDefaultPageSize);

  const [rows,          setRows]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [everLoaded,    setEverLoaded]    = useState(false);
  const [officialTypes, setOfficialTypes] = useState([]);

  const [search,      setSearch]      = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied,     setApplied]     = useState({ search: '', ...BLANK_SIDE });
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [viewMode,    setViewMode]    = useState('rich');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(globalPageSize);

  useEffect(() => { setPageSize(globalPageSize); setCurrentPage(1); }, [globalPageSize]);

  const setSideFilter = (k, v) => setSideFilters(f => ({ ...f, [k]: v }));

  const applyFilters = () => { setApplied({ search, ...sideFilters }); setCurrentPage(1); };
  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search: '', ...BLANK_SIDE });
    setCurrentPage(1);
  };

  const removeChip = (k) => {
    if (k === 'search') {
      setSearch('');
      setApplied(a => ({ ...a, search: '' }));
    } else {
      setSideFilters(f => ({ ...f, [k]: '' }));
      setApplied(a => ({ ...a, [k]: '' }));
    }
    setCurrentPage(1);
  };

  const activeChips      = Object.entries(applied).filter(([, v]) => v && v !== '');
  const sideActiveCount  = Object.entries(applied).filter(([k, v]) => k !== 'search' && v).length;

  // Fetch official master list — only top-level roles (is_parent = 0)
  useEffect(() => {
    getOfficialMasterList({ page: 1, limit: 200, is_parent: 0, order: 'official_order:ASC' })
      .then(res => {
        const data = res?.data?.data || res?.data || [];
        setOfficialTypes(mapOfficialMaster(data));
      })
      .catch(() => setOfficialTypes([]));
  }, []);

  // Fetch entity (company) list
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: pageSize, sort: 'created_date', order: 'DESC' };
      if (applied.search) params.search = applied.search;
      if (applied.status) params.status = applied.status.toUpperCase();

      const res  = await getCompanyList(params);
      const data = res?.data ?? res;
      setRows(data?.data ?? []);
      setTotal(data?.totalItems ?? 0);
      setEverLoaded(true);
    } catch {
      setRows([]);
      toast.error('Failed to load entity list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, applied]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const kpi = useMemo(() => ({
    total,
    active:   rows.filter(r => r.status === 'ACTIVE').length,
    inactive: rows.filter(r => r.status === 'INACTIVE').length,
    pending:  rows.filter(r => r.status === 'PENDING').length,
  }), [rows, total]);

  // Map API row to the shape the drawer/table expects
  const mapRow = (row) => ({
    id:          row.entity_id,
    clientNo:    row.client_no   || '—',
    regNo:       row.identifications?.[0]?.uen_no || '',
    companyName: row.name        || '—',
    status:      row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase() : '—',
    officials:   {},
  });

  document.title = 'Entity Officials | ASR CSS';

  return (
    <div className="page-content">
      <style>{styles}</style>
      <Container fluid>
        <BreadCrumb title="List of Entity Officials" pageTitle="Officials" />

        <KpiStrip
          total={kpi.total}
          active={kpi.active}
          inactive={kpi.inactive}
          pending={kpi.pending}
        />

        {/* Table Card */}
        <Card>
          {/* ── Toolbar ── */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

            {/* Quick search */}
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: 13, pointerEvents: 'none' }}></i>
              <Input bsSize="sm" style={{ paddingLeft: 28 }} placeholder="Search name, UEN, client no…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()} />
            </div>

            <Button size="sm" onClick={applyFilters}
              style={{ background: '#405189', borderColor: '#405189' }}
              className="d-flex align-items-center gap-1">
              <i className="ri-search-line" /> Search
            </Button>

            {/* Advanced filter toggle */}
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
              {loading && everLoaded && (
                <Spinner size="sm" color="primary" style={{ width: 14, height: 14, borderWidth: 2 }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(64,81,137,.1)', color: '#405189', borderRadius: 10, padding: '2px 8px' }}>
                {total} {total === 1 ? 'entity' : 'entities'}
              </span>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 11, fontWeight: 600, color: '#405189', background: 'rgba(64,81,137,.08)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                  {viewMode === 'table' ? 'Normal View' : viewMode === 'rich' ? 'Rich View' : 'Grid View'}
                </span>
                <div className="btn-group" role="group">
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode === 'table' ? 'btn-success' : 'btn-outline-success')}
                    title="Normal view" onClick={() => setViewMode('table')}>
                    <i className="ri-list-unordered"></i>
                  </button>
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode === 'rich' ? 'btn-success' : 'btn-outline-success')}
                    title="Rich view" onClick={() => setViewMode('rich')}>
                    <i className="ri-file-list-3-line"></i>
                  </button>
                  <button type="button"
                    className={classnames('btn btn-sm', viewMode === 'card' ? 'btn-success' : 'btn-outline-success')}
                    title="Grid view" onClick={() => setViewMode('card')}>
                    <i className="ri-grid-fill"></i>
                  </button>
                </div>
              </div>
              <Button size="sm" color="light" className="d-flex align-items-center gap-1">
                <i className="ri-download-2-line"></i> Export
              </Button>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {activeChips.length > 0 && (
            <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#878a99' }}>Active:</span>
              {activeChips.map(([k, v]) => (
                <span key={k} className="oa-filter-chip">
                  <span style={{ color: '#878a99', marginRight: 2 }}>{FILTER_LABELS[k] || k}:</span> {v}
                  <button onClick={() => removeChip(k)}><i className="ri-close-line"></i></button>
                </span>
              ))}
            </div>
          )}

          <CardBody className="p-0">

            {/* ── Normal (table) view ── */}
            {viewMode === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table oa-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 46 }}>S/No.</th>
                      <th>Company Name</th>
                      <th>UEN / Reg. No.</th>
                      <th>Risk</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: 160 }}>Officials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !everLoaded ? (
                      <SkeletonRows cols={6} />
                    ) : rows.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted fs-13">
                          <i className="ri-inbox-line d-block mb-1" style={{ fontSize: 28, opacity: 0.3 }}></i>
                          No entities match the current filters.
                        </td>
                      </tr>
                    ) : rows.map((row, idx) => {
                      const mapped = mapRow(row);
                      return (
                        <tr key={row.entity_id} className={`status-${mapped.status.toLowerCase()}`}>
                          <td style={{ color: '#878a99', fontSize: 12 }}>
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td>
                            <div className="oa-co-cell">
                              <div className="oa-co-avatar" style={{ background: avatarColor(mapped.companyName) }}>
                                {initials(mapped.companyName)}
                              </div>
                              <div>
                                <div className="oa-co-name">{mapped.companyName}</div>
                                <div className="oa-co-no">{mapped.regNo}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{mapped.regNo || '—'}</td>
                          <td>{renderRisk(row)}</td>
                          <td>
                            <span className={`oa-status oa-status-${mapped.status.toLowerCase()}`}>
                              {mapped.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <ActionDropdown
                              entity={mapped}
                              officialTypes={officialTypes.filter(o => o.isShow)}
                              onSelect={(entity, type) =>
                                navigate(`/officials/${type}/list`, { state: { entity, officialTypes } })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Rich view ── */}
            {viewMode === 'rich' && (
              loading && !everLoaded ? <RichSkeleton /> : rows.length === 0 && !loading ? (
                <div className="text-center py-4 text-muted fs-13">
                  <i className="ri-inbox-line d-block mb-1" style={{ fontSize: 28, opacity: 0.3 }}></i>
                  No entities match the current filters.
                </div>
              ) : (
                <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.18s', pointerEvents: loading ? 'none' : 'auto' }}>
                  <RichView
                    rows={rows}
                    idx0={(currentPage - 1) * pageSize}
                    officialTypes={officialTypes}
                    navigate={navigate}
                  />
                </div>
              )
            )}

            {/* ── Card / Grid view ── */}
            {viewMode === 'card' && (
              loading && !everLoaded ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                  <Spinner color="primary" />
                </div>
              ) : rows.length === 0 && !loading ? (
                <div className="text-center py-4 text-muted fs-13">
                  <i className="ri-inbox-line d-block mb-1" style={{ fontSize: 28, opacity: 0.3 }}></i>
                  No entities match the current filters.
                </div>
              ) : (
                <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.18s', pointerEvents: loading ? 'none' : 'auto' }}>
                  <CardGridView
                    rows={rows}
                    officialTypes={officialTypes}
                    navigate={navigate}
                  />
                </div>
              )
            )}

            {total > 0 && (
              <div style={{ padding: '8px 16px', borderTop: '1px solid var(--vz-border-color)' }}>
                <Pagination
                  total={total}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                />
              </div>
            )}
          </CardBody>
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

    </div>
  );
};

export default Officials;
