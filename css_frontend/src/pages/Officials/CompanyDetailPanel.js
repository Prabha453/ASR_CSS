import React from 'react';
import { Row, Col } from 'reactstrap';
import './IndividualDetailPanel.css';

const AVATAR_COLORS = ['#405189', '#0ab39c', '#6559cc', '#f7b84b', '#299cdb', '#f06548'];
const avatarColor   = (n = '') => AVATAR_COLORS[(n.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials      = (n = '') => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const ADDR_LABEL = {
  RESIDENTIAL: 'Residential', LOCAL: 'Local', MAILING: 'Mailing',
  BUSINESS: 'Business', FOREIGN: 'Foreign', REGISTERED: 'Registered', OTHER: 'Other',
};
const CONTACT_ICON = {
  MOBILE: 'ri-smartphone-line', OFFICE: 'ri-phone-line', EMAIL: 'ri-mail-line',
  FAX: 'ri-printer-line', HOME: 'ri-home-2-line',
};

const Field = ({ label, value, mono }) => (
  <div className="iqe-field">
    <div className="iqe-flabel">{label}</div>
    <div className={`iqe-fval${mono ? ' iqe-fval-mono' : ''}`}>{value || '—'}</div>
  </div>
);

const SectionBox = ({ icon, title, color = '#405189', children }) => (
  <div className="iqe-box" style={{ borderTop: `3px solid ${color}` }}>
    <div className="iqe-box-head" style={{ background: color + '12' }}>
      <span className="iqe-box-icon" style={{ background: color + '25', color }}>
        <i className={icon}></i>
      </span>
      <span className="iqe-box-title" style={{ color }}>{title}</span>
    </div>
    <div className="iqe-box-body">{children}</div>
  </div>
);

const CompanyDetailPanel = ({ detail, onClear, onSwap, swapLabel, compact = false }) => {
  const d     = detail || {};
  const ident = (d.identifications || [])[0] || {};
  const name  = d.name || 'Company';
  const sts   = d.status || '';

  const addresses = d.addresses || [];
  const contacts  = d.contacts  || [];

  return (
    <div className="iqe-panel">

      {/* ── Profile header ── */}
      <div className="iqe-head">
        <div className="iqe-head-left" style={{ background: avatarColor(name) }}>
          <div className="iqe-av">{initials(name)}</div>
        </div>
        <div className="iqe-head-right">
          <div className="iqe-head-info">
            <div className="iqe-head-name">{name}</div>
            {d.client_no && <div className="iqe-head-sub">{d.client_no}</div>}
          </div>
          <div className="iqe-head-acts">
            {sts && <span className={`iqe-sts iqe-sts-${sts}`}>{sts.charAt(0) + sts.slice(1).toLowerCase()}</span>}
            {onSwap && (
              <button className="iqe-btn-chg"
                style={{ color: avatarColor(name), borderColor: avatarColor(name) }}
                onClick={onSwap}>
                <i className="ri-refresh-line" style={{ fontSize: 12 }}></i>
                {swapLabel || 'Change'}
              </button>
            )}
            {onClear && (
              <button className="iqe-close-btn" onClick={onClear} title="Remove">
                <i className="ri-close-circle-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section boxes (horizontal) ── */}
      <div className="iqe-boxes">

        <SectionBox icon="ri-building-line" title="Basic Information" color="#405189">
          <Row className="g-2">
            <Col xs={6}><Field label="Company Name" value={d.name} /></Col>
            <Col xs={6}><Field label="Former Name"  value={d.former_name} /></Col>
            <Col xs={6}><Field label="Reg. Type"    value={d.company_reg_type} /></Col>
            <Col xs={6}><Field label="Status"       value={d.status} /></Col>
          </Row>
        </SectionBox>

        <SectionBox icon="ri-file-list-3-line" title="Identification Numbers" color="#6559cc">
          <Row className="g-2">
            <Col xs={6}><Field label="UEN No."           value={ident.uen_no}       mono /></Col>
            <Col xs={6}><Field label="FBRN Reg. No."     value={ident.fbrn_reg_no}  mono /></Col>
            <Col xs={6}><Field label="UF No."            value={ident.uf_no}        mono /></Col>
            <Col xs={6}><Field label="Domestic Bus. No." value={ident.domes_bus_no} mono /></Col>
            <Col xs={6}><Field label="ACRA No."          value={ident.acra_no}      mono /></Col>
          </Row>
        </SectionBox>

        {!compact && (
          <SectionBox icon="ri-map-pin-line" title="Addresses" color="#0ab39c">
            {addresses.length === 0 ? (
              <span className="iqe-empty">No addresses on record.</span>
            ) : addresses.map((addr, i) => {
              const label = ADDR_LABEL[addr.address_type] || addr.address_type || 'Address';
              const full  = addr.full_address
                || [addr.block_no, addr.street_name, addr.unit_no, addr.building_name, addr.postal_code].filter(Boolean).join(', ');
              return (
                <div key={i} className="iqe-addr-row">
                  <span className="iqe-addr-lbl">{label}</span>
                  <span className="iqe-addr-val">{full || '—'}</span>
                </div>
              );
            })}
          </SectionBox>
        )}

        {!compact && (
          <SectionBox icon="ri-contacts-line" title="Contacts" color="#299cdb">
            {contacts.length === 0 ? (
              <span className="iqe-empty">No contacts on record.</span>
            ) : (
              <div className="iqe-contacts">
                {contacts.map((c, i) => (
                  <span key={i} className="iqe-contact-chip">
                    <i className={CONTACT_ICON[c.contact_type] || 'ri-global-line'}></i>
                    <span>{c.contact_value || '—'}</span>
                    <span className="iqe-contact-type">({c.contact_type})</span>
                  </span>
                ))}
              </div>
            )}
          </SectionBox>
        )}

      </div>

    </div>
  );
};

export default CompanyDetailPanel;
