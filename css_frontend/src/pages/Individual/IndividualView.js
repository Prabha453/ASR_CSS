import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Button,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getIndividual, deleteIndividual } from '../../helpers/backend_helper';
import { FilePreviewModal } from '../../pages/Company/components/FilePreviewModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['var(--vz-primary)','var(--vz-success)','var(--vz-danger)','var(--vz-warning)','var(--vz-info)','var(--vz-purple)','var(--vz-pink)','var(--vz-teal)','var(--vz-orange)','var(--vz-secondary)'];
const avatarColor   = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials      = (name = '') => name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const fmtDate       = (d) => { if (!d) return null; return new Date(d).toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' }); };
const calcAge       = (dob) => { if (!dob) return null; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365.25)); };

const STATUS_STYLE = {
  ACTIVE:   { label:'Active',   var:'success'  },
  INACTIVE: { label:'Inactive', var:'danger'   },
  PENDING:  { label:'Pending',  var:'warning'  },
};
const RISK_STYLE = {
  LOW:       { label:'Low Risk',  var:'success', icon:'ri-shield-check-line'  },
  MEDIUM:    { label:'Med Risk',  var:'warning', icon:'ri-shield-line'         },
  HIGH:      { label:'High Risk', var:'danger',  icon:'ri-shield-flash-line'   },
  VERY_HIGH: { label:'Very High', var:'danger',  icon:'ri-shield-star-line'    },
};
const GENDER_LABEL  = { MALE:'Male', FEMALE:'Female', OTHER:'Non-Binary', PREFER_NOT_TO_SAY:'Prefer not to say' };
const ADDR_LABEL    = { CONTACT:'Contact', RESIDENTIAL:'Residential', FOREIGN:'Foreign', REGISTERED:'Registered', BUSINESS:'Business', MAILING:'Mailing' };

const ROLE_VAR_CYCLE = ['primary','success','warning','info','purple','danger','teal','pink','orange','secondary'];

// ── Label → icon map (drives the icon shown next to each InfoRow field) ────────
const LABEL_ICON_MAP = {
  'Full Name':        'ri-user-3-line',
  'Former Name':      'ri-user-unfollow-line',
  'Alias':            'ri-user-star-line',
  'Client No.':       'ri-hashtag',
  'Date of Birth':    'ri-cake-2-line',
  'Age':               'ri-time-line',
  'Gender':            'ri-genderless-line',
  'Nationality':       'ri-flag-2-line',
  'Country of Birth':  'ri-earth-line',
  'Occupation':        'ri-briefcase-4-line',
  'Employer':          'ri-building-line',
  'Tax ID':            'ri-bank-card-2-line',
  'Preferred Mode':    'ri-chat-check-line',
  'Registered':        'ri-calendar-check-line',
  'Father':            'ri-men-line',
  'Mother':            'ri-women-line',
  'Spouse':            'ri-heart-3-line',
  'Email':             'ri-mail-line',
  'Alt. Email':        'ri-mail-open-line',
  'Mobile':            'ri-smartphone-line',
  'Office':            'ri-phone-line',
  'Skype':             'ri-skype-line',
  'ID Number':         'ri-file-list-3-line',
  'Issued Country':    'ri-flag-2-line',
  'Issue Date':        'ri-calendar-event-line',
  'Expiry Date':       'ri-calendar-close-line',
  'House/Block No.':   'ri-home-4-line',
  'Street':            'ri-road-map-line',
  'Building':          'ri-building-2-line',
  'Level No.':         'ri-stack-line',
  'Unit No.':          'ri-door-open-line',
  'City':              'ri-community-line',
  'State':             'ri-map-2-line',
  'Postal Code':       'ri-navigation-line',
  'Country':           'ri-earth-line',
  'Mobile No.':        'ri-smartphone-line',
  'Telephone No.':     'ri-phone-line',
  'Office No.':        'ri-phone-fill',
};
const getInfoIcon = (label = '') => LABEL_ICON_MAP[label] || 'ri-checkbox-blank-circle-fill';

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, varColor = 'primary' }) => value ? (
  <div style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:8 }}>
    <div style={{
      width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1,
      background:`rgba(var(--vz-${varColor}-rgb),.12)`, color:`var(--vz-${varColor})`,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
    }}>
      <i className={getInfoIcon(label)}></i>
    </div>
    <span style={{ fontSize:11, color:'var(--vz-gray-600)', minWidth:100, flexShrink:0, paddingTop:2 }}>{label}</span>
    <span style={{ fontSize:12, color:'var(--vz-body-color)', fontWeight:600, lineHeight:1.45 }}>{value}</span>
  </div>
) : null;

const SectionHead = ({ icon, title, count, varColor = 'primary' }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <div style={{ width:28, height:28, borderRadius:7, background:`rgba(var(--vz-${varColor}-rgb),.15)`, color:`var(--vz-${varColor})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
      <i className={icon}></i>
    </div>
    <span className="fw-semibold" style={{ fontSize:13, color:'var(--vz-body-color)' }}>{title}</span>
    {count != null && (
      <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`rgba(var(--vz-${varColor}-rgb),.12)`, color:`var(--vz-${varColor})` }}>{count}</span>
    )}
  </div>
);

const DetailCard = ({ children, className = 'mb-3', varColor = 'primary' }) => (
  <Card className={className} style={{ borderRadius:8, border:'1px solid var(--vz-border-color)', borderTop:`3px solid var(--vz-${varColor})`, boxShadow:'0 1px 2px rgba(15,23,42,.04)' }}>
    <CardBody style={{ padding:'16px 18px' }}>
      {children}
    </CardBody>
  </Card>
);

const DateBlock = ({ label, value, varColor }) => (
  <div>
    <div style={{ fontSize:10, color:'var(--vz-gray-600)', fontWeight:700, marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:12, fontWeight:600, color:value && value !== '—' ? 'var(--vz-body-color)' : 'var(--vz-gray-500)', display:'inline-flex', alignItems:'center', gap:5, background:value && value !== '—' ? `rgba(var(--vz-${varColor}-rgb),.08)` : 'transparent', padding:value && value !== '—' ? '3px 8px' : 0, borderRadius:6 }}>
      {value && value !== '—' && <i className="ri-calendar-event-line" style={{ color:`var(--vz-${varColor})` }}></i>}
      {value || '-'}
    </div>
  </div>
);

const Empty = ({ icon, text }) => (
  <div className="text-center py-5 text-muted">
    <i className={icon} style={{ fontSize:38, opacity:.2, display:'block', marginBottom:8 }}></i>
    <p className="fs-13 mb-0">{text}</p>
  </div>
);

const roleGroupEntries = (roles = {}) => {
  if (Array.isArray(roles)) {
    return Object.entries(roles.reduce((acc, role) => {
      const key = role.role_name || role.official_master_slug || 'Others';
      if (!acc[key]) acc[key] = [];
      acc[key].push(role);
      return acc;
    }, {}));
  }

  if (roles && typeof roles === 'object') {
    return Object.entries(roles).map(([roleName, records]) => [
      roleName,
      Array.isArray(records) ? records : [],
    ]);
  }

  return [];
};

const roleGroupCount = (roles = {}) => roleGroupEntries(roles)
  .reduce((total, [, records]) => total + records.length, 0);

const roleText = (roles) => {
  if (roles && typeof roles === 'object' && !Array.isArray(roles)) {
    return Object.keys(roles).filter(Boolean).join(', ');
  }

  if (Array.isArray(roles)) {
    return roles
      .map(role => role?.role_name || role?.official_master_slug || role)
      .filter(Boolean)
      .join(', ');
  }

  return String(roles || '').trim();
};

const contactRoleSource = (contact = {}) => {
  const groups = contact.official_role_groups;
  if (groups && typeof groups === 'object' && !Array.isArray(groups) && Object.keys(groups).length) {
    return groups;
  }

  return contact.official_roles;
};

const groupContactsByCompany = (contacts = []) => {
  return contacts.reduce((acc, c) => {
    const key = c.company_name || c.entity_id || 'Unknown Company';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
};

const StatusPill = ({ status, varColor }) => {
  if (!status) return null;
  const isProposed = String(status).toLowerCase() === 'proposed';
  return (
    <span style={{
      fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:20, marginRight:6,
      background: isProposed ? 'rgba(var(--vz-warning-rgb),.15)' : `rgba(var(--vz-${varColor}-rgb),.15)`,
      color: isProposed ? 'var(--vz-warning)' : `var(--vz-${varColor})`,
    }}>
      {status}
    </span>
  );
};

const groupSubRolesByName = (subRoleDates = []) => {
  if (subRoleDates && typeof subRoleDates === 'object' && !Array.isArray(subRoleDates)) {
    return Object.entries(subRoleDates).reduce((acc, [name, rows]) => {
      acc[name] = Array.isArray(rows) ? rows : [];
      return acc;
    }, {});
  }

  return subRoleDates.reduce((acc, d) => {
    const key = d.sub_role_name || d.official_master_slug || 'Sub-role';
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
};

const SubRoleSection = ({ subRoleDates = [], varColor }) => {
  const grouped = groupSubRolesByName(subRoleDates);
  if (!Object.keys(grouped).length) return null;

  return (
    <div style={{ marginTop: 8, paddingLeft: 38 }}>
      {Object.entries(grouped).map(([subRoleName, rows], i) => (
        <div key={subRoleName + i} style={{
          marginBottom: 6, padding: '8px 10px',
          background: `rgba(var(--vz-${varColor}-rgb),.04)`,
          borderLeft: `2px solid var(--vz-${varColor})`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: `var(--vz-${varColor})`, marginBottom: 4, display:'flex', alignItems:'center', gap:5 }}>
            <i className="ri-corner-down-right-line" style={{ fontSize: 11 }}></i>
            {subRoleName}
            {rows.length > 1 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#878a99', background: 'rgba(135,138,153,.12)', padding: '1px 6px', borderRadius: 20 }}>
                {rows.length} records
              </span>
            )}
          </div>
          {rows
            .slice()
            .sort((a, b) => (a.appointment_date || '').localeCompare(b.appointment_date || ''))
            .map((d, ri) => (
              <div key={d.official_date_id ?? ri} style={{ display: 'flex', gap: 16, fontSize: 11, marginBottom: ri < rows.length - 1 ? 4 : 0 }}>
                <div style={{ flex: 1 }}>
                  <StatusPill status={d.appointment_status} varColor={varColor} />
                  <span style={{ color: 'var(--vz-body-color)', fontWeight: 600 }}>
                    {fmtDate(d.appointment_date) || '—'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <StatusPill status={d.cessation_status} varColor="danger" />
                  <span style={{ color: d.ceased_date ? 'var(--vz-body-color)' : 'var(--vz-gray-500)', fontWeight: 600 }}>
                    {fmtDate(d.ceased_date) || '—'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

const AppointmentCard = ({ official, varColor, compact = false }) => {
  const dates        = official.dates || [];
  const mainDates    = dates.filter(d => String(d.is_main_role) === '1');
  const subRoleDates = official.sub_roles || dates.filter(d => String(d.is_main_role) !== '1');
  const main         = mainDates[0] || official || {};

  return (
    <div style={{
      border: '1px solid var(--vz-border-color)',
      borderRadius: 8,
      padding: compact ? '12px 14px' : '16px 18px',
      height: '100%',
      background: 'var(--vz-card-bg)',
    }}>
      <div className="d-flex align-items-start gap-2 mb-2">
        <div style={{
          width: compact ? 28 : 34, height: compact ? 28 : 34, borderRadius: 8, flexShrink:0,
          background:`rgba(var(--vz-${varColor}-rgb),.10)`, color:`var(--vz-${varColor})`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize: compact ? 14 : 16,
        }}>
          <i className="ri-building-4-line"></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fw-semibold" style={{ fontSize: compact ? 12 : 14 }}>{official.company_name || '-'}</div>
          {official.shareholder_property_type && (
            <small className="text-muted">{official.shareholder_property_type}</small>
          )}
          {official.source_from && (
            <div style={{ fontSize:9, color:'var(--vz-gray-500)', marginTop:2 }}>
              <i className="ri-pulse-line me-1"></i>{official.source_from}
            </div>
          )}
        </div>
        <span className={`badge ${official.is_current ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize:10, padding:'5px 9px', flexShrink:0 }}>
          {official.is_current ? 'Active' : 'Ceased'}
        </span>
      </div>

      <Row className="g-2">
        <Col xs={6}>
          <div style={{ fontSize:10, color:'var(--vz-gray-600)', fontWeight:700, marginBottom:3 }}>
            <StatusPill status={main.appointment_status} varColor={varColor} />
          </div>
          <DateBlock label="Appointment" value={fmtDate(main.appointment_date) || '—'} varColor={varColor} />
        </Col>
        <Col xs={6}>
          <div style={{ fontSize:10, color:'var(--vz-gray-600)', fontWeight:700, marginBottom:3 }}>
            <StatusPill status={main.cessation_status} varColor="danger" />
          </div>
          <DateBlock label="Cessation" value={fmtDate(main.ceased_date) || '—'} varColor={varColor} />
        </Col>
      </Row>

      <SubRoleSection subRoleDates={subRoleDates} varColor={varColor} />

      {(dates.some(d => d.remarks) || official.remarks) && (
        <div className="mt-2" style={{ fontSize:11, color:'var(--vz-gray-600)' }}>
          {official.remarks && <div><i className="ri-sticky-note-line me-1"></i>{official.remarks}</div>}
          {dates.filter(d => d.remarks && d.remarks !== official.remarks).map((r, i) => (
            <div key={i}><i className="ri-sticky-note-line me-1"></i>{r.remarks}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const RoleHistoryPanels = ({ roles = {} }) => {
  const entries = roleGroupEntries(roles);

  if (!entries.length) {
    return (
      <DetailCard varColor="purple">
        <Empty icon="ri-history-line" text="No appointment history recorded." />
      </DetailCard>
    );
  }

  return entries.map(([roleName, officialsInRole], groupIndex) => {
    const v = ROLE_VAR_CYCLE[groupIndex % ROLE_VAR_CYCLE.length];
    const totalAppointments = officialsInRole.length;

    return (
      <Card className="mb-3" key={roleName} style={{ borderRadius:8, border:'1px solid var(--vz-border-color)', borderLeft:`4px solid var(--vz-${v})`, boxShadow:'0 2px 8px rgba(15,23,42,.04)' }}>
        <CardBody style={{ padding:'14px 16px' }}>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <div style={{ width:34, height:34, borderRadius:8, background:`rgba(var(--vz-${v}-rgb),.15)`, color:`var(--vz-${v})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              <i className="ri-briefcase-4-line"></i>
            </div>
            <div>
              <div className="fw-semibold" style={{ fontSize:13, color:'var(--vz-body-color)' }}>{roleName}</div>
              <div className="text-muted" style={{ fontSize:11 }}>{totalAppointments} company appointment{totalAppointments > 1 ? 's' : ''}</div>
            </div>
            <span className="ms-auto" style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:`rgba(var(--vz-${v}-rgb),.12)`, color:`var(--vz-${v})` }}>
              {totalAppointments}
            </span>
          </div>

          {/* ── Always show as a 2-column grid of compact cards, whether there's 1 or many appointments. ── */}
          <Row className="g-3">
            {officialsInRole.map((official, oi) => (
              <Col xs={12} lg={6} key={official.official_id ?? oi}>
                <AppointmentCard official={official} varColor={v} compact />
              </Col>
            ))}
          </Row>
        </CardBody>
      </Card>
    );
  });
};

const IdDocumentFile = ({ doc, varColor, onPreview }) => {
  const fileName = doc.file_name || '';
  const ext      = fileName.split('.').pop().toLowerCase();
  const isImage  = ['png','jpg','jpeg','gif','webp'].includes(ext);

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!doc.file_path) return;
    const a = document.createElement('a');
    a.href = doc.file_path;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
      borderRadius:6, border:'1px solid var(--vz-border-color)',
      background:'var(--vz-light)', marginBottom:6,
    }}>
      <div style={{
        width:32, height:32, borderRadius:6, flexShrink:0,
        background:`rgba(var(--vz-${varColor}-rgb),.1)`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <i className={isImage ? 'ri-image-line' : 'ri-file-line'} style={{ fontSize:16, color:`var(--vz-${varColor})` }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {fileName || 'File'}
        </div>
        <div style={{ fontSize:10, color:'#adb5bd' }}>{ext.toUpperCase()}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
        {isImage && doc.file_path && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onPreview(doc); }} title="Preview"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--vz-primary)', fontSize:15, padding:'4px 5px', borderRadius:4 }}>
            <i className="ri-eye-line" />
          </button>
        )}
        {doc.file_path && (
          <button type="button" onClick={handleDownload} title="Download"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--vz-success)', fontSize:15, padding:'4px 5px', borderRadius:4 }}>
            <i className="ri-download-line" />
          </button>
        )}
      </div>
    </div>
  );
};

const IdDocumentsTab = ({ identifications = [], onPreview }) => {
  if (!identifications.length) {
    return <Card><CardBody><Empty icon="ri-id-card-line" text="No identification documents recorded." /></CardBody></Card>;
  }
  return (
    <Row className="g-3">
      {identifications.map((doc, i) => {
        const v = ROLE_VAR_CYCLE[i % ROLE_VAR_CYCLE.length];
        const idTypeLabel = doc.id_type?.id_name || doc.id_type_name || 'Identification Document';
        return (
          <Col key={doc.identification_id ?? i} md={6} xxl={6}>
            <Card className="mb-0 h-100" style={{ borderRadius:8, borderTop:`3px solid var(--vz-${v})` }}>
              <div style={{ padding:'10px 14px', background:`rgba(var(--vz-${v}-rgb),.06)`, borderBottom:'1px solid var(--vz-border-color)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`var(--vz-${v})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                  <i className="ri-file-text-fill"></i>
                </div>
                <span className="fw-semibold" style={{ fontSize:12 }}>{idTypeLabel}</span>
                {doc.is_primary === 1 || doc.is_primary === true ? (
                  <span className="badge bg-success-subtle text-success ms-auto" style={{ fontSize:10 }}>Primary</span>
                ) : null}
              </div>
              <CardBody style={{ padding:'12px 14px' }}>
                <InfoRow label="ID Number"      value={doc.id_number} varColor={v} />
                <InfoRow label="Issued Country" value={doc.id_issued_country} varColor={v} />
                <InfoRow label="Issue Date"     value={fmtDate(doc.id_issued_date)} varColor={v} />
                <InfoRow label="Expiry Date"    value={fmtDate(doc.id_expired_date)} varColor={v} />

                {(doc.scan_docs || []).length > 0 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--vz-gray-600)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
                      Attached Files
                    </div>
                    {doc.scan_docs.map((f, fi) => (
                      <IdDocumentFile key={f.doc_id ?? fi} doc={f} varColor={v} onPreview={onPreview} />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

const AddressesTab = ({ addresses = [], onPreview }) => {
  if (!addresses.length) {
    return <Card><CardBody><Empty icon="ri-map-pin-2-line" text="No addresses recorded." /></CardBody></Card>;
  }
  return (
    <Row className="g-3">
      {addresses.map((addr, i) => {
        const v = ROLE_VAR_CYCLE[(i + 2) % ROLE_VAR_CYCLE.length];
        return (
          <Col key={addr.address_id ?? i} md={6} xxl={6}>
            <Card className="mb-0 h-100" style={{ borderRadius:8, borderTop:`3px solid var(--vz-${v})` }}>
              <div style={{ padding:'10px 14px', background:`rgba(var(--vz-${v}-rgb),.06)`, borderBottom:'1px solid var(--vz-border-color)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`var(--vz-${v})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                  <i className="ri-map-pin-fill"></i>
                </div>
                <span className="fw-semibold" style={{ fontSize:12 }}>{ADDR_LABEL[addr.address_type] || addr.address_type} Address</span>
                {addr.is_primary === 1 || addr.is_primary === true ? (
                  <span className="badge bg-primary-subtle text-primary ms-auto" style={{ fontSize:10 }}><i className="ri-home-4-fill me-1"></i>Default</span>
                ) : null}
              </div>
              <CardBody style={{ padding:'12px 14px' }}>
                <InfoRow label="House/Block No." value={addr.block_no} varColor={v} />
                <InfoRow label="Street"          value={addr.street_name} varColor={v} />
                <InfoRow label="Building"        value={addr.building_name} varColor={v} />
                <InfoRow label="Level No."       value={addr.level_no} varColor={v} />
                <InfoRow label="Unit No."        value={addr.unit_no} varColor={v} />
                <InfoRow label="City"            value={addr.city} varColor={v} />
                <InfoRow label="State"           value={addr.state} varColor={v} />
                <InfoRow label="Postal Code"     value={addr.postal_code} varColor={v} />
                <InfoRow label="Country"         value={addr.country} varColor={v} />

                {(addr.proof_docs || []).length > 0 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--vz-gray-600)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
                      Proof of Address
                    </div>
                    {addr.proof_docs.map((f, fi) => (
                      <IdDocumentFile key={f.doc_id ?? fi} doc={f} varColor={v} onPreview={onPreview} />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

const CompanyContactPanels = ({ contacts = [] }) => {
  if (!contacts.length) {
    return (
      <Card><CardBody><Empty icon="ri-contacts-book-line" text="No company contact details recorded." /></CardBody></Card>
    );
  }

  const grouped = groupContactsByCompany(contacts);

  return (
    <Row className="g-3">
      {Object.entries(grouped).map(([companyName, companyContacts], gi) => {
        const v = ROLE_VAR_CYCLE[gi % ROLE_VAR_CYCLE.length];
        return (
          <Col key={companyName} md={6} xxl={6}>
            <Card className="mb-0 h-100" style={{ borderRadius:8, borderTop:`3px solid var(--vz-${v})` }}>
              <div style={{ padding:'10px 14px', background:`rgba(var(--vz-${v}-rgb),.06)`, borderBottom:'1px solid var(--vz-border-color)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`var(--vz-${v})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                  <i className="ri-building-4-line"></i>
                </div>
                <span className="fw-semibold" style={{ fontSize:12 }}>{companyName}</span>
                <span className="ms-auto" style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`rgba(var(--vz-${v}-rgb),.15)`, color:`var(--vz-${v})` }}>
                  {companyContacts.length}
                </span>
              </div>
              <CardBody style={{ padding:'14px' }}>
                {companyContacts.map((c, ci) => (
                  <div key={c.contact_id ?? ci} style={{
                    paddingBottom: ci < companyContacts.length - 1 ? 12 : 0,
                    marginBottom: ci < companyContacts.length - 1 ? 12 : 0,
                    borderBottom: ci < companyContacts.length - 1 ? '1px dashed var(--vz-border-color)' : 'none',
                  }}>
                    {roleText(contactRoleSource(c)) && (
                      <div style={{ fontSize:10, fontWeight:700, color:`var(--vz-${v})`, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
                        {roleText(contactRoleSource(c))}
                      </div>
                    )}
                    <InfoRow label="Email"           value={c.email} varColor={v} />
                    <InfoRow label="Mobile No."      value={c.mobile ? `${c.mobile_code || ''} ${c.mobile}` : null} varColor={v} />
                    <InfoRow label="Telephone No."   value={c.telephone ? `${c.telephone_code || ''} ${c.telephone}` : null} varColor={v} />
                    <InfoRow label="Office No."      value={c.office ? `${c.office_code || ''} ${c.office}${c.ext_no ? ' x' + c.ext_no : ''}` : null} varColor={v} />
                    {!c.email && !c.mobile && !c.telephone && !c.office && (
                      <p className="text-muted mb-0" style={{ fontSize:11 }}>No contact details on file.</p>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const IndividualView = () => {
  useCollapseSidebar();
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [delModal, setDelModal]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  document.title = 'View Individual | ASR CSS';

  useEffect(() => {
    (async () => {
      try {
        const res = await getIndividual(id);
        setData(res?.data?.data ?? res?.data ?? res);
      } catch {
        toast.error('Failed to load individual');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteIndividual(id);
      toast.success('Individual deleted');
      navigate('/individuals');
    } catch {
      toast.error('Failed to delete individual');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight:300 }}>
      <Spinner color="primary" />
    </div>
  );

  if (!data) return (
    <div className="page-content">
      <Container fluid>
        <div className="text-center py-5">
          <i className="ri-user-unfollow-line" style={{ fontSize:48, color:'var(--vz-primary)', opacity:.3 }}></i>
          <p className="mt-2 text-muted">Individual not found.</p>
          <Link to="/individuals" className="btn btn-primary btn-sm">Back to List</Link>
        </div>
      </Container>
    </div>
  );

  const detail = data.individual_detail || {};
  const ss     = STATUS_STYLE[data.status] || STATUS_STYLE.PENDING;
  const rs     = RISK_STYLE[detail.member_assessment_rating];
  const age    = calcAge(detail.member_dob);

  const companyContacts = data.official_company_contacts || [];

  const primaryEmail  = (data.contacts || []).find(c => c.contact_type === 'EMAIL'  && (c.is_primary === 1 || c.is_primary === true));
  const primaryMobile = (data.contacts || []).find(c => c.contact_type === 'MOBILE' && (c.is_primary === 1 || c.is_primary === true));
  const primaryOffice = (data.contacts || []).find(c => c.contact_type === 'OFFICE' && (c.is_primary === 1 || c.is_primary === true));

  const TABS = [
    { id:'overview', label:'Appointment History', icon:'ri-history-line', count:roleGroupCount(data.official_roles || {}) },
    { id:'id',       label:'ID Documents',     icon:'ri-id-card-line',       count:(data.identifications||[]).length },
    { id:'address',  label:'Addresses',        icon:'ri-map-pin-2-line',     count:(data.addresses||[]).length       },
    { id:'contact',  label:'Contacts',         icon:'ri-phone-line',         count:(data.contacts||[]).length        },
    { id:'company',  label:'Company Contacts', icon:'ri-contacts-book-line', count:companyContacts.length            },
    { id:'relation', label:'Relationships',    icon:'ri-team-line',          count:(data.relationships||[]).length   },
  ];

  return (
    <div className="page-content">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--vz-border-color); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--vz-gray-500); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--vz-border-color) transparent; }
      `}</style>
      <Container fluid>

        {/* ── Breadcrumb ── */}
        <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-sm-0" style={{ fontSize:16 }}>Individual Profile</h4>
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="#">Entity</Link></li>
            <li className="breadcrumb-item"><Link to="/individuals">Individuals</Link></li>
            <li className="breadcrumb-item active">Profile</li>
          </ol>
        </div>

        <Row className="g-3">

          {/* ══════════════ LEFT — Name/status header + Personal Info + Contact Info ══════════════ */}
          <Col xxl={4} lg={5}>
            <div
              className="custom-scrollbar"
              style={{
                position:'sticky',
                top:16,
                maxHeight:'calc(100vh - 32px)',
                overflowY:'auto',
                overflowX:'hidden',
                paddingBottom:4,
              }}
            >

              {/* ── Identity header ── */}
              <Card className="mb-3" style={{ borderRadius:12, overflow:'hidden', border:'1px solid var(--vz-border-color)' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--vz-primary) 0%, var(--vz-purple) 55%, var(--vz-info) 100%)',
                  padding:'20px 20px 36px', position:'relative', overflow:'hidden',
                }}>
                  <div style={{ position:'absolute', right:-40, top:-40, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,.07)' }} />
                  <div style={{ position:'absolute', left:-30, bottom:-50, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.05)' }} />
                  <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:48, height:48, borderRadius:10, flexShrink:0,
                      background:'rgba(255,255,255,.18)', color:'#fff', fontSize:17, fontWeight:800,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      border:'1.5px solid rgba(255,255,255,.5)',
                    }}>
                      {initials(data.name)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
                        {data.name}
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <span style={{ padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,.22)', color:'#fff' }}>
                          {ss.label}
                        </span>
                        {rs && (
                          <span style={{ padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,.18)', color:'#fff', display:'flex', alignItems:'center', gap:3 }}>
                            <i className={rs.icon} style={{ fontSize:10 }}></i>{rs.label}
                          </span>
                        )}
                        {detail.is_pep === 1 && (
                          <span style={{ padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(var(--vz-danger-rgb),.6)', color:'#fff' }}>
                            <i className="ri-alert-line me-1"></i>PEP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat strip */}
                <div style={{ margin:'-22px 14px 0', background:'var(--vz-card-bg)', borderRadius:10, boxShadow:'0 4px 14px rgba(15,23,42,.08)', border:'1px solid var(--vz-border-color)', position:'relative', display:'flex' }}>
                  {[
                    { label:'ID Docs',   value:(data.identifications||[]).length, varColor:'primary' },
                    { label:'Address',   value:(data.addresses||[]).length,       varColor:'success' },
                    { label:'Contacts',  value:(data.contacts||[]).length,        varColor:'warning' },
                    { label:'Relations', value:(data.relationships||[]).length,   varColor:'info'    },
                  ].map((s, i) => (
                    <div key={s.label} style={{ flex:1, textAlign:'center', padding:'9px 4px', borderRight: i < 3 ? '1px solid var(--vz-border-color)' : 'none' }}>
                      <div style={{ fontSize:15, fontWeight:800, color:`var(--vz-${s.varColor})`, lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:9, color:'var(--vz-gray-600)', marginTop:3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <CardBody style={{ padding:'14px 18px 16px' }}>
                  <div className="d-flex gap-2">
                    <Link to="/individuals" className="btn btn-light btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" style={{ fontSize:11 }}>
                      <i className="ri-arrow-left-line"></i> Back
                    </Link>
                    <Link to={`/individual/edit/${id}`} className="btn btn-warning btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" style={{ fontSize:11 }}>
                      <i className="ri-pencil-line"></i> Edit
                    </Link>
                    <button className="btn btn-soft-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" style={{ fontSize:11 }} onClick={() => setDelModal(true)}>
                      <i className="ri-delete-bin-line"></i> Delete
                    </button>
                  </div>
                </CardBody>
              </Card>

              {/* ── Personal Information ── */}
              <DetailCard varColor="info">
                <SectionHead icon="ri-user-3-line" title="Personal Information" varColor="info" />
                <InfoRow label="Full Name"      value={data.name} varColor="info" />
                <InfoRow label="Former Name"    value={detail.former_name} varColor="info" />
                <InfoRow label="Alias"          value={detail.member_alias_name} varColor="info" />
                <InfoRow label="Client No."     value={data.client_no} varColor="info" />
                <InfoRow label="Date of Birth"  value={fmtDate(detail.member_dob)} varColor="info" />
                {age != null && <InfoRow label="Age" value={`${age} yrs`} varColor="info" />}
                <InfoRow label="Gender"         value={GENDER_LABEL[detail.member_gender]} varColor="info" />
                <InfoRow label="Nationality"    value={detail.member_nationality} varColor="info" />
                <InfoRow label="Country of Birth" value={detail.country_of_birth} varColor="info" />
                <InfoRow label="Occupation"     value={detail.occupation} varColor="info" />
                <InfoRow label="Employer"       value={detail.employer_name} varColor="info" />
                <InfoRow label="Tax ID"         value={detail.tax_id} varColor="info" />
                <InfoRow label="Preferred Mode" value={detail.preferred_contact_mode} varColor="info" />
                <InfoRow label="Registered"     value={fmtDate(data.created_date)} varColor="info" />

                {(detail.father_name || detail.mother_name || detail.spouse_name) && (
                  <>
                    <div style={{ borderTop:'1px dashed var(--vz-border-color)', margin:'10px 0' }} />
                    <InfoRow label="Father"  value={detail.father_name} varColor="info" />
                    <InfoRow label="Mother"  value={detail.mother_name} varColor="info" />
                    <InfoRow label="Spouse"  value={detail.spouse_name} varColor="info" />
                  </>
                )}

                {detail.additional_notes && (
                  <>
                    <div style={{ borderTop:'1px dashed var(--vz-border-color)', margin:'10px 0' }} />
                    <div style={{ fontSize:10, color:'var(--vz-gray-600)', fontWeight:700, marginBottom:4 }}>Notes</div>
                    <p className="text-muted mb-0" style={{ fontSize:12, lineHeight:1.7 }}>{detail.additional_notes}</p>
                  </>
                )}
              </DetailCard>

              {/* ── Contact Info — primary only ── */}
              <DetailCard varColor="success" className="mb-0">
                <SectionHead icon="ri-contacts-line" title="Contact Info" varColor="success" />
                <InfoRow label="Email"      value={primaryEmail?.contact_value} varColor="success" />
                <InfoRow label="Mobile"     value={primaryMobile?.contact_value ? `${primaryMobile.phone_country_code || ''} ${primaryMobile.contact_value}` : null} varColor="success" />
                <InfoRow label="Office"     value={primaryOffice?.contact_value} varColor="success" />
                <InfoRow label="Alt. Email" value={detail.alternate_email} varColor="success" />
                <InfoRow label="Skype"      value={detail.skype_id} varColor="success" />
                {!primaryEmail && !primaryMobile && !primaryOffice && !detail.alternate_email && !detail.skype_id && (
                  <p className="text-muted mb-0" style={{ fontSize:11 }}>No primary contact on file.</p>
                )}
              </DetailCard>

              {(data.tags||[]).length > 0 && (
                <DetailCard className="mt-3 mb-0" varColor="warning">
                  <SectionHead icon="ri-price-tag-3-line" title="Tags" varColor="warning" />
                  <div className="d-flex flex-wrap gap-2">
                    {data.tags.map((t,i) => (
                      <span key={i} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: t.tag_info?.tag_color ? `${t.tag_info.tag_color}22` : 'rgba(var(--vz-primary-rgb),.1)', color: t.tag_info?.tag_color || 'var(--vz-primary)' }}>
                        {t.tag_info?.tag_name || `Tag ${t.tag_id}`}
                      </span>
                    ))}
                  </div>
                </DetailCard>
              )}
            </div>
          </Col>

          {/* ══════════════ RIGHT — Tabs + content ══════════════ */}
          <Col xxl={8} lg={7}>

            <Card className="mb-3" style={{ borderRadius:10 }}>
              <Nav tabs style={{ borderBottom:'1px solid var(--vz-border-color)', margin:0, padding:'0 10px' }}>
                {TABS.map(t => (
                  <NavItem key={t.id}>
                    <NavLink
                      className={classnames({ active: activeTab === t.id })}
                      onClick={() => setActiveTab(t.id)}
                      style={{ cursor:'pointer', padding:'12px 14px', display:'flex', alignItems:'center', gap:5, fontSize:12, whiteSpace:'nowrap' }}>
                      <i className={t.icon} style={{ fontSize:13 }}></i>
                      <span>{t.label}</span>
                      {t.count > 0 && (
                        <span className={classnames('badge rounded-pill', activeTab === t.id ? 'bg-primary' : 'bg-light text-muted')}
                          style={{ fontSize:9, padding:'2px 6px' }}>
                          {t.count}
                        </span>
                      )}
                    </NavLink>
                  </NavItem>
                ))}
              </Nav>
            </Card>

            <div
              className="custom-scrollbar"
              style={{
                maxHeight:'calc(100vh - 32px)',
                overflowY:'auto',
                overflowX:'hidden',
                paddingRight:4,
              }}
            >
              <TabContent activeTab={activeTab}>

                <TabPane tabId="overview">
                  <RoleHistoryPanels roles={data.official_roles || {}} />
                </TabPane>

                <TabPane tabId="id">
                  <IdDocumentsTab identifications={data.identifications || []} onPreview={setPreviewFile} />
                </TabPane>

                <TabPane tabId="address">
                  <AddressesTab addresses={data.addresses || []} onPreview={setPreviewFile} />
                </TabPane>

                <TabPane tabId="contact">
                  {(data.contacts||[]).length === 0
                    ? <Card><CardBody><Empty icon="ri-phone-line" text="No contact details recorded." /></CardBody></Card>
                    : <Row className="g-3">
                        {(data.contacts||[]).map((c, i) => {
                          const CONTACT_ICON = { MOBILE:'ri-smartphone-line', OFFICE:'ri-phone-line', FAX:'ri-printer-line', EMAIL:'ri-mail-line', HOME:'ri-home-2-line' };
                          const CONTACT_VAR  = { MOBILE:'primary', OFFICE:'success', FAX:'secondary', EMAIL:'warning', HOME:'info' };
                          const ic  = CONTACT_ICON[c.contact_type]  || 'ri-phone-line';
                          const v   = CONTACT_VAR[c.contact_type]   || 'primary';
                          const val = c.contact_value || '—';
                          return (
                            <Col key={i} sm={6} xl={4}>
                              <Card className="mb-0 h-100">
                                <CardBody style={{ padding:'14px 16px' }}>
                                  <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div style={{ width:38, height:38, borderRadius:10, background:`rgba(var(--vz-${v}-rgb),.15)`, color:`var(--vz-${v})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
                                      <i className={ic}></i>
                                    </div>
                                    {(c.is_primary===1 || c.is_primary===true) && <span className="badge bg-success-subtle text-success" style={{ fontSize:10 }}>Primary</span>}
                                  </div>
                                  <p className="text-uppercase mb-1 text-muted" style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em' }}>{c.contact_type}</p>
                                  <h6 className="mb-0" style={{ fontSize:13 }}>{val}</h6>
                                </CardBody>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                  }
                </TabPane>

                <TabPane tabId="company">
                  <CompanyContactPanels contacts={companyContacts} />
                </TabPane>

                <TabPane tabId="relation">
                  {(data.relationships||[]).length === 0
                    ? <Card><CardBody><Empty icon="ri-team-line" text="No relationships recorded." /></CardBody></Card>
                    : <Row className="g-3">
                        {(data.relationships||[]).map((r, i) => {
                          const v = ROLE_VAR_CYCLE[(i + 6) % ROLE_VAR_CYCLE.length];
                          return (
                          <Col key={i} sm={6} xl={4}>
                            <Card className="mb-0 h-100" style={{ borderRadius:8, borderTop:`3px solid var(--vz-${v})` }}>
                              <CardBody style={{ padding:'14px 16px' }}>
                                <div style={{ width:38, height:38, borderRadius:10, background:`rgba(var(--vz-${v}-rgb),.15)`, color:`var(--vz-${v})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, marginBottom:10 }}>
                                  <i className="ri-user-heart-line"></i>
                                </div>
                                <p className="text-uppercase mb-1 text-muted" style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em' }}>{r.relationship_type}</p>
                                <h6 className="mb-0" style={{ fontSize:13 }}>{r.related_name || '—'}</h6>
                              </CardBody>
                            </Card>
                          </Col>
                          );
                        })}
                      </Row>
                  }
                </TabPane>

              </TabContent>
            </div>
          </Col>
        </Row>

      </Container>

      {/* Delete modal */}
      <Modal isOpen={delModal} toggle={() => setDelModal(false)} centered size="sm">
        <ModalHeader toggle={() => setDelModal(false)} style={{ border:'none', paddingBottom:0 }} />
        <ModalBody>
          <div className="text-center p-2">
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(var(--vz-danger-rgb),.1)', color:'var(--vz-danger)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px' }}>
              <i className="ri-delete-bin-5-line"></i>
            </div>
            <h5 className="fs-15 fw-semibold mb-2">Delete Individual?</h5>
            <p className="text-muted mb-0" style={{ fontSize:12 }}>
              <strong>{data.name}</strong> will be permanently removed.<br />This cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border:'none', justifyContent:'center', gap:10 }}>
          <Button color="light" size="sm" onClick={() => setDelModal(false)} disabled={deleting}>Cancel</Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting} className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm" /> Deleting…</> : <><i className="ri-delete-bin-line"></i> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};

export default IndividualView;
