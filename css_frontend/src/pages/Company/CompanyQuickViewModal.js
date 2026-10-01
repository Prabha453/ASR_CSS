import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner } from 'reactstrap';
import classnames from 'classnames';
import { getOfficialList, getOfficialMasterList } from '../../helpers/backend_helper';
import './CompanyQuickViewModal.css';

const OT_COLORS = ['#405189','#0ab39c','#6559cc','#f7b84b','#299cdb','#f06548','#e91e63','#20c997','#fd7e14','#6c757d'];
const OT_ICONS  = ['ri-user-star-line','ri-group-line','ri-shield-user-line','ri-file-search-line','ri-briefcase-line','ri-user-line','ri-account-circle-line','ri-team-line','ri-building-line','ri-profile-line'];

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SkelRow = () => (
  <div className="cqv-skel-row">
    <div className="cqv-skel-avatar" />
    <div style={{ flex: 1 }}>
      <div className="cqv-skel-line" style={{ width: '55%', marginBottom: 6 }} />
      <div className="cqv-skel-line" style={{ width: '35%' }} />
    </div>
  </div>
);

const CompanyQuickViewModal = ({ company, onClose }) => {
  const navigate = useNavigate();

  const [mainTab,       setMainTab]       = useState('actions');
  const [subTab,        setSubTab]        = useState('all');
  const [officialTypes, setOfficialTypes] = useState([]);
  const [lists,         setLists]         = useState({});
  const [loading,       setLoading]       = useState({});
  const [typesLoading,  setTypesLoading]  = useState(false);

  const status    = company.status || '';
  const statusCls = status === 'ACTIVE' ? 'active' : status === 'INACTIVE' ? 'inactive' : 'pending';
  const uen       = company.identifications?.[0]?.uen_no || '';

  const entityNav = {
    id:          company.entity_id,
    companyName: company.name,
    clientNo:    company.client_no || '—',
    regNo:       uen,
    status:      status.charAt(0) + status.slice(1).toLowerCase(),
  };

  // Load official types once
  useEffect(() => {
    setTypesLoading(true);
    getOfficialMasterList({ page: 1, limit: 200, is_parent: 0, order: 'official_order:ASC' })
      .then(res => {
        const data = res?.data?.data || res?.data || [];
        setOfficialTypes(
          data.map((item, idx) => {
            const color = OT_COLORS[idx % OT_COLORS.length];
            return {
              id:    item.official_master_id,
              key:   item.official_master_slug,
              label: item.official_master_name,
              icon:  OT_ICONS[idx % OT_ICONS.length],
              color,
              light: color + '1f',
            };
          })
        );
      })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, []);

  const fetchForType = useCallback(async (ot) => {
    if (!ot?.id || lists[ot.id] !== undefined) return;
    setLoading(l => ({ ...l, [ot.id]: true }));
    try {
      const res  = await getOfficialList({ entity_id: company.entity_id, official_master_id: ot.id, limit: 100 });
      const data = res?.data?.data || res?.data || [];
      setLists(l => ({ ...l, [ot.id]: Array.isArray(data) ? data : [] }));
    } catch {
      setLists(l => ({ ...l, [ot.id]: [] }));
    } finally {
      setLoading(l => ({ ...l, [ot.id]: false }));
    }
  }, [company.entity_id, lists]);

  const openOfficials = () => {
    setMainTab('officials');
    officialTypes.forEach(ot => fetchForType(ot));
  };

  const ACTIONS = [
    {
      label: '360 View', desc: 'Full company profile',
      icon: 'ri-building-2-line', color: '#405189', light: 'rgba(64,81,137,.1)',
      go: () => { onClose(); navigate(`/company/view/${company.entity_id}`); },
    },
    {
      label: 'Edit', desc: 'Edit company details',
      icon: 'ri-pencil-line', color: '#f7b84b', light: 'rgba(247,184,75,.1)',
      go: () => { onClose(); navigate(`/company/edit/${company.entity_id}`); },
    },
    {
      label: 'Officials', desc: 'Manage all officials',
      icon: 'ri-team-line', color: '#0ab39c', light: 'rgba(10,179,156,.1)',
      go: () => {
        onClose();
        const s = officialTypes[0]?.key;
        if (s) navigate(`/officials/${s}/list`, { state: { entity: entityNav, officialTypes } });
      },
    },
    {
      label: 'Contacts', desc: 'Contact information',
      icon: 'ri-phone-line', color: '#299cdb', light: 'rgba(41,156,219,.1)',
      go: () => { onClose(); navigate(`/company/view/${company.entity_id}`); },
    },
    {
      label: 'Addresses', desc: 'Office locations',
      icon: 'ri-map-pin-2-line', color: '#6559cc', light: 'rgba(101,89,204,.1)',
      go: () => { onClose(); navigate(`/company/view/${company.entity_id}`); },
    },
    {
      label: 'Corp Sec', desc: 'Corp sec information',
      icon: 'ri-building-4-line', color: '#20c997', light: 'rgba(32,201,151,.1)',
      go: () => { onClose(); navigate(`/company/view/${company.entity_id}`); },
    },
  ];

  const totalOfficials = Object.values(lists).reduce((s, a) => s + a.length, 0);
  const currentOT      = subTab === 'all' ? null : officialTypes.find(o => o.key === subTab);

  const renderOfficialCard = (rec, ot) => {
    const name     = rec.official_entity?.name || '—';
    const clientNo = rec.official_entity?.client_no || '';
    const mainDate = (rec.date_records || []).find(d => d.is_main_role === '1');
    const ceased   = !!mainDate?.ceased_date;
    return (
      <div key={rec.official_id} className="cqv-off-row">
        <div className="cqv-off-main">
          <div className="cqv-off-avatar" style={{ background: ot?.color || '#405189' }}>{initials(name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cqv-off-name">{name}</div>
            {clientNo && <div className="cqv-off-sub">{clientNo}</div>}
          </div>
          <span className="cqv-off-badge" style={{
            background: ceased ? 'rgba(240,101,72,.12)' : 'rgba(10,179,156,.12)',
            color:      ceased ? '#f06548' : '#0ab39c',
          }}>{ceased ? 'Ceased' : 'Active'}</span>
        </div>
        {mainDate?.appointment_date && (
          <div className="cqv-off-foot">
            <span className="cqv-off-date"><i className="ri-calendar-check-line"></i>Appt: {fmtDate(mainDate.appointment_date)}</span>
            {mainDate?.ceased_date && (
              <span className="cqv-off-date" style={{ marginLeft: 8 }}>
                <i className="ri-calendar-close-line"></i>Ceased: {fmtDate(mainDate.ceased_date)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (ot) => {
    const isLoading = loading[ot.id];
    const list      = lists[ot.id] || [];
    return (
      <div key={ot.key}>
        <div className="cqv-section-lbl">
          <i className={ot.icon} style={{ color: ot.color }}></i>
          {ot.label}
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: ot.light, color: ot.color }}>
            {isLoading ? '…' : list.length}
          </span>
        </div>
        {isLoading ? (
          <><SkelRow /><SkelRow /></>
        ) : list.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#adb5bd', padding: '4px 0 10px', fontStyle: 'italic' }}>
            No {ot.label.toLowerCase()} on record.
          </div>
        ) : list.map(rec => renderOfficialCard(rec, ot))}
      </div>
    );
  };

  const renderOfficialsBody = () => {
    if (typesLoading) return (
      <div className="cqv-empty">
        <Spinner size="sm" color="primary" />
        <p style={{ marginTop: 10 }}>Loading…</p>
      </div>
    );
    if (subTab === 'all') {
      return officialTypes.length === 0
        ? <div className="cqv-empty"><i className="ri-team-line"></i><p>No official types configured.</p></div>
        : officialTypes.map(o => renderSection(o));
    }
    const isLoading = loading[currentOT?.id];
    const list      = lists[currentOT?.id] || [];
    if (isLoading) return <><SkelRow /><SkelRow /><SkelRow /></>;
    if (list.length === 0) return (
      <div className="cqv-empty">
        <i className="ri-user-search-line"></i>
        <p>No {currentOT?.label?.toLowerCase() || 'officials'} on record.</p>
      </div>
    );
    return list.map(rec => renderOfficialCard(rec, currentOT));
  };

  return (
    <Modal isOpen={true} toggle={onClose} centered size="lg" modalClassName="cqv-modal" scrollable={false}>

      {/* Header */}
      <div className="cqv-head">
        <div className="cqv-head-avatar">{initials(company.name || '')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cqv-head-title">{company.name || '—'}</div>
          <div className="cqv-head-sub">
            {[company.client_no, uen].filter(Boolean).join(' · ')}
            <span className={`il-badge ${statusCls}`} style={{ fontSize: 9, padding: '1px 7px', marginLeft: 8, verticalAlign: 'middle' }}>{status}</span>
          </div>
        </div>
        <button className="cqv-head-close" onClick={onClose}><i className="ri-close-line"></i></button>
      </div>

      {/* Main tabs */}
      <div className="cqv-main-tabs">
        <div className={classnames('cqv-main-tab', { active: mainTab === 'actions' })} onClick={() => setMainTab('actions')}>
          <span className="cqv-main-tab-icon"><i className="ri-flashlight-line"></i></span>
          Quick Actions
        </div>
        <div className={classnames('cqv-main-tab', { active: mainTab === 'officials' })} onClick={openOfficials}>
          <span className="cqv-main-tab-icon"><i className="ri-team-line"></i></span>
          Officials
          {totalOfficials > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'rgba(64,81,137,.12)', color: '#405189', marginLeft: 3 }}>
              {totalOfficials}
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs — Officials only */}
      {mainTab === 'officials' && (
        <div className="cqv-sub-tabs">
          <div className={classnames('cqv-sub-tab', { active: subTab === 'all' })} onClick={() => setSubTab('all')}>
            <i className="ri-apps-line"></i>All
          </div>
          {officialTypes.map(o => (
            <div key={o.key}
              className={classnames('cqv-sub-tab', { active: subTab === o.key })}
              onClick={() => { setSubTab(o.key); fetchForType(o); }}>
              <i className={o.icon} style={{ color: subTab === o.key ? o.color : undefined }}></i>
              {o.label}
              <span className="cqv-sub-tab-cnt">{loading[o.id] ? '…' : (lists[o.id]?.length ?? '?')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="cqv-body">
        {mainTab === 'actions' ? (
          <div className="cqv-action-grid">
            {ACTIONS.map(a => (
              <div key={a.label} className="cqv-action-card"
                style={{ '--ac-color': a.color, '--ac-light': a.light }}
                onClick={a.go}>
                <div className="cqv-action-card-icon" style={{ background: a.light }}>
                  <i className={a.icon} style={{ color: a.color }}></i>
                </div>
                <div className="cqv-action-card-label">{a.label}</div>
                <div className="cqv-action-card-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        ) : renderOfficialsBody()}
      </div>

    </Modal>
  );
};

export default CompanyQuickViewModal;
